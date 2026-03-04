import './App.css'
import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { StudentProvider } from './context/StudentContext'
import { DemoProvider } from './context/DemoContext'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './pages/receptionist/Dashboard'
import StudentList from './pages/receptionist/StudentList'
import AddStudent from './pages/receptionist/AddStudent'
import StudentDetail from './pages/receptionist/StudentDetail'
import DemoList from './pages/receptionist/DemoList'
import MarkAttendance from './pages/receptionist/MarkAttendance'
import AdminDashboard from './pages/admin/Dashboard'

function App() {
  return (
    <AuthProvider>
      <StudentProvider>
        <DemoProvider>
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
                <Route path="students" element={<StudentList />} />
                <Route path="students/add" element={<AddStudent />} />
                <Route path="students/:id" element={<StudentDetail />} />
                <Route path="demos" element={<DemoList />} />
                <Route path="demos/:studentId" element={<MarkAttendance />} />
              </Route>

              {/* Protected admin route */}
              <Route
                path="/admin/dashboard"
                element={
                  <ProtectedRoute>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* Catch-all → redirect to login */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </BrowserRouter>
        </DemoProvider>
      </StudentProvider>
    </AuthProvider>
  )
}

export default App