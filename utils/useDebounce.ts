import { useCallback, useRef } from "react";

/**
 * Returns a debounced version of `fn` that only fires after
 * `delay` ms of inactivity.
 *
 * Usage:
 *   const debouncedFn = useDebounce(myFn, 300);
 */
export function useDebounce<Args extends unknown[]>(
  fn: (...args: Args) => void,
  delay: number
) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  return useCallback(
    (...args: Args) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        fn(...args);
      }, delay);
    },
    [fn, delay]
  );
}