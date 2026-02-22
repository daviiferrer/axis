import { useRef, useEffect } from 'react';

export function useHorizontalScroll<T extends HTMLDivElement>() {
    const elRef = useRef<T>(null);

    useEffect(() => {
        const el = elRef.current;
        if (el) {
            const onWheel = (e: WheelEvent) => {
                // If scrolling vertically or horizontally, we stop React Flow from zooming/panning
                e.stopPropagation();

                if (e.deltaY !== 0 || e.deltaX !== 0) {
                    e.preventDefault();

                    const delta = e.deltaY !== 0 ? e.deltaY : e.deltaX;
                    el.scrollTo({
                        left: el.scrollLeft + delta * 2.0,
                        behavior: 'auto'
                    });
                }
            };

            el.addEventListener('wheel', onWheel, { passive: false });
            return () => el.removeEventListener('wheel', onWheel);
        }
    }, []);

    return elRef;
}
