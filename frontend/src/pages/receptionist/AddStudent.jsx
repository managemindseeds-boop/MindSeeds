import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudents } from '../../context/StudentContext'
import { ArrowLeft, Save, ArrowRight, CalendarDays, Clock, BookOpen, ChevronDown } from 'lucide-react'
import { BRANCHES } from '../../constants/branches'

const genders = [
    { label: 'Male', value: 'male' },
    { label: 'Female', value: 'female' },
    { label: 'Other', value: 'other' },
]

// Combined class + board options in one dropdown
const classes = [
    '9th',
    '9th ICSE',
    '10th',
    '10th ICSE',
    '11th',
    '12th',
    'Repeaters',
]

const branches = BRANCHES

const DEMO_LECTURE_TIMES_24 = ['10:00', '11:30', '13:00', '14:30']
const LS_TIMES_KEY = 'mindseeds_demo_times'

// Convert "HH:MM" (24h) → "H:MM AM/PM"
function to12h(val) {
    if (!val) return ''
    const [h, m] = val.split(':').map(Number)
    const ampm = h >= 12 ? 'PM' : 'AM'
    const h12 = h % 12 || 12
    return `${h12}:${String(m).padStart(2, '0')} ${ampm}`
}

// Convert "H:MM AM/PM" → "HH:MM" (24h) for input[type=time]
function to24h(val) {
    if (!val) return '10:00'
    if (/^\d{2}:\d{2}$/.test(val)) return val   // already 24h
    const parts = val.split(' ')
    if (parts.length < 2) return '10:00'
    const [time, ampm] = parts
    let [h, m] = time.split(':').map(Number)
    if (ampm === 'PM' && h !== 12) h += 12
    if (ampm === 'AM' && h === 12) h = 0
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function getSavedTimes() {
    try {
        const saved = localStorage.getItem(LS_TIMES_KEY)
        if (saved) {
            const arr = JSON.parse(saved)
            // Normalise to 24h regardless of stored format
            return arr.map(to24h)
        }
    } catch { }
    return DEMO_LECTURE_TIMES_24
}

// Subjects pool per class (board already embedded in class name)
const CLASS_SUBJECT_POOL = {
    '9th': ['Maths 1', 'Maths 2', 'Science 1', 'Science 2', 'Hindi', 'English', 'Marathi', 'History', 'Political Geography', 'Urdu'],
    '9th ICSE': ['Physics', 'Chemistry', 'Biology', 'Maths', 'Topography', 'History', 'Geography', 'Language', 'Literature', 'Hindi (Marathi Graded)', 'Computer'],
    '10th': ['Maths 1', 'Maths 2', 'Science 1', 'Science 2', 'Hindi Higher', 'Hindi Lower', 'English', 'Marathi', 'History', 'Political Geography', 'Urdu'],
    '10th ICSE': ['Physics', 'Chemistry', 'Biology', 'Maths', 'Topography', 'History', 'Geography', 'Language', 'Literature', 'Hindi (Marathi Graded)', 'Computer'],
    '11th': ['Physics', 'Chemistry', 'Maths', 'Biology'],
    '12th': ['Physics', 'Chemistry', 'Maths', 'Biology'],
    'Repeaters': ['Physics', 'Chemistry', 'Maths'],
}

const FALLBACK_SUBJECTS = ['Mathematics', 'Science', 'English', 'Social Studies']

// Returns the subject pool for a given class
function getSubjectPool(studentClass) {
    return CLASS_SUBJECT_POOL[studentClass] || FALLBACK_SUBJECTS
}

// Returns first 4 defaults for a class
function getDefaultSubjects(studentClass) {
    return getSubjectPool(studentClass).slice(0, 4)
}

// Skip Sundays — returns next valid weekday (Mon–Sat) on or after `date`
function nextWeekday(date) {
    const d = new Date(date)
    while (d.getDay() === 0) {   // 0 = Sunday
        d.setDate(d.getDate() + 1)
    }
    return d
}

function generateDemoLectures(startDateStr, subjects, times) {
    if (!startDateStr) return []
    const lectures = []
    let current = nextWeekday(new Date(startDateStr))
    for (let i = 0; i < 4; i++) {
        const d = new Date(current)
        lectures.push({
            day: i + 1,
            scheduledDate: d.toISOString().split('T')[0],
            date: d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }),
            weekday: d.toLocaleDateString('en-IN', { weekday: 'long' }),
            time: to12h(times[i]) || to12h(DEMO_LECTURE_TIMES_24[i]),
            subject: subjects[i] || subjects[0] || 'Mathematics',
        })
        current.setDate(current.getDate() + 1)
        current = nextWeekday(current)
    }
    return lectures
}

