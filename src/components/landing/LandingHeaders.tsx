import { useNavigate } from 'react-router-dom';
import { BookOpen, ChevronRight, Menu, X, Moon, Sun, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export type HeaderStyleKey = 'classic' | 'centered' | 'cta-focused';

export interface LandingHeaderProps {
  appName: string;
  appLogo?: string;
  navSections: { label: string; id: string }[];
  navSectionsLeft?: { label: string; id: string }[];
  navSectionsRight?: { label: string; id: string }[];
  scrollTo: (id: string) => void;
  user: any;
  profile: any;
  avatarUrl: string;
  darkMode: boolean;
  toggleDark: () => void;
  language: string;
  setLanguage: (lang: string) => void;
  isAr: boolean;
  mobileMenuOpen: boolean;
  setMobileMenuOpen: (open: boolean) => void;
  signOut: () => Promise<void>;
}

// ─── Shared utilities ───

const LangToggle = ({ language, setLanguage, className = '' }: { language: string; setLanguage: (l: string) => void; className?: string }) => (
  <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className={`h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${className}`}>
    <span className="text-sm font-bold leading-none" style={{ fontFamily: "'Noto Kufi Arabic', sans-serif" }}>ع</span>
  </button>
);

const DarkToggle = ({ darkMode, toggleDark, className = '' }: { darkMode: boolean; toggleDark: () => void; className?: string }) => (
  <button onClick={toggleDark} className={`h-9 w-9 rounded-md flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-muted transition-colors ${className}`}>
    {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
  </button>
);

const LogoBlock = ({ appLogo, appName, scrollTo, showName = true }: { appLogo?: string; appName: string; scrollTo: (id: string) => void; showName?: boolean }) => (
  <button onClick={() => scrollTo('top')} className="flex items-center gap-2 shrink-0">
    {appLogo ? (
      <img src={appLogo} alt={appName} className="h-8 max-w-[140px] object-contain" />
    ) : (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
          <BookOpen className="h-4 w-4 text-primary-foreground" />
        </div>
        {showName && <span className="font-bold text-foreground hidden sm:block">{appName}</span>}
      </div>
    )}
  </button>
);

const UserActions = ({ user, profile, avatarUrl, navigate, signOut, isAr }: { user: any; profile: any; avatarUrl: string; navigate: any; signOut: () => Promise<void>; isAr: boolean }) => {
  if (user) {
    return (
      <div className="flex items-center gap-2 ms-1">
        <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
          <Avatar className="h-5 w-5">
            <AvatarImage src={avatarUrl} />
            <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
          </Avatar>
          {profile?.full_name || 'Dashboard'}
        </Button>
        <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={async () => { await signOut(); navigate('/login'); }}>
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    );
  }
  return (
    <Button size="sm" onClick={() => navigate('/login')} className="ms-1">
      {isAr ? 'ابدأ الآن' : 'Get Started'} <ChevronRight className="h-4 w-4 ms-1 rtl:-scale-x-100" />
    </Button>
  );
};

const MobileMenu = ({ navSections, scrollTo, darkMode, toggleDark, language, setLanguage, user, profile, navigate, signOut, isAr }: LandingHeaderProps & { navigate: any }) => (
  <div className="md:hidden pb-4 border-t border-border/40 pt-3 space-y-2">
    {navSections.map(link => (
      <button key={link.id} onClick={() => scrollTo(link.id)} className="block w-full text-start px-3 py-2 text-sm text-muted-foreground hover:text-foreground rounded-md hover:bg-muted">
        {link.label}
      </button>
    ))}
    <div className="flex gap-2 px-3 pt-2">
      <button onClick={toggleDark} className="h-9 w-9 rounded-md border border-border flex items-center justify-center text-muted-foreground">
        {darkMode ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </button>
      <button onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')} className="h-9 px-3 rounded-md border border-border text-sm text-muted-foreground">
        {language === 'en' ? 'العربية' : 'English'}
      </button>
    </div>
    <div className="px-3 pt-1">
      {user ? (
        <Button size="sm" className="w-full" onClick={() => navigate('/dashboard')}>{profile?.full_name || 'Dashboard'}</Button>
      ) : (
        <Button size="sm" className="w-full" onClick={() => navigate('/login')}>{isAr ? 'ابدأ الآن' : 'Get Started'}</Button>
      )}
    </div>
  </div>
);

// ═══════════════════════════════════════════
// Style 1: Classic — Logo left, nav + actions right
// ═══════════════════════════════════════════
export const HeaderClassic = (props: LandingHeaderProps) => {
  const navigate = useNavigate();
  const { appName, appLogo, navSections, scrollTo, darkMode, toggleDark, language, setLanguage, user, profile, avatarUrl, isAr, mobileMenuOpen, setMobileMenuOpen, signOut } = props;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <div className="flex items-center gap-8">
            <LogoBlock appLogo={appLogo} appName={appName} scrollTo={scrollTo} />
            <div className="hidden md:flex items-center gap-1">
              {navSections.map(link => (
                <button key={link.id} onClick={() => scrollTo(link.id)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
                  {link.label}
                </button>
              ))}
            </div>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <DarkToggle darkMode={darkMode} toggleDark={toggleDark} />
            <LangToggle language={language} setLanguage={setLanguage} />
            <UserActions user={user} profile={profile} avatarUrl={avatarUrl} navigate={navigate} signOut={signOut} isAr={isAr} />
          </div>
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileMenuOpen && <MobileMenu {...props} navigate={navigate} />}
      </div>
    </nav>
  );
};

// ═══════════════════════════════════════════
// Style 2: Centered — Logo centered, nav split symmetrically
// ═══════════════════════════════════════════
export const HeaderCentered = (props: LandingHeaderProps) => {
  const navigate = useNavigate();
  const { appName, appLogo, navSections, navSectionsLeft, navSectionsRight, scrollTo, darkMode, toggleDark, language, setLanguage, user, profile, avatarUrl, isAr, mobileMenuOpen, setMobileMenuOpen, signOut } = props;

  const mid = Math.ceil(navSections.length / 2);
  const leftNav = navSectionsLeft || navSections.slice(0, mid);
  const rightNav = navSectionsRight || navSections.slice(mid);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between md:justify-center relative">
          {/* Left nav */}
          <div className="hidden md:flex items-center gap-1 absolute left-4 lg:left-8">
            {leftNav.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
                {link.label}
              </button>
            ))}
          </div>

          {/* Centered logo */}
          <LogoBlock appLogo={appLogo} appName={appName} scrollTo={scrollTo} showName />

          {/* Right nav + actions */}
          <div className="hidden md:flex items-center gap-1 absolute right-4 lg:right-8">
            {rightNav.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
                {link.label}
              </button>
            ))}
            <div className="flex items-center gap-1 ms-2 border-s border-border/40 ps-2">
              <DarkToggle darkMode={darkMode} toggleDark={toggleDark} />
              <LangToggle language={language} setLanguage={setLanguage} />
            </div>
          </div>

          <Button variant="ghost" size="icon" className="md:hidden absolute right-0" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileMenuOpen && <MobileMenu {...props} navigate={navigate} />}
      </div>
    </nav>
  );
};

