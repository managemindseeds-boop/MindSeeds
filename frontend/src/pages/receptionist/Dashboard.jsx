import { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
    Users, CalendarCheck, ClipboardList, IndianRupee,
    UserPlus, CalendarPlus, TrendingUp, AlertCircle,
    Clock, BookOpen, ArrowRight, CheckCircle2
} from 'lucide-react'
import {
    PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend,
    BarChart, Bar, XAxis, YAxis, CartesianGrid
} from 'recharts'
import { useStudents } from '../../context/StudentContext'
import { useDemos } from '../../context/DemoContext'
import { useFees } from '../../context/FeeContext'

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

const todayLabel = () => {
    const now = new Date()
    return now.toLocaleDateString('en-IN', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
    })
}

// ─── Sub-components ──────────────────────────────────────────────────────────

function KpiCard({ label, value, icon: Icon, accentColor, subText, alert }) {
    return (
        <div style={{ borderTop: `3px solid ${accentColor}` }}
            className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex flex-col gap-3 hover:shadow-md transition-shadow duration-200"
        >
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-gray-400">{label}</p>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center"
                    style={{ backgroundColor: `${accentColor}18` }}>
                    <Icon size={18} style={{ color: accentColor }} />
                </div>
            </div>
            <div className="flex items-end justify-between">
                <span className="text-4xl font-bold text-gray-900 leading-none">{value}</span>
                {alert && value > 0 && (
                    <span className="flex items-center gap-1 text-xs font-medium text-rose-500 bg-rose-50 px-2 py-1 rounded-full">
                        <AlertCircle size={12} /> Needs attention
                    </span>
                )}
                {!alert && subText && (
                    <span className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full font-medium">
                        <TrendingUp size={12} /> {subText}
                    </span>
                )}
            </div>
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
    const { monthFees } = useFees()

    // ── Computed KPIs ──────────────────────────────────────────────────────
    const totalStudents = students.length
    const demosToday = todayDemos.length
    const pendingAdmissions = useMemo(
        () => students.filter(s => s.status === 'demo_completed').length,
        [students]
    )
    const overdueFees = useMemo(() => {
        const now = new Date()
        return monthFees.filter(f => f.status === 'pending' && new Date(f.dueDate) < now)
    }, [monthFees])

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
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Good morning 👋</h1>
                    <p className="text-sm text-gray-400 mt-0.5">{todayLabel()}</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => navigate('/receptionist/students/add')}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-white text-sm font-medium rounded-lg hover:bg-gray-700 transition-colors cursor-pointer"
                    >
                        <UserPlus size={15} /> Add Student
                    </button>
                    <button
                        onClick={() => navigate('/receptionist/demos')}
                        className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg hover:bg-indigo-700 transition-colors cursor-pointer"
                    >
                        <CalendarPlus size={15} /> View Demos
                    </button>
                </div>
            </div>

            {/* ── KPI Cards ────────────────────────────────────────────────── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
                    label="Pending Admissions"
                    value={pendingAdmissions}
                    icon={ClipboardList}
                    accentColor="#10b981"
                    alert={pendingAdmissions > 0}
                />
                <KpiCard
                    label="Overdue Fees"
                    value={overdueFees.length}
                    icon={IndianRupee}
                    accentColor="#ef4444"
                    alert={overdueFees.length > 0}
                />
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

            {/* ── Bottom Panels ─────────────────────────────────────────────── */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-5">

                {/* Today's Demo Schedule — wider */}
                <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
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
                                        <tr key={demo.id} className="hover:bg-gray-50 transition-colors">
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
                                                    <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
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

                {/* Overdue Fees — narrower */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
                    <div className="flex items-center justify-between mb-4">
                        <SectionHeader
                            title="Overdue Fees"
                            subtitle={overdueFees.length > 0 ? `${overdueFees.length} pending` : 'All clear'}
                        />
                        <button
                            onClick={() => navigate('/receptionist/fees')}
                            className="flex items-center gap-1 text-xs text-rose-500 hover:text-rose-700 font-medium transition-colors cursor-pointer"
                        >
                            View all <ArrowRight size={12} />
                        </button>
                    </div>

                    {overdueFees.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-10 text-gray-400 gap-2">
                            <CheckCircle2 size={32} className="opacity-30 text-emerald-400" />
                            <p className="text-sm text-emerald-600 font-medium">No overdue fees 🎉</p>
                        </div>
                    ) : (
                        <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
                            {overdueFees.map((fee, idx) => (
                                <div key={fee._id || idx}
                                    className="flex items-center justify-between p-3 rounded-lg bg-rose-50 border border-rose-100 hover:bg-rose-100 transition-colors"
                                >
                                    <div className="flex items-center gap-2">
                                        <div className="w-7 h-7 rounded-full bg-rose-200 flex items-center justify-center text-rose-700 font-semibold text-xs flex-shrink-0">
                                            {(fee.studentName || fee.student?.fullName || '?')[0].toUpperCase()}
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-800 leading-tight">
                                                {fee.studentName || fee.student?.fullName || 'Unknown'}
                                            </p>
                                            <p className="text-xs text-gray-400">
                                                Due: {fee.dueDate ? new Date(fee.dueDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : '—'}
                                            </p>
                                        </div>
                                    </div>
                                    <span className="text-xs font-bold text-rose-600 bg-white px-2 py-1 rounded-md border border-rose-200">
                                        ₹{fee.amount?.toLocaleString('en-IN') || '—'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </div>
        </div>
    )
}

export default Dashboard
