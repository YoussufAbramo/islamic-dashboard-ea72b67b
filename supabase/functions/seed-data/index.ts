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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const admin = createClient(supabaseUrl, serviceRoleKey)

    const results: string[] = []

    // 1. Create test student user
    const { data: studentUser, error: studentErr } = await admin.auth.admin.createUser({
      email: 'student@test.com',
      password: 'test123456',
      email_confirm: true,
      user_metadata: { full_name: 'Ahmad Student', phone: '+201000000001' },
    })
    if (studentErr && !studentErr.message.includes('already been registered')) {
      results.push(`Student create error: ${studentErr.message}`)
    } else if (studentUser?.user) {
      results.push(`Student created: ${studentUser.user.id}`)
    }

    // 2. Create test teacher user
    const { data: teacherUser, error: teacherErr } = await admin.auth.admin.createUser({
      email: 'teacher@test.com',
      password: 'test123456',
      email_confirm: true,
      user_metadata: { full_name: 'Fatima Teacher', phone: '+201000000002' },
    })
    if (teacherErr && !teacherErr.message.includes('already been registered')) {
      results.push(`Teacher create error: ${teacherErr.message}`)
    } else if (teacherUser?.user) {
      const teacherId = teacherUser.user.id
      results.push(`Teacher user created: ${teacherId}`)
      // Update role to teacher
      await admin.from('user_roles').update({ role: 'teacher' }).eq('user_id', teacherId)
      // Delete auto-created student record
      await admin.from('students').delete().eq('user_id', teacherId)
      // Create teacher record
      await admin.from('teachers').insert({
        user_id: teacherId,
        specialization: 'Quran Memorization',
        bio: 'Experienced Quran teacher with 10 years of experience.',
      })
      results.push('Teacher role and record created')
    }

    // 3. Create additional test users
    const extraStudents = [
      { email: 'omar@test.com', name: 'Omar Hassan', phone: '+201000000003' },
      { email: 'sara@test.com', name: 'Sara Ali', phone: '+201000000004' },
      { email: 'yusuf@test.com', name: 'Yusuf Ibrahim', phone: '+201000000005' },
    ]
    for (const s of extraStudents) {
      const { error } = await admin.auth.admin.createUser({
        email: s.email,
        password: 'test123456',
        email_confirm: true,
        user_metadata: { full_name: s.name, phone: s.phone },
      })
      if (error && !error.message.includes('already been registered')) {
        results.push(`${s.name} error: ${error.message}`)
      } else {
        results.push(`${s.name} created`)
      }
    }

    // Wait for triggers to complete
    await new Promise(r => setTimeout(r, 2000))

    // 4. Get IDs for seeding
    const { data: students } = await admin.from('students').select('id, user_id').limit(5)
    const { data: teachers } = await admin.from('teachers').select('id, user_id').limit(5)
    const { data: courses } = await admin.from('courses').select('id').limit(5)
    const { data: sections } = await admin.from('course_sections').select('id').limit(5)
    const { data: lessons } = await admin.from('lessons').select('id').limit(5)

    if (!students?.length || !teachers?.length || !courses?.length) {
      return new Response(JSON.stringify({ results, note: 'Not enough base data to seed relations', students: students?.length, teachers: teachers?.length, courses: courses?.length }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // Assign students to teacher
    const teacherRecord = teachers[0]
    for (const s of students.slice(0, 3)) {
      await admin.from('students').update({ assigned_teacher_id: teacherRecord.id }).eq('id', s.id)
    }
    results.push('Students assigned to teacher')

    // 5. Seed subscriptions (5)
    for (let i = 0; i < Math.min(5, students.length); i++) {
      const courseIdx = i % courses.length
      await admin.from('subscriptions').insert({
        student_id: students[i].id,
        course_id: courses[courseIdx].id,
        teacher_id: teacherRecord.id,
        price: [50, 75, 100, 60, 80][i],
        subscription_type: i % 2 === 0 ? 'monthly' : 'yearly',
        status: i < 4 ? 'active' : 'expired',
        start_date: new Date(2026, 0, 1 + i).toISOString().split('T')[0],
        renewal_date: new Date(2026, i % 2 === 0 ? 1 : 12, 1 + i).toISOString().split('T')[0],
      })
    }
    results.push('Subscriptions seeded')

    // 6. Seed timetable entries (5)
    const now = new Date()
    for (let i = 0; i < 5; i++) {
      const date = new Date(now)
      date.setDate(date.getDate() + i)
      date.setHours(10 + i, 0, 0, 0)
      await admin.from('timetable_entries').insert({
        student_id: students[i % students.length].id,
        teacher_id: teacherRecord.id,
        course_id: courses[i % courses.length].id,
        lesson_id: lessons?.length ? lessons[i % lessons.length].id : null,
        scheduled_at: date.toISOString(),
        duration_minutes: [30, 45, 60, 45, 30][i],
        status: ['scheduled', 'scheduled', 'completed', 'scheduled', 'cancelled'][i],
      })
    }
    results.push('Timetable entries seeded')

    // 7. Seed attendance (5)
    const { data: timetableEntries } = await admin.from('timetable_entries').select('id').limit(5)
    if (timetableEntries?.length) {
      for (let i = 0; i < Math.min(5, timetableEntries.length); i++) {
        await admin.from('attendance').insert({
          student_id: students[i % students.length].id,
          timetable_entry_id: timetableEntries[i].id,
          status: ['present', 'present', 'absent', 'late', 'excused'][i],
          notes: ['On time', 'Good participation', 'No show', 'Arrived 10 min late', 'Family emergency'][i],
        })
      }
      results.push('Attendance seeded')
    }

    // 8. Seed chats (3) + messages (5)
    for (let i = 0; i < Math.min(3, students.length); i++) {
      const { data: chat } = await admin.from('chats').insert({
        student_id: students[i].id,
        teacher_id: teacherRecord.id,
        name: `Chat ${i + 1}`,
      }).select('id').single()
      if (chat) {
        await admin.from('chat_messages').insert([
          { chat_id: chat.id, sender_id: teacherRecord.user_id, message: 'Assalamu Alaikum, how are you doing?' },
          { chat_id: chat.id, sender_id: students[i].user_id, message: 'Wa Alaikum Assalam, doing well!' },
        ])
      }
    }
    results.push('Chats and messages seeded')

    // 9. Seed certificates (5)
    const { data: profiles } = await admin.from('profiles').select('id').limit(5)
    if (profiles?.length) {
      for (let i = 0; i < Math.min(5, profiles.length); i++) {
        await admin.from('certificates').insert({
          recipient_id: profiles[i].id,
          recipient_type: i < 3 ? 'student' : 'teacher',
          title: ['Quran Memorization Certificate', 'Arabic Excellence Award', 'Tajweed Completion', 'Outstanding Teacher', 'Best Performance'][i],
          title_ar: ['شهادة حفظ القرآن', 'جائزة التميز في العربية', 'إتمام التجويد', 'معلم متميز', 'أفضل أداء'][i],
          description: 'Awarded for outstanding achievement',
          description_ar: 'تُمنح للتميز والإنجاز',
          course_id: courses[i % courses.length].id,
          status: 'active',
        })
      }
      results.push('Certificates seeded')
    }

    // 10. Seed notifications (5)
    if (profiles?.length) {
      for (let i = 0; i < Math.min(5, profiles.length); i++) {
        await admin.from('notifications').insert({
          user_id: profiles[i].id,
          title: ['New Lesson', 'Certificate Ready', 'Subscription Renewal', 'New Message', 'Schedule Update'][i],
          message: ['Your next lesson is tomorrow at 10 AM', 'Your certificate is ready to download', 'Your subscription will renew soon', 'You have a new message', 'Your schedule has been updated'][i],
          is_read: i > 2,
        })
      }
      results.push('Notifications seeded')
    }

    // 11. Seed student progress (5)
    if (lessons?.length && students?.length) {
      for (let i = 0; i < Math.min(5, lessons.length); i++) {
        await admin.from('student_progress').insert({
          student_id: students[i % students.length].id,
          lesson_id: lessons[i].id,
          completed: i < 3,
          completed_at: i < 3 ? new Date().toISOString() : null,
          score: i < 3 ? [95, 88, 92, null, null][i] : null,
        })
      }
      results.push('Student progress seeded')
    }

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
