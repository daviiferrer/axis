import { Bell, User } from 'phosphor-react';
import styles from './Header.module.css';

export default function Header({ title }) {
    return (
        <header className={styles.header}>
            <div className={styles.title}>
                {title || 'Dashboard'}
            </div>

            <div className={styles.actions}>
                <button className={styles.iconButton}>
                    <Bell size={20} />
                </button>
                <button className={styles.iconButton}>
                    <User size={20} />
                </button>
            </div>
        </header>
    );
}
