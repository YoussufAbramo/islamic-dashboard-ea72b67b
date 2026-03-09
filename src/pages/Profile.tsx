import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { Camera, Lock } from 'lucide-react';
import { getAvatarSignedUrl, uploadAndGetSignedUrl } from '@/lib/storage';
import { useEffect } from 'react';

const Profile = () => {
  const { user, profile, role } = useAuth();
  const { t, language } = useLanguage();
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
  });
  const [loading, setLoading] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);

  // Resolve avatar signed URL on mount / profile change
  useEffect(() => {
    if (profile?.avatar_url) {
      getAvatarSignedUrl(profile.avatar_url).then(setAvatarUrl);
    }
  }, [profile?.avatar_url]);

  // Password change
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone }).eq('id', user.id);
    setLoading(false);
    toast.success(language === 'ar' ? 'تم تحديث الملف الشخصي' : 'Profile updated');
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || !e.target.files[0] || !user) return;
    const file = e.target.files[0];
    const ext = file.name.split('.').pop();
    const filePath = `${user.id}/avatar.${ext}`;

    setUploading(true);
    const { signedUrl, error: uploadErr } = await uploadAndGetSignedUrl(filePath, file);
    if (uploadErr) {
      toast.error(uploadErr);
      setUploading(false);
      return;
    }

    // Store the storage path (not a URL) so we can always generate fresh signed URLs
    await supabase.from('profiles').update({ avatar_url: filePath }).eq('id', user.id);
    setAvatarUrl(signedUrl);
    setUploading(false);
    toast.success(language === 'ar' ? 'تم تحديث الصورة' : 'Avatar updated');
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword.length < 6) {
      toast.error(language === 'ar' ? 'كلمة المرور يجب أن تكون 6 أحرف على الأقل' : 'Password must be at least 6 characters');
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      toast.error(language === 'ar' ? 'كلمات المرور غير متطابقة' : 'Passwords do not match');
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
    setChangingPassword(false);
    if (error) {
      toast.error(error.message);
    } else {
      toast.success(language === 'ar' ? 'تم تغيير كلمة المرور' : 'Password changed successfully');
      setPasswords({ newPassword: '', confirmPassword: '' });
    }
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.profile')}</h1>

      {/* Avatar */}
      <Card>
        <CardContent className="flex items-center gap-4 pt-6">
          <div className="relative group">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {form.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <label className="absolute inset-0 flex items-center justify-center bg-background/60 rounded-full opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
              <Camera className="h-5 w-5 text-foreground" />
              <input type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} disabled={uploading} />
            </label>
          </div>
          <div>
            <p className="font-medium">{form.full_name || 'User'}</p>
            <p className="text-sm text-muted-foreground">{role || ''}</p>
            <p className="text-xs text-muted-foreground">{uploading ? (language === 'ar' ? 'جاري الرفع...' : 'Uploading...') : (language === 'ar' ? 'انقر على الصورة للتغيير' : 'Click avatar to change')}</p>
          </div>
        </CardContent>
      </Card>

      {/* Profile info */}
      <Card>
        <CardHeader><CardTitle>{t('nav.profile')}</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div><Label>{t('auth.fullName')}</Label><Input value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} /></div>
          <div><Label>{t('auth.email')}</Label><Input value={form.email} disabled /></div>
          <div><Label>{t('auth.phone')}</Label><Input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} /></div>
          <div><Label>{t('auth.role')}</Label><Input value={role || ''} disabled /></div>
          <Button onClick={handleSave} disabled={loading}>{loading ? t('common.loading') : t('common.save')}</Button>
        </CardContent>
      </Card>

      {/* Change Password */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-4 w-4" />
            {language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{t('auth.newPassword')}</Label>
            <Input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder={language === 'ar' ? '6 أحرف على الأقل' : 'Min 6 characters'}
            />
          </div>
          <div>
            <Label>{t('auth.confirmPassword')}</Label>
            <Input
              type="password"
              value={passwords.confirmPassword}
              onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
            />
          </div>
          <Button onClick={handlePasswordChange} disabled={changingPassword} variant="outline">
            {changingPassword ? t('common.loading') : (language === 'ar' ? 'تغيير كلمة المرور' : 'Change Password')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
