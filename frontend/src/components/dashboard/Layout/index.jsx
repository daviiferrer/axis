import { useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { supabase } from '../../../lib/supabase';
import Sidebar from '../Sidebar';
import styles from './Layout.module.css';

export default function DashboardLayout() {
    const navigate = useNavigate();

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                navigate('/login');
            }
        };
        checkUser();
    }, [navigate]);

    return (
        <div className={styles.dashboardContainer}>
            <Sidebar />
            <main className={styles.mainContent}>
                <Outlet />
            </main>
        </div>
    );
}
