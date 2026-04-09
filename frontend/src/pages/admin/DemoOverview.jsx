import { useState, useEffect, useCallback } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { BRANCHES } from '../../constants/branches'
import { BookOpen, Filter, RefreshCw, CheckCircle2, XCircle, Clock, Calendar } from 'lucide-react'

const tabConfig = [
    { key: 'today', label: "Today's Demos", icon: Calendar },
    { key: 'upcoming', label: 'Upcoming', icon: Clock },
    { key: 'absent', label: 'Absent', icon: XCircle },
    { key: 'all', label: 'All Demos', icon: BookOpen },
]

function AdminDemoOverview() {
    const { demos, demoStats, demosLoading, fetchDemos } = useAdmin()

    const [activeTab, setActiveTab] = useState('today')
    const [branchFilter, setBranchFilter] = useState('all')

    const doFetch = useCallback(() => {
        fetchDemos({ filter: activeTab, branch: branchFilter })
    }, [fetchDemos, activeTab, branchFilter])

    useEffect(() => {
        doFetch()
    }, [doFetch])

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(doFetch, 30000)
        return () => clearInterval(interval)
    }, [doFetch])

    // Extract unique branches from demos
    // Use official branches for filter dropdown
    const officialBranches = BRANCHES

    // IST date formatter
    const IST_OFFSET = 5.5 * 60 * 60 * 1000
    const formatDate = (d) => {
        if (!d) return '—'
        const ist = new Date(new Date(d).getTime() + IST_OFFSET)
        return ist.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Today", value: demoStats.today, color: 'bg-blue-50 text-blue-700 border-blue-100' },
                    { label: 'Upcoming', value: demoStats.upcoming, color: 'bg-amber-50 text-amber-700 border-amber-100' },
                    { label: 'Absent', value: demoStats.absent, color: 'bg-red-50 text-red-700 border-red-100' },
                    { label: 'Total', value: demoStats.all, color: 'bg-gray-50 text-gray-700 border-gray-100' },
                ].map((stat) => (
                    <div key={stat.label} className={`rounded-xl border p-4 ${stat.color}`}>
                        <p className="text-sm font-medium opacity-80">{stat.label}</p>
                        <p className="text-2xl font-bold mt-1">{stat.value ?? 0}</p>
                    </div>
                ))}
            </div>

            {/* Tabs + Branch Filter */}
            <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="flex bg-white rounded-lg border border-gray-200 p-1 overflow-x-auto">
                    {tabConfig.map(({ key, label, icon: Icon }) => (
                        <button
                            key={key}
                            onClick={() => setActiveTab(key)}
                            className={`flex items-center gap-1.5 px-4 py-2 rounded-md text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                                activeTab === key
                                    ? 'bg-blue-600 text-white shadow-sm'
                                    : 'text-gray-600 hover:bg-gray-50'
                            }`}
                        >
                            <Icon size={14} />
                            {label}
                            {demoStats[key] !== undefined && (
                                <span className={`ml-1 px-1.5 py-0.5 rounded-full text-xs ${
                                    activeTab === key ? 'bg-blue-500 text-white' : 'bg-gray-100 text-gray-600'
                                }`}>
                                    {demoStats[key]}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                <div className="relative sm:w-48 sm:ml-auto">
                    <Filter size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <select
                        value={branchFilter}
                        onChange={(e) => setBranchFilter(e.target.value)}
                        className="w-full pl-10 pr-8 py-2 bg-white border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none cursor-pointer shadow-sm"
                    >
                        <option value="all">All Branches</option>
                        {officialBranches.map(b => (
                            <option key={b} value={b}>{b}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Demos Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Student</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Branch</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Demo #</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Subject</th>
                                <th className="text-left px-6 py-4 font-semibold text-gray-700">Scheduled Date</th>
                                <th className="text-center px-6 py-4 font-semibold text-gray-700">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {demos.length === 0 ? (
                                demosLoading ? (
                                    // Skeleton loading rows
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i} className="animate-pulse">
                                            <td className="px-6 py-4"><div className="space-y-1.5"><div className="h-3.5 bg-gray-200 rounded w-28" /><div className="h-2.5 bg-gray-200 rounded w-16" /></div></td>
                                            <td className="px-6 py-4"><div className="h-5 bg-gray-200 rounded-md w-20" /></td>
                                            <td className="px-6 py-4 text-center"><div className="h-8 w-8 bg-gray-200 rounded-full mx-auto" /></td>
                                            <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-20" /></td>
                                            <td className="px-6 py-4"><div className="h-3.5 bg-gray-200 rounded w-24" /></td>
                                            <td className="px-6 py-4 text-center"><div className="h-5 bg-gray-200 rounded-full w-20 mx-auto" /></td>
                                        </tr>
                                    ))
                                ) : (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-10 text-center text-gray-400">
                                            No demos found for this filter.
                                        </td>
                                    </tr>
                                )
                            ) : (
                                demos.map((demo) => (
                                    <tr key={demo._id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div>
                                                <p className="font-semibold text-gray-900">{demo.studentName}</p>
                                                <p className="text-xs text-gray-500">{demo.studentClass}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-block px-2 py-0.5 rounded-md text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                                                {demo.branch}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-sm">
                                                {demo.lectureNumber}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-700">{demo.subject || '—'}</td>
                                        <td className="px-6 py-4 text-gray-700">{formatDate(demo.scheduledDate)}</td>
                                        <td className="px-6 py-4 text-center">
                                            {demo.attended === true ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-[#f0e6f6] text-emerald-700">
                                                    <CheckCircle2 size={12} /> Attended
                                                </span>
                                            ) : demo.attended === false ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                                    <XCircle size={12} /> Absent
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600">
                                                    <Clock size={12} /> Pending
                                                </span>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 text-sm text-gray-500">
                    Showing <span className="font-medium text-gray-900">{demos.length}</span> demos
                </div>
            </div>
        </div>
    )
}

export default AdminDemoOverview
