import { Link, useLocation, useNavigate } from 'react-router-dom';
import { House, Users, Gear, SignOut, ChatCircle } from 'phosphor-react';
import logo from '../../../assets/logo.png';
import { supabase } from '../../../lib/supabase';
import styles from './Sidebar.module.css';

export default function Sidebar() {
    const location = useLocation();
    const navigate = useNavigate();

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate('/login');
    };

    const navItems = [
        { icon: House, label: 'Início', path: '/dashboard' },
        { icon: ChatCircle, label: 'Chat', path: '/dashboard/chat' },
        { icon: Users, label: 'Equipe', path: '/dashboard/team' },
        { icon: Gear, label: 'Configurações', path: '/dashboard/settings' },
    ];

    return (
        <aside className={styles.sidebar}>
            {/* Logo */}
            <div className={styles.logoContainer}>
                <img src={logo} alt="ÁXIS" className={styles.logo} />
            </div>

            {/* Navigation */}
            <nav className={styles.nav}>
                {navItems.map((item) => {
                    const active = isActive(item.path);
                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className={`${styles.navItem} ${active ? styles.navItemActive : ''}`}
                            title={item.label}
                        >
                            <item.icon size={24} weight={active ? 'fill' : 'light'} />
                            <span>{item.label}</span>
                        </Link>
                    );
                })}
            </nav>

            {/* Footer / Logout */}
            <div className={styles.footer}>
                <button onClick={handleLogout} className={styles.sidebarButton} title="Sair da conta">
                    <SignOut size={20} weight="light" />
                    <span>Sair da conta</span>
                </button>
            </div>
        </aside>
    );
}
