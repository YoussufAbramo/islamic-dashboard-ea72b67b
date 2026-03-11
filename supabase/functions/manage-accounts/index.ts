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
      const categories: string[] = body.categories || ['students', 'teachers', 'courses', 'billing', 'schedule', 'communications', 'chats', 'support', 'certificates', 'website']
      const quantity: string = body.quantity || 'medium'
      
      // Quantity multipliers
      const qtyConfig = {
        little: { students: 2, teachers: 1, courses: 1, sections: 2, lessonsPerSection: 1, lessonSections: 2, timetable: 3, announcements: 1, notifications: 2, chats: 1, tickets: 1, certs: 1, invoices: 2, tracks: 1, categories: 1, levels: 1, blogs: 2, pages: 1, packages: 1 },
        medium: { students: 5, teachers: 2, courses: 3, sections: 3, lessonsPerSection: 2, lessonSections: 2, timetable: 10, announcements: 3, notifications: 5, chats: 2, tickets: 3, certs: 2, invoices: 4, tracks: 2, categories: 3, levels: 3, blogs: 4, pages: 3, packages: 3 },
        many:   { students: 10, teachers: 4, courses: 6, sections: 4, lessonsPerSection: 3, lessonSections: 3, timetable: 20, announcements: 5, notifications: 10, chats: 4, tickets: 6, certs: 4, invoices: 8, tracks: 3, categories: 5, levels: 4, blogs: 6, pages: 5, packages: 4 },
      }
      const qty = qtyConfig[quantity as keyof typeof qtyConfig] || qtyConfig.medium
      
      const counts: Record<string, number> = { students: 0, teachers: 0, courses: 0, sections: 0, lesson_sections: 0, lessons: 0, tracks: 0, categories: 0, levels: 0, subscriptions: 0, invoices: 0, timetable: 0, attendance: 0, announcements: 0, notifications: 0, chats: 0, messages: 0, tickets: 0, certificates: 0, blogs: 0, pages: 0, packages: 0 }

      // Build student/teacher data based on quantity
      const allStudentEmails = [
        { email: 'student1@sample.edu', name: 'Ahmed Ali', phone: '+201000000001' },
        { email: 'student2@sample.edu', name: 'Sara Hassan', phone: '+201000000002' },
        { email: 'student3@sample.edu', name: 'Omar Khalil', phone: '+201000000003' },
        { email: 'student4@sample.edu', name: 'Fatima Noor', phone: '+201000000004' },
        { email: 'student5@sample.edu', name: 'Youssef Mahmoud', phone: '+201000000005' },
        { email: 'student6@sample.edu', name: 'Layla Ibrahim', phone: '+201000000006' },
        { email: 'student7@sample.edu', name: 'Khaled Mostafa', phone: '+201000000007' },
        { email: 'student8@sample.edu', name: 'Nour Adel', phone: '+201000000008' },
        { email: 'student9@sample.edu', name: 'Zeinab Samir', phone: '+201000000009' },
        { email: 'student10@sample.edu', name: 'Hassan Reda', phone: '+201000000010' },
      ]
      const studentData = allStudentEmails.slice(0, qty.students)

      const allTeacherEmails = [
        { email: 'teacher1@sample.edu', name: 'Dr. Aisha Mohamed', phone: '+201100000001', spec: 'Quran Memorization', bio: 'PhD in Islamic Studies, 10 years teaching experience' },
        { email: 'teacher2@sample.edu', name: 'Prof. Ibrahim Youssef', phone: '+201100000002', spec: 'Arabic Language', bio: 'Professor of Arabic Literature, specializing in grammar and rhetoric' },
        { email: 'teacher3@sample.edu', name: 'Dr. Fatima Al-Rashid', phone: '+201100000003', spec: 'Islamic Fiqh', bio: 'Expert in Islamic jurisprudence and comparative fiqh' },
        { email: 'teacher4@sample.edu', name: 'Prof. Mustafa Kamal', phone: '+201100000004', spec: 'Tajweed', bio: 'Certified Quran reciter with ijazah in multiple qira\'at' },
      ]
      const teacherData = allTeacherEmails.slice(0, qty.teachers)

      const studentUserIds: string[] = []
      if (categories.includes('students')) {
        for (const s of studentData) {
          try {
            const { data, error } = await adminClient.auth.admin.createUser({
              email: s.email, password: crypto.randomUUID(), email_confirm: true,
              user_metadata: { full_name: s.name, phone: s.phone }
            })
            if (!error && data.user) { studentUserIds.push(data.user.id); counts.students++ }
          } catch (_) { /* skip if exists */ }
        }
      }

      if (categories.includes('teachers')) {
        for (const t of teacherData) {
          try {
            const { data, error } = await adminClient.auth.admin.createUser({
              email: t.email, password: crypto.randomUUID(), email_confirm: true,
              user_metadata: { full_name: t.name, phone: t.phone }
            })
            if (!error && data.user) {
              await adminClient.from('user_roles').update({ role: 'teacher' }).eq('user_id', data.user.id)
              await adminClient.from('teachers').insert({ user_id: data.user.id, specialization: t.spec, bio: t.bio })
              await adminClient.from('students').delete().eq('user_id', data.user.id)
              counts.teachers++
            }
          } catch (_) { /* skip if exists */ }
        }
      }

      // Get all student & teacher records
      const { data: allStudents } = await adminClient.from('students').select('id, user_id')
      const { data: allTeachers } = await adminClient.from('teachers').select('id, user_id')
      const sIds = (allStudents || []).map(s => s.id)
      const tIds = (allTeachers || []).map(t => t.id)

      if (sIds.length === 0 || tIds.length === 0) {
        // If only seeding non-user categories, we still need users to exist
        if (categories.some(c => ['courses', 'billing', 'schedule', 'communications', 'chats', 'certificates'].includes(c))) {
          return new Response(JSON.stringify({ error: 'Need at least 1 student and 1 teacher to seed data. Add "students" and "teachers" categories first.' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
        }
      }

      // Assign students to teachers (always do this if we have both)
      if (sIds.length > 0 && tIds.length > 0) {
        for (let i = 0; i < sIds.length; i++) {
          await adminClient.from('students').update({ assigned_teacher_id: tIds[i % tIds.length], lesson_duration: [30, 45, 60][i % 3], weekly_repeat: [2, 3, 4][i % 3] }).eq('id', sIds[i])
        }
      }

      let cIds: string[] = []
      let createdSubs: any[] = []

      // Create courses
      if (categories.includes('courses')) {
        // Seed course tracks
        const allTracks = [
          { title: 'Quran Track', title_ar: 'مسار القرآن', description: 'Quran memorization and recitation track', description_ar: 'مسار حفظ وتلاوة القرآن', sort_order: 0 },
          { title: 'Arabic Track', title_ar: 'مسار اللغة العربية', description: 'Arabic language learning track', description_ar: 'مسار تعلم اللغة العربية', sort_order: 1 },
          { title: 'Islamic Studies Track', title_ar: 'مسار الدراسات الإسلامية', description: 'Comprehensive Islamic studies', description_ar: 'دراسات إسلامية شاملة', sort_order: 2 },
        ]
        const tracksInsert = allTracks.slice(0, qty.tracks)
        const { data: createdTracks } = await adminClient.from('course_tracks').insert(tracksInsert).select('id')
        const trackIds = (createdTracks || []).map(t => t.id)
        counts.tracks = trackIds.length

        // Seed course categories
        const allCategories = [
          { title: 'Memorization', title_ar: 'حفظ', description: 'Quran memorization courses', description_ar: 'دورات حفظ القرآن', sort_order: 0 },
          { title: 'Language', title_ar: 'لغة', description: 'Arabic language courses', description_ar: 'دورات اللغة العربية', sort_order: 1 },
          { title: 'Fiqh & Aqeedah', title_ar: 'فقه وعقيدة', description: 'Islamic jurisprudence and creed', description_ar: 'الفقه الإسلامي والعقيدة', sort_order: 2 },
          { title: 'Tajweed', title_ar: 'تجويد', description: 'Quran recitation rules', description_ar: 'أحكام تلاوة القرآن', sort_order: 3 },
          { title: 'History & Seerah', title_ar: 'تاريخ وسيرة', description: 'Islamic history and biography', description_ar: 'التاريخ الإسلامي والسيرة النبوية', sort_order: 4 },
        ]
        const catsInsert = allCategories.slice(0, qty.categories)
        const { data: createdCats } = await adminClient.from('course_categories').insert(catsInsert).select('id')
        const catIds = (createdCats || []).map(c => c.id)
        counts.categories = catIds.length

        // Seed course levels
        const allLevels = [
          { title: 'Beginner', title_ar: 'مبتدئ', description: 'For new learners', description_ar: 'للمتعلمين الجدد', sort_order: 0 },
          { title: 'Intermediate', title_ar: 'متوسط', description: 'For learners with basic knowledge', description_ar: 'للمتعلمين ذوي المعرفة الأساسية', sort_order: 1 },
          { title: 'Advanced', title_ar: 'متقدم', description: 'For experienced learners', description_ar: 'للمتعلمين ذوي الخبرة', sort_order: 2 },
          { title: 'Expert', title_ar: 'خبير', description: 'For mastery-level learners', description_ar: 'لمستوى الإتقان', sort_order: 3 },
        ]
        const levelsInsert = allLevels.slice(0, qty.levels)
        const { data: createdLevels } = await adminClient.from('course_levels').insert(levelsInsert).select('id')
        const levelIds = (createdLevels || []).map(l => l.id)
        counts.levels = levelIds.length

        const allCourses = [
          { title: 'Quran Memorization - Juz Amma', title_ar: 'حفظ القرآن - جزء عم', description: 'Complete memorization course for Juz Amma with tajweed rules', description_ar: 'دورة حفظ كاملة لجزء عم مع أحكام التجويد', status: 'active', created_by: caller.id },
          { title: 'Arabic Language Fundamentals', title_ar: 'أساسيات اللغة العربية', description: 'Learn Arabic grammar, reading, and writing from basics', description_ar: 'تعلم قواعد اللغة العربية والقراءة والكتابة من الأساسيات', status: 'active', created_by: caller.id },
          { title: 'Islamic Studies & Fiqh', title_ar: 'الدراسات الإسلامية والفقه', description: 'Comprehensive Islamic studies covering fiqh, aqeedah, and seerah', description_ar: 'دراسات إسلامية شاملة تغطي الفقه والعقيدة والسيرة', status: 'active', created_by: caller.id },
          { title: 'Tajweed Rules', title_ar: 'أحكام التجويد', description: 'Learn the rules of Quran recitation', description_ar: 'تعلم أحكام تلاوة القرآن الكريم', status: 'active', created_by: caller.id },
          { title: 'Hadith Sciences', title_ar: 'علوم الحديث', description: 'Introduction to Hadith authentication and sciences', description_ar: 'مقدمة في تخريج الأحاديث وعلومها', status: 'active', created_by: caller.id },
          { title: 'Islamic History', title_ar: 'التاريخ الإسلامي', description: 'Comprehensive overview of Islamic civilization history', description_ar: 'نظرة شاملة على تاريخ الحضارة الإسلامية', status: 'active', created_by: caller.id },
        ]
        const coursesInsert = allCourses.slice(0, qty.courses).map((c, i) => ({
          ...c,
          category_id: catIds.length > 0 ? catIds[i % catIds.length] : null,
          level_id: levelIds.length > 0 ? levelIds[i % levelIds.length] : null,
          track_id: trackIds.length > 0 ? trackIds[i % trackIds.length] : null,
        }))
        const { data: createdCourses } = await adminClient.from('courses').insert(coursesInsert).select('id')
        cIds = (createdCourses || []).map(c => c.id)
        counts.courses = cIds.length

        // Create course sections (lessons in the 3-level hierarchy)
        const sectionTitles = [
          { title: 'Introduction & Basics', title_ar: 'المقدمة والأساسيات' },
          { title: 'Core Content', title_ar: 'المحتوى الأساسي' },
          { title: 'Advanced Topics', title_ar: 'مواضيع متقدمة' },
          { title: 'Practice & Review', title_ar: 'التمارين والمراجعة' },
        ]
        const sectionsInsert = cIds.flatMap(cid =>
          sectionTitles.slice(0, qty.sections).map((s, i) => ({
            course_id: cid, title: s.title, title_ar: s.title_ar, sort_order: i
          }))
        )
        const { data: createdSections } = await adminClient.from('course_sections').insert(sectionsInsert).select('id')
        const secIds = (createdSections || []).map(s => s.id)
        counts.sections = secIds.length

        // Create lesson_sections (middle level)
        const lessonSectionTitles = [
          { title: 'Part 1', title_ar: 'الجزء الأول' },
          { title: 'Part 2', title_ar: 'الجزء الثاني' },
          { title: 'Part 3', title_ar: 'الجزء الثالث' },
        ]
        const lSecInsert = secIds.flatMap(sid =>
          lessonSectionTitles.slice(0, qty.lessonSections).map((ls, i) => ({
            course_section_id: sid, title: ls.title, title_ar: ls.title_ar, sort_order: i
          }))
        )
        const { data: createdLSections } = await adminClient.from('lesson_sections').insert(lSecInsert).select('id')
        const lSecIds = (createdLSections || []).map(s => s.id)
        counts.lesson_sections = lSecIds.length

        // Create lessons (content level - linked to lesson_sections)
        const lessonTypes = ['read_listen', 'memorization', 'revision', 'exercise_choose_correct', 'exercise_true_false', 'homework']
        const lessonsInsert = lSecIds.flatMap((sid, si) =>
          Array.from({ length: qty.lessonsPerSection }, (_, li) => ({
            section_id: sid, title: `Lesson ${si * qty.lessonsPerSection + li + 1}`, title_ar: `الدرس ${si * qty.lessonsPerSection + li + 1}`,
            sort_order: li, lesson_type: lessonTypes[(si * qty.lessonsPerSection + li) % lessonTypes.length],
            content: { text: 'Sample lesson content', text_ar: 'محتوى درس تجريبي' }
          }))
        )
        const { data: createdLessons } = await adminClient.from('lessons').insert(lessonsInsert).select('id')
        counts.lessons = createdLessons?.length || 0
      }

      // Get existing courses if not created in this run
      if (cIds.length === 0) {
        const { data: existingCourses } = await adminClient.from('courses').select('id').limit(10)
        cIds = (existingCourses || []).map(c => c.id)
      }

      // Create subscriptions
      if (categories.includes('subscriptions') && sIds.length > 0 && cIds.length > 0) {
        const subsInsert = sIds.slice(0, Math.min(sIds.length, cIds.length * 2)).map((sid, i) => ({
          student_id: sid, course_id: cIds[i % cIds.length], teacher_id: tIds[i % tIds.length],
          status: i === 0 ? 'expired' : 'active', subscription_type: i % 2 === 0 ? 'monthly' : 'yearly',
          price: [50, 100, 75, 120, 80][i % 5], start_date: new Date().toISOString().split('T')[0],
          renewal_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        }))
        const { data: subs } = await adminClient.from('subscriptions').insert(subsInsert).select('id')
        createdSubs = subs || []
        counts.subscriptions = createdSubs.length
      }

      // Create timetable entries & attendance
      if (categories.includes('schedule') && sIds.length > 0 && tIds.length > 0 && cIds.length > 0) {
        const now = new Date()
        const ttInsert = []
        for (let i = 0; i < qty.timetable; i++) {
          const d = new Date(now); d.setDate(d.getDate() + i - Math.floor(qty.timetable / 3)); d.setHours(8 + (i % 6), 0, 0, 0)
          ttInsert.push({
            student_id: sIds[i % sIds.length], teacher_id: tIds[i % tIds.length],
            course_id: cIds[i % cIds.length], scheduled_at: d.toISOString(),
            duration_minutes: [30, 45, 60][i % 3],
            status: i < Math.floor(qty.timetable / 3) ? 'completed' : i === qty.timetable - 1 ? 'cancelled' : 'scheduled',
          })
        }
        const { data: createdTT } = await adminClient.from('timetable_entries').insert(ttInsert).select('id')
        counts.timetable = createdTT?.length || 0

        const completedTT = (createdTT || []).filter((_, i) => i < Math.floor(qty.timetable / 3))
        if (completedTT.length > 0) {
          const attInsert = completedTT.map((tt, i) => ({
            timetable_entry_id: tt.id, student_id: sIds[i % sIds.length],
            status: i % 3 === 2 ? 'absent' : 'present', notes: i % 3 === 2 ? 'Student was sick' : '',
          }))
          await adminClient.from('attendance').insert(attInsert)
          counts.attendance = attInsert.length
        }
      }

      // Create communications
      if (categories.includes('communications')) {
        const allAnnouncements = [
          { title: 'Welcome to the New Semester', title_ar: 'مرحباً بالفصل الدراسي الجديد', content: 'We are excited to start a new semester. Please check your schedules.', content_ar: 'نحن متحمسون لبدء فصل دراسي جديد. يرجى مراجعة جداولكم.', target_audience: 'all', created_by: caller.id, is_active: true },
          { title: 'Exam Schedule Released', title_ar: 'تم نشر جدول الامتحانات', content: 'Final exam schedule has been published. Check the timetable section.', content_ar: 'تم نشر جدول الامتحانات النهائية. راجع قسم الجدول.', target_audience: 'students', created_by: caller.id, is_active: true },
          { title: 'Teacher Meeting This Friday', title_ar: 'اجتماع المعلمين يوم الجمعة', content: 'All teachers are required to attend the monthly meeting.', content_ar: 'جميع المعلمين مطالبون بحضور الاجتماع الشهري.', target_audience: 'teachers', created_by: caller.id, is_active: true },
          { title: 'Holiday Schedule', title_ar: 'جدول الإجازات', content: 'Please note the upcoming holiday dates.', content_ar: 'يرجى ملاحظة مواعيد الإجازات القادمة.', target_audience: 'all', created_by: caller.id, is_active: true },
          { title: 'New Course Available', title_ar: 'دورة جديدة متاحة', content: 'A new course has been added to the curriculum.', content_ar: 'تمت إضافة دورة جديدة إلى المنهج.', target_audience: 'all', created_by: caller.id, is_active: true },
        ]
        const annInsert = allAnnouncements.slice(0, qty.announcements)
        await adminClient.from('announcements').insert(annInsert)
        counts.announcements = annInsert.length

        const allNotifs = [
          { user_id: caller.id, title: 'New Student Enrolled', message: 'Ahmed Ali has enrolled in Quran Memorization', link: '/dashboard/students' },
          { user_id: caller.id, title: 'Subscription Payment', message: 'New subscription payment of $100 received', link: '/dashboard/subscriptions' },
          { user_id: caller.id, title: 'Support Ticket', message: 'New support ticket requires attention', link: '/dashboard/support' },
          { user_id: caller.id, title: 'Attendance Alert', message: 'A student was absent from today\'s lesson', link: '/dashboard/attendance' },
          { user_id: caller.id, title: 'Course Update', message: 'Arabic Language Fundamentals has been updated', link: '/dashboard/courses' },
          { user_id: caller.id, title: 'New Certificate Issued', message: 'A new certificate has been issued', link: '/dashboard/certificates' },
          { user_id: caller.id, title: 'Schedule Change', message: 'A lesson has been rescheduled', link: '/dashboard/timetable' },
          { user_id: caller.id, title: 'New Message', message: 'You have a new message from a teacher', link: '/dashboard/chats' },
          { user_id: caller.id, title: 'Backup Complete', message: 'System backup completed successfully', link: '/dashboard/settings' },
          { user_id: caller.id, title: 'System Update', message: 'The system has been updated to the latest version', link: '/dashboard/settings' },
        ]
        const notifInsert = allNotifs.slice(0, qty.notifications)
        await adminClient.from('notifications').insert(notifInsert)
        counts.notifications = notifInsert.length

        // Create chats
        if (sIds.length > 0 && tIds.length > 0) {
          const chatCount = Math.min(qty.chats, sIds.length, tIds.length)
          const chatsInsert = Array.from({ length: chatCount }, (_, i) => ({
            student_id: sIds[i % sIds.length], teacher_id: tIds[i % tIds.length],
            name: ['Quran Progress', 'Arabic Help', 'Fiqh Discussion', 'General'][i % 4],
            is_group: false, subscription_id: createdSubs[i]?.id || null,
          }))
          const { data: createdChats } = await adminClient.from('chats').insert(chatsInsert).select('id')
          counts.chats = createdChats?.length || 0

          if (createdChats && createdChats.length > 0) {
            const sUserIds = (allStudents || []).map(s => s.user_id)
            const tUserIds = (allTeachers || []).map(t => t.user_id)
            const msgsInsert: { chat_id: string; sender_id: string; message: string }[] = []
            for (let i = 0; i < createdChats.length; i++) {
              msgsInsert.push(
                { chat_id: createdChats[i].id, sender_id: tUserIds[i % tUserIds.length], message: 'Assalamu alaikum! How is your progress?' },
                { chat_id: createdChats[i].id, sender_id: sUserIds[i % sUserIds.length], message: 'Wa alaikum assalam! Alhamdulillah, going well.' },
                { chat_id: createdChats[i].id, sender_id: tUserIds[i % tUserIds.length], message: 'Great! Keep up the good work.' },
              )
            }
            await adminClient.from('chat_messages').insert(msgsInsert)
            counts.messages = msgsInsert.length
          }
        }
      }

      // Create support tickets
      if (categories.includes('support')) {
        const allTickets = [
          { name: 'Ahmed Ali', email: 'student1@sample.edu', subject: 'Cannot access course material', message: 'I am unable to view the lessons in Quran Memorization course. Please help.', department: 'technical', priority: 'high', status: 'open', user_id: studentUserIds[0] || null },
          { name: 'Sara Hassan', email: 'student2@sample.edu', subject: 'Payment issue', message: 'My subscription payment was charged twice. Please refund.', department: 'billing', priority: 'medium', status: 'in_progress', user_id: studentUserIds[1] || null },
          { name: 'Omar Khalil', email: 'student3@sample.edu', subject: 'Request for schedule change', message: 'I would like to change my lesson time from morning to evening.', department: 'general', priority: 'low', status: 'resolved', resolution_notes: 'Schedule updated as requested.', user_id: studentUserIds[2] || null },
          { name: 'Fatima Noor', email: 'student4@sample.edu', subject: 'App not loading', message: 'The application does not load on my device.', department: 'technical', priority: 'high', status: 'open', user_id: studentUserIds[3] || null },
          { name: 'Youssef Mahmoud', email: 'student5@sample.edu', subject: 'Certificate request', message: 'I completed the course but did not receive my certificate.', department: 'general', priority: 'medium', status: 'open', user_id: studentUserIds[4] || null },
          { name: 'Layla Ibrahim', email: 'student6@sample.edu', subject: 'Feature suggestion', message: 'It would be great to have a dark mode option.', department: 'general', priority: 'low', status: 'resolved', resolution_notes: 'Dark mode is now available.', user_id: null },
        ]
        const ticketsInsert = allTickets.slice(0, qty.tickets)
        await adminClient.from('support_tickets').insert(ticketsInsert)
        counts.tickets = ticketsInsert.length
      }

      // Create certificates
      if (categories.includes('certificates') && sIds.length > 0 && cIds.length > 0) {
        const certCount = Math.min(qty.certs, sIds.length)
        const certsInsert = Array.from({ length: certCount }, (_, i) => ({
          title: `Certificate ${i + 1}`, title_ar: `شهادة ${i + 1}`,
          description: 'Successfully completed the course', description_ar: 'أكمل الدورة بنجاح',
          recipient_id: (allStudents || [])[i % (allStudents || []).length]?.user_id,
          recipient_type: 'student', course_id: cIds[i % cIds.length],
          issued_by: caller.id, status: 'active',
        }))
        await adminClient.from('certificates').insert(certsInsert)
        counts.certificates = certsInsert.length
      }

      // Create invoices
      if (categories.includes('invoices') && sIds.length > 0) {
        // Get subscriptions to link invoices
        const { data: existingSubs } = await adminClient.from('subscriptions').select('id, student_id, course_id, price, subscription_type').limit(20)
        const subsForInvoices = existingSubs || createdSubs || []
        
        if (subsForInvoices.length > 0) {
          const invoiceStatuses = ['pending', 'paid', 'overdue', 'cancelled']
          const invCount = Math.min(qty.invoices, Math.max(subsForInvoices.length * 2, qty.invoices))
          const invoicesInsert = Array.from({ length: invCount }, (_, i) => {
            const sub = subsForInvoices[i % subsForInvoices.length]
            const status = invoiceStatuses[i % invoiceStatuses.length]
            const amount = sub.price || [50, 100, 75, 120][i % 4]
            const dueDate = new Date()
            dueDate.setDate(dueDate.getDate() + (status === 'overdue' ? -15 : 30))
            return {
              subscription_id: sub.id,
              student_id: sub.student_id,
              course_id: sub.course_id || (cIds.length > 0 ? cIds[i % cIds.length] : null),
              amount,
              original_price: amount,
              sale_price: i % 3 === 0 ? amount * 0.8 : null,
              billing_cycle: sub.subscription_type || 'monthly',
              due_date: dueDate.toISOString().split('T')[0],
              status,
              paid_at: status === 'paid' ? new Date().toISOString() : null,
              notes: status === 'paid' ? 'Payment received' : status === 'overdue' ? 'Payment overdue - follow up needed' : '',
            }
          })
          const { data: createdInvoices } = await adminClient.from('invoices').insert(invoicesInsert).select('id')
          counts.invoices = createdInvoices?.length || 0
        }
      }

      // Create website content (blogs, pages, packages)
      if (categories.includes('website')) {
        // Blog posts
        const allBlogs = [
          { title: 'Welcome to Our Academy', title_ar: 'مرحباً بكم في أكاديميتنا', slug: 'welcome-to-our-academy', excerpt: 'Learn about our mission and vision for Islamic education.', excerpt_ar: 'تعرف على رسالتنا ورؤيتنا للتعليم الإسلامي.', content: '<h2>Welcome</h2><p>We are dedicated to providing high-quality Islamic education online. Our academy offers courses in Quran memorization, Arabic language, and Islamic studies.</p><p>Join us on this journey of knowledge and spiritual growth.</p>', content_ar: '<h2>مرحباً</h2><p>نحن ملتزمون بتقديم تعليم إسلامي عالي الجودة عبر الإنترنت. تقدم أكاديميتنا دورات في حفظ القرآن واللغة العربية والدراسات الإسلامية.</p>', status: 'published', published_at: new Date().toISOString(), created_by: caller.id },
          { title: 'Tips for Effective Quran Memorization', title_ar: 'نصائح لحفظ القرآن بفعالية', slug: 'quran-memorization-tips', excerpt: 'Practical advice for memorizing the Quran efficiently.', excerpt_ar: 'نصائح عملية لحفظ القرآن بكفاءة.', content: '<h2>Memorization Tips</h2><p>Consistency is key. Set a daily schedule and stick to it. Review previously memorized portions regularly.</p><ul><li>Start with short surahs</li><li>Listen to recitations repeatedly</li><li>Recite in your prayers</li></ul>', content_ar: '<h2>نصائح للحفظ</h2><p>الاستمرارية هي المفتاح. حدد جدولاً يومياً والتزم به. راجع الأجزاء المحفوظة بانتظام.</p>', status: 'published', published_at: new Date().toISOString(), created_by: caller.id },
          { title: 'The Importance of Learning Arabic', title_ar: 'أهمية تعلم اللغة العربية', slug: 'importance-of-arabic', excerpt: 'Why every Muslim should strive to learn the Arabic language.', excerpt_ar: 'لماذا يجب على كل مسلم السعي لتعلم اللغة العربية.', content: '<h2>Why Arabic?</h2><p>Arabic is the language of the Quran. Understanding it deepens your connection with the holy book and enriches your prayers.</p>', content_ar: '<h2>لماذا العربية؟</h2><p>العربية هي لغة القرآن. فهمها يعمق صلتك بالكتاب الكريم ويثري صلاتك.</p>', status: 'published', published_at: new Date().toISOString(), created_by: caller.id },
          { title: 'Understanding Tajweed Rules', title_ar: 'فهم أحكام التجويد', slug: 'understanding-tajweed', excerpt: 'A beginner guide to Tajweed rules.', excerpt_ar: 'دليل المبتدئين لأحكام التجويد.', content: '<h2>Tajweed Basics</h2><p>Tajweed ensures proper pronunciation of Quran letters. It includes rules for elongation, nasalization, and proper stops.</p>', content_ar: '<h2>أساسيات التجويد</h2><p>التجويد يضمن النطق الصحيح لحروف القرآن. يشمل قواعد المد والغنة والوقف.</p>', status: 'published', published_at: new Date().toISOString(), created_by: caller.id },
          { title: 'Student Success Stories', title_ar: 'قصص نجاح الطلاب', slug: 'student-success-stories', excerpt: 'Inspiring stories from our students.', excerpt_ar: 'قصص ملهمة من طلابنا.', content: '<h2>Success Stories</h2><p>Read about students who memorized the entire Quran through our program.</p>', content_ar: '<h2>قصص نجاح</h2><p>اقرأ عن الطلاب الذين حفظوا القرآن كاملاً من خلال برنامجنا.</p>', status: 'draft', created_by: caller.id },
          { title: 'New Courses Coming Soon', title_ar: 'دورات جديدة قريباً', slug: 'new-courses-coming-soon', excerpt: 'Exciting new courses are on the way!', excerpt_ar: 'دورات جديدة مثيرة في الطريق!', content: '<h2>Coming Soon</h2><p>We are preparing new courses in Hadith sciences and Islamic history. Stay tuned!</p>', content_ar: '<h2>قريباً</h2><p>نحن نحضر دورات جديدة في علوم الحديث والتاريخ الإسلامي. ترقبوا!</p>', status: 'draft', created_by: caller.id },
        ]
        const blogsInsert = allBlogs.slice(0, qty.blogs)
        const { data: createdBlogs } = await adminClient.from('blog_posts').insert(blogsInsert).select('id')
        counts.blogs = createdBlogs?.length || 0

        // Website pages
        const allPages = [
          { title: 'About Us', title_ar: 'من نحن', slug: 'about-us', content: '<h1>About Us</h1><p>We are an online Islamic education academy committed to providing accessible, high-quality learning experiences. Our team of qualified scholars and educators brings years of experience in Quran, Arabic, and Islamic studies.</p><h2>Our Mission</h2><p>To make Islamic education accessible to everyone, everywhere.</p><h2>Our Vision</h2><p>A world where every Muslim has access to authentic Islamic knowledge.</p>', content_ar: '<h1>من نحن</h1><p>نحن أكاديمية تعليم إسلامي عبر الإنترنت ملتزمة بتقديم تجارب تعليمية عالية الجودة. يتمتع فريقنا من العلماء والمعلمين المؤهلين بسنوات من الخبرة.</p>', status: 'published', created_by: caller.id },
          { title: 'Contact Us', title_ar: 'اتصل بنا', slug: 'contact-us', content: '<h1>Contact Us</h1><p>We would love to hear from you! Reach out to us for any questions or feedback.</p><h2>Email</h2><p>info@academy.com</p><h2>Phone</h2><p>+1 234 567 890</p><h2>Address</h2><p>123 Education Street, Knowledge City</p>', content_ar: '<h1>اتصل بنا</h1><p>يسعدنا سماع رأيك! تواصل معنا لأي أسئلة أو ملاحظات.</p>', status: 'published', created_by: caller.id },
          { title: 'FAQ', title_ar: 'الأسئلة الشائعة', slug: 'faq', content: '<h1>Frequently Asked Questions</h1><h3>How do I enroll?</h3><p>Simply create an account and browse our courses.</p><h3>What are the class timings?</h3><p>Classes are scheduled based on your availability.</p><h3>Do you offer certificates?</h3><p>Yes, certificates are issued upon course completion.</p>', content_ar: '<h1>الأسئلة الشائعة</h1><h3>كيف أسجل؟</h3><p>ببساطة أنشئ حساباً وتصفح دوراتنا.</p>', status: 'published', created_by: caller.id },
          { title: 'Our Teachers', title_ar: 'معلمونا', slug: 'our-teachers', content: '<h1>Our Teachers</h1><p>Our teachers are certified scholars with ijazah in Quran recitation and years of teaching experience.</p>', content_ar: '<h1>معلمونا</h1><p>معلمونا علماء معتمدون حاصلون على إجازة في تلاوة القرآن وسنوات من الخبرة التدريسية.</p>', status: 'published', created_by: caller.id },
          { title: 'Terms of Service', title_ar: 'شروط الخدمة', slug: 'terms-of-service', content: '<h1>Terms of Service</h1><p>By using our platform, you agree to our terms and conditions.</p>', content_ar: '<h1>شروط الخدمة</h1><p>باستخدام منصتنا، فإنك توافق على الشروط والأحكام الخاصة بنا.</p>', status: 'draft', created_by: caller.id },
        ]
        const pagesInsert = allPages.slice(0, qty.pages)
        const { data: createdPages } = await adminClient.from('website_pages').insert(pagesInsert).select('id')
        counts.pages = createdPages?.length || 0

        // Pricing packages
        const allPackages = [
          { title: 'Basic', title_ar: 'أساسي', subtitle: 'Perfect for beginners', subtitle_ar: 'مثالي للمبتدئين', billing_cycle: 'monthly', regular_price: 29, sale_price: null, max_courses: 2, max_students: 5, max_teachers: 1, is_featured: false, is_active: true, sort_order: 0, features: JSON.stringify([{ text: '2 Courses', text_ar: '2 دورات' }, { text: 'Basic Support', text_ar: 'دعم أساسي' }, { text: 'Email Notifications', text_ar: 'إشعارات البريد' }]) },
          { title: 'Standard', title_ar: 'قياسي', subtitle: 'Most popular choice', subtitle_ar: 'الخيار الأكثر شيوعاً', billing_cycle: 'monthly', regular_price: 59, sale_price: 49, max_courses: 5, max_students: 20, max_teachers: 3, is_featured: true, is_active: true, sort_order: 1, features: JSON.stringify([{ text: '5 Courses', text_ar: '5 دورات' }, { text: 'Priority Support', text_ar: 'دعم أولوية' }, { text: 'Certificates', text_ar: 'شهادات' }, { text: 'Chat Access', text_ar: 'وصول للمحادثات' }]) },
          { title: 'Premium', title_ar: 'متميز', subtitle: 'For serious learners', subtitle_ar: 'للمتعلمين الجادين', billing_cycle: 'monthly', regular_price: 99, sale_price: null, max_courses: 15, max_students: 50, max_teachers: 5, is_featured: false, is_active: true, sort_order: 2, features: JSON.stringify([{ text: 'Unlimited Courses', text_ar: 'دورات غير محدودة' }, { text: '24/7 Support', text_ar: 'دعم على مدار الساعة' }, { text: 'All Features', text_ar: 'جميع الميزات' }, { text: 'Custom Reports', text_ar: 'تقارير مخصصة' }]) },
          { title: 'Enterprise', title_ar: 'مؤسسات', subtitle: 'For organizations', subtitle_ar: 'للمؤسسات', billing_cycle: 'yearly', regular_price: 999, sale_price: 799, max_courses: 100, max_students: 500, max_teachers: 20, is_featured: false, is_active: true, sort_order: 3, features: JSON.stringify([{ text: 'Unlimited Everything', text_ar: 'كل شيء غير محدود' }, { text: 'Dedicated Support', text_ar: 'دعم مخصص' }, { text: 'White Label', text_ar: 'علامة بيضاء' }, { text: 'API Access', text_ar: 'وصول API' }]) },
        ]
        const pkgsInsert = allPackages.slice(0, qty.packages)
        const { data: createdPkgs } = await adminClient.from('pricing_packages').insert(pkgsInsert).select('id')
        counts.packages = createdPkgs?.length || 0
      }

    }

    // ==================== EXPORT ALL ====================
    if (action === 'export_all') {
      const tableNames = ['courses', 'course_sections', 'lesson_sections', 'lessons', 'course_tracks', 'course_categories', 'course_levels', 'students', 'teachers', 'profiles', 'user_roles', 'subscriptions', 'invoices', 'timetable_entries', 'attendance', 'announcements', 'notifications', 'chats', 'chat_messages', 'support_tickets', 'certificates', 'student_progress', 'blog_posts', 'website_pages', 'pricing_packages']
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
      await countAndDelete('lesson_sections', adminClient.from('lesson_sections').delete().neq('id', matchAll))
      await countAndDelete('course_sections', adminClient.from('course_sections').delete().neq('id', matchAll))
      await countAndDelete('courses', adminClient.from('courses').delete().neq('id', matchAll))
      await countAndDelete('course_tracks', adminClient.from('course_tracks').delete().neq('id', matchAll))
      await countAndDelete('course_categories', adminClient.from('course_categories').delete().neq('id', matchAll))
      await countAndDelete('course_levels', adminClient.from('course_levels').delete().neq('id', matchAll))
      await countAndDelete('notifications', adminClient.from('notifications').delete().neq('id', matchAll))
      await countAndDelete('announcements', adminClient.from('announcements').delete().neq('id', matchAll))
      await countAndDelete('support_tickets', adminClient.from('support_tickets').delete().neq('id', matchAll))
      await countAndDelete('blog_posts', adminClient.from('blog_posts').delete().neq('id', matchAll))
      await countAndDelete('website_pages', adminClient.from('website_pages').delete().neq('id', matchAll))
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
      await countAndDelete('lesson_sections')
      await countAndDelete('course_sections')
      await countAndDelete('courses')
      await countAndDelete('course_tracks')
      await countAndDelete('course_categories')
      await countAndDelete('course_levels')
      await countAndDelete('notifications')
      await countAndDelete('announcements')
      await countAndDelete('support_tickets')
      await countAndDelete('blog_posts')
      await countAndDelete('website_pages')
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

    // ==================== ENCRYPTION HELPERS ====================
    const ENCRYPTION_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    async function deriveKey(secret: string): Promise<CryptoKey> {
      const enc = new TextEncoder()
      const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(secret), 'PBKDF2', false, ['deriveKey'])
      return crypto.subtle.deriveKey(
        { name: 'PBKDF2', salt: enc.encode('payment-gateway-salt'), iterations: 100000, hash: 'SHA-256' },
        keyMaterial,
        { name: 'AES-GCM', length: 256 },
        false,
        ['encrypt', 'decrypt']
      )
    }

    async function encryptPayload(plaintext: string): Promise<string> {
      const key = await deriveKey(ENCRYPTION_KEY)
      const iv = crypto.getRandomValues(new Uint8Array(12))
      const enc = new TextEncoder()
      const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plaintext))
      const combined = new Uint8Array(iv.length + new Uint8Array(ciphertext).length)
      combined.set(iv)
      combined.set(new Uint8Array(ciphertext), iv.length)
      // Base64 encode
      let binary = ''
      for (const byte of combined) binary += String.fromCharCode(byte)
      return btoa(binary)
    }

    async function decryptPayload(encoded: string): Promise<string> {
      const key = await deriveKey(ENCRYPTION_KEY)
      // Base64 decode
      const binary = atob(encoded)
      const combined = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) combined[i] = binary.charCodeAt(i)
      const iv = combined.slice(0, 12)
      const ciphertext = combined.slice(12)
      const decrypted = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ciphertext)
      return new TextDecoder().decode(decrypted)
    }

    // ==================== STORE PAYMENT KEYS ====================
    if (action === 'store_payment_keys') {
      const { gateway, keys } = body
      if (!gateway || typeof gateway !== 'string') {
        return new Response(JSON.stringify({ error: 'Missing gateway id' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      // Encrypt the keys JSON before storing
      const encryptedValue = await encryptPayload(JSON.stringify(keys || {}))

      const { error } = await adminClient
        .from('payment_gateway_config')
        .upsert({
          gateway_id: gateway,
          encrypted_keys: { cipher: encryptedValue },
          is_active: true,
          updated_at: new Date().toISOString(),
          updated_by: caller.id,
        }, { onConflict: 'gateway_id' })

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      return new Response(JSON.stringify({ success: true }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    // ==================== GET PAYMENT KEYS (masked) ====================
    if (action === 'get_payment_keys') {
      const { data, error } = await adminClient
        .from('payment_gateway_config')
        .select('gateway_id, encrypted_keys, is_active, updated_at')

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
      }

      const masked = []
      for (const row of (data || [])) {
        const maskedKeys: Record<string, string> = {}
        try {
          const rawKeys = row.encrypted_keys as Record<string, any>
          let decryptedKeys: Record<string, string> = {}
          
          if (rawKeys?.cipher && typeof rawKeys.cipher === 'string') {
            // New encrypted format
            const decrypted = await decryptPayload(rawKeys.cipher)
            decryptedKeys = JSON.parse(decrypted)
          } else {
            // Legacy plaintext format (backwards compat)
            decryptedKeys = rawKeys as Record<string, string>
          }

          for (const [key, value] of Object.entries(decryptedKeys)) {
            if (typeof value === 'string' && value.length > 4) {
              maskedKeys[key] = '•'.repeat(value.length - 4) + value.slice(-4)
            } else if (typeof value === 'string') {
              maskedKeys[key] = '••••'
            }
          }
        } catch (_) {
          // If decryption fails, show empty masked keys
        }
        masked.push({
          gateway_id: row.gateway_id,
          masked_keys: maskedKeys,
          is_active: row.is_active,
          updated_at: row.updated_at,
        })
      }

      return new Response(JSON.stringify({ success: true, gateways: masked }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  } catch (err) {
    console.error('manage-accounts error:', err)
    return new Response(JSON.stringify({ error: 'An internal error occurred' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
  }
})
