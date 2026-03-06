import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemos } from '../../context/DemoContext'
import { Search, SlidersHorizontal, Users, CheckCircle2, Clock, BookOpen, AlertCircle } from 'lucide-react'

// ── Colour palette per avatar ─────────────────────────────────────────────────
const PALETTES = [
    { bg: '#e0e7ff', text: '#4338ca', accent: '#6366f1' },
    { bg: '#d1fae5', text: '#065f46', accent: '#10b981' },
    { bg: '#fef3c7', text: '#92400e', accent: '#f59e0b' },
    { bg: '#fce7f3', text: '#9d174d', accent: '#ec4899' },
    { bg: '#dbeafe', text: '#1e40af', accent: '#3b82f6' },
    { bg: '#ede9fe', text: '#5b21b6', accent: '#8b5cf6' },
]
const getPalette = (name = '') => PALETTES[(name.charCodeAt(0) || 0) % PALETTES.length]

// ── Progress helpers ──────────────────────────────────────────────────────────
const TOTAL = 4
const progressStatus = (done) => {
    if (done >= TOTAL) return 'completed'
    if (done === 0) return 'not_started'
    return 'in_progress'
}
const barColor = (done) => {
    if (done >= TOTAL) return '#10b981'
    if (done >= 2) return '#6366f1'
    return '#f59e0b'
}

// ── Student Card ──────────────────────────────────────────────────────────────
function StudentCard({ demo, isAbsent, onClick }) {
    const done = Math.min(demo.completedLectures ?? demo.lectureNumber ?? 0, TOTAL)
    const pct = Math.round((done / TOTAL) * 100)
    const pal = getPalette(demo.studentName)
    const initial = (demo.studentName || '?')[0].toUpperCase()
    const color = barColor(done)
    const status = progressStatus(done)

    return (
        <div
            onClick={onClick}
            style={{ '--accent': pal.accent }}
            className={`group relative bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-250 cursor-pointer overflow-hidden border ${isAbsent ? 'border-red-300 ring-1 ring-red-200' : 'border-gray-100'
                }`}
        >
            {/* Top colour strip */}
            <div className="h-1.5 w-full" style={{ backgroundColor: pal.accent }} />

            <div className="p-5 flex flex-col items-center gap-4">

                {/* Status pill — top right */}
                <div className="absolute top-4 right-4">
                    {isAbsent ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-red-700 bg-red-50 border border-red-300 px-2 py-0.5 rounded-full">
                            <AlertCircle size={9} /> Absent
                        </span>
                    ) : status === 'completed' ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                            <CheckCircle2 size={9} /> Done
                        </span>
                    ) : status === 'in_progress' ? (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded-full">
                            <Clock size={9} /> Active
                        </span>
                    ) : (
                        <span className="flex items-center gap-1 text-[10px] font-semibold text-gray-500 bg-gray-100 border border-gray-200 px-2 py-0.5 rounded-full">
                            <BookOpen size={9} /> Pending
                        </span>
                    )}
                </div>

                {/* Avatar */}
                <div
                    className="w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold select-none ring-4 ring-white shadow-md group-hover:scale-105 transition-transform duration-200"
                    style={{ backgroundColor: pal.bg, color: pal.text }}
                >
                    {initial}
                </div>

                {/* Name + Class */}
                <div className="w-full flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-gray-900 truncate leading-tight">
                        {demo.studentName}
                    </p>
                    <span
                        className="text-[11px] font-semibold px-2 py-0.5 rounded-full shrink-0 whitespace-nowrap"
                        style={{ backgroundColor: pal.bg, color: pal.text }}
                    >
                        {demo.studentClass ? `Class ${demo.studentClass}` : '—'}
                    </span>
                </div>

                {/* Progress */}
                <div className="w-full">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[11px] text-gray-400 font-medium">Demo Progress</span>
                        <span className="text-[11px] font-bold tabular-nums" style={{ color }}>
                            {done} / {TOTAL}
                        </span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

