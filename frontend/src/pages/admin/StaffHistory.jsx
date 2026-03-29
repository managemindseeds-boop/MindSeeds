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
    const abortRef = useRef(null)

    const monthName = new Date(year, month - 1).toLocaleString('en-US', { month: 'long' })
    const daysInMonth = new Date(year, month, 0).getDate()

    // ── Fetch month — batch parallel, minimal re-renders ────────────────
    const fetchMonth = useCallback(async () => {
        const key = `${year}-${month}`
        if (cache.current[key]) {
            setDailyData(cache.current[key])
            setLoading(false)
            return
        }

        // Abort previous
        if (abortRef.current) abortRef.current.abort()
        const controller = new AbortController()
        abortRef.current = controller

        setLoading(true)
        setDailyData([])
        const total = daysInMonth
        setProgress({ loaded: 0, total })

        const results = []
        for (let day = 1; day <= total; day++) {
            results.push({
                date: `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
                day,
                status: 'loading',
                sessions: [],
                totalHours: '—',
            })
        }

        const fetchDay = async (idx) => {
            if (controller.signal.aborted) return
            const d = results[idx]
            const dateObj = new Date(d.date)

            if (dateObj > now) {
                results[idx] = { ...d, status: 'future' }
                return
            }

            try {
                const res = await staffApi.get('/api/admin/dashboard', {
                    params: { date: d.date },
                    signal: controller.signal,
                })
                const staffData = res.data.staff?.find(s => s.phone === staff.phone)
                if (staffData && staffData.todayStatus !== 'absent') {
                    results[idx] = {
                        ...d,
                        status: staffData.todayStatus || 'present',
                        totalHours: staffData.totalHoursToday || '0h 0m',
                        sessions: staffData.sessions || [],
                    }
                } else {
                    results[idx] = { ...d, status: 'absent', totalHours: '0h 0m' }
                }
            } catch (err) {
                if (err?.name === 'CanceledError' || err?.name === 'AbortError') return
                results[idx] = { ...d, status: 'absent', totalHours: '0h 0m' }
            }
        }

        // Fetch in batches of 6, update UI only once per batch
        const batchSize = 6
        for (let i = 0; i < total; i += batchSize) {
            if (controller.signal.aborted) return
            const batch = []
            for (let j = i; j < Math.min(i + batchSize, total); j++) {
                batch.push(fetchDay(j))
            }
            await Promise.all(batch)
            if (controller.signal.aborted) return
            const loaded = Math.min(i + batchSize, total)
            setProgress({ loaded, total })
            setDailyData([...results]) // single state update per batch
        }

        if (!controller.signal.aborted) {
            cache.current[key] = [...results]
            setLoading(false)
        }
    }, [year, month, daysInMonth, staff.phone])

    useEffect(() => {
        fetchMonth()
        return () => { if (abortRef.current) abortRef.current.abort() }
    }, [fetchMonth])

    // Scroll into view on mount
    useEffect(() => {
        setTimeout(() => {
            containerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
        }, 100)
    }, [])

    // ── Compute summary (only from loaded data) ─────────────────────────
    const loaded = dailyData.filter(d => d.status !== 'loading' && d.status !== 'future')
    const present = loaded.filter(d => d.status === 'present' || d.status === 'active')
    const rate = loaded.length > 0 ? Math.round((present.length / loaded.length) * 100) : 0

    const totalMins = present.reduce((acc, d) => {
        const m = d.totalHours?.match(/(\d+)h\s*(\d+)m/)
        return m ? acc + parseInt(m[1]) * 60 + parseInt(m[2]) : acc
    }, 0)
    const avgH = present.length > 0 ? (totalMins / present.length / 60).toFixed(1) : '0'

    // ── Month nav ───────────────────────────────────────────────────────
    const prevMonth = () => {
        if (month === 1) { setMonth(12); setYear(y => y - 1) }
        else setMonth(m => m - 1)
    }
    const nextMonth = () => {
        if (year === now.getFullYear() && month === now.getMonth() + 1) return
        if (month === 12) { setMonth(1); setYear(y => y + 1) }
        else setMonth(m => m + 1)
    }

    // ── Calendar helpers ────────────────────────────────────────────────
    const firstDow = (new Date(year, month - 1, 1).getDay() + 6) % 7
    const todayStr = now.toISOString().split('T')[0]

    const fmtTime = (s) => {
        if (!s) return 'Now'
        const p = s.split(', ')
        if (p.length >= 2) { const [hms, ap] = p[1].split(' '); const [h, m] = hms.split(':'); return `${h.padStart(2, '0')}:${m} ${(ap || '').toUpperCase()}` }
        return s
    }

    const scrollTo = (dateStr) => logRefs.current[dateStr]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    const rc = rate >= 80 ? 'text-emerald-600' : rate >= 60 ? 'text-amber-600' : 'text-red-600'

    const shadow = { boxShadow: '0 10px 30px rgba(94,49,116,0.05)' }

    return (
        <div ref={containerRef} className="mt-8 space-y-6 border-t-2 border-[#5e3174]/20 pt-8 animate-in fade-in slide-in-from-bottom-2 duration-300">
            {/* Header */}
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#310148] font-bold text-sm bg-[#f5d9fc]" style={{ ...shadow, fontFamily: 'Manrope' }}>
                        {staff.name?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                        <h3 className="font-bold text-base text-[#310148]" style={{ fontFamily: 'Manrope' }}>{staff.name} — History</h3>
                        <p className="text-[10px] text-[#4c444e]">{staff.employeeId} · {(staff.branch || []).join(', ')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white rounded-lg p-0.5" style={shadow}>
                        <button onClick={prevMonth} className="p-1.5 hover:bg-[#f3f4f6] rounded text-[#46195c] cursor-pointer"><ChevronLeft size={16} /></button>
                        <span className="px-2 font-bold text-xs text-[#191c1e]" style={{ fontFamily: 'Manrope' }}>{monthName} {year}</span>
                        <button onClick={nextMonth} disabled={year === now.getFullYear() && month === now.getMonth() + 1} className="p-1.5 hover:bg-[#f3f4f6] rounded text-[#46195c] cursor-pointer disabled:opacity-30"><ChevronRight size={16} /></button>
                    </div>
                    <button onClick={onClose} className="p-1.5 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 cursor-pointer transition-colors"><X size={16} /></button>
                </div>
            </div>

            {/* Loading bar */}
            {loading && (
                <div className="bg-[#f3f4f6] rounded-lg overflow-hidden">
                    <div className="flex justify-between px-3 py-1">
                        <span className="text-[10px] text-[#4c444e] uppercase">Loading...</span>
                        <span className="text-[10px] font-bold text-[#46195c]">{progress.loaded}/{progress.total}</span>
                    </div>
                    <div className="h-1 bg-[#e7e8ea]">
                        <div className="h-full transition-all duration-500 ease-out" style={{ width: `${progress.total > 0 ? (progress.loaded / progress.total) * 100 : 0}%`, background: 'linear-gradient(90deg,#46195c,#5e3174)' }} />
                    </div>
                </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3">
                {[
                    { icon: <CalendarCheck size={18} className="text-[#46195c]" />, label: 'Present', value: `${present.length}/${loaded.length}`, color: 'text-[#310148]' },
                    { icon: <BarChart3 size={18} className="text-emerald-600" />, label: 'Rate', value: `${rate}%`, color: rc },
                    { icon: <Clock size={18} className="text-[#46195c]" />, label: 'Avg Hrs', value: `${avgH}h`, color: 'text-[#310148]' },
                ].map((c, i) => (
                    <div key={i} className="bg-white p-4 rounded-xl flex items-center justify-between" style={shadow}>
                        {c.icon}
                        <div className="text-right">
                            <p className="text-[9px] text-[#4c444e] uppercase tracking-widest font-semibold">{c.label}</p>
                            <p className={`font-bold text-xl ${c.color}`} style={{ fontFamily: 'Manrope' }}>{c.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Calendar */}
            <div className="bg-[#f3f4f6] p-5 rounded-2xl space-y-3">
                <div className="flex justify-between items-center">
                    <h4 className="font-bold text-sm text-[#310148]" style={{ fontFamily: 'Manrope' }}>Heatmap</h4>
                    <div className="flex gap-3 text-[10px] font-medium">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-500" />P</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" />A</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300" />—</span>
                    </div>
                </div>
                <div className="grid grid-cols-7 gap-y-2 justify-items-center">
                    {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map(d => (
                        <div key={d} className="text-[9px] text-[#7e747f] uppercase font-bold">{d}</div>
                    ))}
                    {Array.from({ length: firstDow }).map((_, i) => <div key={`e${i}`} />)}
                    {dailyData.map(d => {
                        if (!d) return null
                        const p = d.status === 'present' || d.status === 'active'
                        const f = d.status === 'future'
                        const l = d.status === 'loading'
                        const t = d.date === todayStr
                        let cls = 'bg-gray-200 text-gray-400'
                        if (l) cls = 'bg-gray-100 text-gray-300 animate-pulse'
                        else if (p) cls = 'bg-emerald-500 text-white cursor-pointer hover:scale-110'
                        else if (!f) cls = 'bg-red-500 text-white cursor-pointer hover:scale-110'
                        return (
                            <button key={d.date} onClick={() => !f && !l && scrollTo(d.date)}
                                className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-bold transition-transform ${cls} ${t ? 'ring-2 ring-[#46195c] ring-offset-1 ring-offset-[#f3f4f6]' : ''}`}>
                                {d.day}
                            </button>
                        )
                    })}
                </div>
            </div>

            {/* Log */}
            <div className="space-y-2">
                <h4 className="font-bold text-sm text-[#310148]" style={{ fontFamily: 'Manrope' }}>Log</h4>
                {[...dailyData].filter(d => d && d.status !== 'future' && d.status !== 'loading').reverse().map(d => {
                    const p = d.status === 'present' || d.status === 'active'
                    const lbl = new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
                    return (
                        <div key={d.date} ref={el => logRefs.current[d.date] = el}
                            className={`bg-white rounded-lg border-l-3 overflow-hidden ${p ? 'border-emerald-500' : 'border-red-400'}`}
                            style={{ ...shadow, borderLeftWidth: '3px' }}>
                            <div className={`px-4 py-3 flex items-center justify-between gap-3 ${!p ? 'opacity-50' : ''}`}>
                                <div className="flex items-center gap-2">
                                    <span className="font-bold text-sm" style={{ fontFamily: 'Manrope' }}>{lbl}</span>
                                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold uppercase ${p ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                        {p ? 'P' : 'A'}
                                    </span>
                                    {p && <span className="text-[#4c444e] text-[10px] flex items-center gap-0.5"><Timer size={10} />{d.totalHours}</span>}
                                </div>
                                {p && d.sessions.length > 0 ? (
                                    <div className="flex gap-1.5 flex-wrap justify-end">
                                        {d.sessions.map((s, i) => (
                                            <div key={i} className="flex items-center gap-2 bg-[#f3f4f6] px-2 py-1 rounded text-[10px]">
                                                <span className="font-bold text-[#310148]">{fmtTime(s.checkIn)}</span>
                                                <span className="text-[#7e747f]">→</span>
                                                <span className="font-bold text-[#310148]">{s.checkOut ? fmtTime(s.checkOut) : 'Now'}</span>
                                                <span className="text-[#46195c] font-medium">{s.duration || '—'}</span>
                                                <CheckCircle2 size={12} className="text-emerald-500" />
                                            </div>
                                        ))}
                                    </div>
                                ) : !p ? (
                                    <span className="text-gray-300 text-[10px] italic">—</span>
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
