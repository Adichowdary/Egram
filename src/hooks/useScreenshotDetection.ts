import { useEffect, useRef } from 'react';

export const useScreenshotDetection = (enabled: boolean, onDetect: () => void) => {
    const onDetectRef = useRef(onDetect);

    useEffect(() => {
        onDetectRef.current = onDetect;
    }, [onDetect]);

    useEffect(() => {
        if (!enabled) return;

        const handleKeyUp = (e: KeyboardEvent) => {
            // Detect PrintScreen
            if (e.key === 'PrintScreen') {
                onDetectRef.current();
            }
        };

        const handleKeyDown = (e: KeyboardEvent) => {
            // Detect Cmd+Shift+3 or Cmd+Shift+4 (Mac), Windows+Shift+S (Windows)
            // 's' + meta + shift
            // '3' or '4' + meta + shift
            if ((e.metaKey || e.ctrlKey) && e.shiftKey) {
                if (e.key === 's' || e.key === 'S' || e.key === '3' || e.key === '4') {
                    onDetectRef.current();
                }
            }
        };

        window.addEventListener('keyup', handleKeyUp);
        window.addEventListener('keydown', handleKeyDown);

        return () => {
            window.removeEventListener('keyup', handleKeyUp);
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [enabled]);
};
