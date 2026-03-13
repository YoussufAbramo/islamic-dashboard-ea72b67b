import { useState, useEffect, useRef } from 'react';

/**
 * Hook to animate a number counting up when element becomes visible.
 * Supports numeric values like "500+", "10k+", "99.9%", "1,200" etc.
 */
export function useCountUp(targetValue: string, duration = 2000) {
  const [display, setDisplay] = useState('0');
  const ref = useRef<HTMLDivElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !hasAnimated.current) {
          hasAnimated.current = true;
          animate();
        }
      },
      { threshold: 0.3 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [targetValue]);

  const animate = () => {
    // Extract numeric part, prefix, suffix
    const match = targetValue.match(/^([^\d]*)([\d,.]+)(.*)$/);
    if (!match) {
      setDisplay(targetValue);
      return;
    }

    const prefix = match[1];
    const numStr = match[2];
    const suffix = match[3];
    const hasDecimal = numStr.includes('.');
    const hasComma = numStr.includes(',');
    const cleanNum = parseFloat(numStr.replace(/,/g, ''));

    if (isNaN(cleanNum)) {
      setDisplay(targetValue);
      return;
    }

    const decimals = hasDecimal ? (numStr.split('.')[1]?.length || 0) : 0;
    const startTime = performance.now();

    const step = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = eased * cleanNum;

      let formatted = decimals > 0 ? current.toFixed(decimals) : Math.floor(current).toString();
      if (hasComma) {
        const parts = formatted.split('.');
        parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        formatted = parts.join('.');
      }

      setDisplay(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        requestAnimationFrame(step);
      } else {
        setDisplay(targetValue);
      }
    };

    requestAnimationFrame(step);
  };

  return { display, ref };
}

/**
 * Hook to trigger animation when element enters viewport
 */
export function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}
