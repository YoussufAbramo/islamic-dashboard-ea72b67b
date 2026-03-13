import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

// ─── helpers ───────────────────────────────────────────────────────────
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const pickN = <T>(arr: T[], n: number): T[] => {
  const shuffled = [...arr].sort(() => Math.random() - 0.5)
  return shuffled.slice(0, Math.min(n, arr.length))
}
const randomDate = (daysAgo: number, daysAhead: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo + Math.floor(Math.random() * (daysAgo + daysAhead)))
  return d.toISOString()
}
const randomDateOnly = (daysAgo: number, daysAhead: number): string => randomDate(daysAgo, daysAhead).split('T')[0]
const uuid = () => crypto.randomUUID()

// ─── data pools ────────────────────────────────────────────────────────
const FIRST_NAMES = ['Ahmed', 'Sara', 'Omar', 'Fatima', 'Youssef', 'Layla', 'Khaled', 'Nour', 'Zeinab', 'Hassan', 'Aisha', 'Ibrahim', 'Maryam', 'Ali', 'Huda', 'Tariq', 'Rania', 'Bilal', 'Samira', 'Hamza']
const LAST_NAMES = ['Ali', 'Hassan', 'Khalil', 'Noor', 'Mahmoud', 'Ibrahim', 'Mostafa', 'Adel', 'Samir', 'Reda', 'Saleh', 'Youssef', 'Khan', 'Mohamed', 'Ahmed', 'Rashid', 'Kamal', 'Bakr', 'Osman', 'Farouk']
const SPECS = ['Quran Memorization', 'Arabic Language', 'Islamic Fiqh', 'Tajweed', 'Hadith Sciences', 'Islamic History', 'Aqeedah', 'Tafseer']
const TITLES_TEACHER = ['Dr.', 'Prof.', 'Sheikh', 'Ustadh', 'Ustadha']
const BIOS = [
  'PhD in Islamic Studies with 10+ years of teaching experience.',
  'Certified Quran reciter with ijazah in multiple qira\'at.',
  'Professor of Arabic Literature specializing in grammar and rhetoric.',
  'Expert in Islamic jurisprudence and comparative fiqh.',
  'Experienced educator with a focus on modern teaching methods.',
  'Specialist in early Islamic history and prophetic biography.',
]

const COURSE_TITLES = [
  { en: 'Quran Memorization - Juz Amma', ar: 'حفظ القرآن - جزء عم' },
  { en: 'Arabic Language Fundamentals', ar: 'أساسيات اللغة العربية' },
  { en: 'Islamic Studies & Fiqh', ar: 'الدراسات الإسلامية والفقه' },
  { en: 'Tajweed Rules', ar: 'أحكام التجويد' },
  { en: 'Hadith Sciences', ar: 'علوم الحديث' },
  { en: 'Islamic History', ar: 'التاريخ الإسلامي' },
  { en: 'Quran Tafseer', ar: 'تفسير القرآن' },
  { en: 'Arabic Conversation', ar: 'محادثة عربية' },
  { en: 'Aqeedah Foundations', ar: 'أسس العقيدة' },
  { en: 'Seerah of the Prophet', ar: 'السيرة النبوية' },
]

const TRACK_TITLES = [
  { en: 'Quran Track', ar: 'مسار القرآن' }, { en: 'Arabic Track', ar: 'مسار اللغة العربية' },
  { en: 'Islamic Studies Track', ar: 'مسار الدراسات الإسلامية' }, { en: 'Hadith Track', ar: 'مسار الحديث' },
]
const CAT_TITLES = [
  { en: 'Memorization', ar: 'حفظ' }, { en: 'Language', ar: 'لغة' },
  { en: 'Fiqh & Aqeedah', ar: 'فقه وعقيدة' }, { en: 'Tajweed', ar: 'تجويد' },
  { en: 'History & Seerah', ar: 'تاريخ وسيرة' },
]
const LEVEL_TITLES = [
  { en: 'Beginner', ar: 'مبتدئ' }, { en: 'Intermediate', ar: 'متوسط' },
  { en: 'Advanced', ar: 'متقدم' }, { en: 'Expert', ar: 'خبير' },
]
const SECTION_TITLES = [
  { en: 'Introduction & Basics', ar: 'المقدمة والأساسيات' },
  { en: 'Core Content', ar: 'المحتوى الأساسي' },
  { en: 'Advanced Topics', ar: 'مواضيع متقدمة' },
  { en: 'Practice & Review', ar: 'التمارين والمراجعة' },
]
const LESSON_TYPES = ['read_listen', 'memorization', 'revision', 'exercise_choose_correct', 'exercise_true_false', 'homework']

const BLOG_TITLES = [
  { en: 'Welcome to Our Academy', ar: 'مرحباً بكم في أكاديميتنا', slug: 'welcome-academy' },
  { en: 'Tips for Effective Quran Memorization', ar: 'نصائح لحفظ القرآن بفعالية', slug: 'quran-memorization-tips' },
  { en: 'The Importance of Learning Arabic', ar: 'أهمية تعلم اللغة العربية', slug: 'importance-of-arabic' },
  { en: 'Understanding Tajweed Rules', ar: 'فهم أحكام التجويد', slug: 'understanding-tajweed' },
  { en: 'Student Success Stories', ar: 'قصص نجاح الطلاب', slug: 'student-success-stories' },
  { en: 'New Courses Coming Soon', ar: 'دورات جديدة قريباً', slug: 'new-courses-coming' },
]

