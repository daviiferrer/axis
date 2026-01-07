import styles from './Button.module.css';

/**
 * Reusable Button Component
 * @param {string} variant - 'primary' | 'secondary' | 'ghost'
 * @param {string} className - Optional custom class
 * @param {boolean} fullWidth - If true, button takes 100% width
 * @param {React.ReactNode} children - Button content
 * @param {object} props - Other standard button attribute props
 */
export default function Button({
    variant = 'primary',
    className = '',
    children,
    fullWidth = false,
    ...props
}) {
    const variantClass = styles[variant] || styles.primary;

    return (
        <button
            className={`${styles.button} ${variantClass} ${className}`}
            style={{
                width: fullWidth ? '100%' : 'auto',
                ...props.style
            }}
            {...props}
        >
            {children}
        </button>
    );
}
