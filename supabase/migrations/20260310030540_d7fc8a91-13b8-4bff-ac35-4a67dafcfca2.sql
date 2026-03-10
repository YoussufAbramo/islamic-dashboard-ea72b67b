
DO $$
DECLARE
  admin_ids uuid[];
BEGIN
  SELECT array_agg(user_id) INTO admin_ids FROM user_roles WHERE role = 'admin';
  
  DELETE FROM chat_messages;
  DELETE FROM attendance;
  DELETE FROM student_progress;
  DELETE FROM timetable_entries;
  DELETE FROM chats;
  DELETE FROM certificates;
  DELETE FROM invoices;
  DELETE FROM subscriptions;
  DELETE FROM lessons;
  DELETE FROM course_sections;
  DELETE FROM courses;
  DELETE FROM notifications;
  DELETE FROM announcements;
  DELETE FROM support_tickets;
  DELETE FROM landing_content;
  DELETE FROM pricing_packages;
  
  DELETE FROM students WHERE user_id != ALL(admin_ids);
  DELETE FROM teachers WHERE user_id != ALL(admin_ids);
  DELETE FROM profiles WHERE id != ALL(admin_ids);
  DELETE FROM user_roles WHERE user_id != ALL(admin_ids);
END $$;