const TICKET_SUBJECTS = [
  'Cannot access course materials', 'Payment not reflected', 'Request for schedule change',
  'Certificate not received', 'App crashes on mobile', 'Refund request',
  'Login issue', 'Video not loading', 'Exam grade dispute',
]

const ANNOUNCEMENT_TITLES = [
  { en: 'Welcome to the New Semester', ar: 'مرحباً بالفصل الدراسي الجديد' },
  { en: 'Exam Schedule Released', ar: 'تم نشر جدول الامتحانات' },
  { en: 'Teacher Meeting This Friday', ar: 'اجتماع المعلمين يوم الجمعة' },
  { en: 'Holiday Schedule', ar: 'جدول الإجازات' },
  { en: 'New Course Available', ar: 'دورة جديدة متاحة' },
]

// ─── tracking helper ───────────────────────────────────────────────────
async function trackRecords(
  adminClient: any,
  sessionId: string,
  tableName: string,
  ids: string[]
) {
  if (ids.length === 0) return
  const rows = ids.map(id => ({ session_id: sessionId, table_name: tableName, record_id: id }))
  // batch in chunks of 500
  for (let i = 0; i < rows.length; i += 500) {
    await adminClient.from('seed_records').insert(rows.slice(i, i + 500))
  }
}

// ─── dedup helper: filter out items whose title/name already exists ────
async function dedup<T extends Record<string, any>>(
  adminClient: any,
  table: string,
  items: T[],
  field: string = 'title'
): Promise<T[]> {
  if (items.length === 0) return []
  const titles = items.map(i => i[field]).filter(Boolean)
  if (titles.length === 0) return items
  const { data: existing } = await adminClient.from(table).select(field).in(field, titles)
  if (!existing || existing.length === 0) return items
  const existingSet = new Set(existing.map((e: any) => e[field]))
  return items.filter(i => !existingSet.has(i[field]))
}

