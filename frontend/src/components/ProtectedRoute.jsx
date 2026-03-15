import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

function ProtectedRoute({ children, allowedRoles }) {
    const { currentUser, loading } = useAuth()

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-black border-t-transparent"></div>
            </div>
        )
    }

    if (!currentUser) {
        return <Navigate to="/login" replace />
    }

    if (allowedRoles && !allowedRoles.includes(currentUser.role)) {
        // Redirect based on role if they try to access unauthorized routes
        if (currentUser.role === 'admin') {
            return <Navigate to="/admin/dashboard" replace />
        }
        return <Navigate to="/receptionist/dashboard" replace />
    }

    return children
}

export default ProtectedRoute
