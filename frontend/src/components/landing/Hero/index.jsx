import { motion } from 'framer-motion';
import { House, Lightning, Question, ChartLine, ArrowsClockwise, HardDrives } from 'phosphor-react';
import styles from './Hero.module.css';

// Campaign Data
const campaigns = [
    { id: 'A', title: 'Outbound SDR - Imobiliário', icon: House, status: 'Conversion: 2.4%', color: '#30E88F' },
    { id: 'B', title: 'Reativação de Leads - SaaS', icon: Lightning, status: 'Status: Follow-up', color: '#E8D030' },
    { id: 'C', title: 'Triagem de Unknown Leads', icon: Question, status: 'Status: Processing', color: '#E8305D' },
];

export default function Hero() {
    return (
        <div className={styles.heroContainer}>
            <div className={styles.gridOverlay} />

            {/* SVG Connections Layer */}
            <svg className={styles.linesOverlay} style={{ overflow: 'visible' }}>
                {campaigns.map((camp, index) => (
                    <ConnectionLine key={camp.id} index={index} />
                ))}
            </svg>

            <div className={styles.orchestrationArea}>

                {/* Central Agent Node */}
                <motion.div
                    className={styles.agentNode}
                    animate={{ y: [0, -10, 0] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                >
                    <div className={styles.agentGlow} />
                    {/* Logo removed as per request */}
                    <div className={styles.status}>
                        <div className={styles.statusDot} />
                        AGENT_ACTIVE
                    </div>
                </motion.div>

                {/* Campaign Nodes Column */}
                <div className={styles.campaignColumn}>
                    {campaigns.map((camp, i) => (
                        <CampaignCard key={camp.id} data={camp} index={i} />
                    ))}
                </div>

            </div>
        </div>
    );
}

function ConnectionLine({ index }) {
    // Simplified coordinates logic for demo (would normally use refs for precise positions)
    // Assuming strict flex layout: Center Node ~ (-200px relative), Targets split vertically
    // Drawing generic paths that "look" like they connect.

    const yOffsets = [-120, 0, 120];
    const yTarget = yOffsets[index];

    return (
        <g style={{ transform: 'translate(50%, 50%)' }}>
            {/* Base Line - Darker for Light Mode */}
            <path
                d={`M -140 0 C -50 0, -50 ${yTarget}, 40 ${yTarget}`}
                fill="none"
                stroke="rgba(148, 163, 184, 0.4)"
                strokeWidth="2"
            />

            {/* Pulse Effect */}
            <motion.path
                d={`M -140 0 C -50 0, -50 ${yTarget}, 40 ${yTarget}`}
                fill="none"
                stroke="url(#pulseGradient)"
                strokeWidth="3"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: [0, 1, 0] }}
                transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear",
                    delay: index * 0.4 // Staggered pulses
                }}
            />

            {/* Moving Bits (Telemetry) - Sapphire Blue */}
            <circle r="4" fill="#3080E8">
                <animateMotion
                    dur={`${1.5 + index * 0.2}s`}
                    repeatCount="indefinite"
                    path={`M -140 0 C -50 0, -50 ${yTarget}, 40 ${yTarget}`}
                />
            </circle>

            <defs>
                <linearGradient id="pulseGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="transparent" />
                    <stop offset="50%" stopColor="#3080E8" />
                    <stop offset="100%" stopColor="transparent" />
                </linearGradient>
            </defs>
        </g>
    );
}

function CampaignCard({ data, index }) {
    const Icon = data.icon;

    return (
        <motion.div
            className={styles.campaignNode}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.2 }}
            whileHover={{ scale: 1.05 }}
        >
            <div className={styles.nodeHeader}>
                <div className={styles.iconBox}>
                    <Icon size={24} weight="light" />
                </div>
                <div className={styles.nodeTitle}>{data.title}</div>
            </div>

            <div className={styles.nodeStats}>
                <span>{data.status}</span>
                <motion.span
                    initial={{ opacity: 0 }}
                    whileHover={{ opacity: 1 }}
                >
                    Latency: 24ms
                </motion.span>
            </div>
        </motion.div>
    );
}
