
-- Fix all RESTRICTIVE RLS policies by dropping and recreating as PERMISSIVE

-- ========== announcements ==========
DROP POLICY IF EXISTS "Admins can manage announcements" ON public.announcements;
DROP POLICY IF EXISTS "All can view active announcements" ON public.announcements;
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "All can view active announcements" ON public.announcements FOR SELECT TO authenticated USING (is_active = true);

-- ========== attendance ==========
DROP POLICY IF EXISTS "Admins can manage attendance" ON public.attendance;
DROP POLICY IF EXISTS "Students can view own attendance" ON public.attendance;
DROP POLICY IF EXISTS "Teachers can manage attendance" ON public.attendance;
CREATE POLICY "Admins can manage attendance" ON public.attendance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own attendance" ON public.attendance FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Teachers can manage attendance" ON public.attendance FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'teacher'::app_role) AND student_id IN (SELECT s.id FROM students s JOIN teachers t ON t.id = s.assigned_teacher_id WHERE t.user_id = auth.uid())) WITH CHECK (public.has_role(auth.uid(), 'teacher'::app_role) AND student_id IN (SELECT s.id FROM students s JOIN teachers t ON t.id = s.assigned_teacher_id WHERE t.user_id = auth.uid()));

-- ========== certificates ==========
DROP POLICY IF EXISTS "Admins can manage certificates" ON public.certificates;
DROP POLICY IF EXISTS "Users can view own certificates" ON public.certificates;
CREATE POLICY "Admins can manage certificates" ON public.certificates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own certificates" ON public.certificates FOR SELECT TO authenticated USING (auth.uid() = recipient_id);

-- ========== chat_messages ==========
DROP POLICY IF EXISTS "Admins can manage messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat participants can send messages" ON public.chat_messages;
DROP POLICY IF EXISTS "Chat participants can view messages" ON public.chat_messages;
CREATE POLICY "Admins can manage messages" ON public.chat_messages FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Chat participants can send messages" ON public.chat_messages FOR INSERT TO authenticated WITH CHECK (auth.uid() = sender_id AND chat_id IN (SELECT c.id FROM chats c WHERE c.is_suspended = false AND (c.teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()) OR c.student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()))));
CREATE POLICY "Chat participants can view messages" ON public.chat_messages FOR SELECT TO authenticated USING (chat_id IN (SELECT c.id FROM chats c WHERE c.teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()) OR c.student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid())));

-- ========== chats ==========
DROP POLICY IF EXISTS "Admins can manage chats" ON public.chats;
DROP POLICY IF EXISTS "Students can view own chats" ON public.chats;
DROP POLICY IF EXISTS "Teachers can view own chats" ON public.chats;
CREATE POLICY "Admins can manage chats" ON public.chats FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own chats" ON public.chats FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Teachers can view own chats" ON public.chats FOR SELECT TO authenticated USING (teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()));

-- ========== course_sections ==========
DROP POLICY IF EXISTS "Admin/Teacher can manage sections" ON public.course_sections;
DROP POLICY IF EXISTS "All can view sections" ON public.course_sections;
CREATE POLICY "Admin/Teacher can manage sections" ON public.course_sections FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "All can view sections" ON public.course_sections FOR SELECT TO authenticated USING (true);

-- ========== courses ==========
DROP POLICY IF EXISTS "Admin can delete courses" ON public.courses;
DROP POLICY IF EXISTS "Admin/Teacher can insert courses" ON public.courses;
DROP POLICY IF EXISTS "Admin/Teacher can update courses" ON public.courses;
DROP POLICY IF EXISTS "All can view courses" ON public.courses;
CREATE POLICY "Admin can delete courses" ON public.courses FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admin/Teacher can insert courses" ON public.courses FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "Admin/Teacher can update courses" ON public.courses FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "All can view courses" ON public.courses FOR SELECT TO authenticated USING (true);

-- ========== lessons ==========
DROP POLICY IF EXISTS "Admin/Teacher can manage lessons" ON public.lessons;
DROP POLICY IF EXISTS "All can view lessons" ON public.lessons;
CREATE POLICY "Admin/Teacher can manage lessons" ON public.lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role) OR public.has_role(auth.uid(), 'teacher'::app_role));
CREATE POLICY "All can view lessons" ON public.lessons FOR SELECT TO authenticated USING (true);

-- ========== notifications ==========
DROP POLICY IF EXISTS "Admins can create notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ========== profiles ==========
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Teachers can view student profiles" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Teachers can view student profiles" ON public.profiles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher'::app_role) AND id IN (SELECT s.user_id FROM students s WHERE s.assigned_teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid())));
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = id);

-- ========== student_progress ==========
DROP POLICY IF EXISTS "Admins can manage progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can update own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can upsert own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Students can view own progress" ON public.student_progress;
DROP POLICY IF EXISTS "Teachers can view assigned student progress" ON public.student_progress;
CREATE POLICY "Admins can manage progress" ON public.student_progress FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can insert own progress" ON public.student_progress FOR INSERT TO authenticated WITH CHECK (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Students can update own progress" ON public.student_progress FOR UPDATE TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Students can view own progress" ON public.student_progress FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Teachers can view assigned student progress" ON public.student_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher'::app_role) AND student_id IN (SELECT s.id FROM students s WHERE s.assigned_teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid())));

-- ========== students ==========
DROP POLICY IF EXISTS "Admins can manage students" ON public.students;
DROP POLICY IF EXISTS "Students can view own" ON public.students;
DROP POLICY IF EXISTS "Teachers can view assigned students" ON public.students;
CREATE POLICY "Admins can manage students" ON public.students FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own" ON public.students FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Teachers can view assigned students" ON public.students FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'teacher'::app_role) AND assigned_teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()));

-- ========== subscriptions ==========
DROP POLICY IF EXISTS "Admins can manage subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Students can view own subscriptions" ON public.subscriptions;
DROP POLICY IF EXISTS "Teachers can view related subscriptions" ON public.subscriptions;
CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Students can view own subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()));
CREATE POLICY "Teachers can view related subscriptions" ON public.subscriptions FOR SELECT TO authenticated USING (teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()));

-- ========== support_tickets ==========
DROP POLICY IF EXISTS "Admins can manage tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
DROP POLICY IF EXISTS "Users can view own tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage tickets" ON public.support_tickets FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can create tickets" ON public.support_tickets FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can view own tickets" ON public.support_tickets FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- ========== teachers ==========
DROP POLICY IF EXISTS "Admins can manage teachers" ON public.teachers;
DROP POLICY IF EXISTS "All authenticated can view teachers" ON public.teachers;
DROP POLICY IF EXISTS "Teachers can update own" ON public.teachers;
CREATE POLICY "Admins can manage teachers" ON public.teachers FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "All authenticated can view teachers" ON public.teachers FOR SELECT TO authenticated USING (true);
CREATE POLICY "Teachers can update own" ON public.teachers FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- ========== timetable_entries ==========
DROP POLICY IF EXISTS "Admins can manage timetable" ON public.timetable_entries;
DROP POLICY IF EXISTS "Users can view own timetable" ON public.timetable_entries;
CREATE POLICY "Admins can manage timetable" ON public.timetable_entries FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own timetable" ON public.timetable_entries FOR SELECT TO authenticated USING (student_id IN (SELECT s.id FROM students s WHERE s.user_id = auth.uid()) OR teacher_id IN (SELECT t.id FROM teachers t WHERE t.user_id = auth.uid()));

-- ========== user_roles ==========
DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Users can view own role" ON public.user_roles;
CREATE POLICY "Admins can view all roles" ON public.user_roles FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Users can view own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
