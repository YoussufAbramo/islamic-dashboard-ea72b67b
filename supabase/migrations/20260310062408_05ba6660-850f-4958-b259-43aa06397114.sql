
-- Fix all RLS policies: change from RESTRICTIVE to PERMISSIVE
-- PostgreSQL requires at least one PERMISSIVE policy per table for rows to be accessible.
-- We drop each RESTRICTIVE policy and recreate it as PERMISSIVE (default).

-- ============ announcements ============
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "All can view active announcements" ON public.announcements;
CREATE POLICY "All can view active announcements" ON public.announcements FOR SELECT TO authenticated USING (is_active = true);

-- ============ attendance ============
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance;
CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
CREATE POLICY "Students can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;
CREATE POLICY "Teachers can manage attendance" ON public.attendance FOR ALL TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role) AND student_id IN (SELECT s.id FROM students s JOIN teachers t ON t.id = s.assigned_teacher_id WHERE t.user_id = auth.uid())) WITH CHECK (has_role(auth.uid(), 'teacher'::app_role) AND student_id IN (SELECT s.id FROM students s JOIN teachers t ON t.id = s.assigned_teacher_id WHERE t.user_id = auth.uid()));

-- ============ certificates ============
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = recipient_id);

-- ============ chat_messages ============
DROP POLICY IF EXISTS "Admins can manage messages" ON public.chat_messages;
CREATE POLICY "Admins can manage messages" ON public.chat_messages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Chat participants can send messages" ON public.chat_messages;
CREATE POLICY "Chat participants can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK ((auth.uid() = sender_id) AND (chat_id IN (SELECT c.id FROM chats c WHERE c.is_suspended = false AND (c.teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()) OR c.student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())))));

DROP POLICY IF EXISTS "Chat participants can view messages" ON public.chat_messages;
CREATE POLICY "Chat participants can view messages" ON public.chat_messages FOR SELECT TO authenticated USING (chat_id IN (SELECT c.id FROM chats c WHERE c.teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()) OR c.student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())));

-- ============ chats ============
DROP POLICY IF EXISTS "Admins can manage chats" ON public.chats;
CREATE POLICY "Admins can manage chats" ON public.chats FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Students can view own chats" ON public.chats;
CREATE POLICY "Students can view own chats" ON public.chats FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Teachers can view own chats" ON public.chats;
CREATE POLICY "Teachers can view own chats" ON public.chats FOR SELECT TO authenticated USING (teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()));

-- ============ course_sections ============
DROP POLICY IF EXISTS "Admin/Teacher can manage sections" ON public.course_sections;
CREATE POLICY "Admin/Teacher can manage sections" ON public.course_sections FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

DROP POLICY IF EXISTS "All can view sections" ON public.course_sections;
CREATE POLICY "All can view sections" ON public.course_sections FOR SELECT TO authenticated USING (true);

-- ============ courses ============
DROP POLICY IF EXISTS "Admin can delete courses" ON public.courses;
CREATE POLICY "Admin can delete courses" ON public.courses FOR DELETE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admin/Teacher can insert courses" ON public.courses;
CREATE POLICY "Admin/Teacher can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

DROP POLICY IF EXISTS "Admin/Teacher can update courses" ON public.courses;
CREATE POLICY "Admin/Teacher can update courses" ON public.courses FOR UPDATE TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

