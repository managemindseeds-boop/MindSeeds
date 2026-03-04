import { useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDemos } from '../../context/DemoContext'
import { ArrowLeft, Check, X, RotateCcw } from 'lucide-react'
import RescheduleModal from '../../components/Demos/RescheduleModal'

function MarkAttendance() {
    const { studentId } = useParams()
    const navigate = useNavigate()
    const { getDemosByStudent, markAttendance, rescheduleDemo } = useDemos()
    const [rescheduleTarget, setRescheduleTarget] = useState(null)

    const demos = getDemosByStudent(studentId)

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

    const studentName = demos[0].studentName
    const studentClass = demos[0].studentClass
    const today = new Date().toISOString().split('T')[0]

    const handleMarkPresent = (demoId) => {
        markAttendance(demoId, true)
    }

    const handleMarkAbsent = (demoId) => {
        markAttendance(demoId, false)
        const demo = demos.find((d) => d.id === demoId)
        setRescheduleTarget(demo)
    }

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
        })
    }

    const getStatusIcon = (demo) => {
        if (demo.attended === true) return <Check size={16} className="text-white" />
        if (demo.attended === false) return <X size={16} className="text-white" />
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
                    <ArrowLeft size={20} />
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
                            <span className={`text-[10px] font-medium mt-0.5 ${getStatusColor(demo)}`}>
                                {getStatusLabel(demo)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Lecture Cards */}
            <div className="space-y-3">
                {demos.map((demo) => {
                    const isToday = demo.scheduledDate === today
                    const isPending = demo.attended === null

                    return (
                        <div
                            key={demo.id}
                            className={`bg-white rounded-xl border p-4 flex items-center justify-between
                                ${isToday && isPending ? 'border-amber-300 bg-amber-50/30' : 'border-gray-200'}
                                ${demo.attended === false ? 'border-red-200 bg-red-50/30' : ''}`}
                        >
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium text-gray-900">Lecture {demo.lectureNumber}</p>
                                    {isToday && isPending && (
                                        <span className="px-2 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-medium">TODAY</span>
                                    )}
                                </div>
                                <p className="text-xs text-gray-500 mt-0.5">{formatDate(demo.scheduledDate)}</p>
                                {demo.notes && (
                                    <p className="text-xs text-gray-400 mt-1">Note: {demo.notes}</p>
                                )}
                            </div>

                            <div className="flex items-center gap-2">
                                {demo.attended === true && (
                                    <span className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-medium">
                                        ✅ Present
                                    </span>
                                )}
                                {demo.attended === false && (
                                    <div className="flex items-center gap-2">
                                        <span className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium">
                                            ❌ Absent
                                        </span>
                                        <button
                                            onClick={() => setRescheduleTarget(demo)}
                                            className="flex items-center gap-1 px-3 py-1.5 border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                                        >
                                            <RotateCcw size={12} />
                                            Reschedule
                                        </button>
                                    </div>
                                )}
                                {isPending && isToday && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => handleMarkPresent(demo.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500 text-white rounded-lg text-xs font-medium hover:bg-emerald-600 transition-colors cursor-pointer"
                                        >
                                            <Check size={14} />
                                            Present
                                        </button>
                                        <button
                                            onClick={() => handleMarkAbsent(demo.id)}
                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white rounded-lg text-xs font-medium hover:bg-red-600 transition-colors cursor-pointer"
                                        >
                                            <X size={14} />
                                            Absent
                                        </button>
                                    </div>
                                )}
                                {isPending && !isToday && (
                                    <span className="px-3 py-1.5 bg-gray-50 text-gray-400 rounded-lg text-xs font-medium">
                                        ⏳ Upcoming
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>

            {/* Reschedule Modal */}
            {rescheduleTarget && (
                <RescheduleModal
                    demo={rescheduleTarget}
                    onConfirm={rescheduleDemo}
                    onClose={() => setRescheduleTarget(null)}
                />
            )}
        </div>
    )
}

export default MarkAttendance
