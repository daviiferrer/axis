import { useState } from 'react';
import { motion } from 'framer-motion';
import { Link, useNavigate } from 'react-router-dom';
import { GoogleLogo } from 'phosphor-react';
import logo from '../../../assets/logo.png';
import Button from '../../../components/ui/Button';
import styles from './Register.module.css';
import { supabase } from '../../../lib/supabase';

export default function RegisterPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);

    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();

        if (password !== confirmPassword) {
            alert("As senhas não coincidem.");
            return;
        }

        setLoading(true);

        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: {
                    full_name: name,
                },
            },
        });

        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            // alert("Cadastro realizado! Verifique seu email para confirmar.");
            navigate('/verify-email', { state: { email } });
        }
    };

    const handleGoogleRegister = async () => {
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
                <div className={styles.registerFormContainer}>
                    <div className={styles.logoContainer}>
                        <Link to="/">
                            <img src={logo} alt="ÁXIS Logo" className={styles.logo} />
                        </Link>
                    </div>
                    <p className={styles.subtitle}>Crie sua conta para começar.</p>

                    {/* Google Register */}
                    <Button
                        variant="secondary"
                        fullWidth
                        className={styles.googleButton}
                        style={{ marginBottom: '0' }}
                        onClick={handleGoogleRegister}
                        type="button"
                    >
                        <GoogleLogo size={20} weight="bold" />
                        Criar conta com Google
                    </Button>

                    <div className={styles.divider}>ou cadastre com email</div>

                    {/* Registration Form */}
                    <form onSubmit={handleRegister}>
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="name">Nome Completo</label>
                            <input
                                type="text"
                                id="name"
                                className={styles.input}
                                placeholder="Seu nome"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                required
                            />
                        </div>
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
                        <div className={styles.formGroup}>
                            <label className={styles.label} htmlFor="confirmPassword">Confirmar Senha</label>
                            <input
                                type="password"
                                id="confirmPassword"
                                className={styles.input}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                            />
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Criando conta...' : 'Criar Conta'}
                        </Button>

                        <div className={styles.loginLink}>
                            Já tem uma conta? <Link to="/login">Entrar</Link>
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
