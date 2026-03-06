import { createContext, useContext, useMemo, useState } from 'react'
import { useStudents } from './StudentContext'
import { useDemos } from './DemoContext'
import { useFees } from './FeeContext'

const NotificationContext = createContext(null)

export function NotificationProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false)
    const { students } = useStudents()
    const { todayDemos, absentDemos, upcomingDemos } = useDemos()
    const { todayFees } = useFees()

    const notifications = useMemo(() => {
        const items = []

        // --- Demo Notifications ---
        // Today's demos that haven't been attended yet
        todayDemos.forEach(demo => {
            if (!demo.attended) {
                items.push({
                    id: `demo-today-${demo.id}`,
                    type: 'demo',
                    priority: 'high',
                    title: 'Demo Scheduled Today',
                    message: `${demo.studentName} – Lecture ${demo.lectureNumber}`,
                    meta: demo.branch || '',
                    time: demo.scheduledDate,
                    link: `/receptionist/demos/${demo.studentId}`,
                })
            }
        })

        // Absent (missed) demo sessions
        absentDemos.forEach(demo => {
            items.push({
                id: `demo-absent-${demo.id}`,
                type: 'absent',
                priority: 'medium',
                title: 'Missed Demo Session',
                message: `${demo.studentName} – Lecture ${demo.lectureNumber}`,
                meta: demo.branch || '',
                time: demo.scheduledDate,
                link: `/receptionist/demos/${demo.studentId}`,
            })
        })

        // Upcoming demos (next 7 days, not today)
        upcomingDemos.forEach(demo => {
            items.push({
                id: `demo-upcoming-${demo.id}`,
                type: 'upcoming',
                priority: 'low',
                title: 'Upcoming Demo',
                message: `${demo.studentName} – Lecture ${demo.lectureNumber}`,
                meta: demo.branch || '',
                time: demo.scheduledDate,
                link: `/receptionist/demos`,
            })
        })

        // --- Fee Notifications ---
        todayFees.forEach(fee => {
            if (fee.status !== 'paid') {
                items.push({
                    id: `fee-due-${fee._id || fee.id}`,
                    type: 'fee',
                    priority: fee.status === 'overdue' ? 'high' : 'medium',
                    title: fee.status === 'overdue' ? 'Overdue Fee' : 'Fee Due Today',
                    message: `${fee.studentName || fee.student?.fullName || 'Student'} – ₹${fee.amount?.toLocaleString('en-IN') ?? ''}`,
                    meta: fee.month || '',
                    time: fee.dueDate?.split('T')[0] || '',
                    link: `/receptionist/fees`,
                })
            }
        })

        // --- Student Notifications ---
        // Students with 'demo_completed' status awaiting admission
        students.forEach(student => {
            if (student.status === 'demo_completed') {
                items.push({
                    id: `student-admission-${student.id}`,
                    type: 'admission',
                    priority: 'medium',
                    title: 'Pending Admission',
                    message: `${student.name} has completed demos`,
                    meta: student.branch || '',
                    time: '',
                    link: `/receptionist/admissions`,
                })
            }
        })

        // Sort: high priority first, then medium, then low
        const priorityOrder = { high: 0, medium: 1, low: 2 }
        return items.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
    }, [students, todayDemos, absentDemos, upcomingDemos, todayFees])

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

export function useNotifications() {
    const context = useContext(NotificationContext)
    if (!context) throw new Error('useNotifications must be used within a NotificationProvider')
    return context
}
