import { motion } from 'framer-motion';
import styles from './GlassCard.module.css';

export default function GlassCard({ children, className = '', style = {} }) {
    return (
        <motion.div
            className={`${styles.glassCard} ${className}`}
            style={style}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
        >
            {children}
        </motion.div>
    );
}
