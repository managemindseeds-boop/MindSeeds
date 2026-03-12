/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const DashboardContext = createContext(null)

// Student normalize helper (same as StudentContext)
function normalizeStudent(s, localStatuses = {}) {
    return {
        id: s._id,
        name: s.fullName,
        phone: s.phone,
        email: s.email || '',
        gender: s.gender || '',
        parentName: s.parentName,
        parentPhone: s.parentPhone,
        studentClass: s.class,
        address: s.address,
        branch: s.branch,
        status: localStatuses[s._id] || s.status || 'enquiry',
        createdAt: s.createdAt,
    }
}

// Demo normalize helper
function normalizeDemo(d) {
    // UTC scheduledDate ko IST mein convert karo (UTC+5:30)
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const scheduledDateIST = d.scheduledDate
        ? new Date(new Date(d.scheduledDate).getTime() + IST_OFFSET_MS)
            .toISOString().split('T')[0]   // "2026-03-11" in IST
        : null;

    return {
        id: d._id,
        studentId: d.student,
        studentName: d.studentName || 'Unknown Student',
        studentClass: d.studentClass || '',
        branch: d.branch || '',
        lectureNumber: d.lectureNumber,
        subject: d.subject || '',
        scheduledDate: scheduledDateIST,
        attended: d.attended,
        notes: d.notes || '',
    }
}

export function DashboardProvider({ children }) {
    const { currentUser } = useAuth()

    const [students, setStudents] = useState([])
    const [todayDemos, setTodayDemos] = useState([])
    const [upcomingDemos, setUpcomingDemos] = useState([])
    const [absentDemos, setAbsentDemos] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    // Local status overrides (same logic as StudentContext)
    const [localStatuses, setLocalStatuses] = useState(() => {
        const saved = localStorage.getItem('mindseeds_student_statuses')
        return saved ? JSON.parse(saved) : {}
    })

    useEffect(() => {
        localStorage.setItem('mindseeds_student_statuses', JSON.stringify(localStatuses))
    }, [localStatuses])

    // ─── Single API call for ALL dashboard data ─────────────────────────────
    const fetchDashboard = useCallback(async () => {
        if (!currentUser?.token) return
        setLoading(true)
        setError(null)
        try {
            const res = await axios.get('/api/v1/dashboard', {
                headers: { Authorization: `Bearer ${currentUser.token}` }
            })
            const { students: rawStudents, todayDemos: td, upcomingDemos: ud, absentDemos: ad } = res.data.data

            setStudents((rawStudents || []).map(s => normalizeStudent(s, localStatuses)))
            setTodayDemos((td || []).map(normalizeDemo))
            setUpcomingDemos((ud || []).map(normalizeDemo))
            setAbsentDemos((ad || []).map(normalizeDemo))
        } catch (err) {
            console.error('Error fetching dashboard:', err)
            setError(err.response?.data?.message || err.message)
        } finally {
            setLoading(false)
        }
    }, [currentUser?.token, localStatuses])

    useEffect(() => {
        fetchDashboard()
    }, [fetchDashboard])

    // ─── Student Actions ────────────────────────────────────────────────────
    const addStudent = async (formData) => {
        if (!currentUser?.token) throw new Error('Not authenticated')
        const res = await axios.post('/api/v1/students/add', {
            fullName: formData.name,
            phone: formData.phone,
            email: formData.email,
            gender: formData.gender,
            address: formData.address,
            parentName: formData.parentName,
            parentPhone: formData.parentPhone,
            class: formData.studentClass,
            branch: formData.branch,
        }, { headers: { Authorization: `Bearer ${currentUser.token}` } })
        await fetchDashboard()
        return res.data
    }

    const updateStudentStatus = async (id, newStatus) => {
        if (!currentUser?.token) throw new Error('Not authenticated')
        await axios.patch(`/api/v1/students/${id}/status`,
            { status: newStatus },
            { headers: { Authorization: `Bearer ${currentUser.token}` } }
        )
        setLocalStatuses(prev => ({ ...prev, [id]: newStatus }))
        await fetchDashboard()
    }

    const getStudentById = (id) => students.find(s => String(s.id) === String(id))

    // ─── Demo Actions ───────────────────────────────────────────────────────
    const markAttendance = async (demoId, attended) => {
        if (!currentUser?.token) return
        await axios.patch(`/api/v1/demos/${demoId}/attendance`,
            { attended },
            { headers: { Authorization: `Bearer ${currentUser.token}` } }
        )
        await fetchDashboard()
    }

    const rescheduleDemo = async (demoId, newDate, notes) => {
        if (!currentUser?.token) return
        await axios.patch(`/api/v1/demos/${demoId}/reschedule`,
            { newDate, notes },
            { headers: { Authorization: `Bearer ${currentUser.token}` } }
        )
        await fetchDashboard()
    }

    const updateDemo = async (demoId, fields) => {
        if (!currentUser?.token) return
        await axios.patch(`/api/v1/demos/${demoId}/update`,
            fields,
            { headers: { Authorization: `Bearer ${currentUser.token}` } }
        )
        await fetchDashboard()
    }

    const getDemosByStudent = async (studentId) => {
        if (!currentUser?.token) return []
        try {
            const res = await axios.get(`/api/v1/demos/student/${studentId}`, {
                headers: { Authorization: `Bearer ${currentUser.token}` }
            })
            return res.data.data.map(normalizeDemo)
        } catch {
            return []
        }
    }

    return (
        <DashboardContext.Provider value={{
            // Data
            students,
            todayDemos, upcomingDemos, absentDemos,
            loading, error,
            // Refresh
            refetch: fetchDashboard,
            // Student actions
            addStudent, updateStudentStatus, getStudentById,
            // Demo actions
            markAttendance, rescheduleDemo, getDemosByStudent, updateDemo,
            getTodaysDemos: () => todayDemos,
            getUpcomingDemos: () => upcomingDemos,
            getAbsentDemos: () => absentDemos,
            refreshDemos: fetchDashboard,
        }}>
            {children}
        </DashboardContext.Provider>
    )
}

export function useDashboard() {
    const context = useContext(DashboardContext)
    if (!context) throw new Error('useDashboard must be used within a DashboardProvider')
    return context
}

// ─── Backward-compatible hooks ────────────────────────────────────────────────
// Taaki purane pages (StudentList, DemoList, FeeList) bhi kaam karte rahe bina badlav ke

export function useStudents() {
    const ctx = useDashboard()
    return {
        students: ctx.students,
        loading: ctx.loading,
        error: ctx.error,
        addStudent: ctx.addStudent,
        updateStudentStatus: ctx.updateStudentStatus,
        getStudentById: ctx.getStudentById,
        refetch: ctx.refetch,
    }
}

export function useDemos() {
    const ctx = useDashboard()
    return {
        todayDemos: ctx.todayDemos,
        upcomingDemos: ctx.upcomingDemos,
        absentDemos: ctx.absentDemos,
        loading: ctx.loading,
        error: ctx.error,
        markAttendance: ctx.markAttendance,
        rescheduleDemo: ctx.rescheduleDemo,
        getDemosByStudent: ctx.getDemosByStudent,
        updateDemo: ctx.updateDemo,
        getTodaysDemos: ctx.getTodaysDemos,
        getUpcomingDemos: ctx.getUpcomingDemos,
        getAbsentDemos: ctx.getAbsentDemos,
        refreshDemos: ctx.refreshDemos,
    }
}

