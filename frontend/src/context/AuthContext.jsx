import { createContext, useContext, useState, useEffect } from 'react'

const AuthContext = createContext(null)

// Mock credentials — replace with API call when backend is ready
const MOCK_USERS = [
    { username: 'receptionist', password: 'mind123', role: 'receptionist', name: 'Receptionist' },
]

export function AuthProvider({ children }) {
    const [currentUser, setCurrentUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // Restore session from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem('mindseeds_user')
        if (saved) {
            try {
                setCurrentUser(JSON.parse(saved))
            } catch {
                localStorage.removeItem('mindseeds_user')
            }
        }
        setLoading(false)
    }, [])

    const login = (username, password) => {
        const user = MOCK_USERS.find(
            (u) => u.username === username && u.password === password
        )
        if (!user) {
            return { success: false, message: 'Invalid username or password' }
        }
        const userData = { username: user.username, role: user.role, name: user.name }
        setCurrentUser(userData)
        localStorage.setItem('mindseeds_user', JSON.stringify(userData))
        return { success: true, role: user.role }
    }

    const logout = () => {
        setCurrentUser(null)
        localStorage.removeItem('mindseeds_user')
    }

    return (
        <AuthContext.Provider value={{ currentUser, loading, login, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
