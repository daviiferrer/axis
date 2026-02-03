import { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform } from 'framer-motion';

/**
 * Hook to generate the background colors based on the Sentiment Slider value.
 * Used to sync the Header and Body background with the current mood.
 */
export function useSentimentColors(value: number) {
    const motionValue = useMotionValue(value);

    // Sync motion value with prop
    useEffect(() => {
        motionValue.set(value);
    }, [value, motionValue]);

    // Spring physics for smooth color transitions
    const smoothValue = useSpring(motionValue, {
        stiffness: 300,
        damping: 30,
        mass: 0.8
    });

    // 1. Header Background (Subtle Pastels)
    // 0=Red, 1=Orange, 2=Yellow/Neutral, 3=Green, 4=Emerald
    const headerBgColor = useTransform(
        smoothValue,
        [0, 1, 2, 3, 4],
        ['#FEF2F2', '#FFFBEB', '#ffffff', '#F0FDF4', '#ECFDF5'] // Neutral (2) is white
    );

    // 2. Body Gradient Bleed (Matched with Header)
    // Used for the linear-gradient fade effect below the header
    const bodyGradientStart = useTransform(
        smoothValue,
        [0, 1, 2, 3, 4],
        [
            'rgba(254, 242, 242, 1)',
            'rgba(255, 251, 235, 1)',
            'rgba(255, 255, 255, 0)',
            'rgba(240, 253, 244, 1)',
            'rgba(236, 253, 245, 1)'
        ]
    );

    return { headerBgColor, bodyGradientStart };
}
