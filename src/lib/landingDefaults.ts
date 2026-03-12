export type SectionKey = 'hero' | 'partners' | 'features' | 'stats' | 'courses' | 'whyus' | 'howitworks' | 'testimonials' | 'instructors' | 'pricing' | 'faq' | 'newsletter' | 'cta';

export const DEFAULT_SECTION_ORDER: SectionKey[] = [
  'hero', 'partners', 'features', 'stats', 'courses', 'whyus', 'howitworks',
  'testimonials', 'instructors', 'pricing', 'faq', 'newsletter', 'cta',
];

export const sectionMeta: Record<SectionKey, { label: string; labelAr: string; iconName: string }> = {
  hero: { label: 'Hero', labelAr: 'القسم الرئيسي', iconName: 'Star' },
  partners: { label: 'Partners', labelAr: 'الشركاء', iconName: 'Handshake' },
  features: { label: 'Features', labelAr: 'المميزات', iconName: 'Sparkles' },
  stats: { label: 'Statistics', labelAr: 'الإحصائيات', iconName: 'BarChart3' },
  courses: { label: 'Courses', labelAr: 'الدورات', iconName: 'BookOpen' },
  whyus: { label: 'Why Us', labelAr: 'لماذا نحن', iconName: 'Shield' },
  howitworks: { label: 'How It Works', labelAr: 'كيف يعمل', iconName: 'Layers' },
  testimonials: { label: 'Testimonials', labelAr: 'آراء العملاء', iconName: 'Quote' },
  instructors: { label: 'Instructors', labelAr: 'المعلمون', iconName: 'Users' },
  pricing: { label: 'Pricing', labelAr: 'الأسعار', iconName: 'CreditCard' },
  faq: { label: 'FAQ', labelAr: 'الأسئلة الشائعة', iconName: 'HelpCircle' },
  newsletter: { label: 'Newsletter', labelAr: 'النشرة البريدية', iconName: 'Mail' },
  cta: { label: 'Call to Action', labelAr: 'دعوة للعمل', iconName: 'Megaphone' },
};