function AddStudent() {
    const navigate = useNavigate()
    const { addStudent } = useStudents()

    const [page, setPage] = useState(1)

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        gender: '',
        parentName: '',
        parentPhone: '',
        studentClass: '',
        address: '',
        branch: '',
    })

    const [demoStartDate, setDemoStartDate] = useState('')
    const [customSubjects, setCustomSubjects] = useState(FALLBACK_SUBJECTS)
    const [customTimes, setCustomTimes] = useState(getSavedTimes)
    const [loading, setLoading] = useState(false)
    const [apiError, setApiError] = useState('')
    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target

        // 10-digit phone restriction
        if (name === 'phone' || name === 'parentPhone') {
            const onlyNums = value.replace(/[^\d]/g, '')
            if (onlyNums.length > 10) return
            setForm((prev) => ({ ...prev, [name]: onlyNums }))
        } else {
            setForm((prev) => ({ ...prev, [name]: value }))
        }

        // Auto-refresh subjects when class changes
        if (name === 'studentClass') {
            setCustomSubjects(getDefaultSubjects(value))
        }
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
    }

    const handleSubjectChange = (index, value) => {
        setCustomSubjects((prev) => {
            const updated = [...prev]
            updated[index] = value
            return updated
        })
    }

    const handleTimeChange = (index, value) => {
        setCustomTimes((prev) => {
            const updated = [...prev]
            if (index === 0) {
                // Day 1 change → sync all 4 slots
                return [value, value, value, value]
            }
            updated[index] = value
            return updated
        })
    }

    const validate = () => {
        const newErrors = {}
        if (!form.name.trim()) newErrors.name = 'Name is required'
        if (!form.phone.trim()) newErrors.phone = 'Phone is required'
        else if (!/^\d{10}$/.test(form.phone)) newErrors.phone = 'Enter a valid 10-digit number'
        if (form.email.trim() && !/\S+@\S+\.\S+/.test(form.email)) newErrors.email = 'Enter a valid email'
        if (!form.parentName.trim()) newErrors.parentName = 'Parent name is required'
        if (!form.parentPhone.trim()) newErrors.parentPhone = 'Parent phone is required'
        else if (!/^\d{10}$/.test(form.parentPhone)) newErrors.parentPhone = 'Enter a valid 10-digit number'
        if (!form.studentClass) newErrors.studentClass = 'Select a class'
        if (!form.address.trim()) newErrors.address = 'Address is required'
        if (!form.branch) newErrors.branch = 'Select a branch'
        if (!form.gender) newErrors.gender = 'Select a gender'
        return newErrors
    }

    const handleNextPage = () => {
        const newErrors = validate()
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        setPage(2)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setApiError('')
        try {
            const lectures = generateDemoLectures(demoStartDate, customSubjects, customTimes)
            localStorage.setItem(LS_TIMES_KEY, JSON.stringify(customTimes))
            await addStudent({ ...form, demoStartDate, demoLectures: lectures })
            navigate('/receptionist/students')
        } catch (err) {
            setApiError(err.message)
        } finally {
            setLoading(false)
        }
    }

    const demoLectures = generateDemoLectures(demoStartDate, customSubjects, customTimes)

    return (
        <div className="max-w-3xl mx-auto space-y-3">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => page === 1 ? navigate('/receptionist/students') : setPage(1)}
                    className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <div className="flex-1" />
                {/* Step indicator */}
                <div className="flex items-center gap-2 text-sm text-gray-500 font-medium">
                    <span
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all
                            ${page === 1 ? 'bg-black text-white' : 'bg-emerald-500 text-white'}`}
                    >
                        {page === 1 ? '1' : '✓'}
                    </span>
                    <div className={`w-8 h-0.5 rounded ${page === 2 ? 'bg-emerald-400' : 'bg-gray-200'}`} />
                    <span
                        className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-semibold transition-all
                            ${page === 2 ? 'bg-black text-white' : 'bg-gray-200 text-gray-400'}`}
                    >
                        2
                    </span>
                    <span className="ml-1 text-gray-400">of 2</span>
                </div>
            </div>

            {/* ── PAGE 1: Student Info ── */}
            {page === 1 && (
                <div className="bg-white rounded-xl border border-gray-200 p-5 space-y-4">
                    {/* Student Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">Student Information</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FieldInput label="Full Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Enter student name" required />
                            <FieldInput label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="10-digit number" required maxLength={10} type="tel" inputMode="numeric" pattern="[0-9]*" />
                            <FieldInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="student@email.com" />
                            <FieldSelect label="Gender" name="gender" value={form.gender} onChange={handleChange} error={errors.gender} options={genders} placeholder="Select gender" required />
                            <FieldInput label="Address" name="address" value={form.address} onChange={handleChange} error={errors.address} placeholder="Enter full address" className="sm:col-span-2" required />
                        </div>
                    </div>

                    {/* Parent Info */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">Parent / Guardian</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FieldInput label="Parent Name" name="parentName" value={form.parentName} onChange={handleChange} error={errors.parentName} placeholder="Enter parent name" required />
                            <FieldInput label="Parent Phone" name="parentPhone" value={form.parentPhone} onChange={handleChange} error={errors.parentPhone} placeholder="10-digit number" required maxLength={10} type="tel" inputMode="numeric" pattern="[0-9]*" />
                        </div>
                    </div>

                    {/* Class & Branch */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-2 uppercase tracking-wide">Enquiry Details</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <FieldSelect label="Class" name="studentClass" value={form.studentClass} onChange={handleChange} error={errors.studentClass} options={classes} placeholder="Select class" required />
                            <FieldSelect label="Branch" name="branch" value={form.branch} onChange={handleChange} error={errors.branch} options={branches} placeholder="Select branch" required />
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex justify-end gap-3 pt-1">
                        <button
                            type="button"
                            onClick={handleNextPage}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                        >
                            Next
                            <ArrowRight size={16} />
                        </button>
                    </div>
                </div>
            )}

            {/* ── PAGE 2: Demo Schedule ── */}
            {page === 2 && (
                <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-5 space-y-5">
                    {apiError && (
                        <div className="px-4 py-2.5 bg-red-50 border border-red-200 rounded-lg text-sm text-red-600">
                            {apiError}
                        </div>
                    )}

                    {/* Demo date picker */}
                    <div>
                        <h3 className="text-sm font-semibold text-gray-800 mb-1 uppercase tracking-wide">Demo Lecture Schedule</h3>
                        <p className="text-xs text-gray-500 mb-3">Select a start date — 4 demo lectures will be auto-scheduled on consecutive days.</p>

                        <div className="max-w-xs">
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                Demo Start Date <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={demoStartDate}
                                onChange={(e) => setDemoStartDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all cursor-pointer"
                            />
                        </div>
                    </div>

                    {/* Lecture cards */}
                    {demoLectures.length > 0 ? (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <CalendarDays size={15} className="text-emerald-600" />
                                <span className="text-sm font-semibold text-gray-800">Scheduled Demo Lectures</span>
                                <span className="ml-auto text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-medium">
                                    4 lectures
                                </span>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {demoLectures.map((lec, idx) => (
                                    <div
                                        key={lec.day}
                                        className="flex items-start gap-3 p-3 rounded-xl border border-gray-100 bg-gray-50 hover:border-emerald-200 transition-all"
                                    >
                                        {/* Day badge */}
                                        <div className="flex-shrink-0 flex flex-col items-center justify-center w-10 h-10 bg-black text-white rounded-lg text-xs font-bold leading-tight">
                                            <span className="text-[10px] font-normal opacity-70">Day</span>
                                            <span>{lec.day}</span>
                                        </div>

                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <p className="text-sm font-semibold text-gray-900 truncate">{lec.date}</p>
                                            <p className="text-xs text-gray-500">{lec.weekday}</p>
                                            <div className="flex flex-col gap-1.5 pt-0.5">
                                                {/* Editable time input */}
                                                <div className="flex items-center gap-1">
                                                    <Clock size={11} className="text-gray-500 shrink-0" />
                                                    <input
                                                        type="time"
                                                        value={customTimes[idx] || ''}
                                                        onChange={(e) => handleTimeChange(idx, e.target.value)}
                                                        className="flex-1 text-xs text-gray-700 font-medium bg-white border border-gray-200 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer"
                                                    />
                                                </div>
                                                {/* Editable subject dropdown */}
                                                <div className="flex items-center gap-1 flex-1 min-w-0">
                                                    <BookOpen size={11} className="text-emerald-600 shrink-0" />
                                                    <select
                                                        value={customSubjects[idx]}
                                                        onChange={(e) => handleSubjectChange(idx, e.target.value)}
                                                        className="flex-1 min-w-0 text-xs text-emerald-700 font-medium bg-emerald-50 border border-emerald-200 rounded-md px-1.5 py-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400 cursor-pointer appearance-none"
                                                    >
                                                        {getSubjectPool(form.studentClass).map((s) => (
                                                            <option key={s} value={s}>{s}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-10 text-center border border-dashed border-gray-200 rounded-xl bg-gray-50">
                            <CalendarDays size={32} className="text-gray-300 mb-2" />
                            <p className="text-sm text-gray-400 font-medium">No demo lectures scheduled yet</p>
                            <p className="text-xs text-gray-400">Pick a start date above to auto-generate 4 lectures</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-between gap-3 pt-1 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setPage(1)}
                            className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                        >
                            <ArrowLeft size={15} />
                            Back
                        </button>
                        <button
                            type="submit"
                            disabled={loading || !demoStartDate}
                            className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Save size={16} />
                            {loading ? 'Registering...' : 'Register Student'}
                        </button>
                    </div>
                </form>
            )}
        </div>
    )
}

function FieldInput({ label, name, value, onChange, error, placeholder, type = 'text', className = '', required = false, ...props }) {
    return (
        <div className={className}>
            <label className="block text-xs font-medium text-gray-700 mb-1">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full px-3 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all
                    ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
                {...props}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}

function FieldSelect({ label, name, value, onChange, error, options, placeholder, required = false }) {
    return (
        <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <div className="relative">
                <select
                    name={name}
                    value={value}
                    onChange={onChange}
                    className={`w-full pl-3 pr-10 py-2 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer transition-all
                        ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                        ${!value ? 'text-gray-400' : 'text-gray-900'}`}
                >
                    <option value="" disabled hidden>{placeholder}</option>
                    {options.map((opt) => {
                        const val = typeof opt === 'object' ? opt.value : opt
                        const lbl = typeof opt === 'object' ? opt.label : opt
                        return <option key={val} value={val}>{lbl}</option>
                    })}
                </select>
                <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
            </div>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}

export default AddStudent
