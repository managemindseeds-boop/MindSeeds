import { createContext, useContext, useMemo, useState } from 'react'
import { useDemos } from './DemoContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false)
    const { todayDemos, absentDemos, upcomingDemos } = useDemos()

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


        // ── 5. UPCOMING DEMOS (grouped summary) ─────────────────────────────
        if (upcomingDemos.length > 0) {
            // Group by unique student
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
    }, [todayDemos, absentDemos, upcomingDemos])

    const unreadCount = useMemo(
        () => notifications.filter(n => n.priority === 'high').length,
        [notifications]
    )

    return (
        <NotificationContext.Provider value={{ notifications, unreadCount, isOpen, setIsOpen }}>
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
