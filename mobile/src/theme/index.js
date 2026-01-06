// Dark Theme Colors (matching web frontend)
export const colors = {
    // Backgrounds
    background: '#09090b', // Zinc-950/Pure black equivalent
    surface: '#09090b',
    surfaceLight: '#18181b', // Zinc-900

    // Borders
    border: '#27272a', // Zinc-800
    borderLight: '#3f3f46', // Zinc-700

    // Text
    textPrimary: '#e4e4e7',
    textSecondary: '#a1a1aa',
    textMuted: '#71717a',
    textDark: '#52525b',

    // Brand Colors
    primary: '#2563EB',
    primaryHover: '#1D4ED8',
    primaryLight: '#3B82F6',

    // Status Colors
    success: '#10B981',
    successLight: '#059669',
    warning: '#F59E0B',
    error: '#EF4444',
    errorLight: '#7f1d1d',

    // White
    white: '#FFFFFF',

    // Transparent
    transparent: 'transparent'
};

export const spacing = {
    xs: 4,
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    xxl: 32
};

export const borderRadius = {
    sm: 4,
    md: 8,
    lg: 12,
    xl: 16,
    full: 9999
};

export const typography = {
    // Size constants
    sizes: {
        xs: 10,
        sm: 12,
        md: 14,
        lg: 16,
        xl: 20,
        xxl: 24,
    },
    // Weight constants
    weights: {
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
    },
    // Preset styles
    h1: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.white
    },
    h2: {
        fontSize: 18,
        fontWeight: '600',
        color: colors.textPrimary
    },
    h3: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textPrimary
    },
    body: {
        fontSize: 14,
        fontWeight: '400',
        color: colors.textPrimary
    },
    bodySmall: {
        fontSize: 13,
        fontWeight: '400',
        color: colors.textSecondary
    },
    caption: {
        fontSize: 12,
        fontWeight: '400',
        color: colors.textMuted
    },
    label: {
        fontSize: 11,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 0.5,
        color: colors.textMuted
    }
};

export default { colors, spacing, borderRadius, typography };
