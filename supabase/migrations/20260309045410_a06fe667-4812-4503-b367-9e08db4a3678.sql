
-- Create role enum
CREATE TYPE public.app_role AS ENUM ('admin', 'teacher', 'student');

-- Create profiles table
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT DEFAULT '',
  email TEXT DEFAULT '',
  avatar_url TEXT DEFAULT '',
  preferred_language TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create user_roles table
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

-- Security definer function for role checking
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Get user role function
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles
  WHERE user_id = _user_id
  LIMIT 1
$$;

-- Trigger to auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), NEW.email);
  
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, COALESCE((NEW.raw_user_meta_data->>'role')::app_role, 'student'));
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Courses table
CREATE TABLE public.courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT DEFAULT '',
  description TEXT DEFAULT '',
  description_ar TEXT DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Course sections
CREATE TABLE public.course_sections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT DEFAULT '',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Lesson type enum
CREATE TYPE public.lesson_type AS ENUM (
  'table_of_content', 'revision', 'read_listen', 'memorization',
  'exercise_text_match', 'exercise_choose_correct', 'exercise_choose_multiple',
  'exercise_rearrange', 'exercise_missing_text', 'exercise_true_false',
  'exercise_listen_choose', 'homework'
);

-- Lessons
CREATE TABLE public.lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_id UUID NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  title_ar TEXT DEFAULT '',
  lesson_type lesson_type NOT NULL DEFAULT 'read_listen',
  content JSONB DEFAULT '{}',
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Teachers extended info
CREATE TABLE public.teachers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  bio TEXT DEFAULT '',
  specialization TEXT DEFAULT '',
  weekly_schedule JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Students extended info
CREATE TABLE public.students (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  assigned_teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  lesson_duration INT DEFAULT 60,
  weekly_repeat INT DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Subscriptions
CREATE TABLE public.subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE SET NULL,
  subscription_type TEXT NOT NULL DEFAULT 'monthly',
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  renewal_date DATE,
  status TEXT NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Timetable entries
CREATE TABLE public.timetable_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID REFERENCES public.students(id) ON DELETE CASCADE,
  teacher_id UUID REFERENCES public.teachers(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  lesson_id UUID REFERENCES public.lessons(id) ON DELETE SET NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INT NOT NULL DEFAULT 60,
  status TEXT NOT NULL DEFAULT 'scheduled',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Attendance
CREATE TABLE public.attendance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timetable_entry_id UUID NOT NULL REFERENCES public.timetable_entries(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'absent',
  notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Support tickets
CREATE TABLE public.support_tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT DEFAULT '',
  subject TEXT NOT NULL,
  message TEXT NOT NULL,
  department TEXT NOT NULL DEFAULT 'general',
  priority TEXT NOT NULL DEFAULT 'medium',
  status TEXT NOT NULL DEFAULT 'open',
  assigned_to UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  resolution_notes TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Chats
CREATE TABLE public.chats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.teachers(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
  is_suspended BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(teacher_id, student_id)
);

-- Chat messages
CREATE TABLE public.chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chat_id UUID NOT NULL REFERENCES public.chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_deleted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Announcements
CREATE TABLE public.announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  title_ar TEXT DEFAULT '',
  content TEXT NOT NULL,
  content_ar TEXT DEFAULT '',
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Notifications
CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- RLS Policies

-- Profiles: users can read/update their own, admins can read all
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT TO authenticated USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE TO authenticated USING (auth.uid() = id);

-- User roles: users can read own, admins can read all
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own role" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Courses: all authenticated can read, admin/teacher can modify
ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All can view courses" ON public.courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Teacher can insert courses" ON public.courses
  FOR INSERT TO authenticated WITH CHECK (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Admin/Teacher can update courses" ON public.courses
  FOR UPDATE TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Admin can delete courses" ON public.courses
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Course sections
ALTER TABLE public.course_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All can view sections" ON public.course_sections
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Teacher can manage sections" ON public.course_sections
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
  );

-- Lessons
ALTER TABLE public.lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All can view lessons" ON public.lessons
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin/Teacher can manage lessons" ON public.lessons
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'teacher')
  );

-- Teachers
ALTER TABLE public.teachers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All authenticated can view teachers" ON public.teachers
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage teachers" ON public.teachers
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can update own" ON public.teachers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

-- Students
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all students" ON public.students
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view assigned students" ON public.students
  FOR SELECT TO authenticated USING (
    public.has_role(auth.uid(), 'teacher') AND assigned_teacher_id IN (
      SELECT id FROM public.teachers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Students can view own" ON public.students
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage students" ON public.students
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Subscriptions
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage subscriptions" ON public.subscriptions
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Students can view own subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

CREATE POLICY "Teachers can view related subscriptions" ON public.subscriptions
  FOR SELECT TO authenticated USING (
    teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
  );

-- Timetable entries
ALTER TABLE public.timetable_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage timetable" ON public.timetable_entries
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own timetable" ON public.timetable_entries
  FOR SELECT TO authenticated USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    OR teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
  );

-- Attendance
ALTER TABLE public.attendance ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage attendance" ON public.attendance
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can manage attendance" ON public.attendance
  FOR ALL TO authenticated USING (
    public.has_role(auth.uid(), 'teacher')
  );

CREATE POLICY "Students can view own attendance" ON public.attendance
  FOR SELECT TO authenticated USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Support tickets
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage tickets" ON public.support_tickets
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users can view own tickets" ON public.support_tickets
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can create tickets" ON public.support_tickets
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- Chats
ALTER TABLE public.chats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage chats" ON public.chats
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Teachers can view own chats" ON public.chats
  FOR SELECT TO authenticated USING (
    teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can view own chats" ON public.chats
  FOR SELECT TO authenticated USING (
    student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
  );

-- Chat messages
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage messages" ON public.chat_messages
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Chat participants can view messages" ON public.chat_messages
  FOR SELECT TO authenticated USING (
    chat_id IN (
      SELECT id FROM public.chats WHERE
        teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
        OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Chat participants can send messages" ON public.chat_messages
  FOR INSERT TO authenticated WITH CHECK (
    auth.uid() = sender_id AND
    chat_id IN (
      SELECT id FROM public.chats WHERE
        is_suspended = false AND (
          teacher_id IN (SELECT id FROM public.teachers WHERE user_id = auth.uid())
          OR student_id IN (SELECT id FROM public.students WHERE user_id = auth.uid())
        )
    )
  );

-- Announcements
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "All can view active announcements" ON public.announcements
  FOR SELECT TO authenticated USING (is_active = true);

CREATE POLICY "Admins can manage announcements" ON public.announcements
  FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Notifications
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.notifications
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
  FOR UPDATE TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON public.notifications
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
