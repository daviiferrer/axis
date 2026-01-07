import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogo } from 'phosphor-react';
import logo from '../../../assets/logo.png';
import Button from '../../../components/ui/Button';
import styles from './Login.module.css';
import { supabase } from '../../../lib/supabase';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoading(true);

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            navigate('/dashboard');
        }
    };

    const handleGoogleLogin = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: {
                redirectTo: `${window.location.origin}/dashboard`
            }
        });

        if (error) {
            alert(error.message);
        }
    };

    return (
        <div className={styles.pageContainer}>
            {/* Left Panel - 40% */}
            <motion.div
                className={styles.leftPanel}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
            >
                <div className={styles.loginFormContainer}>
                    <div className={styles.logoContainer}>
                        <Link to="/">
                            <img src={logo} alt="ÁXIS Logo" className={styles.logo} />
                        </Link>
                    </div>
                    <p className={styles.subtitle}>Entre na sua conta para acessar o ÁXIS.</p>

                    {/* Google Login */}
                    <Button
                        variant="secondary"
                        fullWidth
                        className={styles.googleButton}
                        style={{ marginBottom: '0' }}
                        onClick={handleGoogleLogin}
                        type="button"
                    >
                        <GoogleLogo size={20} weight="bold" />
                        Entrar com Google
                    </Button>

                    <div className={styles.divider}>ou entrar com email</div>

                    {/* Email/Password Form */}
                    <form onSubmit={handleLogin}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="email">Email</label>
                            <input
                                type="email"
                                id="email"
                                className={styles.input}
                                placeholder="seu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="password">Senha</label>
                            <input
                                type="password"
                                id="password"
                                className={styles.input}
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Link to="#" className={styles.forgotPassword}>
                            Esqueceu a senha?
                        </Link>

                        <Button
                            variant="primary"
                            fullWidth
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Entrando...' : 'Entrar'}
                        </Button>

                        <div className={styles.registerLink} style={{ textAlign: 'center', marginTop: '1.5rem', fontSize: '0.9rem', color: '#64748b' }}>
                            Não tem uma conta? <Link to="/register" style={{ color: '#006ae1', textDecoration: 'none', fontWeight: 600 }}>Criar conta</Link>
                        </div>
                    </form>
                </div>
            </motion.div>

            {/* Right Panel - 60% */}
            <div className={styles.rightPanel}>
                {/* Placeholder for now */}
            </div>
        </div>
    );
}
