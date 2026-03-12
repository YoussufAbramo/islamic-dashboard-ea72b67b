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

// Generate time slots from 06:00 to 23:30 in 30-min increments
const TIME_SLOTS: string[] = [];
for (let h = 6; h <= 23; h++) {
  for (const m of [0, 30]) {
    if (h === 23 && m === 30) continue;
    TIME_SLOTS.push(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  }
}

const formatTime12 = (t: string) => {
  const [hStr, mStr] = t.split(':');
  let h = parseInt(hStr, 10);
  const suffix = h >= 12 ? 'PM' : 'AM';
  if (h === 0) h = 12;
  else if (h > 12) h -= 12;
  return `${h}:${mStr} ${suffix}`;
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
              className="w-40 mt-1 justify-start gap-2 text-xs font-normal h-9"
            >
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
              {time ? formatTime12(time) : (isAr ? 'اختر الوقت' : 'Select time')}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-44 p-0" align="start">
            <ScrollArea className="h-56">
              <div className="grid grid-cols-2 gap-0.5 p-1.5">
                {TIME_SLOTS.map(slot => (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => { onTimeChange(slot); setTimeOpen(false); }}
                    className={`px-2 py-1.5 rounded text-xs transition-colors ${
                      time === slot
                        ? 'bg-primary text-primary-foreground font-medium'
                        : 'hover:bg-muted text-foreground'
                    }`}
                  >
                    {formatTime12(slot)}
                  </button>
                ))}
              </div>
            </ScrollArea>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
};

export default SchedulePicker;
