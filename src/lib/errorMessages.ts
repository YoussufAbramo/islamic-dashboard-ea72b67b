export interface ErrorDetail {
  code: string;
  title: string;
  titleAr: string;
  message: string;
  messageAr: string;
  suggestion: string;
  suggestionAr: string;
  category: 'auth' | 'validation' | 'database' | 'network' | 'storage' | 'general';
}

const errorMap: Record<string, ErrorDetail> = {
  // ── Auth ──
  AUTH_INVALID_CREDS: {
    code: 'AUTH_INVALID_CREDS',
    title: 'Invalid Credentials',
    titleAr: 'بيانات الدخول غير صحيحة',
    message: 'The email or password you entered is incorrect.',
    messageAr: 'البريد الإلكتروني أو كلمة المرور التي أدخلتها غير صحيحة.',
    suggestion: 'Double-check your email and password. If you forgot your password, use the "Forgot Password" link.',
    suggestionAr: 'تحقق مرة أخرى من بريدك الإلكتروني وكلمة المرور. إذا نسيت كلمة المرور، استخدم رابط "نسيت كلمة المرور".',
    category: 'auth',
  },
  AUTH_EMAIL_TAKEN: {
    code: 'AUTH_EMAIL_TAKEN',
    title: 'Email Already Registered',
    titleAr: 'البريد الإلكتروني مسجل بالفعل',
    message: 'An account with this email address already exists.',
    messageAr: 'يوجد حساب بهذا البريد الإلكتروني بالفعل.',
    suggestion: 'Try logging in instead, or use a different email address.',
    suggestionAr: 'حاول تسجيل الدخول بدلاً من ذلك، أو استخدم بريدًا إلكترونيًا مختلفًا.',
    category: 'auth',
  },
  AUTH_WEAK_PASSWORD: {
    code: 'AUTH_WEAK_PASSWORD',
    title: 'Weak Password',
    titleAr: 'كلمة المرور ضعيفة',
    message: 'Your password must be at least 6 characters long.',
    messageAr: 'يجب أن تكون كلمة المرور 6 أحرف على الأقل.',
    suggestion: 'Choose a stronger password with at least 6 characters, including letters and numbers.',
    suggestionAr: 'اختر كلمة مرور أقوى مكونة من 6 أحرف على الأقل، تتضمن حروفًا وأرقامًا.',
    category: 'auth',
  },
  AUTH_PASSWORD_MISMATCH: {
    code: 'AUTH_PASSWORD_MISMATCH',
    title: 'Passwords Do Not Match',
    titleAr: 'كلمات المرور غير متطابقة',
    message: 'The password and confirmation password you entered do not match.',
    messageAr: 'كلمة المرور وتأكيد كلمة المرور اللذان أدخلتهما غير متطابقين.',
    suggestion: 'Re-enter both password fields carefully to make sure they match.',
    suggestionAr: 'أعد إدخال كلمتي المرور بعناية للتأكد من تطابقهما.',
    category: 'auth',
  },
  AUTH_SESSION_EXPIRED: {
    code: 'AUTH_SESSION_EXPIRED',
    title: 'Session Expired',
    titleAr: 'انتهت صلاحية الجلسة',
    message: 'Your login session has expired. Please sign in again.',
    messageAr: 'انتهت صلاحية جلسة تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.',
    suggestion: 'Log in again to continue using the application.',
    suggestionAr: 'قم بتسجيل الدخول مرة أخرى لمتابعة استخدام التطبيق.',
    category: 'auth',
  },
  AUTH_NO_ROLE: {
    code: 'AUTH_NO_ROLE',
    title: 'Account Type Not Selected',
    titleAr: 'لم يتم اختيار نوع الحساب',
    message: 'Please select your account type before logging in.',
    messageAr: 'يرجى اختيار نوع حسابك قبل تسجيل الدخول.',
    suggestion: 'Select Student, Teacher, or Admin before submitting the form.',
    suggestionAr: 'اختر طالب أو معلم أو مدير قبل إرسال النموذج.',
    category: 'auth',
  },
  AUTH_RESET_MISSING_EMAIL: {
    code: 'AUTH_RESET_MISSING_EMAIL',
    title: 'Email Required',
    titleAr: 'البريد الإلكتروني مطلوب',
    message: 'Please enter your email address to receive the reset link.',
    messageAr: 'يرجى إدخال بريدك الإلكتروني لتلقي رابط إعادة التعيين.',
    suggestion: 'Enter the email address associated with your account.',
    suggestionAr: 'أدخل البريد الإلكتروني المرتبط بحسابك.',
    category: 'auth',
  },

  // ── Validation ──
  VAL_REQUIRED_FIELDS: {
    code: 'VAL_REQUIRED_FIELDS',
    title: 'Missing Required Fields',
    titleAr: 'حقول مطلوبة مفقودة',
    message: 'Please fill in all required fields before submitting.',
    messageAr: 'يرجى ملء جميع الحقول المطلوبة قبل الإرسال.',
    suggestion: 'Look for fields marked with an asterisk (*) and fill them in.',
    suggestionAr: 'ابحث عن الحقول المعلمة بعلامة النجمة (*) واملأها.',
    category: 'validation',
  },
  VAL_SELECT_USER: {
    code: 'VAL_SELECT_USER',
    title: 'User Selection Required',
    titleAr: 'يجب اختيار مستخدم',
    message: 'Please select at least one user to proceed.',
    messageAr: 'يرجى اختيار مستخدم واحد على الأقل للمتابعة.',
    suggestion: 'Choose a student, teacher, or group member from the dropdown.',
    suggestionAr: 'اختر طالبًا أو معلمًا أو عضوًا في المجموعة من القائمة.',
    category: 'validation',
  },
  VAL_GROUP_NAME: {
    code: 'VAL_GROUP_NAME',
    title: 'Group Name Required',
    titleAr: 'اسم المجموعة مطلوب',
    message: 'Please enter a name for the group chat.',
    messageAr: 'يرجى إدخال اسم للمحادثة الجماعية.',
    suggestion: 'Type a descriptive name for the group.',
    suggestionAr: 'اكتب اسمًا وصفيًا للمجموعة.',
    category: 'validation',
  },
  VAL_SELECT_SUBSCRIPTION: {
    code: 'VAL_SELECT_SUBSCRIPTION',
    title: 'Subscription Required',
    titleAr: 'يجب اختيار اشتراك',
    message: 'Please select a subscription before creating the invoice.',
    messageAr: 'يرجى اختيار اشتراك قبل إنشاء الفاتورة.',
    suggestion: 'Select an active subscription from the dropdown.',
    suggestionAr: 'اختر اشتراكًا نشطًا من القائمة.',
    category: 'validation',
  },
  VAL_SELECT_STUDENT_COURSE: {
    code: 'VAL_SELECT_STUDENT_COURSE',
    title: 'Student and Course Required',
    titleAr: 'يجب اختيار الطالب والدورة',
    message: 'Please select both a student and a course.',
    messageAr: 'يرجى اختيار الطالب والدورة معًا.',
    suggestion: 'Select a student and a course from the dropdowns before proceeding.',
    suggestionAr: 'اختر طالبًا ودورة من القوائم قبل المتابعة.',
    category: 'validation',
  },
  VAL_API_KEY_EMPTY: {
    code: 'VAL_API_KEY_EMPTY',
    title: 'API Key Required',
    titleAr: 'مفتاح API مطلوب',
    message: 'Please enter at least one API key.',
    messageAr: 'يرجى إدخال مفتاح API واحد على الأقل.',
    suggestion: 'Enter the required API keys for the payment gateway.',
    suggestionAr: 'أدخل مفاتيح API المطلوبة لبوابة الدفع.',
    category: 'validation',
  },
  VAL_BACKUP_NAME: {
    code: 'VAL_BACKUP_NAME',
    title: 'Backup Name Required',
    titleAr: 'اسم النسخة الاحتياطية مطلوب',
    message: 'Please enter a name for the backup file.',
    messageAr: 'يرجى إدخال اسم لملف النسخة الاحتياطية.',
    suggestion: 'Type a descriptive name for the backup.',
    suggestionAr: 'اكتب اسمًا وصفيًا للنسخة الاحتياطية.',
    category: 'validation',
  },
  VAL_SELECT_TABLE: {
    code: 'VAL_SELECT_TABLE',
    title: 'Table Selection Required',
    titleAr: 'يجب اختيار جدول',
    message: 'Please select at least one table to back up.',
    messageAr: 'يرجى اختيار جدول واحد على الأقل للنسخ الاحتياطي.',
    suggestion: 'Check at least one table from the list.',
    suggestionAr: 'حدد جدولًا واحدًا على الأقل من القائمة.',
    category: 'validation',
  },

  // ── Database ──
  DB_PERMISSION_DENIED: {
    code: 'DB_PERMISSION_DENIED',
    title: 'Permission Denied',
    titleAr: 'تم رفض الإذن',
    message: 'You do not have permission to perform this action.',
    messageAr: 'ليس لديك إذن لتنفيذ هذا الإجراء.',
    suggestion: 'Contact your administrator if you believe this is an error.',
    suggestionAr: 'تواصل مع المسؤول إذا كنت تعتقد أن هذا خطأ.',
    category: 'database',
  },
  DB_NOT_FOUND: {
    code: 'DB_NOT_FOUND',
    title: 'Record Not Found',
    titleAr: 'السجل غير موجود',
    message: 'The requested record could not be found.',
    messageAr: 'لم يتم العثور على السجل المطلوب.',
    suggestion: 'The record may have been deleted or you may not have access to it.',
    suggestionAr: 'ربما تم حذف السجل أو ليس لديك حق الوصول إليه.',
    category: 'database',
  },
  DB_CONSTRAINT: {
    code: 'DB_CONSTRAINT',
    title: 'Data Constraint Error',
    titleAr: 'خطأ في قيود البيانات',
    message: 'This action violates a data constraint. The record may already exist or depend on other data.',
    messageAr: 'هذا الإجراء ينتهك قيود البيانات. قد يكون السجل موجودًا بالفعل أو يعتمد على بيانات أخرى.',
    suggestion: 'Check for duplicate entries or ensure related data exists first.',
    suggestionAr: 'تحقق من وجود إدخالات مكررة أو تأكد من وجود البيانات المرتبطة أولاً.',
    category: 'database',
  },
  DB_OPERATION_FAILED: {
    code: 'DB_OPERATION_FAILED',
    title: 'Operation Failed',
    titleAr: 'فشلت العملية',
    message: 'The database operation could not be completed.',
    messageAr: 'لم تكتمل عملية قاعدة البيانات.',
    suggestion: 'Try again. If the problem persists, contact support.',
    suggestionAr: 'حاول مرة أخرى. إذا استمرت المشكلة، تواصل مع الدعم.',
    category: 'database',
  },

  // ── Network ──
  NET_TIMEOUT: {
    code: 'NET_TIMEOUT',
    title: 'Connection Timeout',
    titleAr: 'انتهت مهلة الاتصال',
    message: 'The server took too long to respond.',
    messageAr: 'استغرق الخادم وقتًا طويلاً للاستجابة.',
    suggestion: 'Check your internet connection and try again.',
    suggestionAr: 'تحقق من اتصالك بالإنترنت وحاول مرة أخرى.',
    category: 'network',
  },
  NET_UNAVAILABLE: {
    code: 'NET_UNAVAILABLE',
    title: 'Server Unavailable',
    titleAr: 'الخادم غير متاح',
    message: 'The server is currently unavailable.',
    messageAr: 'الخادم غير متاح حاليًا.',
    suggestion: 'Try again in a few minutes. If the problem persists, contact support.',
    suggestionAr: 'حاول مرة أخرى بعد بضع دقائق. إذا استمرت المشكلة، تواصل مع الدعم.',
    category: 'network',
  },

  // ── Storage ──
  STORAGE_UPLOAD_FAILED: {
    code: 'STORAGE_UPLOAD_FAILED',
    title: 'Upload Failed',
    titleAr: 'فشل الرفع',
    message: 'The file could not be uploaded.',
    messageAr: 'لم يتم رفع الملف.',
    suggestion: 'Ensure the file is not too large and is in a supported format, then try again.',
    suggestionAr: 'تأكد أن الملف ليس كبيرًا جدًا وبتنسيق مدعوم، ثم حاول مرة أخرى.',
    category: 'storage',
  },
  STORAGE_EXPORT_FAILED: {
    code: 'STORAGE_EXPORT_FAILED',
    title: 'Export Failed',
    titleAr: 'فشل التصدير',
    message: 'The export operation could not be completed.',
    messageAr: 'لم تكتمل عملية التصدير.',
    suggestion: 'Try again. If the file is very large, try a smaller dataset.',
    suggestionAr: 'حاول مرة أخرى. إذا كان الملف كبيرًا جدًا، جرب مجموعة بيانات أصغر.',
    category: 'storage',
  },

  // ── General ──
  GENERAL_SAVE_FAILED: {
    code: 'GENERAL_SAVE_FAILED',
    title: 'Save Failed',
    titleAr: 'فشل الحفظ',
    message: 'Your changes could not be saved.',
    messageAr: 'لم يتم حفظ التغييرات.',
    suggestion: 'Check your connection and try again.',
    suggestionAr: 'تحقق من اتصالك وحاول مرة أخرى.',
    category: 'general',
  },
  GENERAL_UNKNOWN: {
    code: 'GENERAL_UNKNOWN',
    title: 'Something Went Wrong',
    titleAr: 'حدث خطأ ما',
    message: 'An unexpected error occurred.',
    messageAr: 'حدث خطأ غير متوقع.',
    suggestion: 'Try again. If the problem persists, contact support.',
    suggestionAr: 'حاول مرة أخرى. إذا استمرت المشكلة، تواصل مع الدعم.',
    category: 'general',
  },
  CHAT_SUSPENDED: {
    code: 'CHAT_SUSPENDED',
    title: 'Chat Suspended',
    titleAr: 'المحادثة معلقة',
    message: 'This chat has been suspended. You cannot send messages.',
    messageAr: 'تم تعليق هذه المحادثة. لا يمكنك إرسال رسائل.',
    suggestion: 'Contact an administrator to unsuspend the chat.',
    suggestionAr: 'تواصل مع المسؤول لإلغاء تعليق المحادثة.',
    category: 'general',
  },
};

