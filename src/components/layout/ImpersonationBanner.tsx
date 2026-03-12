import { ArrowLeft, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useImpersonation } from '@/contexts/ImpersonationContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const ImpersonationBanner = () => {
  const { isImpersonating, impersonatedUser, stopImpersonation } = useImpersonation();
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isAr = language === 'ar';

  if (!isImpersonating || !impersonatedUser) return null;

  const roleLabel = impersonatedUser.role === 'teacher'
    ? (isAr ? 'معلم' : 'Teacher')
    : (isAr ? 'طالب' : 'Student');

  const handleSwitchBack = () => {
    stopImpersonation();
    navigate('/dashboard');
    toast.success(isAr ? 'تم العودة إلى حساب المشرف' : 'Switched back to Admin view');
  };

  return (
    <div className="bg-amber-500/10 border-b border-amber-500/30 px-4 py-2 flex items-center justify-between gap-3 animate-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-2 text-sm">
        <Eye className="h-4 w-4 text-amber-600 shrink-0" />
        <span className="text-amber-700 dark:text-amber-400">
          {isAr ? 'تعرض حالياً كـ:' : 'Currently viewing as:'}
          {' '}
          <span className="font-semibold">{impersonatedUser.fullName}</span>
          {' '}
          <span className="text-amber-600/70 dark:text-amber-400/70">({roleLabel})</span>
        </span>
      </div>
      <Button
        size="sm"
        variant="outline"
        className="h-7 gap-1.5 border-amber-500/40 text-amber-700 dark:text-amber-400 hover:bg-amber-500/10 shrink-0"
        onClick={handleSwitchBack}
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        {isAr ? 'العودة للمشرف' : 'Switch Back'}
      </Button>
    </div>
  );
};

export default ImpersonationBanner;
