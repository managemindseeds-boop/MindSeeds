import { useMemo, useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Users, CalendarCheck, ClipboardList,
    UserPlus, CalendarPlus, TrendingUp, AlertCircle,
    Clock, BookOpen, ArrowRight, CheckCircle2, Phone,
} from 'lucide-react'
import axios from 'axios'
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { useStudents } from '../../context/StudentContext'
import { useDemos } from '../../context/DemoContext'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const STATUS_LABELS = {
    enquiry: 'Enquiry',
    demo_scheduled: 'Demo Scheduled',
    demo_completed: 'Demo Completed',
    admitted: 'Admitted',
    dropped: 'Dropped',
}

const STATUS_COLORS = {
    enquiry: '#6366f1',
    demo_scheduled: '#f59e0b',
    demo_completed: '#10b981',
    admitted: '#3b82f6',
    dropped: '#ef4444',
}

// ─── Sub-components ──────────────────────────────────────────────────────────

// eslint-disable-next-line no-unused-vars
function KpiCard({ label, value, icon: Icon, accentColor, subText, alert }) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-medium text-gray-500">{label}</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-2">{value}</h3>
                </div>
                <div className="p-3 rounded-lg" style={{ backgroundColor: `${accentColor}18`, color: accentColor }}>
                    <Icon size={22} />
                </div>
            </div>
            {(alert || subText) && (
                <div className="mt-3 flex items-center gap-2">
                    {alert && value > 0 && (
                        <span className="flex items-center gap-1 text-xs font-medium text-rose-500">
                            <AlertCircle size={14} /> Needs attention
                        </span>
                    )}
                    {!alert && subText && (
                        <span className="text-xs text-gray-400">{subText}</span>
                    )}
                </div>
            )}
        </div>
    )
}

function SectionHeader({ title, subtitle }) {
    return (
        <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-800">{title}</h3>
            {subtitle && <p className="text-xs text-gray-400 mt-0.5">{subtitle}</p>}
        </div>
    )
}

const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-100 shadow-lg rounded-lg px-3 py-2 text-xs">
                <p className="font-semibold text-gray-700">{payload[0].name}</p>
                <p style={{ color: payload[0].payload.fill || payload[0].color }}>
                    {payload[0].value} {payload[0].name === 'Students' ? 'students' : ''}
                </p>
            </div>
        )
    }
    return null
}

// ─── Main Component ───────────────────────────────────────────────────────────

