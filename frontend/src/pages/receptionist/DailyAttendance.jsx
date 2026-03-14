import { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Calendar, Users, Save, CheckCircle2, UserX } from 'lucide-react';
import toast from 'react-hot-toast';

// --- MOCK DATA ---
const MOCK_BRANCH = "Main Branch"; // Simulating the receptionist's assigned branch
const CLASSES = ["Class 10", "Class 11", "Class 12"];

const generateMockStudents = (branch, className) => {
    return [
        { id: '1', name: 'Aarav Sharma', studentId: 'STU-001', phone: '9876543210' },
        { id: '2', name: 'Priya Patel', studentId: 'STU-002', phone: '9876543211' },
        { id: '3', name: 'Rahul Kumar', studentId: 'STU-003', phone: '9876543212' },
        { id: '4', name: 'Sneha Singh', studentId: 'STU-004', phone: '9876543213' },
        { id: '5', name: 'Aditya Gupta', studentId: 'STU-005', phone: '9876543214' },
    ];
};
// -----------------

function DailyAttendance() {
    const { user } = useAuth();

    // Filters
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

    // Data State
    const [students, setStudents] = useState([]);
    const [attendance, setAttendance] = useState({}); // { studentId: 'present' | 'absent' }
    const [notes, setNotes] = useState('');
    const [isFetching, setIsFetching] = useState(false);

    // Load mock data when filters change
    const fetchStudents = () => {
        if (!selectedClass) {
            toast.error("Please select a class first");
            return;
        }

        setIsFetching(true);
        // Simulate network delay
        setTimeout(() => {
            const mockData = generateMockStudents(MOCK_BRANCH, selectedClass);
            setStudents(mockData);

            // Initialize all as present by default when fetching new batch
            const initialAttendance = {};
            mockData.forEach(s => {
                initialAttendance[s.id] = 'present';
            });
            setAttendance(initialAttendance);

            setIsFetching(false);
            toast.success(`Loaded ${mockData.length} students`);
        }, 600);
    };

    const handleToggleAttendance = (studentId) => {
        setAttendance(prev => ({
            ...prev,
            [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
        }));
    };

    const handleMarkAllPresent = () => {
        const resetAttendance = {};
        students.forEach(s => {
            resetAttendance[s.id] = 'present';
        });
        setAttendance(resetAttendance);
        toast.success("All marked present");
    };

    const handleSave = () => {
        if (students.length === 0) {
            toast.error("No students to save attendance for");
            return;
        }

        // Generate the payload
        const payload = {
            date: selectedDate,
            branch: MOCK_BRANCH,
            class: selectedClass,
            records: Object.entries(attendance).map(([studentId, status]) => ({
                studentId,
                status
            })),
            notes: notes,
            markedBy: user?.id || 'mock-receptionist-id'
        };

        console.log("=== ATTENDANCE PAYLOAD SAVED ===", payload);
        toast.success("Attendance saved successfully!");
    };

    return (
        <div className="space-y-6 max-w-5xl mx-auto">
            {/* Header Section */}
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Daily Attendance</h1>
                <p className="text-sm text-gray-500 mt-1">
                    Manage daily attendance for <span className="font-bold text-emerald-600">{MOCK_BRANCH}</span>
                </p>
            </div>

            {/* Filter Card */}
            <div className="bg-white p-5 rounded-xl shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 items-end">

                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Select Class
                        </label>
                        <select
                            value={selectedClass}
                            onChange={(e) => setSelectedClass(e.target.value)}
                            className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                        >
                            <option value="">-- Choose Class --</option>
                            {CLASSES.map(c => (
                                <option key={c} value={c}>{c}</option>
                            ))}
                        </select>
                    </div>

                    <div className="w-full md:w-1/3">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Date
                        </label>
                        <div className="relative">
                            <input
                                type="date"
                                value={selectedDate}
                                onChange={(e) => setSelectedDate(e.target.value)}
                                className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none"
                            />
                        </div>
                    </div>

                    <div className="w-full md:w-1/3">
                        <button
                            onClick={fetchStudents}
                            disabled={isFetching}
                            className="w-full py-2 bg-black text-white rounded-lg font-medium hover:bg-gray-800 transition-colors flex items-center justify-center gap-2"
                        >
                            {isFetching ? (
                                <span className="animate-pulse">Loading...</span>
                            ) : (
                                <>
                                    <Users size={18} />
                                    Fetch Students
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Students List Card */}
            {students.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-500">

                    {/* List Header Actions */}
                    <div className="flex justify-between items-center p-4 border-b border-gray-100 bg-gray-50/50">
                        <h2 className="font-semibold text-gray-800">
                            {selectedClass} Students
                        </h2>
                        <button
                            onClick={handleMarkAllPresent}
                            className="text-sm text-emerald-600 font-medium hover:text-emerald-700 hover:bg-emerald-50 px-3 py-1.5 rounded-md transition-colors"
                        >
                            Mark All Present
                        </button>
                    </div>

                    {/* Desktop Table View */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-white border-b border-gray-100 text-sm text-gray-500">
                                    <th className="px-6 py-4 font-medium">Student Info</th>
                                    <th className="px-6 py-4 font-medium">Student ID</th>
                                    <th className="px-6 py-4 font-medium text-right">Attendance Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {students.map((student) => {
                                    const isPresent = attendance[student.id] === 'present';
                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50/50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-medium text-gray-900">{student.name}</div>
                                                <div className="text-xs text-gray-500">{student.phone}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                {student.studentId}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <div className="relative inline-flex bg-gray-100 p-1 rounded-lg w-[160px] h-10 items-center overflow-hidden">
                                                    {/* Animated Background Slider */}
                                                    <div
                                                        className={`absolute top-1 bottom-1 w-[74px] rounded-md transition-all duration-100 ease-in-out shadow-sm
                                                            ${isPresent ? 'left-[81px] bg-emerald-500' : 'left-1 bg-red-500'}
                                                        `}
                                                    />

                                                    {/* Absent Button Container */}
                                                    <button
                                                        onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'absent' }))}
                                                        className={`relative z-10 w-1/2 flex items-center justify-center text-sm font-medium transition-colors duration-100 ${!isPresent ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                                                            }`}
                                                    >
                                                        Absent
                                                    </button>

                                                    {/* Present Button Container */}
                                                    <button
                                                        onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'present' }))}
                                                        className={`relative z-10 w-1/2 flex items-center justify-center text-sm font-medium transition-colors duration-100 ${isPresent ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                                                            }`}
                                                    >
                                                        Present
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Mobile List View */}
                    <div className="md:hidden divide-y divide-gray-100">
                        {students.map((student) => {
                            const isPresent = attendance[student.id] === 'present';
                            return (
                                <div key={student.id} className="flex items-center justify-between p-4">
                                    <div>
                                        <div className="font-medium text-gray-900">{student.name}</div>
                                        <div className="text-xs text-gray-500">{student.studentId}</div>
                                    </div>
                                    <div className="relative flex bg-gray-100 p-1 rounded-lg w-[140px] h-9 items-center overflow-hidden">
                                        {/* Animated Background Slider */}
                                        <div
                                            className={`absolute top-1 bottom-1 w-[64px] rounded-md transition-all duration-100 ease-in-out shadow-sm
                                                ${isPresent ? 'left-[71px] bg-emerald-500' : 'left-1 bg-red-500'}
                                            `}
                                        />

                                        {/* Absent Button Container */}
                                        <button
                                            onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'absent' }))}
                                            className={`relative z-10 w-1/2 flex items-center justify-center text-xs font-medium transition-colors duration-100 ${!isPresent ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Absent
                                        </button>

                                        {/* Present Button Container */}
                                        <button
                                            onClick={() => setAttendance(prev => ({ ...prev, [student.id]: 'present' }))}
                                            className={`relative z-10 w-1/2 flex items-center justify-center text-xs font-medium transition-colors duration-100 ${isPresent ? 'text-white' : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                        >
                                            Present
                                        </button>
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    {/* Notes & Submit Section */}
                    <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Daily Notes / Remarks (Optional)
                        </label>
                        <textarea
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            placeholder="Add any specific observations for today's batch..."
                            className="w-full px-4 py-3 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all outline-none resize-none h-24 mb-4"
                        />

                        <div className="flex justify-end">
                            <button
                                onClick={handleSave}
                                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-sm shadow-emerald-600/20"
                            >
                                <Save size={18} />
                                Save Attendance
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default DailyAttendance; 
