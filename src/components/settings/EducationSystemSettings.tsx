import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, BookOpen, ClipboardCheck, Award, Calendar, GraduationCap, Users, BarChart3, FileText, Globe, Shield, Bell, Zap, Target, Layers, Palette, Video, Mic, Smartphone, HeartHandshake, Star, BookMarked, Brain, Gamepad2, PenTool, Library, Lightbulb, MessageCircle } from 'lucide-react';

const EducationSystemSettings = () => {
  const { language } = useLanguage();
  const { pending, setTeacherBadges, setStudentBadges } = useAppSettings();
  const isAr = language === 'ar';

  // Chat permission uses localStorage directly (instant toggle, no save needed)
  const [teacherCanChat, setTeacherCanChat] = useState(() => {
    return localStorage.getItem('app_teacher_can_chat') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('app_teacher_can_chat', String(teacherCanChat));
  }, [teacherCanChat]);

  const teacherFeatures = [
    { icon: BookOpen, label: isAr ? 'نظام الواجبات المنزلية' : 'Homework System', desc: isAr ? 'تعيين ومتابعة الواجبات المنزلية للطلاب' : 'Assign and track student homework' },
    { icon: ClipboardCheck, label: isAr ? 'نظام الامتحانات' : 'Examination System', desc: isAr ? 'إنشاء وإدارة الامتحانات عبر الإنترنت' : 'Create and manage online exams' },
    { icon: Award, label: isAr ? 'نظام الدرجات' : 'Grading System', desc: isAr ? 'نظام تقييم ودرجات شامل' : 'Comprehensive grading and evaluation system' },
    { icon: Calendar, label: isAr ? 'الجدولة التلقائية' : 'Auto Scheduling', desc: isAr ? 'جدولة تلقائية للحصص بناءً على التوفر' : 'Automated lesson scheduling based on availability' },
    { icon: BarChart3, label: isAr ? 'تقارير الأداء' : 'Performance Reports', desc: isAr ? 'تقارير تفصيلية عن أداء الطلاب' : 'Detailed student performance analytics' },
    { icon: Video, label: isAr ? 'الفصول المباشرة' : 'Live Classes', desc: isAr ? 'بث مباشر للدروس مع مشاركة الشاشة' : 'Live lesson streaming with screen sharing' },
    { icon: FileText, label: isAr ? 'بنك الأسئلة' : 'Question Bank', desc: isAr ? 'مكتبة أسئلة قابلة لإعادة الاستخدام' : 'Reusable question library for assessments' },
    { icon: MessageCircle, label: isAr ? 'ملاحظات الطلاب' : 'Student Notes', desc: isAr ? 'ملاحظات خاصة لكل طالب' : 'Private notes for each student' },
    { icon: PenTool, label: isAr ? 'السبورة التفاعلية' : 'Interactive Whiteboard', desc: isAr ? 'أداة رسم وكتابة تفاعلية' : 'Interactive drawing and writing tool' },
    { icon: Layers, label: isAr ? 'قوالب الدروس' : 'Lesson Templates', desc: isAr ? 'قوالب جاهزة لتسريع إنشاء الدروس' : 'Pre-built templates for faster lesson creation' },
  ];

  const studentFeatures = [
    { icon: GraduationCap, label: isAr ? 'مسارات التعلم' : 'Learning Paths', desc: isAr ? 'مسارات تعليمية مخصصة لكل طالب' : 'Custom learning paths for each student' },
    { icon: Brain, label: isAr ? 'التعلم التكيفي' : 'Adaptive Learning', desc: isAr ? 'محتوى يتكيف مع مستوى الطالب' : 'Content adapts to student level automatically' },
    { icon: Gamepad2, label: isAr ? 'التعلم بالألعاب' : 'Gamification', desc: isAr ? 'نقاط ومكافآت وشارات تحفيزية' : 'Points, rewards, and motivational badges' },
    { icon: Star, label: isAr ? 'لوحة المتصدرين' : 'Leaderboard', desc: isAr ? 'ترتيب الطلاب حسب الأداء' : 'Student ranking based on performance' },
    { icon: BookMarked, label: isAr ? 'المفضلات' : 'Bookmarks', desc: isAr ? 'حفظ الدروس والمحتوى المفضل' : 'Save favorite lessons and content' },
    { icon: Target, label: isAr ? 'الأهداف الشخصية' : 'Personal Goals', desc: isAr ? 'تعيين ومتابعة الأهداف التعليمية' : 'Set and track learning goals' },
    { icon: Mic, label: isAr ? 'التسميع الصوتي' : 'Audio Recitation', desc: isAr ? 'تسجيل التلاوة والتقييم التلقائي' : 'Record recitation with auto-evaluation' },
    { icon: Smartphone, label: isAr ? 'التطبيق المحمول' : 'Mobile App', desc: isAr ? 'تطبيق مخصص للهاتف المحمول' : 'Dedicated mobile application' },
    { icon: Bell, label: isAr ? 'تذكيرات الدراسة' : 'Study Reminders', desc: isAr ? 'تنبيهات ذكية لمواعيد المراجعة' : 'Smart reminders for review sessions' },
    { icon: Library, label: isAr ? 'المكتبة الرقمية' : 'Digital Library', desc: isAr ? 'مكتبة رقمية شاملة للمراجع' : 'Comprehensive digital reference library' },
  ];

  const platformFeatures = [
    { icon: Palette, label: isAr ? 'التخصيص المتقدم' : 'Advanced Theming', desc: isAr ? 'تخصيص كامل للواجهة والعلامة التجارية' : 'Full UI and branding customization' },
    { icon: Lightbulb, label: isAr ? 'الإشعارات الذكية' : 'Smart Notifications', desc: isAr ? 'إشعارات ذكية عبر البريد وSMS وواتساب' : 'Smart alerts via email, SMS, and WhatsApp' },
    { icon: BarChart3, label: isAr ? 'لوحة تحكم متقدمة' : 'Advanced Analytics', desc: isAr ? 'تحليلات متقدمة مع رسوم بيانية تفاعلية' : 'Advanced analytics with interactive charts' },
    { icon: Calendar, label: isAr ? 'التقويم المتكامل' : 'Calendar Integration', desc: isAr ? 'تكامل مع Google Calendar وOutlook' : 'Integration with Google Calendar & Outlook' },
    { icon: Zap, label: isAr ? 'الأتمتة والربط' : 'API & Webhooks', desc: isAr ? 'ربط مع أنظمة خارجية عبر API وWebhooks' : 'Connect with external systems via API & Webhooks' },
    { icon: Shield, label: isAr ? 'توليد الشهادات' : 'Certificate Generator', desc: isAr ? 'إنشاء شهادات تلقائية عند إتمام الدورات' : 'Auto-generate certificates on course completion' },
    { icon: HeartHandshake, label: isAr ? 'إدارة أولياء الأمور' : 'Parent Portal', desc: isAr ? 'بوابة خاصة لأولياء الأمور لمتابعة التقدم' : 'Dedicated portal for parents to track progress' },
    { icon: Globe, label: isAr ? 'متعدد اللغات' : 'Multi-Language', desc: isAr ? 'دعم لغات متعددة (تركي، أوردو، فرنسي)' : 'Support for Turkish, Urdu, French & more' },
    { icon: Users, label: isAr ? 'نظام الحضور التلقائي' : 'Attendance Automation', desc: isAr ? 'تتبع تلقائي للحضور والغياب' : 'Automated attendance tracking and reporting' },
    { icon: FileText, label: isAr ? 'بوابة الدفع' : 'Payment Gateway', desc: isAr ? 'تكامل مع بوابات الدفع الإلكتروني' : 'Integrated online payment processing' },
  ];

  const FeatureList = ({ features }: { features: typeof teacherFeatures }) => (
    <div className="space-y-3">
      {features.map((feature, i) => {
        const Icon = feature.icon;
        return (
          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{feature.label}</p>
                <p className="text-xs text-muted-foreground">{feature.desc}</p>
              </div>
            </div>
            <Badge variant="secondary" className="text-[10px] shrink-0">
              {isAr ? 'قريباً' : 'Coming Soon'}
            </Badge>
          </div>
        );
      })}
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Chat Permissions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5 text-primary" />
            {isAr ? 'صلاحيات المحادثة' : 'Chat Permissions'}
          </CardTitle>
          <CardDescription>{isAr ? 'التحكم في إمكانية بدء المعلمين للمحادثات' : 'Control whether teachers can initiate chats with students'}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>{isAr ? 'السماح للمعلمين ببدء محادثات' : 'Allow teachers to start chats'}</Label>
              <p className="text-sm text-muted-foreground">{isAr ? 'عند التفعيل، يمكن للمعلمين بدء محادثات مع طلابهم' : 'When enabled, teachers can initiate chats with their students'}</p>
            </div>
            <Switch checked={teacherCanChat} onCheckedChange={setTeacherCanChat} />
          </div>
        </CardContent>
      </Card>

      {/* Badges Management */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Award className="h-5 w-5 text-primary" />
            {isAr ? 'إدارة الشارات' : 'Badges Management'}
          </CardTitle>
          <CardDescription>{isAr ? 'التحكم في تفعيل نظام الشارات والإنجازات' : 'Control the badges and achievements system'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label className="text-sm font-medium">{isAr ? 'شارات المعلمين' : 'Teacher Badges'}</Label>
                <p className="text-xs text-muted-foreground">{isAr ? 'تفعيل نظام الشارات والإنجازات للمعلمين' : 'Enable badges and achievements for teachers'}</p>
              </div>
            </div>
            <Switch checked={pending.teacherBadges} onCheckedChange={setTeacherBadges} />
          </div>
          <div className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center">
                <GraduationCap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <Label className="text-sm font-medium">{isAr ? 'شارات الطلاب' : 'Student Badges'}</Label>
                <p className="text-xs text-muted-foreground">{isAr ? 'تفعيل نظام الشارات والإنجازات للطلاب' : 'Enable badges and achievements for students'}</p>
              </div>
            </div>
            <Switch checked={pending.studentBadges} onCheckedChange={setStudentBadges} />
          </div>
        </CardContent>
      </Card>

      {/* Coming Soon Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            {isAr ? 'ميزات النظام التعليمي' : 'Education System Features'}
          </CardTitle>
          <CardDescription>{isAr ? 'ميزات إضافية قادمة للنظام التعليمي' : 'Additional education system features coming soon'}</CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="teachers">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="teachers" className="text-xs gap-1">
                <Users className="h-3 w-3" />
                {isAr ? 'المعلمين' : 'Teachers'}
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">{teacherFeatures.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="students" className="text-xs gap-1">
                <GraduationCap className="h-3 w-3" />
                {isAr ? 'الطلاب' : 'Students'}
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">{studentFeatures.length}</Badge>
              </TabsTrigger>
              <TabsTrigger value="platform" className="text-xs gap-1">
                <Globe className="h-3 w-3" />
                {isAr ? 'المنصة' : 'Platform'}
                <Badge variant="secondary" className="text-[9px] px-1 py-0 h-4">{platformFeatures.length}</Badge>
              </TabsTrigger>
            </TabsList>
            <TabsContent value="teachers" className="mt-4">
              <FeatureList features={teacherFeatures} />
            </TabsContent>
            <TabsContent value="students" className="mt-4">
              <FeatureList features={studentFeatures} />
            </TabsContent>
            <TabsContent value="platform" className="mt-4">
              <FeatureList features={platformFeatures} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EducationSystemSettings;
