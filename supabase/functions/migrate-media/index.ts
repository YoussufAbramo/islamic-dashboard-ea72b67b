import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// ── Rate Limiter (30 req/min per IP) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT = 30;
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

/** Map old bucket → new prefix in 'media' bucket */
const MIGRATION_MAP: Record<string, string> = {
  avatars: "avatars",
  ebooks: "ebooks",
  "course-images": "courses/images",
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

    // Verify caller is admin via JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!);
    const { data: { user }, error: authError } = await anonClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const admin = createClient(supabaseUrl, serviceRoleKey);
    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;
    const targetBucket = body.bucket; // optional: migrate only one bucket

    const results: Record<string, { copied: number; skipped: number; errors: string[] }> = {};

    for (const [oldBucket, newPrefix] of Object.entries(MIGRATION_MAP)) {
      if (targetBucket && targetBucket !== oldBucket) continue;

      results[oldBucket] = { copied: 0, skipped: 0, errors: [] };

      // Recursively list all files in the old bucket
      const filesToMigrate = await listAllFiles(admin, oldBucket, "");

      for (const filePath of filesToMigrate) {
        if (filePath.endsWith(".emptyFolderPlaceholder")) continue;

        const newPath = `${newPrefix}/${filePath}`;

        // Check if file already exists in media bucket
        const { data: existing } = await admin.storage
          .from("media")
          .createSignedUrl(newPath, 10);

        if (existing?.signedUrl) {
          results[oldBucket].skipped++;
          continue;
        }

        if (dryRun) {
          results[oldBucket].copied++;
          continue;
        }

        // Download from old bucket
        const { data: fileData, error: downloadError } = await admin.storage
          .from(oldBucket)
          .download(filePath);

        if (downloadError || !fileData) {
          results[oldBucket].errors.push(`Download failed: ${filePath} — ${downloadError?.message}`);
          continue;
        }

        // Upload to media bucket
        const { error: uploadError } = await admin.storage
          .from("media")
          .upload(newPath, fileData, { cacheControl: "3600", upsert: false });

        if (uploadError) {
          // Duplicate is OK (already exists check may have raced)
          if (uploadError.message?.includes("already exists")) {
            results[oldBucket].skipped++;
          } else {
            results[oldBucket].errors.push(`Upload failed: ${newPath} — ${uploadError.message}`);
          }
        } else {
          results[oldBucket].copied++;
        }
      }
    }

    return new Response(
      JSON.stringify({ success: true, dry_run: dryRun, results }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Migration error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

/** Recursively list all file paths in a bucket/folder */
async function listAllFiles(
  client: ReturnType<typeof createClient>,
  bucket: string,
  folder: string
): Promise<string[]> {
  const paths: string[] = [];
  const { data } = await client.storage.from(bucket).list(folder, { limit: 1000 });

  if (!data) return paths;

  for (const item of data) {
    const fullPath = folder ? `${folder}/${item.name}` : item.name;
    if (item.id === null) {
      // It's a folder — recurse
      const subFiles = await listAllFiles(client, bucket, fullPath);
      paths.push(...subFiles);
    } else {
      paths.push(fullPath);
    }
  }

  return paths;
}
