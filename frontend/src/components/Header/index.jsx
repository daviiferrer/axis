import { Link } from 'react-router-dom';
import styles from './Header.module.css';
import logo from '../../assets/logo.png';
import Button from '../ui/Button';

export default function Header() {
    return (
        <header className={styles.header}>
            <div className={styles.logoContainer}>
                <Link to="/">
                    <img src={logo} alt="ÁXIS Logo" className={styles.logo} />
                </Link>
            </div>

            <div className={styles.authNav}>
                <Link to="/login" style={{ textDecoration: 'none' }}>
                    <Button variant="ghost">Entrar</Button>
                </Link>
                <Link to="/register" style={{ textDecoration: 'none' }}>
                    <Button variant="primary">Criar Conta</Button>
                </Link>
            </div>
        </header>
    );
}
