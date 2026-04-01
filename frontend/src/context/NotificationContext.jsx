import { createContext, useContext, useMemo, useState, useEffect } from 'react'
import { useDemos } from './DemoContext'
import axios from 'axios'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false)
    const { todayDemos, absentDemos, upcomingDemos } = useDemos()
    const [callCounts, setCallCounts] = useState({ pending: 0, rescheduled: 0, contacted: 0 })

    // Fetch fee reminder counts (all unresolved statuses)
    const refreshCalls = () => {
        axios.get('/api/v1/calls/count')
            .then(res => setCallCounts({
                pending:    res.data.data?.pending    || 0,
                rescheduled:res.data.data?.rescheduled|| 0,
                contacted:  res.data.data?.contacted  || 0,
            }))
            .catch(() => {})
    }

    useEffect(() => {
        refreshCalls()
        // Refresh every 2 minutes
        const interval = setInterval(refreshCalls, 2 * 60 * 1000)
        return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const notifications = useMemo(() => {
        const items = []

        // ── 1. TODAY'S DEMOS (grouped summary) ─────────────────────────────
        const pendingToday = todayDemos.filter(d => !d.attended)
        if (pendingToday.length > 0) {
            items.push({
                id: 'group-demos-today',
                type: 'demo',
                priority: 'high',
                title: `${pendingToday.length} Demo${pendingToday.length > 1 ? 's' : ''} Scheduled Today`,
                message: pendingToday.map(d => d.studentName).join(', '),
                count: pendingToday.length,
                link: '/receptionist/demos',
            })
        }

        // ── 2. ABSENT / MISSED DEMOS (individual — each needs action) ──────
        absentDemos.forEach(demo => {
            items.push({
                id: `demo-absent-${demo.id}`,
                type: 'absent',
                priority: 'high',
                title: 'Missed Demo — Action Needed',
                message: `${demo.studentName} — Lecture ${demo.lectureNumber}`,
                count: null,
                link: `/receptionist/demos/${demo.studentId}`,
            })
        })

        // ── 3. FEE REMINDERS — not yet called (pending + rescheduled) ──────
        const feeReminderCount = callCounts.pending + callCounts.rescheduled
        if (feeReminderCount > 0) {
            items.push({
                id: 'group-fee-reminders',
                type: 'call',
                priority: 'high',
                title: `${feeReminderCount} Fee Reminder${feeReminderCount > 1 ? 's' : ''} Pending`,
                message: 'Students with upcoming or overdue fee payments — call needed',
                link: '/receptionist/fees',
            })
        }

        // ── 4. CONTACTED — AWAITING PAYMENT (will_pay + no_answer + called) ─
        if (callCounts.contacted > 0) {
            items.push({
                id: 'group-contacted-awaiting',
                type: 'fee',
                priority: 'medium',
                title: `${callCounts.contacted} Student${callCounts.contacted > 1 ? 's' : ''} Awaiting Payment`,
                message: 'Contacted but payment not yet received',
                link: '/receptionist/fees',
            })
        }

        // ── 5. UPCOMING DEMOS (grouped summary) ─────────────────────────────
        if (upcomingDemos.length > 0) {
            const uniqueStudents = [...new Set(upcomingDemos.map(d => d.studentName))]
            const nextDate = upcomingDemos[0]?.scheduledDate
            items.push({
                id: 'group-demos-upcoming',
                type: 'upcoming',
                priority: 'low',
                title: `${upcomingDemos.length} Upcoming Demo Lecture${upcomingDemos.length > 1 ? 's' : ''}`,
                message: uniqueStudents.length === 1
                    ? `${uniqueStudents[0]} — next on ${nextDate}`
                    : `${uniqueStudents.length} students — next on ${nextDate}`,
                count: upcomingDemos.length,
                link: '/receptionist/demos',
            })
        }

        // Sort: high → medium → low
        const order = { high: 0, medium: 1, low: 2 }
        return items.sort((a, b) => order[a.priority] - order[b.priority])
    }, [todayDemos, absentDemos, upcomingDemos, callCounts])

    const unreadCount = useMemo(
        () => notifications.filter(n => n.priority === 'high').length,
        [notifications]
    )

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, isOpen, setIsOpen, refreshCalls }}>
            {children}
        </NotificationContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider')
    return context
}