// ── Filter chip ───────────────────────────────────────────────────────────────
function FilterChip({ label, active, onClick, count }) {
    return (
        <button
            onClick={onClick}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-150 cursor-pointer whitespace-nowrap
                ${active
                    ? 'bg-gray-900 text-white border-gray-900 shadow-sm'
                    : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400 hover:text-gray-900'
                }`}
        >
            {label}
            {count !== undefined && (
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${active ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>
                    {count}
                </span>
            )}
        </button>
    )
}

// ── Main ──────────────────────────────────────────────────────────────────────
function DemoList() {
    const navigate = useNavigate()
    const { todayDemos, upcomingDemos, absentDemos, loading, error, refreshDemos } = useDemos()

    const [search, setSearch] = useState('')
    const [filter, setFilter] = useState('all') // all | in_progress | completed | not_started | absent

    useEffect(() => { refreshDemos() }, [refreshDemos])

    // Set of studentIds who have an absent demo
    const absentIds = useMemo(
        () => new Set(absentDemos.map(d => d.studentId)),
        [absentDemos]
    )

    // Build one entry per student with correct progress:
    // Attended demos are REMOVED from all lists by the backend.
    // So: remaining = count of demos still in any list for this student
    //     completed = TOTAL - remaining
    // This works even when lectures are attended out of order.
    const allStudents = useMemo(() => {
        // Count remaining demos per student
        const remainingCount = new Map() // studentId → count
        const baseDemo = new Map()       // studentId → representative demo object
            ;[...todayDemos, ...upcomingDemos, ...absentDemos].forEach(demo => {
                remainingCount.set(demo.studentId, (remainingCount.get(demo.studentId) || 0) + 1)
                if (!baseDemo.has(demo.studentId)) baseDemo.set(demo.studentId, demo)
            })
        return Array.from(baseDemo.entries()).map(([studentId, demo]) => ({
            ...demo,
            completedLectures: Math.max(0, TOTAL - remainingCount.get(studentId)),
        }))
    }, [todayDemos, upcomingDemos, absentDemos])

    // Stats for the strip
    const stats = useMemo(() => ({
        total: allStudents.length,
        completed: allStudents.filter(d => progressStatus(d.completedLectures) === 'completed').length,
        active: allStudents.filter(d => progressStatus(d.completedLectures) === 'in_progress').length,
        pending: allStudents.filter(d => progressStatus(d.completedLectures) === 'not_started').length,
        absent: absentIds.size,
    }), [allStudents, absentIds])

    // Apply search + filter
    const displayed = useMemo(() => {
        let list = allStudents
        if (search.trim()) {
            const q = search.toLowerCase()
            list = list.filter(d =>
                d.studentName?.toLowerCase().includes(q) ||
                d.studentClass?.toLowerCase().includes(q)
            )
        }
        if (filter === 'absent') {
            list = list.filter(d => absentIds.has(d.studentId))
        } else if (filter !== 'all') {
            list = list.filter(d => progressStatus(d.completedLectures) === filter)
        }
        return list
    }, [allStudents, search, filter, absentIds])

    if (loading && allStudents.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500" />
            </div>
        )
    }

    if (error) {
        return (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
                Error: {error}
            </div>
        )
    }

    return (
        <div className="space-y-5">

            {/* ── Header ───────────────────────────────────────────────── */}
            <div>
                <h1 className="text-xl font-bold text-gray-900">Demo Lectures</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                    {allStudents.length} student{allStudents.length !== 1 ? 's' : ''} in demo pipeline
                </p>
            </div>

            {/* ── Search + Filters bar ──────────────────────────────────── */}
            <div className="flex flex-col sm:flex-row gap-3">

                {/* Search */}
                <div className="relative flex-1">
                    <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Search by name or class…"
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 shadow-sm transition"
                    />
                </div>

                {/* Filter chips */}
                <div className="flex items-center gap-2 overflow-x-auto pb-0.5">
                    <SlidersHorizontal size={14} className="text-gray-400 shrink-0" />
                    <FilterChip label="All" active={filter === 'all'} onClick={() => setFilter('all')} count={stats.total} />
                    <FilterChip label="Active" active={filter === 'in_progress'} onClick={() => setFilter('in_progress')} count={stats.active} />
                    <FilterChip label="Completed" active={filter === 'completed'} onClick={() => setFilter('completed')} count={stats.completed} />
                    <FilterChip label="Pending" active={filter === 'not_started'} onClick={() => setFilter('not_started')} count={stats.pending} />
                    <FilterChip label="Absent" active={filter === 'absent'} onClick={() => setFilter('absent')} count={stats.absent} />
                </div>
            </div>

            {/* ── Cards grid ────────────────────────────────────────────── */}
            {displayed.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 gap-3">
                    <div className="w-14 h-14 rounded-full bg-gray-100 flex items-center justify-center text-2xl">🔍</div>
                    <p className="text-sm font-medium">No students match your search</p>
                    <button
                        onClick={() => { setSearch(''); setFilter('all') }}
                        className="text-xs text-indigo-600 hover:underline cursor-pointer"
                    >
                        Clear filters
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {displayed.map(demo => (
                        <StudentCard
                            key={demo.studentId}
                            demo={demo}
                            isAbsent={absentIds.has(demo.studentId)}
                            onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                        />
                    ))}
                </div>
            )}

        </div>
    )
}

export default DemoList
