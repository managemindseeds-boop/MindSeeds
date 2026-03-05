import { useParams, useNavigate } from 'react-router-dom'
import { useStudents } from '../../context/StudentContext'
import { ArrowLeft, Phone, Mail, User, GraduationCap, MapPin, Building2, Clock } from 'lucide-react'

const statusLabels = {
    enquiry: 'Enquiry',
    demo_scheduled: 'Demo Completed',
    admitted: 'Admitted',
    active: 'Active',
}

const statusColors = {
    enquiry: 'bg-blue-50 text-blue-600 border-blue-200',
    demo_scheduled: 'bg-amber-50 text-amber-600 border-amber-200',
    admitted: 'bg-purple-50 text-purple-600 border-purple-200',
    active: 'bg-emerald-50 text-emerald-600 border-emerald-200',
}

const timelineSteps = [
    { key: 'enquiry', label: 'Enquiry Registered', description: 'Student registered by receptionist' },
    { key: 'demo_scheduled', label: 'Demo Lecture Completed', description: '4 demo lectures completed' },
    { key: 'admitted', label: 'Admission Confirmed', description: 'Fees discussed and admission confirmed' },
    { key: 'active', label: 'Active Student', description: 'Registration fee paid, monthly fee date set' },
]

const statusOrder = ['enquiry', 'demo_scheduled', 'admitted', 'active']

function StudentDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { getStudentById } = useStudents()

    const student = getStudentById(id)

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <p className="text-gray-500 mb-4">Student not found</p>
                <button
                    onClick={() => navigate('/receptionist/students')}
                    className="px-4 py-2 bg-black text-white rounded-lg text-sm cursor-pointer"
                >
                    Back to Students
                </button>
            </div>
        )
    }

    const currentStepIndex = statusOrder.indexOf(student.status)

    const formatDate = (dateStr) => {
        return new Date(dateStr).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        })
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/receptionist/students')}
                    className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-gray-900">{student.name}</h1>
                    <p className="text-sm text-gray-500">Student details & journey</p>
                </div>
                <span className={`px-3 py-1.5 rounded-full text-xs font-medium border ${statusColors[student.status]}`}>
                    {statusLabels[student.status]}
                </span>
            </div>

            {/* Horizontal Journey Timeline */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
                <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide mb-5">Student Journey</h3>
                <div className="flex items-start justify-between relative">
                    {/* Connecting line */}
                    <div className="absolute top-2 left-0 right-0 h-0.5 bg-gray-200 z-0" />
                    <div
                        className="absolute top-2 left-0 h-0.5 bg-emerald-500 z-0 transition-all duration-300"
                        style={{ width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%` }}
                    />

                    {timelineSteps.map((step, index) => {
                        const isCompleted = index <= currentStepIndex
                        const isCurrent = index === currentStepIndex

                        return (
                            <div key={step.key} className="flex flex-col items-center text-center relative z-10 flex-1">
                                {/* Dot */}
                                <div
                                    className={`w-4 h-4 rounded-full border-2 flex-shrink-0
                                        ${isCompleted
                                            ? 'bg-emerald-500 border-emerald-500'
                                            : 'bg-white border-gray-300'
                                        }`}
                                />
                                {/* Label */}
                                <p className={`text-xs font-medium mt-2 ${isCompleted ? 'text-gray-900' : 'text-gray-400'}`}>
                                    {step.label}
                                </p>
                                <p className={`text-[10px] mt-0.5 ${isCompleted ? 'text-gray-500' : 'text-gray-300'}`}>
                                    {step.description}
                                </p>
                                {isCurrent && (
                                    <span className="mt-1.5 px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded text-[10px] font-medium">
                                        Current Stage
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* Info Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Student Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Student Info</h3>
                    <InfoRow icon={Phone} label="Phone" value={student.phone} />
                    <InfoRow icon={Mail} label="Email" value={student.email} />
                    <InfoRow icon={GraduationCap} label="Class" value={student.studentClass} />
                    <InfoRow icon={Building2} label="Branch" value={student.branch} />
                    <InfoRow icon={MapPin} label="Address" value={student.address} />
                    <InfoRow icon={Clock} label="Registered" value={formatDate(student.createdAt)} />
                </div>

                {/* Parent Info */}
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-3">
                    <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wide">Parent / Guardian</h3>
                    <InfoRow icon={User} label="Name" value={student.parentName} />
                    <InfoRow icon={Phone} label="Phone" value={student.parentPhone} />
                </div>
            </div>
        </div>
    )
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-center gap-3">
            <Icon size={15} className="text-gray-400 flex-shrink-0" />
            <div>
                <p className="text-xs text-gray-400">{label}</p>
                <p className="text-sm text-gray-800">{value}</p>
            </div>
        </div>
    )
}

export default StudentDetail
