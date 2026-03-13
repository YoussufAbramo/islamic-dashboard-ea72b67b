import { useLanguage } from '@/contexts/LanguageContext';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { MessageSquare, BookOpen, ClipboardCheck, Award, Calendar, GraduationCap, Users, BarChart3, FileText, Globe, Shield, Bell, Zap, Target, Layers, Palette, Video, Mic, Smartphone, HeartHandshake, Star, BookMarked, Brain, Gamepad2, PenTool, Library, Lightbulb, MessageCircle } from 'lucide-react';
import { useState as __import_useState } from 'react';

const EducationSystemSettings = () => {
  const { language } = useLanguage();
  const { pending, updatePending, setTeacherBadges, setStudentBadges } = useAppSettings();
  const isAr = language === 'ar';

  const teacherCanChat = pending.developerMode; // kept for reference; chat uses its own key
  // Chat permission still uses localStorage directly (not part of pending/save flow for now)
  const [teacherCanChatState, setTeacherCanChatState] = __import_useState(() => {
    return localStorage.getItem('app_teacher_can_chat') !== 'false';
  });

  return (
    <div className="w-full">
      <Tabs defaultValue="general" className="w-full">
        <TabsList>
          <TabsTrigger value="general">
            <GraduationCap className="mr-2 h-4 w-4" />
            {isAr ? 'عام' : 'General'}
          </TabsTrigger>
          {/* <TabsTrigger value="design"><Palette className="mr-2 h-4 w-4" />{isAr ? 'تصميم' : 'Design'}</TabsTrigger> */}
          <TabsTrigger value="engagement">
            <HeartHandshake className="mr-2 h-4 w-4" />
            {isAr ? 'تفاعل' : 'Engagement'}
          </TabsTrigger>
          <TabsTrigger value="communication">
            <MessageCircle className="mr-2 h-4 w-4" />
            {isAr ? 'تواصل' : 'Communication'}
          </TabsTrigger>
          <TabsTrigger value="gamification">
            <Gamepad2 className="mr-2 h-4 w-4" />
            {isAr ? 'التحفيز' : 'Gamification'}
          </TabsTrigger>
        </TabsList>
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? 'إعدادات عامة' : 'General Settings'}</CardTitle>
              <CardDescription>{isAr ? 'إدارة الإعدادات الأساسية للنظام التعليمي.' : 'Manage basic settings for the education system.'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="developerMode">{isAr ? 'وضع المطور' : 'Developer Mode'}</Label>
                <Switch id="developerMode" checked={pending.developerMode} onCheckedChange={(checked) => updatePending({ developerMode: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="publicSignup">{isAr ? 'السماح بالتسجيل العام' : 'Allow Public Signup'}</Label>
                <Switch id="publicSignup" checked={pending.publicSignup} onCheckedChange={(checked) => updatePending({ publicSignup: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="requireApproval">{isAr ? 'تتطلب الموافقة' : 'Require Approval'}</Label>
                <Switch id="requireApproval" checked={pending.requireApproval} onCheckedChange={(checked) => updatePending({ requireApproval: checked })} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? 'إعدادات التفاعل' : 'Engagement Settings'}</CardTitle>
              <CardDescription>{isAr ? 'إدارة ميزات التفاعل في النظام التعليمي.' : 'Manage engagement features within the education system.'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="teacherBadges">{isAr ? 'شارة المعلم' : 'Teacher Badges'}</Label>
                <Switch id="teacherBadges" checked={pending.teacherBadges} onCheckedChange={(checked) => updatePending({ teacherBadges: checked })} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="studentBadges">{isAr ? 'شارة الطالب' : 'Student Badges'}</Label>
                <Switch id="studentBadges" checked={pending.studentBadges} onCheckedChange={(checked) => updatePending({ studentBadges: checked })} />
              </div>
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="forums">{isAr ? 'منتديات' : 'Forums'}</Label>
                <Switch id="forums" checked={pending.forums} onCheckedChange={(checked) => updatePending({ forums: checked })} />
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="communication" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? 'إعدادات الاتصال' : 'Communication Settings'}</CardTitle>
              <CardDescription>{isAr ? 'إدارة خيارات الاتصال داخل النظام التعليمي.' : 'Manage communication options within the education system.'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="teacherChat">{isAr ? 'دردشة المعلم' : 'Teacher Chat'}</Label>
                <Switch
                  id="teacherChat"
                  checked={teacherCanChatState}
                  onCheckedChange={(checked) => {
                    localStorage.setItem('app_teacher_can_chat', checked.toString());
                    setTeacherCanChatState(checked);
                  }}
                />
              </div>
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="studentChat">{isAr ? 'دردشة الطالب' : 'Student Chat'}</Label>
                <Switch id="studentChat" checked={pending.studentChat} onCheckedChange={(checked) => updatePending({ studentChat: checked })} />
              </div> */}
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="announcements">{isAr ? 'إعلانات' : 'Announcements'}</Label>
                <Switch id="announcements" checked={pending.announcements} onCheckedChange={(checked) => updatePending({ announcements: checked })} />
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gamification" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{isAr ? 'إعدادات التحفيز' : 'Gamification Settings'}</CardTitle>
              <CardDescription>{isAr ? 'إدارة عناصر التحفيز في النظام التعليمي.' : 'Manage gamification elements within the education system.'}</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="pointsSystem">{isAr ? 'نظام النقاط' : 'Points System'}</Label>
                <Switch id="pointsSystem" checked={pending.pointsSystem} onCheckedChange={(checked) => updatePending({ pointsSystem: checked })} />
              </div>
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="leaderboards">{isAr ? 'المتصدرين' : 'Leaderboards'}</Label>
                <Switch id="leaderboards" checked={pending.leaderboards} onCheckedChange={(checked) => updatePending({ leaderboards: checked })} />
              </div> */}
              {/* <div className="flex items-center justify-between">
                <Label htmlFor="rewards">{isAr ? 'المكافآت' : 'Rewards'}</Label>
                <Switch id="rewards" checked={pending.rewards} onCheckedChange={(checked) => updatePending({ rewards: checked })} />
              </div> */}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default EducationSystemSettings;
