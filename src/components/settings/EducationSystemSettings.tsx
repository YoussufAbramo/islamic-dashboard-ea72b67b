import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, BookOpen, ClipboardCheck, Award, Calendar, GraduationCap } from 'lucide-react';

const EducationSystemSettings = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [teacherCanChat, setTeacherCanChat] = useState(() => {
    return localStorage.getItem('app_teacher_can_chat') !== 'false';
  });

  useEffect(() => {
    localStorage.setItem('app_teacher_can_chat', String(teacherCanChat));
  }, [teacherCanChat]);

  const comingSoonFeatures = [
    {
      icon: BookOpen,
      label: isAr ? 'نظام الواجبات المنزلية' : 'Homework System',
      desc: isAr ? 'تعيين ومتابعة الواجبات المنزلية للطلاب' : 'Assign and track student homework',
    },
    {
      icon: ClipboardCheck,
      label: isAr ? 'نظام الامتحانات' : 'Examination System',
      desc: isAr ? 'إنشاء وإدارة الامتحانات عبر الإنترنت' : 'Create and manage online exams',
    },
    {
      icon: Award,
      label: isAr ? 'نظام الدرجات' : 'Grading System',
      desc: isAr ? 'نظام تقييم ودرجات شامل' : 'Comprehensive grading and evaluation system',
    },
    {
      icon: Calendar,
      label: isAr ? 'الجدولة التلقائية' : 'Auto Scheduling',
      desc: isAr ? 'جدولة تلقائية للحصص بناءً على التوفر' : 'Automated lesson scheduling based on availability',
    },
    {
      icon: GraduationCap,
      label: isAr ? 'مسارات التعلم' : 'Learning Paths',
      desc: isAr ? 'مسارات تعليمية مخصصة لكل طالب' : 'Custom learning paths for each student',
    },
  ];

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

      {/* Coming Soon Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-primary" />
            {isAr ? 'ميزات النظام التعليمي' : 'Education System Features'}
          </CardTitle>
          <CardDescription>{isAr ? 'ميزات إضافية قادمة للنظام التعليمي' : 'Additional education system features coming soon'}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {comingSoonFeatures.map((feature, i) => {
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
        </CardContent>
      </Card>
    </div>
  );
};

export default EducationSystemSettings;
