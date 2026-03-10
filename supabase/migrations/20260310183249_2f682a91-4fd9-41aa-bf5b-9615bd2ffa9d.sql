
-- Seed 6 default pricing packages (3 monthly + 3 yearly)
-- Only insert if no packages exist yet
INSERT INTO public.pricing_packages (title, title_ar, subtitle, subtitle_ar, regular_price, sale_price, billing_cycle, max_teachers, max_students, max_courses, features, is_active, is_featured, sort_order)
SELECT * FROM (VALUES
  -- Monthly packages
  (
    'Starter', 'المبتدئ',
    'Perfect for individual learners', 'مثالي للمتعلمين الأفراد',
    29.00, NULL, 'monthly',
    1, 5, 2,
    '["1 Dedicated Quran Teacher", "Up to 5 Students", "2 Courses (Tajweed & Memorization)", "4 Weekly Sessions (30 min each)", "Basic Progress Tracking", "WhatsApp Support", "Monthly Progress Report"]'::jsonb,
    true, false, 0
  ),
  (
    'Standard', 'القياسي',
    'Most popular for families & groups', 'الأكثر شعبية للعائلات والمجموعات',
    79.00, 59.00, 'monthly',
    2, 15, 5,
    '["2 Qualified Teachers", "Up to 15 Students", "5 Courses (Tajweed, Memorization, Tafsir, Arabic, Qiraat)", "8 Weekly Sessions (45 min each)", "Advanced Progress Tracking & Reports", "Certificate Generation", "Priority Support (WhatsApp & Email)", "Group Chat Enabled", "Attendance Tracking"]'::jsonb,
    true, true, 1
  ),
  (
    'Premium', 'المتميز',
    'Complete Quran academy solution', 'حل متكامل لأكاديمية القرآن',
    149.00, NULL, 'monthly',
    5, 50, 15,
    '["5 Expert Teachers", "Up to 50 Students", "Unlimited Courses", "Unlimited Weekly Sessions", "Full Analytics & Reports Dashboard", "Custom Certificates with Branding", "Dedicated Account Manager", "Invoice & Billing Management", "Timetable & Scheduling System", "API Access & Webhooks", "White-label Branding Options"]'::jsonb,
    true, false, 2
  ),
  -- Yearly packages
  (
    'Starter Annual', 'المبتدئ السنوي',
    'Save 2 months with yearly billing', 'وفر شهرين مع الفوترة السنوية',
    290.00, NULL, 'yearly',
    1, 5, 2,
    '["1 Dedicated Quran Teacher", "Up to 5 Students", "2 Courses (Tajweed & Memorization)", "4 Weekly Sessions (30 min each)", "Basic Progress Tracking", "WhatsApp Support", "Monthly Progress Report", "2 Months Free (Save $58)"]'::jsonb,
    true, false, 3
  ),
  (
    'Standard Annual', 'القياسي السنوي',
    'Best value — save 2 months', 'أفضل قيمة — وفر شهرين',
    590.00, 490.00, 'yearly',
    2, 15, 5,
    '["2 Qualified Teachers", "Up to 15 Students", "5 Courses (Tajweed, Memorization, Tafsir, Arabic, Qiraat)", "8 Weekly Sessions (45 min each)", "Advanced Progress Tracking & Reports", "Certificate Generation", "Priority Support (WhatsApp & Email)", "Group Chat Enabled", "Attendance Tracking", "2 Months Free (Save $118)"]'::jsonb,
    true, true, 4
  ),
  (
    'Premium Annual', 'المتميز السنوي',
    'Enterprise-grade yearly plan', 'الخطة المؤسسية السنوية',
    1490.00, NULL, 'yearly',
    5, 50, 15,
    '["5 Expert Teachers", "Up to 50 Students", "Unlimited Courses", "Unlimited Weekly Sessions", "Full Analytics & Reports Dashboard", "Custom Certificates with Branding", "Dedicated Account Manager", "Invoice & Billing Management", "Timetable & Scheduling System", "API Access & Webhooks", "White-label Branding Options", "2 Months Free (Save $298)"]'::jsonb,
    true, false, 5
  )
) AS v(title, title_ar, subtitle, subtitle_ar, regular_price, sale_price, billing_cycle, max_teachers, max_students, max_courses, features, is_active, is_featured, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.pricing_packages LIMIT 1);