// ═══════════════════════════════════════════
// Style 3: CTA Focused — Strong visual hierarchy, prominent CTA
// ═══════════════════════════════════════════
export const HeaderCTAFocused = (props: LandingHeaderProps) => {
  const navigate = useNavigate();
  const { appName, appLogo, navSections, scrollTo, darkMode, toggleDark, language, setLanguage, user, profile, avatarUrl, isAr, mobileMenuOpen, setMobileMenuOpen, signOut } = props;

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-xl border-b border-border/40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          <LogoBlock appLogo={appLogo} appName={appName} scrollTo={scrollTo} />

          {/* Nav links — subdued */}
          <div className="hidden md:flex items-center gap-1">
            {navSections.map(link => (
              <button key={link.id} onClick={() => scrollTo(link.id)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors rounded-md hover:bg-muted">
                {link.label}
              </button>
            ))}
          </div>

          {/* CTA prominent */}
          <div className="hidden md:flex items-center gap-3">
            <div className="flex items-center gap-1">
              <DarkToggle darkMode={darkMode} toggleDark={toggleDark} />
              <LangToggle language={language} setLanguage={setLanguage} />
            </div>
            {user ? (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => navigate('/dashboard')} className="gap-2">
                  <Avatar className="h-5 w-5">
                    <AvatarImage src={avatarUrl} />
                    <AvatarFallback className="bg-primary/10 text-primary text-[10px]">{profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}</AvatarFallback>
                  </Avatar>
                  {profile?.full_name || 'Dashboard'}
                </Button>
                <Button variant="ghost" size="icon" className="h-9 w-9 text-muted-foreground hover:text-destructive" onClick={async () => { await signOut(); navigate('/login'); }}>
                  <LogOut className="h-4 w-4" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  {isAr ? 'تسجيل الدخول' : 'Sign In'}
                </Button>
                <Button size="sm" onClick={() => navigate('/signup')} className="shadow-md px-5 font-semibold">
                  {isAr ? 'ابدأ مجاناً' : 'Start Free'} <ChevronRight className="h-4 w-4 ms-1 rtl:-scale-x-100" />
                </Button>
              </div>
            )}
          </div>

          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileMenuOpen && <MobileMenu {...props} navigate={navigate} />}
      </div>
    </nav>
  );
};

// ─── Header resolver ───
export const HEADER_STYLES: Record<HeaderStyleKey, { label: string; labelAr: string; description: string; descriptionAr: string }> = {
  classic: {
    label: 'Classic Navigation',
    labelAr: 'تنقل كلاسيكي',
    description: 'Logo on the left, navigation links and actions on the right',
    descriptionAr: 'الشعار على اليسار وروابط التنقل والإجراءات على اليمين',
  },
  centered: {
    label: 'Centered Navigation',
    labelAr: 'تنقل مركزي',
    description: 'Logo centered with navigation links arranged symmetrically',
    descriptionAr: 'الشعار في المنتصف وروابط التنقل موزعة بشكل متماثل',
  },
  'cta-focused': {
    label: 'CTA Focused',
    labelAr: 'تركيز على الإجراء',
    description: 'Stronger visual hierarchy emphasizing the call-to-action button',
    descriptionAr: 'تسلسل بصري أقوى مع التركيز على زر الإجراء',
  },
};

export const getHeaderComponent = (style: HeaderStyleKey) => {
  switch (style) {
    case 'centered': return HeaderCentered;
    case 'cta-focused': return HeaderCTAFocused;
    default: return HeaderClassic;
  }
};
