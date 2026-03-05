import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useDemos } from '../../context/DemoContext'
import { useStudents } from '../../context/StudentContext'
import {
    CalendarCheck,
    Clock,
    UserPlus,
    Phone,
    CalendarClock,
    ChevronRight,
    AlertCircle,
    CheckCircle2,
} from 'lucide-react'

function DemoList() {
    const navigate = useNavigate()
    const { getTodaysDemos, getUpcomingDemos, getAbsentDemos, scheduleDemos, hasStudentDemos } =
        useDemos()
    const { students, updateStudent } = useStudents()
    const [showSchedule, setShowSchedule] = useState(false)

    const todayDemos = getTodaysDemos()
    const upcomingDemos = getUpcomingDemos()
    const absentDemos = getAbsentDemos()

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

    const formatShortDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
        })
    }

    const today = new Date().toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    })

    return (
        <div className="space-y-6 max-w-3xl mx-auto">

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
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">
                        Select Student to Schedule Demos
                    </h3>
                    {schedulableStudents.length === 0 ? (
                        <p className="text-sm text-gray-400">
                            No students available for scheduling. Students must be in "Enquiry" status.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {schedulableStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors"
                                >
                                    <div>
                                        <p className="text-sm font-medium text-gray-900">{student.name}</p>
                                        <p className="text-xs text-gray-500">
                                            {student.studentClass} • {student.branch}
                                        </p>
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

            {/* ── STEP 1: Urgent Action Required ── */}
            {absentDemos.length > 0 && (
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <span className="flex items-center justify-center w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold">1</span>
                        <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Action Required</h2>
                    </div>
                    <div className="space-y-3">
                        {absentDemos.map((demo) => (
                            <div
                                key={demo.id}
                                className="bg-red-50 border border-red-200 rounded-xl p-4"
                            >
                                <div className="flex items-start gap-3">
                                    <AlertCircle size={20} className="text-red-500 mt-0.5 shrink-0" />
                                    <div className="flex-1">
                                        <p className="text-sm font-semibold text-gray-900">{demo.studentName} was absent</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Lecture {demo.lectureNumber} •{' '}
                                            {formatDate(demo.scheduledDate)}
                                            {demo.notes && ` • ${demo.notes}`}
                                        </p>
                                        <div className="flex gap-2 mt-3">
                                            <button
                                                onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors cursor-pointer"
                                            >
                                                <Phone size={12} />
                                                Call Now
                                            </button>
                                            <button
                                                onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                                                className="flex items-center gap-1.5 px-3 py-1.5 border border-red-400 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors cursor-pointer"
                                            >
                                                <CalendarClock size={12} />
                                                Reschedule
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* ── STEP 2: Today's Demos ── */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-emerald-500 text-white text-xs font-bold">
                        {absentDemos.length > 0 ? '2' : '1'}
                    </span>
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Today's Demos</h2>
                    <span className="ml-1 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-xs font-medium">
                        {todayDemos.length}
                    </span>
                    <span className="ml-auto text-xs text-gray-400 flex items-center gap-1">
                        <CalendarCheck size={13} className="text-emerald-400" />
                        {today}
                    </span>
                </div>

                {todayDemos.length === 0 ? (
                    <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-200 text-sm text-gray-400">
                        <CheckCircle2 size={18} className="text-gray-300" />
                        No demos scheduled for today — you're all clear!
                    </div>
                ) : (
                    <div className="space-y-3">
                        {todayDemos.map((demo) => (
                            <div
                                key={demo.id}
                                onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                                className="bg-white rounded-xl border border-emerald-100 p-4 hover:shadow-md transition-shadow cursor-pointer flex items-center justify-between group"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900">{demo.studentName}</p>
                                        <p className="text-xs text-gray-500 mt-0.5">
                                            Class {demo.studentClass} &nbsp;•&nbsp; Lecture {demo.lectureNumber}/4
                                        </p>
                                    </div>
                                </div>
                                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                            </div>
                        ))}
                    </div>
                )}
            </section>

            {/* ── STEP 3: Upcoming Demos ── */}
            <section>
                <div className="flex items-center gap-2 mb-3">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-500 text-white text-xs font-bold">
                        {absentDemos.length > 0 ? '3' : '2'}
                    </span>
                    <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Upcoming</h2>
                    <span className="ml-1 px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-medium">
                        {upcomingDemos.length}
                    </span>
                </div>

                {upcomingDemos.length === 0 ? (
                    <div className="p-4 bg-white rounded-xl border border-gray-200 text-sm text-gray-400">
                        No upcoming demos scheduled
                    </div>
                ) : (
                    <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100 overflow-hidden">
                        {upcomingDemos.map((demo) => (
                            <div
                                key={demo.id}
                                onClick={() => navigate(`/receptionist/demos/${demo.studentId}`)}
                                className="flex items-center gap-4 px-4 py-3 hover:bg-gray-50 transition-colors cursor-pointer group"
                            >
                                {/* Date Badge */}
                                <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-blue-50 shrink-0">
                                    <span className="text-base font-bold text-blue-600 leading-none">
                                        {new Date(demo.scheduledDate).getDate()}
                                    </span>
                                    <span className="text-[10px] text-blue-400 uppercase tracking-wide mt-0.5">
                                        {new Date(demo.scheduledDate).toLocaleDateString('en-IN', { month: 'short' })}
                                    </span>
                                </div>

                                {/* Info */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 truncate">{demo.studentName}</p>
                                    <p className="text-xs text-gray-500 mt-0.5">
                                        Class {demo.studentClass} &nbsp;•&nbsp; Lecture {demo.lectureNumber}/4
                                    </p>
                                </div>

                                <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors shrink-0" />
                            </div>
                        ))}
                    </div>
                )}
            </section>
        </div>
    )
}

export default DemoList
