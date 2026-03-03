import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import {
    Activity, Cpu, Server, PlayCircle, Loader2, ArrowLeft,
    Terminal, LayoutDashboard, Database, GitBranch, HeartPulse,
    Trophy, Swords, AlertTriangle, ToggleLeft, ToggleRight,
    CheckCircle2, XCircle, AlertCircle, Wifi
} from 'lucide-react';
import { Link } from 'react-router-dom';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// ── Shared animation variants ──────────────────────────────
const fadeUp = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } } };
const stagger = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { staggerChildren: 0.08 } } };

// ── Stat Card ──────────────────────────────────────────────
const StatCard = ({ label, value, sub, icon: Icon, accent = 'blue' }) => {
    const colours = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-green-50 text-green-600',
        purple: 'bg-purple-50 text-purple-600',
        amber: 'bg-amber-50 text-amber-600',
    };
    return (
        <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-start gap-4">
            <div className={`p-3 rounded-xl ${colours[accent]}`}>
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-sm text-gray-500 font-medium">{label}</p>
                <p className="text-2xl font-bold text-gray-900 mt-0.5">{value}</p>
                {sub && <p className="text-xs text-gray-400 mt-1">{sub}</p>}
            </div>
        </motion.div>
    );
};

// ── Status Badge ───────────────────────────────────────────
const StatusBadge = ({ status }) => {
    const map = {
        champion: 'bg-blue-100 text-blue-700',
        defeated: 'bg-gray-100 text-gray-500',
        pending: 'bg-amber-100 text-amber-700',
        online: 'bg-green-100 text-green-700',
        degraded: 'bg-amber-100 text-amber-700',
        offline: 'bg-red-100 text-red-700',
    };
    return (
        <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wide ${map[status] || 'bg-gray-100 text-gray-500'}`}>
            {status}
        </span>
    );
};

// ── Service Health Row ─────────────────────────────────────
const ServiceRow = ({ name, status, latency_ms }) => {
    const icons = {
        online: <CheckCircle2 className="h-5 w-5 text-green-500" />,
        degraded: <AlertCircle className="h-5 w-5 text-amber-500" />,
        offline: <XCircle className="h-5 w-5 text-red-500" />,
    };
    return (
        <motion.div variants={fadeUp} className="flex items-center justify-between py-4 border-b border-gray-100 last:border-0">
            <div className="flex items-center gap-3">
                {icons[status] || icons.degraded}
                <span className="font-medium text-gray-800">{name}</span>
            </div>
            <div className="flex items-center gap-3">
                {latency_ms !== null && latency_ms !== undefined && (
                    <span className="text-xs text-gray-400 font-mono">{latency_ms}ms</span>
                )}
                <StatusBadge status={status} />
            </div>
        </motion.div>
    );
};

// ══════════════════════════════════════════════════════════
// TAB VIEWS
// ══════════════════════════════════════════════════════════

// ── Tab 1: Overview ────────────────────────────────────────
const OverviewTab = ({ telemetryData, agentLogs, isAgentRunning, scrollRef, onTriggerAgent, manualOverride, setManualOverride, onSimulateOutage }) => {
    const formattedChartData = telemetryData.map(d => ({
        time: new Date(d.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
        cpu: d.cpu_usage_percent,
    }));

    return (
        <motion.div variants={stagger} initial="hidden" animate="visible"
            className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* CPU Chart */}
            <motion.div variants={fadeUp} className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6 min-h-[380px] flex flex-col">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-blue-50 rounded-xl"><Cpu className="h-5 w-5 text-blue-600" /></div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900">Live CPU Telemetry</h2>
                        <p className="text-xs text-gray-400">High-frequency ingestion from Aiven TimescaleDB</p>
                    </div>
                </div>
                <div className="flex-grow">
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
                                <XAxis dataKey="time" tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} dy={10} minTickGap={30} />
                                <YAxis domain={[0, 100]} tick={{ fill: '#9CA3AF', fontSize: 11 }} axisLine={false} tickLine={false} dx={-10} />
                                <Tooltip contentStyle={{ borderRadius: '12px', border: '1px solid #E5E7EB' }} itemStyle={{ color: '#2563EB' }} />
                                <Area type="monotone" dataKey="cpu" stroke="#2563EB" strokeWidth={3} fillOpacity={1} fill="url(#colorCpu)" animationDuration={300} />
                            </AreaChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-full flex flex-col items-center justify-center text-gray-400">
                            <Loader2 className="h-8 w-8 animate-spin text-gray-300 mb-3" />
                            <p className="text-sm">Awaiting streaming telemetry...</p>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* SRE Control Panel */}
            <motion.div variants={fadeUp} className="flex flex-col gap-4">
                {/* Agent trigger */}
                <div className="relative bg-white/70 backdrop-blur-xl rounded-2xl border border-white shadow-sm p-6 overflow-hidden">
                    <div className="absolute -top-8 -right-8 w-28 h-28 bg-blue-100 rounded-full blur-3xl opacity-60" />
                    <div className="relative z-10">
                        <div className="flex items-center gap-3 mb-4">
                            <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100">
                                <Activity className="h-5 w-5 text-gray-700" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">SRE AI Agent</h2>
                                <p className="text-xs text-gray-400">Autonomous LangGraph control</p>
                            </div>
                        </div>
                        <motion.button onClick={onTriggerAgent} disabled={isAgentRunning}
                            whileHover={!isAgentRunning ? { scale: 1.02, boxShadow: '0px 8px 20px rgba(37,99,235,0.25)' } : {}}
                            whileTap={!isAgentRunning ? { scale: 0.98 } : {}}
                            className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-xl font-semibold text-sm disabled:opacity-60 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 mb-4">
                            {isAgentRunning ? <><Loader2 className="h-4 w-4 animate-spin" /> Executing...</> : <><PlayCircle className="h-4 w-4" /> Trigger System Evaluation</>}
                        </motion.button>

                        {/* Simulate Outage */}
                        <motion.button onClick={onSimulateOutage}
                            whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                            className="w-full flex items-center justify-center gap-2 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-700 px-4 py-3 rounded-xl font-semibold text-sm transition-colors mb-3">
                            <AlertTriangle className="h-4 w-4" /> Simulate Outage
                        </motion.button>

                        {/* Manual Override Toggle */}
                        <button onClick={() => setManualOverride(v => !v)}
                            className="w-full flex items-center justify-between bg-gray-50 border border-gray-200 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                            <span>Manual Override</span>
                            {manualOverride
                                ? <ToggleRight className="h-5 w-5 text-blue-600" />
                                : <ToggleLeft className="h-5 w-5 text-gray-400" />}
                        </button>
                        {manualOverride && (
                            <p className="text-xs text-amber-600 font-medium mt-2 text-center">
                                ⚠ Manual override active — autonomous actions paused
                            </p>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* Floating Terminal */}
            <motion.div variants={fadeUp} className="lg:col-span-3">
                <div className="bg-[#1F2937] rounded-2xl border border-gray-700 overflow-hidden">
                    <div className="flex items-center gap-3 px-4 py-2.5 bg-[#111827] border-b border-gray-800">
                        <Terminal className="h-4 w-4 text-gray-400" />
                        <span className="text-xs font-semibold tracking-wider text-gray-300 uppercase">Interactive Agent Logs</span>
                        <div className="ml-auto flex gap-1.5 opacity-80">
                            <div className="w-3 h-3 rounded-full bg-red-500" />
                            <div className="w-3 h-3 rounded-full bg-yellow-500" />
                            <div className="w-3 h-3 rounded-full bg-green-500" />
                        </div>
                    </div>
                    <div ref={scrollRef} className="p-4 h-[160px] overflow-y-auto font-mono text-sm">
                        {agentLogs.length === 0 ? (
                            <div className="h-full flex items-center justify-center text-gray-500 italic text-xs">
                                System standby. Waiting for trigger input...
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1.5" style={{ color: '#E5E7EB' }}>
                                <AnimatePresence initial={false}>
                                    {agentLogs.map((log, i) => (
                                        <motion.div key={i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }}
                                            className={`break-words text-xs ${log.includes('ERROR') ? 'text-red-400 font-medium' : log.includes('ALERT') ? 'text-yellow-400 font-medium' : log.includes('SUCCESS') ? 'text-green-400 font-medium' : 'text-gray-300'}`}>
                                            {log}
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                                {isAgentRunning && <motion.div animate={{ opacity: [1, 0] }} transition={{ duration: 0.8, repeat: Infinity }} className="w-2 h-3 bg-gray-400 inline-block" />}
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Tab 2: Model Registry ──────────────────────────────────
const ModelRegistryTab = ({ registry }) => {
    if (!registry) return <div className="flex items-center justify-center h-64 text-gray-400"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading registry...</div>;

    return (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">
            {/* Champion model */}
            <motion.div variants={fadeUp} className="bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-2xl p-6 shadow-lg shadow-blue-500/20">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="p-2.5 bg-white/20 rounded-xl"><Trophy className="h-6 w-6" /></div>
                        <div>
                            <h2 className="text-lg font-bold">Champion Model</h2>
                            <p className="text-blue-100 text-sm">Currently serving production traffic</p>
                        </div>
                    </div>
                    <StatusBadge status="champion" />
                </div>
                <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-xs text-blue-200 mb-1">Artifact</p>
                        <p className="font-mono text-sm font-semibold truncate">{registry.production_model_path || 'N/A'}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-xs text-blue-200 mb-1">RMSE</p>
                        <p className="font-bold text-xl">{registry.rmse ?? '—'}</p>
                    </div>
                    <div className="bg-white/10 rounded-xl p-3">
                        <p className="text-xs text-blue-200 mb-1">Deployed At</p>
                        <p className="text-sm font-medium">{registry.deployment_timestamp ? new Date(registry.deployment_timestamp).toLocaleString() : 'Pending'}</p>
                    </div>
                </div>
            </motion.div>

            {/* Challenger History */}
            <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100"><Swords className="h-5 w-5 text-gray-600" /></div>
                    <div>
                        <h2 className="text-base font-bold text-gray-900">Challenger History</h2>
                        <p className="text-xs text-gray-400">Models defeated during autonomous retraining cycles</p>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100">
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Artifact</th>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Deployed</th>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">RMSE</th>
                                <th className="text-left py-2 px-3 text-xs font-semibold text-gray-400 uppercase tracking-wide">Status</th>
                            </tr>
                        </thead>
                        <tbody>
                            {(registry.challenger_history || []).map((m, i) => (
                                <motion.tr key={i} variants={fadeUp} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                                    <td className="py-3 px-3 font-mono text-xs text-gray-700">{m.artifact}</td>
                                    <td className="py-3 px-3 text-gray-500">{new Date(m.deployed_at).toLocaleString()}</td>
                                    <td className="py-3 px-3 font-semibold text-gray-700">{m.rmse}</td>
                                    <td className="py-3 px-3"><StatusBadge status={m.status} /></td>
                                </motion.tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Tab 3: Data Lineage ────────────────────────────────────
const DataLineageTab = ({ stats }) => {
    if (!stats) return <div className="flex items-center justify-center h-64 text-gray-400"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading pipeline stats...</div>;

    return (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">
            <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                <StatCard label="Total Records Ingested" value={stats.total_records?.toLocaleString() ?? '—'} sub={`from ${stats.unique_servers ?? 0} unique servers`} icon={Database} accent="blue" />
                <StatCard label="Mean CPU Usage" value={`${stats.avg_cpu_percent ?? '—'}%`} sub="across all server_metrics" icon={Cpu} accent="purple" />
                <StatCard label="Mean Response Time" value={`${stats.avg_response_time_ms ?? '—'}ms`} sub="end-to-end latency avg" icon={Activity} accent="green" />
                <StatCard label="Mean Memory Usage" value={`${stats.avg_memory_mb ? Math.round(stats.avg_memory_mb) : '—'} MB`} sub="avg heap across fleet" icon={Server} accent="amber" />
                <StatCard label="Null Rate" value={`${stats.null_rate_percent ?? 0}%`} sub="enforced by Pydantic schema" icon={CheckCircle2} accent="green" />
                <StatCard label="Active Servers" value={stats.unique_servers ?? '—'} sub="unique server_id values" icon={Wifi} accent="blue" />
            </motion.div>

            {/* Pipeline stages */}
            <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-6">Ingestion Pipeline</h2>
                <div className="flex items-center gap-2">
                    {[
                        { label: 'Simulator', color: 'bg-blue-600' },
                        { label: 'FastAPI /ingest', color: 'bg-blue-500' },
                        { label: 'Redpanda Topic', color: 'bg-blue-400' },
                        { label: 'Kafka Consumer', color: 'bg-blue-300' },
                        { label: 'Aiven TimescaleDB', color: 'bg-blue-200' },
                    ].map((stage, i) => (
                        <React.Fragment key={i}>
                            <div className={`${stage.color} text-white text-xs font-semibold px-3 py-2 rounded-lg whitespace-nowrap`}>{stage.label}</div>
                            {i < 4 && <div className="flex-grow h-0.5 bg-blue-100 relative"><div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-blue-300" /></div>}
                        </React.Fragment>
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ── Tab 4: System Health ───────────────────────────────────
const SystemHealthTab = ({ health }) => {
    if (!health) return <div className="flex items-center justify-center h-64 text-gray-400"><Loader2 className="h-6 w-6 animate-spin mr-2" /> Loading health data...</div>;

    const online = health.services?.filter(s => s.status === 'online').length ?? 0;
    const total = health.services?.length ?? 0;

    return (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="flex flex-col gap-6">
            <motion.div variants={fadeUp} className="grid grid-cols-3 gap-4">
                <StatCard label="Services Online" value={`${online}/${total}`} sub="subsystems healthy" icon={HeartPulse} accent={online === total ? 'green' : 'amber'} />
                <StatCard label="API Mode" value={health.services?.find(s => s.name === 'Kafka (Redpanda)')?.status === 'online' ? 'Full Pipeline' : 'Degraded'} sub="Kafka + DB or DB-only" icon={Activity} accent="blue" />
                <StatCard label="Cloud Provider" value="Aiven.io" sub="PostgreSQL 17 — us-east5" icon={Database} accent="purple" />
            </motion.div>

            <motion.div variants={fadeUp} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
                <h2 className="text-base font-bold text-gray-900 mb-2">Subsystem Status</h2>
                <p className="text-xs text-gray-400 mb-6">Live health check — refreshes every 10s</p>
                <div>
                    {(health.services || []).map((svc, i) => (
                        <ServiceRow key={i} {...svc} />
                    ))}
                </div>
            </motion.div>
        </motion.div>
    );
};

// ══════════════════════════════════════════════════════════
// MAIN DASHBOARD
// ══════════════════════════════════════════════════════════
const TABS = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'registry', label: 'Model Registry', icon: GitBranch },
    { id: 'lineage', label: 'Data Lineage', icon: Database },
    { id: 'health', label: 'System Health', icon: HeartPulse },
];

const Dashboard = () => {
    const [activeTab, setActiveTab] = useState('overview');
    const [telemetryData, setTelemetryData] = useState([]);
    const [registry, setRegistry] = useState(null);
    const [stats, setStats] = useState(null);
    const [health, setHealth] = useState(null);
    const [agentLogs, setAgentLogs] = useState([]);
    const [isAgentRunning, setIsAgentRunning] = useState(false);
    const [manualOverride, setManualOverride] = useState(false);
    const scrollRef = useRef(null);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [agentLogs]);

    const fetchTelemetry = async () => {
        try {
            const res = await axios.get(`${API_BASE_URL}/api/telemetry`);
            setTelemetryData(res.data.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)));
        } catch { }
    };

    const fetchRegistry = async () => {
        try { setRegistry((await axios.get(`${API_BASE_URL}/api/registry`)).data); } catch { }
    };

    const fetchStats = async () => {
        try { setStats((await axios.get(`${API_BASE_URL}/api/pipeline/stats`)).data); } catch { }
    };

    const fetchHealth = async () => {
        try { setHealth((await axios.get(`${API_BASE_URL}/api/system/health`)).data); } catch { }
    };

    useEffect(() => {
        fetchTelemetry(); fetchRegistry(); fetchStats(); fetchHealth();
        const telemetryInterval = setInterval(fetchTelemetry, 2000);
        const healthInterval = setInterval(fetchHealth, 10000);
        return () => { clearInterval(telemetryInterval); clearInterval(healthInterval); };
    }, []);

    const handleTriggerAgent = async () => {
        if (manualOverride) {
            setAgentLogs(prev => [...prev, '> [Vajra-SRE] Manual Override Active — autonomous execution blocked.']);
            return;
        }
        setIsAgentRunning(true);
        setAgentLogs([]);
        let currentLogs = [];
        try {
            const initialLog = '> [Vajra-SRE] Initializing LangGraph Orchestrator...';
            setAgentLogs([initialLog]);
            const response = await axios.post(`${API_BASE_URL}/api/agent/trigger`);
            const receivedLogs = response.data.logs;
            for (let i = 0; i < receivedLogs.length; i++) {
                await new Promise(r => setTimeout(r, 350));
                currentLogs = [...currentLogs, receivedLogs[i]];
                setAgentLogs([initialLog, ...currentLogs]);
            }
            if (response.data.success) { fetchRegistry(); fetchStats(); }
        } catch (error) {
            setAgentLogs(prev => [...prev, `> ERROR: ${error.message}`]);
        } finally { setIsAgentRunning(false); }
    };

    const handleSimulateOutage = async () => {
        setAgentLogs(prev => [...prev, '> [Vajra-SRE] ⚠ Simulating outage — injecting anomalous CPU spike...']);
        const now = new Date().toISOString();
        for (let i = 0; i < 5; i++) {
            try {
                await axios.post(`${API_BASE_URL}/ingest`, {
                    timestamp: new Date(Date.now() + i * 100).toISOString(),
                    server_id: 'sim-outage-01',
                    cpu_usage_percent: 95 + Math.random() * 10,
                    memory_usage_mb: 15000 + Math.random() * 2000,
                    active_connections: 900 + Math.floor(Math.random() * 100),
                    response_time_ms: 2000 + Math.random() * 1000,
                });
            } catch { }
            await new Promise(r => setTimeout(r, 150));
        }
        setAgentLogs(prev => [...prev, '> [Vajra-SRE] Outage simulation complete. 5 anomalous payloads injected.']);
    };

    return (
        <div className="min-h-screen bg-[#F8F9FA] font-sans flex flex-col">
            {/* Navbar */}
            <motion.header initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.4 }}
                className="w-full bg-white/80 backdrop-blur-md border-b border-gray-200 sticky top-0 z-50 px-8 py-4 shadow-sm">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link to="/" className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors border border-blue-100">
                            <ArrowLeft className="h-4 w-4 text-blue-600" />
                        </Link>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">
                            <span><span className="text-blue-600">V</span>ajra</span>
                        </h1>
                        <span className="hidden md:block text-gray-300">|</span>
                        <span className="hidden md:block text-sm text-gray-400 font-medium">Autonomous MLOps Platform</span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-sm">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500" />
                        </span>
                        <span className="text-xs font-semibold text-gray-600">Systems Operational</span>
                    </div>
                </div>
            </motion.header>

            {/* Tab navigation */}
            <div className="bg-white border-b border-gray-200 sticky top-[65px] z-40">
                <div className="max-w-7xl mx-auto px-8">
                    <div className="flex gap-0">
                        {TABS.map(tab => {
                            const Icon = tab.icon;
                            const active = activeTab === tab.id;
                            return (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                                    className={`relative flex items-center gap-2 px-5 py-4 text-sm font-semibold transition-colors border-b-2 ${active ? 'text-blue-600 border-blue-600' : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'}`}>
                                    <Icon className="h-4 w-4" />
                                    {tab.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* Tab content */}
            <main className="flex-grow max-w-7xl mx-auto w-full p-8">
                <AnimatePresence mode="wait">
                    <motion.div key={activeTab}
                        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}>
                        {activeTab === 'overview' && (
                            <OverviewTab telemetryData={telemetryData} agentLogs={agentLogs} isAgentRunning={isAgentRunning}
                                scrollRef={scrollRef} onTriggerAgent={handleTriggerAgent}
                                manualOverride={manualOverride} setManualOverride={setManualOverride}
                                onSimulateOutage={handleSimulateOutage} />
                        )}
                        {activeTab === 'registry' && <ModelRegistryTab registry={registry} />}
                        {activeTab === 'lineage' && <DataLineageTab stats={stats} />}
                        {activeTab === 'health' && <SystemHealthTab health={health} />}
                    </motion.div>
                </AnimatePresence>
            </main>
        </div>
    );
};

export default Dashboard;
