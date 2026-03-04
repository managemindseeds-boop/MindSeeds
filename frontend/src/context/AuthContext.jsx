import { createContext, useContext, useState, useEffect } from 'react'
import axios from 'axios'

const AuthContext = createContext(null)

// Mock credentials — replace with API call when backend is ready
const MOCK_USERS = [
    { username: 'receptionist', password: 'Recept@123', role: 'receptionist', name: 'Receptionist' },
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

    const login = async (username, password) => {
        try {
            const response = await axios.post('http://localhost:8000/api/v1/auth/login', {
                username,
                password
            })

            // Backend uses ApiResponse wrapper: { statusCode, data: { token, role, username }, message }
            const payload = response.data.data
            const userData = {
                username: payload.username,
                role: payload.role,
                name: payload.username, // backend doesn't return name separately
                token: payload.token
            }

            setCurrentUser(userData)
            localStorage.setItem('mindseeds_user', JSON.stringify(userData))
            return { success: true, role: payload.role }
        } catch (error) {
            console.error('Login error:', error)

            if (!error.response) {
                // Connection error — Check mock fallback for easier development
                const mockUser = MOCK_USERS.find(
                    (u) => u.username === username && u.password === password
                )

                if (mockUser) {
                    const userData = { username: mockUser.username, role: mockUser.role, name: mockUser.name }
                    setCurrentUser(userData)
                    localStorage.setItem('mindseeds_user', JSON.stringify(userData))
                    return { success: true, role: mockUser.role, isMock: true }
                }

                return {
                    success: false,
                    message: 'Cannot connect to server (ERR_CONNECTION_REFUSED). Please ensure Backend is running on port 8000.'
                }
            }

            const message = error.response.data?.message || 'Invalid username or password'
            return { success: false, message }
        }
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
