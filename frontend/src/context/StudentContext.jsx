import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import axios from 'axios'
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
            const res = await axios.get('/api/v1/students', {
                headers: {
                    Authorization: `Bearer ${currentUser.token}`,
                },
            })
            // res.data is the ApiResponse: { statusCode, data, message }
            const raw = Array.isArray(res.data.data) ? res.data.data : []
            setStudents(raw.map(normalize))
        } catch (err) {
            console.error('Error fetching students:', err)
            setError(err.response?.data?.message || err.message)
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

        try {
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
            }, {
                headers: {
                    Authorization: `Bearer ${currentUser.token}`,
                },
            })

            // Re-fetch the full list so the new student appears with its real _id
            await fetchStudents()
            return res.data
        } catch (err) {
            console.error('Error adding student:', err)
            throw new Error(err.response?.data?.message || 'Failed to register student')
        }
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
