
-- Insert sample courses
INSERT INTO public.courses (id, title, title_ar, description, description_ar, status) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Quran Recitation Basics', 'أساسيات تلاوة القرآن', 'Learn the fundamentals of Quran recitation with proper Tajweed rules.', 'تعلم أساسيات تلاوة القرآن مع أحكام التجويد الصحيحة.', 'published'),
  ('a2222222-2222-2222-2222-222222222222', 'Arabic Language Level 1', 'اللغة العربية - المستوى الأول', 'Introduction to Arabic grammar and vocabulary.', 'مقدمة في قواعد اللغة العربية والمفردات.', 'published'),
  ('a3333333-3333-3333-3333-333333333333', 'Islamic Studies', 'الدراسات الإسلامية', 'Comprehensive study of Islamic principles and history.', 'دراسة شاملة للمبادئ والتاريخ الإسلامي.', 'published'),
  ('a4444444-4444-4444-4444-444444444444', 'Hadith Sciences', 'علوم الحديث', 'Study of Hadith classification and authentication.', 'دراسة تصنيف الحديث وتوثيقه.', 'draft'),
  ('a5555555-5555-5555-5555-555555555555', 'Tafseer Studies', 'دراسات التفسير', 'Deep dive into Quranic interpretation methods.', 'دراسة معمقة في مناهج تفسير القرآن.', 'published')
ON CONFLICT (id) DO NOTHING;

-- Insert sample course sections
INSERT INTO public.course_sections (id, course_id, title, title_ar, sort_order) VALUES
  ('b1111111-1111-1111-1111-111111111111', 'a1111111-1111-1111-1111-111111111111', 'Introduction to Tajweed', 'مقدمة في التجويد', 0),
  ('b2222222-2222-2222-2222-222222222222', 'a1111111-1111-1111-1111-111111111111', 'Letters and Pronunciation', 'الحروف والنطق', 1),
  ('b3333333-3333-3333-3333-333333333333', 'a2222222-2222-2222-2222-222222222222', 'Arabic Alphabet', 'الأبجدية العربية', 0),
  ('b4444444-4444-4444-4444-444444444444', 'a3333333-3333-3333-3333-333333333333', 'Five Pillars of Islam', 'أركان الإسلام الخمسة', 0),
  ('b5555555-5555-5555-5555-555555555555', 'a5555555-5555-5555-5555-555555555555', 'Methods of Tafseer', 'مناهج التفسير', 0)
ON CONFLICT (id) DO NOTHING;

-- Insert sample lessons
INSERT INTO public.lessons (id, section_id, title, title_ar, lesson_type, sort_order) VALUES
  ('c1111111-1111-1111-1111-111111111111', 'b1111111-1111-1111-1111-111111111111', 'What is Tajweed?', 'ما هو التجويد؟', 'read_listen', 0),
  ('c2222222-2222-2222-2222-222222222222', 'b1111111-1111-1111-1111-111111111111', 'Importance of Tajweed', 'أهمية التجويد', 'memorization', 1),
  ('c3333333-3333-3333-3333-333333333333', 'b2222222-2222-2222-2222-222222222222', 'Makharij al-Huruf', 'مخارج الحروف', 'read_listen', 0),
  ('c4444444-4444-4444-4444-444444444444', 'b3333333-3333-3333-3333-333333333333', 'Writing Arabic Letters', 'كتابة الحروف العربية', 'exercise_text_match', 0),
  ('c5555555-5555-5555-5555-555555555555', 'b4444444-4444-4444-4444-444444444444', 'Shahada Explained', 'شرح الشهادة', 'read_listen', 0)
ON CONFLICT (id) DO NOTHING;

-- Insert sample announcements
INSERT INTO public.announcements (title, title_ar, content, content_ar, is_active, target_audience) VALUES
  ('New Semester Begins', 'بداية الفصل الجديد', 'The new semester starts on March 15th. Please check your timetable.', 'يبدأ الفصل الجديد في 15 مارس. يرجى مراجعة جدولكم.', true, 'all'),
  ('Exam Schedule Released', 'إصدار جدول الامتحانات', 'Mid-term exams will be held from April 1-5.', 'ستعقد امتحانات منتصف الفصل من 1 إلى 5 أبريل.', true, 'students'),
  ('Teacher Training Workshop', 'ورشة تدريب المعلمين', 'All teachers are invited to the training workshop on March 20.', 'جميع المعلمين مدعوون لورشة التدريب في 20 مارس.', true, 'teachers'),
  ('System Maintenance Notice', 'إشعار صيانة النظام', 'The platform will undergo maintenance on Sunday from 2-4 AM.', 'سيخضع النظام للصيانة يوم الأحد من الساعة 2 إلى 4 صباحاً.', true, 'all'),
  ('Holiday Schedule', 'جدول العطل', 'Ramadan holiday schedule has been updated.', 'تم تحديث جدول عطلة رمضان.', false, 'all')
ON CONFLICT DO NOTHING;

-- Insert sample support tickets (no user_id FK needed)
INSERT INTO public.support_tickets (name, email, subject, message, department, priority, status) VALUES
  ('Ahmad Hassan', 'ahmad@example.com', 'Cannot access course materials', 'I am unable to view the PDF files in Lesson 3.', 'technical', 'high', 'open'),
  ('Fatima Ali', 'fatima@example.com', 'Billing inquiry', 'I was charged twice for my monthly subscription.', 'billing', 'medium', 'in_progress'),
  ('Omar Khalid', 'omar@example.com', 'Request for new course', 'Can you add a course on Fiqh al-Ibadat?', 'academic', 'low', 'open'),
  ('Mariam Yousuf', 'mariam@example.com', 'Login issues', 'I forgot my password and the reset link is not working.', 'technical', 'urgent', 'resolved'),
  ('Khalil Ibrahim', 'khalil@example.com', 'Certificate request', 'I completed the course but did not receive my certificate.', 'general', 'medium', 'open')
ON CONFLICT DO NOTHING;