DROP POLICY IF EXISTS "All can view published courses or admin/teacher see all" ON public.courses;
CREATE POLICY "All can view published courses or admin/teacher see all" ON public.courses FOR SELECT TO authenticated USING (status = 'published' OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

-- ============ invoices ============
DROP POLICY IF EXISTS "Admins can manage invoices" ON public.invoices;
CREATE POLICY "Admins can manage invoices" ON public.invoices FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view invoice by share token" ON public.invoices;
CREATE POLICY "Anyone can view invoice by share token" ON public.invoices FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Students can view own invoices" ON public.invoices;
CREATE POLICY "Students can view own invoices" ON public.invoices FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

-- ============ landing_content ============
DROP POLICY IF EXISTS "Admins can manage landing content" ON public.landing_content;
CREATE POLICY "Admins can manage landing content" ON public.landing_content FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view landing content" ON public.landing_content;
CREATE POLICY "Anyone can view landing content" ON public.landing_content FOR SELECT TO anon, authenticated USING (true);

-- ============ lessons ============
DROP POLICY IF EXISTS "Admin/Teacher can manage lessons" ON public.lessons;
CREATE POLICY "Admin/Teacher can manage lessons" ON public.lessons FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'teacher'::app_role));

DROP POLICY IF EXISTS "All can view lessons" ON public.lessons;
CREATE POLICY "All can view lessons" ON public.lessons FOR SELECT TO authenticated USING (true);

-- ============ notifications ============
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ pricing_packages ============
DROP POLICY IF EXISTS "Admins can manage packages" ON public.pricing_packages;
CREATE POLICY "Admins can manage packages" ON public.pricing_packages FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Anyone can view active packages" ON public.pricing_packages;
CREATE POLICY "Anyone can view active packages" ON public.pricing_packages FOR SELECT TO anon, authenticated USING (is_active = true);

-- ============ profiles ============
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;
CREATE POLICY "Teachers can view student profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role) AND id IN (SELECT s.user_id FROM students s WHERE s.assigned_teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid())));

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- ============ student_progress ============
DROP POLICY IF EXISTS "Admins can manage progress" ON public.student_progress;
CREATE POLICY "Admins can manage progress" ON public.student_progress FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Students can insert own progress" ON public.student_progress;
CREATE POLICY "Students can insert own progress" ON public.student_progress FOR INSERT TO authenticated WITH CHECK (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Students can update own progress" ON public.student_progress;
CREATE POLICY "Students can update own progress" ON public.student_progress FOR UPDATE TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())) WITH CHECK (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Students can view own progress" ON public.student_progress;
CREATE POLICY "Students can view own progress" ON public.student_progress FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Teachers can view assigned student progress" ON public.student_progress;
CREATE POLICY "Teachers can view assigned student progress" ON public.student_progress FOR SELECT TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role) AND student_id IN (SELECT s.id FROM students s WHERE s.assigned_teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid())));

-- ============ students ============
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
CREATE POLICY "Admins can manage students" ON public.students FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Students can view own" ON public.students;
CREATE POLICY "Students can view own" ON public.students FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Teachers can view assigned students" ON public.students;
CREATE POLICY "Teachers can view assigned students" ON public.students FOR SELECT TO authenticated USING (has_role(auth.uid(), 'teacher'::app_role) AND assigned_teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()));

-- ============ subscriptions ============
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Students can view own subscriptions" ON public.subscriptions;
CREATE POLICY "Students can view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));

DROP POLICY IF EXISTS "Teachers can view related subscriptions" ON public.subscriptions;
CREATE POLICY "Teachers can view related subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()));

-- ============ support_tickets ============
DROP POLICY IF EXISTS "Admins can manage tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage tickets" ON public.support_tickets FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ============ teachers ============
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
CREATE POLICY "Admins can manage teachers" ON public.teachers FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "All authenticated can view teachers" ON public.teachers;
CREATE POLICY "All authenticated can view teachers" ON public.teachers FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS "Teachers can update own" ON public.teachers;
CREATE POLICY "Teachers can update own" ON public.teachers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ============ timetable_entries ============
DROP POLICY IF EXISTS "Admins can manage timetable" ON public.timetable_entries;
CREATE POLICY "Admins can manage timetable" ON public.timetable_entries FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own timetable" ON public.timetable_entries;
CREATE POLICY "Users can view own timetable" ON public.timetable_entries FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()) OR teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()));

-- ============ user_roles ============
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