// ─── main handler ──────────────────────────────────────────────────────
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  const json = (data: any, status = 200) =>
    new Response(JSON.stringify(data), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } })

  try {
    // Auth check
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) return json({ error: 'Missing authorization' }, 401)

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

    const callerClient = createClient(supabaseUrl, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authHeader } },
    })
    const { data: { user: caller } } = await callerClient.auth.getUser()
    if (!caller) return json({ error: 'Unauthorized' }, 401)

    const admin = createClient(supabaseUrl, serviceRoleKey)
    const { data: roleData } = await admin.from('user_roles').select('role').eq('user_id', caller.id).single()
    if (roleData?.role !== 'admin') return json({ error: 'Admin access required' }, 403)

    const body = await req.json()
    const { action } = body

    // ══════════════════════════════════════════════════════════════════
    // LIST SESSIONS
    // ══════════════════════════════════════════════════════════════════
    if (action === 'list_sessions') {
      const { data } = await admin.from('seed_sessions')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)
      return json({ sessions: data || [] })
    }

    // ══════════════════════════════════════════════════════════════════
    // SEED
    // ══════════════════════════════════════════════════════════════════
    if (action === 'seed') {
      const categories: string[] = body.categories || []
      const multiplier: number = Math.min(Math.max(Number(body.multiplier) || 3, 1), 10)
      if (categories.length === 0) return json({ error: 'No categories selected' }, 400)

      // Create session
      const sessionId = uuid()
      await admin.from('seed_sessions').insert({
        id: sessionId,
        created_by: caller.id,
        status: 'running',
        categories,
        multiplier,
      })

      const counts: Record<string, number> = {}
      const errors: string[] = []
      const callerId = caller.id

      // Quantity calculations
      const qty = {
        students: multiplier * 2,
        teachers: Math.max(1, Math.ceil(multiplier * 0.8)),
        courses: Math.max(1, Math.ceil(multiplier * 0.6)),
        tracks: Math.max(1, Math.ceil(multiplier * 0.4)),
        categories: Math.max(1, Math.ceil(multiplier * 0.5)),
        levels: Math.max(1, Math.ceil(multiplier * 0.5)),
        sections: Math.max(2, Math.ceil(multiplier * 0.8)),
        lessonSections: Math.max(1, Math.ceil(multiplier * 0.5)),
        lessonsPerSection: Math.max(1, Math.ceil(multiplier * 0.4)),
        timetable: multiplier * 3,
        invoices: multiplier * 2,
        announcements: Math.max(1, Math.ceil(multiplier * 0.5)),
        notifications: multiplier,
        chats: Math.max(1, Math.ceil(multiplier * 0.5)),
        tickets: Math.max(1, multiplier),
        certs: Math.max(1, Math.ceil(multiplier * 0.5)),
        blogs: Math.max(1, Math.ceil(multiplier * 0.6)),
        pages: Math.max(1, Math.ceil(multiplier * 0.5)),
        packages: Math.max(1, Math.ceil(multiplier * 0.4)),
      }

      try {
        // ── STUDENTS ──
        const studentUserIds: string[] = []
        if (categories.includes('students')) {
          for (let i = 0; i < qty.students; i++) {
            const fn = pick(FIRST_NAMES)
            const ln = pick(LAST_NAMES)
            const email = `seed-${sessionId.slice(0,8)}-s${i+1}@sample.edu`
            try {
              const { data: newUser, error } = await admin.auth.admin.createUser({
                email, password: crypto.randomUUID(), email_confirm: true,
                user_metadata: { full_name: `${fn} ${ln}`, phone: `+20100000${String(1000 + i).slice(1)}` }
              })
              if (!error && newUser.user) {
                studentUserIds.push(newUser.user.id)
                await trackRecords(admin, sessionId, 'auth_users', [newUser.user.id])
                await trackRecords(admin, sessionId, 'profiles', [newUser.user.id])
                await trackRecords(admin, sessionId, 'user_roles', [newUser.user.id])
                // Track the auto-created student record
                const { data: sRec } = await admin.from('students').select('id').eq('user_id', newUser.user.id).single()
                if (sRec) await trackRecords(admin, sessionId, 'students', [sRec.id])
              }
            } catch (e: any) { errors.push(`Student ${i+1}: ${e.message}`) }
          }
          counts.students = studentUserIds.length
        }

        // ── TEACHERS ──
        const teacherUserIds: string[] = []
        if (categories.includes('teachers')) {
          for (let i = 0; i < qty.teachers; i++) {
            const fn = pick(FIRST_NAMES)
            const ln = pick(LAST_NAMES)
            const title = pick(TITLES_TEACHER)
            const email = `seed-${sessionId.slice(0,8)}-t${i+1}@sample.edu`
            try {
              const { data: newUser, error } = await admin.auth.admin.createUser({
                email, password: crypto.randomUUID(), email_confirm: true,
                user_metadata: { full_name: `${title} ${fn} ${ln}`, phone: `+20110000${String(1000 + i).slice(1)}` }
              })
              if (!error && newUser.user) {
                teacherUserIds.push(newUser.user.id)
                await trackRecords(admin, sessionId, 'auth_users', [newUser.user.id])
                await trackRecords(admin, sessionId, 'profiles', [newUser.user.id])

                await admin.from('user_roles').update({ role: 'teacher' }).eq('user_id', newUser.user.id)
                await trackRecords(admin, sessionId, 'user_roles', [newUser.user.id])

                // Delete auto-created student, create teacher
                const { data: autoStudent } = await admin.from('students').select('id').eq('user_id', newUser.user.id).single()
                if (autoStudent) await admin.from('students').delete().eq('id', autoStudent.id)

                const { data: tRec } = await admin.from('teachers').insert({
                  user_id: newUser.user.id,
                  specialization: pick(SPECS),
                  bio: pick(BIOS),
                  title: title,
                }).select('id').single()
                if (tRec) await trackRecords(admin, sessionId, 'teachers', [tRec.id])
                counts.teachers = (counts.teachers || 0) + 1
              }
            } catch (e: any) { errors.push(`Teacher ${i+1}: ${e.message}`) }
          }
        }

        // Get all students/teachers for relational seeding
        const { data: allStudents } = await admin.from('students').select('id, user_id')
        const { data: allTeachers } = await admin.from('teachers').select('id, user_id')
        const sIds = (allStudents || []).map(s => s.id)
        const tIds = (allTeachers || []).map(t => t.id)
        const sUserIds = (allStudents || []).map(s => s.user_id)
        const tUserIds = (allTeachers || []).map(t => t.user_id)

        // Assign seeded students to teachers
        if (studentUserIds.length > 0 && tIds.length > 0) {
          for (let i = 0; i < studentUserIds.length; i++) {
            await admin.from('students').update({
              assigned_teacher_id: tIds[i % tIds.length],
              lesson_duration: [30, 45, 60][i % 3],
              weekly_repeat: [2, 3, 4][i % 3]
            }).eq('user_id', studentUserIds[i])
          }
        }

        // ── COURSES (tracks, categories, levels, sections, lessons) ──
        let cIds: string[] = []
        if (categories.includes('courses')) {
          // Tracks
          const tracksRaw = pickN(TRACK_TITLES, qty.tracks).map((t, i) => ({
            title: t.en, title_ar: t.ar, sort_order: i,
            description: `${t.en} description`, description_ar: `وصف ${t.ar}`,
          }))
          const tracksInsert = await dedup(admin, 'course_tracks', tracksRaw)
          const { data: createdTracks } = tracksInsert.length > 0
            ? await admin.from('course_tracks').insert(tracksInsert).select('id')
            : { data: [] }
          const trackIds = (createdTracks || []).map(t => t.id)
          // Also get existing track IDs for FK references
          const { data: allTrackRows } = await admin.from('course_tracks').select('id').limit(50)
          const allTrackIds = (allTrackRows || []).map(t => t.id)
          await trackRecords(admin, sessionId, 'course_tracks', trackIds)
          counts.tracks = trackIds.length

          // Categories
          const catsRaw = pickN(CAT_TITLES, qty.categories).map((c, i) => ({
            title: c.en, title_ar: c.ar, sort_order: i,
            description: `${c.en} courses`, description_ar: `دورات ${c.ar}`,
          }))
          const catsInsert = await dedup(admin, 'course_categories', catsRaw)
          const { data: createdCats } = catsInsert.length > 0
            ? await admin.from('course_categories').insert(catsInsert).select('id')
            : { data: [] }
          const catIds = (createdCats || []).map(c => c.id)
          const { data: allCatRows } = await admin.from('course_categories').select('id').limit(50)
          const allCatIds = (allCatRows || []).map(c => c.id)
          await trackRecords(admin, sessionId, 'course_categories', catIds)
          counts.categories = catIds.length

          // Levels
          const levelsRaw = pickN(LEVEL_TITLES, qty.levels).map((l, i) => ({
            title: l.en, title_ar: l.ar, sort_order: i,
            description: `For ${l.en.toLowerCase()} learners`, description_ar: `للمتعلمين ${l.ar}`,
          }))
          const levelsInsert = await dedup(admin, 'course_levels', levelsRaw)
          const { data: createdLevels } = levelsInsert.length > 0
            ? await admin.from('course_levels').insert(levelsInsert).select('id')
            : { data: [] }
          const levelIds = (createdLevels || []).map(l => l.id)
          const { data: allLevelRows } = await admin.from('course_levels').select('id').limit(50)
          const allLevelIds = (allLevelRows || []).map(l => l.id)
          await trackRecords(admin, sessionId, 'course_levels', levelIds)
          counts.levels = levelIds.length

          // Courses
          const coursesRaw = pickN(COURSE_TITLES, qty.courses).map((c, i) => ({
            title: c.en, title_ar: c.ar, status: 'active', created_by: callerId,
            description: `Complete course: ${c.en}`, description_ar: `دورة كاملة: ${c.ar}`,
            category_id: allCatIds.length > 0 ? allCatIds[i % allCatIds.length] : null,
            level_id: allLevelIds.length > 0 ? allLevelIds[i % allLevelIds.length] : null,
            track_id: allTrackIds.length > 0 ? allTrackIds[i % allTrackIds.length] : null,
          }))
          const coursesInsert = await dedup(admin, 'courses', coursesRaw)
          const { data: createdCourses } = coursesInsert.length > 0
            ? await admin.from('courses').insert(coursesInsert).select('id')
            : { data: [] }
          cIds = (createdCourses || []).map(c => c.id)
          await trackRecords(admin, sessionId, 'courses', cIds)
          counts.courses = cIds.length

          // Assign teachers to courses
          if (tIds.length > 0 && cIds.length > 0) {
            const tcInsert = cIds.map((cid, i) => ({
              teacher_id: tIds[i % tIds.length], course_id: cid,
            }))
            const { data: createdTC } = await admin.from('teacher_courses').insert(tcInsert).select('id')
            await trackRecords(admin, sessionId, 'teacher_courses', (createdTC || []).map(tc => tc.id))
          }

          // Course sections
          const sectionsInsert = cIds.flatMap(cid =>
            pickN(SECTION_TITLES, qty.sections).map((s, i) => ({
              course_id: cid, title: s.en, title_ar: s.ar, sort_order: i
            }))
          )
          const { data: createdSections } = await admin.from('course_sections').insert(sectionsInsert).select('id')
          const secIds = (createdSections || []).map(s => s.id)
          await trackRecords(admin, sessionId, 'course_sections', secIds)
          counts.sections = secIds.length

          // Lesson sections
          const lSecInsert = secIds.flatMap(sid =>
            Array.from({ length: qty.lessonSections }, (_, i) => ({
              course_section_id: sid, title: `Part ${i + 1}`, title_ar: `الجزء ${i + 1}`, sort_order: i
            }))
          )
          const { data: createdLSecs } = await admin.from('lesson_sections').insert(lSecInsert).select('id')
          const lSecIds = (createdLSecs || []).map(s => s.id)
          await trackRecords(admin, sessionId, 'lesson_sections', lSecIds)
          counts.lesson_sections = lSecIds.length

          // Lessons
          const lessonsInsert = lSecIds.flatMap((sid, si) =>
            Array.from({ length: qty.lessonsPerSection }, (_, li) => ({
              section_id: sid, title: `Lesson ${si * qty.lessonsPerSection + li + 1}`,
              title_ar: `الدرس ${si * qty.lessonsPerSection + li + 1}`,
              sort_order: li, lesson_type: LESSON_TYPES[(si + li) % LESSON_TYPES.length],
              content: { text: 'Sample lesson content', text_ar: 'محتوى درس تجريبي' }
            }))
          )
          const { data: createdLessons } = await admin.from('lessons').insert(lessonsInsert).select('id')
          const lessonIds = (createdLessons || []).map(l => l.id)
          await trackRecords(admin, sessionId, 'lessons', lessonIds)
          counts.lessons = lessonIds.length
        }

        // Get existing courses if needed
        if (cIds.length === 0) {
          const { data: ec } = await admin.from('courses').select('id').limit(10)
          cIds = (ec || []).map(c => c.id)
        }

        // ── BILLING (subscriptions + invoices) ──
        let createdSubIds: string[] = []
        if (categories.includes('billing') && sIds.length > 0 && cIds.length > 0 && tIds.length > 0) {
          const MEET_URLS = [
            'https://meet.google.com/abc-defg-hij',
            'https://meet.google.com/xyz-uvwx-rst',
            'https://meet.google.com/klm-nopq-stu',
          ]
          const ZOOM_URLS = [
            'https://zoom.us/j/1234567890',
            'https://zoom.us/j/9876543210',
            'https://zoom.us/j/5555555555',
          ]
          const subsInsert = sIds.slice(0, Math.min(sIds.length, qty.invoices)).map((sid, i) => {
            const subType = ['monthly', 'quarterly', 'yearly'][i % 3]
            const renewalDays = subType === 'yearly' ? 365 : subType === 'quarterly' ? 88 : 28
            const startDate = randomDateOnly(30, 0)
            const renewalDate = new Date(startDate)
            renewalDate.setDate(renewalDate.getDate() + renewalDays)
            return {
              student_id: sid, course_id: cIds[i % cIds.length], teacher_id: tIds[i % tIds.length],
              status: i === 0 ? 'expired' : 'active',
              subscription_type: subType,
              price: [50, 100, 75, 120, 80][i % 5],
              start_date: startDate,
              renewal_date: renewalDate.toISOString().split('T')[0],
              google_meet_url: MEET_URLS[i % MEET_URLS.length],
              zoom_url: ZOOM_URLS[i % ZOOM_URLS.length],
            }
          })
          const { data: subs } = await admin.from('subscriptions').insert(subsInsert).select('id, student_id, course_id, price, subscription_type')
          const subRows = subs || []
          createdSubIds = subRows.map(s => s.id)
          await trackRecords(admin, sessionId, 'subscriptions', createdSubIds)
          counts.subscriptions = createdSubIds.length

          // Invoices
          if (subRows.length > 0) {
            const statuses = ['pending', 'paid', 'overdue', 'cancelled']
            const invoicesInsert = Array.from({ length: Math.min(qty.invoices, subRows.length * 2) }, (_, i) => {
              const sub = subRows[i % subRows.length]
              const status = statuses[i % statuses.length]
              const amount = sub.price || 50
              return {
                subscription_id: sub.id, student_id: sub.student_id,
                course_id: sub.course_id || null,
                amount, original_price: amount,
                sale_price: i % 3 === 0 ? Math.round(amount * 0.8) : null,
                billing_cycle: sub.subscription_type || 'monthly',
                due_date: randomDateOnly(status === 'overdue' ? 0 : -30, status === 'overdue' ? -1 : 30),
                status,
                paid_at: status === 'paid' ? randomDate(10, 0) : null,
                notes: status === 'paid' ? 'Payment received' : '',
              }
            })
            const { data: createdInv } = await admin.from('invoices').insert(invoicesInsert).select('id')
            const invIds = (createdInv || []).map(inv => inv.id)
            await trackRecords(admin, sessionId, 'invoices', invIds)
            counts.invoices = invIds.length
          }
        }

        // ── SCHEDULE (timetable + attendance) ──
        if (categories.includes('schedule') && sIds.length > 0 && tIds.length > 0 && cIds.length > 0) {
          const now = new Date()
          const ttInsert = Array.from({ length: qty.timetable }, (_, i) => {
            const d = new Date(now)
            d.setDate(d.getDate() + i - Math.floor(qty.timetable / 3))
            d.setHours(8 + (i % 6), 0, 0, 0)
            return {
              student_id: sIds[i % sIds.length], teacher_id: tIds[i % tIds.length],
              course_id: cIds[i % cIds.length], scheduled_at: d.toISOString(),
              duration_minutes: [30, 45, 60][i % 3],
              status: i < Math.floor(qty.timetable / 3) ? 'completed' : i === qty.timetable - 1 ? 'cancelled' : 'scheduled',
            }
          })
          const { data: createdTT } = await admin.from('timetable_entries').insert(ttInsert).select('id')
          const ttIds = (createdTT || []).map(t => t.id)
          await trackRecords(admin, sessionId, 'timetable_entries', ttIds)
          counts.timetable = ttIds.length

          // Attendance for completed entries
          const completedTT = (createdTT || []).filter((_, i) => i < Math.floor(qty.timetable / 3))
          if (completedTT.length > 0) {
            const attInsert = completedTT.map((tt, i) => ({
              timetable_entry_id: tt.id, student_id: sIds[i % sIds.length],
              status: i % 3 === 2 ? 'absent' : 'present',
              notes: i % 3 === 2 ? 'Student was absent' : '',
            }))
            const { data: createdAtt } = await admin.from('attendance').insert(attInsert).select('id')
            const attIds = (createdAtt || []).map(a => a.id)
            await trackRecords(admin, sessionId, 'attendance', attIds)
            counts.attendance = attIds.length
          }
        }

        // ── COMMUNICATIONS (announcements + notifications) ──
        if (categories.includes('communications')) {
          const annInsert = pickN(ANNOUNCEMENT_TITLES, qty.announcements).map(a => ({
            title: a.en, title_ar: a.ar,
            content: `${a.en} - details and information.`,
            content_ar: `${a.ar} - تفاصيل ومعلومات.`,
            target_audience: pick(['all', 'students', 'teachers']),
            created_by: callerId, is_active: true,
          }))
          const { data: createdAnn } = await admin.from('announcements').insert(annInsert).select('id')
          const annIds = (createdAnn || []).map(a => a.id)
          await trackRecords(admin, sessionId, 'announcements', annIds)
          counts.announcements = annIds.length

          const notifInsert = Array.from({ length: qty.notifications }, (_, i) => ({
            user_id: callerId,
            title: `Sample Notification ${i + 1}`,
            message: `This is a sample notification message #${i + 1}`,
            link: pick(['/dashboard/students', '/dashboard/courses', '/dashboard/subscriptions', '/dashboard/support']),
          }))
          const { data: createdNotif } = await admin.from('notifications').insert(notifInsert).select('id')
          const notifIds = (createdNotif || []).map(n => n.id)
          await trackRecords(admin, sessionId, 'notifications', notifIds)
          counts.notifications = notifIds.length
        }

        // ── SUPPORT (chats, messages, tickets) ──
        if (categories.includes('support')) {
          // Chats & messages
          if (sIds.length > 0 && tIds.length > 0) {
            const chatCount = Math.min(qty.chats, sIds.length, tIds.length)
            const chatsInsert = Array.from({ length: chatCount }, (_, i) => ({
              student_id: sIds[i % sIds.length], teacher_id: tIds[i % tIds.length],
              name: pick(['Quran Progress', 'Arabic Help', 'Fiqh Discussion', 'General Chat']),
              is_group: false,
            }))
            const { data: createdChats } = await admin.from('chats').insert(chatsInsert).select('id')
            const chatIds = (createdChats || []).map(c => c.id)
            await trackRecords(admin, sessionId, 'chats', chatIds)
            counts.chats = chatIds.length

            if (chatIds.length > 0 && sUserIds.length > 0 && tUserIds.length > 0) {
              const msgsInsert: any[] = []
              for (let i = 0; i < chatIds.length; i++) {
                msgsInsert.push(
                  { chat_id: chatIds[i], sender_id: tUserIds[i % tUserIds.length], message: 'Assalamu alaikum! How is your progress?' },
                  { chat_id: chatIds[i], sender_id: sUserIds[i % sUserIds.length], message: 'Wa alaikum assalam! Alhamdulillah, going well.' },
                  { chat_id: chatIds[i], sender_id: tUserIds[i % tUserIds.length], message: 'Great! Keep up the good work.' },
                )
              }
              const { data: createdMsgs } = await admin.from('chat_messages').insert(msgsInsert).select('id')
              const msgIds = (createdMsgs || []).map(m => m.id)
              await trackRecords(admin, sessionId, 'chat_messages', msgIds)
              counts.messages = msgIds.length
            }
          }

          // Support tickets
          const ticketsInsert = Array.from({ length: qty.tickets }, (_, i) => ({
            name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
            email: `ticket-${i+1}@sample.edu`,
            subject: pick(TICKET_SUBJECTS),
            message: 'This is a sample support ticket for testing purposes.',
            department: pick(['technical', 'billing', 'general']),
            priority: pick(['low', 'medium', 'high']),
            status: pick(['open', 'in_progress', 'resolved', 'closed']),
            user_id: callerId,
          }))
          const { data: createdTickets } = await admin.from('support_tickets').insert(ticketsInsert).select('id')
          const ticketIds = (createdTickets || []).map(t => t.id)
          await trackRecords(admin, sessionId, 'support_tickets', ticketIds)
          counts.tickets = ticketIds.length
        }

        // ── CERTIFICATES ──
        if (categories.includes('certificates') && sIds.length > 0) {
          const certInsert = Array.from({ length: qty.certs }, (_, i) => ({
            recipient_id: sUserIds[i % sUserIds.length] || callerId,
            recipient_type: 'student',
            title: `Certificate of Completion - Course ${i + 1}`,
            title_ar: `شهادة إتمام - الدورة ${i + 1}`,
            description: 'Awarded for successfully completing the course.',
            description_ar: 'تُمنح لإتمام الدورة بنجاح.',
            course_id: cIds.length > 0 ? cIds[i % cIds.length] : null,
            issued_by: callerId,
            status: 'active',
          }))
          const { data: createdCerts } = await admin.from('certificates').insert(certInsert).select('id')
          const certIds = (createdCerts || []).map(c => c.id)
          await trackRecords(admin, sessionId, 'certificates', certIds)
          counts.certificates = certIds.length
        }

        // ── WEBSITE (blogs + pages) ──
        if (categories.includes('website')) {
          const blogInsert = pickN(BLOG_TITLES, qty.blogs).map((b, i) => ({
            title: b.en, title_ar: b.ar, slug: `${b.slug}-${sessionId.slice(0,8)}`,
            excerpt: `${b.en} excerpt`, excerpt_ar: `مقتطف ${b.ar}`,
            content: `<h2>${b.en}</h2><p>Sample content for testing.</p>`,
            content_ar: `<h2>${b.ar}</h2><p>محتوى تجريبي للاختبار.</p>`,
            status: i % 3 === 2 ? 'draft' : 'published',
            published_at: i % 3 === 2 ? null : new Date().toISOString(),
            created_by: callerId,
          }))
          const { data: createdBlogs } = await admin.from('blog_posts').insert(blogInsert).select('id')
          const blogIds = (createdBlogs || []).map(b => b.id)
          await trackRecords(admin, sessionId, 'blog_posts', blogIds)
          counts.blogs = blogIds.length

          const pageInsert = Array.from({ length: qty.pages }, (_, i) => ({
            title: `Sample Page ${i + 1}`, title_ar: `صفحة تجريبية ${i + 1}`,
            slug: `sample-page-${sessionId.slice(0,8)}-${i + 1}`,
            content: `<h1>Sample Page ${i + 1}</h1><p>This is sample page content.</p>`,
            content_ar: `<h1>صفحة تجريبية ${i + 1}</h1><p>هذا محتوى صفحة تجريبية.</p>`,
            status: 'published', created_by: callerId,
          }))
          const { data: createdPages } = await admin.from('website_pages').insert(pageInsert).select('id')
          const pageIds = (createdPages || []).map(p => p.id)
          await trackRecords(admin, sessionId, 'website_pages', pageIds)
          counts.pages = pageIds.length
        }

        // ── PACKAGES ──
        if (categories.includes('packages')) {
          const pkgs = [
            { title: 'Starter', title_ar: 'بداية', subtitle: 'For getting started', subtitle_ar: 'للبداية', regular_price: 19, sale_price: null, max_courses: 1, max_students: 3, max_teachers: 1, is_featured: false },
            { title: 'Growth', title_ar: 'نمو', subtitle: 'Growing institutions', subtitle_ar: 'المؤسسات النامية', regular_price: 79, sale_price: 69, max_courses: 10, max_students: 30, max_teachers: 5, is_featured: true },
            { title: 'Enterprise', title_ar: 'مؤسسات', subtitle: 'For organizations', subtitle_ar: 'للمؤسسات', regular_price: 199, sale_price: null, max_courses: 50, max_students: 200, max_teachers: 15, is_featured: false },
          ]
          const pkgInsert = pkgs.slice(0, qty.packages).map((p, i) => ({
            ...p, billing_cycle: 'monthly', is_active: true, sort_order: 100 + i,
            features: JSON.stringify([{ text: `${p.max_courses} Courses`, text_ar: `${p.max_courses} دورات` }, { text: 'Support', text_ar: 'دعم' }])
          }))
          const { data: createdPkgs } = await admin.from('pricing_packages').insert(pkgInsert).select('id')
          const pkgIds = (createdPkgs || []).map(p => p.id)
          await trackRecords(admin, sessionId, 'pricing_packages', pkgIds)
          counts.packages = pkgIds.length
        }

        // ── EXPENSES (categories + records) ──
        if (categories.includes('expenses')) {
          const expCatInsert = [
            { title: 'Office Supplies', title_ar: 'لوازم مكتبية', color: '#6366f1', sort_order: 0 },
            { title: 'Software', title_ar: 'برمجيات', color: '#8b5cf6', sort_order: 1 },
            { title: 'Marketing', title_ar: 'تسويق', color: '#ec4899', sort_order: 2 },
          ].slice(0, Math.max(1, Math.ceil(multiplier * 0.3)))
          const { data: createdExpCats } = await admin.from('expense_categories').insert(expCatInsert).select('id')
          const expCatIds = (createdExpCats || []).map(c => c.id)
          await trackRecords(admin, sessionId, 'expense_categories', expCatIds)
          counts.expense_categories = expCatIds.length

          if (expCatIds.length > 0) {
            const expInsert = Array.from({ length: Math.max(1, multiplier) }, (_, i) => ({
              title: `Sample Expense ${i + 1}`, title_ar: `مصروف تجريبي ${i + 1}`,
              amount: [50, 120, 300, 75, 200][i % 5],
              category_id: expCatIds[i % expCatIds.length],
              expense_date: randomDateOnly(30, 0),
              status: ['pending', 'approved', 'rejected'][i % 3],
              created_by: callerId,
              notes: 'Sample expense for testing',
            }))
            const { data: createdExp } = await admin.from('expenses').insert(expInsert).select('id')
            const expIds = (createdExp || []).map(e => e.id)
            await trackRecords(admin, sessionId, 'expenses', expIds)
            counts.expenses = expIds.length
          }
        }

        // ── EBOOKS ──
        if (categories.includes('ebooks')) {
          const ebookInsert = Array.from({ length: Math.max(1, Math.ceil(multiplier * 0.5)) }, (_, i) => ({
            title: `Sample E-Book ${i + 1}`, title_ar: `كتاب إلكتروني تجريبي ${i + 1}`,
            description: `Description for sample e-book ${i + 1}`,
            description_ar: `وصف الكتاب الإلكتروني التجريبي ${i + 1}`,
            pdf_url: `https://example.com/sample-ebook-${i + 1}.pdf`,
            created_by: callerId,
          }))
          const { data: createdEbooks } = await admin.from('ebooks').insert(ebookInsert).select('id')
          const ebookIds = (createdEbooks || []).map(e => e.id)
          await trackRecords(admin, sessionId, 'ebooks', ebookIds)
          counts.ebooks = ebookIds.length
        }

        // ── PROGRESS & REPORTS ──
        if (categories.includes('progress') && sIds.length > 0 && tIds.length > 0) {
          // Student progress (needs lesson IDs)
          const { data: existingLessons } = await admin.from('lessons').select('id').limit(10)
          const lessonIdsForProgress = (existingLessons || []).map(l => l.id)
          if (lessonIdsForProgress.length > 0) {
            const progressInsert = Array.from({ length: Math.min(multiplier * 2, sIds.length * lessonIdsForProgress.length) }, (_, i) => ({
              student_id: sIds[i % sIds.length],
              lesson_id: lessonIdsForProgress[i % lessonIdsForProgress.length],
              completed: i % 3 !== 0,
              completed_at: i % 3 !== 0 ? randomDate(14, 0) : null,
              score: i % 3 !== 0 ? Math.floor(Math.random() * 40) + 60 : null,
            }))
            const { data: createdProgress } = await admin.from('student_progress').insert(progressInsert).select('id')
            const progressIds = (createdProgress || []).map(p => p.id)
            await trackRecords(admin, sessionId, 'student_progress', progressIds)
            counts.student_progress = progressIds.length
          }

          // Session reports (needs timetable entries)
          const { data: completedEntries } = await admin.from('timetable_entries').select('id, teacher_id, student_id, course_id').eq('status', 'completed').limit(multiplier)
          if (completedEntries && completedEntries.length > 0) {
            const reportInsert = completedEntries.map((entry, i) => ({
              timetable_entry_id: entry.id,
              teacher_id: entry.teacher_id,
              student_id: entry.student_id,
              course_id: entry.course_id,
              summary: `Sample session summary ${i + 1}`,
              observations: 'Student showed good progress',
              performance_remarks: pick(['Excellent', 'Good', 'Needs improvement', 'Outstanding']),
              session_duration_seconds: [1800, 2700, 3600][i % 3],
              started_at: randomDate(14, 0),
              created_by: callerId,
            }))
            const { data: createdReports } = await admin.from('session_reports').insert(reportInsert).select('id')
            const reportIds = (createdReports || []).map(r => r.id)
            await trackRecords(admin, sessionId, 'session_reports', reportIds)
            counts.session_reports = reportIds.length
          }
        }

        // ── SUPPORT CONFIG (departments + priorities) ──
        if (categories.includes('support_config')) {
          const deptInsert = [
            { name: 'Technical Support', name_ar: 'الدعم الفني', sort_order: 0 },
            { name: 'Billing', name_ar: 'الفواتير', sort_order: 1 },
            { name: 'General', name_ar: 'عام', sort_order: 2 },
          ]
          const { data: createdDepts } = await admin.from('support_departments').insert(deptInsert).select('id')
          const deptIds = (createdDepts || []).map(d => d.id)
          await trackRecords(admin, sessionId, 'support_departments', deptIds)
          counts.support_departments = deptIds.length

          const prioInsert = [
            { name: 'Low', name_ar: 'منخفض', color: '#22c55e', sort_order: 0 },
            { name: 'Medium', name_ar: 'متوسط', color: '#f59e0b', sort_order: 1 },
            { name: 'High', name_ar: 'مرتفع', color: '#ef4444', sort_order: 2 },
          ]
          const { data: createdPrios } = await admin.from('support_priorities').insert(prioInsert).select('id')
          const prioIds = (createdPrios || []).map(p => p.id)
          await trackRecords(admin, sessionId, 'support_priorities', prioIds)
          counts.support_priorities = prioIds.length
        }

        // Finalize session
        const totalRecords = Object.values(counts).reduce((a, b) => a + b, 0)
        await admin.from('seed_sessions').update({
          status: 'completed', counts, errors, total_records: totalRecords
        }).eq('id', sessionId)

        return json({ success: true, session_id: sessionId, counts, errors, total_records: totalRecords })
      } catch (err: any) {
        errors.push(err.message || 'Unknown error')
        await admin.from('seed_sessions').update({ status: 'failed', counts, errors }).eq('id', sessionId)
        return json({ error: err.message, session_id: sessionId, counts, errors }, 500)
      }
    }

    // ══════════════════════════════════════════════════════════════════
    // CLEAR SESSION(S)
    // ══════════════════════════════════════════════════════════════════
    if (action === 'clear' || action === 'clear_session') {
      const sessionId = body.session_id as string | undefined
      const clearAll = body.clear_all === true

      // Get records to delete
      let query = admin.from('seed_records').select('table_name, record_id, session_id')
      if (sessionId && !clearAll) {
        query = query.eq('session_id', sessionId)
      }
      const { data: records } = await query.order('created_at', { ascending: false })
      if (!records || records.length === 0) {
        return json({ success: true, message: 'No seed records found', deleted: 0 })
      }

      // Group records by table
      const byTable: Record<string, string[]> = {}
      for (const r of records) {
        if (!byTable[r.table_name]) byTable[r.table_name] = []
        byTable[r.table_name].push(r.record_id)
      }

      // Delete in FK-safe order (most dependent first)
      const DELETE_ORDER = [
        'chat_read_receipts', 'chat_messages', 'chat_members',
        'attendance', 'session_reports', 'student_progress',
        'timetable_entries', 'invoices', 'subscriptions', 'chats',
        'certificates', 'support_tickets', 'notifications', 'announcements',
        'lessons', 'lesson_sections', 'course_sections', 'teacher_courses',
        'courses', 'course_tracks', 'course_categories', 'course_levels',
        'ebook_downloads', 'ebook_views', 'ebooks',
        'blog_posts', 'website_pages', 'pricing_packages',
        'payout_requests', 'expenses', 'expense_categories',
        'support_departments', 'support_priorities',
        'students', 'teachers', 'profiles', 'user_roles',
      ]

      const deletedCounts: Record<string, number> = {}
      for (const table of DELETE_ORDER) {
        const ids = byTable[table]
        if (!ids || ids.length === 0) continue
        try {
          if (table === 'user_roles') {
            // user_roles uses user_id as the identifier
            const { count } = await admin.from(table).delete({ count: 'exact' }).in('user_id', ids)
            deletedCounts[table] = count || 0
          } else {
            const { count } = await admin.from(table).delete({ count: 'exact' }).in('id', ids)
            deletedCounts[table] = count || 0
          }
        } catch (e: any) {
          deletedCounts[table] = -1 // mark as error
        }
      }

      // Delete auth users
      const authUserIds = byTable['auth_users'] || []
      let deletedAuthUsers = 0
      for (const uid of authUserIds) {
        try {
          await admin.auth.admin.deleteUser(uid)
          deletedAuthUsers++
        } catch (_) {}
      }
      if (deletedAuthUsers > 0) deletedCounts['auth_users'] = deletedAuthUsers

      // Clean up seed_records
      if (sessionId && !clearAll) {
        await admin.from('seed_records').delete().eq('session_id', sessionId)
        await admin.from('seed_sessions').update({ status: 'cleared', cleared_at: new Date().toISOString() }).eq('id', sessionId)
      } else {
        // Get all session IDs from the records
        const sessionIds = [...new Set(records.map(r => r.session_id))]
        for (const sid of sessionIds) {
          await admin.from('seed_records').delete().eq('session_id', sid)
          await admin.from('seed_sessions').update({ status: 'cleared', cleared_at: new Date().toISOString() }).eq('id', sid)
        }
      }

      const totalDeleted = Object.values(deletedCounts).filter(v => v > 0).reduce((a, b) => a + b, 0)
      return json({ success: true, counts: deletedCounts, total_deleted: totalDeleted })
    }

    return json({ error: 'Invalid action' }, 400)
  } catch (err: any) {
    console.error('seed-data error:', err)
    return json({ error: err.message || 'An internal error occurred' }, 500)
  }
})
