import { useState, useEffect, useCallback } from 'react';
import {
    IndianRupee, Phone, CalendarClock, CalendarDays,
    StickyNote, Check, ChevronRight, ArrowLeft,
    RefreshCw, BadgeIndianRupee,
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { useNotifications } from '../../context/NotificationContext';

// Returns actual days diff — negative = overdue
function getDaysUntil(feesDate) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(feesDate); due.setHours(0, 0, 0, 0);
    return Math.round((due - today) / 86400000);
}

function formatDate(dateStr) {
    return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
}

function getDueBadge(days) {
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, cls: 'bg-red-50 text-red-700 border-red-200' };
    if (days === 0) return { label: 'Today', cls: 'bg-red-50 text-red-600 border-red-200' };
    if (days === 1) return { label: 'Tomorrow', cls: 'bg-amber-50 text-amber-700 border-amber-200' };
    return { label: 'In 2 Days', cls: 'bg-blue-50 text-blue-600 border-blue-200' };
}

const CONTACTED_CONFIG = {
    will_pay: { label: 'Will Pay', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: '📞' },
    no_answer: { label: 'No Answer', cls: 'bg-gray-100 text-gray-600 border-gray-200', icon: '📵' },
    called: { label: 'Called', cls: 'bg-blue-50 text-blue-600 border-blue-200', icon: '✅' },
};

const CONTACTED_STATUSES = ['will_pay', 'no_answer', 'called'];

