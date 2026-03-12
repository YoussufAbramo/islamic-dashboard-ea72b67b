import { useNavigate } from 'react-router-dom';
import { COPYRIGHT_TEXT, COPYRIGHT_LINK, COPYRIGHT_NAME, COPYRIGHT_SUFFIX } from '@/lib/version';
export interface CopyrightSlotContent {
  type: 'image' | 'text' | 'links';
  text?: string;
  text_ar?: string;
  image_url?: string;
  links?: { type: 'policy' | 'page' | 'system'; slug: string; label: string; label_ar: string }[];
}

export interface CopyrightConfig {
  layout: 1 | 2 | 3 | 4 | 5 | 6;
  copyright_text?: string;
  copyright_text_ar?: string;
  other_content?: CopyrightSlotContent;
  secondary_content?: CopyrightSlotContent;
}

export const defaultCopyrightConfig: CopyrightConfig = {
  layout: 1,
  copyright_text: '© 2026 All rights reserved.',
  copyright_text_ar: '© 2026 جميع الحقوق محفوظة.',
};

interface CopyrightBarProps {
  config: CopyrightConfig;
  isAr: boolean;
}

const SlotRenderer = ({ slot, isAr }: { slot?: CopyrightSlotContent; isAr: boolean }) => {
  const navigate = useNavigate();
  if (!slot) return null;

  switch (slot.type) {
    case 'image':
      return slot.image_url ? (
        <img src={slot.image_url} alt="" className="h-6 max-w-[140px] object-contain" />
      ) : null;

    case 'text':
      return (
        <span className="text-xs text-muted-foreground">
          {isAr ? (slot.text_ar || slot.text || '') : (slot.text || '')}
        </span>
      );

    case 'links':
      return (
        <div className="flex items-center gap-3 flex-wrap">
          {(slot.links || []).map((link, i) => {
            const url = link.type === 'policy' ? `/policies/${link.slug}` : link.type === 'system' ? link.slug : `/pages/${link.slug}`;
            return (
              <a
                key={i}
                href={url}
                onClick={(e) => { e.preventDefault(); navigate(url); }}
                className="text-xs text-muted-foreground hover:text-foreground transition-colors underline-offset-2 hover:underline"
              >
                {isAr ? (link.label_ar || link.label) : link.label}
              </a>
            );
          })}
        </div>
      );

    default:
      return null;
  }
};

const CopyrightBar = ({ config, isAr }: CopyrightBarProps) => {
  const CopyrightSlot = () => (
    <span className="text-[11px] text-muted-foreground/70">
      {COPYRIGHT_TEXT}{' '}
      <a href={COPYRIGHT_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">
        {COPYRIGHT_NAME}
      </a>{' '}
      {COPYRIGHT_SUFFIX}
    </span>
  );

  const OtherSlot = () => <SlotRenderer slot={config.other_content} isAr={isAr} />;
  const SecondarySlot = () => <SlotRenderer slot={config.secondary_content} isAr={isAr} />;

  // Layout definitions:
  // 1: copyright center
  // 2: copyright left, other right
  // 3: copyright right, other left
  // 4: copyright left, secondary center, other right
  // 5: copyright right, other left, secondary center
  // 6: copyright center, other left, secondary right

  switch (config.layout) {
    case 1:
      return (
        <div className="flex justify-center items-center py-1">
          <CopyrightSlot />
        </div>
      );

    case 2:
      return (
        <div className="flex items-center justify-between py-1 gap-4">
          <CopyrightSlot />
          <OtherSlot />
        </div>
      );

    case 3:
      return (
        <div className="flex items-center justify-between py-1 gap-4">
          <OtherSlot />
          <CopyrightSlot />
        </div>
      );

    case 4:
      return (
        <div className="flex items-center justify-between py-1 gap-4">
          <CopyrightSlot />
          <SecondarySlot />
          <OtherSlot />
        </div>
      );

    case 5:
      return (
        <div className="flex items-center justify-between py-1 gap-4">
          <OtherSlot />
          <SecondarySlot />
          <CopyrightSlot />
        </div>
      );

    case 6:
      return (
        <div className="flex items-center justify-between py-1 gap-4">
          <OtherSlot />
          <CopyrightSlot />
          <SecondarySlot />
        </div>
      );

    default:
      return (
        <div className="flex justify-center items-center py-1">
          <CopyrightSlot />
        </div>
      );
  }
};

export default CopyrightBar;
