import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/contexts/LanguageContext';
import { Clock } from 'lucide-react';
import { toast } from 'sonner';

const DAYS = [
  { key: 'sun', en: 'Sun', ar: 'أحد' },
  { key: 'mon', en: 'Mon', ar: 'إثنين' },
  { key: 'tue', en: 'Tue', ar: 'ثلاثاء' },
  { key: 'wed', en: 'Wed', ar: 'أربعاء' },
  { key: 'thu', en: 'Thu', ar: 'خميس' },
  { key: 'fri', en: 'Fri', ar: 'جمعة' },
  { key: 'sat', en: 'Sat', ar: 'سبت' },
];

const HOURS = Array.from({ length: 18 }, (_, i) => i + 6); // 6-23
const MINUTES = [0, 15, 30, 45];

const formatTime12 = (t: string) => {
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
    <div className="space-y-3">
      <div>
        <Label className="text-xs flex items-center gap-1.5">
          {isAr ? 'أيام الدروس' : 'Lesson Days'}
          {maxDays && (
            <span className="text-[10px] text-muted-foreground font-normal">
              ({selectedDays.length}/{maxDays})
            </span>
          )}
        </Label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {DAYS.map(day => {
            const isSelected = selectedDays.includes(day.key);
            const isDisabled = !isSelected && !!maxDays && selectedDays.length >= maxDays;
            return (
              <button
                key={day.key}
                type="button"
                onClick={() => toggleDay(day.key)}
                disabled={isDisabled}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground border-primary'
                    : isDisabled
                      ? 'bg-muted/30 text-muted-foreground/40 border-border/50 cursor-not-allowed'
                      : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40'
                }`}
              >
                {isAr ? day.ar : day.en}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <Label className="text-xs">{isAr ? 'وقت الدرس' : 'Lesson Time'}</Label>
        <Popover open={timeOpen} onOpenChange={setTimeOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="w-44 mt-1 justify-start gap-2 text-xs font-normal h-9"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {time ? formatTime12(time) : (isAr ? 'اختر الوقت' : 'Select time')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-0" align="start">
            <div className="flex divide-x divide-border">
              {/* Hour column */}
              <div className="flex-1">
                <p className="text-[10px] text-muted-foreground text-center py-1.5 border-b font-medium">
                  {isAr ? 'الساعة' : 'Hour'}
                </p>
                <ScrollArea className="h-48">
                  <div className="p-1 space-y-0.5">
                    {HOURS.map(h => (
                      <button
                        key={h}
                        type="button"
                        onClick={() => selectHour(h)}
                        className={`w-full px-2 py-1.5 rounded text-xs text-center transition-colors ${
                          currentHour === h
                            ? 'bg-primary text-primary-foreground font-medium'
                            : 'hover:bg-muted text-foreground'
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
                <p className="text-[10px] text-muted-foreground text-center py-1.5 border-b font-medium">
                  {isAr ? 'الدقيقة' : 'Min'}
                </p>
                <div className="p-1 space-y-0.5">
                  {MINUTES.map(m => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => selectMinute(m)}
                      className={`w-full px-2 py-2.5 rounded text-xs text-center transition-colors ${
                        currentMinute === m
                          ? 'bg-primary text-primary-foreground font-medium'
                          : 'hover:bg-muted text-foreground'
                      }`}
                    >
                      :{String(m).padStart(2, '0')}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            {time && (
              <div className="border-t px-3 py-2 flex items-center justify-between">
                <span className="text-xs text-muted-foreground">{formatTime12(time)}</span>
                <Button size="sm" className="h-6 text-[10px] px-2" onClick={() => setTimeOpen(false)}>
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
