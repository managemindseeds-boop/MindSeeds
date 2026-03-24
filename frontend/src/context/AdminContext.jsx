/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import axios from 'axios'
import { useAuth } from './AuthContext'

const AdminContext = createContext(null)

// ─── Auto-refresh interval (30 seconds) for real-time data ──────────────────
const POLL_INTERVAL = 30_000

export function AdminProvider({ children }) {
    const { currentUser } = useAuth()

    // ── Dashboard KPIs ──────────────────────────────────────────────────────
    const [dashboard, setDashboard] = useState(null)
    const [dashLoading, setDashLoading] = useState(false)

    // ── Students ────────────────────────────────────────────────────────────
    const [students, setStudents] = useState([])
    const [studentPagination, setStudentPagination] = useState({ page: 1, limit: 50, total: 0, totalPages: 0 })
    const [studentsLoading, setStudentsLoading] = useState(false)

    // ── Demos ───────────────────────────────────────────────────────────────
    const [demos, setDemos] = useState([])
    const [demoStats, setDemoStats] = useState({ today: 0, upcoming: 0, absent: 0, all: 0 })
    const [demosLoading, setDemosLoading] = useState(false)

    // ── Staff ───────────────────────────────────────────────────────────────
    const [staff, setStaff] = useState([])
    const [staffLoading, setStaffLoading] = useState(false)

    // ── Error ───────────────────────────────────────────────────────────────
    const [error, setError] = useState(null)

    const headers = currentUser?.token
        ? { Authorization: `Bearer ${currentUser.token}` }
        : {}

    // ════════════════════════════════════════════════════════════════════════
    // FETCH FUNCTIONS
    // ════════════════════════════════════════════════════════════════════════

    const fetchDashboard = useCallback(async () => {
        if (!currentUser?.token) return
        setDashLoading(true)
        try {
            const res = await axios.get('/api/v1/admin/dashboard', { headers })
            setDashboard(res.data.data)
            setError(null)
        } catch (err) {
            console.error('Admin dashboard error:', err)
            setError(err.response?.data?.message || err.message)
        } finally {
            setDashLoading(false)
        }
    }, [currentUser?.token])

    const fetchStudents = useCallback(async (params = {}) => {
        if (!currentUser?.token) return
        setStudentsLoading(true)
        try {
            const res = await axios.get('/api/v1/admin/students', {
                headers,
                params: {
                    search: params.search || '',
                    status: params.status || 'all',
                    branch: params.branch || 'all',
                    page: params.page || 1,
                    limit: params.limit || 50,
                },
            })
            setStudents(res.data.data.students || [])
            setStudentPagination(res.data.data.pagination || {})
            setError(null)
        } catch (err) {
            console.error('Admin students error:', err)
            setError(err.response?.data?.message || err.message)
        } finally {
            setStudentsLoading(false)
        }
    }, [currentUser?.token])

    const fetchStudentDetail = useCallback(async (id) => {
        if (!currentUser?.token) return null
        try {
            const res = await axios.get(`/api/v1/admin/students/${id}`, { headers })
            return res.data.data
        } catch (err) {
            console.error('Admin student detail error:', err)
            throw err
        }
    }, [currentUser?.token])

    const fetchDemos = useCallback(async (params = {}) => {
        if (!currentUser?.token) return
        setDemosLoading(true)
        try {
            const res = await axios.get('/api/v1/admin/demos', {
                headers,
                params: {
                    filter: params.filter || 'all',
                    branch: params.branch || 'all',
                },
            })
            setDemos(res.data.data.demos || [])
            setDemoStats(res.data.data.stats || {})
            setError(null)
        } catch (err) {
            console.error('Admin demos error:', err)
            setError(err.response?.data?.message || err.message)
        } finally {
            setDemosLoading(false)
        }
    }, [currentUser?.token])

    const fetchStaff = useCallback(async () => {
        if (!currentUser?.token) return
        setStaffLoading(true)
        try {
            const res = await axios.get('/api/v1/admin/staff', { headers })
            setStaff(res.data.data || [])
            setError(null)
        } catch (err) {
            console.error('Admin staff error:', err)
            setError(err.response?.data?.message || err.message)
        } finally {
            setStaffLoading(false)
        }
    }, [currentUser?.token])

    // ════════════════════════════════════════════════════════════════════════
    // STAFF ACTIONS
    // ════════════════════════════════════════════════════════════════════════

    const createStaffMember = async (data) => {
        const res = await axios.post('/api/v1/admin/staff', data, { headers })
        await fetchStaff()
        return res.data
    }

    const updateStaffMember = async (id, data) => {
        const res = await axios.patch(`/api/v1/admin/staff/${id}`, data, { headers })
        await fetchStaff()
        return res.data
    }

    const resetStaffPassword = async (id, newPassword) => {
        const res = await axios.patch(`/api/v1/admin/staff/${id}/reset-password`, { newPassword }, { headers })
        return res.data
    }

    // ════════════════════════════════════════════════════════════════════════
    // AUTO-REFRESH — polls dashboard every 30s for real-time updates
    // ════════════════════════════════════════════════════════════════════════
    const intervalRef = useRef(null)

    useEffect(() => {
        if (currentUser?.token && currentUser?.role === 'admin') {
            fetchDashboard()
            intervalRef.current = setInterval(fetchDashboard, POLL_INTERVAL)
        }
        return () => {
            if (intervalRef.current) clearInterval(intervalRef.current)
        }
    }, [currentUser?.token, currentUser?.role, fetchDashboard])

    return (
        <AdminContext.Provider value={{
            // Dashboard
            dashboard, dashLoading, fetchDashboard,
            // Students
            students, studentPagination, studentsLoading, fetchStudents, fetchStudentDetail,
            // Demos
            demos, demoStats, demosLoading, fetchDemos,
            // Staff
            staff, staffLoading, fetchStaff,
            createStaffMember, updateStaffMember, resetStaffPassword,
            // General
            error,
        }}>
            {children}
        </AdminContext.Provider>
    )
}

export function useAdmin() {
    const context = useContext(AdminContext)
    if (!context) throw new Error('useAdmin must be used within an AdminProvider')
    return context
}
