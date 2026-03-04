import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemos } from '../../context/DemoContext'
import { useStudents } from '../../context/StudentContext'
import { CalendarCheck, AlertTriangle, Clock, ChevronRight, UserPlus } from 'lucide-react'

function DemoList() {
    const navigate = useNavigate()
    const { getTodaysDemos, getUpcomingDemos, getAbsentDemos, scheduleDemos, hasStudentDemos } = useDemos()
    const { students, updateStudent } = useStudents()
    const [showSchedule, setShowSchedule] = useState(false)

    const todayDemos = getTodaysDemos()
    const upcomingDemos = getUpcomingDemos()
    const absentDemos = getAbsentDemos()

    // Students that can be scheduled (enquiry status, no demos yet)
    const schedulableStudents = students.filter(
        (s) => s.status === 'enquiry' && !hasStudentDemos(s.id)
    )

    const handleSchedule = (student) => {
        scheduleDemos(student)
        updateStudent(student.id, { status: 'demo_scheduled' })
        setShowSchedule(false)
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
    }

    return (
        <div className="space-y-5">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Demo Lectures</h1>
                    <p className="text-sm text-gray-500 mt-0.5">Manage demo schedules and attendance</p>
                </div>
                <button
                    onClick={() => setShowSchedule(!showSchedule)}
                    className="flex items-center gap-2 px-4 py-2.5 bg-black text-white rounded-lg hover:bg-gray-800 transition-colors text-sm font-medium cursor-pointer"
                >
                    <UserPlus size={16} />
                    Schedule Demo
                </button>
            </div>

            {/* Schedule Student Selector */}
            {showSchedule && (
                <div className="bg-white rounded-xl border border-gray-200 p-5">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Select Student to Schedule Demos</h3>
                    {schedulableStudents.length === 0 ? (
                        <p className="text-sm text-gray-400">No students available for scheduling. Students must be in "Enquiry" status.</p>
                    ) : (
                        <div className="space-y-2">
                            {schedulableStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                        <p className="text-xs text-gray-500">{student.studentClass} • {student.branch}</p>
                                    </div>
                                    <button
                                        onClick={() => handleSchedule(student)}
                                        className="px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors cursor-pointer"
                                    >
                                        Schedule 4 Demos
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* Absent Alerts */}
            {absentDemos.length > 0 && (
                <div className="bg-red-50 rounded-xl border border-red-200 p-4">
                    <div className="flex items-center gap-2 mb-3">
                        <AlertTriangle size={16} className="text-red-500" />
                        <h3 className="text-sm font-semibold text-red-700">Action Required — Absent Students</h3>
                    </div>
                    <div className="space-y-2">
                        {absentDemos.map((demo) => (
                            <div
                                key={demo.id}
                                onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                                className="flex items-center justify-between p-3 bg-white rounded-lg border border-red-100 cursor-pointer hover:shadow-sm transition-shadow"
                            >
                                <div>
                                    <p className="text-sm font-medium text-gray-900">{demo.studentName}</p>
                                    <p className="text-xs text-gray-500">
                                        Lecture {demo.lectureNumber} • {formatDate(demo.scheduledDate)}
                                        {demo.notes && ` • ${demo.notes}`}
                                    </p>
                                </div>
                                <span className="text-xs text-red-600 font-medium">Call & Reschedule →</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Today's Demos */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <CalendarCheck size={16} className="text-emerald-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Today's Demos</h3>
                    <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">{todayDemos.length}</span>
                </div>
                {todayDemos.length === 0 ? (
                    <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-4">No demos scheduled for today</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {todayDemos.map((demo) => (
                            <DemoCard
                                key={demo.id}
                                demo={demo}
                                onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Upcoming Demos */}
            <div>
                <div className="flex items-center gap-2 mb-3">
                    <Clock size={16} className="text-blue-500" />
                    <h3 className="text-sm font-semibold text-gray-800">Upcoming</h3>
                    <span className="px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">{upcomingDemos.length}</span>
                </div>
                {upcomingDemos.length === 0 ? (
                    <p className="text-sm text-gray-400 bg-white rounded-xl border border-gray-200 p-4">No upcoming demos</p>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {upcomingDemos.map((demo) => (
                            <DemoCard
                                key={demo.id}
                                demo={demo}
                                onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}

function DemoCard({ demo, onClick }) {
    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        })
    }

    return (
        <div
            onClick={onClick}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between"
        >
            <div>
                <p className="text-sm font-medium text-gray-900">{demo.studentName}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                    {demo.studentClass} • Lecture {demo.lectureNumber}/4 • {formatDate(demo.scheduledDate)}
                </p>
            </div>
            <ChevronRight size={16} className="text-gray-300" />
        </div>
    )
}

export default DemoList
