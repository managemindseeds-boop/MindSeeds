import './index.css'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { DashboardProvider } from './context/DashboardContext'
import { NotificationProvider } from './context/NotificationContext'
import { AdminProvider } from './context/AdminContext'
import { AdminNotificationProvider } from './context/AdminNotificationContext'
import Login from './pages/Login'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './components/Layout/MainLayout'
import Dashboard from './pages/receptionist/Dashboard'
import StudentList from './pages/receptionist/StudentList'
import AddStudent from './pages/receptionist/AddStudent'
import StudentDetail from './pages/receptionist/StudentDetail'
import DemoList from './pages/receptionist/DemoList'
import MarkAttendance from './pages/receptionist/MarkAttendance'
import DailyAttendance from './pages/receptionist/DailyAttendance'
import FeeManagement from './pages/receptionist/FeeManagement'

import AdminLayout from './components/Layout/AdminLayout'
import AdminDashboard from './pages/admin/Dashboard'
import AdminStaffList from './pages/admin/StaffList'
import AdminStudentList from './pages/admin/StudentList'
import AdminStudentDetail from './pages/admin/StudentDetail'
import AdminDemoOverview from './pages/admin/DemoOverview'

function App() {
  return (
    <AuthProvider>
      <DashboardProvider>
        <NotificationProvider>
          <AdminProvider>
            <AdminNotificationProvider>
              <BrowserRouter>
                <Routes>
                  {/* Public route */}
                  <Route path="/login" element={<Login />} />

                  {/* Protected receptionist routes */}
                  <Route
                    path="/receptionist"
                    element={
                      <ProtectedRoute allowedRoles={['receptionist']}>
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
                    <Route path="attendance" element={<DailyAttendance />} />
                    <Route path="fees" element={<FeeManagement />} />
                  </Route>

                  {/* Protected admin routes */}
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute allowedRoles={['admin']}>
                        <AdminLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route path="dashboard" element={<AdminDashboard />} />
                    <Route path="students" element={<AdminStudentList />} />
                    <Route path="students/:id" element={<AdminStudentDetail />} />
                    <Route path="demos" element={<AdminDemoOverview />} />
                    <Route path="staff" element={<AdminStaffList />} />
                  </Route>

                  {/* Catch-all → redirect to login */}
                  <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
              </BrowserRouter>
            </AdminNotificationProvider>
          </AdminProvider>
        </NotificationProvider>
      </DashboardProvider>
    </AuthProvider >
  )
}

export default App


