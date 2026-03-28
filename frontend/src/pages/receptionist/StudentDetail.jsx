import { useParams, useNavigate } from 'react-router-dom'
import { useStudents } from '../../context/StudentContext'
import { ArrowLeft, Phone, Mail, User, GraduationCap, MapPin, Building2, Clock } from 'lucide-react'

const statusLabels = {
    enquiry: 'Enquiry',
    demo_scheduled: 'Demo Scheduled',
    demo_completed: 'Demo Completed',
}

const statusColors = {
    enquiry: 'bg-blue-50 text-blue-600 border-blue-200',
    demo_scheduled: 'bg-amber-50 text-amber-600 border-amber-200',
    demo_completed: 'bg-[#f0e6f6] text-[#5e3174] border-purple-200',
}

const timelineSteps = [
    { key: 'enquiry', label: 'Enquiry Registered' },
    { key: 'demo_scheduled', label: 'Demo Scheduled' },
    { key: 'demo_completed', label: 'Demo Completed' },
]
const statusOrder = ['enquiry', 'demo_scheduled', 'demo_completed']

function StudentDetail() {
    const { id } = useParams()
    const navigate = useNavigate()
    const { getStudentById } = useStudents()
    const student = getStudentById(id)

    if (!student) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <p className="text-gray-400 text-sm">Student not found</p>
                <button onClick={() => navigate('/receptionist/students')}
                    className="px-4 py-2 bg-[#5e3174] text-white rounded-lg text-sm cursor-pointer">
                    Back to Students
                </button>
            </div>
        )
    }

    const currentStepIndex = statusOrder.indexOf(student.status)
    const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
        day: 'numeric', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit',
    })

    return (
        <div className="max-w-3xl mx-auto space-y-5">

            {/* ── Header ── */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/receptionist/students')}
                    className="p-2 text-gray-400 hover:text-gray-700 hover:bg-white rounded-lg transition-colors cursor-pointer border border-transparent hover:border-gray-200"
                >
                    <ArrowLeft size={18} />
                </button>
                <div className="flex-1 min-w-0">
                    <h1 className="text-base font-semibold text-gray-900 leading-tight">{student.name}</h1>
                    <p className="text-xs text-gray-400 mt-0.5">Student details &amp; journey</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${statusColors[student.status]}`}>
                    {statusLabels[student.status]}
                </span>
            </div>

            {/* ── Journey Timeline ── */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm px-6 py-5">
                <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase mb-5">Student Journey</p>
                <div className="flex items-start justify-between relative">
                    {/* Base track */}
                    <div className="absolute top-[5px] left-0 right-0 h-px bg-gray-100" />
                    {/* Progress track */}
                    <div
                        className="absolute top-[5px] left-0 h-px bg-[#5e3174] transition-all duration-500"
                        style={{ width: `${(currentStepIndex / (timelineSteps.length - 1)) * 100}%` }}
                    />
                    {timelineSteps.map((step, index) => {
                        const done    = index <= currentStepIndex
                        const current = index === currentStepIndex
                        return (
                            <div key={step.key} className="flex flex-col items-center text-center relative z-10 flex-1">
                                <div className={`w-2.5 h-2.5 rounded-full border-2 shrink-0 ${
                                    done
                                        ? 'bg-[#5e3174] border-[#5e3174]'
                                        : 'bg-white border-gray-200'
                                }`} />
                                <p className={`text-[11px] font-medium mt-2 leading-snug ${
                                    current ? 'text-[#5e3174]' : done ? 'text-gray-700' : 'text-gray-300'
                                }`}>{step.label}</p>
                                {current && (
                                    <span className="mt-1 text-[9px] font-bold tracking-widest text-[#5e3174] uppercase opacity-70">
                                        Current
                                    </span>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>

            {/* ── Info Grid ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">

                {/* Student Info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50">
                        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Student Info</p>
                    </div>
                    <div className="px-5 py-3 space-y-4">
                        <InfoRow icon={Phone}         label="Phone"      value={student.phone} />
                        <InfoRow icon={Mail}          label="Email"      value={student.email} />
                        <InfoRow icon={GraduationCap} label="Class"      value={student.studentClass} />
                        <InfoRow icon={Building2}     label="Branch"     value={student.branch} />
                        <InfoRow icon={MapPin}        label="Address"    value={student.address} />
                        <InfoRow icon={Clock}         label="Registered" value={formatDate(student.createdAt)} />
                    </div>
                </div>

                {/* Parent Info */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    <div className="px-5 py-3.5 border-b border-gray-50">
                        <p className="text-[10px] font-bold tracking-widest text-gray-400 uppercase">Parent / Guardian</p>
                    </div>
                    <div className="px-5 py-3 space-y-4">
                        <InfoRow icon={User}  label="Name"  value={student.parentName} />
                        <InfoRow icon={Phone} label="Phone" value={student.parentPhone} />
                    </div>
                </div>

            </div>
        </div>
    )
}

function InfoRow({ icon: Icon, label, value }) {
    return (
        <div className="flex items-start gap-3">
            <div className="w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center shrink-0 mt-0.5">
                <Icon size={13} className="text-gray-400" />
            </div>
            <div>
                <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide">{label}</p>
                <p className="text-sm text-gray-800 font-medium mt-0.5">{value || '—'}</p>
            </div>
        </div>
    )
}

export default StudentDetail
