import { createContext, useContext, useState } from 'react'

const DemoContext = createContext(null)

// Helper to generate dates
const addDays = (date, days) => {
    const d = new Date(date)
    d.setDate(d.getDate() + days)
    return d.toISOString().split('T')[0]
}

const today = new Date().toISOString().split('T')[0]

// Mock demo data for existing students
const initialDemos = [
    // Priya Patel (id: 2) — demo_scheduled, 2 done, 1 today, 1 upcoming
    { id: 101, studentId: 2, studentName: 'Priya Patel', studentClass: '12th', branch: 'Palasia', lectureNumber: 1, scheduledDate: addDays(today, -3), attended: true, notes: '' },
    { id: 102, studentId: 2, studentName: 'Priya Patel', studentClass: '12th', branch: 'Palasia', lectureNumber: 2, scheduledDate: addDays(today, -1), attended: true, notes: '' },
    { id: 103, studentId: 2, studentName: 'Priya Patel', studentClass: '12th', branch: 'Palasia', lectureNumber: 3, scheduledDate: today, attended: null, notes: '' },
    { id: 104, studentId: 2, studentName: 'Priya Patel', studentClass: '12th', branch: 'Palasia', lectureNumber: 4, scheduledDate: addDays(today, 2), attended: null, notes: '' },

    // Arjun Kumar (id: 5) — demo_scheduled, 1 absent
    { id: 105, studentId: 5, studentName: 'Arjun Kumar', studentClass: '8th', branch: 'Palasia', lectureNumber: 1, scheduledDate: addDays(today, -2), attended: false, notes: 'Student was sick' },
    { id: 106, studentId: 5, studentName: 'Arjun Kumar', studentClass: '8th', branch: 'Palasia', lectureNumber: 2, scheduledDate: today, attended: null, notes: '' },
    { id: 107, studentId: 5, studentName: 'Arjun Kumar', studentClass: '8th', branch: 'Palasia', lectureNumber: 3, scheduledDate: addDays(today, 3), attended: null, notes: '' },
    { id: 108, studentId: 5, studentName: 'Arjun Kumar', studentClass: '8th', branch: 'Palasia', lectureNumber: 4, scheduledDate: addDays(today, 5), attended: null, notes: '' },
]

export function DemoProvider({ children }) {
    const [demos, setDemos] = useState(initialDemos)

    const scheduleDemos = (student) => {
        const newDemos = [1, 2, 3, 4].map((num, i) => ({
            id: Date.now() + i,
            studentId: student.id,
            studentName: student.name,
            studentClass: student.studentClass,
            branch: student.branch,
            lectureNumber: num,
            scheduledDate: addDays(today, i * 2 + 1),
            attended: null,
            notes: '',
        }))
        setDemos((prev) => [...prev, ...newDemos])
        return newDemos
    }

    const markAttendance = (demoId, attended) => {
        setDemos((prev) =>
            prev.map((d) => (d.id === demoId ? { ...d, attended } : d))
        )
    }

    const rescheduleDemo = (demoId, newDate, notes) => {
        setDemos((prev) =>
            prev.map((d) =>
                d.id === demoId ? { ...d, scheduledDate: newDate, attended: null, notes } : d
            )
        )
    }

    const getDemosByStudent = (studentId) => {
        return demos.filter((d) => d.studentId === Number(studentId)).sort((a, b) => a.lectureNumber - b.lectureNumber)
    }

    const getTodaysDemos = () => {
        return demos.filter((d) => d.scheduledDate === today && d.attended === null)
    }

    const getUpcomingDemos = () => {
        return demos.filter((d) => d.scheduledDate > today && d.attended === null)
    }

    const getAbsentDemos = () => {
        return demos.filter((d) => d.attended === false)
    }

    const hasStudentDemos = (studentId) => {
        return demos.some((d) => d.studentId === studentId)
    }

    return (
        <DemoContext.Provider value={{
            demos, scheduleDemos, markAttendance, rescheduleDemo,
            getDemosByStudent, getTodaysDemos, getUpcomingDemos, getAbsentDemos, hasStudentDemos
        }}>
            {children}
        </DemoContext.Provider>
    )
}

export function useDemos() {
    const context = useContext(DemoContext)
    if (!context) {
        throw new Error('useDemos must be used within a DemoProvider')
    }
    return context
}
