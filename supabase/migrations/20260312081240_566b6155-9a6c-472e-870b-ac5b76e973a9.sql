INSERT INTO public.policies (slug, title, title_ar, content, content_ar, is_published, updated_at)
VALUES (
  'attendance-policy',
  'Attendance Policy',
  'سياسة الحضور',
  '<h2>Attendance Policy</h2><p>Students are expected to attend all scheduled lessons on time. The "Not Attend" option is available up to 30 minutes before the lesson. Within the last 30 minutes before a lesson, this option is disabled and attendance is expected.</p><p>If a student cannot attend, they must notify in advance. Repeated absences without notice may result in subscription review.</p>',
  '<h2>سياسة الحضور</h2><p>يُتوقع من الطلاب حضور جميع الدروس المجدولة في الوقت المحدد. خيار "عدم الحضور" متاح حتى 30 دقيقة قبل موعد الدرس. خلال آخر 30 دقيقة قبل الدرس، يتم تعطيل هذا الخيار ويُتوقع الحضور.</p><p>إذا لم يتمكن الطالب من الحضور، يجب عليه الإبلاغ مسبقاً. الغياب المتكرر بدون إشعار قد يؤدي إلى مراجعة الاشتراك.</p>',
  true,
  now()
)
ON CONFLICT (slug) DO NOTHING;