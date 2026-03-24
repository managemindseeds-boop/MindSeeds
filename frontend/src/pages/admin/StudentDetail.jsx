import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useAdmin } from '../../context/AdminContext'
import {
    ArrowLeft, RefreshCw, User, Phone, Mail, MapPin, BookOpen,
    Calendar, CheckCircle2, XCircle, Clock, BarChart3
} from 'lucide-react'

const statusLabels = {
    enquiry: 'Enquiry',
    demo_scheduled: 'Demo Scheduled',
    demo_completed: 'Demo Completed',
    admitted: 'Admitted',
}
const statusColors = {
    enquiry: 'bg-blue-50 text-blue-700 border-blue-200',
    demo_scheduled: 'bg-amber-50 text-amber-700 border-amber-200',
    demo_completed: 'bg-purple-50 text-purple-700 border-purple-200',
    admitted: 'bg-emerald-50 text-emerald-700 border-emerald-200',
}

function AdminStudentDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { fetchStudentDetail } = useAdmin()

    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const loadData = async () => {
        setLoading(true)
        try {
            const detail = await fetchStudentDetail(id)
            setData(detail)
            setError(null)
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to load student')
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => {
        loadData()
    }, [id])

    // Auto-refresh every 30s
    useEffect(() => {
        const interval = setInterval(loadData, 30000)
        return () => clearInterval(interval)
    }, [id])

    if (loading && !data) {
        return (
            <div className="flex items-center justify-center h-64">
                <RefreshCw className="animate-spin text-blue-500" size={28} />
            </div>
        )
    }

    if (error) {
        return (
            <div className="text-center py-10">
                <p className="text-red-600 mb-4">{error}</p>
                <button onClick={() => navigate('/admin/students')} className="text-blue-600 hover:underline text-sm cursor-pointer">
                    ← Back to Students
                </button>
            </div>
        )
    }

    const student = data?.student
    const demos = data?.demos || []
    const attendance = data?.attendance || {}
    const stats = attendance.stats || {}

    // IST date formatter
    const IST_OFFSET = 5.5 * 60 * 60 * 1000
    const formatDate = (d) => {
        if (!d) return '—'
        const ist = new Date(new Date(d).getTime() + IST_OFFSET)
        return ist.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <button
                    onClick={() => navigate('/admin/students')}
                    className="p-2 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer shadow-sm"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-gray-900">{student?.fullName || 'Student Detail'}</h1>
                    <p className="text-sm text-gray-500 mt-0.5">
                        {student?.branch} · {student?.class}
                        {loading && <span className="ml-2 text-blue-500 text-xs">(refreshing...)</span>}
                    </p>
                </div>
                <button onClick={loadData} className="p-2 bg-white border border-gray-200 text-gray-600 rounded-lg hover:bg-gray-50 cursor-pointer shadow-sm">
                    <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                </button>
            </div>

            {/* Student Info Card */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                <div className="flex flex-col sm:flex-row sm:items-start gap-6">
                    {/* Avatar */}
                    <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-700 font-bold text-2xl uppercase flex-shrink-0">
                        {student?.fullName?.charAt(0) || '?'}
                    </div>

                    {/* Info Grid */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 flex-1">
                        <div className="flex items-center gap-2.5">
                            <Phone size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Phone</p>
                                <p className="text-sm font-medium text-gray-900">{student?.phone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Mail size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Email</p>
                                <p className="text-sm font-medium text-gray-900">{student?.email || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <MapPin size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Address</p>
                                <p className="text-sm font-medium text-gray-900">{student?.address || '—'}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <User size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Parent</p>
                                <p className="text-sm font-medium text-gray-900">{student?.parentName} · {student?.parentPhone}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <Calendar size={16} className="text-gray-400" />
                            <div>
                                <p className="text-xs text-gray-500">Registered</p>
                                <p className="text-sm font-medium text-gray-900">{formatDate(student?.createdAt)}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2.5">
                            <div className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[student?.status] || 'bg-gray-100 text-gray-600'}`}>
                                {statusLabels[student?.status] || student?.status}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Two-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Demo Lectures Timeline */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <BookOpen size={18} className="text-blue-600" />
                        <h2 className="text-lg font-bold text-gray-900">Demo Lectures</h2>
                    </div>

                    {demos.length === 0 ? (
                        <p className="text-sm text-gray-400 text-center py-6">No demo lectures found</p>
                    ) : (
                        <div className="space-y-4">
                            {demos.map((demo, idx) => (
                                <div key={demo._id || idx} className="flex items-start gap-4 relative">
                                    {/* Timeline line */}
                                    {idx < demos.length - 1 && (
                                        <div className="absolute left-[17px] top-10 w-0.5 h-[calc(100%+4px)] bg-gray-200" />
                                    )}

                                    {/* Status dot */}
                                    <div className={`w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 z-10 ${
                                        demo.attended === true ? 'bg-emerald-100 text-emerald-600'
                                        : demo.attended === false ? 'bg-red-100 text-red-600'
                                        : 'bg-gray-100 text-gray-400'
                                    }`}>
                                        {demo.attended === true ? <CheckCircle2 size={18} />
                                        : demo.attended === false ? <XCircle size={18} />
                                        : <Clock size={18} />}
                                    </div>

                                    {/* Demo info */}
                                    <div className="flex-1 pb-4">
                                        <div className="flex items-center justify-between">
                                            <p className="text-sm font-semibold text-gray-900">
                                                Demo #{demo.lectureNumber}
                                                {demo.subject && <span className="text-gray-500 font-normal"> · {demo.subject}</span>}
                                            </p>
                                            <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                demo.attended === true ? 'bg-emerald-50 text-emerald-700'
                                                : demo.attended === false ? 'bg-red-50 text-red-700'
                                                : 'bg-gray-50 text-gray-600'
                                            }`}>
                                                {demo.attended === true ? 'Attended'
                                                : demo.attended === false ? 'Absent'
                                                : 'Pending'}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            Scheduled: {formatDate(demo.scheduledDate)}
                                        </p>
                                        {demo.notes && (
                                            <p className="text-xs text-gray-400 mt-1 italic">{demo.notes}</p>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Attendance Summary */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                    <div className="flex items-center gap-2 mb-5">
                        <BarChart3 size={18} className="text-indigo-600" />
                        <h2 className="text-lg font-bold text-gray-900">Attendance Summary</h2>
                    </div>

                    {stats.total === 0 || !stats.total ? (
                        <p className="text-sm text-gray-400 text-center py-6">No attendance records found</p>
                    ) : (
                        <>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-3 gap-3 mb-6">
                                <div className="bg-gray-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                                    <p className="text-xs text-gray-500">Total Days</p>
                                </div>
                                <div className="bg-emerald-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-emerald-700">{stats.present}</p>
                                    <p className="text-xs text-emerald-600">Present</p>
                                </div>
                                <div className="bg-red-50 rounded-lg p-4 text-center">
                                    <p className="text-2xl font-bold text-red-700">{stats.absent}</p>
                                    <p className="text-xs text-red-600">Absent</p>
                                </div>
                            </div>

                            {/* Progress bar */}
                            <div className="mb-2">
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="text-gray-600">Attendance Rate</span>
                                    <span className="font-bold text-gray-900">{stats.percentage}%</span>
                                </div>
                                <div className="w-full bg-gray-100 rounded-full h-3">
                                    <div
                                        className={`h-3 rounded-full transition-all duration-500 ${
                                            stats.percentage >= 75 ? 'bg-emerald-500'
                                            : stats.percentage >= 50 ? 'bg-amber-500'
                                            : 'bg-red-500'
                                        }`}
                                        style={{ width: `${stats.percentage}%` }}
                                    />
                                </div>
                            </div>

                            {/* Recent attendance records */}
                            {(attendance.records || []).length > 0 && (
                                <div className="mt-6">
                                    <p className="text-sm font-medium text-gray-700 mb-3">Recent Records</p>
                                    <div className="space-y-2 max-h-48 overflow-y-auto">
                                        {(attendance.records || []).slice(0, 15).map((r, i) => (
                                            <div key={i} className="flex items-center justify-between p-2 rounded-lg hover:bg-gray-50">
                                                <span className="text-sm text-gray-700">
                                                    {formatDate(r.date)}
                                                </span>
                                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                                    r.status === 'present' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                                                }`}>
                                                    {r.status === 'present' ? 'Present' : 'Absent'}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}

export default AdminStudentDetail
