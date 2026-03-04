import './App.css'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './pages/receptionist/Dashboard'

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<Login />} />

          {/* Protected receptionist routes */}
          <Route
            path="/receptionist"
            element={
              <ProtectedRoute>
                <MainLayout />
              </ProtectedRoute>
            }
          >
            <Route path="dashboard" element={<Dashboard />} />
            {/* Future: students, demos, admissions, fees */}
          </Route>

          {/* Catch-all → redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App