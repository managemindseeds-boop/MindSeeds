import { useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import {
    Users, UserCheck, UserX, Radio, RefreshCw, Search, Download,
    Clock, ChevronRight, LogIn, LogOut, X, Timer
} from 'lucide-react'
import StaffHistory from './StaffHistory'

const staffApi = axios.create({
    baseURL: 'https://staffattendance-api.onrender.com',
    withCredentials: false,
})

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */
const parseTime = (dateStr) => {
    if (!dateStr) return null
    const parts = dateStr.split(', ')
    if (parts.length >= 2) {
        const [hms, ampm] = parts[1].split(' ')
        const [h, m] = hms.split(':')
        return `${h.padStart(2, '0')}:${m} ${(ampm || '').toUpperCase()}`
    }
    return dateStr
}

const toMinutes = (dateStr) => {
    if (!dateStr) return null
    const parts = dateStr.split(', ')
    if (parts.length < 2) return null
    const [hms, ampm] = parts[1].split(' ')
    const [h, m] = hms.split(':')
    let hours = parseInt(h)
    const mins = parseInt(m)
    if ((ampm || '').toLowerCase() === 'pm' && hours !== 12) hours += 12
    if ((ampm || '').toLowerCase() === 'am' && hours === 12) hours = 0
    return hours * 60 + mins
}

/** Sort + get first-in and last-out */
const getFirstLastTimes = (sessions) => {
    if (!sessions || sessions.length === 0) return { firstIn: null, lastOut: null }
    const sorted = [...sessions].sort((a, b) => (toMinutes(a.checkIn) ?? 9999) - (toMinutes(b.checkIn) ?? 9999))
    const firstIn = sorted[0]?.checkIn
    const lastSession = sorted[sorted.length - 1]
    const lastOut = lastSession?.checkOut
    return { firstIn: parseTime(firstIn), lastOut: lastOut ? parseTime(lastOut) : null }
}

const sortSessions = (sessions) => {
    if (!sessions) return []
    return [...sessions].sort((a, b) => (toMinutes(a.checkIn) ?? 9999) - (toMinutes(b.checkIn) ?? 9999))
}

const computeDurationMinutes = (sessions) => {
    if (!sessions) return 0
    return sessions.reduce((acc, s) => {
        const cin = toMinutes(s.checkIn)
        const cout = s.checkOut ? toMinutes(s.checkOut) : null
        if (cin != null && cout != null) return acc + Math.max(0, cout - cin)
        if (cin != null && !cout) {
            const now = new Date()
            return acc + Math.max(0, now.getHours() * 60 + now.getMinutes() - cin)
        }
        return acc
    }, 0)
}

const formatMins = (m) => `${Math.floor(m / 60)}h ${m % 60}m`

/* ═══════════════════════════════════════════════════════════════════
   STAFF CARD — clean, balanced layout
   ═══════════════════════════════════════════════════════════════════ */
function StaffCard({ member, isSelected, onClick }) {
    const sorted = useMemo(() => sortSessions(member.sessions), [member.sessions])
    const { firstIn, lastOut } = getFirstLastTimes(member.sessions)
    const isActive = member.todayStatus === 'active'
    const isPresent = member.todayStatus === 'present'
    const isAbsent = member.todayStatus === 'absent'
    const totalMins = computeDurationMinutes(sorted)

    // Status config
    let accent = '#ef4444' // red
    let statusLabel = 'Absent'
    let statusClasses = 'bg-red-50 text-red-600'
    if (isActive) {
        accent = '#10b981'
        statusLabel = 'Active'
        statusClasses = 'bg-emerald-50 text-emerald-700'
    } else if (isPresent) {
        accent = '#5e3174'
        statusLabel = 'Present'
        statusClasses = 'bg-purple-50 text-[#5e3174]'
    }

    return (
        <div
            onClick={onClick}
            className={`
                bg-white rounded-xl overflow-hidden cursor-pointer transition-all duration-200
                border border-gray-100
                ${isSelected ? 'ring-2 ring-[#5e3174]/40' : 'hover:border-gray-200'}
                ${isAbsent ? 'opacity-55' : ''}
            `}
        >
            {/* ── Top accent bar ── */}
            <div className="h-1" style={{ backgroundColor: accent }} />

            <div className="p-5">
                {/* ── Header: Name + Status ── */}
                <div className="flex items-center justify-between mb-5">
                    <div className="flex items-center gap-3">
                        <div
                            className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ backgroundColor: isAbsent ? '#9ca3af' : '#5e3174' }}
                        >
                            {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                            <h4 className="font-semibold text-sm text-gray-900">{member.name}</h4>
                            <p className="text-[11px] text-gray-400">
                                {member.employeeId} · {(member.branch || []).join(', ')}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1.5">
                        {isActive && (
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
                            </span>
                        )}
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${statusClasses}`}>
                            {statusLabel}
                        </span>
                    </div>
                </div>

                {/* ── Time Summary: 3 clean columns ── */}
                {!isAbsent ? (
                    <div className="grid grid-cols-3 divide-x divide-gray-100 mb-4">
                        <div className="pr-3">
                            <p className="text-[9px] text-gray-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1">
                                <LogIn size={9} className="text-emerald-500" /> First In
                            </p>
                            <p className="text-[15px] font-bold text-gray-900 tabular-nums">{firstIn || '—'}</p>
                        </div>
                        <div className="px-3">
                            <p className="text-[9px] text-gray-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1">
                                <LogOut size={9} className="text-orange-400" /> Last Out
                            </p>
                            <p className="text-[15px] font-bold text-gray-900 tabular-nums">
                                {lastOut || (isActive ? <span className="text-emerald-600 text-xs">In Progress</span> : '—')}
                            </p>
                        </div>
                        <div className="pl-3">
                            <p className="text-[9px] text-gray-400 uppercase font-semibold tracking-wider mb-1 flex items-center gap-1">
                                <Clock size={9} className="text-[#5e3174]" /> Total
                            </p>
                            <p className="text-[15px] font-extrabold text-gray-900 tabular-nums">{formatMins(totalMins)}</p>
                        </div>
                    </div>
                ) : (
                    <div className="text-center py-3 mb-4 text-gray-400 text-sm">
                        No attendance recorded
                    </div>
                )}

                {/* ── Sessions list — clean rows ── */}
                {!isAbsent && sorted.length > 0 && (
                    <div className="space-y-1.5 mb-4">
                        {sorted.map((sess, i) => {
                            const cin = toMinutes(sess.checkIn)
                            const cout = sess.checkOut ? toMinutes(sess.checkOut) : null
                            const dur = cout != null ? cout - cin : null

                            let dotColor = 'bg-gray-300'
                            if (sess.status === 'completed') dotColor = 'bg-emerald-500'
                            else if (sess.status === 'checked-in') dotColor = 'bg-emerald-500 animate-pulse'
                            else if (sess.status === 'auto-closed' || sess.status === 'cron-closed') dotColor = 'bg-amber-400'

                            return (
                                <div key={i} className="flex items-center text-xs text-gray-600 py-1 px-2 rounded bg-gray-50/60">
                                    <span className={`w-1.5 h-1.5 rounded-full ${dotColor} shrink-0 mr-2`} />
                                    <span className="font-medium text-gray-800 tabular-nums">{parseTime(sess.checkIn)}</span>
                                    <span className="mx-1.5 text-gray-300">→</span>
                                    <span className="font-medium text-gray-800 tabular-nums">{sess.checkOut ? parseTime(sess.checkOut) : <span className="text-emerald-600">Now</span>}</span>
                                    {dur != null && <span className="ml-auto text-gray-400 tabular-nums">{dur}m</span>}
                                    {dur == null && <span className="ml-auto text-emerald-500 text-[10px] font-medium">live</span>}
                                </div>
                            )
                        })}
                    </div>
                )}

                {/* ── Footer ── */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <span className="text-[11px] text-gray-400">
                        {sorted.length} session{sorted.length !== 1 ? 's' : ''}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-[#5e3174]">
                        View History <ChevronRight size={12} />
                    </span>
                </div>
            </div>
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════════════════ */
function StaffAttendance() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [branch, setBranch] = useState('')
    const [search, setSearch] = useState('')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedStaff, setSelectedStaff] = useState(null)
    const [panelOpen, setPanelOpen] = useState(false)

    const fetchDashboard = useCallback(async () => {
        setLoading(true)
        try {
            const params = { date }
            if (branch) params.branch = branch
            const res = await staffApi.get('/api/admin/dashboard', { params })
            setData(res.data)
        } catch (err) {
            console.error('Staff attendance dashboard error:', err)
        } finally {
            setLoading(false)
        }
    }, [date, branch])

    useEffect(() => { fetchDashboard() }, [fetchDashboard])
    useEffect(() => {
        const interval = setInterval(fetchDashboard, 30000)
        return () => clearInterval(interval)
    }, [fetchDashboard])

    const stats = data?.stats || {}
    const staffList = data?.staff || []
    const branches = data?.branches || ['Mawaddah', 'E Ward', 'Gordon Hall', 'Aghadi']

    const filtered = staffList.filter(s =>
        s.name?.toLowerCase().includes(search.toLowerCase()) ||
        s.phone?.includes(search) ||
        s.employeeId?.toLowerCase().includes(search.toLowerCase())
    )

    const sorted = useMemo(() => {
        const order = { active: 0, present: 1, absent: 2 }
        return [...filtered].sort((a, b) => (order[a.todayStatus] ?? 9) - (order[b.todayStatus] ?? 9))
    }, [filtered])

    // Computed KPIs
    const earliestArrival = useMemo(() => {
        let earliest = null
        staffList.forEach(s => {
            const ss = sortSessions(s.sessions)
            if (ss[0]?.checkIn) {
                const mins = toMinutes(ss[0].checkIn)
                if (mins != null && (earliest === null || mins < earliest)) earliest = mins
            }
        })
        if (earliest === null) return '—'
        const h = Math.floor(earliest / 60)
        const m = earliest % 60
        const ampm = h >= 12 ? 'PM' : 'AM'
        const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h
        return `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`
    }, [staffList])

    const avgHoursToday = useMemo(() => {
        const presentStaff = staffList.filter(s => s.todayStatus !== 'absent')
        if (presentStaff.length === 0) return '—'
        const totalMins = presentStaff.reduce((a, s) => a + computeDurationMinutes(sortSessions(s.sessions)), 0)
        return formatMins(Math.round(totalMins / presentStaff.length))
    }, [staffList])

    const handleSelectStaff = (member) => {
        setSelectedStaff(member)
        setPanelOpen(true)
    }
    const handleClosePanel = () => {
        setPanelOpen(false)
        setTimeout(() => setSelectedStaff(null), 300)
    }

    // CSV Export
    const handleExportCSV = () => {
        if (!sorted.length) return
        const headers = ['Name', 'Employee ID', 'Phone', 'Branch', 'Status', 'First In', 'Last Out', 'Total Hours', 'Sessions']
        const rows = sorted.map(s => {
            const { firstIn, lastOut } = getFirstLastTimes(s.sessions)
            return [
                s.name, s.employeeId, s.phone, (s.branch || []).join('; '), s.todayStatus,
                firstIn || '—', lastOut || (s.todayStatus === 'active' ? 'In Progress' : '—'),
                s.totalHoursToday || '0h 0m',
                (sortSessions(s.sessions)).map(sess => `${parseTime(sess.checkIn)} - ${sess.checkOut ? parseTime(sess.checkOut) : 'Now'} (${sess.status})`).join(' | '),
            ]
        })
        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url; a.download = `staff-attendance-${date}.csv`; a.click()
        URL.revokeObjectURL(url)
    }

    /* ── SKELETON ── */
    if (loading && !data) {
        return (
            <div className="space-y-6">
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                    {[1, 2, 3, 4, 5].map(i => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl h-24 animate-pulse" />
                    ))}
                </div>
                <div className="bg-white border border-gray-100 rounded-xl h-14 animate-pulse" />
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white border border-gray-100 rounded-xl h-56 animate-pulse" />
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="relative">
            {/* Backdrop when panel open on mobile */}
            {panelOpen && (
                <div className="fixed inset-0 bg-black/20 z-40 lg:hidden" onClick={handleClosePanel} />
            )}

            <div className={`transition-all duration-300 ${panelOpen ? 'lg:mr-[420px]' : ''}`}>
                <div className="space-y-5">

                    {/* ══════════ KPI CARDS ══════════ */}
                    <section className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                        {[
                            { icon: <Users size={18} />, label: 'Total Staff', value: stats.totalStaff ?? '—', sub: `${branches.length} branches`, iconBg: 'bg-purple-50 text-[#5e3174]', valueColor: 'text-gray-900' },
                            { icon: <UserCheck size={18} />, label: 'Present', value: stats.present ?? '—', sub: `First in: ${earliestArrival}`, iconBg: 'bg-emerald-50 text-emerald-600', valueColor: 'text-emerald-700' },
                            { icon: <UserX size={18} />, label: 'Absent', value: stats.absent ?? '—', sub: 'Not checked in', iconBg: 'bg-red-50 text-red-500', valueColor: 'text-red-600' },
                            { icon: <Radio size={18} />, label: 'Active Now', value: stats.activeNow ?? '—', sub: 'Currently working', iconBg: 'bg-emerald-50 text-emerald-600', valueColor: 'text-gray-900', pulse: true },
                            { icon: <Clock size={18} />, label: 'Avg Hours', value: avgHoursToday, sub: 'Per present staff', iconBg: 'bg-amber-50 text-amber-600', valueColor: 'text-gray-900' },
                        ].map((kpi, i) => (
                            <div key={i} className="bg-white border border-gray-100 rounded-xl p-4 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-2">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${kpi.iconBg} relative`}>
                                        {kpi.icon}
                                        {kpi.pulse && (
                                            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
                                                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                                <span className="relative rounded-full h-2.5 w-2.5 bg-emerald-500" />
                                            </span>
                                        )}
                                    </div>
                                    <span className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider">{kpi.label}</span>
                                </div>
                                <p className={`text-xl font-bold ${kpi.valueColor}`}>{kpi.value}</p>
                                <p className="text-[10px] text-gray-400 mt-0.5">{kpi.sub}</p>
                            </div>
                        ))}
                    </section>

                    {/* ══════════ FILTERS ══════════ */}
                    <section className="bg-white border border-gray-100 rounded-xl p-3 flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                            <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider ml-1">Date</label>
                            <input
                                type="date" value={date} onChange={(e) => setDate(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5e3174]/20 focus:border-[#5e3174]/30 transition-all"
                            />
                        </div>
                        <div className="flex flex-col gap-1 flex-1 min-w-[140px]">
                            <label className="text-[9px] font-semibold text-gray-400 uppercase tracking-wider ml-1">Branch</label>
                            <select
                                value={branch} onChange={(e) => setBranch(e.target.value)}
                                className="w-full bg-gray-50 border border-gray-200 rounded-lg text-sm px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#5e3174]/20 focus:border-[#5e3174]/30 transition-all"
                            >
                                <option value="">All Branches</option>
                                {branches.map(b => <option key={b} value={b}>{b}</option>)}
                            </select>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="flex items-center bg-gray-50 border border-gray-200 px-3 py-2 rounded-lg">
                                <Search size={14} className="text-gray-400 mr-2" />
                                <input
                                    type="text" placeholder="Search..." value={search} onChange={(e) => setSearch(e.target.value)}
                                    className="bg-transparent border-none focus:outline-none text-sm w-28"
                                />
                            </div>
                            <button onClick={fetchDashboard} className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:text-[#5e3174] hover:border-[#5e3174]/30 transition-colors cursor-pointer">
                                <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
                            </button>
                            <button onClick={handleExportCSV} title="Export CSV" className="p-2 bg-gray-50 border border-gray-200 rounded-lg text-gray-500 hover:text-[#5e3174] hover:border-[#5e3174]/30 transition-colors cursor-pointer">
                                <Download size={15} />
                            </button>
                        </div>
                    </section>

                    {/* ══════════ STAFF CARDS ══════════ */}
                    <section>
                        <div className="flex items-center justify-between mb-3 px-1">
                            <h3 className="text-base font-bold text-gray-800">Attendance Log</h3>
                            <span className="text-xs text-gray-400">{sorted.length} staff</span>
                        </div>

                        {sorted.length === 0 ? (
                            <div className="bg-white border border-gray-100 rounded-xl flex flex-col items-center justify-center py-16 text-center">
                                <Search size={32} className="text-gray-300 mb-3" />
                                <h4 className="font-semibold text-gray-700">No Staff Found</h4>
                                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                                {sorted.map((member) => (
                                    <StaffCard
                                        key={member.employeeId || member.phone}
                                        member={member}
                                        isSelected={selectedStaff?.phone === member.phone}
                                        onClick={() => handleSelectStaff(member)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>

                    {/* Server timestamp */}
                    {data?.serverTime && (
                        <p className="text-[10px] text-gray-400 text-right">
                            Server: {data.serverTime} · Auto-refresh 30s
                        </p>
                    )}
                </div>
            </div>

            {/* ══════════ SLIDE-IN DETAIL PANEL ══════════ */}
            {panelOpen && selectedStaff && (
                <div
                    className="fixed top-0 right-0 h-full bg-white z-50 overflow-y-auto border-l border-gray-200 w-full sm:w-[420px] animate-slide-in-right"
                >
                    {/* Panel Header */}
                    <div className="sticky top-0 bg-white z-10 px-5 py-4 border-b border-gray-100">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div
                                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: '#5e3174' }}
                                >
                                    {selectedStaff.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                </div>
                                <div>
                                    <h3 className="font-bold text-sm text-gray-900">{selectedStaff.name}</h3>
                                    <p className="text-[10px] text-gray-400">{selectedStaff.employeeId} · {(selectedStaff.branch || []).join(', ')}</p>
                                </div>
                            </div>
                            <button onClick={handleClosePanel} className="p-2 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer">
                                <X size={16} className="text-gray-400" />
                            </button>
                        </div>
                    </div>
                    {/* Panel Body */}
                    <div className="px-5 py-4">
                        <StaffHistory
                            key={selectedStaff.phone + '-' + Date.now()}
                            staff={selectedStaff}
                            onClose={handleClosePanel}
                            isPanel={true}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

export default StaffAttendance