// Map Supabase error messages to our error codes
const supabaseErrorMap: Record<string, string> = {
  'Invalid login credentials': 'AUTH_INVALID_CREDS',
  'invalid_credentials': 'AUTH_INVALID_CREDS',
  'User already registered': 'AUTH_EMAIL_TAKEN',
  'user_already_exists': 'AUTH_EMAIL_TAKEN',
  'Password should be at least 6 characters': 'AUTH_WEAK_PASSWORD',
  'Signup requires a valid password': 'AUTH_WEAK_PASSWORD',
  'Auth session missing': 'AUTH_SESSION_EXPIRED',
  'JWT expired': 'AUTH_SESSION_EXPIRED',
  'refresh_token_not_found': 'AUTH_SESSION_EXPIRED',
  'new row violates row-level security': 'DB_PERMISSION_DENIED',
  'permission denied': 'DB_PERMISSION_DENIED',
  'PGRST301': 'DB_NOT_FOUND',
  'duplicate key value': 'DB_CONSTRAINT',
  'violates unique constraint': 'DB_CONSTRAINT',
  'violates foreign key constraint': 'DB_CONSTRAINT',
  'FetchError': 'NET_TIMEOUT',
  'Failed to fetch': 'NET_UNAVAILABLE',
  'NetworkError': 'NET_UNAVAILABLE',
};