export const defaultSectionContent: Record<string, Record<string, any>> = {
  hero: {
    title: 'Islamic Education Platform',
    title_ar: 'منصة التعليم الإسلامي',
    subtitle: 'Empower your institution with a comprehensive learning management system designed for Islamic education',
    subtitle_ar: 'مكّن مؤسستك بنظام إدارة تعليمي شامل مصمم للتعليم الإسلامي',
    cta: 'Get Started',
    cta_ar: 'ابدأ الآن',
  },
  partners: {
    title: 'Trusted by Leading Institutions',
    title_ar: 'موثوق من قبل المؤسسات الرائدة',
    items: [
      { name: 'Al-Azhar Academy', name_ar: 'أكاديمية الأزهر', logo_url: '' },
      { name: 'Islamic Online University', name_ar: 'الجامعة الإسلامية الإلكترونية', logo_url: '' },
      { name: 'Quran Academy', name_ar: 'أكاديمية القرآن', logo_url: '' },
      { name: 'Darul Uloom', name_ar: 'دار العلوم', logo_url: '' },
      { name: 'Muslim Education Trust', name_ar: 'صندوق التعليم الإسلامي', logo_url: '' },
    ],
  },
  features: {
    title: 'Everything You Need',
    title_ar: 'كل ما تحتاجه',
    subtitle: 'A complete suite of tools for modern Islamic education',
    subtitle_ar: 'مجموعة كاملة من الأدوات للتعليم الإسلامي الحديث',
    items: [
      { title: 'Course Management', title_ar: 'إدارة الدورات', desc: 'Create and manage courses with sections, lessons, and progress tracking', desc_ar: 'إنشاء وإدارة الدورات مع الأقسام والدروس وتتبع التقدم', icon: 'BookOpen' },
      { title: 'Teacher Management', title_ar: 'إدارة المعلمين', desc: 'Manage teachers, schedules, and assign students seamlessly', desc_ar: 'إدارة المعلمين والجداول وتعيين الطلاب بسلاسة', icon: 'Users' },
      { title: 'Student Tracking', title_ar: 'تتبع الطلاب', desc: 'Monitor student progress, attendance, and performance analytics', desc_ar: 'مراقبة تقدم الطلاب والحضور وتحليلات الأداء', icon: 'GraduationCap' },
      { title: 'Smart Timetable', title_ar: 'جدول ذكي', desc: 'Automated scheduling with conflict detection and calendar views', desc_ar: 'جدولة آلية مع كشف التعارضات وعروض التقويم', icon: 'Calendar' },
      { title: 'Certificates', title_ar: 'الشهادات', desc: 'Issue and manage certificates with customizable templates', desc_ar: 'إصدار وإدارة الشهادات مع قوالب قابلة للتخصيص', icon: 'Award' },
      { title: 'Reports & Analytics', title_ar: 'التقارير والتحليلات', desc: 'Comprehensive financial and academic reports with export options', desc_ar: 'تقارير مالية وأكاديمية شاملة مع خيارات التصدير', icon: 'BarChart3' },
      { title: 'Communication', title_ar: 'التواصل', desc: 'Built-in chat, announcements, and notification system', desc_ar: 'محادثات وإعلانات ونظام إشعارات مدمج', icon: 'MessageSquare' },
      { title: 'Role-Based Access', title_ar: 'وصول قائم على الأدوار', desc: 'Secure admin, teacher, and student roles with fine-grained permissions', desc_ar: 'أدوار آمنة للمشرف والمعلم والطالب مع أذونات دقيقة', icon: 'Shield' },
    ],
  },
  stats: {
    title: 'Our Impact in Numbers',
    title_ar: 'تأثيرنا بالأرقام',
    items: [
      { value: '500+', label: 'Institutions', label_ar: 'مؤسسة' },
      { value: '10,000+', label: 'Students', label_ar: 'طالب' },
      { value: '200+', label: 'Courses', label_ar: 'دورة' },
      { value: '99.9%', label: 'Uptime', label_ar: 'وقت التشغيل' },
    ],
  },
  courses: {
    title: 'Popular Courses',
    title_ar: 'الدورات الشائعة',
    subtitle: 'Explore our most popular courses and start learning today',
    subtitle_ar: 'استكشف أشهر دوراتنا وابدأ التعلم اليوم',
    max_display: 6,
  },
  whyus: {
    title: 'Why Choose Us?',
    title_ar: 'لماذا تختارنا؟',
    subtitle: 'Built specifically for Islamic educational institutions',
    subtitle_ar: 'مصمم خصيصاً للمؤسسات التعليمية الإسلامية',
    reasons: [
      { title: 'Islamic-First Design', title_ar: 'تصميم إسلامي أولاً', desc: 'Every aspect designed with Islamic aesthetics and values in mind', desc_ar: 'كل جانب مصمم مع مراعاة الجماليات والقيم الإسلامية' },
      { title: 'Bilingual Support', title_ar: 'دعم ثنائي اللغة', desc: 'Full Arabic and English support with RTL layout', desc_ar: 'دعم كامل للعربية والإنجليزية مع تخطيط من اليمين لليسار' },
      { title: 'Comprehensive Tools', title_ar: 'أدوات شاملة', desc: 'From course management to financial reports, everything in one place', desc_ar: 'من إدارة الدورات إلى التقارير المالية، كل شيء في مكان واحد' },
      { title: 'Secure & Reliable', title_ar: 'آمن وموثوق', desc: 'Enterprise-grade security with role-based access control', desc_ar: 'أمان على مستوى المؤسسات مع التحكم في الوصول القائم على الأدوار' },
    ],
  },
  howitworks: {
    title: 'How It Works',
    title_ar: 'كيف يعمل',
    subtitle: 'Get started in just 3 simple steps',
    subtitle_ar: 'ابدأ في 3 خطوات بسيطة فقط',
    steps: [
      { title: 'Create Your Account', title_ar: 'أنشئ حسابك', desc: 'Sign up and set up your institution profile in minutes', desc_ar: 'سجل وأعد ملف مؤسستك في دقائق' },
      { title: 'Set Up Courses', title_ar: 'أعد الدورات', desc: 'Add your courses, teachers, and learning materials', desc_ar: 'أضف دوراتك ومعلميك والمواد التعليمية' },
      { title: 'Start Teaching', title_ar: 'ابدأ التدريس', desc: 'Invite students and begin your educational journey', desc_ar: 'ادعُ الطلاب وابدأ رحلتك التعليمية' },
    ],
  },
  testimonials: {
    title: 'What Our Users Say',
    title_ar: 'ماذا يقول مستخدمونا',
    subtitle: 'Hear from educators and students who use our platform',
    subtitle_ar: 'اسمع من المعلمين والطلاب الذين يستخدمون منصتنا',
    items: [
      { name: 'Ahmad Al-Farsi', name_ar: 'أحمد الفارسي', role: 'Quran Teacher', role_ar: 'معلم قرآن', photo_url: '', text: 'This platform has transformed how I teach Quran online. The tools are intuitive and comprehensive.', text_ar: 'لقد غيرت هذه المنصة طريقة تدريسي للقرآن عبر الإنترنت. الأدوات بديهية وشاملة.', rating: 5 },
      { name: 'Fatima Hassan', name_ar: 'فاطمة حسن', role: 'Student', role_ar: 'طالبة', photo_url: '', text: 'I love how easy it is to track my progress and access course materials anytime.', text_ar: 'أحب سهولة تتبع تقدمي والوصول إلى مواد الدورة في أي وقت.', rating: 5 },
      { name: 'Sheikh Omar', name_ar: 'الشيخ عمر', role: 'Academy Director', role_ar: 'مدير أكاديمية', photo_url: '', text: 'Managing our entire academy has never been easier. Highly recommended!', text_ar: 'إدارة أكاديميتنا بالكامل لم تكن أسهل من أي وقت مضى. موصى به بشدة!', rating: 5 },
    ],
  },
  instructors: {
    title: 'Meet Our Instructors',
    title_ar: 'تعرف على معلمينا',
    subtitle: 'Learn from experienced and qualified educators',
    subtitle_ar: 'تعلم من معلمين ذوي خبرة ومؤهلين',
    max_display: 4,
  },
  pricing: {
    title: 'Simple, Transparent Pricing',
    title_ar: 'أسعار بسيطة وشفافة',
  },
  faq: {
    title: 'Frequently Asked Questions',
    title_ar: 'الأسئلة الشائعة',
    subtitle: 'Find answers to common questions about our platform',
    subtitle_ar: 'اعثر على إجابات للأسئلة الشائعة حول منصتنا',
    items: [
      { question: 'How do I get started?', question_ar: 'كيف أبدأ؟', answer: 'Simply sign up for an account, set up your institution profile, add your courses and teachers, then invite your students to start learning.', answer_ar: 'ما عليك سوى التسجيل للحصول على حساب، وإعداد ملف مؤسستك، وإضافة دوراتك ومعلميك، ثم دعوة طلابك لبدء التعلم.' },
      { question: 'Is there a free trial?', question_ar: 'هل هناك تجربة مجانية؟', answer: 'Yes! We offer a free trial so you can explore all features before committing to a plan.', answer_ar: 'نعم! نقدم تجربة مجانية حتى تتمكن من استكشاف جميع الميزات قبل الالتزام بخطة.' },
      { question: 'Can I customize the platform?', question_ar: 'هل يمكنني تخصيص المنصة؟', answer: 'Absolutely. You can customize branding, course structure, certificates, and much more from the admin dashboard.', answer_ar: 'بالتأكيد. يمكنك تخصيص العلامة التجارية وهيكل الدورة والشهادات وغير ذلك الكثير من لوحة تحكم المشرف.' },
      { question: 'Is the platform available in Arabic?', question_ar: 'هل المنصة متاحة باللغة العربية؟', answer: 'Yes, the platform fully supports both Arabic (RTL) and English with easy language switching.', answer_ar: 'نعم، المنصة تدعم بالكامل اللغتين العربية (RTL) والإنجليزية مع سهولة التبديل بين اللغات.' },
    ],
  },
  newsletter: {
    title: 'Stay Updated',
    title_ar: 'ابق على اطلاع',
    subtitle: 'Subscribe to our newsletter for the latest updates and educational resources',
    subtitle_ar: 'اشترك في نشرتنا البريدية لآخر التحديثات والموارد التعليمية',
    button_text: 'Subscribe',
    button_text_ar: 'اشترك',
  },
  cta: {
    title: 'Ready to Transform Your Institution?',
    title_ar: 'هل أنت مستعد لتحويل مؤسستك؟',
    subtitle: 'Join hundreds of Islamic schools and academies already using our platform',
    subtitle_ar: 'انضم إلى مئات المدارس والأكاديميات الإسلامية التي تستخدم منصتنا بالفعل',
  },
};

