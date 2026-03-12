import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock, CalendarDays, ChevronUp, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { key: 'sun', en: 'Sun', ar: 'أحد', enFull: 'Sunday', arFull: 'الأحد' },
  { key: 'mon', en: 'Mon', ar: 'إثنين', enFull: 'Monday', arFull: 'الإثنين' },
  { key: 'tue', en: 'Tue', ar: 'ثلاثاء', enFull: 'Tuesday', arFull: 'الثلاثاء' },
  { key: 'wed', en: 'Wed', ar: 'أربعاء', enFull: 'Wednesday', arFull: 'الأربعاء' },
  { key: 'thu', en: 'Thu', ar: 'خميس', enFull: 'Thursday', arFull: 'الخميس' },
  { key: 'fri', en: 'Fri', ar: 'جمعة', enFull: 'Friday', arFull: 'الجمعة' },
  { key: 'sat', en: 'Sat', ar: 'سبت', enFull: 'Saturday', arFull: 'السبت' },
];

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6-23
const MINUTES = [0, 15, 30, 45];

export const formatTime12 = (t: string) => {
  if (!t) return '';
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
};

const formatHour12 = (h: number) => {
  const suffix = h >= 12 ? 'PM' : 'AM';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${display} ${suffix}`;
};

export const DAY_LABELS = DAYS;

interface SchedulePickerProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
  time: string;
  onTimeChange: (time: string) => void;
  maxDays?: number;
}

const SchedulePicker = ({ selectedDays, onDaysChange, time, onTimeChange, maxDays }: SchedulePickerProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [timeOpen, setTimeOpen] = useState(false);

  // Parse current time
  const currentHour = time ? parseInt(time.split(':')[0], 10) : null;
  const currentMinute = time ? parseInt(time.split(':')[1], 10) : null;

  const selectHour = (h: number) => {
    const m = currentMinute ?? 0;
    onTimeChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const selectMinute = (m: number) => {
    const h = currentHour ?? 6;
    onTimeChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  };

  const toggleDay = (key: string) => {
    if (selectedDays.includes(key)) {
      onDaysChange(selectedDays.filter(d => d !== key));
    } else {
      if (maxDays && selectedDays.length >= maxDays) {
        toast.error(
          isAr
            ? `الحد الأقصى ${maxDays} أيام في الأسبوع`
            : `Maximum ${maxDays} days per week`
        );
        return;
      }
      onDaysChange([...selectedDays, key]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Days Section */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <CalendarDays className="h-3.5 w-3.5 text-primary" />
            {isAr ? 'أيام الدروس' : 'Lesson Days'}
          </Label>
          {maxDays && (
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
              {selectedDays.length}/{maxDays}
            </span>
          )}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {DAYS.map(day => {
            const isSelected = selectedDays.includes(day.key);
            const isDisabled = !isSelected && !!maxDays && selectedDays.length >= maxDays;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => toggleDay(day.key)}
                disabled={isDisabled}
                className={`relative flex flex-col items-center py-2 rounded-lg text-[11px] font-medium border transition-all duration-200 ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                    : isDisabled
                      ? 'bg-muted/20 text-muted-foreground/30 border-transparent cursor-not-allowed'
                      : 'bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground hover:shadow-sm'
                }`}
              >
                <span className="leading-none">{isAr ? day.ar : day.en}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Time Section */}
      <div className="space-y-2">
        <Label className="text-xs font-medium flex items-center gap-1.5">
          <Clock className="h-3.5 w-3.5 text-primary" />
          {isAr ? 'وقت الدرس' : 'Lesson Time'}
        </Label>
        <Popover open={timeOpen} onOpenChange={setTimeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`w-full justify-between text-xs font-normal h-10 rounded-lg ${
                time ? 'text-foreground' : 'text-muted-foreground'
              }`}
            >
              <span className="flex items-center gap-2">
                <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                {time ? formatTime12(time) : (isAr ? 'اختر الوقت' : 'Select time')}
              </span>
              <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-0" align="start">
            <div className="flex divide-x divide-border rtl:divide-x-reverse">
              {/* Hour column */}
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground text-center py-2 border-b font-semibold uppercase tracking-wider">
                  {isAr ? 'الساعة' : 'Hour'}
                </p>
                <ScrollArea className="h-52">
                  <div className="p-1.5 space-y-0.5">
                    {HOURS.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => selectHour(h)}
                        className={`w-full px-2 py-2 rounded-md text-xs text-center transition-all duration-150 ${
                          currentHour === h
                            ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                            : 'hover:bg-accent text-foreground'
                        }`}
                      >
                        {formatHour12(h)}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
              </div>
              {/* Minute column */}
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground text-center py-2 border-b font-semibold uppercase tracking-wider">
                  {isAr ? 'الدقيقة' : 'Min'}
                </p>
                <div className="p-1.5 space-y-0.5">
                  {MINUTES.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectMinute(m)}
                      className={`w-full px-2 py-3 rounded-md text-xs text-center transition-all duration-150 ${
                        currentMinute === m
                          ? 'bg-primary text-primary-foreground font-semibold shadow-sm'
                          : 'hover:bg-accent text-foreground'
                      }`}
                    >
                      :{String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {time && (
              <div className="border-t px-3 py-2.5 flex items-center justify-between bg-muted/30">
                <span className="text-xs font-medium text-foreground">{formatTime12(time)}</span>
                <Button size="sm" className="h-7 text-xs px-3" onClick={() => setTimeOpen(false)}>
                  {isAr ? 'تم' : 'Done'}
                </Button>
              </div>
            )}
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default SchedulePicker;
