import { useState, useEffect, useCallback } from 'react'
import { useAdmin } from '../../context/AdminContext'
import { BRANCHES } from '../../constants/branches'
import {
    BookOpen, Filter, CheckCircle2, XCircle, Clock, Calendar,
    ChevronDown, User
} from 'lucide-react'

const tabConfig = [
    { key: 'today', label: "Today's Demos", icon: Calendar },
    { key: 'upcoming', label: 'Upcoming', icon: Clock },
    { key: 'absent', label: 'Absent', icon: XCircle },
    { key: 'all', label: 'All Demos', icon: BookOpen },
]

// ── helpers ───────────────────────────────────────────────────────────────────

const IST_OFFSET = 5.5 * 60 * 60 * 1000
const formatDate = (d) => {
    if (!d) return '—'
    const ist = new Date(new Date(d).getTime() + IST_OFFSET)
    return ist.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
}

function groupByStudent(demos) {
    const map = new Map()
    demos.forEach((demo) => {
        const key = `${demo.studentName}||${demo.studentClass}`
        if (!map.has(key)) map.set(key, { studentName: demo.studentName, studentClass: demo.studentClass, branch: demo.branch, demos: [] })
        map.get(key).demos.push(demo)
    })
    return Array.from(map.values())
}

function SummaryBadge({ demos }) {
    const attended = demos.filter(d => d.attended === true).length
    const absent   = demos.filter(d => d.attended === false).length
    const pending  = demos.length - attended - absent
    return (
        <div className="flex items-center gap-1.5 flex-wrap">
            {attended > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-100">
                    <CheckCircle2 size={10} /> {attended} Attended
                </span>
            )}
            {absent > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-100">
                    <XCircle size={10} /> {absent} Absent
                </span>
            )}
            {pending > 0 && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-50 text-gray-600 border border-gray-200">
                    <Clock size={10} /> {pending} Pending
                </span>
            )}
        </div>
    )
}

function StatusBadge({ attended }) {
    if (attended === true)
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700"><CheckCircle2 size={11} /> Attended</span>
    if (attended === false)
        return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-red-50 text-red-700"><XCircle size={11} /> Absent</span>
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-50 text-gray-600"><Clock size={11} /> Pending</span>
}

// ── Shared accordion list (used for both desktop & mobile) ───────────────────

