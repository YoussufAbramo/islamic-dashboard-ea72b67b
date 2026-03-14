import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ── Rate Limiter (30 req/min per IP) ──
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()
const RATE_LIMIT = 30
const RATE_WINDOW_MS = 60_000

function checkRateLimit(id: string): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(id)
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(id, { count: 1, resetAt: now + RATE_WINDOW_MS })
    return true
  }
  if (++entry.count > RATE_LIMIT) return false
  return true
}

function rateLimited() {
  return new Response(JSON.stringify({ error: 'Too many requests' }), {
    status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' },
  })
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
  if (!checkRateLimit(clientIp)) return rateLimited()

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  const adminClient = createClient(supabaseUrl, serviceRoleKey)

  // Verify caller is admin
  const authHeader = req.headers.get('Authorization')
  if (!authHeader) {
    return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
    global: { headers: { Authorization: authHeader } },
  })
  const { data: { user: caller } } = await callerClient.auth.getUser()
  if (!caller) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
  const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', caller.id).single()
  if (roleData?.role !== 'admin') {
    return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  // Get all student user_ids (exclude caller)
  const { data: studentRoles } = await adminClient
    .from('user_roles')
    .select('user_id')
    .eq('role', 'student')
    .neq('user_id', caller.id)

  if (!studentRoles || studentRoles.length === 0) {
    return new Response(JSON.stringify({ success: true, deleted: 0, message: 'No students found' }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }

  let deleted = 0
  const errors: string[] = []

  for (const { user_id } of studentRoles) {
    try {
      const { error } = await adminClient.auth.admin.deleteUser(user_id)
      if (error) errors.push(`${user_id}: ${error.message}`)
      else deleted++
    } catch (e: any) { errors.push(`${user_id}: ${e.message}`) }
  }

  return new Response(JSON.stringify({ success: true, deleted, total: studentRoles.length, errors }), {
    status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  })
})
