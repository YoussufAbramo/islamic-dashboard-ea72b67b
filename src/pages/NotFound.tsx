import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted p-4">
      <Card className="max-w-md w-full border-destructive/20">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
          </div>

          <div className="space-y-2">
            <h1 className="text-5xl font-bold text-destructive">404</h1>
            <p className="text-xl font-semibold">
              {isAr ? 'الصفحة غير موجودة' : 'Page Not Found'}
            </p>
            <p className="text-sm text-muted-foreground">
              {isAr
                ? `المسار "${location.pathname}" غير موجود. قد يكون الرابط قديمًا أو الصفحة قد حُذفت.`
                : `The path "${location.pathname}" doesn't exist. The link might be outdated or the page may have been removed.`}
            </p>
          </div>

          <div className="flex items-center gap-3 justify-center">
            <Button variant="outline" onClick={() => navigate(-1)}>
              <ArrowLeft className="h-4 w-4 me-2" />
              {isAr ? 'رجوع' : 'Go Back'}
            </Button>
            <Button onClick={() => navigate('/')}>
              <Home className="h-4 w-4 me-2" />
              {isAr ? 'الصفحة الرئيسية' : 'Home'}
            </Button>
          </div>

          <p className="text-xs text-muted-foreground border-t border-border pt-4">
            {isAr ? 'رمز الخطأ: ' : 'Error Code: '}
            <span className="font-mono">PAGE_NOT_FOUND</span>
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default NotFound;
