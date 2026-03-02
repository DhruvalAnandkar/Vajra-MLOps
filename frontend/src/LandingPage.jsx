import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence, useMotionValue, useSpring } from 'framer-motion';
import { Activity, ShieldCheck, Database, Zap, ArrowRight, Server, PlayCircle, Terminal } from 'lucide-react';

const ALL_LOGS = [
    "> [Vajra-SRE] Ingesting Redpanda Stream... [14,020 ev/s]",
    "> [Vajra-SRE] Running KS-Test on cpu_usage...",
    "> [Vajra-SRE] ALERT: P-Value 0.0001 (Drift Detected)",
    "> [Vajra-SRE] Initializing autonomous recovery...",
    "> [Vajra-SRE] Retraining XGBoost Model...",
    "> [Vajra-SRE] Model Deployed. Registry Updated.",
    "> [Vajra-SRE] System Nominal. Monitoring...",
    "> [Vajra-SRE] Ingesting Redpanda Stream... [15,100 ev/s]",
    "> [Vajra-SRE] Running KS-Test on memory_usage...",
    "> [Vajra-SRE] INFO: Data distributions stable."
];

const LandingPage = () => {
    // Mouse-tracking aura coordinates
    const cursorX = useMotionValue(-400);
    const cursorY = useMotionValue(-400);

    // Smooth springs to trail the actual cursor
    const springConfig = { damping: 30, stiffness: 200, mass: 0.5 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);

    useEffect(() => {
        const moveCursor = (e) => {
            // 200 is half the width/height of the aura (400px) to center it on the cursor
            cursorX.set(e.clientX - 200);
            cursorY.set(e.clientY - 200);
        };
        window.addEventListener('mousemove', moveCursor);
        return () => window.removeEventListener('mousemove', moveCursor);
    }, [cursorX, cursorY]);

    // Terminal simulated logs state
    const [logs, setLogs] = useState([ALL_LOGS[0]]);
    const [logIndex, setLogIndex] = useState(1);

    useEffect(() => {
        const interval = setInterval(() => {
            setLogs((prev) => {
                const nextLog = ALL_LOGS[logIndex];
                const newLogs = [...prev, nextLog];
                // Keep only the last 4 logs visible
                if (newLogs.length > 4) return newLogs.slice(1);
                return newLogs;
            });
            setLogIndex((prev) => (prev + 1) % ALL_LOGS.length);
        }, 1500);
        return () => clearInterval(interval);
    }, [logIndex]);

    // Stagger variants for headline words
    const titleText = "Vajra: The Self-Healing MLOps Orchestrator";
    const titleWords = titleText.split(" ");

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.12, delayChildren: 0.2 }
        }
    };

    const wordVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { type: "spring", stiffness: 150, damping: 20 }
        }
    };

    const fadeUpVariant = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.8, ease: "easeOut" } }
    };

    // Card staggered animation
    const cardContainerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.2 }
        }
    };

    const cardVariants = {
        hidden: { opacity: 0, y: 40 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
    };

    return (
        <div className="relative min-h-screen flex flex-col font-sans overflow-hidden" style={{ backgroundColor: 'var(--bg-primary)' }}>

            {/* 
        ========================================
        BACKGROUND LAYERS & EFFECTS
        ========================================
      */}

            {/* Mouse-Tracking Aura */}
            <motion.div
                className="fixed top-0 left-0 w-[400px] h-[400px] rounded-full pointer-events-none z-0"
                style={{
                    x: cursorXSpring,
                    y: cursorYSpring,
                    background: 'radial-gradient(circle, rgba(37, 99, 235, 0.12) 0%, rgba(255,255,255,0) 70%)',
                    filter: 'blur(40px)',
                }}
            />

            {/* Background Layer with subtle pulse */}
            <motion.div
                className="absolute inset-0 pointer-events-none z-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-white to-white"
                animate={{ opacity: [0.4, 0.8, 0.4] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            />

            {/* Data Streams (Vertical background lines with pulsing packets) */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 flex justify-evenly opacity-30">
                {[...Array(5)].map((_, i) => (
                    <div key={`line-${i}`} className="relative w-[1px] h-full bg-gradient-to-b from-transparent via-blue-200 to-transparent">
                        <motion.div
                            className="absolute top-0 left-[-1px] w-[3px] h-[60px] bg-blue-500 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.8)]"
                            animate={{ y: ['-100px', '2500px'] }}
                            transition={{
                                duration: 2 + Math.random() * 2,
                                repeat: Infinity,
                                ease: "linear",
                                delay: Math.random() * 3
                            }}
                        />
                    </div>
                ))}
            </div>

            {/* Floating Abstract Shapes */}
            <motion.div
                className="absolute -top-[20%] -right-[10%] w-[500px] h-[500px] rounded-full bg-blue-400/5 blur-[80px] pointer-events-none z-0"
                animate={{ y: [0, -30, 0], x: [0, 20, 0] }}
                transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
                className="absolute top-[30%] left-[10%] w-32 h-32 rounded-full border-[1px] border-blue-200/50 pointer-events-none z-0"
                animate={{ y: [0, -40, 0], rotate: [0, 15, -15, 0] }}
                transition={{ duration: 15, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
            <motion.div
                className="absolute bottom-[20%] right-[15%] w-24 h-24 border-[1px] border-blue-100/60 rounded-xl pointer-events-none z-0"
                animate={{ y: [0, 30, 0], rotate: [0, -20, 20, 0] }}
                transition={{ duration: 14, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            />

            {/* 
        ========================================
        PAGE CONTENT
        ========================================
      */}

            {/* Navbar Minimal */}
            <nav className="relative z-50 w-full bg-white/70 backdrop-blur-xl border-b border-gray-100 flex items-center justify-between px-8 py-4 sticky top-0">
                <div className="flex items-center gap-2">
                    <div className="p-2 rounded-lg shadow-md shadow-blue-500/10" style={{ backgroundColor: 'var(--accent-blue)' }}>
                        <Activity className="h-5 w-5 text-white" />
                    </div>
                    <span className="text-xl font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
                        <span style={{ color: 'var(--accent-blue)' }}>V</span>ajra
                    </span>
                </div>
                <div className="hidden md:flex items-center gap-6 text-sm font-medium text-gray-500">
                    <a href="#features" className="hover:text-blue-600 transition-colors" style={{ transition: 'color 0.2s' }}>Architecture</a>
                    <a href="#security" className="hover:text-blue-600 transition-colors" style={{ transition: 'color 0.2s' }}>Security</a>
                    <Link to="/dashboard" className="font-semibold hover:opacity-80 transition-opacity" style={{ color: 'var(--accent-blue)' }}>
                        Login to Command Center →
                    </Link>
                </div>
            </nav>

            {/* Hero Section */}
            <main className="relative z-10 flex-grow flex flex-col lg:flex-row items-center justify-center px-8 lg:px-24 mx-auto max-w-7xl w-full mt-12 lg:mt-24 mb-24 gap-16">

                <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
                    {/* Badge */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                        className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50/80 text-blue-700 text-xs font-semibold mb-8 border border-blue-100 uppercase tracking-widest shadow-sm backdrop-blur-sm"
                        style={{ color: 'var(--accent-blue)' }}
                    >
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ backgroundColor: 'var(--accent-blue)' }}></span>
                            <span className="relative inline-flex rounded-full h-2 w-2" style={{ backgroundColor: 'var(--accent-blue)' }}></span>
                        </span>
                        LangGraph Agent Live
                    </motion.div>

                    {/* Headline Staggered Animation */}
                    <motion.h1
                        variants={containerVariants}
                        initial="hidden"
                        animate="visible"
                        className="text-5xl lg:text-7xl font-extrabold tracking-tight leading-tight mb-6 flex flex-wrap justify-center lg:justify-start gap-x-3 gap-y-2"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        {titleWords.map((word, index) => (
                            <motion.span
                                key={index}
                                variants={wordVariants}
                                className={word.includes("Vajra:") || word.includes("Self-Healing") ? "text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-400" : ""}
                            >
                                {word}
                            </motion.span>
                        ))}
                    </motion.h1>

                    {/* Subtitle Fade-in */}
                    <motion.p
                        variants={fadeUpVariant}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 0.8 }}
                        className="text-lg md:text-xl text-gray-500 max-w-2xl mb-12 leading-relaxed"
                    >
                        The world's first self-healing data pipeline engine. Ingests high-velocity Kafka telemetry, stores deeply in TimescaleDB, and relies on an intelligent LangGraph SRE agent to detect statistical drift and seamlessly retrain models in production.
                    </motion.p>

                    {/* CTA Buttons */}
                    <motion.div
                        variants={fadeUpVariant}
                        initial="hidden"
                        animate="visible"
                        transition={{ delay: 1.0 }}
                        className="flex flex-col sm:flex-row items-center gap-4 w-full justify-center lg:justify-start"
                    >
                        {/* Animated Magnetic Button */}
                        <Link to="/dashboard" className="w-full sm:w-auto">
                            <motion.button
                                whileHover={{
                                    scale: 1.05,
                                    boxShadow: "0px 10px 30px rgba(37, 99, 235, 0.3)"
                                }}
                                whileTap={{ scale: 0.95 }}
                                transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                className="w-full sm:w-auto group flex items-center justify-center gap-2 text-white px-8 py-4 rounded-lg font-semibold text-lg shadow-lg shadow-blue-500/20"
                                style={{ backgroundColor: 'var(--accent-blue)' }}
                            >
                                <PlayCircle className="h-5 w-5" />
                                Launch Command Center
                                <ArrowRight className="h-4 w-4 ml-1 group-hover:translate-x-1 transition-transform" />
                            </motion.button>
                        </Link>

                        <button
                            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-white hover:bg-gray-50 border border-gray-200 px-8 py-4 rounded-lg font-semibold text-lg transition-colors shadow-sm"
                            style={{ color: 'var(--text-primary)' }}
                        >
                            View API Docs
                        </button>
                    </motion.div>
                </div>

                {/* Live Glassmorphism Terminal Card */}
                <motion.div
                    variants={fadeUpVariant}
                    initial="hidden"
                    animate="visible"
                    transition={{ delay: 1.2 }}
                    className="flex-1 w-full max-w-md relative"
                >
                    <div className="absolute inset-0 bg-gradient-to-tr from-blue-400/20 to-purple-400/20 rounded-2xl blur-xl" />
                    <div className="relative bg-white/40 border border-white/60 backdrop-blur-md shadow-xl rounded-2xl overflow-hidden flex flex-col h-[320px]">
                        {/* Terminal Header */}
                        <div className="flex items-center gap-2 px-4 py-3 border-b border-white/50 bg-white/30 backdrop-blur-sm">
                            <Terminal className="h-4 w-4 text-gray-600" />
                            <span className="text-xs font-semibold text-gray-700 uppercase tracking-widest">SRE Agent Event Stream</span>
                            <div className="ml-auto flex gap-1.5">
                                <div className="w-2.5 h-2.5 rounded-full bg-red-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-yellow-400" />
                                <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
                            </div>
                        </div>

                        {/* Terminal Body */}
                        <div className="flex-1 p-5 font-mono text-sm overflow-hidden bg-transparent flex flex-col justify-end">
                            <div className="flex flex-col gap-2">
                                <AnimatePresence initial={false}>
                                    {logs.map((log, index) => (
                                        <motion.div
                                            key={`${log}-${index}`}
                                            initial={{ opacity: 0, y: 20, height: 0 }}
                                            animate={{ opacity: 1, y: 0, height: 'auto' }}
                                            exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
                                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                                            className={`break-words ${log.includes("ALERT") ? "text-yellow-600 font-bold" :
                                                log.includes("Deployed") || log.includes("Nominal") ? "text-green-600 font-semibold" :
                                                    "text-gray-700"
                                                }`}
                                        >
                                            {log}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {/* Blinking Cursor */}
                                <motion.div
                                    animate={{ opacity: [1, 0] }}
                                    transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                    className="w-2 h-4 bg-gray-400 mt-1 inline-block"
                                />
                            </div>
                        </div>
                    </div>
                </motion.div>

            </main>

            {/* Architecture Features Grid */}
            <section id="features" className="relative z-10 w-full border-t border-gray-100 py-24 px-8 overflow-hidden bg-white/50 backdrop-blur-sm">
                <div className="max-w-7xl mx-auto">
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.6 }}
                        className="text-3xl font-bold text-center mb-16"
                        style={{ color: 'var(--text-primary)' }}
                    >
                        Enterprise Infrastructure Built-In
                    </motion.h2>

                    <motion.div
                        variants={cardContainerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true, margin: "-50px" }}
                        className="grid grid-cols-1 md:grid-cols-3 gap-10"
                    >

                        {/* Streaming Card */}
                        <motion.div
                            variants={cardVariants}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="group p-8 rounded-2xl border border-white/80 shadow-md hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                            style={{ backgroundColor: 'rgba(248, 249, 250, 0.7)', backdropFilter: 'blur(10px)' }}
                        >
                            <div className="bg-white w-14 h-14 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                                <Zap className="h-6 w-6 text-gray-500 group-hover:text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Kafka Streaming</h3>
                            <p className="text-gray-500 leading-relaxed text-sm">
                                Engineered with Redpanda to effortlessly ingest millions of <code className="bg-white px-1 py-0.5 rounded border border-gray-200 font-mono text-xs" style={{ color: 'var(--text-primary)' }}>ServerMetrics</code> events per second with sub-millisecond latency.
                            </p>
                        </motion.div>

                        {/* Storage Card */}
                        <motion.div
                            variants={cardVariants}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="group p-8 rounded-2xl border border-white/80 shadow-md hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                            style={{ backgroundColor: 'rgba(248, 249, 250, 0.7)', backdropFilter: 'blur(10px)' }}
                        >
                            <div className="bg-white w-14 h-14 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                                <Database className="h-6 w-6 text-gray-500 group-hover:text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Time-Series Optimized</h3>
                            <p className="text-gray-500 leading-relaxed text-sm">
                                Massive data chunking handled automatically by PostgreSQL TimescaleDB hypertables, keeping analytics and queries terrifyingly fast.
                            </p>
                        </motion.div>

                        {/* AI Agent Card */}
                        <motion.div
                            variants={cardVariants}
                            whileHover={{ y: -8, transition: { duration: 0.2 } }}
                            className="group p-8 rounded-2xl border border-white/80 shadow-md hover:bg-white hover:shadow-xl hover:border-blue-100 transition-all duration-300"
                            style={{ backgroundColor: 'rgba(248, 249, 250, 0.7)', backdropFilter: 'blur(10px)' }}
                        >
                            <div className="bg-white w-14 h-14 rounded-xl border border-gray-200 shadow-sm flex items-center justify-center mb-6 group-hover:bg-blue-50 group-hover:border-blue-200 transition-colors">
                                <ShieldCheck className="h-6 w-6 text-gray-500 group-hover:text-blue-600" />
                            </div>
                            <h3 className="text-xl font-bold mb-3" style={{ color: 'var(--text-primary)' }}>Self-Healing AI</h3>
                            <p className="text-gray-500 leading-relaxed text-sm">
                                An asynchronous LangGraph agent performs active Kolmogorov-Smirnov drift tests and automatically retrains XGBoost models if production distributions shift.
                            </p>
                        </motion.div>

                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 bg-white border-t border-gray-100 text-gray-400 py-12 text-center text-sm font-medium">
                <p className="mb-2 text-gray-500">© 2026 Vajra MLOps Framework. All rights reserved.</p>
                <p className="flex items-center justify-center gap-1">Built with <Server className="h-4 w-4 mx-1" /> Docker, Timescale, and LangGraph.</p>
            </footer>

        </div>
    );
};

export default LandingPage;
