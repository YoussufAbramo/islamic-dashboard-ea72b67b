import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const today = new Date().toISOString().split("T")[0];

    // Find active subscriptions where renewal_date <= today
    const { data: dueSubs, error: fetchErr } = await supabase
      .from("subscriptions")
      .select("id, student_id, course_id, price, subscription_type, renewal_date, lesson_duration, weekly_lessons")
      .eq("status", "active")
      .not("renewal_date", "is", null)
      .lte("renewal_date", today);

    if (fetchErr) {
      throw new Error(`Failed to fetch subscriptions: ${fetchErr.message}`);
    }

    if (!dueSubs || dueSubs.length === 0) {
      return new Response(
        JSON.stringify({ message: "No subscriptions due for renewal", generated: 0 }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results: { subscription_id: string; invoice_id?: string; error?: string }[] = [];

    for (const sub of dueSubs) {
      try {
        // Check if an invoice was already generated for this renewal period
        const { data: existing } = await supabase
          .from("invoices")
          .select("id")
          .eq("subscription_id", sub.id)
          .gte("created_at", sub.renewal_date)
          .limit(1);

        if (existing && existing.length > 0) {
          results.push({ subscription_id: sub.id, error: "Invoice already exists for this period" });
          continue;
        }

        const amount = sub.price || 0;
        const isYearly = sub.subscription_type === "yearly";
        const dueDate = new Date(sub.renewal_date);
        dueDate.setDate(dueDate.getDate() + (isYearly ? 365 : 30));

        // Create the invoice
        const { data: invoice, error: insertErr } = await supabase
          .from("invoices")
          .insert({
            subscription_id: sub.id,
            student_id: sub.student_id,
            course_id: sub.course_id,
            amount,
            billing_cycle: sub.subscription_type || "monthly",
            due_date: dueDate.toISOString().split("T")[0],
            notes: `Auto-generated invoice for ${isYearly ? "yearly" : "monthly"} renewal`,
            status: "pending",
          })
          .select("id")
          .single();

        if (insertErr) {
          results.push({ subscription_id: sub.id, error: insertErr.message });
          continue;
        }

        // Advance renewal_date to next cycle
        const nextRenewal = new Date(sub.renewal_date);
        if (isYearly) {
          nextRenewal.setFullYear(nextRenewal.getFullYear() + 1);
        } else {
          nextRenewal.setMonth(nextRenewal.getMonth() + 1);
        }

        await supabase
          .from("subscriptions")
          .update({ renewal_date: nextRenewal.toISOString().split("T")[0] })
          .eq("id", sub.id);

        results.push({ subscription_id: sub.id, invoice_id: invoice?.id });
      } catch (e) {
        results.push({ subscription_id: sub.id, error: String(e) });
      }
    }

    const generated = results.filter((r) => r.invoice_id).length;

    return new Response(
      JSON.stringify({ message: `Generated ${generated} invoice(s)`, generated, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: String(err) }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
