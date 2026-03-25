import { useEffect } from 'react'
import { useAdmin } from '../../context/AdminContext'
import {
    Users, BookOpen, UserCircle, TrendingUp,
    ArrowUpRight, ArrowDownRight, RefreshCw,
    UserPlus, CheckCircle2, XCircle, Clock
} from 'lucide-react'

function AdminDashboard() {
    const { dashboard, dashLoading, fetchDashboard } = useAdmin()

    useEffect(() => {
        fetchDashboard()
    }, [fetchDashboard])

    if (dashLoading && !dashboard) {
        return (
            <div className="space-y-6">
                {/* Skeleton subtitle */}
                <div className="flex items-center justify-between animate-pulse">
                    <div className="h-3 bg-gray-200 rounded w-52" />
                    <div className="h-9 w-20 bg-gray-200 rounded-lg" />
                </div>
                {/* Skeleton KPI cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 animate-pulse">
                            <div className="flex justify-between items-start">
                                <div className="space-y-3 flex-1">
                                    <div className="h-3 bg-gray-200 rounded w-24" />
                                    <div className="h-8 bg-gray-200 rounded w-16" />
                                </div>
                                <div className="w-11 h-11 bg-gray-200 rounded-lg" />
                            </div>
                            <div className="h-2.5 bg-gray-200 rounded w-20 mt-3" />
                        </div>
                    ))}
                </div>
                {/* Skeleton chart sections */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-36 mb-5" />
                        <div className="space-y-4">
                            {[1, 2, 3].map(i => (
                                <div key={i} className="space-y-2">
                                    <div className="flex justify-between">
                                        <div className="h-3 bg-gray-200 rounded w-20" />
                                        <div className="h-3 bg-gray-200 rounded w-24" />
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3">
                                        <div className="h-3 bg-gray-200 rounded-full" style={{ width: `${80 - i * 20}%` }} />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
                        <div className="h-4 bg-gray-200 rounded w-28 mb-5" />
                        <div className="space-y-3">
                            {[1, 2, 3, 4].map(i => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-3 h-3 rounded-full bg-gray-200" />
                                    <div className="flex-1 space-y-1">
                                        <div className="h-2.5 bg-gray-200 rounded w-full" />
                                        <div className="h-2 bg-gray-100 rounded-full" />
                                    </div>
                                    <div className="h-2.5 bg-gray-200 rounded w-8" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        )
    }

    const kpi = dashboard?.kpi || {}
    const statusBreakdown = dashboard?.statusBreakdown || {}
    const demoStats = dashboard?.demoStats || {}
    const branchPerformance = dashboard?.branchPerformance || []
    const recentActivity = dashboard?.recentActivity || {}
    const maxBranchStudents = Math.max(...branchPerformance.map(b => b.students), 1)

    const kpiCards = [
        {
            title: 'Total Students',
            value: kpi.totalStudents ?? '—',
            icon: Users,
            color: 'bg-emerald-500',
            lightColor: 'bg-emerald-50 text-emerald-600',
            sub: `${statusBreakdown.admitted || 0} admitted`,
        },
        {
            title: "Today's Demos",
            value: kpi.todayDemos ?? '—',
            icon: BookOpen,
            color: 'bg-blue-500',
            lightColor: 'bg-blue-50 text-blue-600',
            sub: `${demoStats.pending || 0} pending total`,
        },
        {
            title: 'Staff Members',
            value: kpi.staffCount ?? '—',
            icon: UserCircle,
            color: 'bg-indigo-500',
            lightColor: 'bg-indigo-50 text-indigo-600',
            sub: 'Receptionists',
        },
        {
            title: 'Conversion Rate',
            value: `${kpi.conversionRate ?? 0}%`,
            icon: TrendingUp,
            color: 'bg-purple-500',
            lightColor: 'bg-purple-50 text-purple-600',
            sub: 'Enquiry → Admitted',
            trendUp: (kpi.conversionRate || 0) >= 50,
        },
    ]

    const statusColors = {
        enquiry: 'bg-blue-500',
        demo_scheduled: 'bg-amber-500',
        demo_completed: 'bg-purple-500',
        admitted: 'bg-emerald-500',
    }
    const statusLabels = {
        enquiry: 'Enquiry',
        demo_scheduled: 'Demo Scheduled',
        demo_completed: 'Demo Completed',
        admitted: 'Admitted',
    }

    const totalForFunnel = Object.values(statusBreakdown).reduce((a, b) => a + b, 0) || 1

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <p className="text-sm text-gray-500">
                    Real-time metrics across all branches
                    {dashLoading && <span className="ml-2 text-blue-500 text-xs">(refreshing...)</span>}
                </p>
                <button
                    onClick={fetchDashboard}
                    className="flex items-center gap-2 px-3 py-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 transition-colors text-sm cursor-pointer shadow-sm"
                >
                    <RefreshCw size={14} className={dashLoading ? 'animate-spin' : ''} />
                    Refresh
                </button>
            </div>

            {/* KPI Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                {kpiCards.map((kpi, idx) => (
                    <div key={idx} className="bg-white rounded-xl shadow-sm border border-gray-100 p-5 flex flex-col">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500">{kpi.title}</p>
                                <h3 className="text-3xl font-bold text-gray-900 mt-2">{kpi.value}</h3>
                            </div>
                            <div className={`p-3 rounded-lg ${kpi.lightColor}`}>
                                <kpi.icon size={22} />
                            </div>
                        </div>
                        <div className="mt-3 flex items-center gap-2">
                            {kpi.trendUp !== undefined && (
                                <span className={`flex items-center text-xs font-medium ${kpi.trendUp ? 'text-emerald-600' : 'text-amber-600'}`}>
                                    {kpi.trendUp ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
                                </span>
                            )}
                            <span className="text-xs text-gray-400">{kpi.sub}</span>
                        </div>
                    </div>
                ))}
            </div>

            {/* Middle Row: Branch Performance + Student Journey */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Branch Performance */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Branch Performance</h2>
                    {branchPerformance.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-8">No branch data available</p>
                    ) : (
                        <div className="space-y-4">
                            {branchPerformance.map((branch, idx) => (
                                <div key={idx}>
                                    <div className="flex justify-between items-center mb-1.5">
                                        <span className="text-sm font-medium text-gray-700">{branch.branch}</span>
                                        <span className="text-sm font-bold text-gray-900">{branch.students} students</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-3 rounded-full transition-all duration-500"
                                            style={{ width: `${(branch.students / maxBranchStudents) * 100}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Student Journey Funnel */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Student Journey</h2>
                    <div className="space-y-3">
                        {Object.entries(statusBreakdown).map(([status, count]) => {
                            const pct = Math.round((count / totalForFunnel) * 100)
                            return (
                                <div key={status} className="flex items-center gap-3">
                                    <span className={`w-3 h-3 rounded-full flex-shrink-0 ${statusColors[status] || 'bg-gray-300'}`} />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-gray-600 truncate">{statusLabels[status] || status}</span>
                                            <span className="font-semibold text-gray-900 ml-2">{count}</span>
                                        </div>
                                        <div className="w-full bg-gray-100 rounded-full h-2">
                                            <div
                                                className={`h-2 rounded-full ${statusColors[status] || 'bg-gray-400'} transition-all duration-500`}
                                                style={{ width: `${pct}%` }}
                                            />
                                        </div>
                                    </div>
                                    <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
                                </div>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Demo Stats + Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Demo Status Overview */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Demo Status</h2>
                    <div className="space-y-4">
                        {[
                            { label: 'Pending', value: demoStats.pending, icon: Clock, color: 'text-amber-600 bg-amber-50' },
                            { label: 'Completed', value: demoStats.completed, icon: CheckCircle2, color: 'text-emerald-600 bg-emerald-50' },
                            { label: 'Absent', value: demoStats.absent, icon: XCircle, color: 'text-red-600 bg-red-50' },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                                <div className="flex items-center gap-3">
                                    <div className={`p-2 rounded-lg ${item.color}`}>
                                        <item.icon size={18} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                </div>
                                <span className="text-xl font-bold text-gray-900">{item.value ?? 0}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 lg:col-span-2">
                    <h2 className="text-lg font-bold text-gray-900 mb-5">Recent Activity</h2>
                    <div className="space-y-3 max-h-80 overflow-y-auto">
                        {/* Recent Registrations */}
                        {(recentActivity.students || []).map((s, i) => (
                            <div key={`s-${i}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className="p-2 bg-blue-50 rounded-lg text-blue-600">
                                    <UserPlus size={16} />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{s.fullName}</p>
                                    <p className="text-xs text-gray-500">{s.branch} · {s.class}</p>
                                </div>
                                <div className="text-right flex-shrink-0">
                                    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[s.status] ? statusColors[s.status].replace('bg-', 'bg-opacity-10 text-').replace('500', '700') : 'bg-gray-100 text-gray-600'}`}>
                                        {statusLabels[s.status] || s.status}
                                    </span>
                                    <p className="text-xs text-gray-400 mt-0.5">
                                        {new Date(s.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                                    </p>
                                </div>
                            </div>
                        ))}
                        {/* Recent Demo Activity */}
                        {(recentActivity.demos || []).map((d, i) => (
                            <div key={`d-${i}`} className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 transition-colors">
                                <div className={`p-2 rounded-lg ${d.attended ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                    {d.attended ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 truncate">{d.studentName}</p>
                                    <p className="text-xs text-gray-500">Demo #{d.lectureNumber} · {d.branch}</p>
                                </div>
                                <span className={`text-xs font-medium ${d.attended ? 'text-emerald-600' : 'text-red-600'}`}>
                                    {d.attended ? 'Attended' : 'Absent'}
                                </span>
                            </div>
                        ))}
                        {(!recentActivity.students?.length && !recentActivity.demos?.length) && (
                            <p className="text-sm text-gray-400 text-center py-8">No recent activity</p>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AdminDashboard
