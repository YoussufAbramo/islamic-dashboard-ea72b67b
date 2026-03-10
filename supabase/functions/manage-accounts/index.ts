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
        const { data: { users } } = await adminClient.auth.admin.listUsers()
        const targetUser = users.find(u => u.email === upd.old_email)
        if (!targetUser) { results.push({ old_email: upd.old_email, status: 'not_found' }); continue }
        const { error } = await adminClient.auth.admin.updateUserById(targetUser.id, { email: upd.new_email })
        if (error) { results.push({ old_email: upd.old_email, status: 'error', message: error.message }) }
        else {
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
        if (!targetUser) { results.push({ email, status: 'not_found' }); continue }
        const { error } = await adminClient.auth.admin.deleteUser(targetUser.id)
        results.push({ email, status: error ? 'error' : 'deleted', message: error?.message })
      }
      return new Response(JSON.stringify({ success: true, results }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'seed_timetable') {
      const { data: students } = await adminClient.from('students').select('id').limit(1)
      const { data: teachers } = await adminClient.from('teachers').select('id').limit(1)
      const { data: courses } = await adminClient.from('courses').select('id').limit(1)
      const studentId = students?.[0]?.id || null
      const teacherId = teachers?.[0]?.id || null
      const courseId = courses?.[0]?.id || null
      const now = new Date()
      const entries = []
      for (let i = 0; i < 5; i++) {
        const d = new Date(now); d.setDate(d.getDate() + i - 1); d.setHours(9 + i, 0, 0, 0)
        entries.push({ student_id: studentId, teacher_id: teacherId, course_id: courseId, scheduled_at: d.toISOString(), duration_minutes: [30, 45, 60, 45, 30][i], status: i === 0 ? 'completed' : i === 4 ? 'cancelled' : 'scheduled' })
      }
      const { error } = await adminClient.from('timetable_entries').insert(entries)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ success: true, count: entries.length }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== SEED ALL ====================
    if (action === 'seed_all') {
      const counts = { students: 0, teachers: 0, courses: 0, sections: 0, lessons: 0, subscriptions: 0, timetable: 0, attendance: 0, announcements: 0, notifications: 0, chats: 0, messages: 0, tickets: 0, certificates: 0 }

      // Create sample students
      const studentData = [
        { email: 'student1@sample.edu', name: 'Ahmed Ali', phone: '+201000000001' },
        { email: 'student2@sample.edu', name: 'Sara Hassan', phone: '+201000000002' },
        { email: 'student3@sample.edu', name: 'Omar Khalil', phone: '+201000000003' },
        { email: 'student4@sample.edu', name: 'Fatima Noor', phone: '+201000000004' },
        { email: 'student5@sample.edu', name: 'Youssef Mahmoud', phone: '+201000000005' },
      ]

      const studentUserIds: string[] = []
      for (const s of studentData) {
        try {
          const { data, error } = await adminClient.auth.admin.createUser({
            email: s.email, password: 'sample123456', email_confirm: true,
            user_metadata: { full_name: s.name, phone: s.phone }
          })
          if (!error && data.user) { studentUserIds.push(data.user.id); counts.students++ }
        } catch (_) { /* skip if exists */ }
      }

      // Create sample teachers
      const teacherData = [
        { email: 'teacher1@sample.edu', name: 'Dr. Aisha Mohamed', phone: '+201100000001', spec: 'Quran Memorization', bio: 'PhD in Islamic Studies, 10 years teaching experience' },
        { email: 'teacher2@sample.edu', name: 'Prof. Ibrahim Youssef', phone: '+201100000002', spec: 'Arabic Language', bio: 'Professor of Arabic Literature, specializing in grammar and rhetoric' },
      ]

      const teacherUserIds: string[] = []
      for (const t of teacherData) {
        try {
          const { data, error } = await adminClient.auth.admin.createUser({
            email: t.email, password: 'sample123456', email_confirm: true,
            user_metadata: { full_name: t.name, phone: t.phone }
          })
          if (!error && data.user) {
            teacherUserIds.push(data.user.id)
            // Update role from student to teacher
            await adminClient.from('user_roles').update({ role: 'teacher' }).eq('user_id', data.user.id)
            // Create teacher record
            await adminClient.from('teachers').insert({ user_id: data.user.id, specialization: t.spec, bio: t.bio })
            // Remove auto-created student record
            await adminClient.from('students').delete().eq('user_id', data.user.id)
            counts.teachers++
          }
        } catch (_) { /* skip if exists */ }
      }

      // Get all student & teacher records
      const { data: allStudents } = await adminClient.from('students').select('id, user_id')
      const { data: allTeachers } = await adminClient.from('teachers').select('id, user_id')
      const sIds = (allStudents || []).map(s => s.id)
      const tIds = (allTeachers || []).map(t => t.id)

      if (sIds.length === 0 || tIds.length === 0) {
        return new Response(JSON.stringify({ error: 'Need at least 1 student and 1 teacher to seed data' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Assign students to teachers
      for (let i = 0; i < sIds.length; i++) {
        await adminClient.from('students').update({ assigned_teacher_id: tIds[i % tIds.length], lesson_duration: [30, 45, 60][i % 3], weekly_repeat: [2, 3, 4][i % 3] }).eq('id', sIds[i])
      }

      // Create courses
      const coursesInsert = [
        { title: 'Quran Memorization - Juz Amma', title_ar: 'حفظ القرآن - جزء عم', description: 'Complete memorization course for Juz Amma with tajweed rules', description_ar: 'دورة حفظ كاملة لجزء عم مع أحكام التجويد', status: 'active', created_by: caller.id },
        { title: 'Arabic Language Fundamentals', title_ar: 'أساسيات اللغة العربية', description: 'Learn Arabic grammar, reading, and writing from basics', description_ar: 'تعلم قواعد اللغة العربية والقراءة والكتابة من الأساسيات', status: 'active', created_by: caller.id },
        { title: 'Islamic Studies & Fiqh', title_ar: 'الدراسات الإسلامية والفقه', description: 'Comprehensive Islamic studies covering fiqh, aqeedah, and seerah', description_ar: 'دراسات إسلامية شاملة تغطي الفقه والعقيدة والسيرة', status: 'active', created_by: caller.id },
      ]
      const { data: createdCourses } = await adminClient.from('courses').insert(coursesInsert).select('id')
      const cIds = (createdCourses || []).map(c => c.id)
      counts.courses = cIds.length

      // Create sections
      const sectionsInsert = cIds.flatMap((cid, ci) => [
        { course_id: cid, title: `Introduction & Basics`, title_ar: 'المقدمة والأساسيات', sort_order: 0 },
        { course_id: cid, title: `Core Content`, title_ar: 'المحتوى الأساسي', sort_order: 1 },
        { course_id: cid, title: `Advanced Topics`, title_ar: 'مواضيع متقدمة', sort_order: 2 },
      ])
      const { data: createdSections } = await adminClient.from('course_sections').insert(sectionsInsert).select('id')
      const secIds = (createdSections || []).map(s => s.id)
      counts.sections = secIds.length

      // Create lessons
      const lessonTypes = ['read_listen', 'memorization', 'revision', 'exercise_choose_correct', 'exercise_true_false', 'homework']
      const lessonsInsert = secIds.flatMap((sid, si) =>
        [0, 1].map(li => ({
          section_id: sid, title: `Lesson ${si * 2 + li + 1}`, title_ar: `الدرس ${si * 2 + li + 1}`,
          sort_order: li, lesson_type: lessonTypes[(si * 2 + li) % lessonTypes.length],
          content: { text: 'Sample lesson content', text_ar: 'محتوى درس تجريبي' }
        }))
      )
      const { data: createdLessons } = await adminClient.from('lessons').insert(lessonsInsert).select('id')
      counts.lessons = createdLessons?.length || 0

      // Create subscriptions
      const subsInsert = sIds.slice(0, Math.min(sIds.length, cIds.length * 2)).map((sid, i) => ({
        student_id: sid, course_id: cIds[i % cIds.length], teacher_id: tIds[i % tIds.length],
        status: i === 0 ? 'expired' : 'active', subscription_type: i % 2 === 0 ? 'monthly' : 'yearly',
        price: [50, 100, 75, 120, 80][i % 5], start_date: new Date().toISOString().split('T')[0],
        renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      }))
      const { data: createdSubs } = await adminClient.from('subscriptions').insert(subsInsert).select('id')
      counts.subscriptions = createdSubs?.length || 0

      // Create timetable entries
      const now = new Date()
      const ttInsert = []
      for (let i = 0; i < 10; i++) {
        const d = new Date(now); d.setDate(d.getDate() + i - 3); d.setHours(8 + (i % 6), 0, 0, 0)
        ttInsert.push({
          student_id: sIds[i % sIds.length], teacher_id: tIds[i % tIds.length],
          course_id: cIds[i % cIds.length], scheduled_at: d.toISOString(),
          duration_minutes: [30, 45, 60][i % 3],
          status: i < 3 ? 'completed' : i === 9 ? 'cancelled' : 'scheduled',
        })
      }
      const { data: createdTT } = await adminClient.from('timetable_entries').insert(ttInsert).select('id')
      counts.timetable = createdTT?.length || 0

      // Create attendance records for completed entries
      const completedTT = (createdTT || []).slice(0, 3)
      if (completedTT.length > 0) {
        const attInsert = completedTT.map((tt, i) => ({
          timetable_entry_id: tt.id, student_id: sIds[i % sIds.length],
          status: i === 2 ? 'absent' : 'present', notes: i === 2 ? 'Student was sick' : '',
        }))
        await adminClient.from('attendance').insert(attInsert)
        counts.attendance = attInsert.length
      }

      // Create announcements
      const annInsert = [
        { title: 'Welcome to the New Semester', title_ar: 'مرحباً بالفصل الدراسي الجديد', content: 'We are excited to start a new semester. Please check your schedules.', content_ar: 'نحن متحمسون لبدء فصل دراسي جديد. يرجى مراجعة جداولكم.', target_audience: 'all', created_by: caller.id, is_active: true },
        { title: 'Exam Schedule Released', title_ar: 'تم نشر جدول الامتحانات', content: 'Final exam schedule has been published. Check the timetable section.', content_ar: 'تم نشر جدول الامتحانات النهائية. راجع قسم الجدول.', target_audience: 'students', created_by: caller.id, is_active: true },
        { title: 'Teacher Meeting This Friday', title_ar: 'اجتماع المعلمين يوم الجمعة', content: 'All teachers are required to attend the monthly meeting.', content_ar: 'جميع المعلمين مطالبون بحضور الاجتماع الشهري.', target_audience: 'teachers', created_by: caller.id, is_active: true },
      ]
      await adminClient.from('announcements').insert(annInsert)
      counts.announcements = annInsert.length

      // Create notifications for admin
      const notifInsert = [
        { user_id: caller.id, title: 'New Student Enrolled', message: 'Ahmed Ali has enrolled in Quran Memorization', link: '/dashboard/students' },
        { user_id: caller.id, title: 'Subscription Payment', message: 'New subscription payment of $100 received', link: '/dashboard/subscriptions' },
        { user_id: caller.id, title: 'Support Ticket', message: 'New support ticket requires attention', link: '/dashboard/support' },
        { user_id: caller.id, title: 'Attendance Alert', message: 'Omar Khalil was absent from today\'s lesson', link: '/dashboard/attendance' },
        { user_id: caller.id, title: 'Course Update', message: 'Arabic Language Fundamentals has been updated', link: '/dashboard/courses' },
      ]
      await adminClient.from('notifications').insert(notifInsert)
      counts.notifications = notifInsert.length

      // Create chats
      if (sIds.length > 0 && tIds.length > 0) {
        const chatsInsert = [
          { student_id: sIds[0], teacher_id: tIds[0], name: 'Quran Progress', is_group: false, subscription_id: createdSubs?.[0]?.id || null },
          { student_id: sIds.length > 1 ? sIds[1] : sIds[0], teacher_id: tIds.length > 1 ? tIds[1] : tIds[0], name: 'Arabic Help', is_group: false },
        ]
        const { data: createdChats } = await adminClient.from('chats').insert(chatsInsert).select('id')
        counts.chats = createdChats?.length || 0

        if (createdChats && createdChats.length > 0) {
          const sUserIds = (allStudents || []).map(s => s.user_id)
          const tUserIds = (allTeachers || []).map(t => t.user_id)
          const msgsInsert = [
            { chat_id: createdChats[0].id, sender_id: tUserIds[0], message: 'Assalamu alaikum! How is your memorization going?' },
            { chat_id: createdChats[0].id, sender_id: sUserIds[0], message: 'Wa alaikum assalam! Alhamdulillah, I finished Surah An-Naba' },
            { chat_id: createdChats[0].id, sender_id: tUserIds[0], message: 'Excellent! Let\'s review it in our next session.' },
          ]
          if (createdChats.length > 1) {
            msgsInsert.push(
              { chat_id: createdChats[1].id, sender_id: sUserIds.length > 1 ? sUserIds[1] : sUserIds[0], message: 'I need help with Arabic grammar rules' },
              { chat_id: createdChats[1].id, sender_id: tUserIds.length > 1 ? tUserIds[1] : tUserIds[0], message: 'Sure! Let\'s start with the basics of Nahw' },
            )
          }
          await adminClient.from('chat_messages').insert(msgsInsert)
          counts.messages = msgsInsert.length
        }
      }

      // Create support tickets
      const ticketsInsert = [
        { name: 'Ahmed Ali', email: 'student1@sample.edu', subject: 'Cannot access course material', message: 'I am unable to view the lessons in Quran Memorization course. Please help.', department: 'technical', priority: 'high', status: 'open', user_id: studentUserIds[0] || null },
        { name: 'Sara Hassan', email: 'student2@sample.edu', subject: 'Payment issue', message: 'My subscription payment was charged twice. Please refund.', department: 'billing', priority: 'medium', status: 'in_progress', user_id: studentUserIds[1] || null },
        { name: 'Omar Khalil', email: 'student3@sample.edu', subject: 'Request for schedule change', message: 'I would like to change my lesson time from morning to evening.', department: 'general', priority: 'low', status: 'resolved', resolution_notes: 'Schedule updated as requested.', user_id: studentUserIds[2] || null },
      ]
      await adminClient.from('support_tickets').insert(ticketsInsert)
      counts.tickets = ticketsInsert.length

      // Create certificates
      if (sIds.length > 0 && cIds.length > 0) {
        const certsInsert = [
          { title: 'Juz Amma Memorization Certificate', title_ar: 'شهادة حفظ جزء عم', description: 'Successfully memorized Juz Amma with tajweed', description_ar: 'حفظ جزء عم بنجاح مع أحكام التجويد', recipient_id: (allStudents || [])[0]?.user_id, recipient_type: 'student', course_id: cIds[0], issued_by: caller.id, status: 'active' },
          { title: 'Arabic Fundamentals Completion', title_ar: 'إتمام أساسيات العربية', description: 'Completed Arabic Language Fundamentals course', description_ar: 'أكمل دورة أساسيات اللغة العربية', recipient_id: sIds.length > 1 ? (allStudents || [])[1]?.user_id : (allStudents || [])[0]?.user_id, recipient_type: 'student', course_id: cIds.length > 1 ? cIds[1] : cIds[0], issued_by: caller.id, status: 'active' },
        ]
        await adminClient.from('certificates').insert(certsInsert)
        counts.certificates = certsInsert.length
      }

      return new Response(JSON.stringify({ success: true, counts }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== EXPORT ALL ====================
    if (action === 'export_all') {
      const tableNames = ['courses', 'course_sections', 'lessons', 'students', 'teachers', 'profiles', 'user_roles', 'subscriptions', 'timetable_entries', 'attendance', 'announcements', 'notifications', 'chats', 'chat_messages', 'support_tickets', 'certificates', 'student_progress']
      const exportData: Record<string, any[]> = {}
      for (const table of tableNames) {
        const { data } = await adminClient.from(table).select('*')
        exportData[table] = data || []
      }
      return new Response(JSON.stringify({ success: true, data: exportData, exported_at: new Date().toISOString() }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== CLEAR ALL ====================
    if (action === 'clear_all') {
      const { data: adminRoles } = await adminClient.from('user_roles').select('user_id').eq('role', 'admin')
      const adminIds = (adminRoles || []).map(r => r.user_id)

      if (adminIds.length === 0) {
        return new Response(JSON.stringify({ error: 'No admin users found - aborting' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const errors: string[] = []
      const counts: Record<string, number> = {}

      const countAndDelete = async (table: string, query: any) => {
        // Count first
        const countQuery = await adminClient.from(table).select('id', { count: 'exact', head: true })
        const before = countQuery.count || 0
        const { error } = await query
        if (error) errors.push(`${table}: ${error.message}`)
        // Count after
        const afterQuery = await adminClient.from(table).select('id', { count: 'exact', head: true })
        const after = afterQuery.count || 0
        counts[table] = before - after
      }

      const matchAll = '00000000-0000-0000-0000-000000000000'
      await countAndDelete('chat_messages', adminClient.from('chat_messages').delete().neq('id', matchAll))
      await countAndDelete('attendance', adminClient.from('attendance').delete().neq('id', matchAll))
      await countAndDelete('student_progress', adminClient.from('student_progress').delete().neq('id', matchAll))
      await countAndDelete('timetable_entries', adminClient.from('timetable_entries').delete().neq('id', matchAll))
      await countAndDelete('chats', adminClient.from('chats').delete().neq('id', matchAll))
      await countAndDelete('certificates', adminClient.from('certificates').delete().neq('id', matchAll))
      await countAndDelete('invoices', adminClient.from('invoices').delete().neq('id', matchAll))
      await countAndDelete('subscriptions', adminClient.from('subscriptions').delete().neq('id', matchAll))
      await countAndDelete('lessons', adminClient.from('lessons').delete().neq('id', matchAll))
      await countAndDelete('course_sections', adminClient.from('course_sections').delete().neq('id', matchAll))
      await countAndDelete('courses', adminClient.from('courses').delete().neq('id', matchAll))
      await countAndDelete('notifications', adminClient.from('notifications').delete().neq('id', matchAll))
      await countAndDelete('announcements', adminClient.from('announcements').delete().neq('id', matchAll))
      await countAndDelete('support_tickets', adminClient.from('support_tickets').delete().neq('id', matchAll))
      await countAndDelete('students', adminClient.from('students').delete().not('user_id', 'in', `(${adminIds.join(',')})`))
      await countAndDelete('teachers', adminClient.from('teachers').delete().not('user_id', 'in', `(${adminIds.join(',')})`))
      await countAndDelete('profiles', adminClient.from('profiles').delete().not('id', 'in', `(${adminIds.join(',')})`))
      await countAndDelete('user_roles', adminClient.from('user_roles').delete().not('user_id', 'in', `(${adminIds.join(',')})`))

      // Delete non-admin auth users
      const { data: { users } } = await adminClient.auth.admin.listUsers()
      let deletedUsers = 0
      for (const user of users) {
        if (!adminIds.includes(user.id)) {
          try {
            await adminClient.auth.admin.deleteUser(user.id)
            deletedUsers++
          } catch (e) {
            errors.push(`auth.delete(${user.email}): ${e.message}`)
          }
        }
      }
      counts['auth_users'] = deletedUsers

      const totalDeleted = Object.values(counts).reduce((sum, c) => sum + c, 0)

      return new Response(JSON.stringify({ success: true, deleted_users: deletedUsers, preserved_admins: adminIds.length, counts, total_deleted: totalDeleted, errors: errors.length > 0 ? errors : undefined }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== CLEAR TABLES (reset all table data, keep auth users) ====================
    if (action === 'clear_tables') {
      const errors: string[] = []
      const counts: Record<string, number> = {}

      const countAndDelete = async (table: string) => {
        const countQuery = await adminClient.from(table).select('id', { count: 'exact', head: true })
        const before = countQuery.count || 0
        const matchAll = '00000000-0000-0000-0000-000000000000'
        const { error } = await adminClient.from(table).delete().neq('id', matchAll)
        if (error) errors.push(`${table}: ${error.message}`)
        const afterQuery = await adminClient.from(table).select('id', { count: 'exact', head: true })
        const after = afterQuery.count || 0
        counts[table] = before - after
      }

      // Delete in FK-safe order
      await countAndDelete('chat_messages')
      await countAndDelete('attendance')
      await countAndDelete('student_progress')
      await countAndDelete('timetable_entries')
      await countAndDelete('chats')
      await countAndDelete('certificates')
      await countAndDelete('invoices')
      await countAndDelete('subscriptions')
      await countAndDelete('lessons')
      await countAndDelete('course_sections')
      await countAndDelete('courses')
      await countAndDelete('notifications')
      await countAndDelete('announcements')
      await countAndDelete('support_tickets')
      await countAndDelete('landing_content')
      await countAndDelete('pricing_packages')

      const totalDeleted = Object.values(counts).reduce((sum, c) => sum + c, 0)

      return new Response(JSON.stringify({ success: true, counts, total_deleted: totalDeleted, errors: errors.length > 0 ? errors : undefined }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== CLEAR SEED (sample data only) ====================
    if (action === 'clear_seed') {
      const sampleEmails = [
        'student1@sample.edu', 'student2@sample.edu', 'student3@sample.edu',
        'student4@sample.edu', 'student5@sample.edu',
        'teacher1@sample.edu', 'teacher2@sample.edu',
      ]

      // Find sample user IDs
      const { data: { users } } = await adminClient.auth.admin.listUsers()
      const sampleUserIds = users.filter(u => sampleEmails.includes(u.email || '')).map(u => u.id)

      if (sampleUserIds.length === 0) {
        return new Response(JSON.stringify({ success: true, message: 'No sample data found', deleted_users: 0 }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Get student/teacher record IDs for these users
      const { data: sampleStudents } = await adminClient.from('students').select('id').in('user_id', sampleUserIds)
      const { data: sampleTeachers } = await adminClient.from('teachers').select('id').in('user_id', sampleUserIds)
      const sStudentIds = (sampleStudents || []).map(s => s.id)
      const sTeacherIds = (sampleTeachers || []).map(t => t.id)

      // Delete in FK-safe order, scoped to sample users
      if (sStudentIds.length > 0 || sTeacherIds.length > 0) {
        // Chat messages from sample chats
        const chatFilter = []
        if (sStudentIds.length > 0) chatFilter.push(...sStudentIds)
        const { data: sampleChats } = await adminClient.from('chats').select('id').or(
          [
            sStudentIds.length > 0 ? `student_id.in.(${sStudentIds.join(',')})` : '',
            sTeacherIds.length > 0 ? `teacher_id.in.(${sTeacherIds.join(',')})` : '',
          ].filter(Boolean).join(',')
        )
        const chatIds = (sampleChats || []).map(c => c.id)
        if (chatIds.length > 0) {
          await adminClient.from('chat_messages').delete().in('chat_id', chatIds)
          await adminClient.from('chats').delete().in('id', chatIds)
        }

        // Attendance, timetable, subscriptions scoped to sample students/teachers
        if (sStudentIds.length > 0) {
          await adminClient.from('attendance').delete().in('student_id', sStudentIds)
          await adminClient.from('student_progress').delete().in('student_id', sStudentIds)
          await adminClient.from('timetable_entries').delete().in('student_id', sStudentIds)
          await adminClient.from('subscriptions').delete().in('student_id', sStudentIds)
        }
        if (sTeacherIds.length > 0) {
          await adminClient.from('timetable_entries').delete().in('teacher_id', sTeacherIds)
        }
      }

      // Certificates issued to sample users
      await adminClient.from('certificates').delete().in('recipient_id', sampleUserIds)
      // Support tickets from sample users
      await adminClient.from('support_tickets').delete().in('user_id', sampleUserIds)
      // Notifications for sample users
      await adminClient.from('notifications').delete().in('user_id', sampleUserIds)

      // Delete student/teacher/profile/role records
      if (sStudentIds.length > 0) await adminClient.from('students').delete().in('id', sStudentIds)
      if (sTeacherIds.length > 0) await adminClient.from('teachers').delete().in('id', sTeacherIds)
      await adminClient.from('profiles').delete().in('id', sampleUserIds)
      await adminClient.from('user_roles').delete().in('user_id', sampleUserIds)

      // Delete auth users
      let deletedUsers = 0
      for (const uid of sampleUserIds) {
        await adminClient.auth.admin.deleteUser(uid)
        deletedUsers++
      }

      return new Response(JSON.stringify({ success: true, deleted_users: deletedUsers }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('manage-accounts error:', err)
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
