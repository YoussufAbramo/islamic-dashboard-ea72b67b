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

// Generate a random date within the last `daysBack` days, spread naturally
const randomPastDate = (daysBack = 90): string => {
  const now = Date.now()
  const offset = Math.random() * daysBack * 24 * 60 * 60 * 1000
  return new Date(now - offset).toISOString()
}
const randomPastDateOnly = (daysBack = 90): string => randomPastDate(daysBack).split('T')[0]

// Generate a random future date within the next `daysAhead` days
const randomFutureDate = (daysAhead = 30): string => {
  const now = Date.now()
  const offset = Math.random() * daysAhead * 24 * 60 * 60 * 1000
  return new Date(now + offset).toISOString()
}

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

const SUMMARIES = [
  'Student reviewed Surah Al-Fatiha and began memorizing Surah Al-Baqarah verses 1-5.',
  'Covered Arabic grammar rules for noun-adjective agreement. Student showed good understanding.',
  'Practiced tajweed rules: Idgham and Ikhfa. Student needs more practice on Ikhfa.',
  'Discussed Islamic history - The Hijra. Student participated actively.',
  'Memorization session: Student completed 2 new verses with proper tajweed.',
  'Revision of previously memorized surahs. Good retention observed.',
]
const OBSERVATIONS = [
  'Student is making steady progress and shows enthusiasm.',
  'Needs additional practice on pronunciation of certain letters.',
  'Excellent memorization skills, ahead of schedule.',
  'Student was focused and attentive throughout the session.',
  'Recommended extra revision before the next lesson.',
  'Good improvement compared to last session.',
]
const PERF_REMARKS = ['Excellent', 'Very Good', 'Good', 'Satisfactory', 'Needs Improvement', 'Outstanding']
const CANCEL_REASONS = ['Student requested postponement', 'Teacher unavailable', 'Technical issues', 'Schedule conflict', 'Holiday']

