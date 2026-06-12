import { useOverviewScrollRoot } from '../contexts/OverviewScrollContext';
import { useInView, type UseInViewOptions } from './useInView';

/** 总体概览分页容器内的可见性检测（root 指向 overview-pager） */
export function useOverviewInView(options: Omit<UseInViewOptions, 'rootRef'> = {}) {
  const scrollRoot = useOverviewScrollRoot();
  return useInView({
    threshold: 0.05,
    rootMargin: '0px',
    ...options,
    rootRef: scrollRoot ?? undefined,
  });
}