export function resolveErrorCode(error: any): string {
  if (typeof error === 'string') {
    // Check if it's a known code directly
    if (errorMap[error]) return error;
    // Check supabase mapping
    for (const [pattern, code] of Object.entries(supabaseErrorMap)) {
      if (error.toLowerCase().includes(pattern.toLowerCase())) return code;
    }
    return 'GENERAL_UNKNOWN';
  }
  if (error?.message) {
    for (const [pattern, code] of Object.entries(supabaseErrorMap)) {
      if (error.message.toLowerCase().includes(pattern.toLowerCase())) return code;
    }
  }
  if (error?.code) {
    for (const [pattern, code] of Object.entries(supabaseErrorMap)) {
      if (error.code === pattern) return code;
    }
  }
  return 'GENERAL_UNKNOWN';
}

export function getErrorDetail(codeOrError: string | any): ErrorDetail {
  if (typeof codeOrError === 'string' && errorMap[codeOrError]) {
    return errorMap[codeOrError];
  }
  const code = resolveErrorCode(codeOrError);
  return errorMap[code] || errorMap['GENERAL_UNKNOWN'];
}

export function getErrorByCode(code: string): ErrorDetail | undefined {
  return errorMap[code];
}

export const categoryLabels: Record<string, { en: string; ar: string }> = {
  auth: { en: 'Authentication', ar: 'المصادقة' },
  validation: { en: 'Validation', ar: 'التحقق' },
  database: { en: 'Database', ar: 'قاعدة البيانات' },
  network: { en: 'Network', ar: 'الشبكة' },
  storage: { en: 'Storage', ar: 'التخزين' },
  general: { en: 'General', ar: 'عام' },
};