// ─── tracking helper ───────────────────────────────────────────────────
async function trackRecords(
  adminClient: any,
  sessionId: string,
  tableName: string,
  ids: string[]
) {
  if (ids.length === 0) return
  const rows = ids.map(id => ({ session_id: sessionId, table_name: tableName, record_id: id }))
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

// ─── Global record budget tracker ─────────────────────────────────────
const MAX_TOTAL_RECORDS = 1000

class RecordBudget {
  private used = 0
  remaining() { return Math.max(0, MAX_TOTAL_RECORDS - this.used) }
  canAdd() { return this.used < MAX_TOTAL_RECORDS }
  consume(n: number) { this.used += n }
  cap(desired: number) { return Math.min(desired, this.remaining()) }
  // Guarantee at least minCount even if budget is exhausted
  capMin(desired: number, minCount = 1) { return Math.max(minCount, Math.min(desired, this.remaining())) }
  total() { return this.used }
}

// ─── Record allocation plan based on multiplier ────────────────────────
// Multiplier 1-10 scales the dataset, but NEVER exceeds 1000 total.
// The plan ensures logical proportions and minimum coverage.
function computeAllocation(multiplier: number, categories: string[]) {
  // Base quantities per multiplier (these sum to ~100 at multiplier=1)
  const has = (c: string) => categories.includes(c)

  // Weight-based allocation across categories
  const weights: Record<string, number> = {}
  if (has('students')) weights.students = 8
  if (has('teachers')) weights.teachers = 4
  if (has('courses')) weights.courses = 10 // includes tracks, cats, levels, sections, lessons
  if (has('billing')) weights.billing = 12 // subscriptions + invoices
  if (has('schedule')) weights.schedule = 25 // timetable + attendance + reports
  if (has('communications')) weights.communications = 5
  if (has('support')) weights.support = 10
  if (has('certificates')) weights.certificates = 3
  if (has('website')) weights.website = 5
  if (has('packages')) weights.packages = 2
  if (has('expenses')) weights.expenses = 5
  if (has('ebooks')) weights.ebooks = 3
  if (has('progress')) weights.progress = 5
  if (has('support_config')) weights.support_config = 2
  if (has('payouts')) weights.payouts = 4
  if (has('badges')) weights.badges = 15

  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0) || 1
  const budget = Math.min(MAX_TOTAL_RECORDS, multiplier * 100) // 100-1000

  const alloc: Record<string, number> = {}
  for (const [k, w] of Object.entries(weights)) {
    alloc[k] = Math.max(1, Math.round((w / totalWeight) * budget))
  }
  return alloc
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

      const budget = new RecordBudget()
      const alloc = computeAllocation(multiplier, categories)

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
      let timestampMin = new Date().toISOString()
      let timestampMax = new Date(0).toISOString()

      const trackTs = (ts: string) => {
        if (ts < timestampMin) timestampMin = ts
        if (ts > timestampMax) timestampMax = ts
      }

      try {
        // ── STUDENTS ──
        const studentUserIds: string[] = []
        if (categories.includes('students')) {
          const qty = budget.capMin(alloc.students || 4)
          for (let i = 0; i < qty; i++) {
            if (!budget.canAdd()) break
            const fn = pick(FIRST_NAMES)
            const ln = pick(LAST_NAMES)
            const email = `seed-${sessionId.slice(0,8)}-s${i+1}@sample.edu`
            try {
              const createdAt = randomPastDate(90)
              trackTs(createdAt)
              const { data: newUser, error } = await admin.auth.admin.createUser({
                email, password: crypto.randomUUID(), email_confirm: true,
                user_metadata: { full_name: `${fn} ${ln}`, phone: `+20100000${String(1000 + i).slice(1)}` }
              })
              if (!error && newUser.user) {
                studentUserIds.push(newUser.user.id)
                // Update profile created_at to simulate historical signup
                await admin.from('profiles').update({ created_at: createdAt }).eq('id', newUser.user.id)
                await trackRecords(admin, sessionId, 'auth_users', [newUser.user.id])
                await trackRecords(admin, sessionId, 'profiles', [newUser.user.id])
                await trackRecords(admin, sessionId, 'user_roles', [newUser.user.id])
                const { data: sRec } = await admin.from('students').select('id').eq('user_id', newUser.user.id).single()
                if (sRec) {
                  await admin.from('students').update({ created_at: createdAt }).eq('id', sRec.id)
                  await trackRecords(admin, sessionId, 'students', [sRec.id])
                }
                budget.consume(4) // auth_user + profile + user_role + student
              }
            } catch (e: any) { errors.push(`Student ${i+1}: ${e.message}`) }
          }
          counts.students = studentUserIds.length
        }

        // ── TEACHERS ──
        const teacherUserIds: string[] = []
        if (categories.includes('teachers')) {
          const qty = budget.capMin(alloc.teachers || 2)
          for (let i = 0; i < qty; i++) {
            if (!budget.canAdd()) break
            const fn = pick(FIRST_NAMES)
            const ln = pick(LAST_NAMES)
            const title = pick(TITLES_TEACHER)
            const email = `seed-${sessionId.slice(0,8)}-t${i+1}@sample.edu`
            try {
              const createdAt = randomPastDate(90)
              trackTs(createdAt)
              const { data: newUser, error } = await admin.auth.admin.createUser({
                email, password: crypto.randomUUID(), email_confirm: true,
                user_metadata: { full_name: `${title} ${fn} ${ln}`, phone: `+20110000${String(1000 + i).slice(1)}` }
              })
              if (!error && newUser.user) {
                teacherUserIds.push(newUser.user.id)
                await admin.from('profiles').update({ created_at: createdAt }).eq('id', newUser.user.id)
                await trackRecords(admin, sessionId, 'auth_users', [newUser.user.id])
                await trackRecords(admin, sessionId, 'profiles', [newUser.user.id])

                await admin.from('user_roles').update({ role: 'teacher' }).eq('user_id', newUser.user.id)
                await trackRecords(admin, sessionId, 'user_roles', [newUser.user.id])

                const { data: autoStudent } = await admin.from('students').select('id').eq('user_id', newUser.user.id).single()
                if (autoStudent) await admin.from('students').delete().eq('id', autoStudent.id)

                const { data: tRec } = await admin.from('teachers').insert({
                  user_id: newUser.user.id,
                  specialization: pick(SPECS),
                  bio: pick(BIOS),
                  title: title,
                  created_at: createdAt,
                }).select('id').single()
                if (tRec) await trackRecords(admin, sessionId, 'teachers', [tRec.id])
                budget.consume(4) // auth_user + profile + user_role + teacher
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
          const courseBudget = budget.capMin(alloc.courses || 10)
          // Split budget: ~10% taxonomy, ~20% courses, ~30% sections, ~40% lessons
          const numCourses = Math.max(1, Math.min(5, Math.ceil(courseBudget * 0.15)))

          // Tracks
          const tracksRaw = pickN(TRACK_TITLES, Math.min(2, numCourses)).map((t, i) => ({
            title: t.en, title_ar: t.ar, sort_order: i,
            description: `${t.en} description`, description_ar: `وصف ${t.ar}`,
          }))
          const tracksInsert = await dedup(admin, 'course_tracks', tracksRaw)
          const { data: createdTracks } = tracksInsert.length > 0
            ? await admin.from('course_tracks').insert(tracksInsert).select('id')
            : { data: [] }
          const trackIds = (createdTracks || []).map(t => t.id)
          const { data: allTrackRows } = await admin.from('course_tracks').select('id').limit(50)
          const allTrackIds = (allTrackRows || []).map(t => t.id)
          await trackRecords(admin, sessionId, 'course_tracks', trackIds)
          budget.consume(trackIds.length)
          counts.tracks = trackIds.length

          // Categories
          const catsRaw = pickN(CAT_TITLES, Math.min(3, numCourses)).map((c, i) => ({
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
          budget.consume(catIds.length)
          counts.categories = catIds.length

          // Levels
          const levelsRaw = pickN(LEVEL_TITLES, Math.min(3, numCourses)).map((l, i) => ({
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
          budget.consume(levelIds.length)
          counts.levels = levelIds.length

          // Courses
          const coursesRaw = pickN(COURSE_TITLES, numCourses).map((c, i) => {
            const createdAt = randomPastDate(90)
            trackTs(createdAt)
            return {
              title: c.en, title_ar: c.ar, status: 'active', created_by: callerId,
              description: `Complete course: ${c.en}`, description_ar: `دورة كاملة: ${c.ar}`,
              category_id: allCatIds.length > 0 ? allCatIds[i % allCatIds.length] : null,
              level_id: allLevelIds.length > 0 ? allLevelIds[i % allLevelIds.length] : null,
              track_id: allTrackIds.length > 0 ? allTrackIds[i % allTrackIds.length] : null,
              created_at: createdAt, updated_at: createdAt,
            }
          })
          const coursesInsert = await dedup(admin, 'courses', coursesRaw)
          const { data: createdCourses } = coursesInsert.length > 0
            ? await admin.from('courses').insert(coursesInsert).select('id')
            : { data: [] }
          cIds = (createdCourses || []).map(c => c.id)
          await trackRecords(admin, sessionId, 'courses', cIds)
          budget.consume(cIds.length)
          counts.courses = cIds.length

          // Assign teachers to courses
          if (tIds.length > 0 && cIds.length > 0) {
            const tcInsert = cIds.map((cid, i) => ({
              teacher_id: tIds[i % tIds.length], course_id: cid,
            }))
            const { data: createdTC } = await admin.from('teacher_courses').insert(tcInsert).select('id')
            await trackRecords(admin, sessionId, 'teacher_courses', (createdTC || []).map(tc => tc.id))
            budget.consume((createdTC || []).length)
          }

          // Course sections (2 per course)
          const sectionsPerCourse = Math.min(2, Math.ceil(budget.cap(courseBudget * 0.3) / Math.max(1, cIds.length)))
          const sectionsInsert = cIds.flatMap(cid =>
            pickN(SECTION_TITLES, sectionsPerCourse).map((s, i) => ({
              course_id: cid, title: s.en, title_ar: s.ar, sort_order: i
            }))
          )
          if (sectionsInsert.length > 0) {
            const { data: createdSections } = await admin.from('course_sections').insert(sectionsInsert).select('id')
            const secIds = (createdSections || []).map(s => s.id)
            await trackRecords(admin, sessionId, 'course_sections', secIds)
            budget.consume(secIds.length)
            counts.sections = secIds.length

            // Lesson sections (1 per course section)
            const lSecInsert = secIds.map((sid, i) => ({
              course_section_id: sid, title: `Part ${i + 1}`, title_ar: `الجزء ${i + 1}`, sort_order: 0
            }))
            const { data: createdLSecs } = await admin.from('lesson_sections').insert(lSecInsert).select('id')
            const lSecIds = (createdLSecs || []).map(s => s.id)
            await trackRecords(admin, sessionId, 'lesson_sections', lSecIds)
            budget.consume(lSecIds.length)
            counts.lesson_sections = lSecIds.length

            // Lessons (2 per lesson section, capped)
            const lessonsPerLSec = Math.min(2, Math.max(1, Math.floor(budget.cap(courseBudget * 0.4) / Math.max(1, lSecIds.length))))
            const lessonsInsert = lSecIds.flatMap((sid, si) =>
              Array.from({ length: lessonsPerLSec }, (_, li) => ({
                section_id: sid, title: `Lesson ${si * lessonsPerLSec + li + 1}`,
                title_ar: `الدرس ${si * lessonsPerLSec + li + 1}`,
                sort_order: li, lesson_type: LESSON_TYPES[(si + li) % LESSON_TYPES.length],
                content: { text: 'Sample lesson content', text_ar: 'محتوى درس تجريبي' }
              }))
            )
            if (lessonsInsert.length > 0) {
              const { data: createdLessons } = await admin.from('lessons').insert(lessonsInsert).select('id')
              const lessonIds = (createdLessons || []).map(l => l.id)
              await trackRecords(admin, sessionId, 'lessons', lessonIds)
              budget.consume(lessonIds.length)
              counts.lessons = lessonIds.length
            }
          }
        }

        // Get existing courses if needed
        if (cIds.length === 0) {
          const { data: ec } = await admin.from('courses').select('id').limit(10)
          cIds = (ec || []).map(c => c.id)
        }

        // ── BILLING (subscriptions + invoices) ──
        let createdSubIds: string[] = []
        if (categories.includes('billing') && sIds.length > 0 && cIds.length > 0 && tIds.length > 0) {
          const billingBudget = budget.capMin(alloc.billing || 12)
          const numSubs = Math.max(1, Math.min(sIds.length, Math.ceil(billingBudget * 0.4)))
          const numInvoices = Math.max(1, billingBudget - numSubs)

          const MEET_URLS = [
            'https://meet.google.com/abc-defg-hij',
            'https://meet.google.com/xyz-uvwx-rst',
          ]
          const ZOOM_URLS = [
            'https://zoom.us/j/1234567890',
            'https://zoom.us/j/9876543210',
          ]
          const subsInsert = Array.from({ length: numSubs }, (_, i) => {
            const subType = ['monthly', 'quarterly', 'yearly'][i % 3]
            const renewalDays = subType === 'yearly' ? 365 : subType === 'quarterly' ? 88 : 28
            const startDate = randomPastDateOnly(60)
            const renewalDate = new Date(startDate)
            renewalDate.setDate(renewalDate.getDate() + renewalDays)
            const createdAt = randomPastDate(90)
            trackTs(createdAt)
            return {
              student_id: sIds[i % sIds.length], course_id: cIds[i % cIds.length], teacher_id: tIds[i % tIds.length],
              status: i === 0 ? 'expired' : 'active',
              subscription_type: subType,
              price: [50, 100, 75, 120, 80][i % 5],
              start_date: startDate,
              renewal_date: renewalDate.toISOString().split('T')[0],
              google_meet_url: MEET_URLS[i % MEET_URLS.length],
              zoom_url: ZOOM_URLS[i % ZOOM_URLS.length],
              created_at: createdAt,
            }
          })
          const { data: subs } = await admin.from('subscriptions').insert(subsInsert).select('id, student_id, course_id, price, subscription_type')
          const subRows = subs || []
          createdSubIds = subRows.map(s => s.id)
          await trackRecords(admin, sessionId, 'subscriptions', createdSubIds)
          budget.consume(createdSubIds.length)
          counts.subscriptions = createdSubIds.length

          // Invoices
          if (subRows.length > 0) {
            const statuses = ['pending', 'paid', 'overdue', 'cancelled']
            const invoicesInsert = Array.from({ length: Math.min(numInvoices, subRows.length * 3) }, (_, i) => {
              const sub = subRows[i % subRows.length]
              const status = statuses[i % statuses.length]
              const amount = sub.price || 50
              const createdAt = randomPastDate(90)
              trackTs(createdAt)
              return {
                subscription_id: sub.id, student_id: sub.student_id,
                course_id: sub.course_id || null,
                amount, original_price: amount,
                sale_price: i % 3 === 0 ? Math.round(amount * 0.8) : null,
                billing_cycle: sub.subscription_type || 'monthly',
                due_date: randomPastDateOnly(status === 'overdue' ? 30 : -10),
                status,
                paid_at: status === 'paid' ? randomPastDate(30) : null,
                notes: status === 'paid' ? 'Payment received' : '',
                created_at: createdAt, updated_at: createdAt,
              }
            })
            const cappedInvoices = invoicesInsert.slice(0, budget.cap(invoicesInsert.length))
            if (cappedInvoices.length > 0) {
              const { data: createdInv } = await admin.from('invoices').insert(cappedInvoices).select('id')
              const invIds = (createdInv || []).map(inv => inv.id)
              await trackRecords(admin, sessionId, 'invoices', invIds)
              budget.consume(invIds.length)
              counts.invoices = invIds.length
            }
          }
        }

        // ── SCHEDULE (timetable + attendance + session reports) ──
        if (categories.includes('schedule') && sIds.length > 0 && tIds.length > 0 && cIds.length > 0) {
          // Scale timetable/reports directly with multiplier: base 5, max ~80 at 10x
          // This ensures multiplier meaningfully affects session volume
          const rawTT = Math.max(5, multiplier * 8)
          const numTT = budget.cap(rawTT)
          const completedCount = Math.floor(numTT * 0.4)
          const cancelledCount = Math.max(1, Math.floor(numTT * 0.15))
          const scheduledCount = numTT - completedCount - cancelledCount

          const ttInsert = Array.from({ length: numTT }, (_, i) => {
            const duration = [30, 45, 60][i % 3]
            let status: string
            let cancellationReason: string | null = null
            let scheduledAt: string

            if (i < completedCount) {
              // Past completed sessions — spread across last 90 days
              scheduledAt = randomPastDate(90)
              status = 'completed'
            } else if (i < completedCount + cancelledCount) {
              scheduledAt = randomPastDate(60)
              status = 'cancelled'
              cancellationReason = pick(CANCEL_REASONS)
            } else {
              // Future scheduled sessions
              scheduledAt = randomFutureDate(30)
              status = 'scheduled'
            }

            // Set a realistic hour 8-14
            const d = new Date(scheduledAt)
            d.setHours(8 + (i % 6), 0, 0, 0)
            scheduledAt = d.toISOString()
            trackTs(scheduledAt)

            return {
              student_id: sIds[i % sIds.length], teacher_id: tIds[i % tIds.length],
              course_id: cIds[i % cIds.length], scheduled_at: scheduledAt,
              duration_minutes: duration, status,
              cancellation_reason: cancellationReason,
            }
          })
          const cappedTT = ttInsert.slice(0, budget.cap(ttInsert.length))
          const { data: createdTT } = await admin.from('timetable_entries').insert(cappedTT).select('id, status, scheduled_at, duration_minutes, student_id, teacher_id, course_id')
          const ttIds = (createdTT || []).map(t => t.id)
          await trackRecords(admin, sessionId, 'timetable_entries', ttIds)
          budget.consume(ttIds.length)
          counts.timetable = ttIds.length

          // Attendance for completed entries
          const completedTT = (createdTT || []).filter(t => t.status === 'completed')
          if (completedTT.length > 0 && budget.canAdd()) {
            const attInsert = completedTT.slice(0, budget.cap(completedTT.length)).map((tt, i) => ({
              timetable_entry_id: tt.id, student_id: tt.student_id,
              status: i % 5 === 4 ? 'absent' : 'present',
              notes: i % 5 === 4 ? 'Student was absent' : 'Attended on time',
              created_at: tt.scheduled_at,
            }))
            const { data: createdAtt } = await admin.from('attendance').insert(attInsert).select('id')
            const attIds = (createdAtt || []).map(a => a.id)
            await trackRecords(admin, sessionId, 'attendance', attIds)
            budget.consume(attIds.length)
            counts.attendance = attIds.length
          }

          // Session reports for completed (non-absent) entries
          const attendedTT = completedTT.filter((_, i) => i % 5 !== 4)
          if (attendedTT.length > 0 && budget.canAdd()) {
            const reportInsert = await Promise.all(
              attendedTT.slice(0, budget.cap(attendedTT.length)).map(async (tt) => {
                const scheduledAtDate = new Date(tt.scheduled_at)
                const durationMins = tt.duration_minutes || 30
                const actualDurationSecs = (durationMins * 60) + Math.floor(Math.random() * 300) - 120
                const endedAt = new Date(scheduledAtDate.getTime() + actualDurationSecs * 1000)

                const { data: subMatch } = await admin.from('subscriptions')
                  .select('id')
                  .eq('student_id', tt.student_id)
                  .eq('course_id', tt.course_id)
                  .limit(1)
                  .single()

                return {
                  timetable_entry_id: tt.id,
                  teacher_id: tt.teacher_id,
                  student_id: tt.student_id,
                  course_id: tt.course_id,
                  subscription_id: subMatch?.id || null,
                  summary: pick(SUMMARIES),
                  observations: pick(OBSERVATIONS),
                  performance_remarks: pick(PERF_REMARKS),
                  session_duration_seconds: Math.max(actualDurationSecs, 300),
                  started_at: scheduledAtDate.toISOString(),
                  ended_at: endedAt.toISOString(),
                  created_by: callerId,
                  created_at: scheduledAtDate.toISOString(),
                }
              })
            )
            const { data: createdReports } = await admin.from('session_reports').insert(reportInsert).select('id')
            const reportIds = (createdReports || []).map(r => r.id)
            await trackRecords(admin, sessionId, 'session_reports', reportIds)
            budget.consume(reportIds.length)
            counts.session_reports = reportIds.length
          }
        }

        // ── COMMUNICATIONS (announcements + notifications) ──
        if (categories.includes('communications')) {
          const commBudget = budget.capMin(alloc.communications || 5)
          const numAnn = Math.max(1, Math.ceil(commBudget * 0.5))
          const numNotif = Math.max(1, commBudget - numAnn)

          const annRaw = pickN(ANNOUNCEMENT_TITLES, numAnn).map(a => {
            const createdAt = randomPastDate(90)
            trackTs(createdAt)
            return {
              title: a.en, title_ar: a.ar,
              content: `${a.en} - details and information.`,
              content_ar: `${a.ar} - تفاصيل ومعلومات.`,
              target_audience: pick(['all', 'students', 'teachers']),
              created_by: callerId, is_active: true,
              created_at: createdAt,
            }
          })
          const annInsert = await dedup(admin, 'announcements', annRaw)
          if (annInsert.length > 0) {
            const { data: createdAnn } = await admin.from('announcements').insert(annInsert).select('id')
            const annIds = (createdAnn || []).map(a => a.id)
            await trackRecords(admin, sessionId, 'announcements', annIds)
            budget.consume(annIds.length)
            counts.announcements = annIds.length
          }

          const notifInsert = Array.from({ length: budget.cap(numNotif) }, (_, i) => {
            const createdAt = randomPastDate(30)
            trackTs(createdAt)
            return {
              user_id: callerId,
              title: `Sample Notification ${i + 1}`,
              message: `This is a sample notification message #${i + 1}`,
              link: pick(['/dashboard/students', '/dashboard/courses', '/dashboard/subscriptions', '/dashboard/support']),
              created_at: createdAt,
            }
          })
          if (notifInsert.length > 0) {
            const { data: createdNotif } = await admin.from('notifications').insert(notifInsert).select('id')
            const notifIds = (createdNotif || []).map(n => n.id)
            await trackRecords(admin, sessionId, 'notifications', notifIds)
            budget.consume(notifIds.length)
            counts.notifications = notifIds.length
          }
        }

        // ── SUPPORT (chats, messages, tickets) ──
        if (categories.includes('support')) {
          const supportBudget = budget.capMin(alloc.support || 10)

          // Chats & messages
          if (sIds.length > 0 && tIds.length > 0) {
            const chatCount = Math.max(1, Math.min(Math.ceil(supportBudget * 0.2), sIds.length, tIds.length))
            const chatsInsert = Array.from({ length: budget.cap(chatCount) }, (_, i) => {
              const createdAt = randomPastDate(60)
              trackTs(createdAt)
              return {
                student_id: sIds[i % sIds.length], teacher_id: tIds[i % tIds.length],
                name: pick(['Quran Progress', 'Arabic Help', 'Fiqh Discussion', 'General Chat']),
                is_group: false,
                created_at: createdAt,
              }
            })
            const { data: createdChats } = await admin.from('chats').insert(chatsInsert).select('id')
            const chatIds = (createdChats || []).map(c => c.id)
            await trackRecords(admin, sessionId, 'chats', chatIds)
            budget.consume(chatIds.length)
            counts.chats = chatIds.length

            if (chatIds.length > 0 && sUserIds.length > 0 && tUserIds.length > 0 && budget.canAdd()) {
              const msgsInsert: any[] = []
              for (let i = 0; i < chatIds.length && budget.canAdd(); i++) {
                const baseTime = new Date(randomPastDate(60))
                const msgs = [
                  { chat_id: chatIds[i], sender_id: tUserIds[i % tUserIds.length], message: 'Assalamu alaikum! How is your progress?', created_at: baseTime.toISOString() },
                  { chat_id: chatIds[i], sender_id: sUserIds[i % sUserIds.length], message: 'Wa alaikum assalam! Alhamdulillah, going well.', created_at: new Date(baseTime.getTime() + 120000).toISOString() },
                  { chat_id: chatIds[i], sender_id: tUserIds[i % tUserIds.length], message: 'Great! Keep up the good work.', created_at: new Date(baseTime.getTime() + 300000).toISOString() },
                ]
                const capped = msgs.slice(0, budget.cap(3))
                msgsInsert.push(...capped)
              }
              if (msgsInsert.length > 0) {
                const { data: createdMsgs } = await admin.from('chat_messages').insert(msgsInsert).select('id')
                const msgIds = (createdMsgs || []).map(m => m.id)
                await trackRecords(admin, sessionId, 'chat_messages', msgIds)
                budget.consume(msgIds.length)
                counts.messages = msgIds.length
              }
            }
          }

          // Support tickets
          const ticketCount = budget.cap(Math.max(1, Math.ceil(supportBudget * 0.4)))
          if (ticketCount > 0) {
            const ticketsInsert = Array.from({ length: ticketCount }, (_, i) => {
              const createdAt = randomPastDate(90)
              trackTs(createdAt)
              return {
                name: `${pick(FIRST_NAMES)} ${pick(LAST_NAMES)}`,
                email: `ticket-${i+1}@sample.edu`,
                subject: pick(TICKET_SUBJECTS),
                message: 'This is a sample support ticket for testing purposes.',
                department: pick(['technical', 'billing', 'general']),
                priority: pick(['low', 'medium', 'high']),
                status: pick(['open', 'in_progress', 'resolved', 'closed']),
                user_id: callerId,
                created_at: createdAt, updated_at: createdAt,
              }
            })
            const { data: createdTickets } = await admin.from('support_tickets').insert(ticketsInsert).select('id')
            const ticketIds = (createdTickets || []).map(t => t.id)
            await trackRecords(admin, sessionId, 'support_tickets', ticketIds)
            budget.consume(ticketIds.length)
            counts.tickets = ticketIds.length
          }
        }

        // ── CERTIFICATES ──
        if (categories.includes('certificates') && sIds.length > 0) {
          const certBudget = budget.capMin(alloc.certificates || 3)
          const certInsert = Array.from({ length: certBudget }, (_, i) => {
            const issuedAt = randomPastDate(60)
            trackTs(issuedAt)
            return {
              recipient_id: sUserIds[i % sUserIds.length] || callerId,
              recipient_type: 'student',
              title: `Certificate of Completion - Course ${i + 1}`,
              title_ar: `شهادة إتمام - الدورة ${i + 1}`,
              description: 'Awarded for successfully completing the course.',
              description_ar: 'تُمنح لإتمام الدورة بنجاح.',
              course_id: cIds.length > 0 ? cIds[i % cIds.length] : null,
              issued_by: callerId,
              status: 'active',
              issued_at: issuedAt,
              created_at: issuedAt,
            }
          })
          const { data: createdCerts } = await admin.from('certificates').insert(certInsert).select('id')
          const certIds = (createdCerts || []).map(c => c.id)
          await trackRecords(admin, sessionId, 'certificates', certIds)
          budget.consume(certIds.length)
          counts.certificates = certIds.length
        }

        // ── WEBSITE (blogs + pages) ──
        if (categories.includes('website')) {
          const webBudget = budget.capMin(alloc.website || 5)
          const numBlogs = Math.max(1, Math.ceil(webBudget * 0.6))
          const numPages = Math.max(1, webBudget - numBlogs)

          const blogInsert = pickN(BLOG_TITLES, budget.cap(numBlogs)).map((b, i) => {
            const createdAt = randomPastDate(90)
            const publishedAt = i % 3 === 2 ? null : createdAt
            trackTs(createdAt)
            return {
              title: b.en, title_ar: b.ar, slug: `${b.slug}-${sessionId.slice(0,8)}`,
              excerpt: `${b.en} excerpt`, excerpt_ar: `مقتطف ${b.ar}`,
              content: `<h2>${b.en}</h2><p>Sample content for testing.</p>`,
              content_ar: `<h2>${b.ar}</h2><p>محتوى تجريبي للاختبار.</p>`,
              status: i % 3 === 2 ? 'draft' : 'published',
              published_at: publishedAt,
              created_by: callerId,
              created_at: createdAt, updated_at: createdAt,
            }
          })
          const { data: createdBlogs } = await admin.from('blog_posts').insert(blogInsert).select('id')
          const blogIds = (createdBlogs || []).map(b => b.id)
          await trackRecords(admin, sessionId, 'blog_posts', blogIds)
          budget.consume(blogIds.length)
          counts.blogs = blogIds.length

          const pageInsert = Array.from({ length: budget.cap(numPages) }, (_, i) => {
            const createdAt = randomPastDate(90)
            trackTs(createdAt)
            return {
              title: `Sample Page ${i + 1}`, title_ar: `صفحة تجريبية ${i + 1}`,
              slug: `sample-page-${sessionId.slice(0,8)}-${i + 1}`,
              content: `<h1>Sample Page ${i + 1}</h1><p>This is sample page content.</p>`,
              content_ar: `<h1>صفحة تجريبية ${i + 1}</h1><p>هذا محتوى صفحة تجريبية.</p>`,
              status: 'published', created_by: callerId,
              created_at: createdAt, updated_at: createdAt,
            }
          })
          if (pageInsert.length > 0) {
            const { data: createdPages } = await admin.from('website_pages').insert(pageInsert).select('id')
            const pageIds = (createdPages || []).map(p => p.id)
            await trackRecords(admin, sessionId, 'website_pages', pageIds)
            budget.consume(pageIds.length)
            counts.pages = pageIds.length
          }
        }

        // ── PACKAGES ──
        if (categories.includes('packages')) {
          const pkgs = [
            { title: 'Starter', title_ar: 'بداية', subtitle: 'For getting started', subtitle_ar: 'للبداية', regular_price: 19, sale_price: null, max_courses: 1, max_students: 3, max_teachers: 1, is_featured: false },
            { title: 'Growth', title_ar: 'نمو', subtitle: 'Growing institutions', subtitle_ar: 'المؤسسات النامية', regular_price: 79, sale_price: 69, max_courses: 10, max_students: 30, max_teachers: 5, is_featured: true },
            { title: 'Enterprise', title_ar: 'مؤسسات', subtitle: 'For organizations', subtitle_ar: 'للمؤسسات', regular_price: 199, sale_price: null, max_courses: 50, max_students: 200, max_teachers: 15, is_featured: false },
          ]
          const pkgRaw = pkgs.slice(0, budget.cap(3)).map((p, i) => ({
            ...p, billing_cycle: 'monthly', is_active: true, sort_order: 100 + i,
            features: JSON.stringify([{ text: `${p.max_courses} Courses`, text_ar: `${p.max_courses} دورات` }, { text: 'Support', text_ar: 'دعم' }])
          }))
          const pkgInsert = await dedup(admin, 'pricing_packages', pkgRaw)
          if (pkgInsert.length > 0) {
            const { data: createdPkgs } = await admin.from('pricing_packages').insert(pkgInsert).select('id')
            const pkgIds = (createdPkgs || []).map(p => p.id)
            await trackRecords(admin, sessionId, 'pricing_packages', pkgIds)
            budget.consume(pkgIds.length)
            counts.packages = pkgIds.length
          }
        }

        // ── EXPENSES (categories + records) ──
        if (categories.includes('expenses')) {
          const expBudget = budget.capMin(alloc.expenses || 5)
          const expCatRaw = [
            { title: 'Office Supplies', title_ar: 'لوازم مكتبية', color: '#6366f1', sort_order: 0 },
            { title: 'Software', title_ar: 'برمجيات', color: '#8b5cf6', sort_order: 1 },
            { title: 'Marketing', title_ar: 'تسويق', color: '#ec4899', sort_order: 2 },
          ].slice(0, Math.min(3, expBudget))
          const expCatInsert = await dedup(admin, 'expense_categories', expCatRaw)
          let expCatIds: string[] = []
          if (expCatInsert.length > 0) {
            const { data: createdExpCats } = await admin.from('expense_categories').insert(expCatInsert).select('id')
            expCatIds = (createdExpCats || []).map(c => c.id)
            await trackRecords(admin, sessionId, 'expense_categories', expCatIds)
            budget.consume(expCatIds.length)
          }
          const { data: allExpCatRows } = await admin.from('expense_categories').select('id').limit(50)
          const allExpCatIds = (allExpCatRows || []).map(c => c.id)
          counts.expense_categories = expCatIds.length

          if (allExpCatIds.length > 0 && budget.canAdd()) {
            const numExp = budget.cap(Math.max(1, expBudget - expCatIds.length))
            const expInsert = Array.from({ length: numExp }, (_, i) => {
              const expDate = randomPastDateOnly(90)
              trackTs(expDate + 'T00:00:00.000Z')
              return {
                title: `Sample Expense ${sessionId.slice(0,6)}-${i + 1}`, title_ar: `مصروف تجريبي ${sessionId.slice(0,6)}-${i + 1}`,
                amount: [50, 120, 300, 75, 200][i % 5],
                category_id: allExpCatIds[i % allExpCatIds.length],
                expense_date: expDate,
                status: ['pending', 'approved', 'rejected'][i % 3],
                created_by: callerId,
                notes: 'Sample expense for testing',
                created_at: randomPastDate(90),
              }
            })
            const { data: createdExp } = await admin.from('expenses').insert(expInsert).select('id')
            const expIds = (createdExp || []).map(e => e.id)
            await trackRecords(admin, sessionId, 'expenses', expIds)
            budget.consume(expIds.length)
            counts.expenses = expIds.length
          }
        }

        // ── EBOOKS ──
        if (categories.includes('ebooks')) {
          const ebookBudget = budget.capMin(alloc.ebooks || 3)
          const ebookRaw = Array.from({ length: ebookBudget }, (_, i) => {
            const createdAt = randomPastDate(90)
            trackTs(createdAt)
            return {
              title: `Sample E-Book ${i + 1}`, title_ar: `كتاب إلكتروني تجريبي ${i + 1}`,
              description: `Description for sample e-book ${i + 1}`,
              description_ar: `وصف الكتاب الإلكتروني التجريبي ${i + 1}`,
              pdf_url: `https://example.com/sample-ebook-${i + 1}.pdf`,
              created_by: callerId,
              created_at: createdAt, updated_at: createdAt,
            }
          })
          const ebookInsert = await dedup(admin, 'ebooks', ebookRaw)
          if (ebookInsert.length > 0) {
            const { data: createdEbooks } = await admin.from('ebooks').insert(ebookInsert).select('id')
            const ebookIds = (createdEbooks || []).map(e => e.id)
            await trackRecords(admin, sessionId, 'ebooks', ebookIds)
            budget.consume(ebookIds.length)
            counts.ebooks = ebookIds.length
          }
        }

        // ── PROGRESS ──
        if (categories.includes('progress') && sIds.length > 0 && budget.canAdd()) {
          const progBudget = budget.cap(alloc.progress || 5)
          const { data: existingLessons } = await admin.from('lessons').select('id').limit(20)
          const lessonIdsForProgress = (existingLessons || []).map(l => l.id)
          if (lessonIdsForProgress.length > 0) {
            const { data: existingProgress } = await admin.from('student_progress').select('student_id, lesson_id')
            const existingComboSet = new Set((existingProgress || []).map((p: any) => `${p.student_id}|${p.lesson_id}`))

            const progressCandidates = Array.from({ length: Math.min(progBudget, sIds.length * lessonIdsForProgress.length) }, (_, i) => {
              const completedAt = randomPastDate(60)
              trackTs(completedAt)
              return {
                student_id: sIds[i % sIds.length],
                lesson_id: lessonIdsForProgress[i % lessonIdsForProgress.length],
                completed: i % 3 !== 0,
                completed_at: i % 3 !== 0 ? completedAt : null,
                score: i % 3 !== 0 ? Math.floor(Math.random() * 40) + 60 : null,
                created_at: completedAt,
              }
            })
            const progressInsert = progressCandidates
              .filter(p => !existingComboSet.has(`${p.student_id}|${p.lesson_id}`))
              .slice(0, budget.cap(progBudget))

            if (progressInsert.length > 0) {
              const { data: createdProgress } = await admin.from('student_progress').insert(progressInsert).select('id')
              const progressIds = (createdProgress || []).map(p => p.id)
              await trackRecords(admin, sessionId, 'student_progress', progressIds)
              budget.consume(progressIds.length)
              counts.student_progress = progressIds.length
            }
          }
        }

        // ── SUPPORT CONFIG (departments + priorities) ──
        if (categories.includes('support_config') && budget.canAdd()) {
          const deptRaw = [
            { name: 'Technical Support', name_ar: 'الدعم الفني', sort_order: 0 },
            { name: 'Billing', name_ar: 'الفواتير', sort_order: 1 },
            { name: 'General', name_ar: 'عام', sort_order: 2 },
          ]
          const deptInsert = await dedup(admin, 'support_departments', deptRaw, 'name')
          if (deptInsert.length > 0) {
            const { data: createdDepts } = await admin.from('support_departments').insert(deptInsert).select('id')
            const deptIds = (createdDepts || []).map(d => d.id)
            await trackRecords(admin, sessionId, 'support_departments', deptIds)
            budget.consume(deptIds.length)
            counts.support_departments = deptIds.length
          }

          const prioRaw = [
            { name: 'Low', name_ar: 'منخفض', color: '#22c55e', sort_order: 0 },
            { name: 'Medium', name_ar: 'متوسط', color: '#f59e0b', sort_order: 1 },
            { name: 'High', name_ar: 'مرتفع', color: '#ef4444', sort_order: 2 },
          ]
          const prioInsert = await dedup(admin, 'support_priorities', prioRaw, 'name')
          if (prioInsert.length > 0 && budget.canAdd()) {
            const { data: createdPrios } = await admin.from('support_priorities').insert(prioInsert).select('id')
            const prioIds = (createdPrios || []).map(p => p.id)
            await trackRecords(admin, sessionId, 'support_priorities', prioIds)
            budget.consume(prioIds.length)
            counts.support_priorities = prioIds.length
          }
        }

        // ── PAYOUTS ──
        if (categories.includes('payouts') && tIds.length > 0 && budget.canAdd()) {
          const payoutBudget = budget.cap(alloc.payouts || 4)
          const payoutStatuses = ['approved', 'declined', 'approved', 'under_review', 'declined', 'approved']
          const payoutInsert = Array.from({ length: payoutBudget }, (_, i) => {
            const status = payoutStatuses[i % payoutStatuses.length]
            const createdAt = randomPastDate(60)
            trackTs(createdAt)
            return {
              teacher_id: tIds[i % tIds.length],
              requested_amount: [100, 250, 500, 150, 300, 200][i % 6],
              available_balance_at_request: [500, 800, 1200, 600, 900, 700][i % 6],
              status,
              reviewed_at: status !== 'under_review' ? randomPastDate(30) : null,
              admin_notes: status === 'approved' ? 'Payment processed' : status === 'declined' ? 'Insufficient documentation' : null,
              decline_reason: status === 'declined' ? pick(['Missing bank details', 'Minimum threshold not met', 'Duplicate request']) : null,
              admin_id: status !== 'under_review' ? callerId : null,
              created_at: createdAt,
            }
          })
          const { data: createdPayouts } = await admin.from('payout_requests').insert(payoutInsert).select('id')
          const payoutIds = (createdPayouts || []).map(p => p.id)
          await trackRecords(admin, sessionId, 'payout_requests', payoutIds)
          budget.consume(payoutIds.length)
          counts.payout_requests = payoutIds.length
        }

        // ── BADGES (realistic teacher data for badge thresholds) ──
        if (categories.includes('badges') && tIds.length > 0 && budget.canAdd()) {
          const badgeBudget = budget.cap(alloc.badges || 15)
          // Create enough sessions/reports for 1-2 teachers to hit mid-tier badges
          const badgeTeacher = tIds[0]
          const numSessions = Math.max(3, Math.floor(badgeBudget * 0.45))
          const numReports = Math.max(3, Math.floor(badgeBudget * 0.45))
          const numCerts = Math.max(1, badgeBudget - numSessions - numReports)

          // Timetable entries spanning 90 days
          const ttBatch = Array.from({ length: budget.cap(numSessions) }, (_, i) => {
            const d = randomPastDate(90)
            trackTs(d)
            return {
              teacher_id: badgeTeacher,
              student_id: sIds.length > 0 ? sIds[i % sIds.length] : null,
              course_id: cIds.length > 0 ? cIds[i % cIds.length] : null,
              scheduled_at: d,
              duration_minutes: 60,
              status: 'completed',
            }
          })
          if (ttBatch.length > 0) {
            const { data: createdTT } = await admin.from('timetable_entries').insert(ttBatch).select('id, scheduled_at')
            const ids = (createdTT || []).map(t => t.id)
            await trackRecords(admin, sessionId, 'timetable_entries', ids)
            budget.consume(ids.length)
            counts.timetable = (counts.timetable || 0) + ids.length

            // Session reports with substantial hours
            const reportBatch = (createdTT || []).slice(0, budget.cap(numReports)).map((tt, ri) => ({
              timetable_entry_id: tt.id,
              teacher_id: badgeTeacher,
              student_id: sIds.length > 0 ? sIds[ri % sIds.length] : null,
              course_id: cIds.length > 0 ? cIds[ri % cIds.length] : null,
              summary: pick(SUMMARIES),
              observations: pick(OBSERVATIONS),
              performance_remarks: pick(PERF_REMARKS),
              session_duration_seconds: 3600, // 1 hour each
              started_at: tt.scheduled_at,
              created_by: callerId,
              created_at: tt.scheduled_at,
            }))
            if (reportBatch.length > 0) {
              const { data: createdReports } = await admin.from('session_reports').insert(reportBatch).select('id')
              const reportIds = (createdReports || []).map(r => r.id)
              await trackRecords(admin, sessionId, 'session_reports', reportIds)
              budget.consume(reportIds.length)
              counts.session_reports = (counts.session_reports || 0) + reportIds.length
            }
          }

          // Teacher certificates
          if (budget.canAdd()) {
            const teacherUserId = (allTeachers || []).find(t => t.id === badgeTeacher)?.user_id || callerId
            const certInsert = Array.from({ length: budget.cap(numCerts) }, (_, i) => {
              const issuedAt = randomPastDate(90)
              trackTs(issuedAt)
              return {
                recipient_id: teacherUserId,
                recipient_type: 'teacher',
                title: `Teaching Excellence Certificate ${i + 1}`,
                title_ar: `شهادة التميز في التدريس ${i + 1}`,
                description: 'Awarded for outstanding teaching.',
                description_ar: 'تُمنح للتميز في التدريس.',
                issued_by: callerId,
                status: 'active',
                issued_at: issuedAt,
                created_at: issuedAt,
              }
            })
            const { data: createdCerts } = await admin.from('certificates').insert(certInsert).select('id')
            const certIds = (createdCerts || []).map(c => c.id)
            await trackRecords(admin, sessionId, 'certificates', certIds)
            budget.consume(certIds.length)
            counts.certificates = (counts.certificates || 0) + certIds.length
          }
        }

        // Finalize session
        const totalRecords = budget.total()
        await admin.from('seed_sessions').update({
          status: 'completed', counts, errors, total_records: totalRecords
        }).eq('id', sessionId)

        return json({
          success: true,
          session_id: sessionId,
          counts,
          errors,
          total_records: totalRecords,
          max_records: MAX_TOTAL_RECORDS,
          timestamp_range: { from: timestampMin, to: timestampMax },
          warnings: totalRecords >= MAX_TOTAL_RECORDS ? ['Record limit (1000) reached. Some categories may have fewer records than requested.'] : [],
        })
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

      let query = admin.from('seed_records').select('table_name, record_id, session_id')
      if (sessionId && !clearAll) {
        query = query.eq('session_id', sessionId)
      }
      const { data: records } = await query.order('created_at', { ascending: false })
      if (!records || records.length === 0) {
        return json({ success: true, message: 'No seed records found', deleted: 0 })
      }

      const byTable: Record<string, string[]> = {}
      for (const r of records) {
        if (!byTable[r.table_name]) byTable[r.table_name] = []
        byTable[r.table_name].push(r.record_id)
      }

      const DELETE_ORDER = [
        'chat_messages', 'chat_members',
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
            const { count } = await admin.from(table).delete({ count: 'exact' }).in('user_id', ids)
            deletedCounts[table] = count || 0
          } else {
            const { count } = await admin.from(table).delete({ count: 'exact' }).in('id', ids)
            deletedCounts[table] = count || 0
          }
        } catch (e: any) {
          deletedCounts[table] = -1
        }
      }

      const authUserIds = byTable['auth_users'] || []
      let deletedAuthUsers = 0
      for (const uid of authUserIds) {
        try {
          await admin.auth.admin.deleteUser(uid)
          deletedAuthUsers++
        } catch (_) {}
      }
      if (deletedAuthUsers > 0) deletedCounts['auth_users'] = deletedAuthUsers

      if (sessionId && !clearAll) {
        await admin.from('seed_records').delete().eq('session_id', sessionId)
        await admin.from('seed_sessions').update({ status: 'cleared', cleared_at: new Date().toISOString() }).eq('id', sessionId)
      } else {
        const sessionIds = [...new Set(records.map(r => r.session_id))]
        for (const sid of sessionIds) {
          await admin.from('seed_records').delete().eq('session_id', sid)
          await admin.from('seed_sessions').update({ status: 'cleared', cleared_at: new Date().toISOString() }).eq('id', sid)
        }
      }

      const totalDeleted = Object.values(deletedCounts).filter(v => v > 0).reduce((a, b) => a + b, 0)
      return json({ success: true, counts: deletedCounts, total_deleted: totalDeleted })
    }

    // ══════════════════════════════════════════════════════════════════
    // CLEAR ALL CONTENT — delete all rows from selected content tables
    // ══════════════════════════════════════════════════════════════════
    if (action === 'clear_content') {
      const tables = body.tables as string[] | undefined
      if (!tables || tables.length === 0) {
        return json({ error: 'No tables specified' }, 400)
      }

      const ALLOWED_TABLES: Record<string, string[]> = {
        'blogs': ['blog_posts'],
        'pages': ['website_pages'],
        'courses': ['student_progress', 'lessons', 'lesson_sections', 'course_sections', 'teacher_courses', 'courses', 'course_tracks', 'course_categories', 'course_levels'],
        'expenses': ['expenses', 'expense_categories'],
        'pricing': ['pricing_packages'],
        'support': ['support_tickets', 'support_departments', 'support_priorities'],
      }

      const deletedCounts: Record<string, number> = {}
      const errors: string[] = []

      for (const key of tables) {
        const dbTables = ALLOWED_TABLES[key]
        if (!dbTables) { errors.push(`Unknown table group: ${key}`); continue }
        for (const table of dbTables) {
          try {
            const { count, error } = await admin.from(table).delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000')
            if (error) throw error
            deletedCounts[table] = count || 0
          } catch (e: any) {
            errors.push(`${table}: ${e.message}`)
            deletedCounts[table] = -1
          }
        }
      }

      const totalDeleted = Object.values(deletedCounts).filter(v => v > 0).reduce((a, b) => a + b, 0)
      return json({ success: true, counts: deletedCounts, total_deleted: totalDeleted, errors })
    }

    // ══════════════════════════════════════════════════════════════════
    // CLEAR LOGS — delete audit_logs, seed_sessions/seed_records
    // ══════════════════════════════════════════════════════════════════
    if (action === 'clear_logs') {
      const logTypes = body.log_types as string[] | undefined
      if (!logTypes || logTypes.length === 0) {
        return json({ error: 'No log types specified' }, 400)
      }

      const deletedCounts: Record<string, number> = {}
      const errors: string[] = []

      for (const logType of logTypes) {
        if (logType === 'audit_logs') {
          try {
            const { count, error } = await admin.from('audit_logs').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000')
            if (error) throw error
            deletedCounts['audit_logs'] = count || 0
          } catch (e: any) { errors.push(`audit_logs: ${e.message}`) }
        }
        if (logType === 'seed_log') {
          try {
            const { count: c1 } = await admin.from('seed_records').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000')
            const { count: c2 } = await admin.from('seed_sessions').delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000')
            deletedCounts['seed_records'] = c1 || 0
            deletedCounts['seed_sessions'] = c2 || 0
          } catch (e: any) { errors.push(`seed_log: ${e.message}`) }
        }
        // error_log is localStorage — handled client-side
      }

      const totalDeleted = Object.values(deletedCounts).filter(v => v > 0).reduce((a, b) => a + b, 0)
      return json({ success: true, counts: deletedCounts, total_deleted: totalDeleted, errors })
    }

    // ══════════════════════════════════════════════════════════════════
    // SYSTEM RESET — restore platform to fresh-install state
    // ══════════════════════════════════════════════════════════════════
    if (action === 'system_reset') {
      const confirmation = body.confirmation as string | undefined
      if (confirmation !== 'RESET SYSTEM') {
        return json({ error: 'Invalid confirmation phrase. Type "RESET SYSTEM" to proceed.' }, 400)
      }

      const deletedCounts: Record<string, number> = {}
      const errors: string[] = []

      // Ordered list respecting foreign key dependencies (children first)
      const RESET_ORDER = [
        // Seed tracking
        'seed_records', 'seed_sessions',
        // Chat system
        'chat_messages', 'chat_members', 'chats',
        // Attendance & session
        'attendance', 'session_reports', 'student_progress',
        'timetable_entries',
        // Billing
        'invoices', 'subscriptions',
        // Payouts
        'payout_requests',
        // Certificates
        'certificates',
        // Notifications & announcements
        'notifications', 'announcements',
        // Support
        'support_tickets',
        // Courses hierarchy
        'lessons', 'lesson_sections', 'course_sections', 'teacher_courses',
        'courses',
        'course_tracks', 'course_categories', 'course_levels',
        // E-books
        'ebook_downloads', 'ebook_views', 'ebooks',
        // Expenses
        'expenses', 'expense_categories',
        // Website
        'blog_posts', 'website_pages', 'policies',
        // Pricing
        'pricing_packages',
        // Support config
        'support_departments', 'support_priorities',
        // Landing content
        'landing_content',
        // Audit / logs
        'audit_logs',
        // Payment config
        'payment_gateway_config',
        // App settings
        'app_settings',
        // Users (order matters: students/teachers before profiles)
        'students', 'teachers',
      ]

      // For user_roles: delete all EXCEPT the current admin's 'admin' role
      try {
        const { count, error } = await admin.from('user_roles').delete({ count: 'exact' })
          .not('user_id', 'eq', caller.id)
        if (error) throw error
        deletedCounts['user_roles'] = count || 0
      } catch (e: any) {
        errors.push(`user_roles: ${e.message}`)
        deletedCounts['user_roles'] = -1
      }

      // For profiles: delete all EXCEPT the current admin's profile
      try {
        const { count, error } = await admin.from('profiles').delete({ count: 'exact' })
          .neq('id', caller.id)
        if (error) throw error
        deletedCounts['profiles'] = count || 0
      } catch (e: any) {
        errors.push(`profiles: ${e.message}`)
        deletedCounts['profiles'] = -1
      }

      // Delete all rows from each table
      for (const table of RESET_ORDER) {
        try {
          // Use a broad filter to delete all rows
          const { count, error } = await admin.from(table).delete({ count: 'exact' }).neq('id', '00000000-0000-0000-0000-000000000000')
          if (error) throw error
          deletedCounts[table] = count || 0
        } catch (e: any) {
          errors.push(`${table}: ${e.message}`)
          deletedCounts[table] = -1
        }
      }

      // Delete all auth users except the current admin
      let deletedAuthUsers = 0
      try {
        // List all users (paginated)
        let page = 1
        let hasMore = true
        while (hasMore) {
          const { data: listData, error: listError } = await admin.auth.admin.listUsers({ page, perPage: 100 })
          if (listError || !listData?.users || listData.users.length === 0) {
            hasMore = false
            break
          }
          for (const u of listData.users) {
            if (u.id === caller.id) continue // preserve current admin
            try {
              await admin.auth.admin.deleteUser(u.id)
              deletedAuthUsers++
            } catch (_) {}
          }
          if (listData.users.length < 100) hasMore = false
          page++
        }
      } catch (e: any) {
        errors.push(`auth_users: ${e.message}`)
      }
      if (deletedAuthUsers > 0) deletedCounts['auth_users'] = deletedAuthUsers

      // The current admin's profile and role are preserved (not deleted above)
      // Just ensure they exist
      try {
        await admin.from('profiles').upsert({
          id: caller.id,
          full_name: caller.user_metadata?.full_name || 'Admin',
          email: caller.email || '',
          phone: caller.user_metadata?.phone || '',
        })
        await admin.from('user_roles').upsert({
          user_id: caller.id,
          role: 'admin',
        }, { onConflict: 'user_id,role' })
      } catch (e: any) {
        errors.push(`restore_admin: ${e.message}`)
      }

      // Clear storage buckets (user uploads only)
      const BUCKETS_TO_CLEAR = ['avatars', 'course-images', 'ebooks', 'media']
      for (const bucket of BUCKETS_TO_CLEAR) {
        try {
          const { data: files } = await admin.storage.from(bucket).list('', { limit: 1000 })
          if (files && files.length > 0) {
            const paths = files.map(f => f.name)
            await admin.storage.from(bucket).remove(paths)
            deletedCounts[`storage:${bucket}`] = paths.length
          }
          for (const file of (files || [])) {
            if (!file.id && file.name) {
              const { data: subFiles } = await admin.storage.from(bucket).list(file.name, { limit: 1000 })
              if (subFiles && subFiles.length > 0) {
                const subPaths = subFiles.map(sf => `${file.name}/${sf.name}`)
                await admin.storage.from(bucket).remove(subPaths)
                deletedCounts[`storage:${bucket}`] = (deletedCounts[`storage:${bucket}`] || 0) + subPaths.length
              }
            }
          }
        } catch (e: any) {
          errors.push(`storage:${bucket}: ${e.message}`)
        }
      }

      // Restore default app_settings (was deleted above)
      try {
        await admin.from('app_settings').insert({
          settings: {},
          updated_by: caller.id,
        })
      } catch (_) {}

      const totalDeleted = Object.values(deletedCounts).filter(v => v > 0).reduce((a, b) => a + b, 0)

      // DO NOT log to audit_logs after reset — start clean
      return json({
        success: true,
        message: 'System reset completed. Platform restored to fresh-install state.',
        counts: deletedCounts,
        total_deleted: totalDeleted,
        errors,
        preserved: ['current_admin_account', 'admin_role', 'database_schema', 'storage_buckets'],
      })
    }

    return json({ error: 'Invalid action' }, 400)
  } catch (err: any) {
    console.error('seed-data error:', err)
    return json({ error: err.message || 'An internal error occurred' }, 500)
  }
})