export interface NavItem {
  label: string;
  label_ar: string;
  id: string;
}

export const defaultNavItems: NavItem[] = [
  { label: 'Home', label_ar: 'الرئيسية', id: 'top' },
  { label: 'Features', label_ar: 'المميزات', id: 'features' },
  { label: 'Courses', label_ar: 'الدورات', id: 'courses' },
  { label: 'Pricing', label_ar: 'الأسعار', id: 'pricing' },
  { label: 'FAQ', label_ar: 'الأسئلة', id: 'faq' },
];

export interface FooterColumn {
  title: string;
  title_ar: string;
  items: { label: string; label_ar: string; url: string }[];
}

export const defaultFooterContent: Record<string, any> = {
  logo_source: 'dark' as 'dark' | 'light' | 'favicon',
  title: '',
  title_ar: '',
  description: '',
  description_ar: '',
  branding_column: 0,
  columns_count: 3,
  columns: [
    { title: 'Quick Links', title_ar: 'روابط سريعة', items: [
      { label: 'Home', label_ar: 'الرئيسية', url: '#top' },
      { label: 'Features', label_ar: 'المميزات', url: '#features' },
      { label: 'Pricing', label_ar: 'الأسعار', url: '#pricing' },
    ]},
    { title: 'Resources', title_ar: 'الموارد', items: [
      { label: 'Blog', label_ar: 'المدونة', url: '/blogs' },
      { label: 'FAQ', label_ar: 'الأسئلة الشائعة', url: '#faq' },
    ]},
    { title: 'Legal', title_ar: 'قانوني', items: [
      { label: 'Privacy Policy', label_ar: 'سياسة الخصوصية', url: '/policy/privacy-policy' },
      { label: 'Terms of Service', label_ar: 'شروط الخدمة', url: '/policy/terms-of-service' },
    ]},
  ] as FooterColumn[],
};

export const defaultGeneralContent: Record<string, any> = {
  meta_title: '',
  meta_title_ar: '',
  meta_description: '',
  meta_description_ar: '',
  meta_keywords: '',
  og_title: '',
  og_description: '',
  og_image: '',
  header_style: 'classic',
  nav_items: defaultNavItems,
  nav_items_left: null,
  nav_items_right: null,
  footer: defaultFooterContent,
  sections_order: DEFAULT_SECTION_ORDER,
  sections_visible: Object.fromEntries(DEFAULT_SECTION_ORDER.map(k => [k, true])),
};

/** Helper: resolve bilingual field */
export const getField = (content: Record<string, any>, field: string, isAr: boolean): string => {
  if (!content) return '';
  return isAr ? (content[`${field}_ar`] || content[field] || '') : (content[field] || '');
};
