import { useState, useEffect } from 'react';
import { ACTION_BTN, ACTION_BTN_DESTRUCTIVE, ACTION_ICON } from '@/lib/actionBtnClass';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollText, Save, ExternalLink, Eye, EyeOff, Pencil } from 'lucide-react';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';
import { TableSkeleton } from '@/components/PageSkeleton';
import ContentEditor from '@/components/ContentEditor';

interface Policy {
  id: string;
  slug: string;
  title: string;
  title_ar: string;
  content: string;
  content_ar: string;
  is_published: boolean;
  updated_at: string;
}

const Policies = () => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [editPolicy, setEditPolicy] = useState<Policy | null>(null);
  const [saving, setSaving] = useState(false);

  const fetchPolicies = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('policies').select('*').order('slug');
    if (error) notifyError({ error, isAr, rawMessage: error.message });
    setPolicies((data as Policy[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchPolicies(); }, []);

  const handleSave = async () => {
    if (!editPolicy) return;
    setSaving(true);
    const { error } = await supabase.from('policies').update({
      title: editPolicy.title,
      title_ar: editPolicy.title_ar,
      content: editPolicy.content,
      content_ar: editPolicy.content_ar,
      is_published: editPolicy.is_published,
      updated_at: new Date().toISOString(),
    }).eq('id', editPolicy.id);
    setSaving(false);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم الحفظ' : 'Saved successfully');
    setEditPolicy(null);
    fetchPolicies();
  };

  const togglePublish = async (policy: Policy) => {
    const { error } = await supabase.from('policies').update({ is_published: !policy.is_published, updated_at: new Date().toISOString() }).eq('id', policy.id);
    if (error) { notifyError({ error, isAr, rawMessage: error.message }); return; }
    toast.success(isAr ? 'تم التحديث' : 'Updated');
    fetchPolicies();
  };

  if (loading) return <TableSkeleton rows={4} cols={4} />;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ScrollText className="h-6 w-6 text-primary" />
          {isAr ? 'السياسات' : 'Policies'}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {isAr ? 'إدارة صفحات السياسات والشروط' : 'Manage policy and terms pages'}
        </p>
      </div>

      <div className="grid gap-4">
        {policies.map(policy => (
          <Card key={policy.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <ScrollText className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">{isAr ? policy.title_ar || policy.title : policy.title}</p>
                  <p className="text-xs text-muted-foreground">/policies/{policy.slug}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => window.open(`/policies/${policy.slug}`, '_blank')}>
                  <ExternalLink className={ACTION_ICON} />
                </Button>
                <Button variant="ghost" size="icon" className={ACTION_BTN} onClick={() => setEditPolicy({ ...policy })}>
                  <Pencil className={ACTION_ICON} />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editPolicy} onOpenChange={(open) => !open && setEditPolicy(null)}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isAr ? 'تعديل السياسة' : 'Edit Policy'}</DialogTitle>
          </DialogHeader>
          {editPolicy && (
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div><Label>Title (EN)</Label><Input value={editPolicy.title} onChange={e => setEditPolicy({ ...editPolicy, title: e.target.value })} /></div>
                <div><Label>Title (AR)</Label><Input dir="rtl" value={editPolicy.title_ar} onChange={e => setEditPolicy({ ...editPolicy, title_ar: e.target.value })} /></div>
              </div>
              <div>
                <Label className="mb-2 block">Content (EN)</Label>
                <ContentEditor value={editPolicy.content} onChange={v => setEditPolicy({ ...editPolicy, content: v })} />
              </div>
              <div>
                <Label className="mb-2 block">Content (AR)</Label>
                <ContentEditor value={editPolicy.content_ar} onChange={v => setEditPolicy({ ...editPolicy, content_ar: v })} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setEditPolicy(null)}>{isAr ? 'إلغاء' : 'Cancel'}</Button>
                <Button onClick={handleSave} disabled={saving}>
                  <Save className="h-4 w-4 me-1" />{isAr ? 'حفظ' : 'Save'}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Policies;