/* ─── Detail Page ─────────────────────────────────────── */
function DetailPage({ student, onBack, onMarkDone, onReschedule, onNoteChange, onPartialPay }) {
    const [noteText, setNoteText] = useState(student.note || '');
    const [paymentMethod, setPaymentMethod] = useState('Cash');
    const [newDate, setNewDate] = useState(student.feesDate || '');
    const [loading, setLoading] = useState(false);
    const [partialAmount, setPartialAmount] = useState('');
    const [partialLoading, setPartialLoading] = useState(false);

    const days = getDaysUntil(student.feesDate);
    const dueBadge = getDueBadge(days);
    const isContacted = CONTACTED_STATUSES.includes(student.status);
    const contactedCfg = isContacted ? CONTACTED_CONFIG[student.status] : null;

    const wrap = async (fn) => { setLoading(true); try { await fn(); } finally { setLoading(false); } };

    const handlePartialPay = async () => {
        const amt = Number(partialAmount);
        if (!amt || amt <= 0) { toast.error('Please enter a valid amount'); return; }
        if (amt >= (student.installment ?? 0)) {
            toast.error('Partial amount must be less than the full installment — use "Mark as Paid" for full payment');
            return;
        }
        setPartialLoading(true);
        try { 
            const finalNote = noteText ? `[${paymentMethod}] ${noteText}` : `Partial payment via ${paymentMethod}`;
            await onPartialPay(student._id, amt, finalNote, paymentMethod); 
            setPartialAmount(''); 
            onBack(); 
        }
        finally { setPartialLoading(false); }
    };

    return (
        <div className="max-w-lg mx-auto">
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-6 transition-colors cursor-pointer group">
                <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to Fee Reminders
            </button>

            {/* Header */}
            <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-[#f0e6f6] flex items-center justify-center text-[#5e3174] font-bold text-sm flex-shrink-0">
                    {student.fullName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                    <h2 className="text-base font-semibold text-gray-900">{student.fullName}</h2>
                    <p className="text-xs text-gray-400 mt-0.5">Class {student.class} · {student.branch}</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full border ${dueBadge.cls}`}>{dueBadge.label}</span>
                    {isContacted && (
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-full border ${contactedCfg.cls}`}>
                            {contactedCfg.icon} {contactedCfg.label}
                        </span>
                    )}
                </div>
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
                            <IndianRupee size={13} />{(student.installment ?? 0).toLocaleString('en-IN')}
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
                        onClick={() => wrap(async () => { await onNoteChange(student._id, student.status, noteText); })}
                        disabled={loading}
                        className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium bg-gray-800 hover:bg-gray-900 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50"
                    >
                        {loading ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />}
                        Save Note
                    </button>
                </div>
            </div>

            {/* Reschedule */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2.5">
                    <CalendarDays size={12} /> Reschedule Fee Date
                </label>
                <div className="flex items-center gap-2">
                    <input
                        type="date" value={newDate}
                        onChange={e => setNewDate(e.target.value)}
                        className="flex-1 text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2 outline-none focus:border-[#5e3174] focus:bg-white transition-colors"
                    />
                    <button
                        onClick={() => wrap(async () => { await onReschedule(student._id, newDate, noteText); onBack(); })}
                        disabled={loading}
                        className="flex items-center gap-1 px-3.5 py-2 text-xs font-medium border border-gray-200 text-gray-600 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                        {loading ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />} Confirm
                    </button>
                </div>
            </div>

            {/* Payment Method Selector */}
            <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-4 mb-4">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-gray-600 mb-2.5">
                    <IndianRupee size={12} /> Payment Method
                </label>
                <div className="flex bg-gray-50 border border-gray-100 p-0.5 rounded-lg w-full">
                    {['UPI', 'Cash', 'Bank Transfer'].map(mode => (
                        <button
                            key={mode}
                            onClick={() => setPaymentMethod(mode)}
                            className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${paymentMethod === mode ? 'bg-white shadow-sm text-[#5e3174] border border-gray-200' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            {mode}
                        </button>
                    ))}
                </div>
            </div>

            {/* Partial Payment */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl shadow-sm p-4 mb-3">
                <label className="flex items-center gap-1.5 text-xs font-semibold text-amber-700 mb-1">
                    <IndianRupee size={12} /> Record Partial Payment
                </label>
                <p className="text-[11px] text-amber-600 mb-2.5">
                    Installment: <span className="font-bold">₹{(student.installment ?? 0).toLocaleString('en-IN')}</span>
                    &nbsp;— Received a partial amount? Enter it here.
                </p>
                <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">₹</span>
                        <input
                            type="number" min="1" max={(student.installment ?? 1) - 1}
                            value={partialAmount}
                            onChange={e => setPartialAmount(e.target.value)}
                            placeholder="e.g. 500"
                            className="w-full pl-7 pr-3 py-2 text-xs text-gray-800 bg-white border border-amber-300 rounded-lg outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-200 transition-colors"
                        />
                    </div>
                    <button
                        onClick={handlePartialPay}
                        disabled={partialLoading || !partialAmount}
                        className="flex items-center gap-1 px-3.5 py-2 text-xs font-medium bg-amber-500 hover:bg-amber-600 text-white rounded-lg cursor-pointer transition-colors whitespace-nowrap disabled:opacity-50"
                    >
                        {partialLoading ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />}
                        Save
                    </button>
                </div>
            </div>

            {/* Call status buttons — marks contacted, moves card to Contacted section */}
            <div className="bg-gray-50 border border-gray-100 rounded-xl p-3 mb-3">
                <p className="text-[10px] text-gray-400 text-center mb-2">Update call status — card stays visible until payment is received</p>
                <div className="grid grid-cols-2 gap-2">
                    <button
                        onClick={() => wrap(async () => { await onMarkDone(student._id, 'will_pay'); onBack(); })}
                        disabled={loading}
                        className={`flex justify-center py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
                            student.status === 'will_pay'
                                ? 'bg-emerald-100 text-emerald-800 ring-2 ring-emerald-300'
                                : 'bg-blue-50 hover:bg-blue-100 text-blue-700'
                        }`}
                    >
                        📞 Will Pay
                    </button>
                    <button
                        onClick={() => wrap(async () => { await onMarkDone(student._id, 'no_answer'); onBack(); })}
                        disabled={loading}
                        className={`flex justify-center py-2.5 text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50 ${
                            student.status === 'no_answer'
                                ? 'bg-gray-200 text-gray-800 ring-2 ring-gray-300'
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                    >
                        📵 No Answer
                    </button>
                </div>
            </div>

            <button
                onClick={() => wrap(async () => { 
                    const finalNote = noteText ? `[${paymentMethod}] ${noteText}` : `Paid via ${paymentMethod}`;
                    await onMarkDone(student._id, 'paid', finalNote, paymentMethod); 
                    onBack(); 
                })}
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold rounded-xl transition-colors cursor-pointer disabled:opacity-50"
            >
                <BadgeIndianRupee size={16} />
                Mark as Paid (Full)
            </button>
        </div>
    );
}

/* ─── Student Card ─────────────────────────────────────── */
function StudentCard({ student, notes, onSelect, showStatusBadge = false }) {
    const days = getDaysUntil(student.feesDate);
    return (
        <button
            onClick={() => onSelect(student)}
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
                        {showStatusBadge && CONTACTED_CONFIG[student.status] && (
                            <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.5 rounded-full border mt-0.5 ${CONTACTED_CONFIG[student.status].cls}`}>
                                {CONTACTED_CONFIG[student.status].icon} {CONTACTED_CONFIG[student.status].label}
                                {days < 0 && <span className="opacity-70">· {Math.abs(days)}d overdue</span>}
                            </span>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 ml-3">
                    <span className="flex items-center gap-0.5 text-xs font-semibold text-emerald-700">
                        <IndianRupee size={11} />{(student.installment ?? 0).toLocaleString('en-IN')}
                    </span>
                    {notes[student._id] && <span className="text-[10px]">📝</span>}
                    <ChevronRight size={14} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
                </div>
            </div>
        </button>
    );
}

/* ─── List View ─────────────────────────────────────────── */
function ListView({ pendingStudents, contactedStudents, notes, onSelect }) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const todayLabel = today.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

    const overdue   = pendingStudents.filter(s => getDaysUntil(s.feesDate) < 0).sort((a, b) => getDaysUntil(a.feesDate) - getDaysUntil(b.feesDate));
    const todayList = pendingStudents.filter(s => getDaysUntil(s.feesDate) === 0);
    const tomorrowList = pendingStudents.filter(s => getDaysUntil(s.feesDate) === 1);
    const in2DaysList  = pendingStudents.filter(s => getDaysUntil(s.feesDate) === 2);

    const pendingGroups = [
        overdue.length     && { key: 'overdue',   label: 'Overdue',    text: 'text-red-700',   list: overdue,      date: null },
        todayList.length   && { key: 'today',      label: 'Today',      text: 'text-red-600',   list: todayList,    date: todayList[0]?.feesDate },
        tomorrowList.length && { key: 'tomorrow',  label: 'Tomorrow',   text: 'text-amber-600', list: tomorrowList, date: tomorrowList[0]?.feesDate },
        in2DaysList.length  && { key: 'in2days',   label: 'In 2 Days',  text: 'text-blue-600',  list: in2DaysList,  date: in2DaysList[0]?.feesDate },
    ].filter(Boolean);

    const total = pendingStudents.length + contactedStudents.length;

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
                <div className="space-y-8">
                    {/* ── Section 1: Pending (not yet called) ── */}
                    {pendingGroups.length > 0 && (
                        <div className="space-y-6">
                            {pendingGroups.map(group => (
                                <div key={group.key}>
                                    <div className="flex items-baseline gap-2 mb-3">
                                        <span className={`text-[11px] font-bold uppercase tracking-widest ${group.text}`}>{group.label}</span>
                                        {group.date && <span className="text-[11px] text-gray-400">— {formatDate(group.date)}</span>}
                                        <span className="ml-auto text-[11px] text-gray-300">{group.list.length}</span>
                                    </div>
                                    <div className="space-y-2">
                                        {group.list.map(student => (
                                            <StudentCard key={student._id} student={student} notes={notes} onSelect={onSelect} />
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* ── Section 2: Contacted (called but not paid) ── */}
                    {contactedStudents.length > 0 && (
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <div className="h-px flex-1 bg-gray-100" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-gray-400 px-2">
                                    Contacted — Awaiting Payment ({contactedStudents.length})
                                </span>
                                <div className="h-px flex-1 bg-gray-100" />
                            </div>
                            <p className="text-[11px] text-gray-400 text-center mb-3">
                                These students have been contacted — they will remain here until payment is received
                            </p>
                            <div className="space-y-2">
                                {contactedStudents.map(student => (
                                    <StudentCard key={student._id} student={student} notes={notes} onSelect={onSelect} showStatusBadge={true} />
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

/* ─── Root ─────────────────────────────────────────────── */
function FeeManagement() {
    const [pendingStudents, setPendingStudents] = useState([]);
    const [contactedStudents, setContactedStudents] = useState([]);
    const [notes, setNotes] = useState({});
    const [selected, setSelected] = useState(null);
    const [loading, setLoading] = useState(true);
    const { refreshCalls: refreshNotifications } = useNotifications();

    const fetchCalls = useCallback(async () => {
        try {
            const [pendingRes, rescheduledRes, willPayRes, noAnswerRes, calledRes] = await Promise.all([
                axios.get(`/api/v1/calls?status=pending`),
                axios.get(`/api/v1/calls?status=rescheduled`),
                axios.get(`/api/v1/calls?status=will_pay`),
                axios.get(`/api/v1/calls?status=no_answer`),
                axios.get(`/api/v1/calls?status=called`),
            ]);

            const mapCall = (call) => {
                const effectiveDate =
                    call.status === 'rescheduled' && call.rescheduled_to
                        ? call.rescheduled_to.split('T')[0]
                        : call.due_date
                        ? call.due_date.split('T')[0]
                        : new Date().toISOString().split('T')[0];
                return {
                    _id: call._id,
                    fullName: call.student_name,
                    class: call.student_class || 'N/A',
                    branch: call.branch,
                    phone: call.student_phone,
                    parentPhone: call.parent_phone,
                    feesDate: effectiveDate,
                    installment: call.installment_amount || 0,
                    note: call.call_notes || '',
                    status: call.status,
                };
            };

            // Pending: show if overdue (any past date) OR upcoming 0-2 days
            const allPending = [
                ...(pendingRes.data.data || []),
                ...(rescheduledRes.data.data || []),
            ].map(mapCall).filter(s => getDaysUntil(s.feesDate) <= 2);

            // Contacted: show ALL until paid (will_pay, no_answer, called)
            const contacted = [
                ...(willPayRes.data.data || []),
                ...(noAnswerRes.data.data || []),
                ...(calledRes.data.data || []),
            ].map(mapCall);

            const mappedNotes = {};
            [...allPending, ...contacted].forEach(s => { if (s.note) mappedNotes[s._id] = s.note; });

            setNotes(mappedNotes);
            setPendingStudents(allPending);
            setContactedStudents(contacted);
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to fetch fee reminders');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchCalls(); }, [fetchCalls]);

    const handleMarkDone = async (id, status, extraNotes = '', paymentMethod = '') => {
        const isPaid = ['paid', 'done'].includes(status);
        const isContact = CONTACTED_STATUSES.includes(status);

        if (isPaid) {
            // Remove from both sections
            setPendingStudents(prev => prev.filter(s => s._id !== id));
            setContactedStudents(prev => prev.filter(s => s._id !== id));
        } else if (isContact) {
            // Move from pending → contacted (or update status in contacted)
            setPendingStudents(prev => {
                const student = prev.find(s => s._id === id);
                if (student) {
                    setContactedStudents(c => {
                        const exists = c.find(s => s._id === id);
                        if (exists) return c.map(s => s._id === id ? { ...s, status } : s);
                        return [...c, { ...student, status }];
                    });
                    return prev.filter(s => s._id !== id);
                }
                return prev;
            });
            setContactedStudents(prev => prev.map(s => s._id === id ? { ...s, status } : s));
        }

        try {
            const payload = { status };
            if (extraNotes) payload.call_notes = extraNotes;
            if (paymentMethod) payload.payment_method = paymentMethod;
            await axios.patch(`/api/v1/calls/${id}`, payload);
            toast.success(`Marked as ${status.replace('_', ' ')}`);
            fetchCalls();
            refreshNotifications();
        } catch (err) {
            fetchCalls();
            toast.error(err.response?.data?.message || 'Failed to update');
        }
    };

    const handleReschedule = async (id, date, note) => {
        try {
            await axios.patch(`/api/v1/calls/${id}`, { status: 'rescheduled', rescheduled_to: date, call_notes: note });
            toast.success('Fee rescheduled');
            fetchCalls();
            refreshNotifications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to reschedule');
        }
    };

    const handleNoteChange = async (id, currentStatus, text) => {
        // Keep existing status, just update note
        try {
            await axios.patch(`/api/v1/calls/${id}`, { status: currentStatus || 'called', call_notes: text });
            toast.success('Note saved');
            setNotes(p => ({ ...p, [id]: text }));
            fetchCalls();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Failed to save note');
        }
    };

    const handlePartialPay = async (id, amt, noteText, paymentMethod = '') => {
        try {
            const res = await axios.patch(`/api/v1/calls/${id}/partial-pay`, {
                amountPaid: amt,
                notes: noteText || `Partial payment: ₹${amt} received`,
                payment_method: paymentMethod,
            });
            const { remainingAmount } = res.data.data;
            toast.success(`✅ ₹${amt} recorded! Remaining ₹${remainingAmount} distributed across future installments.`, { duration: 5000 });
            setPendingStudents(prev => prev.filter(s => s._id !== id));
            setContactedStudents(prev => prev.filter(s => s._id !== id));
            fetchCalls();
            refreshNotifications();
        } catch (err) {
            toast.error(err.response?.data?.message || 'Partial payment save nahi hua');
            throw err;
        }
    };

    if (loading && pendingStudents.length === 0 && contactedStudents.length === 0) {
        return (
            <div className="max-w-2xl mx-auto space-y-3 pt-10">
                {[1, 2, 3].map(i => <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />)}
            </div>
        );
    }

    if (selected) {
        return (
            <DetailPage
                student={selected}
                onBack={() => setSelected(null)}
                onMarkDone={handleMarkDone}
                onReschedule={handleReschedule}
                onNoteChange={handleNoteChange}
                onPartialPay={handlePartialPay}
            />
        );
    }

    return (
        <ListView
            pendingStudents={pendingStudents}
            contactedStudents={contactedStudents}
            notes={notes}
            onSelect={setSelected}
        />
    );
}

export default FeeManagement;