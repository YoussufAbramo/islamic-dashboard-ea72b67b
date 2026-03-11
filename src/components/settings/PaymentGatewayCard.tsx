import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Check, CreditCard, Eye, EyeOff, Loader2, Save } from 'lucide-react';
import { useAppSettings } from '@/contexts/AppSettingsContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { notifyError } from '@/lib/notifyError';

interface PaymentGatewayCardProps {
  isAr: boolean;
}

const GATEWAYS = [
  {
    id: 'paypal',
    name: 'PayPal',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/PayPal.svg/200px-PayPal.svg.png',
    color: 'hsl(210 80% 50%)',
    fields: [
      { key: 'client_id', label: 'Client ID', labelAr: 'معرف العميل' },
      { key: 'client_secret', label: 'Client Secret', labelAr: 'سر العميل', secret: true },
    ],
  },
  {
    id: 'stripe',
    name: 'Stripe',
    logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/ba/Stripe_Logo%2C_revised_2016.svg/200px-Stripe_Logo%2C_revised_2016.svg.png',
    color: 'hsl(260 60% 55%)',
    fields: [
      { key: 'publishable_key', label: 'Publishable Key', labelAr: 'المفتاح العام' },
      { key: 'secret_key', label: 'Secret Key', labelAr: 'المفتاح السري', secret: true },
    ],
  },
  {
    id: 'fawaterak',
    name: 'Fawaterak',
    logo: 'https://fawaterak.com/wp-content/uploads/2023/01/fawaterak-logo.png',
    color: 'hsl(160 50% 40%)',
    fields: [
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API', secret: true },
      { key: 'vendor_key', label: 'Vendor Key', labelAr: 'مفتاح البائع', secret: true },
    ],
  },
  {
    id: 'xpay',
    name: 'Xpay',
    logo: 'https://xpay.app/wp-content/uploads/2022/07/xpay-logo.png',
    color: 'hsl(30 80% 50%)',
    fields: [
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API', secret: true },
      { key: 'community_id', label: 'Community ID', labelAr: 'معرف المجتمع' },
    ],
  },
  {
    id: 'paymob',
    name: 'Paymob',
    logo: 'https://paymob.com/images/paymobLogo.png',
    color: 'hsl(200 70% 45%)',
    fields: [
      { key: 'api_key', label: 'API Key', labelAr: 'مفتاح API', secret: true },
      { key: 'integration_id', label: 'Integration ID', labelAr: 'معرف التكامل' },
      { key: 'iframe_id', label: 'iFrame ID', labelAr: 'معرف الإطار' },
    ],
  },
] as const;

export type PaymentGatewayId = typeof GATEWAYS[number]['id'];

