import { useNavigate } from 'react-router-dom';
import Header from '../../components/dashboard/Header';
import GlassCard from '../../components/ui/GlassCard';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../../components/ui/Tabs';
import { ChartLineUp, Cpu, CurrencyDollar, Users } from 'phosphor-react';
import styles from './Dashboard.module.css';

export default function DashboardPage() {
    // Auth check is now in DashboardLayout

    return (
        <>
            <Header title="Visão Geral" />
            <div className={styles.contentArea}>

                <Tabs defaultValue="executivo">
                    <TabsList>
                        <TabsTrigger value="executivo" icon={ChartLineUp}>Executivo</TabsTrigger>
                        <TabsTrigger value="ia" icon={Cpu}>Performance IA</TabsTrigger>
                        <TabsTrigger value="comercial" icon={Users}>Comercial</TabsTrigger>
                    </TabsList>

                    <TabsContent value="executivo">
                        <GlassCard className={styles.unifiedPanel}>
                            <div className={styles.metricRow}>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>Receita Gerada (IA)</span>
                                    <span className={styles.metricValue}>R$ 14.250,00</span>
                                    <span className={styles.metricTrend}>+12.5%</span>
                                </div>
                                <div className={styles.divider}></div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>Custo Operacional</span>
                                    <span className={styles.metricValue}>R$ 340,50</span>
                                    <span className={styles.metricTrendNegative}>+2.1%</span>
                                </div>
                                <div className={styles.divider}></div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>ROI Estimado</span>
                                    <span className={styles.metricValue}>41x</span>
                                </div>
                                <div className={styles.divider}></div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>Taxa de Conversão</span>
                                    <span className={styles.metricValue}>18.3%</span>
                                    <span className={styles.metricTrend}>+1.2%</span>
                                </div>
                            </div>

                            <div className={styles.graphPlaceholder}>
                                {/* Placeholder for future Chart interaction */}
                                <div className={styles.chartArea}>
                                    (Gráfico de Performance vai aqui)
                                </div>
                            </div>
                        </GlassCard>
                    </TabsContent>

                    <TabsContent value="ia">
                        <GlassCard className={styles.unifiedPanel}>
                            <h3 className={styles.panelTitle}>Saúde da IA</h3>
                            <div className={styles.metricRow}>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>Tokens Hoje</span>
                                    <span className={styles.metricValue}>124k</span>
                                </div>
                                <div className={styles.divider}></div>
                                <div className={styles.metricItem}>
                                    <span className={styles.metricLabel}>Latência Média</span>
                                    <span className={styles.metricValue}>1.2s</span>
                                </div>
                            </div>
                        </GlassCard>
                    </TabsContent>
                </Tabs>

            </div>
        </>
    );
}
