import { useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import {
    X, ChevronLeft, ChevronRight, Clock,
    CheckCircle2, Timer, BarChart3, CalendarCheck
} from 'lucide-react'

const staffApi = axios.create({
    baseURL: 'https://staffattendance-api.onrender.com',
    withCredentials: false,
})

function StaffHistory({ staff, onClose }) {
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [dailyData, setDailyData] = useState([])
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState({ loaded: 0, total: 0 })
    const cache = useRef({})
    const logRefs = useRef({})
    const containerRef = useRef(null)

    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' })
    const daysInMonth = new Date(year, month, 0).getDate()

    // ── Fetch month — batch of 5 parallel requests at a time ────────────
    const fetchMonth = useCallback(async () => {
        const key = `${year}-${month}`
        if (cache.current[key]) {
            setDailyData(cache.current[key])
            setLoading(false)
            return
        }

        setLoading(true)
        const total = daysInMonth
        setProgress({ loaded: 0, total })

        // Build all date strings
        const allDays = []
        for (let day = 1; day <= total; day++) {
            allDays.push({
                dateStr: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                day,
            })
        }

        const results = new Array(total).fill(null)
        const batchSize = 5
        let loaded = 0

        for (let i = 0; i < allDays.length; i += batchSize) {
            const batch = allDays.slice(i, i + batchSize)
            const promises = batch.map(async ({ dateStr, day }, batchIdx) => {
                const idx = i + batchIdx
                const dateObj = new Date(dateStr)

                if (dateObj > new Date()) {
                    results[idx] = { date: dateStr, day, status: 'future', sessions: [], totalHours: '—' }
                    return
                }

                try {
                    const res = await staffApi.get('/api/admin/dashboard', { params: { date: dateStr } })
                    const staffData = res.data.staff?.find(s => s.phone === staff.phone)
                    if (staffData && staffData.todayStatus !== 'absent') {
                        results[idx] = {
                            date: dateStr, day,
                            status: staffData.todayStatus || 'present',
                            totalHours: staffData.totalHoursToday || '0h 0m',
                            sessions: staffData.sessions || [],
                        }
                    } else {
                        results[idx] = { date: dateStr, day, status: 'absent', sessions: [], totalHours: '0h 0m' }
                    }
                } catch {
                    results[idx] = { date: dateStr, day, status: 'absent', sessions: [], totalHours: '0h 0m' }
                }
            })

            await Promise.all(promises)
            loaded += batch.length
            setProgress({ loaded, total })
            // Update data progressively
            setDailyData([...results.filter(Boolean)])
        }

        cache.current[key] = results
        setDailyData(results)
        setLoading(false)
    }, [year, month, daysInMonth, staff.phone])

    useEffect(() => { fetchMonth() }, [fetchMonth])

    // Scroll into view when opened
    useEffect(() => {
        containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, [])

    // ── Compute summary ─────────────────────────────────────────────────
    const pastDays = dailyData.filter(d => d && d.status !== 'future')
    const presentDays = pastDays.filter(d => d.status === 'present' || d.status === 'active')
    const attendanceRate = pastDays.length > 0 ? Math.round((presentDays.length / pastDays.length) * 100) : 0

    const totalMins = presentDays.reduce((acc, d) => {
        const match = d.totalHours?.match(/(\d+)h\s*(\d+)m/)
        if (match) return acc + (parseInt(match[1]) * 60 + parseInt(match[2]))
        return acc
    }, 0)
    const avgHours = presentDays.length > 0 ? (totalMins / presentDays.length / 60).toFixed(1) : '0'

    // ── Month navigation ────────────────────────────────────────────────
    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (year === now.getFullYear() && month === now.getMonth() + 1) return
        if (month === 12) { setMonth(1); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }

    // ── Calendar grid ───────────────────────────────────────────────────
    const firstDayOfWeek = (new Date(year, month - 1, 1).getDay() + 6) % 7
    const todayStr = now.toISOString().split('T')[0]

    const formatTime = (dateStr) => {
        if (!dateStr) return 'Now'
        const parts = dateStr.split(', ')
        if (parts.length >= 2) {
            const [hms, ampm] = parts[1].split(' ')
            const [h, m] = hms.split(':')
            return `${h.padStart(2, '0')}:${m} ${(ampm || '').toUpperCase()}`
        }
        return dateStr
    }

    const scrollToDay = (dateStr) => {
        logRefs.current[dateStr]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }

    const rateColor = attendanceRate >= 80 ? 'text-emerald-600' : attendanceRate >= 60 ? 'text-amber-600' : 'text-red-600'

    return (
        <div ref={containerRef} className="mt-8 space-y-6 border-t-2 border-[#5e3174]/20 pt-8">
            {/* ── Header bar ── */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-[#310148] font-bold text-base bg-[#f5d9fc]"
                        style={{ fontFamily: 'Manrope, sans-serif', boxShadow: '0 10px 30px rgba(94,49,116,0.05)' }}
                    >
                        {staff.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-extrabold text-lg text-[#310148]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            {staff.name} — Attendance History
                        </h3>
                        <p className="text-xs text-[#4c444e]">
                            {staff.employeeId} · {(staff.branch || []).join(', ')}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    {/* Month Nav */}
                    <div className="flex items-center bg-white rounded-xl p-1" style={{ boxShadow: '0 10px 30px rgba(94,49,116,0.05)' }}>
                        <button onClick={prevMonth} className="p-1.5 hover:bg-[#f3f4f6] rounded-lg text-[#46195c] cursor-pointer">
                            <ChevronLeft size={18} />
                        </button>
                        <span className="px-3 font-bold text-sm text-[#191c1e]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            {monthName} {year}
                        </span>
                        <button
                            onClick={nextMonth}
                            disabled={year === now.getFullYear() && month === now.getMonth() + 1}
                            className="p-1.5 hover:bg-[#f3f4f6] rounded-lg text-[#46195c] cursor-pointer disabled:opacity-30"
                        >
                            <ChevronRight size={18} />
                        </button>
                    </div>
                    {/* Close */}
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-600 transition-colors cursor-pointer"
                    >
                        <X size={18} />
                    </button>
                </div>
            </div>

            {/* ── Loading Progress ── */}
            {loading && (
                <div className="bg-[#f3f4f6] rounded-xl p-1 overflow-hidden">
                    <div className="flex justify-between items-center px-4 py-1.5">
                        <span className="text-[10px] font-medium text-[#4c444e] uppercase tracking-wide">
                            Loading {monthName} {year}...
                        </span>
                        <span className="text-[10px] font-bold text-[#46195c]">
                            {progress.loaded}/{progress.total}
                        </span>
                    </div>
                    <div className="h-1 w-full bg-[#e7e8ea] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-300"
                            style={{
                                width: `${progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0}%`,
                                background: 'linear-gradient(to right, #46195c, #5e3174)',
                            }}
                        />
                    </div>
                </div>
            )}

            {/* ── Summary Stats ── */}
            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] group" style={{ boxShadow: '0 10px 30px rgba(94,49,116,0.05)' }}>
                    <CalendarCheck size={20} className="text-[#46195c]" />
                    <div className="text-right mt-2">
                        <p className="text-[10px] text-[#4c444e] uppercase tracking-widest font-semibold">Presence</p>
                        <p className="font-bold text-2xl text-[#310148]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            {presentDays.length}<span className="text-[#7e747f] text-sm font-medium">/{pastDays.length}</span>
                        </p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] group" style={{ boxShadow: '0 10px 30px rgba(94,49,116,0.05)' }}>
                    <BarChart3 size={20} className="text-emerald-600" />
                    <div className="text-right mt-2">
                        <p className="text-[10px] text-[#4c444e] uppercase tracking-widest font-semibold">Rate</p>
                        <p className={`font-bold text-2xl ${rateColor}`} style={{ fontFamily: 'Manrope, sans-serif' }}>
                            {attendanceRate}%
                        </p>
                    </div>
                </div>
                <div className="bg-white p-5 rounded-2xl flex flex-col justify-between min-h-[110px] group" style={{ boxShadow: '0 10px 30px rgba(94,49,116,0.05)' }}>
                    <Clock size={20} className="text-[#46195c]" />
                    <div className="text-right mt-2">
                        <p className="text-[10px] text-[#4c444e] uppercase tracking-widest font-semibold">Avg Hours</p>
                        <p className="font-bold text-2xl text-[#310148]" style={{ fontFamily: 'Manrope, sans-serif' }}>
                            {avgHours}h
                        </p>
                    </div>
                </div>
            </div>

            {/* ── Calendar Heatmap ── */}
            <div className="bg-[#f3f4f6] p-6 rounded-2xl space-y-4">
                <div className="flex items-center justify-between">
                    <h4 className="font-bold text-sm text-[#310148]" style={{ fontFamily: 'Manrope, sans-serif' }}>Monthly Heatmap</h4>
                    <div className="flex items-center gap-3 text-[10px] font-medium">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" /> Present</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Absent</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#cfc3cf]" /> Upcoming</span>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-y-3 justify-items-center">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                        <div key={d} className="text-[10px] text-[#7e747f] uppercase font-medium">{d}</div>
                    ))}
                    {Array.from({ length: firstDayOfWeek }).map((_, i) => <div key={`e-${i}`} />)}
                    {dailyData.filter(Boolean).map((d) => {
                        const isToday = d.date === todayStr
                        const isPresent = d.status === 'present' || d.status === 'active'
                        const isFuture = d.status === 'future'
                        let bg = 'bg-[#e7e8ea] text-[#cfc3cf]'
                        if (isPresent) bg = 'bg-emerald-500 text-white cursor-pointer hover:scale-110'
                        else if (!isFuture) bg = 'bg-red-500 text-white cursor-pointer hover:scale-110'
                        return (
                            <button
                                key={d.date}
                                onClick={() => !isFuture && scrollToDay(d.date)}
                                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-transform ${bg} ${isToday ? 'ring-3 ring-[#46195c] ring-offset-1 ring-offset-[#f3f4f6]' : ''}`}
                            >
                                {d.day}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* ── Attendance Log ── */}
            <div className="space-y-3">
                <h4 className="font-bold text-sm text-[#310148]" style={{ fontFamily: 'Manrope, sans-serif' }}>Attendance Log</h4>
                {[...dailyData].filter(d => d && d.status !== 'future').reverse().map((d) => {
                    const isPresent = d.status === 'present' || d.status === 'active'
                    const dateLabel = new Date(d.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                    return (
                        <div
                            key={d.date}
                            ref={el => logRefs.current[d.date] = el}
                            className={`bg-white rounded-xl border-l-4 overflow-hidden ${isPresent ? 'border-emerald-500' : 'border-red-500'}`}
                            style={{ boxShadow: '0 10px 30px rgba(94,49,116,0.05)' }}
                        >
                            <div className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 ${!isPresent ? 'opacity-60' : ''}`}>
                                <div className="space-y-1">
                                    <h5 className="font-bold text-sm" style={{ fontFamily: 'Manrope, sans-serif' }}>{dateLabel}</h5>
                                    <div className="flex items-center gap-2">
                                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isPresent ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600'}`}>
                                            {isPresent ? 'Present' : 'Absent'}
                                        </span>
                                        {isPresent && (
                                            <span className="text-[#4c444e] text-xs flex items-center gap-1">
                                                <Timer size={12} /> {d.totalHours}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                {isPresent && d.sessions.length > 0 ? (
                                    <div className="flex flex-wrap gap-2">
                                        {d.sessions.map((sess, i) => (
                                            <div key={i} className="flex items-center gap-4 bg-[#f3f4f6] px-3 py-1.5 rounded-lg">
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-[#7e747f] uppercase font-semibold">In</span>
                                                    <span className="font-bold text-[#310148] text-xs">{formatTime(sess.checkIn)}</span>
                                                </div>
                                                <div className="flex flex-col">
                                                    <span className="text-[9px] text-[#7e747f] uppercase font-semibold">Out</span>
                                                    <span className="font-bold text-[#310148] text-xs">{sess.checkOut ? formatTime(sess.checkOut) : 'Now'}</span>
                                                </div>
                                                <span className="text-[10px] font-medium text-[#46195c]">{sess.duration || '—'}</span>
                                                <CheckCircle2 size={14} className="text-emerald-500" />
                                            </div>
                                        ))}
                                    </div>
                                ) : !isPresent ? (
                                    <span className="text-[#cfc3cf] text-xs italic">No sessions</span>
                                ) : null}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

export default StaffHistory