const PaymentGatewayCard = ({ isAr }: PaymentGatewayCardProps) => {
  const { pending, updatePending } = useAppSettings();
  const selectedGateway = pending.paymentGateway || '';

  const [activeGateways, setActiveGateways] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem('app_active_gateways');
    return saved ? JSON.parse(saved) : { paypal: true, paymob: true };
  });
  const [apiValues, setApiValues] = useState<Record<string, Record<string, string>>>({});
  const [maskedValues, setMaskedValues] = useState<Record<string, Record<string, string>>>({});
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [saving, setSaving] = useState<string | null>(null);
  const [logoErrors, setLogoErrors] = useState<Record<string, boolean>>({});
  const [savedGateways, setSavedGateways] = useState<Set<string>>(new Set());

  // Load saved keys on mount
  useEffect(() => {
    const loadSavedKeys = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('manage-accounts', {
          body: { action: 'get_payment_keys' },
        });
        if (!error && data?.gateways) {
          const masks: Record<string, Record<string, string>> = {};
          const active: Record<string, boolean> = { ...activeGateways };
          const saved = new Set<string>();
          for (const gw of data.gateways) {
            masks[gw.gateway_id] = gw.masked_keys;
            active[gw.gateway_id] = gw.is_active;
            saved.add(gw.gateway_id);
          }
          setMaskedValues(masks);
          setActiveGateways(active);
          setSavedGateways(saved);
          localStorage.setItem('app_active_gateways', JSON.stringify(active));
        }
      } catch {
        // Silently fail on load — keys may not be configured yet
      }
    };
    loadSavedKeys();
  }, []);

  const toggleGateway = (id: string) => {
    const next = { ...activeGateways, [id]: !activeGateways[id] };
    setActiveGateways(next);
    localStorage.setItem('app_active_gateways', JSON.stringify(next));
    if (!next[id] && selectedGateway === id) {
      updatePending({ paymentGateway: '' });
    }
    if (next[id]) {
      updatePending({ paymentGateway: id });
    }
  };

  const updateApiValue = (gwId: string, field: string, value: string) => {
    setApiValues(prev => ({
      ...prev,
      [gwId]: { ...(prev[gwId] || {}), [field]: value },
    }));
  };

  const saveApiKeys = async (gwId: string) => {
    const keys = apiValues[gwId] || {};
    const hasValues = Object.values(keys).some(v => v.trim() !== '');
    if (!hasValues) {
      notifyError({ error: 'VAL_API_KEY_EMPTY', isAr });
      return;
    }

    setSaving(gwId);
    try {
      const { data, error } = await supabase.functions.invoke('manage-accounts', {
        body: {
          action: 'store_payment_keys',
          gateway: gwId,
          keys,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(isAr ? 'تم حفظ مفاتيح API بنجاح' : 'API keys saved successfully');

      // Update masked values and clear raw input
      const newMasked: Record<string, string> = {};
      for (const [key, value] of Object.entries(keys)) {
        if (typeof value === 'string' && value.length > 4) {
          newMasked[key] = '•'.repeat(value.length - 4) + value.slice(-4);
        } else {
          newMasked[key] = '••••';
        }
      }
      setMaskedValues(prev => ({ ...prev, [gwId]: { ...(prev[gwId] || {}), ...newMasked } }));
      setSavedGateways(prev => new Set(prev).add(gwId));
      setApiValues(prev => ({ ...prev, [gwId]: {} }));
    } catch (err: any) {
      notifyError({ error: 'GENERAL_SAVE_FAILED', isAr, rawMessage: err.message });
      console.error('Payment key save error:', err);
    } finally {
      setSaving(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          {isAr ? 'بوابات الدفع' : 'Payment Gateways'}
        </CardTitle>
        <CardDescription>
          {isAr ? 'فعّل وإعدادات بوابات الدفع' : 'Activate and configure payment gateways'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {GATEWAYS.map((gw) => {
          const isActive = !!activeGateways[gw.id];
          const isSaved = savedGateways.has(gw.id);
          return (
            <div
              key={gw.id}
              className={`rounded-xl border-2 transition-all ${
                isActive ? 'border-primary/50 bg-primary/5' : 'border-border'
              }`}
            >
              {/* Gateway Header */}
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-16 flex items-center justify-center rounded-lg bg-background border border-border overflow-hidden">
                    {logoErrors[gw.id] ? (
                      <span className="text-xs font-bold text-muted-foreground">{gw.name}</span>
                    ) : (
                      <img
                        src={gw.logo}
                        alt={gw.name}
                        className="h-8 w-14 object-contain"
                        onError={() => setLogoErrors(prev => ({ ...prev, [gw.id]: true }))}
                      />
                    )}
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">{gw.name}</h4>
                    <div className="flex gap-1 mt-0.5">
                      {isActive && (
                        <Badge variant="outline" className="text-[10px]">
                          {isAr ? 'مفعّل' : 'Active'}
                        </Badge>
                      )}
                      {isSaved && (
                        <Badge variant="secondary" className="text-[10px]">
                          <Check className="h-2.5 w-2.5 me-0.5" />
                          {isAr ? 'مُهيأ' : 'Configured'}
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                <Switch
                  checked={isActive}
                  onCheckedChange={() => toggleGateway(gw.id)}
                />
              </div>

              {/* API Fields (shown when active) */}
              {isActive && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  {gw.fields.map((field) => {
                    const masked = maskedValues[gw.id]?.[field.key];
                    const rawValue = apiValues[gw.id]?.[field.key] || '';
                    return (
                      <div key={field.key} className="space-y-1">
                        <Label className="text-xs">
                          {isAr ? field.labelAr : field.label}
                        </Label>
                        <div className="relative">
                          <Input
                            type={field.secret && !showSecrets[`${gw.id}_${field.key}`] ? 'password' : 'text'}
                            value={rawValue}
                            onChange={(e) => updateApiValue(gw.id, field.key, e.target.value)}
                            placeholder={masked || `${isAr ? 'أدخل' : 'Enter'} ${field.label}`}
                            className="text-sm pe-10"
                          />
                          {field.secret && (
                            <button
                              type="button"
                              onClick={() => setShowSecrets(prev => ({
                                ...prev,
                                [`${gw.id}_${field.key}`]: !prev[`${gw.id}_${field.key}`],
                              }))}
                              className="absolute end-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                              {showSecrets[`${gw.id}_${field.key}`] ? (
                                <EyeOff className="h-4 w-4" />
                              ) : (
                                <Eye className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div className="flex items-center justify-between pt-2">
                    <p className="text-[10px] text-muted-foreground">
                      {isAr
                        ? 'مفاتيح API مخزنة بأمان على الخادم'
                        : 'API keys are stored securely server-side'}
                    </p>
                    <Button
                      size="sm"
                      onClick={() => saveApiKeys(gw.id)}
                      disabled={saving === gw.id}
                    >
                      {saving === gw.id ? (
                        <Loader2 className="h-3 w-3 me-1 animate-spin" />
                      ) : (
                        <Save className="h-3 w-3 me-1" />
                      )}
                      {isAr ? 'حفظ' : 'Save'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};

export { GATEWAYS };
export default PaymentGatewayCard;
