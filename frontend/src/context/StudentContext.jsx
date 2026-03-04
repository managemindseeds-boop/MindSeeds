import { createContext, useContext, useState } from 'react'

const StudentContext = createContext(null)

// Mock student data
const initialStudents = [
    {
        id: 1,
        name: 'Aarav Sharma',
        phone: '9876543210',
        email: 'aarav@email.com',
        parentName: 'Rajesh Sharma',
        parentPhone: '9876543200',
        studentClass: '10th',
        address: '12, MG Road, Indore',
        branch: 'Vijay Nagar',
        status: 'enquiry',
        registeredBy: 'receptionist',
        createdAt: '2026-03-01T10:30:00',
    },
    {
        id: 2,
        name: 'Priya Patel',
        phone: '9123456789',
        email: 'priya@email.com',
        parentName: 'Amit Patel',
        parentPhone: '9123456780',
        studentClass: '12th',
        address: '45, Palasia, Indore',
        branch: 'Palasia',
        status: 'demo_scheduled',
        registeredBy: 'receptionist',
        createdAt: '2026-03-02T11:00:00',
    },
    {
        id: 3,
        name: 'Rahul Verma',
        phone: '9988776655',
        email: 'rahul@email.com',
        parentName: 'Suresh Verma',
        parentPhone: '9988776600',
        studentClass: '9th',
        address: '78, Sapna Sangeeta, Indore',
        branch: 'Sapna Sangeeta',
        status: 'admitted',
        registeredBy: 'receptionist',
        createdAt: '2026-02-25T09:15:00',
    },
    {
        id: 4,
        name: 'Sneha Gupta',
        phone: '9876012345',
        email: 'sneha@email.com',
        parentName: 'Manoj Gupta',
        parentPhone: '9876012300',
        studentClass: '11th',
        address: '23, Scheme No 54, Indore',
        branch: 'Vijay Nagar',
        status: 'active',
        registeredBy: 'receptionist',
        createdAt: '2026-02-20T14:45:00',
    },
    {
        id: 5,
        name: 'Arjun Kumar',
        phone: '9012345678',
        email: 'arjun@email.com',
        parentName: 'Vikram Kumar',
        parentPhone: '9012345600',
        studentClass: '8th',
        address: '56, AB Road, Indore',
        branch: 'Palasia',
        status: 'demo_scheduled',
        registeredBy: 'receptionist',
        createdAt: '2026-03-03T16:20:00',
    },
]

export function StudentProvider({ children }) {
    const [students, setStudents] = useState(initialStudents)

    const addStudent = (studentData) => {
        const newStudent = {
            ...studentData,
            id: Date.now(),
            status: 'enquiry',
            registeredBy: 'receptionist',
            createdAt: new Date().toISOString(),
        }
        setStudents((prev) => [newStudent, ...prev])
        return newStudent
    }

    const updateStudent = (id, updates) => {
        setStudents((prev) =>
            prev.map((s) => (s.id === id ? { ...s, ...updates } : s))
        )
    }

    const getStudentById = (id) => {
        return students.find((s) => s.id === Number(id))
    }

    return (
        <StudentContext.Provider value={{ students, addStudent, updateStudent, getStudentById }}>
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
