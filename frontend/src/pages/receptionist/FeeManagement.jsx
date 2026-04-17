import { useState, useEffect, useCallback } from 'react';
import {
    IndianRupee, Phone, CalendarClock, CalendarDays,
    StickyNote, Check, ChevronRight, ArrowLeft,
    RefreshCw, BadgeIndianRupee, CheckCircle2, Clock,
    PhoneOff, CreditCard, Banknote, Wallet,
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
    const [newDate, setNewDate] = useState('');
    const [loading, setLoading] = useState(false);
    const [partialAmount, setPartialAmount] = useState('');
    const [partialLoading, setPartialLoading] = useState(false);
    const [showReschedule, setShowReschedule] = useState(false);

    const days = getDaysUntil(student.feesDate);
    const dueBadge = getDueBadge(days);
    const isContacted = CONTACTED_STATUSES.includes(student.status);
    const contactedCfg = isContacted ? CONTACTED_CONFIG[student.status] : null;
    const installmentAmt = student.installment ?? 0;
    const enteredAmount = Number(partialAmount) || 0;
    const isFullPayment = enteredAmount >= installmentAmt && enteredAmount > 0;
    const isPartialPayment = enteredAmount > 0 && enteredAmount < installmentAmt;

    const initials = student.fullName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

    const wrap = async (fn) => { setLoading(true); try { await fn(); } finally { setLoading(false); } };

    const handlePartialPay = async () => {
        const amt = Number(partialAmount);
        if (!amt || amt <= 0) { toast.error('Please enter a valid amount'); return; }
        if (amt >= installmentAmt) {
            toast.error('Use "Full Payment" for the complete installment amount');
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

    const handleFullPayment = async () => {
        setLoading(true);
        try {
            const finalNote = noteText ? `[${paymentMethod}] ${noteText}` : `Paid via ${paymentMethod}`;
            await onMarkDone(student._id, 'paid', finalNote, paymentMethod);
            onBack();
        } finally { setLoading(false); }
    };

    return (
        <div className="max-w-4xl mx-auto">
            {/* Back */}
            <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 mb-5 transition-colors cursor-pointer group">
                <ArrowLeft size={15} className="group-hover:-translate-x-0.5 transition-transform" />
                Back to Fee Reminders
            </button>

            {/* TOP ROW: Student Info + Fee Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                {/* Student Info */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                    <div className="flex items-center gap-3.5 mb-3.5">
                        <div className="w-12 h-12 rounded-full bg-[#5e3174] flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                            {initials}
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-gray-900">{student.fullName}</h2>
                            <p className="text-xs text-gray-400">Class {student.class} · {student.branch}</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                        <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${dueBadge.cls}`}>
                            <Clock size={11} /> {dueBadge.label}
                        </span>
                        {contactedCfg && (
                            <span className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border inline-flex items-center gap-1 ${contactedCfg.cls}`}>
                                <Phone size={11} /> {contactedCfg.label}
                            </span>
                        )}
                    </div>
                </div>

                {/* Fee Details */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-[11px] font-medium text-gray-400 mb-1">Fee Date</p>
                            <p className="text-xs font-medium text-gray-700 flex items-center gap-1">
                                <CalendarDays size={12} className="text-gray-400" />
                                {formatDate(student.feesDate)}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-gray-400 mb-1">Installment Amount</p>
                            <p className="text-lg font-bold text-[#5e3174] flex items-center gap-0.5">
                                <IndianRupee size={15} />{installmentAmt.toLocaleString('en-IN')}
                            </p>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-gray-400 mb-1">Student Phone</p>
                            <a href={`tel:${student.phone}`} className="flex items-center gap-1 text-xs font-medium text-[#5e3174] hover:underline">
                                <Phone size={12} className="text-gray-400" />{student.phone}
                            </a>
                        </div>
                        <div>
                            <p className="text-[11px] font-medium text-gray-400 mb-1">Parent Phone</p>
                            <a href={`tel:${student.parentPhone}`} className="flex items-center gap-1 text-xs font-medium text-[#5e3174] hover:underline">
                                <Phone size={12} className="text-gray-400" />{student.parentPhone}
                            </a>
                        </div>
                    </div>
                </div>
            </div>

            {/* MIDDLE ROW: Call Status + Record Payment */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">

                {/* Update Call Status */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5">
                    <p className="text-xs font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <Phone size={14} className="text-[#5e3174]" />
                        Update Call Status
                    </p>
                    <div className="flex flex-wrap gap-2 mb-3.5">
                        <button
                            onClick={() => wrap(async () => { await onMarkDone(student._id, 'will_pay'); onBack(); })}
                            disabled={loading}
                            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 border ${
                                student.status === 'will_pay'
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-300 ring-1 ring-emerald-200'
                                    : 'bg-white text-emerald-600 border-emerald-300 hover:bg-emerald-50'
                            }`}
                        >
                            <Wallet size={13} /> Will Pay
                        </button>
                        <button
                            onClick={() => wrap(async () => { await onMarkDone(student._id, 'no_answer'); onBack(); })}
                            disabled={loading}
                            className={`flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer disabled:opacity-50 border ${
                                student.status === 'no_answer'
                                    ? 'bg-red-50 text-red-700 border-red-300 ring-1 ring-red-200'
                                    : 'bg-white text-red-600 border-red-300 hover:bg-red-50'
                            }`}
                        >
                            <PhoneOff size={13} /> No Answer
                        </button>
                    </div>
                    <button
                        onClick={() => setShowReschedule(!showReschedule)}
                        className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-lg transition-colors cursor-pointer border border-blue-300 text-blue-600 hover:bg-blue-50 mb-3.5"
                    >
                        <CalendarDays size={13} /> Reschedule
                    </button>
                    <textarea
                        rows={2}
                        value={noteText}
                        onChange={e => setNoteText(e.target.value)}
                        placeholder="Add note about the call..."
                        className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 resize-none outline-none focus:border-[#5e3174] focus:bg-white transition-colors"
                    />
                    <div className="flex justify-end mt-2.5">
                        <button
                            onClick={() => wrap(async () => { await onNoteChange(student._id, student.status, noteText); })}
                            disabled={loading || !noteText.trim()}
                            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />}
                            Save
                        </button>
                    </div>
                </div>

                {/* Record Payment */}
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 border-t-[3px] border-t-[#5e3174]">
                    <p className="text-xs font-semibold text-gray-900 flex items-center gap-2 mb-1">
                        <CreditCard size={14} className="text-[#5e3174]" />
                        Record Payment
                    </p>
                    <p className="text-[11px] text-gray-400 mb-4">
                        Expected: <span className="font-semibold">₹{installmentAmt.toLocaleString('en-IN')}</span>
                    </p>

                    {/* Payment method toggle */}
                    <div className="flex bg-gray-50 border border-gray-100 p-0.5 rounded-lg w-full mb-4">
                        {['UPI', 'Cash', 'Bank Transfer'].map(mode => (
                            <button
                                key={mode}
                                onClick={() => setPaymentMethod(mode)}
                                className={`flex-1 px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer ${
                                    paymentMethod === mode
                                        ? 'bg-blue-600 text-white shadow-sm'
                                        : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                {mode}
                            </button>
                        ))}
                    </div>

                    {/* Amount label */}
                    <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                        Amount Received
                    </p>

                    {/* Amount input */}
                    <div className="relative mb-2.5">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-lg font-semibold text-gray-400">₹</span>
                        <input
                            type="number"
                            min="1"
                            value={partialAmount}
                            onChange={e => setPartialAmount(e.target.value)}
                            placeholder="0"
                            className="w-full pl-8 pr-3 py-3 text-xl font-semibold text-gray-900 bg-white border-2 border-gray-200 rounded-xl outline-none focus:border-[#5e3174] transition-colors"
                        />
                    </div>

                    {/* Amount status */}
                    {enteredAmount > 0 && (
                        <p className={`text-xs font-medium mb-3.5 flex items-center gap-1 ${isFullPayment ? 'text-emerald-600' : 'text-amber-600'}`}>
                            <CheckCircle2 size={13} />
                            {isFullPayment
                                ? `₹${enteredAmount.toLocaleString('en-IN')} — Full Payment`
                                : `₹${enteredAmount.toLocaleString('en-IN')} of ₹${installmentAmt.toLocaleString('en-IN')} — Partial Payment`
                            }
                        </p>
                    )}

                    {/* Action buttons */}
                    <div className="flex gap-2.5">
                        <button
                            onClick={handlePartialPay}
                            disabled={!isPartialPayment || partialLoading}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed ${
                                isPartialPayment
                                    ? 'bg-amber-500 hover:bg-amber-600 text-white'
                                    : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                            <Banknote size={14} /> Save Partial
                        </button>
                        <button
                            onClick={handleFullPayment}
                            disabled={!isFullPayment || loading}
                            className={`flex-1 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold rounded-xl transition-colors cursor-pointer disabled:cursor-not-allowed ${
                                isFullPayment
                                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                                    : 'bg-gray-100 text-gray-400'
                            }`}
                        >
                            <CheckCircle2 size={14} /> Full Payment
                        </button>
                    </div>

                    {isPartialPayment && (
                        <p className="text-[11px] text-emerald-600 mt-2 text-center">
                            Balance ₹{(installmentAmt - enteredAmount).toLocaleString('en-IN')} will be redistributed
                        </p>
                    )}
                    {isFullPayment && (
                        <p className="text-[11px] text-emerald-600 mt-2 text-center">
                            This will mark the installment as fully paid
                        </p>
                    )}
                </div>
            </div>

            {/* RESCHEDULE SECTION (shown when Reschedule clicked) */}
            {showReschedule && (
                <div className="bg-white border border-gray-100 rounded-xl shadow-sm p-5 mb-4 border-t-[3px] border-t-blue-600">
                    <p className="text-xs font-semibold text-gray-900 flex items-center gap-2 mb-4">
                        <CalendarDays size={14} className="text-blue-600" />
                        Reschedule Payment Date
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                        <div>
                            <p className="text-xs text-gray-500 mb-4 leading-relaxed">
                                Select a new date to follow up with the parent regarding this fee installment.
                            </p>
                            <p className="text-[11px] font-semibold text-gray-500 mb-1.5">New Follow-up Date</p>
                            <input
                                type="date"
                                value={newDate}
                                onChange={e => setNewDate(e.target.value)}
                                min={new Date().toISOString().split('T')[0]}
                                className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 outline-none focus:border-[#5e3174] focus:bg-white transition-colors"
                            />
                            <p className="text-[10px] text-gray-400 mt-1.5">This will change the fee date to the selected date.</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold text-gray-500 mb-1.5">Reason for reschedule (Optional)</p>
                            <textarea
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                placeholder="e.g. Parent requested more time..."
                                rows={3}
                                className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 resize-none outline-none focus:border-[#5e3174] focus:bg-white transition-colors"
                            />
                            <div className="flex justify-end mt-3">
                                <button
                                    onClick={() => wrap(async () => { await onReschedule(student._id, newDate, noteText); onBack(); })}
                                    disabled={loading || !newDate}
                                    className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-lg cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {loading ? <RefreshCw size={11} className="animate-spin" /> : <Check size={11} />}
                                    Confirm Reschedule
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
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