function StudentAccordion({ groups, demosLoading, desktop }) {
    const [openKeys, setOpenKeys] = useState({})
    const toggle = (key) => setOpenKeys(prev => ({ ...prev, [key]: !prev[key] }))

    if (groups.length === 0) {
        if (demosLoading) {
            return (
                <div className="space-y-2">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse flex items-center gap-4">
                            <div className="w-9 h-9 rounded-full bg-gray-200 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-3.5 bg-gray-200 rounded w-36" />
                                <div className="h-2.5 bg-gray-200 rounded w-20" />
                            </div>
                            <div className="h-5 bg-gray-200 rounded-full w-24" />
                        </div>
                    ))}
                </div>
            )
        }
        return (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-gray-400 text-sm">
                No demos found for this filter.
            </div>
        )
    }

    return (
        <div className="space-y-2">
            {groups.map((group) => {
                const key = `${group.studentName}||${group.studentClass}`
                const isOpen = !!openKeys[key]

                return (
                    <div key={key} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                        {/* ── Collapsed header ── */}
                        <button
                            onClick={() => toggle(key)}
                            className="w-full flex items-center gap-3 px-5 py-4 hover:bg-gray-50 active:bg-gray-100 transition-colors text-left"
                        >
                            {/* Avatar */}
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shrink-0">
                                <User size={15} className="text-white" />
                            </div>

                            {/* Name + class + branch */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-gray-900 text-sm truncate">{group.studentName}</p>
                                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                                    <span className="text-xs text-gray-500">{group.studentClass}</span>
                                    {group.branch && (
                                        <span className="inline-block px-2 py-0.5 rounded-md text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-100">{group.branch}</span>
                                    )}
                                </div>
                            </div>

                            {/* Summary badges */}
                            <div className="hidden sm:flex items-center gap-1.5 shrink-0">
                                <SummaryBadge demos={group.demos} />
                            </div>

                            {/* Demo count + chevron */}
                            <div className="flex items-center gap-2 shrink-0 ml-2">
                                <span className="w-6 h-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">
                                    {group.demos.length}
                                </span>
                                <ChevronDown
                                    size={16}
                                    className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                                />
                            </div>
                        </button>

                        {/* Mobile summary badges (shown below header on small screens) */}
                        <div className="sm:hidden px-5 pb-3 flex flex-wrap gap-1.5">
                            <SummaryBadge demos={group.demos} />
                        </div>

                        {/* ── Expanded section ── */}
                        {isOpen && (
                            <div className="border-t border-gray-100">

                                {/* Column headers — appear only when expanded */}
                                <div className="hidden sm:grid grid-cols-[56px_1fr_1.5fr_130px] gap-4 px-5 py-2.5 bg-gray-50 border-b border-gray-100">
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Demo</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Subject</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Scheduled Date</span>
                                    <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide text-right">Status</span>
                                </div>

                                {/* Demo rows */}
                                <div className="divide-y divide-gray-100">
                                    {group.demos.map((demo) => (
                                        <div key={demo._id} className="px-5 py-3">

                                            {/* Desktop row */}
                                            <div className="hidden sm:grid grid-cols-[56px_1fr_1.5fr_130px] items-center gap-4">
                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-gray-700 font-bold text-sm">
                                                    {demo.lectureNumber}
                                                </span>
                                                <span className="text-sm text-gray-700">{demo.subject || '—'}</span>
                                                <span className="text-sm text-gray-700">{formatDate(demo.scheduledDate)}</span>
                                                <span className="flex justify-end">
                                                    <StatusBadge attended={demo.attended} />
                                                </span>
                                            </div>

                                            {/* Mobile row — compact 2-line */}
                                            <div className="sm:hidden flex items-center gap-3 py-1">
                                                {/* Demo number bubble */}
                                                <span className="w-7 h-7 rounded-full bg-gray-100 text-gray-600 font-bold text-xs flex items-center justify-center shrink-0">
                                                    {demo.lectureNumber}
                                                </span>
                                                {/* Subject + date */}
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-sm font-medium text-gray-900 truncate">{demo.subject || '—'}</p>
                                                    <p className="text-xs text-gray-400 mt-0.5">{formatDate(demo.scheduledDate)}</p>
                                                </div>
                                                {/* Status */}
                                                <div className="shrink-0">
                                                    <StatusBadge attended={demo.attended} />
                                                </div>
                                            </div>

                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )
            })}
        </div>
    )
}

// ── Main component ────────────────────────────────────────────────────────────

function AdminDemoOverview() {
    const { demos, demoStats, demosLoading, fetchDemos } = useAdmin()

    const [activeTab, setActiveTab] = useState('today')
    const [branchFilter, setBranchFilter] = useState('all')

    const doFetch = useCallback(() => {
        fetchDemos({ filter: activeTab, branch: branchFilter })
    }, [fetchDemos, activeTab, branchFilter])

    useEffect(() => { doFetch() }, [doFetch])

    useEffect(() => {
        const interval = setInterval(doFetch, 30000)
        return () => clearInterval(interval)
    }, [doFetch])

    const groups = groupByStudent(demos)

    return (
        <div className="space-y-6">

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: 'Today',    value: demoStats.today,    color: 'bg-blue-50 text-blue-700 border-blue-100' },
                    { label: 'Upcoming', value: demoStats.upcoming,  color: 'bg-amber-50 text-amber-700 border-amber-100' },
                    { label: 'Absent',   value: demoStats.absent,    color: 'bg-red-50 text-red-700 border-red-100' },
                    { label: 'Total',    value: demoStats.all,       color: 'bg-gray-50 text-gray-700 border-gray-100' },
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
                        {BRANCHES.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
            </div>

            {/* Accordion list — shared for mobile & desktop */}
            <StudentAccordion groups={groups} demosLoading={demosLoading} />

            {/* Footer count */}
            {groups.length > 0 && (
                <p className="text-sm text-gray-500 px-1">
                    Showing <span className="font-medium text-gray-900">{groups.length}</span> student{groups.length !== 1 ? 's' : ''}{' '}
                    <span className="text-gray-400">({demos.length} demo{demos.length !== 1 ? 's' : ''})</span>
                </p>
            )}
        </div>
    )
}

export default AdminDemoOverview
