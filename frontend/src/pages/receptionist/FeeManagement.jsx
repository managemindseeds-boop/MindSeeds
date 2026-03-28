import { useState, useEffect, useCallback } from 'react';
import {
    IndianRupee, Phone, CalendarClock, CheckCircle2,
    CalendarDays, StickyNote, Check, ChevronRight, ArrowLeft,
    RefreshCw, PhoneOff, Clock
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

function getDaysUntil(feesDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(feesDate); due.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / 86400000);
    return diff >= 0 && diff <= 2 ? diff : null;
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

const TIMELINE = [
    { key: 0, dot: 'bg-red-500', ring: 'ring-red-100', label: 'Today', text: 'text-red-600', badge: 'bg-red-50 text-red-600 border-red-200' },
    { key: 1, dot: 'bg-amber-400', ring: 'ring-amber-100', label: 'Tomorrow', text: 'text-amber-600', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
    { key: 2, dot: 'bg-blue-400', ring: 'ring-blue-100', label: 'In 2 Days', text: 'text-blue-600', badge: 'bg-blue-50 text-blue-600 border-blue-200' },
];

/* ─── Detail Page ─────────────────────────────────────── */
function DetailPage({ student, timelineItem, note, onBack, onMarkDone, onReschedule, onNoteChange }) {
    const [noteText, setNoteText] = useState(note || '');
    const [newDate, setNewDate] = useState(student.feesDate || '');
    const [loading, setLoading] = useState(false);

    const handleAction = async (actionFn, loadingText) => {
        setLoading(true);
        try {
            await actionFn();
        } finally {
            setLoading(false);
        }
    };

    const handleNoteSave = () => {
        handleAction(async () => {
            await onNoteChange(student._id, noteText);
        });
    };

    const handleReschedule = () => {
        handleAction(async () => {
            await onReschedule(student._id, newDate, noteText);
            onBack();
        });
    };

    return (
        <div className="max-w-lg mx-auto">
            {/* Back button */}
            <button
                onClick={onBack}
                className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors cursor-pointer group"
            >
                <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to Fee Reminders
            </button>

            {/* Student header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#f0e6f6] flex items-center justify-center text-[#5e3174] font-bold text-sm flex-shrink-0">
                    {student.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div>
                    <h2 className="text-base font-semibold text-gray-900">{student.fullName}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Class {student.class} · {student.branch}</p>
                </div>
                <span className={`ml-auto text-xs font-semibold px-2.5 py-1 rounded-full border ${timelineItem.badge}`}>
                    {timelineItem.label}
                </span>
            </div>

            {/* Info card */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm overflow-hidden mb-4">
                <div className="divide-y divide-gray-50">
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-gray-400">Fee Date</span>
                        <span className="text-xs font-medium text-gray-700">{formatDate(student.feesDate)}</span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-gray-400">Installment</span>
                        <span className="flex items-center gap-0.5 text-sm font-bold text-emerald-700">
                            <IndianRupee size={13} />
                            {(student.installment ?? 0).toLocaleString('en-IN')}
                        </span>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-gray-400">Student Phone</span>
                        <a href={`tel:${student.phone}`} className="flex items-center gap-1 text-xs font-medium text-[#5e3174] hover:underline">
                            <Phone size={11} />{student.phone}
                        </a>
                    </div>
                    <div className="flex items-center justify-between px-4 py-3">
                        <span className="text-xs text-gray-400">Parent Phone</span>
                        <a href={`tel:${student.parentPhone}`} className="flex items-center gap-1 text-xs font-medium text-[#5e3174] hover:underline">
                            <Phone size={11} />{student.parentPhone}
                        </a>
                    </div>
                </div>
            </div>

            {/* Note */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2.5">
                    <StickyNote size={12} /> Add Note
                </label>
                <textarea
                    rows={3}
                    value={noteText}
                    onChange={e => setNoteText(e.target.value)}
                    placeholder="e.g. Parent contacted, will pay by evening..."
                    className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 resize-none outline-none focus:border-[#5e3174] focus:bg-white transition-colors"
                />
                <div className="flex justify-end mt-2">
                    <button
                        onClick={handleNoteSave}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-900 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                    >
                        {loading ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />}
                        Save Note
                    </button>
                </div>
            </div>

            {/* Reschedule */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-6">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2.5">
                    <CalendarDays size={12} /> Reschedule Fee Date
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="date"
                        value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        className="flex-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#5e3174] focus:bg-white transition-colors"
                    />
                    <button
                        onClick={handleReschedule}
                        disabled={loading}
                        className="flex items-center gap-1 px-3.5 py-2 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                        {loading ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />} Confirm
                    </button>
                </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3 mb-3">
                <button
                    onClick={() => handleAction(() => { onMarkDone(student._id, 'will_pay'); onBack(); })}
                    disabled={loading}
                    className="flex justify-center py-2.5 bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                    Will Pay
                </button>
                <button
                    onClick={() => handleAction(() => { onMarkDone(student._id, 'no_answer'); onBack(); })}
                    disabled={loading}
                    className="flex justify-center py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
                >
                    No Answer
                </button>
            </div>

            <button
                onClick={() => handleAction(() => { onMarkDone(student._id, 'done'); onBack(); })}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-[#5e3174] hover:bg-[#4a2860] text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
                <CheckCircle2 size={16} />
                Mark as Done
            </button>
        </div>
    );
}

/* ─── List View ───────────────────────────────────────── */
function ListView({ students, notes, onSelect }) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const grouped = TIMELINE
        .map(t => ({
            ...t,
            list: students.filter(s => getDaysUntil(s.feesDate) === t.key),
            date: students.find(s => getDaysUntil(s.feesDate) === t.key)?.feesDate,
        }))
        .filter(g => g.list.length > 0);

    const total = grouped.reduce((a, g) => a + g.list.length, 0);

    return (
        <div className="max-w-2xl mx-auto">
            <div className="flex items-end justify-between mb-8">
                <div>
                    <h1 className="text-base font-semibold text-gray-900">Fee Reminders</h1>
                    <p className="text-xs text-gray-400 mt-0.5">{todayLabel}</p>
                </div>
                {total > 0 && (
                    <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2.5 py-1 rounded-full">{total} pending</span>
                )}
            </div>

            {total === 0 ? (
                <div className="flex flex-col items-center justify-center py-32 gap-3">
                    <CalendarClock size={36} className="text-gray-200" strokeWidth={1.5} />
                    <p className="text-sm text-gray-400">All caught up — no fees due</p>
                </div>
            ) : (
                <div>
                    <div className="space-y-8">
                        {grouped.map(group => (
                            <div key={group.key}>
                                <div className="pb-2">
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className={`text-[11px] font-bold uppercase tracking-widest ${group.text}`}>{group.label}</span>
                                        {group.date && <span className="text-[11px] text-gray-400">— {formatDate(group.date)}</span>}
                                        <span className="ml-auto text-[11px] text-gray-300">{group.list.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {group.list.map(student => (
                                            <button
                                                key={student._id}
                                                onClick={() => onSelect({ student, timelineItem: group })}
                                                className="w-full text-left bg-white border border-gray-100 shadow-sm rounded-lg px-4 py-3 hover:border-gray-300 hover:shadow-md transition-all group cursor-pointer"
                                            >
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-3 min-w-0">
                                                        <div className="w-8 h-8 rounded-full bg-[#f0e6f6] flex items-center justify-center text-[#5e3174] font-bold text-xs flex-shrink-0">
                                                            {student.fullName.slice(0, 2).toUpperCase()}
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-sm font-semibold text-gray-800 truncate">{student.fullName}</p>
                                                            <p className="text-[11px] text-gray-400 truncate">Class {student.class} · {student.branch}</p>
                                                        </div>
                                                    </div>
                                                    <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                                                        <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-700">
                                                            <IndianRupee size={11} />
                                                            {(student.installment ?? 0).toLocaleString('en-IN')}
                                                        </span>
                                                        {notes[student._id] && <span className="text-[10px]">📝</span>}
                                                        <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

/* ─── Root ────────────────────────────────────────────── */
function FeeManagement() {
    const [students, setStudents] = useState([]);
    const [notes, setNotes] = useState({});
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);

    const fetchCalls = useCallback(async () => {
        try {
            const res = await axios.get(`/api/v1/calls?status=pending`);
            const mapped = (res.data.data || []).map(call => ({
                _id: call._id,
                fullName: call.student_name,
                class: call.student_class || 'N/A',
                branch: call.branch,
                phone: call.student_phone,
                parentPhone: call.parent_phone,
                feesDate: call.due_date ? call.due_date.split('T')[0] : new Date().toISOString().split('T')[0],
                installment: call.installment_amount || 0,
                note: call.call_notes || ''
            }));

            // Map notes directly
            const mappedNotes = {};
            mapped.forEach(s => {
                if (s.note) mappedNotes[s._id] = s.note;
            });

            setNotes(mappedNotes);
            setStudents(mapped);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch fee reminders');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchCalls();
    }, [fetchCalls]);

    const handleMarkDone = async (id, status = 'done') => {
        try {
            await axios.patch(`/api/v1/calls/${id}`, { status });
            toast.success(`Marked as ${status.replace('_', ' ')}`);
            fetchCalls(); // refresh list
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to update');
        }
    };

    const handleReschedule = async (id, date, note) => {
        try {
            await axios.patch(`/api/v1/calls/${id}`, { status: 'rescheduled', rescheduled_to: date, call_notes: note });
            toast.success('Fee rescheduled');
            fetchCalls();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reschedule');
        }
    };

    const handleNoteChange = async (id, text) => {
        try {
            await axios.patch(`/api/v1/calls/${id}`, { status: 'called', call_notes: text });
            toast.success('Note saved');
            setNotes(p => ({ ...p, [id]: text }));
            fetchCalls();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save note');
        }
    };

    if (loading && students.length === 0) {
        return (
            <div className="max-w-2xl mx-auto space-y-3 pt-10">
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    if (selected) {
        return (
            <DetailPage
                student={selected.student}
                timelineItem={selected.timelineItem}
                note={notes[selected.student._id] || ''}
                onBack={() => setSelected(null)}
                onMarkDone={handleMarkDone}
                onReschedule={handleReschedule}
                onNoteChange={handleNoteChange}
            />
        );
    }

    return (
        <ListView
            students={students}
            notes={notes}
            onSelect={setSelected}
        />
    );
}

export default FeeManagement;