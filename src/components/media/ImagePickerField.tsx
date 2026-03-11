import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Label } from '@/components/ui/label';
import { Image, X } from 'lucide-react';
import MediaPickerDialog from './MediaPickerDialog';

interface ImagePickerFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  bucket?: string;
  className?: string;
}

const ImagePickerField = ({ label, value, onChange, bucket = 'course-images', className = '' }: ImagePickerFieldProps) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';
  const [pickerOpen, setPickerOpen] = useState(false);

  return (
    <div className={className}>
      {label && <Label className="mb-1.5 block">{label}</Label>}

      {/* Clickable image area */}
      <button
        type="button"
        onClick={() => setPickerOpen(true)}
        className="relative inline-flex rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden group bg-muted/30"
      >
        {value ? (
          <div className="relative">
            <img
              src={value}
              alt="Selected"
              className="max-h-20 w-auto object-contain rounded-md"
            />
            <div className="absolute inset-0 bg-background/0 group-hover:bg-background/60 transition-colors flex items-center justify-center">
              <span className="text-xs font-medium text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                {isAr ? 'تغيير الصورة' : 'Change Image'}
              </span>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-4 px-6 text-muted-foreground">
            <Image className="h-6 w-6 mb-1.5 opacity-40" />
            <span className="text-xs">{isAr ? 'اضغط لاختيار صورة' : 'Click to select image'}</span>
          </div>
        )}
      </button>

      {/* Remove button */}
      {value && (
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onChange(''); }}
          className="mt-1.5 flex items-center gap-1 text-xs text-destructive hover:text-destructive/80 transition-colors"
        >
          <X className="h-3 w-3" />
          {isAr ? 'إزالة الصورة' : 'Remove image'}
        </button>
      )}

      <MediaPickerDialog
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        onSelect={onChange}
        bucket={bucket}
      />
    </div>
  );
};

export default ImagePickerField;
