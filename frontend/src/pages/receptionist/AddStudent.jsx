import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useStudents } from '../../context/StudentContext'
import { ArrowLeft, Save } from 'lucide-react'

const classes = ['8th', '9th', '10th', '11th', '12th']
const branches = ['Vijay Nagar', 'Palasia', 'Sapna Sangeeta', 'AB Road', 'Bhawarkuan']

function AddStudent() {
    const navigate = useNavigate()
    const { addStudent } = useStudents()

    const [form, setForm] = useState({
        name: '',
        phone: '',
        email: '',
        parentName: '',
        parentPhone: '',
        studentClass: '',
        address: '',
        branch: '',
    })

    const [errors, setErrors] = useState({})

    const handleChange = (e) => {
        const { name, value } = e.target
        setForm((prev) => ({ ...prev, [name]: value }))
        if (errors[name]) {
            setErrors((prev) => ({ ...prev, [name]: '' }))
        }
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
        return newErrors
    }

    const handleSubmit = (e) => {
        e.preventDefault()
        const newErrors = validate()
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors)
            return
        }
        addStudent(form)
        navigate('/receptionist/students')
    }

    return (
        <div className="max-w-2xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex items-center gap-3">
                <button
                    onClick={() => navigate('/receptionist/students')}
                    className="p-2 text-gray-400 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors cursor-pointer"
                >
                    <ArrowLeft size={20} />
                </button>
                <div>
                    <h1 className="text-xl font-bold text-gray-900">Register a new student enquiry</h1>
                </div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="bg-white rounded-xl border border-gray-200 p-6 space-y-5">
                {/* Student Info */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Student Information</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldInput label="Full Name" name="name" value={form.name} onChange={handleChange} error={errors.name} placeholder="Enter student name" required />
                        <FieldInput label="Phone" name="phone" value={form.phone} onChange={handleChange} error={errors.phone} placeholder="10-digit number" required />
                        <FieldInput label="Email" name="email" type="email" value={form.email} onChange={handleChange} error={errors.email} placeholder="student@email.com" className="sm:col-span-2" />
                        <FieldInput label="Address" name="address" value={form.address} onChange={handleChange} error={errors.address} placeholder="Enter full address" className="sm:col-span-2" required />
                    </div>
                </div>

                {/* Parent Info */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Parent / Guardian</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldInput label="Parent Name" name="parentName" value={form.parentName} onChange={handleChange} error={errors.parentName} placeholder="Enter parent name" required />
                        <FieldInput label="Parent Phone" name="parentPhone" value={form.parentPhone} onChange={handleChange} error={errors.parentPhone} placeholder="10-digit number" required />
                    </div>
                </div>

                {/* Class & Branch */}
                <div>
                    <h3 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wide">Enquiry Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FieldSelect label="Class" name="studentClass" value={form.studentClass} onChange={handleChange} error={errors.studentClass} options={classes} placeholder="Select class" required />
                        <FieldSelect label="Branch" name="branch" value={form.branch} onChange={handleChange} error={errors.branch} options={branches} placeholder="Select branch" required />
                    </div>
                </div>

                {/* Submit */}
                <div className="flex justify-end gap-3 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate('/receptionist/students')}
                        className="px-5 py-2.5 border border-gray-200 rounded-lg text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        className="flex items-center gap-2 px-5 py-2.5 bg-black text-white rounded-lg text-sm font-medium hover:bg-gray-800 transition-colors cursor-pointer"
                    >
                        <Save size={16} />
                        Register Student
                    </button>
                </div>
            </form>
        </div>
    )
}

function FieldInput({ label, name, value, onChange, error, placeholder, type = 'text', className = '', required = false }) {
    return (
        <div className={className}>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <input
                type={type}
                name={name}
                value={value}
                onChange={onChange}
                placeholder={placeholder}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition-all
                    ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}`}
            />
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}

function FieldSelect({ label, name, value, onChange, error, options, placeholder, required = false }) {
    return (
        <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {label}{required && <span className="text-red-500 ml-0.5">*</span>}
            </label>
            <select
                name={name}
                value={value}
                onChange={onChange}
                className={`w-full px-4 py-2.5 bg-gray-50 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer transition-all
                    ${error ? 'border-red-300 bg-red-50' : 'border-gray-200'}
                    ${!value ? 'text-gray-400' : 'text-gray-900'}`}
            >
                <option value="">{placeholder}</option>
                {options.map((opt) => (
                    <option key={opt} value={opt}>{opt}</option>
                ))}
            </select>
            {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
        </div>
    )
}

export default AddStudent
