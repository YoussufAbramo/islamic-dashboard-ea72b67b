import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Missing authorization' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })

    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await adminClient.from('user_roles').select('role').eq('user_id', caller.id).single()
    if (roleData?.role !== 'admin') {
      return new Response(JSON.stringify({ error: 'Admin access required' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    const body = await req.json()
    const { action } = body

    if (action === 'update_emails') {
      const updates = body.updates as { old_email: string; new_email: string }[]
      const results = []

      for (const upd of updates) {
        // Find user by old email
        const { data: { users } } = await adminClient.auth.admin.listUsers()
        const targetUser = users.find(u => u.email === upd.old_email)
        if (!targetUser) {
          results.push({ old_email: upd.old_email, status: 'not_found' })
          continue
        }
        // Update email
        const { error } = await adminClient.auth.admin.updateUserById(targetUser.id, { email: upd.new_email })
        if (error) {
          results.push({ old_email: upd.old_email, status: 'error', message: error.message })
        } else {
          // Update profile email too
          await adminClient.from('profiles').update({ email: upd.new_email }).eq('id', targetUser.id)
          results.push({ old_email: upd.old_email, new_email: upd.new_email, status: 'updated' })
        }
      }

      return new Response(JSON.stringify({ success: true, results }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'delete_users') {
      const emails = body.emails as string[]
      const results = []

      const { data: { users } } = await adminClient.auth.admin.listUsers()
      for (const email of emails) {
        const targetUser = users.find(u => u.email === email)
        if (!targetUser) {
          results.push({ email, status: 'not_found' })
          continue
        }
        const { error } = await adminClient.auth.admin.deleteUser(targetUser.id)
        results.push({ email, status: error ? 'error' : 'deleted', message: error?.message })
      }

      return new Response(JSON.stringify({ success: true, results }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'seed_timetable') {
      // Get first student, teacher, course
      const { data: students } = await adminClient.from('students').select('id').limit(1)
      const { data: teachers } = await adminClient.from('teachers').select('id').limit(1)
      const { data: courses } = await adminClient.from('courses').select('id').limit(1)
      
      const studentId = students?.[0]?.id || null
      const teacherId = teachers?.[0]?.id || null
      const courseId = courses?.[0]?.id || null

      const now = new Date()
      const entries = []
      for (let i = 0; i < 5; i++) {
        const d = new Date(now)
        d.setDate(d.getDate() + i - 1) // yesterday through 3 days out
        d.setHours(9 + i, 0, 0, 0)
        entries.push({
          student_id: studentId,
          teacher_id: teacherId,
          course_id: courseId,
          scheduled_at: d.toISOString(),
          duration_minutes: [30, 45, 60, 45, 30][i],
          status: i === 0 ? 'completed' : i === 4 ? 'cancelled' : 'scheduled',
        })
      }

      const { error } = await adminClient.from('timetable_entries').insert(entries)
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ success: true, count: entries.length }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
