import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Check, CreditCard } from 'lucide-react';
import { useAppSettings } from '@/contexts/AppSettingsContext';

interface PaymentGatewayCardProps {
  isAr: boolean;
}

const GATEWAYS = [
  { id: 'paypal', name: 'PayPal', icon: '💳', color: 'hsl(210 80% 50%)' },
  { id: 'stripe', name: 'Stripe', icon: '💎', color: 'hsl(260 60% 55%)' },
  { id: 'fawaterak', name: 'Fawaterak', icon: '🏦', color: 'hsl(160 50% 40%)' },
  { id: 'xpay', name: 'Xpay', icon: '⚡', color: 'hsl(30 80% 50%)' },
  { id: 'paymob', name: 'Paymob', icon: '🔒', color: 'hsl(200 70% 45%)' },
] as const;

export type PaymentGatewayId = typeof GATEWAYS[number]['id'];

const PaymentGatewayCard = ({ isAr }: PaymentGatewayCardProps) => {
  const { pending, updatePending } = useAppSettings();

  const selectedGateway = pending.paymentGateway || '';
  const apiKey = pending.paymentGatewayKey || '';

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5 text-primary" />
          {isAr ? 'بوابة الدفع' : 'Payment Gateway'}
        </CardTitle>
        <CardDescription>
          {isAr ? 'اختر بوابة الدفع وأدخل مفتاح API' : 'Select a payment gateway and enter your API key'}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {GATEWAYS.map((gw) => (
            <button
              key={gw.id}
              onClick={() => updatePending({ paymentGateway: gw.id, paymentGatewayKey: gw.id === selectedGateway ? apiKey : '' })}
              className={`relative flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                selectedGateway === gw.id
                  ? 'border-primary shadow-md scale-[1.02]'
                  : 'border-border hover:border-muted-foreground/30'
              }`}
            >
              <span className="text-2xl">{gw.icon}</span>
              <span className="text-xs font-medium">{gw.name}</span>
              {selectedGateway === gw.id && (
                <Check className="absolute top-2 end-2 h-4 w-4 text-primary" />
              )}
            </button>
          ))}
        </div>

        {selectedGateway && (
          <div className="space-y-2 pt-2 border-t border-border">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {GATEWAYS.find(g => g.id === selectedGateway)?.name}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {isAr ? 'مفعّل' : 'Selected'}
              </span>
            </div>
            <div className="space-y-1">
              <Label>{isAr ? 'مفتاح API' : 'API Key'}</Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => updatePending({ paymentGatewayKey: e.target.value })}
                placeholder={isAr ? 'أدخل مفتاح API الخاص بك' : 'Enter your API key'}
              />
              <p className="text-xs text-muted-foreground">
                {isAr
                  ? 'سيتم حفظ المفتاح بشكل آمن في إعدادات التطبيق'
                  : 'The key will be stored securely in app settings'}
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export { GATEWAYS };
export default PaymentGatewayCard;
