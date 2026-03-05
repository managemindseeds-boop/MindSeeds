import { useState, useEffect, useMemo } from 'react'
import { useStudents } from '../../context/StudentContext'
import { useDemos } from '../../context/DemoContext'
import {
    ClipboardCheck,
    Search,
    Filter,
    CheckCircle2,
    Clock,
    IndianRupee,
    ArrowRight,
    User,
    Calendar,
    Building2,
    GraduationCap
} from 'lucide-react'

const TABS = [
    { id: 'ready', label: 'Ready for Admission', icon: CheckCircle2, color: 'text-amber-600', bg: 'bg-amber-50' },
    { id: 'confirmed', label: 'Admission Confirmed', icon: Clock, color: 'text-purple-600', bg: 'bg-purple-50' },
    { id: 'active', label: 'Successfully Admitted', icon: IndianRupee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
]

function Admissions() {
    const { students, updateStudentStatus, loading: studentsLoading } = useStudents()
    const { getDemosByStudent } = useDemos()
    const [activeTab, setActiveTab] = useState('ready')
    const [search, setSearch] = useState('')
    const [studentDemos, setStudentDemos] = useState({})
    const [fetchingDemos, setFetchingDemos] = useState(false)

    // Fetch demos for all students to determine who is "Ready"
    useEffect(() => {
        const fetchAllNeededDemos = async () => {
            setFetchingDemos(true)
            const demoMap = {}
            for (const student of students) {
                // Only fetch if they aren't already active/admitted or if they are in 'enquiry'
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

    const filteredStudents = useMemo(() => {
        return students.filter(student => {
            const matchesSearch = student.name.toLowerCase().includes(search.toLowerCase()) ||
                student.phone.includes(search)

            if (!matchesSearch) return false

            const demos = studentDemos[student.id] || []
            const allDemosAttended = demos.length >= 4 && demos.every(d => d.attended === true)

            if (activeTab === 'ready') {
                // Show if they have 4 attended demos AND are not already admitted/active
                return allDemosAttended && (student.status === 'enquiry' || student.status === 'demo_scheduled')
            }
            if (activeTab === 'confirmed') {
                return student.status === 'admitted'
            }
            if (activeTab === 'active') {
                return student.status === 'active'
            }
            return false
        })
    }, [students, studentDemos, activeTab, search])

    const handleConfirmAdmission = (id) => {
        if (window.confirm('Are you sure you want to confirm admission for this student?')) {
            updateStudentStatus(id, 'admitted')
            setActiveTab('confirmed')
        }
    }

    const handleMarkActive = (id) => {
        if (window.confirm('Record registration fee payment and mark as Active Student?')) {
            updateStudentStatus(id, 'active')
            setActiveTab('active')
        }
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div>
                <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                    <ClipboardCheck className="text-emerald-500" />
                    Admissions Manager
                </h1>
                <p className="text-sm text-gray-500 mt-1">Manage the conversion funnel from Demo to Active Student</p>
            </div>

            {/* Stats & Search */}
            <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                    <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search ready students..."
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all"
                    />
                </div>
            </div>

            {/* Tabs Navigation */}
            <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer
                            ${activeTab === tab.id
                                ? 'bg-white text-gray-900 shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                    >
                        <tab.icon size={16} className={activeTab === tab.id ? tab.color : ''} />
                        {tab.label}
                        <span className={`ml-1 px-1.5 py-0.5 rounded-full text-[10px] 
                            ${activeTab === tab.id ? 'bg-gray-100 text-gray-900' : 'bg-gray-200 text-gray-500'}`}>
                            {students.filter(s => {
                                if (tab.id === 'ready') {
                                    const d = studentDemos[s.id] || []
                                    return d.length >= 4 && d.every(x => x.attended === true) && (s.status === 'enquiry' || s.status === 'demo_scheduled')
                                }
                                return s.status === (tab.id === 'ready' ? 'demo_scheduled' : tab.id === 'confirmed' ? 'admitted' : 'active')
                            }).length}
                        </span>
                    </button>
                ))}
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
            ) : filteredStudents.length === 0 ? (
                <div className="bg-white rounded-3xl border border-dashed border-gray-200 py-20 flex flex-col items-center justify-center text-center">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mb-4">
                        <User className="text-gray-300" size={32} />
                    </div>
                    <h3 className="text-gray-900 font-semibold">No students in this stage</h3>
                    <p className="text-gray-400 text-sm max-w-xs mt-1">
                        {activeTab === 'ready'
                            ? "Complete all 4 demo lectures for a student to see them here."
                            : activeTab === 'confirmed'
                                ? "Confirmed admissions will appear here awaiting payment."
                                : "Successfully admitted students will appear here."}
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStudents.map((student) => (
                        <div key={student.id} className="group bg-white rounded-2xl border border-gray-200 p-5 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">
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
                                <div className={`p-2 rounded-xl ${TABS.find(t => t.id === activeTab).bg}`}>
                                    {activeTab === 'ready' && <CheckCircle2 className="text-amber-500" size={20} />}
                                    {activeTab === 'confirmed' && <Clock className="text-purple-500" size={20} />}
                                    {activeTab === 'active' && <IndianRupee className="text-emerald-500" size={20} />}
                                </div>
                            </div>

                            <div className="space-y-3 mb-5">
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Building2 size={14} className="text-gray-400" />
                                    <span>Branch: {student.branch}</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar size={14} className="text-gray-400" />
                                    <span>Registered: {new Date(student.createdAt).toLocaleDateString()}</span>
                                </div>
                                {activeTab === 'ready' && (
                                    <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                                        <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest mb-1">Status</p>
                                        <p className="text-xs text-amber-800 font-medium leading-relaxed">
                                            All 4 demo lectures completed successfully. Ready for fee discussion.
                                        </p>
                                    </div>
                                )}
                            </div>

                            {activeTab === 'ready' && (
                                <button
                                    onClick={() => handleConfirmAdmission(student.id)}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-black text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-all cursor-pointer group/btn"
                                >
                                    Confirm Admission
                                    <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                </button>
                            )}

                            {activeTab === 'confirmed' && (
                                <button
                                    onClick={() => handleMarkActive(student.id)}
                                    className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all cursor-pointer"
                                >
                                    <IndianRupee size={16} />
                                    Record Payment & Activate
                                </button>
                            )}

                            {activeTab === 'active' && (
                                <div className="w-full py-3 bg-emerald-50 text-emerald-700 rounded-xl text-sm font-bold text-center border border-emerald-100 flex items-center justify-center gap-2">
                                    <CheckCircle2 size={16} />
                                    Active Student
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}

export default Admissions
