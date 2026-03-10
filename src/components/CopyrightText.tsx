import { COPYRIGHT_TEXT, COPYRIGHT_LINK, COPYRIGHT_NAME, COPYRIGHT_SUFFIX, APP_VERSION } from '@/lib/version';

interface CopyrightTextProps {
  className?: string;
  linkClassName?: string;
  showVersion?: boolean;
}

const CopyrightText = ({
  className = 'text-[10px] text-muted-foreground/60',
  linkClassName = 'hover:text-foreground transition-colors',
  showVersion = true,
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
    {showVersion && <span className="ms-1 opacity-60">v{APP_VERSION}</span>}
  </p>
);

export default CopyrightText;
