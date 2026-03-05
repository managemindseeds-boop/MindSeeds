import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useAuth } from './AuthContext'

const StudentContext = createContext(null)

// Normalize a raw MongoDB student doc to the shape the UI expects
function normalize(s) {
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
        status: s.status || 'enquiry',
        createdAt: s.createdAt,
    }
}

export function StudentProvider({ children }) {
    const { currentUser } = useAuth()
    const [students, setStudents] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const fetchStudents = useCallback(async () => {
        if (!currentUser?.token) return
        setLoading(true)
        setError(null)
        try {
            const res = await fetch('/api/v1/students', {
                headers: {
                    Authorization: `Bearer ${currentUser.token}`,
                },
            })
            if (!res.ok) {
                const data = await res.json().catch(() => ({}))
                throw new Error(data.message || 'Failed to load students')
            }
            const data = await res.json()
            // ApiResponse wrapper: { statusCode, data: [...], message }
            const raw = Array.isArray(data.data) ? data.data : []
            setStudents(raw.map(normalize))
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [currentUser?.token])

    // Fetch whenever the logged-in user changes
    useEffect(() => {
        fetchStudents()
    }, [fetchStudents])

    const addStudent = async (formData) => {
        if (!currentUser?.token) throw new Error('Not authenticated')

        const res = await fetch('/api/v1/students/add', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${currentUser.token}`,
            },
            body: JSON.stringify({
                fullName: formData.name,
                phone: formData.phone,
                email: formData.email,
                gender: formData.gender,
                address: formData.address,
                parentName: formData.parentName,
                parentPhone: formData.parentPhone,
                class: formData.studentClass,
                branch: formData.branch,
            }),
        })

        if (!res.ok) {
            const data = await res.json().catch(() => ({}))
            throw new Error(data.message || 'Failed to register student')
        }

        // Re-fetch the full list so the new student appears with its real _id
        await fetchStudents()
    }

    const updateStudent = (id, updates) => {
        setStudents((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        )
    }

    const getStudentById = (id) => {
        return students.find((s) => String(s.id) === String(id))
    }

    return (
        <StudentContext.Provider value={{ students, loading, error, addStudent, updateStudent, getStudentById, refetch: fetchStudents }}>
            {children}
        </StudentContext.Provider>
    )
}

export function useStudents() {
    const context = useContext(StudentContext)
    if (!context) {
        throw new Error('useStudents must be used within a StudentProvider')
    }
    return context
}
