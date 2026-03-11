import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Shield, ShieldCheck, Lock, Plus, Trash2, Users, BookOpen, HeadphonesIcon, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import ComingSoonOverlay from '@/components/ComingSoonOverlay';

interface Role {
  id: string;
  name: string;
  nameAr: string;
  description: string;
  descriptionAr: string;
  permissions: string[];
  isSystem: boolean;
  isDeletable: boolean;
  icon: any;
  color: string;
}

const defaultRoles: Role[] = [
  { id: 'admin', name: 'Admin', nameAr: 'مشرف', description: 'Full system access with all permissions including user management and settings', descriptionAr: 'وصول كامل للنظام مع جميع الصلاحيات بما في ذلك إدارة المستخدمين والإعدادات', permissions: ['manage_users', 'manage_courses', 'manage_settings', 'manage_billing', 'manage_roles', 'view_reports', 'manage_support', 'manage_chats'], isSystem: true, isDeletable: false, icon: ShieldCheck, color: 'text-primary' },
  { id: 'teacher', name: 'Teacher', nameAr: 'معلم', description: 'Can manage courses, view assigned students, and communicate via chat', descriptionAr: 'يمكنه إدارة الدورات وعرض الطلاب المعينين والتواصل عبر المحادثة', permissions: ['manage_courses', 'view_students', 'manage_attendance', 'manage_chats', 'manage_certificates'], isSystem: true, isDeletable: false, icon: Users, color: 'text-blue-500' },
  { id: 'student', name: 'Student', nameAr: 'طالب', description: 'Can view enrolled courses, submit progress, and communicate with teachers', descriptionAr: 'يمكنه عرض الدورات المسجلة وتقديم التقدم والتواصل مع المعلمين', permissions: ['view_courses', 'submit_progress', 'view_certificates', 'manage_chats'], isSystem: true, isDeletable: false, icon: GraduationCap, color: 'text-emerald-500' },
  { id: 'content_creator', name: 'Education Content Creator', nameAr: 'منشئ المحتوى التعليمي', description: 'Can create and edit course content, sections, and lessons without admin access', descriptionAr: 'يمكنه إنشاء وتعديل محتوى الدورات والأقسام والدروس بدون صلاحيات المشرف', permissions: ['manage_courses', 'manage_lessons', 'view_students'], isSystem: true, isDeletable: true, icon: BookOpen, color: 'text-orange-500' },
  { id: 'support_agent', name: 'Customer Support', nameAr: 'دعم العملاء', description: 'Can manage support tickets, respond to inquiries, and view basic user information', descriptionAr: 'يمكنه إدارة تذاكر الدعم والرد على الاستفسارات وعرض معلومات المستخدم الأساسية', permissions: ['manage_support', 'view_students', 'view_courses'], isSystem: true, isDeletable: true, icon: HeadphonesIcon, color: 'text-purple-500' },
];

const allPermissions = [
  { key: 'manage_users', label: 'Manage Users', labelAr: 'إدارة المستخدمين' },
  { key: 'manage_courses', label: 'Manage Courses', labelAr: 'إدارة الدورات' },
  { key: 'manage_lessons', label: 'Manage Lessons', labelAr: 'إدارة الدروس' },
  { key: 'manage_settings', label: 'Manage Settings', labelAr: 'إدارة الإعدادات' },
  { key: 'manage_billing', label: 'Manage Billing', labelAr: 'إدارة الفوترة' },
  { key: 'manage_roles', label: 'Manage Roles', labelAr: 'إدارة الأدوار' },
  { key: 'manage_support', label: 'Manage Support', labelAr: 'إدارة الدعم' },
  { key: 'manage_chats', label: 'Manage Chats', labelAr: 'إدارة المحادثات' },
  { key: 'manage_attendance', label: 'Manage Attendance', labelAr: 'إدارة الحضور' },
  { key: 'manage_certificates', label: 'Manage Certificates', labelAr: 'إدارة الشهادات' },
  { key: 'view_courses', label: 'View Courses', labelAr: 'عرض الدورات' },
  { key: 'view_students', label: 'View Students', labelAr: 'عرض الطلاب' },
  { key: 'view_reports', label: 'View Reports', labelAr: 'عرض التقارير' },
  { key: 'view_certificates', label: 'View Certificates', labelAr: 'عرض الشهادات' },
  { key: 'submit_progress', label: 'Submit Progress', labelAr: 'تقديم التقدم' },
];

