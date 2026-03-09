import { COPYRIGHT_TEXT, COPYRIGHT_LINK, COPYRIGHT_NAME, COPYRIGHT_SUFFIX } from '@/lib/version';

interface CopyrightTextProps {
  className?: string;
  linkClassName?: string;
}

const CopyrightText = ({
  className = 'text-[10px] text-muted-foreground/60',
  linkClassName = 'underline hover:text-foreground transition-colors',
}: CopyrightTextProps) => (
  <p className={className}>
    {COPYRIGHT_TEXT}{' '}
    <a
      href={COPYRIGHT_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className={linkClassName}
    >
      {COPYRIGHT_NAME}
    </a>{' '}
    {COPYRIGHT_SUFFIX}
  </p>
);

export default CopyrightText;
