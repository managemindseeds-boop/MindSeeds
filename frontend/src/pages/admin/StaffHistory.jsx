import { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import axios from 'axios'
import {
    ChevronLeft, ChevronRight, Clock,
    Timer, BarChart3, CalendarCheck,
    ArrowRight, Briefcase
} from 'lucide-react'

const staffApi = axios.create({
    baseURL: 'https://staffattendance-api.onrender.com',
    withCredentials: false,
})

/* ═══════════════════════════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════════════════════════ */
const fmtTime = (s) => {
    if (!s) return 'Now'
    const p = s.split(', ')
    if (p.length >= 2) {
        const [hms, ap] = p[1].split(' ')
        const [h, m] = hms.split(':')
        return `${h.padStart(2, '0')}:${m} ${(ap || '').toUpperCase()}`
    }
    return s
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

/* ═══════════════════════════════════════════════════════════════════
   DAY DETAIL — vertical session list for a selected day
   ═══════════════════════════════════════════════════════════════════ */
function DayTimeline({ sessions }) {
    if (!sessions || sessions.length === 0) return null

    const sorted = [...sessions].sort((a, b) => (toMinutes(a.checkIn) ?? 9999) - (toMinutes(b.checkIn) ?? 9999))

    return (
        <div className="space-y-2">
            {sorted.map((sess, i) => {
                const cin = toMinutes(sess.checkIn)
                const cout = sess.checkOut ? toMinutes(sess.checkOut) : null
                const dur = cout != null ? cout - cin : null
                const nowMin = new Date().getHours() * 60 + new Date().getMinutes()
                const liveDur = !cout && cin ? nowMin - cin : null

                let statusLabel = sess.status
                let statusColor = 'text-gray-500'
                if (sess.status === 'completed') { statusLabel = 'Completed'; statusColor = 'text-emerald-600' }
                else if (sess.status === 'checked-in') { statusLabel = 'Live'; statusColor = 'text-emerald-600' }
                else if (sess.status === 'cron-closed') { statusLabel = 'Cron-closed'; statusColor = 'text-amber-600' }
                else if (sess.status === 'auto-closed') { statusLabel = 'Auto-closed'; statusColor = 'text-gray-500' }

                let dotColor = 'bg-gray-300'
                if (sess.status === 'completed') dotColor = 'bg-emerald-500'
                else if (sess.status === 'checked-in') dotColor = 'bg-emerald-500'
                else if (sess.status === 'auto-closed' || sess.status === 'cron-closed') dotColor = 'bg-amber-400'

                return (
                    <div key={i} className="flex items-start gap-3">
                        {/* Timeline dot + line */}
                        <div className="flex flex-col items-center pt-1.5">
                            <div className={`w-2 h-2 rounded-full ${dotColor}`} />
                            {i < sorted.length - 1 && <div className="w-px flex-1 bg-gray-200 mt-1" />}
                        </div>

                        {/* Session content */}
                        <div className="flex-1 pb-3 border-b border-gray-50 last:border-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <span className="text-xs font-semibold text-gray-800">Session {i + 1}</span>
                                <span className={`text-[10px] font-semibold ${statusColor}`}>{statusLabel}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-sm">
                                <span className="font-medium text-gray-700 tabular-nums">{fmtTime(sess.checkIn)}</span>
                                <ArrowRight size={10} className="text-gray-300" />
                                <span className="font-medium text-gray-700 tabular-nums">{sess.checkOut ? fmtTime(sess.checkOut) : <span className="text-emerald-600 font-semibold">Now</span>}</span>
                                {dur != null && (
                                    <span className="ml-auto text-[11px] text-gray-400 tabular-nums flex items-center gap-0.5"><Timer size={10} />{Math.floor(dur / 60)}h {dur % 60}m</span>
                                )}
                                {liveDur != null && liveDur > 0 && (
                                    <span className="ml-auto text-[11px] text-emerald-600 tabular-nums flex items-center gap-0.5"><Timer size={10} />{Math.floor(liveDur / 60)}h {liveDur % 60}m</span>
                                )}
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   WEEKLY HOURS CHART
   ═══════════════════════════════════════════════════════════════════ */
function WeeklyHoursChart({ dailyData }) {
    const week = dailyData
        .filter(d => d.status !== 'future' && d.status !== 'loading')
        .slice(-7)
        .reverse()

    if (week.length === 0) return null

    const maxMins = Math.max(...week.map(d => {
        const m = d.totalHours?.match(/(\d+)h\s*(\d+)m/)
        return m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0
    }), 60)

    return (
        <div className="space-y-1.5">
            {week.map(d => {
                const label = new Date(d.date).toLocaleDateString('en-US', { weekday: 'short', day: 'numeric' })
                const m = d.totalHours?.match(/(\d+)h\s*(\d+)m/)
                const mins = m ? parseInt(m[1]) * 60 + parseInt(m[2]) : 0
                const pct = (mins / maxMins) * 100
                const isPresent = d.status === 'present' || d.status === 'active'

                return (
                    <div key={d.date} className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-500 font-medium w-14 shrink-0 text-right">{label}</span>
                        <div className="flex-1 h-3.5 bg-gray-100 rounded overflow-hidden">
                            {isPresent && mins > 0 && (
                                <div
                                    className="h-full rounded bg-[#5e3174] transition-all duration-500 flex items-center justify-end pr-1"
                                    style={{ width: `${Math.max(pct, 10)}%` }}
                                >
                                    <span className="text-[8px] text-white font-semibold">{d.totalHours}</span>
                                </div>
                            )}
                        </div>
                        {!isPresent && <span className="text-[9px] text-red-400 font-semibold">A</span>}
                    </div>
                )
            })}
        </div>
    )
}

/* ═══════════════════════════════════════════════════════════════════
   MAIN — STAFF HISTORY PANEL
   ═══════════════════════════════════════════════════════════════════ */
function StaffHistory({ staff, onClose, isPanel = false }) {
    const now = new Date()
    const [year, setYear] = useState(now.getFullYear())
    const [month, setMonth] = useState(now.getMonth() + 1)
    const [dailyData, setDailyData] = useState([])
    const [loading, setLoading] = useState(true)
    const [progress, setProgress] = useState({ loaded: 0, total: 0 })
    const [selectedDay, setSelectedDay] = useState(null)
    const cache = useRef({})
    const abortRef = useRef(null)

    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' })
    const daysInMonth = new Date(year, month, 0).getDate()

    // Fetch month
    const fetchMonth = useCallback(async () => {
        const key = `${year}-${month}`
        if (cache.current[key]) { setDailyData(cache.current[key]); setLoading(false); return }
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller
        setLoading(true); setDailyData([])
        const total = daysInMonth
        setProgress({ loaded: 0, total })

        const results = []
        for (let day = 1; day <= total; day++) {
            results.push({ date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`, day, status: 'loading', sessions: [], totalHours: '—' })
        }

        const fetchDay = async (idx) => {
            if (controller.signal.aborted) return
            const d = results[idx]
            if (new Date(d.date) > now) { results[idx] = { ...d, status: 'future' }; return }
            try {
                const res = await staffApi.get('/api/admin/dashboard', { params: { date: d.date }, signal: controller.signal })
                const staffData = res.data.staff?.find(s => s.phone === staff.phone)
                if (staffData && staffData.todayStatus !== 'absent') {
                    results[idx] = { ...d, status: staffData.todayStatus || 'present', totalHours: staffData.totalHoursToday || '0h 0m', sessions: staffData.sessions || [] }
                } else {
                    results[idx] = { ...d, status: 'absent', totalHours: '0h 0m' }
                }
            } catch (err) {
                if (err?.name === 'CanceledError' || err?.name === 'AbortError') return
                results[idx] = { ...d, status: 'absent', totalHours: '0h 0m' }
            }
        }

        const batchSize = 6
        for (let i = 0; i < total; i += batchSize) {
            if (controller.signal.aborted) return
            const batch = []
            for (let j = i; j < Math.min(i + batchSize, total); j++) batch.push(fetchDay(j))
            await Promise.all(batch)
            if (controller.signal.aborted) return
            setProgress({ loaded: Math.min(i + batchSize, total), total })
            setDailyData([...results])
        }
        if (!controller.signal.aborted) { cache.current[key] = [...results]; setLoading(false) }
    }, [year, month, daysInMonth, staff.phone])

    useEffect(() => {
        fetchMonth()
        return () => { if (abortRef.current) abortRef.current.abort() }
    }, [fetchMonth])

    // Auto-select today
    useEffect(() => {
        if (!loading && dailyData.length > 0 && !selectedDay) {
            const todayStr = now.toISOString().split('T')[0]
            const today = dailyData.find(d => d.date === todayStr && d.status !== 'future' && d.status !== 'loading')
            if (today) setSelectedDay(today)
        }
    }, [loading, dailyData])

    // Stats
    const loaded = dailyData.filter(d => d.status !== 'loading' && d.status !== 'future')
    const present = loaded.filter(d => d.status === 'present' || d.status === 'active')
    const rate = loaded.length > 0 ? Math.round((present.length / loaded.length) * 100) : 0
    const totalMins = present.reduce((acc, d) => {
        const m = d.totalHours?.match(/(\d+)h\s*(\d+)m/)
        return m ? acc + parseInt(m[1]) * 60 + parseInt(m[2]) : acc
    }, 0)
    const avgH = present.length > 0 ? (totalMins / present.length / 60).toFixed(1) : '0'

    // Month nav
    const prevMonth = () => { setSelectedDay(null); if (month === 1) { setMonth(12); setYear(y => y - 1) } else setMonth(m => m - 1) }
    const nextMonth = () => { if (year === now.getFullYear() && month === now.getMonth() + 1) return; setSelectedDay(null); if (month === 12) { setMonth(1); setYear(y => y + 1) } else setMonth(m => m + 1) }

    // Calendar
    const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7
    const todayStr = now.toISOString().split('T')[0]
    const rc = rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'

    const handleDayClick = (d) => {
        if (d.status === 'future' || d.status === 'loading') return
        setSelectedDay(d.date === selectedDay?.date ? null : d)
    }

    return (
        <div className="space-y-4">
            {/* Month Navigator */}
            <div className="flex items-center justify-center gap-2">
                <button onClick={prevMonth} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors">
                    <ChevronLeft size={16} className="text-gray-500" />
                </button>
                <span className="px-3 py-1 bg-gray-50 rounded-lg font-bold text-sm text-gray-800 min-w-[130px] text-center border border-gray-100">
                    {monthName} {year}
                </span>
                <button onClick={nextMonth} disabled={year === now.getFullYear() && month === now.getMonth() + 1} className="p-1.5 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors disabled:opacity-30">
                    <ChevronRight size={16} className="text-gray-500" />
                </button>
            </div>

            {/* Loading */}
            {loading && (
                <div className="bg-gray-50 rounded-lg p-2.5 border border-gray-100">
                    <div className="flex justify-between items-center mb-1.5">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold">Loading...</span>
                        <span className="text-[10px] font-bold text-[#5e3174]">{progress.loaded}/{progress.total}</span>
                    </div>
                    <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-[#5e3174] transition-all duration-500 ease-out" style={{ width: `${progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0}%` }} />
                    </div>
                </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-3 gap-2">
                {[
                    { icon: <CalendarCheck size={14} className="text-[#5e3174]" />, label: 'Present', value: `${present.length}/${loaded.length}`, color: 'text-gray-900' },
                    { icon: <BarChart3 size={14} className="text-emerald-600" />, label: 'Rate', value: `${rate}%`, color: rc },
                    { icon: <Clock size={14} className="text-amber-600" />, label: 'Avg Hrs', value: `${avgH}h`, color: 'text-gray-900' },
                ].map((c, i) => (
                    <div key={i} className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 text-center">
                        <div className="flex justify-center mb-1">{c.icon}</div>
                        <p className={`font-bold text-lg ${c.color}`}>{c.value}</p>
                        <p className="text-[8px] text-gray-400 uppercase tracking-wider font-semibold">{c.label}</p>
                    </div>
                ))}
            </div>

            {/* Calendar */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                <div className="flex justify-between items-center mb-2.5">
                    <h4 className="font-semibold text-xs text-gray-700">Calendar</h4>
                    <div className="flex gap-2.5 text-[8px] font-bold text-gray-400">
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-emerald-500" />P</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-red-500" />A</span>
                        <span className="flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-sm bg-gray-300" />—</span>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-1 justify-items-center">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                        <div key={d} className="text-[8px] text-gray-400 uppercase font-bold py-0.5">{d}</div>
                    ))}
                    {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                    {dailyData.map(d => {
                        if (!d) return null
                        const p = d.status === 'present' || d.status === 'active'
                        const f = d.status === 'future'
                        const l = d.status === 'loading'
                        const t = d.date === todayStr
                        const sel = selectedDay?.date === d.date

                        let cls = 'bg-gray-200 text-gray-400'
                        if (l) cls = 'bg-gray-100 text-gray-300 animate-pulse'
                        else if (p) cls = 'bg-emerald-500 text-white hover:bg-emerald-600'
                        else if (!f) cls = 'bg-red-400 text-white hover:bg-red-500'

                        return (
                            <button
                                key={d.date}
                                onClick={() => handleDayClick(d)}
                                className={`
                                    w-7 h-7 rounded-lg flex items-center justify-center text-[10px] font-bold
                                    transition-all duration-150 cursor-pointer
                                    ${cls}
                                    ${t ? 'ring-2 ring-[#5e3174] ring-offset-1 ring-offset-gray-50' : ''}
                                    ${sel ? 'ring-2 ring-amber-400 ring-offset-1 ring-offset-gray-50 scale-110' : ''}
                                    ${f || l ? 'cursor-default' : ''}
                                `}
                            >
                                {d.day}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Selected Day Detail */}
            {selectedDay && (
                <div className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                        <h4 className="font-semibold text-xs text-gray-800">
                            {new Date(selectedDay.date).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                        </h4>
                        <div className="flex items-center gap-2">
                            {(selectedDay.status === 'present' || selectedDay.status === 'active') ? (
                                <>
                                    <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">Present</span>
                                    <span className="text-[10px] font-semibold text-gray-500 flex items-center gap-0.5"><Timer size={10} />{selectedDay.totalHours}</span>
                                </>
                            ) : (
                                <span className="text-[9px] font-bold text-red-600 bg-red-50 px-1.5 py-0.5 rounded">Absent</span>
                            )}
                        </div>
                    </div>
                    {selectedDay.sessions?.length > 0 ? (
                        <DayTimeline sessions={selectedDay.sessions} />
                    ) : (
                        <p className="text-xs text-gray-400 text-center py-3">No sessions</p>
                    )}
                </div>
            )}

            {/* Weekly Hours */}
            {!loading && dailyData.length > 0 && (
                <div className="bg-gray-50 border border-gray-100 rounded-xl p-3.5">
                    <h4 className="font-semibold text-xs text-gray-700 mb-2.5 flex items-center gap-1.5">
                        <BarChart3 size={12} className="text-[#5e3174]" />
                        Recent Days
                    </h4>
                    <WeeklyHoursChart dailyData={dailyData} />
                </div>
            )}

            {/* Daily Log */}
            <div>
                <h4 className="font-semibold text-xs text-gray-700 mb-2 flex items-center gap-1.5">
                    <Briefcase size={12} className="text-[#5e3174]" />
                    Daily Log
                </h4>
                <div className="space-y-1 max-h-[350px] overflow-y-auto pr-1" style={{ scrollbarWidth: 'thin', scrollbarColor: '#e5e7eb transparent' }}>
                    {[...dailyData].filter(d => d && d.status !== 'future' && d.status !== 'loading').reverse().map(d => {
                        const p = d.status === 'present' || d.status === 'active'
                        const lbl = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', weekday: 'short' })
                        const isSelectedDay = selectedDay?.date === d.date

                        return (
                            <button
                                key={d.date}
                                onClick={() => handleDayClick(d)}
                                className={`
                                    w-full text-left bg-white rounded-lg border-l-[3px] cursor-pointer
                                    transition-all duration-150 hover:bg-gray-50 border border-gray-100
                                    ${p ? 'border-l-emerald-500' : 'border-l-red-400'}
                                    ${isSelectedDay ? 'ring-1 ring-[#5e3174]/20' : ''}
                                    ${!p ? 'opacity-50' : ''}
                                `}
                            >
                                <div className="px-3 py-2 flex items-center justify-between gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-[11px] text-gray-800">{lbl}</span>
                                        <span className={`px-1 py-0.5 rounded text-[8px] font-bold uppercase ${p ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                            {p ? 'P' : 'A'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        {p && <span className="text-[10px] text-gray-400 flex items-center gap-0.5"><Timer size={9} />{d.totalHours}</span>}
                                        {p && d.sessions?.length > 0 && (
                                            <span className="text-[8px] text-gray-400 bg-gray-50 px-1 py-0.5 rounded">{d.sessions.length}s</span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}

export default StaffHistory