const RoleManagement = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [roles, setRoles] = useState<Role[]>(defaultRoles);
  const [createOpen, setCreateOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
  const [viewRole, setViewRole] = useState<Role | null>(null);

  const handleDelete = (id: string) => {
    setRoles(roles.filter(r => r.id !== id));
    setDeleteTarget(null);
    toast.success(isAr ? 'تم حذف الدور' : 'Role deleted');
  };

  return (
    <ComingSoonOverlay
      icon={Shield}
      description="Custom role creation and permission editing will be available soon."
      descriptionAr="ستتمكن قريباً من إنشاء وتعديل أدوار مخصصة مع صلاحيات محددة."
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Shield className="h-6 w-6 text-primary" />
              {isAr ? 'إدارة الأدوار' : 'Role Management'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isAr ? 'إدارة أدوار المستخدمين والصلاحيات' : 'Manage user roles and permissions'}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} disabled>
            <Plus className="h-4 w-4 me-2" />{isAr ? 'دور جديد' : 'New Role'}
            <Badge variant="secondary" className="ms-2 text-[10px]">{isAr ? 'قريباً' : 'Soon'}</Badge>
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {roles.map(role => {
            const Icon = role.icon;
            return (
              <Card key={role.id} className="hover:shadow-md transition-shadow cursor-pointer" onClick={() => setViewRole(role)}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center ${role.color}`}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <div>
                        <CardTitle className="text-base">{isAr ? role.nameAr : role.name}</CardTitle>
                        <div className="flex items-center gap-1.5 mt-1">
                          {!role.isDeletable && (
                            <Badge variant="outline" className="text-[10px] gap-1"><Lock className="h-2.5 w-2.5" />{isAr ? 'نظام' : 'System'}</Badge>
                          )}
                          <Badge variant="secondary" className="text-[10px]">{role.permissions.length} {isAr ? 'صلاحية' : 'permissions'}</Badge>
                        </div>
                      </div>
                    </div>
                    {role.isDeletable && (
                      <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-destructive/10 text-destructive hover:text-destructive" onClick={(e) => { e.stopPropagation(); setDeleteTarget(role.id); }}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{isAr ? role.descriptionAr : role.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {role.permissions.slice(0, 4).map(p => {
                      const perm = allPermissions.find(ap => ap.key === p);
                      return <Badge key={p} variant="outline" className="text-[10px]">{perm ? (isAr ? perm.labelAr : perm.label) : p}</Badge>;
                    })}
                    {role.permissions.length > 4 && <Badge variant="secondary" className="text-[10px]">+{role.permissions.length - 4}</Badge>}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{isAr ? 'مصفوفة الصلاحيات' : 'Permissions Matrix'}</CardTitle>
            <CardDescription>{isAr ? 'نظرة عامة على صلاحيات كل دور' : 'Overview of permissions for each role'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="min-w-[180px]">{isAr ? 'الصلاحية' : 'Permission'}</TableHead>
                    {roles.map(r => <TableHead key={r.id} className="text-center min-w-[100px]">{isAr ? r.nameAr : r.name}</TableHead>)}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allPermissions.map(perm => (
                    <TableRow key={perm.key}>
                      <TableCell className="font-medium text-sm">{isAr ? perm.labelAr : perm.label}</TableCell>
                      {roles.map(r => (
                        <TableCell key={r.id} className="text-center">
                          {r.permissions.includes(perm.key)
                            ? <span className="inline-block h-5 w-5 rounded-full bg-primary/10 text-primary text-xs leading-5">✓</span>
                            : <span className="inline-block h-5 w-5 rounded-full bg-muted text-muted-foreground text-xs leading-5">—</span>}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Dialog open={!!viewRole} onOpenChange={o => !o && setViewRole(null)}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                {viewRole && <viewRole.icon className={`h-5 w-5 ${viewRole.color}`} />}
                {viewRole && (isAr ? viewRole.nameAr : viewRole.name)}
              </DialogTitle>
            </DialogHeader>
            {viewRole && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">{isAr ? viewRole.descriptionAr : viewRole.description}</p>
                <div className="flex items-center gap-2">
                  {!viewRole.isDeletable && <Badge variant="outline" className="gap-1"><Lock className="h-3 w-3" />{isAr ? 'دور نظامي — لا يمكن حذفه' : 'System role — cannot be deleted'}</Badge>}
                </div>
                <div>
                  <Label className="mb-2 block">{isAr ? 'الصلاحيات' : 'Permissions'}</Label>
                  <div className="flex flex-wrap gap-1.5">
                    {viewRole.permissions.map(p => {
                      const perm = allPermissions.find(ap => ap.key === p);
                      return <Badge key={p} variant="secondary" className="text-xs">{perm ? (isAr ? perm.labelAr : perm.label) : p}</Badge>;
                    })}
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={!!deleteTarget} onOpenChange={o => !o && setDeleteTarget(null)}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{isAr ? 'حذف الدور' : 'Delete Role'}</AlertDialogTitle>
              <AlertDialogDescription>{isAr ? 'هل أنت متأكد من حذف هذا الدور؟ لا يمكن التراجع.' : 'Are you sure you want to delete this role? This cannot be undone.'}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{isAr ? 'إلغاء' : 'Cancel'}</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive text-destructive-foreground hover:bg-destructive/90" onClick={() => deleteTarget && handleDelete(deleteTarget)}>{isAr ? 'حذف' : 'Delete'}</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{isAr ? 'إنشاء دور جديد' : 'Create New Role'}</DialogTitle></DialogHeader>
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-lg font-medium">{isAr ? 'قريباً' : 'Coming Soon'}</p>
              <p className="text-sm text-muted-foreground mt-1">{isAr ? 'ستتمكن من إنشاء أدوار مخصصة مع صلاحيات محددة' : 'You will be able to create custom roles with specific permissions'}</p>
            </div>
            <DialogFooter><Button variant="outline" onClick={() => setCreateOpen(false)}>{isAr ? 'إغلاق' : 'Close'}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </ComingSoonOverlay>
  );
};

export default RoleManagement;
