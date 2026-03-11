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
import { notifyError } from '@/lib/notifyError';
import { Lock, Check } from 'lucide-react';
import { resolveAvatarUrl, CARTOON_AVATARS } from '@/lib/storage';
import { useEffect } from 'react';
import ImagePickerField from '@/components/media/ImagePickerField';

const CARTOON_AVATAR_LIST = Object.entries(CARTOON_AVATARS).map(([id, src]) => ({ id, src }));

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
  const isAr = language === 'ar';

  const [localAvatarId, setLocalAvatarId] = useState(profile?.avatar_url || '');

  useEffect(() => {
    if (profile?.avatar_url) {
      setLocalAvatarId(profile.avatar_url);
    }
  }, [profile?.avatar_url]);

  useEffect(() => {
    if (!localAvatarId) return;
    resolveAvatarUrl(localAvatarId).then(setAvatarUrl);
  }, [localAvatarId]);

  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
  const [changingPassword, setChangingPassword] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from('profiles').update({ full_name: form.full_name, phone: form.phone }).eq('id', user.id);
    setLoading(false);
    toast.success(isAr ? 'تم تحديث الملف الشخصي' : 'Profile updated');
  };

  const handleAvatarChange = async (url: string) => {
    if (!user) return;
    await supabase.from('profiles').update({ avatar_url: url }).eq('id', user.id);
    setLocalAvatarId(url);
    setAvatarUrl(url);
    toast.success(isAr ? 'تم تحديث الصورة' : 'Avatar updated');
  };

  const handleSelectCartoonAvatar = async (avatarId: string) => {
    if (!user) return;
    await supabase.from('profiles').update({ avatar_url: avatarId }).eq('id', user.id);
    setLocalAvatarId(avatarId);
    toast.success(isAr ? 'تم تحديث الصورة' : 'Avatar updated');
  };

  const handlePasswordChange = async () => {
    if (passwords.newPassword.length < 6) {
      notifyError({ error: 'AUTH_WEAK_PASSWORD', isAr });
      return;
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      notifyError({ error: 'AUTH_PASSWORD_MISMATCH', isAr });
      return;
    }
    setChangingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: passwords.newPassword });
    setChangingPassword(false);
    if (error) {
      notifyError({ error, isAr, rawMessage: error.message });
    } else {
      toast.success(isAr ? 'تم تغيير كلمة المرور' : 'Password changed successfully');
      setPasswords({ newPassword: '', confirmPassword: '' });
    }
  };

  const currentAvatarId = localAvatarId;

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.profile')}</h1>

      {/* Avatar */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-20 w-20">
              <AvatarImage src={avatarUrl} />
              <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                {form.full_name?.charAt(0)?.toUpperCase() || 'U'}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <p className="font-medium">{form.full_name || 'User'}</p>
              <p className="text-sm text-muted-foreground">{role || ''}</p>
            </div>
          </div>

          {/* Image picker (same as logo in app settings) */}
          <ImagePickerField
            label={isAr ? 'تغيير الصورة الشخصية' : 'Change Avatar'}
            value={avatarUrl}
            onChange={handleAvatarChange}
            bucket="avatars"
          />

          {/* Cartoon avatar picker */}
          <div>
            <Label className="text-xs text-muted-foreground mb-2 block">{isAr ? 'أو اختر صورة رمزية' : 'Or pick an avatar'}</Label>
            <div className="flex gap-3">
              {CARTOON_AVATAR_LIST.map((av) => (
                <button
                  key={av.id}
                  onClick={() => handleSelectCartoonAvatar(av.id)}
                  className={`relative rounded-full overflow-hidden border-2 transition-all h-14 w-14 shrink-0 ${
                    currentAvatarId === av.id ? 'border-primary ring-2 ring-primary/30' : 'border-border hover:border-primary/50'
                  }`}
                >
                  <img src={av.src} alt={av.id} className="h-full w-full object-cover" />
                  {currentAvatarId === av.id && (
                    <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                      <Check className="h-4 w-4 text-primary drop-shadow" />
                    </div>
                  )}
                </button>
              ))}
            </div>
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
            {isAr ? 'تغيير كلمة المرور' : 'Change Password'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label>{t('auth.newPassword')}</Label>
            <Input
              type="password"
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              placeholder={isAr ? '6 أحرف على الأقل' : 'Min 6 characters'}
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
            {changingPassword ? t('common.loading') : (isAr ? 'تغيير كلمة المرور' : 'Change Password')}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Profile;
