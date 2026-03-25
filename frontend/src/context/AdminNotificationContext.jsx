/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useMemo, useCallback, useRef } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const AdminNotificationContext = createContext(null)

// ─── 30-second polling for real-time admin notifications ────────────────────
const POLL_INTERVAL = 30_000

export function AdminNotificationProvider({ children }) {
    const { currentUser } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    // Raw data from admin APIs
    const [demoData, setDemoData] = useState(null)
    const [dashboardData, setDashboardData] = useState(null)
    const [pendingCallsCount, setPendingCallsCount] = useState(0)
    const intervalRef = useRef(null)

    const headers = currentUser?.token
        ? { Authorization: `Bearer ${currentUser.token}` }
        : {}

    // ── Fetch all notification data from admin APIs ─────────────────────
    const fetchNotifData = useCallback(async () => {
        if (!currentUser?.token || currentUser?.role !== 'admin') return
        try {
            const [demosRes, dashRes, callsRes] = await Promise.all([
                axios.get('/api/v1/admin/demos', { headers, params: { filter: 'all' } }),
                axios.get('/api/v1/admin/dashboard', { headers }),
                axios.get('/api/v1/calls/count', { headers }).catch(() => ({ data: { data: { count: 0 } } })),
            ])
            setDemoData(demosRes.data.data)
            setDashboardData(dashRes.data.data)
            setPendingCallsCount(callsRes.data.data?.count || 0)
        } catch (err) {
            console.error('Admin notification fetch error:', err)
        }
    }, [currentUser?.token, currentUser?.role])

    // ── Start polling on mount ──────────────────────────────────────────
    useEffect(() => {
        if (currentUser?.token && currentUser?.role === 'admin') {
            fetchNotifData()
            intervalRef.current = setInterval(fetchNotifData, POLL_INTERVAL)
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [currentUser?.token, currentUser?.role, fetchNotifData])

    // ════════════════════════════════════════════════════════════════════════
    // BUILD ADMIN-SPECIFIC NOTIFICATIONS
    // ════════════════════════════════════════════════════════════════════════
    const notifications = useMemo(() => {
        const items = []
        if (!demoData || !dashboardData) return items

        const stats = demoData.stats || {}
        const kpi = dashboardData.kpi || {}
        const statusBreakdown = dashboardData.statusBreakdown || {}
        const recentStudents = dashboardData.recentActivity?.students || []

        // ── 🔴 URGENT: Today's demos across ALL branches ────────────────
        if (stats.today > 0) {
            const demos = demoData.demos || []
            const todayPending = demos.filter(d => d.attended === null || d.attended === undefined)
            const names = todayPending.slice(0, 5).map(d => d.studentName).join(', ')
            items.push({
                id: 'admin-demos-today',
                type: 'demo',
                priority: 'high',
                title: `${stats.today} Demo${stats.today > 1 ? 's' : ''} Scheduled Today`,
                message: names + (todayPending.length > 5 ? `... +${todayPending.length - 5} more` : ''),
                count: stats.today,
                link: '/admin/demos',
            })
        }

        // ── 🔴 URGENT: Absent demos needing reschedule ──────────────────
        if (stats.absent > 0) {
            items.push({
                id: 'admin-demos-absent',
                type: 'absent',
                priority: 'high',
                title: `${stats.absent} Absent Demo${stats.absent > 1 ? 's' : ''} — Action Needed`,
                message: 'Students who missed their demo lectures across all branches',
                link: '/admin/demos',
            })
        }

        // ── 🔴 URGENT: Pending calls ────────────────────────────────────
        if (pendingCallsCount > 0) {
            items.push({
                id: 'admin-pending-calls',
                type: 'call',
                priority: 'high',
                title: `${pendingCallsCount} Pending Call${pendingCallsCount > 1 ? 's' : ''}`,
                message: 'Students awaiting a follow-up call',
                link: '/admin/students',
            })
        }

        // ── 🟡 IMPORTANT: New enquiries awaiting action ─────────────────
        const enquiryCount = statusBreakdown.enquiry || 0
        if (enquiryCount > 0) {
            items.push({
                id: 'admin-new-enquiries',
                type: 'registration',
                priority: 'medium',
                title: `${enquiryCount} Student${enquiryCount > 1 ? 's' : ''} in Enquiry Stage`,
                message: 'Awaiting demo scheduling across all branches',
                link: '/admin/students',
            })
        }

        // ── 🟡 IMPORTANT: Recent registrations (last 24 hours) ──────────
        const now = Date.now()
        const recentCount = recentStudents.filter(s => (now - new Date(s.createdAt).getTime()) < 24 * 60 * 60 * 1000).length
        if (recentCount > 0) {
            items.push({
                id: 'admin-recent-registrations',
                type: 'registration',
                priority: 'medium',
                title: `${recentCount} New Registration${recentCount > 1 ? 's' : ''} (Last 24h)`,
                message: recentStudents.slice(0, 3).map(s => s.fullName).join(', '),
                link: '/admin/students',
            })
        }

        // ── 🟢 INFO: Upcoming demos ─────────────────────────────────────
        if (stats.upcoming > 0) {
            items.push({
                id: 'admin-demos-upcoming',
                type: 'upcoming',
                priority: 'low',
                title: `${stats.upcoming} Upcoming Demo Lecture${stats.upcoming > 1 ? 's' : ''}`,
                message: 'Across all branches',
                count: stats.upcoming,
                link: '/admin/demos',
            })
        }

        // ── 🟢 INFO: System overview ────────────────────────────────────
        items.push({
            id: 'admin-system-overview',
            type: 'staff',
            priority: 'low',
            title: `${kpi.totalStudents || 0} Total Students · ${kpi.staffCount || 0} Staff`,
            message: `Conversion rate: ${kpi.conversionRate || 0}% (Enquiry → Admitted)`,
            link: '/admin/dashboard',
        })

        const order = { high: 0, medium: 1, low: 2 }
        return items.sort((a, b) => order[a.priority] - order[b.priority])
    }, [demoData, dashboardData, pendingCallsCount])

    const unreadCount = useMemo(
        () => notifications.filter(n => n.priority === 'high').length,
        [notifications]
    )

    return (
        <AdminNotificationContext.Provider value={{
            notifications, unreadCount, isOpen, setIsOpen, refreshNotifications: fetchNotifData
        }}>
            {children}
        </AdminNotificationContext.Provider>
    )
}

export function useAdminNotifications() {
    const context = useContext(AdminNotificationContext)
    if (!context) throw new Error('useAdminNotifications must be used within AdminNotificationProvider')
    return context
}