function Dashboard() {
    const navigate = useNavigate()
    const { students } = useStudents()
    const { todayDemos, upcomingDemos, absentDemos } = useDemos()
    const [pendingCalls, setPendingCalls] = useState(0)

    useEffect(() => {
        axios.get('/api/v1/calls/count')
            .then(res => setPendingCalls(res.data.data?.count || 0))
            .catch(() => {})
    }, [])

    // ── Computed KPIs ──────────────────────────────────────────────────────
    const totalStudents = students.length
    const demosToday = todayDemos.length
    const completedDemos = useMemo(
        () => students.filter(s => s.status === 'demo_completed').length,
        [students]
    )

    // ── Student Status Chart Data ──────────────────────────────────────────
    const statusChartData = useMemo(() => {
        const counts = {}
        students.forEach(s => {
            counts[s.status] = (counts[s.status] || 0) + 1
        })
        return Object.entries(counts)
            .filter(([, v]) => v > 0)
            .map(([key, value]) => ({
                name: STATUS_LABELS[key] || key,
                value,
                fill: STATUS_COLORS[key] || '#94a3b8',
            }))
    }, [students])

    // ── Demo Activity Chart Data ───────────────────────────────────────────
    const demoChartData = [
        { name: "Today", count: todayDemos.length, fill: '#6366f1' },
        { name: "Upcoming", count: upcomingDemos.length, fill: '#f59e0b' },
        { name: "Absent", count: absentDemos.length, fill: '#ef4444' },
    ]

    return (
        <div className="space-y-6">

            {/* ── Top Welcome Bar ──────────────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end mb-4">
                <div className="flex gap-2 justify-center sm:justify-end w-full sm:w-auto">
                    <button
                        onClick={() => navigate('/receptionist/students/add')}
                        className="flex items-center gap-2 px-4 py-2 bg-white text-gray-700 border border-gray-200 text-sm font-medium rounded-lg hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
                    >
                        <UserPlus size={15} /> Add Student
                    </button>
                    <button
                        onClick={() => navigate('/receptionist/demos')}
                        className="flex items-center gap-2 px-4 py-2 bg-[#f0e6f6] text-emerald-700 border border-[#f0e6f6] text-sm font-medium rounded-lg hover:bg-[#f0e6f6] transition-colors shadow-sm cursor-pointer"
                    >
                        <CalendarPlus size={15} /> View Demos
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <KpiCard
                    label="Total Students"
                    value={totalStudents}
                    icon={Users}
                    accentColor="#6366f1"
                    subText="Registered"
                />
                <KpiCard
                    label="Demos Today"
                    value={demosToday}
                    icon={CalendarCheck}
                    accentColor="#f59e0b"
                    subText="Scheduled"
                />
                <KpiCard
                    label="Completed Demos"
                    value={completedDemos}
                    icon={ClipboardList}
                    accentColor="#10b981"
                    alert={completedDemos > 0}
                />
                <div
                    onClick={() => navigate('/receptionist/calls')}
                    className="cursor-pointer"
                >
                    <KpiCard
                        label="Pending Calls"
                        value={pendingCalls}
                        icon={Phone}
                        accentColor="#ef4444"
                        alert={pendingCalls > 0}
                    />
                </div>
            </div>

            {/* ── Charts Row ───────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

                {/* Student Status Donut */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <SectionHeader
                        title="Student Status Breakdown"
                        subtitle="Distribution across all registered students"
                    />
                    {statusChartData.length === 0 ? (
                        <div className="flex items-center justify-center h-48 text-sm text-gray-400">
                            No students registered yet
                        </div>
                    ) : (
                        <ResponsiveContainer width="100%" height={220}>
                            <PieChart>
                                <Pie
                                    data={statusChartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={90}
                                    paddingAngle={3}
                                    dataKey="value"
                                >
                                    {statusChartData.map((entry, index) => (
                                        <Cell key={index} fill={entry.fill} />
                                    ))}
                                </Pie>
                                <Tooltip content={<CustomTooltip />} />
                                <Legend
                                    iconType="circle"
                                    iconSize={8}
                                    formatter={(value) => (
                                        <span style={{ fontSize: 11, color: '#6b7280' }}>{value}</span>
                                    )}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    )}
                </div>

                {/* Demo Activity Bar */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <SectionHeader
                        title="Demo Activity Overview"
                        subtitle="Today's schedule, upcoming, and absent sessions"
                    />
                    <ResponsiveContainer width="100%" height={220}>
                        <BarChart data={demoChartData} barSize={36} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" vertical={false} />
                            <XAxis
                                dataKey="name"
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fontSize: 11, fill: '#9ca3af' }}
                                axisLine={false}
                                tickLine={false}
                                allowDecimals={false}
                            />
                            <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f9fafb' }} />
                            <Bar dataKey="count" name="Sessions" radius={[6, 6, 0, 0]}>
                                {demoChartData.map((entry, index) => (
                                    <Cell key={index} fill={entry.fill} />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* ── Today's Demo Schedule ── */}
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                <div className="flex items-center justify-between mb-4">
                    <SectionHeader
                        title="Today's Demo Schedule"
                        subtitle={`${demosToday} session${demosToday !== 1 ? 's' : ''} scheduled`}
                    />
                    <button
                        onClick={() => navigate('/receptionist/demos')}
                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium transition-colors cursor-pointer"
                    >
                        View all <ArrowRight size={12} />
                    </button>
                </div>

                {todayDemos.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                        <CalendarCheck size={32} className="opacity-30" />
                        <p className="text-sm">No demos scheduled for today</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-gray-100">
                                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Student</th>
                                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Class</th>
                                    <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3 pr-4">Branch</th>
                                    <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Lecture</th>
                                    <th className="text-center text-xs font-semibold text-gray-400 uppercase tracking-wide pb-3">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {todayDemos.map(demo => (
                                    <tr key={demo.id} className="transition-colors">
                                        <td className="py-3 pr-4">
                                            <div className="flex items-center gap-2">
                                                <div className="w-7 h-7 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-xs flex-shrink-0">
                                                    {(demo.studentName || '?')[0].toUpperCase()}
                                                </div>
                                                <span className="font-medium text-gray-800 truncate max-w-[120px]">{demo.studentName}</span>
                                            </div>
                                        </td>
                                        <td className="py-3 pr-4 text-gray-600 text-xs">{demo.studentClass || '—'}</td>
                                        <td className="py-3 pr-4 text-gray-600 text-xs">{demo.branch || '—'}</td>
                                        <td className="py-3 text-center">
                                            <span className="inline-flex items-center gap-1 text-xs font-medium text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-full">
                                                <BookOpen size={10} /> #{demo.lectureNumber}
                                            </span>
                                        </td>
                                        <td className="py-3 text-center">
                                            {demo.attended === true ? (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-[#f0e6f6] px-2 py-0.5 rounded-full">
                                                    <CheckCircle2 size={10} /> Present
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full">
                                                    <Clock size={10} /> Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}

export default Dashboard
