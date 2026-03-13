import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';

type Language = 'en' | 'ar';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  dir: 'ltr' | 'rtl';
}

const translations: Record<Language, Record<string, string>> = {
  en: {
    // Auth
    'auth.login': 'Log In',
    'auth.signup': 'Sign Up',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.fullName': 'Full Name',
    'auth.phone': 'Phone',
    'auth.role': 'Role',
    'auth.student': 'Student',
    'auth.teacher': 'Teacher',
    'auth.admin': 'Super Admin',
    'auth.noAccount': "Don't have an account?",
    'auth.hasAccount': 'Already have an account?',
    'auth.logout': 'Log Out',
    'auth.forgotPassword': 'Forgot Password?',
    'auth.resetPassword': 'Reset Password',
    'auth.newPassword': 'New Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.sendReset': 'Send Reset Link',
    'auth.updatePassword': 'Update Password',

    // Nav
    'nav.dashboard': 'Dashboard',
    'nav.courses': 'Courses',
    'nav.students': 'Students',
    'nav.teachers': 'Teachers',
    'nav.support': 'Support',
    'nav.timetable': 'Timetable',
    'nav.subscriptions': 'Subscriptions',
    'nav.chats': 'Chats',
    'nav.profile': 'Profile',
    'nav.announcements': 'Announcements',
    'nav.notifications': 'Notifications',

    // Dashboard
    'dashboard.welcome': 'Welcome',
    'dashboard.totalStudents': 'Total Students',
    'dashboard.totalTeachers': 'Total Teachers',
    'dashboard.totalCourses': 'Total Courses',
    'dashboard.activeSubscriptions': 'Active Subscriptions',
    'dashboard.openTickets': 'Open Tickets',
    'dashboard.upcomingLessons': 'Upcoming Lessons',
    'dashboard.myCourses': 'My Courses',
    'dashboard.myStudents': 'My Students',
    'dashboard.mySchedule': 'My Schedule',

    // Courses
    'courses.title': 'Courses',
    'courses.create': 'Create Course',
    'courses.edit': 'Edit Course',
    'courses.name': 'Course Name',
    'courses.description': 'Description',
    'courses.status': 'Status',
    'courses.draft': 'Draft',
    'courses.published': 'Published',
    'courses.archived': 'Archived',
    'courses.sections': 'Sections',
    'courses.addSection': 'Add Section',
    'courses.topics': 'Insert Main Course Topics',
    'courses.addTopic': 'Add Topic',
    'courses.lessons': 'Lessons',
    'courses.addLesson': 'Add Lesson',
    'courses.lessonType': 'Lesson Type',
    'courses.tableOfContent': 'Table of Content',
    'courses.revision': 'Revision',
    'courses.readListen': 'Read & Listen',
    'courses.memorization': 'Memorization',
    'courses.exercise': 'Exercise',
    'courses.homework': 'Homework',
    'courses.textMatch': 'Text Match',
    'courses.chooseCorrect': 'Choose Correct Answer',
    'courses.chooseMultiple': 'Choose Multiple Answers',
    'courses.rearrange': 'Rearrange Words',
    'courses.missingText': 'Write Missing Text',
    'courses.trueFalse': 'True & False',
    'courses.listenChoose': 'Listen & Choose',

    // Students
    'students.title': 'Students',
    'students.name': 'Name',
    'students.phone': 'Phone',
    'students.email': 'Email',
    'students.renewalDate': 'Renewal Date',
    'students.subscribedCourses': 'Subscribed Courses',
    'students.details': 'Details',
    'students.assignedTeacher': 'Assigned Teacher',
    'students.schedule': 'Schedule',
    'students.subscriptionType': 'Subscription Type',
    'students.monthly': 'Monthly',
    'students.yearly': 'Yearly',
    'students.lessonDuration': 'Lesson Duration',
    'students.weeklyRepeat': 'Weekly Repeat',
    'students.attendance': 'Attendance',
    'students.subscribeDate': 'Subscribe Date',

    // Teachers
    'teachers.title': 'Teachers',
    'teachers.name': 'Name',
    'teachers.phone': 'Phone',
    'teachers.email': 'Email',
    'teachers.details': 'Details',
    'teachers.weeklyTimetable': 'Weekly Timetable',
    'teachers.assignedStudents': 'Assigned Students',
    'teachers.courses': 'Courses',
    'teachers.personalInfo': 'Personal Info',
    'teachers.bio': 'Bio',
    'teachers.specialization': 'Specialization',

    // Support
    'support.title': 'Support Help Center',
    'support.tickets': 'Tickets',
    'support.createTicket': 'Create Ticket',
    'support.subject': 'Subject',
    'support.message': 'Message',
    'support.department': 'Department',
    'support.priority': 'Priority',
    'support.status': 'Status',
    'support.open': 'Open',
    'support.inProgress': 'In Progress',
    'support.resolved': 'Resolved',
    'support.closed': 'Closed',
    'support.low': 'Low',
    'support.medium': 'Medium',
    'support.high': 'High',
    'support.urgent': 'Urgent',
    'support.general': 'General',
    'support.technical': 'Technical',
    'support.billing': 'Billing',
    'support.academic': 'Academic',

    // Timetable
    'timetable.title': 'Timetable',
    'timetable.upcoming': 'Upcoming',
    'timetable.past': 'Past',
    'timetable.date': 'Date',
    'timetable.time': 'Time',
    'timetable.course': 'Course',
    'timetable.teacher': 'Teacher',
    'timetable.student': 'Student',
    'timetable.duration': 'Duration',
    'timetable.status': 'Status',
    'timetable.scheduled': 'Scheduled',
    'timetable.completed': 'Completed',
    'timetable.cancelled': 'Cancelled',

    // Subscriptions
    'subscriptions.title': 'Subscriptions',
    'subscriptions.student': 'Student',
    'subscriptions.course': 'Course',
    'subscriptions.teacher': 'Teacher',
    'subscriptions.type': 'Billing Cycle',
    'subscriptions.startDate': 'Start Date',
    'subscriptions.renewalDate': 'Renewal Date',
    'subscriptions.status': 'Status',
    'subscriptions.active': 'Active',
    'subscriptions.expired': 'Expired',
    'subscriptions.cancelled': 'Cancelled',

    // Chats
    'chats.title': 'Chats',
    'chats.sendMessage': 'Send Message',
    'chats.typeMessage': 'Type a message...',
    'chats.suspended': 'Suspended',
    'chats.suspend': 'Suspend',
    'chats.unsuspend': 'Unsuspend',
    'chats.deleteMessage': 'Delete Message',
    'chats.noMessages': 'No messages yet',

    // Common
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.delete': 'Delete',
    'common.edit': 'Edit',
    'common.view': 'View',
    'common.create': 'Create',
    'common.search': 'Search...',
    'common.actions': 'Actions',
    'common.loading': 'Loading...',
    'common.noData': 'No data available',
    'common.back': 'Back',
    'common.minutes': 'minutes',
    'common.present': 'Present',
    'common.absent': 'Absent',
    'common.late': 'Late',
    'common.excused': 'Excused',
    'common.darkMode': 'Dark Mode',
    'common.lightMode': 'Light Mode',
    'common.language': 'Language',
  },
  ar: {
    // Auth
    'auth.login': 'تسجيل الدخول',
    'auth.signup': 'إنشاء حساب',
    'auth.email': 'البريد الإلكتروني',
    'auth.password': 'كلمة المرور',
    'auth.fullName': 'الاسم الكامل',
    'auth.phone': 'الهاتف',
    'auth.role': 'الدور',
    'auth.student': 'طالب',
    'auth.teacher': 'معلم',
    'auth.admin': 'مدير عام',
    'auth.noAccount': 'ليس لديك حساب؟',
    'auth.hasAccount': 'لديك حساب بالفعل؟',
    'auth.logout': 'تسجيل الخروج',
    'auth.forgotPassword': 'نسيت كلمة المرور؟',
    'auth.resetPassword': 'إعادة تعيين كلمة المرور',
    'auth.newPassword': 'كلمة المرور الجديدة',
    'auth.confirmPassword': 'تأكيد كلمة المرور',
    'auth.sendReset': 'إرسال رابط إعادة التعيين',
    'auth.updatePassword': 'تحديث كلمة المرور',

    // Nav
    'nav.dashboard': 'لوحة التحكم',
    'nav.courses': 'الدورات',
    'nav.students': 'الطلاب',
    'nav.teachers': 'المعلمون',
    'nav.support': 'الدعم',
    'nav.timetable': 'الجدول الزمني',
    'nav.subscriptions': 'الاشتراكات',
    'nav.chats': 'المحادثات',
    'nav.profile': 'الملف الشخصي',
    'nav.announcements': 'الإعلانات',
    'nav.notifications': 'الإشعارات',

    // Dashboard
    'dashboard.welcome': 'مرحباً',
    'dashboard.totalStudents': 'إجمالي الطلاب',
    'dashboard.totalTeachers': 'إجمالي المعلمين',
    'dashboard.totalCourses': 'إجمالي الدورات',
    'dashboard.activeSubscriptions': 'الاشتراكات النشطة',
    'dashboard.openTickets': 'التذاكر المفتوحة',
    'dashboard.upcomingLessons': 'الدروس القادمة',
    'dashboard.myCourses': 'دوراتي',
    'dashboard.myStudents': 'طلابي',
    'dashboard.mySchedule': 'جدولي',

    // Courses
    'courses.title': 'الدورات',
    'courses.create': 'إنشاء دورة',
    'courses.edit': 'تعديل الدورة',
    'courses.name': 'اسم الدورة',
    'courses.description': 'الوصف',
    'courses.status': 'الحالة',
    'courses.draft': 'مسودة',
    'courses.published': 'منشورة',
    'courses.archived': 'مؤرشفة',
    'courses.sections': 'الأقسام',
    'courses.addSection': 'إضافة قسم',
    'courses.topics': 'أدرج مواضيع الدورة الرئيسية',
    'courses.addTopic': 'إضافة موضوع',
    'courses.lessons': 'الدروس',
    'courses.addLesson': 'إضافة درس',
    'courses.lessonType': 'نوع الدرس',
    'courses.tableOfContent': 'فهرس المحتويات',
    'courses.revision': 'مراجعة',
    'courses.readListen': 'اقرأ واستمع',
    'courses.memorization': 'حفظ',
    'courses.exercise': 'تمرين',
    'courses.homework': 'واجب منزلي',
    'courses.textMatch': 'مطابقة النص',
    'courses.chooseCorrect': 'اختر الإجابة الصحيحة',
    'courses.chooseMultiple': 'اختر إجابات متعددة',
    'courses.rearrange': 'إعادة ترتيب الكلمات',
    'courses.missingText': 'اكتب النص المفقود',
    'courses.trueFalse': 'صح أم خطأ',
    'courses.listenChoose': 'استمع واختر',

    // Students
    'students.title': 'الطلاب',
    'students.name': 'الاسم',
    'students.phone': 'الهاتف',
    'students.email': 'البريد الإلكتروني',
    'students.renewalDate': 'تاريخ التجديد',
    'students.subscribedCourses': 'الدورات المشترك فيها',
    'students.details': 'التفاصيل',
    'students.assignedTeacher': 'المعلم المعين',
    'students.schedule': 'الجدول',
    'students.subscriptionType': 'نوع الاشتراك',
    'students.monthly': 'شهري',
    'students.yearly': 'سنوي',
    'students.lessonDuration': 'مدة الدرس',
    'students.weeklyRepeat': 'التكرار الأسبوعي',
    'students.attendance': 'الحضور',
    'students.subscribeDate': 'تاريخ الاشتراك',

    // Teachers
    'teachers.title': 'المعلمون',
    'teachers.name': 'الاسم',
    'teachers.phone': 'الهاتف',
    'teachers.email': 'البريد الإلكتروني',
    'teachers.details': 'التفاصيل',
    'teachers.weeklyTimetable': 'الجدول الأسبوعي',
    'teachers.assignedStudents': 'الطلاب المعينون',
    'teachers.courses': 'الدورات',
    'teachers.personalInfo': 'المعلومات الشخصية',
    'teachers.bio': 'السيرة الذاتية',
    'teachers.specialization': 'التخصص',

    // Support
    'support.title': 'مركز الدعم',
    'support.tickets': 'التذاكر',
    'support.createTicket': 'إنشاء تذكرة',
    'support.subject': 'الموضوع',
    'support.message': 'الرسالة',
    'support.department': 'القسم',
    'support.priority': 'الأولوية',
    'support.status': 'الحالة',
    'support.open': 'مفتوحة',
    'support.inProgress': 'قيد التنفيذ',
    'support.resolved': 'تم الحل',
    'support.closed': 'مغلقة',
    'support.low': 'منخفضة',
    'support.medium': 'متوسطة',
    'support.high': 'عالية',
    'support.urgent': 'عاجلة',
    'support.general': 'عام',
    'support.technical': 'تقني',
    'support.billing': 'الفوترة',
    'support.academic': 'أكاديمي',

    // Timetable
    'timetable.title': 'الجدول الزمني',
    'timetable.upcoming': 'القادم',
    'timetable.past': 'الماضي',
    'timetable.date': 'التاريخ',
    'timetable.time': 'الوقت',
    'timetable.course': 'الدورة',
    'timetable.teacher': 'المعلم',
    'timetable.student': 'الطالب',
    'timetable.duration': 'المدة',
    'timetable.status': 'الحالة',
    'timetable.scheduled': 'مجدول',
    'timetable.completed': 'مكتمل',
    'timetable.cancelled': 'ملغى',

    // Subscriptions
    'subscriptions.title': 'الاشتراكات',
    'subscriptions.student': 'الطالب',
    'subscriptions.course': 'الدورة',
    'subscriptions.teacher': 'المعلم',
    'subscriptions.type': 'دورة الفوترة',
    'subscriptions.startDate': 'تاريخ البدء',
    'subscriptions.renewalDate': 'تاريخ التجديد',
    'subscriptions.status': 'الحالة',
    'subscriptions.active': 'نشط',
    'subscriptions.expired': 'منتهي',
    'subscriptions.cancelled': 'ملغى',

    // Chats
    'chats.title': 'المحادثات',
    'chats.sendMessage': 'إرسال رسالة',
    'chats.typeMessage': 'اكتب رسالة...',
    'chats.suspended': 'معلق',
    'chats.suspend': 'تعليق',
    'chats.unsuspend': 'إلغاء التعليق',
    'chats.deleteMessage': 'حذف الرسالة',
    'chats.noMessages': 'لا توجد رسائل بعد',

    // Common
    'common.save': 'حفظ',
    'common.cancel': 'إلغاء',
    'common.delete': 'حذف',
    'common.edit': 'تعديل',
    'common.view': 'عرض',
    'common.create': 'إنشاء',
    'common.search': 'بحث...',
    'common.actions': 'إجراءات',
    'common.loading': 'جاري التحميل...',
    'common.noData': 'لا توجد بيانات',
    'common.back': 'رجوع',
    'common.minutes': 'دقائق',
    'common.present': 'حاضر',
    'common.absent': 'غائب',
    'common.late': 'متأخر',
    'common.excused': 'معذور',
    'common.darkMode': 'الوضع الداكن',
    'common.lightMode': 'الوضع الفاتح',
    'common.language': 'اللغة',
  },
};

const LanguageContext = createContext<LanguageContextType | null>(null);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    if (saved) return saved;
    const defaultLang = localStorage.getItem('app_default_language') as Language;
    return defaultLang || 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
  }, []);

  const t = useCallback((key: string) => {
    return translations[language][key] || key;
  }, [language]);

  const dir = language === 'ar' ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.dir = dir;
    document.documentElement.lang = language;
  }, [dir, language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
};
