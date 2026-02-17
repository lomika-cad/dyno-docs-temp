import { useEffect, useRef } from 'react';

interface UseIdleTimerOptions {
  timeout: number;
  onIdle: () => void;
}

const useIdleTimer = ({ timeout, onIdle }: UseIdleTimerOptions) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const handleUserActivity = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(() => {
      onIdle();
    }, timeout);
  };

  useEffect(() => {
    const handleIdleTimeout = () => {
      handleUserActivity();
    };

    handleUserActivity();

    window.addEventListener('mousemove', handleIdleTimeout);
    window.addEventListener('keydown', handleIdleTimeout);
    window.addEventListener('mousedown', handleIdleTimeout);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      window.removeEventListener('mousemove', handleIdleTimeout);
      window.removeEventListener('keydown', handleIdleTimeout);
      window.removeEventListener('mousedown', handleIdleTimeout);
    };
  }, [timeout, onIdle]);

};

export default useIdleTimer;
