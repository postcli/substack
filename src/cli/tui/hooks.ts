import { useState, useEffect, useCallback, useRef } from 'react';
import { useInput, useStdout, useStdin } from 'ink';

/** Hook for async data loading with dep-keyed caching */
export function useAsync<T>(fn: () => Promise<T>, deps: unknown[] = []) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const cacheRef = useRef<Map<string, T>>(new Map());
  const depsKey = JSON.stringify(deps);

  const reload = useCallback(() => {
    setLoading(true);
    setError(null);
    fn()
      .then((result) => {
        cacheRef.current.set(depsKey, result);
        setData(result);
        setLoading(false);
      })
      .catch((err) => {
        setError(err.message);
        setLoading(false);
      });
  }, [depsKey]);

  useEffect(() => {
    const cached = cacheRef.current.get(depsKey);
    if (cached) {
      setData(cached);
      setLoading(false);
      return;
    }
    reload();
  }, [depsKey]);

  return { data, loading, error, reload };
}

/** Hook for navigating a list with j/k, arrows, and mouse wheel */
export function useListNav(length: number, opts?: { active?: boolean }) {
  const [cursor, setCursor] = useState(0);
  const active = opts?.active ?? true;

  useInput((input, key) => {
    if (!active || length === 0) return;
    if (input === 'j' || key.downArrow) {
      setCursor((c) => Math.min(c + 1, length - 1));
    }
    if (input === 'k' || key.upArrow) {
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (input === 'g') setCursor(0);
    if (input === 'G') setCursor(length - 1);
  });

  // Mouse wheel
  useMouse((event) => {
    if (!active || length === 0) return;
    if (event === 'scrollUp') {
      setCursor((c) => Math.max(c - 1, 0));
    }
    if (event === 'scrollDown') {
      setCursor((c) => Math.min(c + 1, length - 1));
    }
  });

  useEffect(() => {
    setCursor((c) => Math.min(c, Math.max(0, length - 1)));
  }, [length]);

  return { cursor, setCursor };
}

/** Hook for scrolling long content with keyboard and mouse wheel */
export function useScroll(totalLines: number, opts?: { active?: boolean }) {
  const { rows } = useTerminalSize();
  const viewportHeight = rows - 8;
  const [scrollOffset, setScrollOffset] = useState(0);
  const maxScroll = Math.max(0, totalLines - viewportHeight);
  const active = opts?.active ?? true;

  useInput((input, key) => {
    if (!active) return;
    if (input === 'j' || key.downArrow) {
      setScrollOffset((s) => Math.min(s + 1, maxScroll));
    }
    if (input === 'k' || key.upArrow) {
      setScrollOffset((s) => Math.max(s - 1, 0));
    }
    if (input === 'd' || key.pageDown) {
      setScrollOffset((s) => Math.min(s + Math.floor(viewportHeight / 2), maxScroll));
    }
    if (input === 'u' || key.pageUp) {
      setScrollOffset((s) => Math.max(s - Math.floor(viewportHeight / 2), 0));
    }
    if (input === 'g') setScrollOffset(0);
    if (input === 'G') setScrollOffset(maxScroll);
  });

  useMouse((event) => {
    if (!active) return;
    if (event === 'scrollUp') {
      setScrollOffset((s) => Math.max(s - 3, 0));
    }
    if (event === 'scrollDown') {
      setScrollOffset((s) => Math.min(s + 3, maxScroll));
    }
  });

  useEffect(() => {
    setScrollOffset(0);
  }, [totalLines]);

  return { scrollOffset, viewportHeight, maxScroll };
}

/** Get terminal dimensions */
export function useTerminalSize() {
  const { stdout } = useStdout();
  return {
    columns: stdout?.columns ?? 80,
    rows: stdout?.rows ?? 24,
  };
}

/** Build a visual scrollbar */
export function renderScrollbar(
  viewportHeight: number,
  totalLines: number,
  scrollOffset: number
): string[] {
  if (totalLines <= viewportHeight) return new Array(viewportHeight).fill(' ');

  const thumbSize = Math.max(1, Math.round((viewportHeight / totalLines) * viewportHeight));
  const maxScroll = totalLines - viewportHeight;
  const thumbPos = Math.round((scrollOffset / maxScroll) * (viewportHeight - thumbSize));

  return Array.from({ length: viewportHeight }, (_, i) => {
    if (i >= thumbPos && i < thumbPos + thumbSize) return '█';
    return '░';
  });
}

/** Toast notification state */
export function useToast() {
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  const show = useCallback((text: string, type: 'success' | 'error' = 'success') => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setMessage({ text, type });
    timerRef.current = setTimeout(() => setMessage(null), 2500);
  }, []);

  return { toast: message, showToast: show };
}

/**
 * Mouse wheel support via SGR extended mouse mode.
 * Enables mouse reporting on mount, disables on unmount.
 */
type MouseEvent = 'scrollUp' | 'scrollDown';

export function useMouse(handler: (event: MouseEvent) => void) {
  const { stdin } = useStdin();
  const handlerRef = useRef(handler);
  handlerRef.current = handler;

  useEffect(() => {
    if (!stdin || !process.stdout.isTTY) return;

    process.stdout.write('\x1b[?1000h');
    process.stdout.write('\x1b[?1006h');

    const onData = (data: Buffer) => {
      const str = data.toString();
      const match = str.match(/\x1b\[<(\d+);\d+;\d+[mM]/);
      if (match) {
        const button = parseInt(match[1], 10);
        if (button === 64) handlerRef.current('scrollUp');
        if (button === 65) handlerRef.current('scrollDown');
      }
    };

    stdin.on('data', onData);

    return () => {
      stdin.off('data', onData);
      process.stdout.write('\x1b[?1006l');
      process.stdout.write('\x1b[?1000l');
    };
  }, [stdin]);
}
