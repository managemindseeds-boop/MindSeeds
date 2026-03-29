import { useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { Users, UserCheck, UserX, Radio, RefreshCw, CheckCircle2, XCircle, Search, Download } from 'lucide-react'
import StaffHistory from './StaffHistory'

// Separate axios instance — global axios has withCredentials:true which conflicts with this API's CORS
const staffApi = axios.create({
    baseURL: 'https://staffattendance-api.onrender.com',
    withCredentials: false,
})

function StaffAttendance() {
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [branch, setBranch] = useState('')
    const [search, setSearch] = useState('')
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedStaff, setSelectedStaff] = useState(null)
    const [historyKey, setHistoryKey] = useState(0)

    const handleSelectStaff = (member) => {
        setSelectedStaff(null) // unmount first
        setTimeout(() => {
            setSelectedStaff({ ...member }) // new object reference
            setHistoryKey(k => k + 1)
        }, 50)
    }

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

    // Auto-refresh every 30s
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

    // ── CSV Export ────────────────────────────────────────────────────────
    const handleExportCSV = () => {
        if (!filtered.length) return
        const headers = ['Name', 'Employee ID', 'Phone', 'Branch', 'Status', 'Total Hours', 'Sessions']
        const rows = filtered.map(s => [
            s.name,
            s.employeeId,
            s.phone,
            (s.branch || []).join('; '),
            s.todayStatus,
            s.totalHoursToday,
            (s.sessions || []).map(sess => `${sess.checkIn} - ${sess.checkOut || 'Now'} (${sess.status})`).join(' | '),
        ])
        const csv = [headers.join(','), ...rows.map(r => r.map(v => `"${v}"`).join(','))].join('\n')
        const blob = new Blob([csv], { type: 'text/csv' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `staff-attendance-${date}.csv`
        a.click()
        URL.revokeObjectURL(url)
    }

    // ── Status helpers ───────────────────────────────────────────────────
    const getStatusDot = (status) => {
        if (status === 'active') return 'bg-emerald-500 pulse-active'
        if (status === 'present') return 'bg-[#5e3174]'
        return 'bg-red-500'
    }
    const getStatusLabel = (status) => {
        if (status === 'active') return { text: 'Active', color: 'text-emerald-600' }
        if (status === 'present') return { text: 'Present', color: 'text-[#5e3174]' }
        return { text: 'Absent', color: 'text-red-600' }
    }
    const getSessionChipStyle = (status) => {
        switch (status) {
            case 'completed': return 'bg-emerald-50 border-emerald-100 text-emerald-700'
            case 'checked-in': return 'bg-[#f7d9ff] border-[#5e3174]/10 text-[#5e3174]'
            case 'cron-closed': return 'bg-amber-50 border-amber-100 text-amber-700'
            case 'auto-closed': return 'bg-gray-100 border-gray-200 text-gray-600'
            default: return 'bg-gray-50 border-gray-100 text-gray-500'
        }
    }
    const getSessionStatusLabel = (status) => {
        switch (status) {
            case 'completed': return 'Completed'
            case 'checked-in': return 'Checked-in'
            case 'cron-closed': return 'Cron-closed'
            case 'auto-closed': return 'Auto-closed'
            default: return status
        }
    }
    const formatTime = (dateStr) => {
        if (!dateStr) return 'Now'
        // Input: "29/3/2026, 9:15:00 am" → extract time part
        const parts = dateStr.split(', ')
        if (parts.length >= 2) {
            const time = parts[1]
            // "9:15:00 am" → "09:15 AM"
            const [hms, ampm] = time.split(' ')
            const [h, m] = hms.split(':')
            return `${h.padStart(2, '0')}:${m} ${(ampm || '').toUpperCase()}`
        }
        return dateStr
    }
    const getMobileBorderColor = (status) => {
        if (status === 'active') return 'border-emerald-500'
        if (status === 'present') return 'border-[#5e3174]'
        return 'border-red-400'
    }

    // ── Skeleton ─────────────────────────────────────────────────────────
    if (loading && !data) {
        return (
            <div className="space-y-8">
                {/* KPI Skeletons */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-white p-6 rounded-xl h-32 animate-pulse" style={{ boxShadow: '0 10px 30px rgba(94,49,116,0.05)' }}>
                            <div className="flex justify-between items-start">
                                <div className="w-12 h-12 bg-gray-200 rounded-lg" />
                                <div className="h-3 w-20 bg-gray-200 rounded" />
                            </div>
                            <div className="flex justify-end mt-4">
                                <div className="h-8 w-16 bg-gray-200 rounded" />
                            </div>
                        </div>
                    ))}
                </div>
                {/* Filter Skeleton */}
                <div className="bg-white/70 backdrop-blur-xl p-4 rounded-xl animate-pulse" style={{ boxShadow: '0 10px 30px rgba(94,49,116,0.05)' }}>
                    <div className="flex gap-4">
                        <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
                        <div className="flex-1 h-10 bg-gray-200 rounded-lg" />
                        <div className="w-10 h-10 bg-gray-200 rounded-lg" />
                    </div>
                </div>
                {/* Table Skeleton */}
                <div className="bg-white rounded-xl p-6 space-y-4" style={{ boxShadow: '0 10px 30px rgba(94,49,116,0.05)' }}>
                    <div className="h-5 w-40 bg-gray-200 rounded" />
                    {[1, 2, 3].map(i => (
                        <div key={i} className="flex items-center gap-4 animate-pulse py-4">
                            <div className="w-10 h-10 bg-gray-200 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-32 bg-gray-200 rounded" />
                                <div className="h-3 w-20 bg-gray-100 rounded" />
                            </div>
                            <div className="h-6 w-16 bg-gray-100 rounded-full" />
                            <div className="h-6 w-20 bg-gray-100 rounded" />
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8">
            {/* ── Inline Styles for animations ── */}
            <style>{`
                @keyframes pulse-dot {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(34, 197, 94, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
                }
                .pulse-active { animation: pulse-dot 2s infinite; }
                .ambient-shadow { box-shadow: 0 10px 30px rgba(94, 49, 116, 0.05); }
            `}</style>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* KPI CARDS                                                     */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Staff */}
                <div className="bg-white p-6 rounded-xl ambient-shadow flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-[#f5d9fc] flex items-center justify-center rounded-lg text-[#5e3174]">
                            <Users size={22} />
                        </div>
                        <span className="text-[10px] font-bold text-[#4c444e] uppercase tracking-widest">Total Staff</span>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-extrabold text-[#310148]" style={{ fontFamily: 'Manrope, sans-serif' }}>{stats.totalStaff ?? '—'}</span>
                    </div>
                </div>

                {/* Present */}
                <div className="bg-white p-6 rounded-xl ambient-shadow flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-emerald-100 flex items-center justify-center rounded-lg text-emerald-700">
                            <UserCheck size={22} />
                        </div>
                        <span className="text-[10px] font-bold text-[#4c444e] uppercase tracking-widest">Present</span>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-extrabold text-emerald-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{stats.present ?? '—'}</span>
                    </div>
                </div>

                {/* Absent */}
                <div className="bg-white p-6 rounded-xl ambient-shadow flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-rose-100 flex items-center justify-center rounded-lg text-rose-700">
                            <UserX size={22} />
                        </div>
                        <span className="text-[10px] font-bold text-[#4c444e] uppercase tracking-widest">Absent</span>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-extrabold text-rose-700" style={{ fontFamily: 'Manrope, sans-serif' }}>{stats.absent ?? '—'}</span>
                    </div>
                </div>

                {/* Active Now */}
                <div className="bg-white p-6 rounded-xl ambient-shadow flex flex-col justify-between h-32 hover:-translate-y-1 transition-transform border-b-4 border-emerald-500">
                    <div className="flex justify-between items-start">
                        <div className="w-12 h-12 bg-emerald-50 flex items-center justify-center rounded-lg text-emerald-600 relative">
                            <Radio size={22} />
                            <span className="absolute -top-1 -right-1 w-3 h-3 bg-emerald-500 rounded-full pulse-active" />
                        </div>
                        <span className="text-[10px] font-bold text-[#4c444e] uppercase tracking-widest">Active Now</span>
                    </div>
                    <div className="text-right">
                        <span className="text-3xl font-extrabold text-[#310148]" style={{ fontFamily: 'Manrope, sans-serif' }}>{stats.activeNow ?? '—'}</span>
                    </div>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* FILTER PANEL                                                  */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <section
                className="p-4 rounded-xl ambient-shadow flex flex-wrap items-end gap-4"
                style={{ background: 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)' }}
            >
                <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                    <label className="text-[10px] font-bold text-[#4c444e] uppercase ml-1">Select Date</label>
                    <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full bg-[#f3f4f6] border-none rounded-lg text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5e3174]/20"
                    />
                </div>
                <div className="flex flex-col gap-1 flex-1 min-w-[180px]">
                    <label className="text-[10px] font-bold text-[#4c444e] uppercase ml-1">Filter Branch</label>
                    <select
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        className="w-full bg-[#f3f4f6] border-none rounded-lg text-sm px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#5e3174]/20"
                    >
                        <option value="">All Branches</option>
                        {branches.map(b => <option key={b} value={b}>{b}</option>)}
                    </select>
                </div>
                <div className="flex items-center gap-2">
                    {/* Search */}
                    <div className="hidden sm:flex items-center bg-[#f3f4f6] px-3 py-2 rounded-lg">
                        <Search size={14} className="text-gray-400 mr-2" />
                        <input
                            type="text"
                            placeholder="Search staff..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="bg-transparent border-none focus:outline-none text-sm w-36 text-[#191c1e]"
                        />
                    </div>
                    {/* Refresh */}
                    <button
                        onClick={fetchDashboard}
                        className="bg-[#f3f4f6] p-2.5 rounded-lg text-[#5e3174] hover:bg-[#5e3174] hover:text-white transition-all duration-300 cursor-pointer"
                    >
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                    </button>
                </div>
            </section>

            {/* ══════════════════════════════════════════════════════════════ */}
            {/* ATTENDANCE LOG                                                */}
            {/* ══════════════════════════════════════════════════════════════ */}
            <section className="space-y-4">
                <div className="flex justify-between items-center px-2">
                    <h3 className="text-lg font-bold text-[#310148]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                        Attendance Log
                    </h3>
                    <button
                        onClick={handleExportCSV}
                        className="text-xs font-medium text-[#5e3174] bg-[#f7d9ff] px-3 py-1.5 rounded-full hover:opacity-80 cursor-pointer flex items-center gap-1.5 transition-opacity"
                    >
                        <Download size={12} /> Export CSV
                    </button>
                </div>

                {/* ── Desktop Table ── */}
                <div className="hidden lg:block overflow-hidden bg-white rounded-xl ambient-shadow">
                    {filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-20 text-center">
                            <div className="w-20 h-20 bg-[#f3f4f6] rounded-full flex items-center justify-center text-gray-300 mb-4">
                                <Search size={36} />
                            </div>
                            <h4 className="font-bold text-lg text-[#310148]" style={{ fontFamily: 'Manrope, sans-serif' }}>No Staff Found</h4>
                            <p className="text-[#4c444e] text-sm max-w-xs mt-1">There is no attendance data for the selected date or branch. Try adjusting your filters.</p>
                        </div>
                    ) : (
                        <table className="w-full text-left border-collapse">
                            <thead className="bg-[#f3f4f6]">
                                <tr>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#4c444e] uppercase tracking-wider">Name & ID</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#4c444e] uppercase tracking-wider">Branch</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#4c444e] uppercase tracking-wider text-center">Status</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#4c444e] uppercase tracking-wider text-center">Device</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#4c444e] uppercase tracking-wider">Today's Sessions</th>
                                    <th className="px-6 py-4 text-[10px] font-bold text-[#4c444e] uppercase tracking-wider text-right">Total Hours</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map((member) => {
                                    const status = getStatusLabel(member.todayStatus)
                                    return (
                                        <tr
                                            key={member.employeeId || member.phone}
                                            className={`hover:bg-[#e7e8ea]/30 transition-colors ${member.todayStatus === 'absent' ? 'opacity-60' : ''}`}
                                        >
                                            {/* Name & ID */}
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <div
                                                        className={`w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0 ${member.todayStatus === 'absent' ? 'bg-gray-300 text-gray-500' : ''}`}
                                                        style={member.todayStatus !== 'absent' ? { background: 'linear-gradient(135deg, #46195c 0%, #5e3174 100%)' } : {}}
                                                    >
                                                        {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p
                                                            onClick={() => handleSelectStaff(member)}
                                                            className="font-semibold text-sm text-[#191c1e] hover:text-[#46195c] hover:underline cursor-pointer transition-colors"
                                                        >
                                                            {member.name}
                                                        </p>
                                                        <p className="text-[10px] text-[#4c444e] font-medium">{member.employeeId}</p>
                                                    </div>
                                                </div>
                                            </td>
                                            {/* Branch */}
                                            <td className="px-6 py-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {(member.branch || []).map((b, i) => (
                                                        <span key={i} className="text-xs font-medium bg-gray-100 text-gray-600 px-2 py-1 rounded">{b}</span>
                                                    ))}
                                                </div>
                                            </td>
                                            {/* Status */}
                                            <td className="px-6 py-4 text-center">
                                                <div className="flex items-center justify-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${getStatusDot(member.todayStatus)}`} />
                                                    <span className={`text-xs font-bold ${status.color}`}>{status.text}</span>
                                                </div>
                                            </td>
                                            {/* Device */}
                                            <td className="px-6 py-4 text-center">
                                                {member.deviceRegistered
                                                    ? <CheckCircle2 size={20} className="text-emerald-500 mx-auto" />
                                                    : <XCircle size={20} className="text-gray-300 mx-auto" />
                                                }
                                            </td>
                                            {/* Sessions */}
                                            <td className="px-6 py-4">
                                                {(member.sessions || []).length === 0 ? (
                                                    <span className="text-[10px] italic text-[#4c444e]">No sessions recorded</span>
                                                ) : (
                                                    <div className="flex flex-wrap gap-1.5">
                                                        {member.sessions.map((sess, i) => (
                                                            <div key={i} className={`px-2 py-1 border rounded text-[10px] flex flex-col ${getSessionChipStyle(sess.status)}`}>
                                                                <span className="font-bold">
                                                                    {formatTime(sess.checkIn)} - {sess.checkOut ? formatTime(sess.checkOut) : 'Now'}
                                                                </span>
                                                                <span className="opacity-70">{getSessionStatusLabel(sess.status)}</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </td>
                                            {/* Total Hours */}
                                            <td className="px-6 py-4 text-right">
                                                <span
                                                    className={`font-bold ${member.todayStatus === 'absent' ? 'text-gray-400' : 'text-[#310148]'}`}
                                                    style={{ fontFamily: 'Manrope, sans-serif' }}
                                                >
                                                    {member.totalHoursToday || '0h 0m'}
                                                </span>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                {/* ── Mobile Cards ── */}
                <div className="lg:hidden space-y-4">
                    {filtered.length === 0 ? (
                        <div className="bg-white rounded-xl ambient-shadow flex flex-col items-center justify-center py-16 text-center">
                            <div className="w-16 h-16 bg-[#f3f4f6] rounded-full flex items-center justify-center text-gray-300 mb-3">
                                <Search size={28} />
                            </div>
                            <h4 className="font-bold text-lg text-[#310148]" style={{ fontFamily: 'Manrope, sans-serif' }}>No Staff Found</h4>
                            <p className="text-[#4c444e] text-sm max-w-xs mt-1">No attendance data for this date or branch.</p>
                        </div>
                    ) : (
                        filtered.map((member) => {
                            const status = getStatusLabel(member.todayStatus)
                            const latestSession = member.sessions?.[member.sessions.length - 1]
                            return (
                                <div
                                    key={member.employeeId || member.phone}
                                    className={`bg-white p-5 rounded-xl ambient-shadow border-l-4 ${getMobileBorderColor(member.todayStatus)}`}
                                >
                                    <div className="flex justify-between items-start mb-4">
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-12 h-12 rounded-lg flex items-center justify-center text-white text-sm font-bold shrink-0 ${member.todayStatus === 'absent' ? 'bg-gray-300 text-gray-500' : ''}`}
                                                style={member.todayStatus !== 'absent' ? { background: 'linear-gradient(135deg, #46195c 0%, #5e3174 100%)' } : {}}
                                            >
                                                {member.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                                            </div>
                                            <div>
                                                <h4
                                                    onClick={() => setSelectedStaff(member)}
                                                    className="font-bold text-sm text-[#191c1e] hover:text-[#46195c] hover:underline cursor-pointer transition-colors"
                                                >
                                                    {member.name}
                                                </h4>
                                                <p className="text-[10px] text-[#4c444e]">
                                                    ID: {member.employeeId} • {(member.branch || []).join(', ')}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <div className="flex items-center gap-1.5">
                                                <span className={`w-2 h-2 rounded-full ${getStatusDot(member.todayStatus)}`} />
                                                <span className={`text-[10px] font-bold uppercase ${status.color}`}>{status.text}</span>
                                            </div>
                                            {member.deviceRegistered
                                                ? <CheckCircle2 size={16} className="text-emerald-500" />
                                                : <XCircle size={16} className="text-gray-300" />
                                            }
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs pb-1" style={{ borderBottom: '1px solid #f8f9fb' }}>
                                            <span className="text-[#4c444e] font-medium">Latest Session</span>
                                            {latestSession ? (
                                                <span className={`font-bold ${member.todayStatus === 'active' ? 'text-[#5e3174]' : 'text-amber-700'}`}>
                                                    {formatTime(latestSession.checkIn)} - {latestSession.checkOut ? formatTime(latestSession.checkOut) : 'Now'}
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 italic text-[10px]">No sessions</span>
                                            )}
                                        </div>
                                        <div className="flex justify-between items-center pt-1">
                                            <span className="text-xs text-[#4c444e]">Total Today</span>
                                            <span
                                                className={`font-extrabold ${member.todayStatus === 'absent' ? 'text-gray-400' : 'text-[#310148]'}`}
                                                style={{ fontFamily: 'Manrope, sans-serif' }}
                                            >
                                                {member.totalHoursToday || '0h 0m'}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>

                {/* Server time footer */}
                {data?.serverTime && (
                    <p className="text-[10px] text-[#4c444e] text-right px-2">
                        Server time: {data.serverTime} • Auto-refreshes every 30s
                    </p>
                )}
            </section>

            {/* ── Staff History Overlay ── */}
            {selectedStaff && (
                <StaffHistory
                    key={historyKey}
                    staff={selectedStaff}
                    onClose={() => setSelectedStaff(null)}
                />
            )}
        </div>
    )
}

export default StaffAttendance
