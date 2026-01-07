import { useState, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import styles from './Tabs.module.css';

const TabsContext = createContext();

export function Tabs({ defaultValue, children, className = '' }) {
    const [activeTab, setActiveTab] = useState(defaultValue);

    return (
        <TabsContext.Provider value={{ activeTab, setActiveTab }}>
            <div className={`${styles.tabsRoot} ${className}`}>
                {children}
            </div>
        </TabsContext.Provider>
    );
}

export function TabsList({ children, className = '' }) {
    return (
        <div className={`${styles.tabsList} ${className}`}>
            {children}
        </div>
    );
}

export function TabsTrigger({ value, children, icon: Icon, className = '' }) {
    const { activeTab, setActiveTab } = useContext(TabsContext);
    const isActive = activeTab === value;

    return (
        <button
            className={`${styles.tabsTrigger} ${className}`}
            data-state={isActive ? 'active' : 'inactive'}
            onClick={() => setActiveTab(value)}
        >
            {Icon && <Icon size={18} weight={isActive ? "fill" : "regular"} />}
            {children}
        </button>
    );
}

export function TabsContent({ value, children, className = '' }) {
    const { activeTab } = useContext(TabsContext);

    if (activeTab !== value) return null;

    return (
        <motion.div
            className={`${styles.tabsContent} ${className}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }}
        >
            {children}
        </motion.div>
    );
}
