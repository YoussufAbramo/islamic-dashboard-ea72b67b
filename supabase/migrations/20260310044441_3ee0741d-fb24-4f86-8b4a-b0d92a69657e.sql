
-- Delete in FK-safe order
DELETE FROM attendance;
DELETE FROM student_progress;
DELETE FROM chat_messages;
DELETE FROM chats;
DELETE FROM timetable_entries;
DELETE FROM invoices;
DELETE FROM subscriptions;
DELETE FROM lessons;
DELETE FROM course_sections;
DELETE FROM courses;
DELETE FROM certificates;
DELETE FROM support_tickets WHERE status = 'open';
-- Delete all non-admin students
DELETE FROM students WHERE user_id NOT IN (
  SELECT user_id FROM user_roles WHERE role = 'admin'
);
