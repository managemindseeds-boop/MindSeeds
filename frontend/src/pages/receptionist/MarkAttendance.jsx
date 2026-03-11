import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDemos } from '../../context/DemoContext'
import {
    PiArrowLeft, PiCheckCircle, PiXCircle, PiArrowCounterClockwise,
    PiPencilSimpleLine, PiCheck, PiX, PiClock, PiBook
} from 'react-icons/pi'
import RescheduleModal from '../../components/Demos/RescheduleModal'
import EditDemoModal from '../../components/Demos/EditDemoModal'

function MarkAttendance() {
    const { studentId } = useParams()
    const navigate = useNavigate()
    const { getDemosByStudent, markAttendance, rescheduleDemo, updateDemo } = useDemos()
    const [demos, setDemos] = useState([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [rescheduleTarget, setRescheduleTarget] = useState(null)
    const [editTarget, setEditTarget] = useState(null)

    const fetchStudentDemos = useCallback(async () => {
        setLoading(true)
        try {
            const data = await getDemosByStudent(studentId)
            setDemos(data)
        } catch (err) {
            setError('Failed to load demos')
        } finally {
            setLoading(false)
        }
    }, [studentId, getDemosByStudent])

    useEffect(() => {
        fetchStudentDemos()
    }, [fetchStudentDemos])

    const handleMarkPresent = async (demoId) => {
        try {
            await markAttendance(demoId, true)
            fetchStudentDemos() // Refresh local list
        } catch (err) {
            alert(err.message)
        }
    }

    const handleMarkAbsent = async (demoId) => {
        try {
            await markAttendance(demoId, false)
            fetchStudentDemos() // Refresh local list
            const demo = demos.find((d) => d.id === demoId)
            setRescheduleTarget(demo)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleReschedule = async (demoId, newDate, notes) => {
        try {
            await rescheduleDemo(demoId, newDate, notes)
            fetchStudentDemos()
            setRescheduleTarget(null)
        } catch (err) {
            alert(err.message)
        }
    }

    const handleEdit = async (demoId, fields) => {
        try {
            await updateDemo(demoId, fields)
            fetchStudentDemos()
        } catch (err) {
            alert(err.message)
        }
    }

    if (loading && demos.length === 0) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black"></div>
            </div>
        )
    }

    if (demos.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-500 mb-4">No demos found for this student</p>
                <button
                    onClick={() => navigate('/receptionist/demos')}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm cursor-pointer"
                >
                    Back to Demos
                </button>
            </div>
        )
    }

    const studentName = demos[0]?.studentName || 'Student'
    const studentClass = demos[0]?.studentClass || ''
    // IST mein aaj ki date (UTC+5:30) — demo scheduledDate bhi IST mein hai
    const today = new Date(Date.now() + 5.5 * 60 * 60 * 1000).toISOString().split('T')[0]

    const formatDate = (dateStr) => {
        if (!dateStr) return ''
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        })
    }

    const getStatusIcon = (demo) => {
        if (demo.attended === true) return <PiCheck size={16} className="text-white" />
        if (demo.attended === false) return <PiX size={16} className="text-white" />
        return <span className="text-xs font-bold text-gray-400">{demo.lectureNumber}</span>
    }

    const getStatusBg = (demo) => {
        if (demo.attended === true) return 'bg-emerald-500'
        if (demo.attended === false) return 'bg-red-500'
        return 'bg-white border-2 border-gray-300'
    }

    const getStatusLabel = (demo) => {
        if (demo.attended === true) return 'Attended'
        if (demo.attended === false) return 'Absent'
        if (demo.scheduledDate === today) return 'Today'
        return 'Upcoming'
    }

    const getStatusColor = (demo) => {
        if (demo.attended === true) return 'text-emerald-600'
        if (demo.attended === false) return 'text-red-600'
        if (demo.scheduledDate === today) return 'text-amber-600'
        return 'text-gray-400'
    }

    return (
        <div className="max-w-3xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/receptionist/demos')}
                    className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                    <PiArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">{studentName}</h1>
                    <p className="text-sm text-gray-500">{studentClass} • Demo Attendance</p>
                </div>
            </div>

            {/* Horizontal Stepper */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <div className="flex items-center justify-between relative">
                    {/* Connecting line */}
                    <div className="absolute top-5 left-[12%] right-[12%] h-0.5 bg-gray-200 z-0" />

                    {demos.map((demo) => (
                        <div key={demo.id} className="flex flex-col items-center relative z-10 flex-1">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${getStatusBg(demo)}`}>
                                {getStatusIcon(demo)}
                            </div>
                            <p className="text-xs font-medium text-gray-900 mt-2">Lecture {demo.lectureNumber}</p>
                            <p className="text-[10px] text-gray-500">{formatDate(demo.scheduledDate)}</p>
                            {demo.subject && (
                                <p className="text-[10px] text-emerald-600 font-medium mt-0.5 px-1 text-center">{demo.subject}</p>
                            )}
                            <span className={`text-[10px] font-medium mt-0.5 ${getStatusColor(demo)}`}>
                                {getStatusLabel(demo)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lecture Cards — 2×2 grid matching AddStudent page 2 */}
            <div className="grid grid-cols-1 gap-3">
                {demos.map((demo) => {
                    const isToday = demo.scheduledDate === today
                    const isPending = demo.attended === null

                    // Derive weekday from date string
                    const weekday = demo.scheduledDate
                        ? new Date(demo.scheduledDate + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'long' })
                        : ''
                    const fullDate = demo.scheduledDate
                        ? new Date(demo.scheduledDate + 'T00:00:00').toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })
                        : ''

                    return (
                        <div
                            key={demo.id}
                            className="flex items-start gap-3 p-3 rounded-xl border border-black bg-gray-50"
                        >
                            {/* Black square day badge */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center w-11 h-11 bg-black text-white rounded-lg text-xs font-bold leading-tight">
                                <span className="text-[10px] font-normal opacity-60">Day</span>
                                <span>{demo.lectureNumber}</span>
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                {/* Date + edit */}
                                <div className="flex items-start justify-between gap-1">
                                    <div>
                                        <p className="text-sm font-semibold text-gray-900 leading-snug">{fullDate}</p>
                                        <p className="text-xs text-gray-400">{weekday}</p>
                                    </div>
                                    {demo.attended !== true && (
                                        <button
                                            onClick={() => setEditTarget(demo)}
                                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-white rounded-md transition-colors cursor-pointer shrink-0"
                                            title="Edit"
                                        >
                                            <PiPencilSimpleLine size={14} />
                                        </button>
                                    )}
                                </div>

                                {/* Subject pill + TODAY */}
                                <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                                    {demo.subject && (
                                        <span className="flex items-center gap-1 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                            <PiBook size={11} /> {demo.subject}
                                        </span>
                                    )}
                                    {isToday && isPending && (
                                        <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">TODAY</span>
                                    )}
                                </div>

                                {/* Notes */}
                                {demo.notes && (
                                    <p className="text-[11px] text-gray-400 mt-1 leading-snug">{demo.notes}</p>
                                )}

                                {/* Actions */}
                                <div className="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-gray-200">
                                    {demo.attended === true && (
                                        <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                                            <PiCheckCircle size={14} /> Present
                                        </span>
                                    )}
                                    {demo.attended === false && (
                                        <div className="flex items-center gap-2 w-full justify-between">
                                            <span className="flex items-center gap-1 text-xs font-medium text-red-500">
                                                <PiXCircle size={14} /> Absent
                                            </span>
                                            <button
                                                onClick={() => setRescheduleTarget(demo)}
                                                className="flex items-center gap-1 px-2 py-1 bg-white border border-gray-200 rounded-md text-xs text-gray-500 hover:bg-gray-100 transition-colors cursor-pointer"
                                            >
                                                <PiArrowCounterClockwise size={12} /> Reschedule
                                            </button>
                                        </div>
                                    )}
                                    {isPending && isToday && (
                                        <div className="flex items-center gap-1.5 w-full">
                                            <button
                                                onClick={() => handleMarkPresent(demo.id)}
                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-emerald-500 text-white rounded-md text-xs font-medium hover:bg-emerald-600 transition-colors cursor-pointer"
                                            >
                                                <PiCheck size={13} /> Present
                                            </button>
                                            <button
                                                onClick={() => handleMarkAbsent(demo.id)}
                                                className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-red-500 text-white rounded-md text-xs font-medium hover:bg-red-600 transition-colors cursor-pointer"
                                            >
                                                <PiX size={13} /> Absent
                                            </button>
                                        </div>
                                    )}
                                    {isPending && !isToday && (
                                        <span className="flex items-center gap-1 text-xs text-gray-400">
                                            <PiClock size={13} /> Upcoming
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>


            {/* Reschedule Modal */}
            {rescheduleTarget && (
                <RescheduleModal
                    demo={rescheduleTarget}
                    onConfirm={(id, date, notes) => handleReschedule(id, date, notes)}
                    onClose={() => setRescheduleTarget(null)}
                />
            )}
            {editTarget && (
                <EditDemoModal
                    demo={editTarget}
                    onConfirm={handleEdit}
                    onClose={() => setEditTarget(null)}
                />
            )}
        </div>
    )
}


export default MarkAttendance
