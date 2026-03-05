import { useState, useEffect, useMemo } from 'react'
import { useStudents } from '../../context/StudentContext'
import { useDemos } from '../../context/DemoContext'
import {
    ClipboardCheck,
    Search,
    CheckCircle2,
    ArrowRight,
    User,
    Calendar,
    Building2
} from 'lucide-react'

function Admissions() {
    const { students, updateStudentStatus, loading: studentsLoading } = useStudents()
    const { getDemosByStudent } = useDemos()
    const [search, setSearch] = useState('')
    const [studentDemos, setStudentDemos] = useState({})
    const [fetchingDemos, setFetchingDemos] = useState(false)

    // Fetch demos for all students to determine who is "Ready"
    useEffect(() => {
        const fetchAllNeededDemos = async () => {
            setFetchingDemos(true)
            const demoMap = {}
            for (const student of students) {
                // Only fetch for students who are in basic enquiry or demo_scheduled state
                if (student.status === 'enquiry' || student.status === 'demo_scheduled') {
                    const demos = await getDemosByStudent(student.id)
                    demoMap[student.id] = demos
                }
            }
            setStudentDemos(demoMap)
            setFetchingDemos(false)
        }

        if (students.length > 0) {
            fetchAllNeededDemos()
        }
    }, [students, getDemosByStudent])

    const readyStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
                student.phone.includes(search)

            if (!matchesSearch) return false

            const demos = studentDemos[student.id] || []
            // Logic: Must have 4 attended demos AND not already admitted/active
            const allDemosAttended = demos.length >= 4 && demos.every(d => d.attended === true)

            return allDemosAttended && (student.status === 'enquiry' || student.status === 'demo_scheduled')
        })
    }, [students, studentDemos, search])

    const handleConfirmAdmission = async (id) => {
        if (window.confirm('Are you sure you want to confirm admission for this student?')) {
            try {
                await updateStudentStatus(id, 'admitted')
                // Student will automatically disappear due to useMemo filtering
            } catch (err) {
                alert(err.message)
            }
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                        <ClipboardCheck className="text-emerald-500" />
                        Confirm Admissions
                    </h1>
                    <p className="text-sm text-gray-500 mt-1">Students who have completed all 4 demo lectures</p>
                </div>
                <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 flex items-center gap-2">
                    <CheckCircle2 size={18} className="text-amber-600" />
                    <span className="text-sm font-bold text-amber-800">
                        {readyStudents.length} Students Pending
                    </span>
                </div>
            </div>

            {/* Search */}
            <div className="relative max-w-md">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                <input
                    type="text"
                    placeholder="Search ready students..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                />
            </div>

            {/* Content Area */}
            {(studentsLoading || fetchingDemos) ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse space-y-4">
                            <div className="h-4 bg-gray-100 rounded w-3/4" />
                            <div className="space-y-2">
                                <div className="h-3 bg-gray-50 rounded w-1/2" />
                                <div className="h-3 bg-gray-50 rounded w-2/3" />
                            </div>
                            <div className="h-10 bg-gray-50 rounded-xl w-full" />
                        </div>
                    ))}
                </div>
            ) : readyStudents.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <User className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-gray-900 font-semibold">No students ready for admission</h3>
                    <p className="text-gray-400 text-sm max-w-xs mt-1">
                        Complete all 4 demo lectures for a student to see them here in the confirmation queue.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {readyStudents.map((student) => (
                        <div key={student.id} className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors text-lg">
                                        {student.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded text-[10px] font-medium uppercase tracking-wider">
                                            {student.studentClass}
                                        </span>
                                        <span className="text-gray-300">•</span>
                                        <span className="text-xs text-gray-500">{student.phone}</span>
                                    </div>
                                </div>
                                <div className="p-2.5 bg-amber-50 rounded-xl text-amber-500">
                                    <CheckCircle2 size={24} />
                                </div>
                            </div>

                            <div className="space-y-2.5 mb-6">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Building2 size={14} className="text-gray-400" />
                                    <span>Branch: {student.branch}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>Registered: {new Date(student.createdAt).toLocaleDateString()}</span>
                                </div>
                                <div className="mt-4 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                    <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Journey Status</p>
                                    <p className="text-xs text-emerald-800 font-medium">
                                        4/4 Demo Lectures Completed
                                    </p>
                                </div>
                            </div>

                            <button
                                onClick={() => handleConfirmAdmission(student.id)}
                                className="w-full flex items-center justify-center gap-2 py-3.5 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all cursor-pointer group/btn"
                            >
                                Confirm Admission
                                <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Admissions
