import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

const Profile = () => {
  const { user, profile, role } = useAuth();
  const { t } = useLanguage();
  const [form, setForm] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
    email: profile?.email || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;
    setLoading(true);
    await supabase.from('profiles').update(form).eq('id', user.id);
    setLoading(false);
    toast.success('Profile updated');
  };

  return (
    <div className="max-w-lg mx-auto space-y-4">
      <h1 className="text-2xl font-bold">{t('nav.profile')}</h1>
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
    </div>
  );
};

export default Profile;
