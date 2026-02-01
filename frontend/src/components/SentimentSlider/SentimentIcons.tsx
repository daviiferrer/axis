import React from 'react';

export const MoodAngry = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <defs>
            <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#DC2626' }} />
                <stop offset="100%" style={{ stopColor: '#9A3412' }} />
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#grad1)" />
        <path d="M 30 42 L 40 52 M 40 42 L 30 52" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
        <path d="M 60 42 L 70 52 M 70 42 L 60 52" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />

        <path d="M 30 72 Q 50 58 70 72" fill="none" stroke="#7C2D12" strokeWidth="3" strokeLinecap="round" />
    </svg>
);

export const MoodSkeptical = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <defs>
            <linearGradient id="grad2" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#F59E0B' }} />
                <stop offset="100%" style={{ stopColor: '#D97706' }} />
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#grad2)" />
        <circle cx="35" cy="48" r="5" fill="#92400E" />
        <circle cx="35" cy="48" r="2" fill="#FEF3C7" />
        <circle cx="65" cy="48" r="5" fill="#92400E" />
        <circle cx="65" cy="48" r="2" fill="#FEF3C7" />
        <path d="M 20 38 Q 15 48 20 53 Q 25 48 20 38" fill="#E0F2FE" opacity="0.9" />
        <path d="M 28 38 Q 35 30 42 38" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        <path d="M 58 38 Q 65 30 72 38" fill="none" stroke="#92400E" strokeWidth="2" strokeLinecap="round" />
        <path d="M 35 70 Q 50 65 65 70" fill="none" stroke="#92400E" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const MoodNeutral = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <defs>
            <linearGradient id="grad3" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#EAB308' }} />
                <stop offset="100%" style={{ stopColor: '#CA8A04' }} />
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#grad3)" />
        <line x1="28" y1="50" x2="42" y2="50" stroke="#A16207" strokeWidth="3" strokeLinecap="round" />
        <line x1="58" y1="50" x2="72" y2="50" stroke="#A16207" strokeWidth="3" strokeLinecap="round" />

        <line x1="35" y1="72" x2="65" y2="72" stroke="#A16207" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
);

export const MoodHappy = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <defs>
            <linearGradient id="grad4" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#84CC16' }} />
                <stop offset="100%" style={{ stopColor: '#10B981' }} />
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#grad4)" />
        <path d="M 28 48 Q 35 42 42 48" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
        <path d="M 58 48 Q 65 42 72 48" fill="none" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
        <path d="M 28 38 Q 35 32 42 38" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
        <path d="M 58 38 Q 65 32 72 38" fill="none" stroke="#047857" strokeWidth="2" strokeLinecap="round" />
        <path d="M 30 68 Q 50 78 70 68" fill="none" stroke="#047857" strokeWidth="2.5" strokeLinecap="round" />
        <circle cx="25" cy="58" r="3" fill="#FEF08A" opacity="0.6" />
        <circle cx="75" cy="58" r="3" fill="#FEF08A" opacity="0.6" />
    </svg>
);

export const MoodExcited = ({ className, ...props }: React.SVGProps<SVGSVGElement>) => (
    <svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg" className={className} {...props}>
        <defs>
            <linearGradient id="grad5" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#10B981' }} />
                <stop offset="100%" style={{ stopColor: '#3B82F6' }} />
            </linearGradient>
        </defs>
        <circle cx="50" cy="50" r="45" fill="url(#grad5)" />
        <path d="M 15 20 L 17 25 L 22 27 L 17 29 L 15 34 L 13 29 L 8 27 L 13 25 Z" fill="#FDE047" opacity="0.9" />
        <path d="M 85 15 L 87 20 L 92 22 L 87 24 L 85 29 L 83 24 L 78 22 L 83 20 Z" fill="#FDE047" opacity="0.9" />
        <path d="M 35 48 L 37 54 L 43 55 L 39 59 L 40 65 L 35 62 L 30 65 L 31 59 L 27 55 L 33 54 Z" fill="#1E3A8A" />
        <path d="M 65 48 L 67 54 L 73 55 L 69 59 L 70 65 L 65 62 L 60 65 L 61 59 L 57 55 L 63 54 Z" fill="#1E3A8A" />
        <ellipse cx="22" cy="62" rx="4" ry="2.5" fill="#FECACA" opacity="0.7" />
        <ellipse cx="78" cy="62" rx="4" ry="2.5" fill="#FECACA" opacity="0.7" />
        <path d="M 30 65 Q 50 85 70 65 Q 50 75 30 65 Z" fill="#1E3A8A" />
    </svg>
);
