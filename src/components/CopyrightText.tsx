import { COPYRIGHT_TEXT, COPYRIGHT_LINK, COPYRIGHT_NAME, COPYRIGHT_SUFFIX } from '@/lib/version';

interface CopyrightTextProps {
  className?: string;
}

const CopyrightText = ({ className = 'text-[10px] text-muted-foreground/60' }: CopyrightTextProps) => (
  <p className={className}>
    {COPYRIGHT_TEXT}{' '}
    <a
      href={COPYRIGHT_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="underline hover:text-foreground transition-colors"
    >
      {COPYRIGHT_NAME}
    </a>{' '}
    {COPYRIGHT_SUFFIX}
  </p>
);

export default CopyrightText;