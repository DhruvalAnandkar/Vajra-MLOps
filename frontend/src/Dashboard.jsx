import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { Activity, Cpu, Server, PlayCircle, Loader2, ArrowLeft, Terminal } from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const Dashboard = () => {
    const [telemetryData, setTelemetryData] = useState([]);
    const [registry, setRegistry] = useState(null);
    const [agentLogs, setAgentLogs] = useState([]);
    const [isAgentRunning, setIsAgentRunning] = useState(false);
    const scrollRef = useRef(null);

    // Auto-scroll terminal when logs change
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [agentLogs]);

    const fetchTelemetry = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/telemetry`);
            const sortedData = response.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
            setTelemetryData(sortedData);
        } catch (error) {
            console.error('Failed to fetch telemetry:', error);
        }
    };

    const fetchRegistry = async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/registry`);
            setRegistry(response.data);
        } catch (error) {
            console.error('Failed to fetch registry:', error);
        }
    };

    useEffect(() => {
        fetchTelemetry();
        fetchRegistry();
        const interval = setInterval(fetchTelemetry, 2000); // Poll every 2s for live feel
        return () => clearInterval(interval);
    }, []);

    const handleTriggerAgent = async () => {
        setIsAgentRunning(true);
        setAgentLogs([]);
        let currentLogs = [];

        try {
            // Create a simulated live typing effect while waiting for API response
            // Or in a fully streaming world we would use WebSockets/SSE.
            const initialLog = "> Initializing LangGraph Orcehstrator...";
            setAgentLogs([initialLog]);

            const response = await axios.post(`${API_BASE_URL}/api/agent/trigger`);

            // Simulate slow typing of the logs that were returned
            const receivedLogs = response.data.logs;

            for (let i = 0; i < receivedLogs.length; i++) {
                await new Promise(r => setTimeout(r, 400)); // 400ms delay between logs
                currentLogs = [...currentLogs, receivedLogs[i]];
                setAgentLogs([initialLog, ...currentLogs]);
            }

            if (response.data.success) {
                fetchRegistry();
            }
        } catch (error) {
            setAgentLogs(prev => [...prev, `> ERROR: Failed to run agent context. ${error.message}`]);
        } finally {
            setIsAgentRunning(false);
        }
    };

    const formattedChartData = telemetryData.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu: d.cpu_usage_percent
    }));

    // Framer Motion layout variants
    const pageVariants = {
        hidden: { opacity: 0, y: 10 },
        visible: {
            opacity: 1,
            y: 0,
            transition: { duration: 0.5, staggerChildren: 0.1, ease: "easeOut" }
        }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col relative overflow-hidden">

            {/* Top Navbar Glassmorphism */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="w-full bg-white/70 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 px-8 py-4 shadow-sm"
            >
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100">
                            <ArrowLeft className="h-5 w-5 text-primary-600" />
                        </Link>
                        <h1 className="text-2xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                            <span className="text-gray-400 font-light">/</span>
                            <span><span className="text-blue-600">V</span>ajra</span>
                        </h1>
                    </div>

                    <div className="flex items-center gap-2 bg-white px-4 py-2 rounded-full border border-gray-200 shadow-sm">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">System Status: Healthy</span>
                    </div>
                </div>
            </motion.header>

            {/* Main Grid Content */}
            <motion.main
                variants={pageVariants}
                initial="hidden"
                animate="visible"
                className="flex-grow max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-3 gap-8 pb-[300px]"
            >

                {/* Left Column: Live Telemetry */}
                <motion.div variants={itemVariants} className="lg:col-span-2 flex flex-col h-full">
                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-6 flex-grow flex flex-col h-full min-h-[450px]">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-3">
                                <div className="p-2.5 bg-blue-50 rounded-xl">
                                    <Cpu className="h-6 w-6 text-primary-600" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">Live CPU Telemetry</h2>
                                    <p className="text-sm text-gray-500">High-frequency ingestion from TimescaleDB</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex-grow w-full relative">
                            {telemetryData.length > 0 ? (
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={formattedChartData} margin={{ top: 10, right: 10, bottom: 0, left: -20 }}>
                                        <defs>
                                            <linearGradient id="colorCpu" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.3} />
                                                <stop offset="95%" stopColor="#2563EB" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F3F4F6" />
                                        <XAxis
                                            dataKey="time"
                                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            dy={10}
                                            minTickGap={30}
                                        />
                                        <YAxis
                                            domain={[0, 100]}
                                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                                            axisLine={false}
                                            tickLine={false}
                                            dx={-10}
                                        />
                                        <Tooltip
                                            contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                                            labelStyle={{ color: '#1F2937', fontWeight: 600, marginBottom: '4px' }}
                                            itemStyle={{ color: '#2563EB', fontWeight: 500 }}
                                        />
                                        <Area
                                            type="monotone"
                                            dataKey="cpu"
                                            stroke="#2563EB"
                                            strokeWidth={3}
                                            fillOpacity={1}
                                            fill="url(#colorCpu)"
                                            animationDuration={300}
                                        />
                                    </AreaChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400">
                                    <Loader2 className="h-8 w-8 animate-spin text-gray-300 mb-4" />
                                    <p>Awaiting streaming telemetry...</p>
                                </div>
                            )}
                        </div>
                    </div>
                </motion.div>

                {/* Right Column: Agent Control & Registry (Glassmorphism) */}
                <motion.div variants={itemVariants} className="flex flex-col gap-6">

                    <div className="relative bg-white/60 backdrop-blur-xl rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-white p-6 overflow-hidden">
                        {/* Subtle background glow */}
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-100 rounded-full blur-3xl opacity-60"></div>

                        <div className="relative z-10">
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                    <Activity className="h-6 w-6 text-gray-700" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-gray-900">SRE AI Agent</h2>
                                    <p className="text-sm text-gray-500">Autonomous loop control</p>
                                </div>
                            </div>

                            <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                                Manually trigger the LangGraph state machine. It will evaluate the TimescaleDB history against the baseline, test for drift, and conditionally retrain.
                            </p>

                            <motion.button
                                onClick={handleTriggerAgent}
                                disabled={isAgentRunning}
                                whileHover={!isAgentRunning ? { scale: 1.02, boxShadow: "0px 8px 20px rgba(37, 99, 235, 0.25)" } : {}}
                                whileTap={!isAgentRunning ? { scale: 0.98 } : {}}
                                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                                className="w-full flex items-center justify-center gap-2 bg-primary-600 text-white px-6 py-4 rounded-xl font-semibold text-lg transition-colors disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none shadow-md shadow-blue-500/20"
                            >
                                {isAgentRunning ? (
                                    <>
                                        <Loader2 className="h-5 w-5 animate-spin" />
                                        Agent Executing...
                                    </>
                                ) : (
                                    <>
                                        <PlayCircle className="h-5 w-5" />
                                        Trigger System Evaluation
                                    </>
                                )}
                            </motion.button>
                        </div>
                    </div>

                    <div className="bg-white rounded-2xl shadow-[0_4px_20px_rgba(0,0,0,0.03)] border border-gray-100 p-6 flex-grow">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                <Server className="h-5 w-5 text-gray-700" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">Active Model Registry</h2>
                        </div>

                        {registry ? (
                            <div className="bg-[#F8F9FA] rounded-xl p-4 font-mono text-xs text-gray-600 overflow-hidden border border-gray-200 h-full max-h-[160px] overflow-y-auto">
                                <pre>{JSON.stringify(registry, null, 2)}</pre>
                            </div>
                        ) : (
                            <div className="bg-[#F8F9FA] rounded-xl p-4 text-sm text-gray-500 border border-gray-200 flex flex-col items-center justify-center text-center h-[120px]">
                                <span className="mb-1 text-gray-600 font-medium">No production model online.</span>
                                <span className="text-xs">Agent has not deployed anything yet.</span>
                            </div>
                        )}
                    </div>

                </motion.div>
            </motion.main>

            {/* Bottom Floating Terminal UI */}
            <motion.div
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6, ease: "easeOut" }}
                className="fixed bottom-0 left-0 w-full px-8 pb-6 pointer-events-none z-40"
            >
                <div className="max-w-7xl mx-auto shadow-2xl rounded-2xl overflow-hidden pointer-events-auto border border-gray-700 ring-1 ring-white/10 bg-[#1F2937] flex flex-col">
                    {/* Terminal Header */}
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#111827] border-b border-gray-800">
                        <Terminal className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">Interactive Agent Logs</span>
                        <div className="ml-auto flex gap-1.5 opacity-80">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                    </div>

                    {/* Terminal Body */}
                    <div
                        ref={scrollRef}
                        className="p-4 h-[180px] overflow-y-auto font-mono text-sm shadow-inner"
                    >
                        {agentLogs.length === 0 ? (
                            <div className="h-full w-full flex items-center justify-center text-gray-500 italic">
                                System standby. Waiting for trigger input...
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5" style={{ color: '#E5E7EB' }}>
                                <AnimatePresence initial={false}>
                                    {agentLogs.map((log, i) => (
                                        <motion.div
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ duration: 0.2 }}
                                            className={`break-words ${log.includes("ERROR") ? "text-red-400 font-medium" :
                                                log.includes("ALERT") ? "text-yellow-400 font-medium" :
                                                    log.includes("SUCCESS") ? "text-[#34D399] font-medium" :
                                                        "text-gray-300"
                                                }`}
                                        >
                                            {log}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {/* Blinking Cursor */}
                                {isAgentRunning && (
                                    <motion.div
                                        animate={{ opacity: [1, 0] }}
                                        transition={{ duration: 0.8, repeat: Infinity, ease: 'linear' }}
                                        className="w-2 h-4 bg-gray-400 mt-1 inline-block"
                                    />
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>

        </div>
    );
};

export default Dashboard;
