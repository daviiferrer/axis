import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { EnvelopeSimpleOpen, CheckCircle } from 'phosphor-react';
import Button from '../../../components/ui/Button';
import styles from './VerifyEmail.module.css';
import { supabase } from '../../../lib/supabase';

export default function VerifyEmailPage() {
    const [otp, setOtp] = useState(['', '', '', '', '', '', '', '']);
    const [loading, setLoading] = useState(false);
    const [resendTimer, setResendTimer] = useState(0);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email || 'seu email';

    const handleChange = (element, index) => {
        if (isNaN(element.value)) return;

        const newOtp = [...otp];
        newOtp[index] = element.value;
        setOtp(newOtp);

        // Move to next input
        if (element.value && element.nextSibling) {
            element.nextSibling.focus();
        }
    };

    const handleKeyDown = (e, index) => {
        if (e.key === 'Backspace') {
            if (!otp[index] && e.target.previousSibling) {
                e.target.previousSibling.focus();
            }
        }
    };

    const handlePaste = (e) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData('text');
        // Filter non-numeric
        const cleanData = pastedData.replace(/[^0-9]/g, '').slice(0, 8);

        if (cleanData) {
            const newOtp = [...otp];
            cleanData.split('').forEach((char, i) => {
                newOtp[i] = char;
            });
            setOtp(newOtp);

            // Focus appropriate input
            const focusIndex = Math.min(cleanData.length, 7);
            const inputs = document.querySelectorAll(`.${styles.otpInput}`);
            if (inputs[focusIndex]) {
                inputs[focusIndex].focus();
            } else if (inputs[7]) {
                inputs[7].focus();
            }
        }
    };

    const handleVerify = async (e) => {
        e.preventDefault();
        const token = otp.join('');
        if (token.length !== 8) {
            alert("Por favor, preencha o código de 8 dígitos.");
            return;
        }

        setLoading(true);

        const { error } = await supabase.auth.verifyOtp({
            email,
            token,
            type: 'signup'
        });

        if (error) {
            alert(error.message);
            setLoading(false);
        } else {
            alert("Email verificado com sucesso!");
            navigate('/dashboard');
        }
    };

    const handleResend = async () => {
        setResendTimer(60); // 60s cooldown
        // Implement resend logic here
        await supabase.auth.resend({
            type: 'signup',
            email: email,
        });
    };

    useEffect(() => {
        if (resendTimer > 0) {
            const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [resendTimer]);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.centerContainer}>
                <motion.div
                    className={styles.verificationCard}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className={styles.iconContainer}>
                        <EnvelopeSimpleOpen size={32} weight="duotone" />
                    </div>

                    <h1 className={styles.title}>Verifique seu email</h1>
                    <p className={styles.subtitle}>
                        Enviamos um código de verificação para<br />
                        <span className={styles.emailHighlight}>{email}</span>
                    </p>

                    <form onSubmit={handleVerify}>
                        <div className={styles.otpContainer}>
                            {otp.map((data, index) => (
                                <input
                                    key={index}
                                    type="text"
                                    maxLength="1"
                                    className={styles.otpInput}
                                    value={data}
                                    onChange={e => handleChange(e.target, index)}
                                    onKeyDown={e => handleKeyDown(e, index)}
                                    onPaste={handlePaste}
                                    onFocus={e => e.target.select()}
                                />
                            ))}
                        </div>

                        <Button
                            variant="primary"
                            fullWidth
                            type="submit"
                            disabled={loading}
                        >
                            {loading ? 'Verificando...' : 'Verificar Email'}
                        </Button>
                    </form>

                    <div className={styles.resendLink}>
                        Não recebeu o código?{' '}
                        <button
                            className={styles.resendButton}
                            onClick={handleResend}
                            disabled={resendTimer > 0}
                        >
                            {resendTimer > 0 ? `Reenviar em ${resendTimer}s` : 'Reenviar código'}
                        </button>
                    </div>
                </motion.div>
            </div>
        </div>
    );
}
