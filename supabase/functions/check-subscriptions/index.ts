import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// ── Rate Limiter (60 req/min per IP) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 60;
const RATE_WINDOW_MS = 60_000;

function checkRateLimit(id: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(id);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(id, { count: 1, resetAt: now + RATE_WINDOW_MS });
    return true;
  }
  if (++entry.count > RATE_LIMIT) return false;
  return true;
}

function rateLimited() {
  return new Response(JSON.stringify({ error: "Too many requests" }), {
    status: 429,
    headers: { ...corsHeaders, "Content-Type": "application/json", "Retry-After": "60" },
  });
}

// Period durations in days
const PERIOD_DAYS: Record<string, number> = {
  monthly: 28,
  quarterly: 88,
  yearly: 365,
};

// Weeks per period (for total lesson count)
const PERIOD_WEEKS: Record<string, number> = {
  monthly: 4,
  quarterly: 12,
  yearly: 52,
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(clientIp)) return rateLimited();

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    // ── Auth: require a valid admin JWT ──
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller }, error: userError } = await anonClient.auth.getUser();
    if (userError || !caller) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data: isAdmin } = await createClient(supabaseUrl, serviceRoleKey)
      .rpc("has_role", { _user_id: caller.id, _role: "admin" });

    if (!isAdmin) {
      return new Response(
        JSON.stringify({ error: "Forbidden: admin role required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const now = new Date();
    const todayStr = now.toISOString().split("T")[0];

    // Fetch all active subscriptions
    const { data: activeSubs, error: fetchErr } = await supabase
      .from("subscriptions")
      .select("id, student_id, course_id, teacher_id, price, subscription_type, start_date, renewal_date, weekly_lessons, auto_renew")
      .eq("status", "active");

    if (fetchErr) {
      throw new Error(`Failed to fetch subscriptions: ${fetchErr.message}`);
    }

    if (!activeSubs || activeSubs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No active subscriptions to check", processed: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: {
      subscription_id: string;
      reason?: string;
      action?: string;
      invoice_id?: string;
      error?: string;
    }[] = [];

    for (const sub of activeSubs) {
      try {
        const subType = sub.subscription_type || "monthly";
        const periodDays = PERIOD_DAYS[subType] || 28;
        const periodWeeks = PERIOD_WEEKS[subType] || 4;
        const weeklyLessons = sub.weekly_lessons || 1;
        const totalExpectedLessons = weeklyLessons * periodWeeks;

        // Determine current period start:
        // If renewal_date exists, period started at (renewal_date - periodDays)
        // Otherwise use start_date
        let periodStart: string;
        if (sub.renewal_date) {
          const renewalDate = new Date(sub.renewal_date);
          const pStart = new Date(renewalDate);
          pStart.setDate(pStart.getDate() - periodDays);
          periodStart = pStart.toISOString().split("T")[0];
        } else {
          periodStart = sub.start_date;
        }

        const periodEnd = sub.renewal_date || (() => {
          const d = new Date(sub.start_date);
          d.setDate(d.getDate() + periodDays);
          return d.toISOString().split("T")[0];
        })();

        // ── Condition 1: Check if all subscribed lessons have been attended ──
        // Count timetable entries with status 'ended' for this student+course in current period
        const { count: attendedCount, error: countErr } = await supabase
          .from("timetable_entries")
          .select("id", { count: "exact", head: true })
          .eq("student_id", sub.student_id)
          .eq("course_id", sub.course_id)
          .eq("status", "ended")
          .gte("scheduled_at", periodStart)
          .lte("scheduled_at", periodEnd + "T23:59:59Z");

        if (countErr) {
          console.error(`Count error for sub ${sub.id}:`, countErr.message);
          results.push({ subscription_id: sub.id, error: countErr.message });
          continue;
        }

        const allLessonsAttended = (attendedCount || 0) >= totalExpectedLessons;

        // ── Condition 2: Check if the period has passed ──
        const periodExpired = todayStr >= periodEnd;

        // If neither condition is met, skip
        if (!allLessonsAttended && !periodExpired) {
          continue;
        }

        const reason = allLessonsAttended
          ? `All ${totalExpectedLessons} lessons attended (${attendedCount} completed)`
          : `Period expired (end date: ${periodEnd})`;

        // ── Process subscription end ──
        if (sub.auto_renew) {
          // Auto-renew: generate invoice + advance renewal date

          // Check if invoice already exists for this period
          const { data: existingInvoice } = await supabase
            .from("invoices")
            .select("id")
            .eq("subscription_id", sub.id)
            .gte("created_at", periodStart)
            .limit(1);

          let invoiceId: string | undefined;

          if (!existingInvoice || existingInvoice.length === 0) {
            // Calculate due date for new invoice
            const newPeriodEnd = new Date(periodEnd);
            newPeriodEnd.setDate(newPeriodEnd.getDate() + periodDays);

            const { data: invoice, error: insertErr } = await supabase
              .from("invoices")
              .insert({
                subscription_id: sub.id,
                student_id: sub.student_id,
                course_id: sub.course_id,
                amount: sub.price || 0,
                billing_cycle: subType,
                due_date: newPeriodEnd.toISOString().split("T")[0],
                notes: `Auto-renewal invoice — ${reason}`,
                status: "pending",
              })
              .select("id")
              .single();

            if (insertErr) {
              console.error(`Invoice creation error for sub ${sub.id}:`, insertErr.message);
              results.push({ subscription_id: sub.id, reason, error: insertErr.message });
              continue;
            }
            invoiceId = invoice?.id;
          }

          // Advance renewal_date to next period
          const nextRenewal = new Date(periodEnd);
          nextRenewal.setDate(nextRenewal.getDate() + periodDays);

          await supabase
            .from("subscriptions")
            .update({
              renewal_date: nextRenewal.toISOString().split("T")[0],
              start_date: periodEnd, // Current period end becomes new period start
            })
            .eq("id", sub.id);

          results.push({
            subscription_id: sub.id,
            reason,
            action: "renewed",
            invoice_id: invoiceId,
          });
        } else {
          // No auto-renew: expire the subscription
          await supabase
            .from("subscriptions")
            .update({
              status: "expired",
              renewal_date: periodEnd, // Set end date to period end
            })
            .eq("id", sub.id);

          results.push({
            subscription_id: sub.id,
            reason,
            action: "expired",
          });
        }
      } catch (e) {
        console.error(`Error processing sub ${sub.id}:`, e);
        results.push({ subscription_id: sub.id, error: String(e) });
      }
    }

    const renewed = results.filter((r) => r.action === "renewed").length;
    const expired = results.filter((r) => r.action === "expired").length;
    const errors = results.filter((r) => r.error).length;

    return new Response(
      JSON.stringify({
        message: `Processed: ${renewed} renewed, ${expired} expired, ${errors} errors`,
        renewed,
        expired,
        errors,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-subscriptions error:", err);
    return new Response(
      JSON.stringify({ error: "An internal error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
