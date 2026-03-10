import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/contexts/LanguageContext';

const DAYS = [
  { key: 'sun', en: 'Sun', ar: 'أحد' },
  { key: 'mon', en: 'Mon', ar: 'إثنين' },
  { key: 'tue', en: 'Tue', ar: 'ثلاثاء' },
  { key: 'wed', en: 'Wed', ar: 'أربعاء' },
  { key: 'thu', en: 'Thu', ar: 'خميس' },
  { key: 'fri', en: 'Fri', ar: 'جمعة' },
  { key: 'sat', en: 'Sat', ar: 'سبت' },
];

interface SchedulePickerProps {
  selectedDays: string[];
  onDaysChange: (days: string[]) => void;
  time: string;
  onTimeChange: (time: string) => void;
}

const SchedulePicker = ({ selectedDays, onDaysChange, time, onTimeChange }: SchedulePickerProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const toggleDay = (key: string) => {
    onDaysChange(
      selectedDays.includes(key)
        ? selectedDays.filter(d => d !== key)
        : [...selectedDays, key]
    );
  };

  return (
    <div className="space-y-3">
      <div>
        <Label className="text-xs">{isAr ? 'أيام الدروس' : 'Lesson Days'}</Label>
        <div className="flex flex-wrap gap-1.5 mt-1.5">
          {DAYS.map(day => (
            <button
              key={day.key}
              type="button"
              onClick={() => toggleDay(day.key)}
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${
                selectedDays.includes(day.key)
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-muted/50 text-muted-foreground border-border hover:border-primary/40'
              }`}
            >
              {isAr ? day.ar : day.en}
            </button>
          ))}
        </div>
      </div>
      <div>
        <Label className="text-xs">{isAr ? 'وقت الدرس' : 'Lesson Time'}</Label>
        <Input
          type="time"
          value={time}
          onChange={(e) => onTimeChange(e.target.value)}
          className="w-32 mt-1"
        />
      </div>
    </div>
  );
};

export default SchedulePicker;
