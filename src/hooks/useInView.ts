import { useEffect, useRef, useState, type RefObject } from 'react';

export interface UseInViewOptions {
  threshold?: number;
  rootMargin?: string;
  triggerOnce?: boolean;
  rootRef?: RefObject<Element | null>;
}

export function useInView(options: UseInViewOptions = {}) {
  const { threshold = 0.15, rootMargin = '0px 0px -60px 0px', triggerOnce = true, rootRef } = options;
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const root = rootRef?.current ?? null;
    const margin = root ? '0px' : rootMargin;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          if (triggerOnce) setHasTriggered(true);
        } else if (!triggerOnce) {
          setInView(false);
        }
      },
      { threshold, rootMargin: margin, root },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold, rootMargin, triggerOnce, rootRef]);

  return { ref, inView: hasTriggered || inView };
}
