import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'
import { useStudents } from './StudentContext'

const DemoContext = createContext(null)

export function DemoProvider({ children }) {
    const { currentUser } = useAuth()
    const { students, refetch: refetchStudents } = useStudents()
    const [todayDemos, setTodayDemos] = useState([])
    const [upcomingDemos, setUpcomingDemos] = useState([])
    const [absentDemos, setAbsentDemos] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Helper to enrich a demo with student info if missing
    const enrichDemo = useCallback((d) => {
        const student = students.find(s => s.id === d.student)
        return {
            id: d._id,
            studentId: d.student,
            studentName: d.studentName || student?.name || 'Unknown Student',
            studentClass: d.studentClass || student?.studentClass || '',
            branch: d.branch || student?.branch || '',
            lectureNumber: d.lectureNumber,
            scheduledDate: d.scheduledDate?.split('T')[0],
            attended: d.attended,
            notes: d.notes || '',
        }
    }, [students])

    const fetchAllDemos = useCallback(async () => {
        if (!currentUser?.token) return
        setLoading(true)
        setError(null)
        try {
            const [todayRes, upcomingRes, absentRes] = await Promise.all([
                axios.get('/api/v1/demos/today', {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                }),
                axios.get('/api/v1/demos/upcoming', {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                }),
                axios.get('/api/v1/demos/absent', {
                    headers: { Authorization: `Bearer ${currentUser.token}` }
                })
            ])

            setTodayDemos(todayRes.data.data.map(enrichDemo))
            setUpcomingDemos(upcomingRes.data.data.map(enrichDemo))
            setAbsentDemos(absentRes.data.data.map(enrichDemo))
        } catch (err) {
            console.error('Error fetching demos:', err)
            setError(err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }, [currentUser?.token, enrichDemo])


    // Initial fetch
    useEffect(() => {
        fetchAllDemos()
    }, [fetchAllDemos])

    const markAttendance = async (demoId, attended) => {
        if (!currentUser?.token) return
        try {
            await axios.patch(`/api/v1/demos/${demoId}/attendance`,
                { attended },
                { headers: { Authorization: `Bearer ${currentUser.token}` } }
            )
            // Refresh counts/lists
            fetchAllDemos()
            refetchStudents() // Also refresh student status
        } catch (err) {
            console.error('Error marking attendance:', err)
            throw new Error(err.response?.data?.message || 'Failed to mark attendance')
        }
    }

    const rescheduleDemo = async (demoId, newDate, notes) => {
        if (!currentUser?.token) return
        try {
            await axios.patch(`/api/v1/demos/${demoId}/reschedule`,
                { newDate, notes },
                { headers: { Authorization: `Bearer ${currentUser.token}` } }
            )
            // Refresh counts/lists
            fetchAllDemos()
            refetchStudents()
        } catch (err) {
            console.error('Error rescheduling demo:', err)
            throw new Error(err.response?.data?.message || 'Failed to reschedule demo')
        }
    }

    const getDemosByStudent = async (studentId) => {
        if (!currentUser?.token) return []
        try {
            const res = await axios.get(`/api/v1/demos/student/${studentId}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` }
            })
            return res.data.data.map(enrichDemo)
        } catch (err) {
            console.error('Error fetching student demos:', err)
            return []
        }
    }



    // Helper for DemoList
    const getTodaysDemos = () => todayDemos
    const getUpcomingDemos = () => upcomingDemos
    const getAbsentDemos = () => absentDemos

    return (
        <DemoContext.Provider value={{
            todayDemos, upcomingDemos, absentDemos,
            loading, error,
            markAttendance, rescheduleDemo,
            getDemosByStudent, getTodaysDemos, getUpcomingDemos, getAbsentDemos,
            refreshDemos: fetchAllDemos
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

