// ─── CHDS WhatsApp Service ────────────────────────────────────────────────────
// Docs: https://whatsapp-integration-system-chds.vercel.app/api-docs
// CHDS has built-in scheduling — no cron job needed on our server!
// Fee reminder is handled by a separate external system.
// This file handles: generic send + demo lecture reminders.

const CHDS_BASE_URL = process.env.CHDS_BASE_URL || "https://outvia.onrender.com";

/**
 * Normalize a phone number to the format expected by CHDS API
 * - Removes +, spaces, dashes
 * - Adds India country code (91) if missing
 */
const normalizePhone = (phone) => {
    let p = String(phone).replace(/[\s\-\(\)\+]/g, "");
    // Add country code if not present
    if (p.length === 10) {
        p = "91" + p;
    }
    return p;
};

/**
 * Sends a plain-text WhatsApp message via CHDS API
 * @param {string} phone - phone number (10-digit or with country code)
 * @param {string} message - message body
 * @returns {{ success: boolean, error?: string }}
 */
export const sendWhatsAppMessage = async (phone, message) => {
    const apiKey = process.env.CHDS_WA_API_KEY;
    if (!apiKey) {
        console.error("[WhatsApp] CHDS_WA_API_KEY is not set in .env");
        return { success: false, error: "API key not configured" };
    }

    const normalizedPhone = normalizePhone(phone);

    try {
        const res = await fetch(`${CHDS_BASE_URL}/api/messages/send`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                phone: normalizedPhone,
                message,
            }),
        });

        const data = await res.json();

        if (!res.ok) {
            console.error(`[WhatsApp] Failed for ${normalizedPhone}:`, data);
            return { success: false, error: data?.message || "Unknown error" };
        }

        return { success: true, data };
    } catch (err) {
        console.error(`[WhatsApp] Network error for ${normalizedPhone}:`, err.message);
        return { success: false, error: err.message };
    }
};


// Call this when a demo is created / rescheduled / updated.
// Template: demo_class_scheduled (Approved ✅)
// Variables: {{1}}=studentName, {{2}}=subject, {{3}}=date, {{4}}=time
// Sends to BOTH student phone and parent phone — same template, same values.
// Scheduled 1 day before demo at 9:00 AM IST via CHDS API.
/**
 * @param {{ studentName: string, studentPhone: string, parentPhone: string, scheduledDate: Date, lectureNumber: number, subject?: string }} param0
 * @returns {{ success: boolean, results: Array }}
 */
export const scheduleDemoReminder = async ({
    studentName,
    studentPhone,
    parentPhone,
    scheduledDate,
    lectureNumber,
    subject = "",
}) => {
    const apiKey = process.env.CHDS_WA_API_KEY;
    if (!apiKey) {
        console.error("[WhatsApp] CHDS_WA_API_KEY is not set in .env");
        return { success: false, error: "API key not configured" };
    }

    // Demo ki IST date aur time nikalo
    const demoDate = new Date(scheduledDate);

    const demoDateDisplay = demoDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    });

    // Actual demo time extract karo (e.g. "3:00 PM")
    const demoTimeDisplay = demoDate.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    });

    // 1 din pehle subah 9:00 AM IST pe reminder bhejo
    const now = new Date();
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;

    // Guard: Compare IST calendar dates only (not timestamps)
    // Reason: frontend sends "YYYY-MM-DD" → parsed as UTC midnight = 5:30 AM IST
    // So a demo set for TODAY would have timestamp < now, but it's NOT in the past!
    const todayISTStr = new Date(Date.now() + IST_OFFSET_MS).toISOString().split("T")[0]; // e.g. "2026-04-12"
    const demoISTStr  = new Date(demoDate.getTime() + IST_OFFSET_MS).toISOString().split("T")[0]; // e.g. "2026-04-12"

    if (demoISTStr < todayISTStr) {
        // Demo date is before today in IST → definitely in the past → skip
        console.warn(`[WhatsApp] Demo already past for ${studentName} (demo: ${demoISTStr}, today: ${todayISTStr}) — skipping reminder`);
        return { success: false, error: "Demo already past, skipping reminder" };
    }
    // demoISTStr === todayISTStr → demo is TODAY → allow (will send immediately below)
    // demoISTStr >   todayISTStr → demo is future → allow (will schedule below)
    const demoDateIST = new Date(demoDate.getTime() + IST_OFFSET_MS);
    const demoDateISTStr = demoDateIST.toISOString().split("T")[0];
    const parts = demoDateISTStr.split("-");
    const dayBefore = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]) - 1);
    const yyyy = dayBefore.getFullYear();
    const mm = String(dayBefore.getMonth() + 1).padStart(2, "0");
    const dd = String(dayBefore.getDate()).padStart(2, "0");
    const scheduledTime = new Date(`${yyyy}-${mm}-${dd}T09:00:00+05:30`);

    // Template variables — same for both student and parent
    // {{1}} = Name, {{2}} = Subject, {{3}} = Date, {{4}} = Time
    const templateValues = [
        studentName,                    // {{1}}
        subject || "Demo Class",         // {{2}}
        demoDateDisplay,                // {{3}} e.g. "5 April 2026"
        demoTimeDisplay,                // {{4}} e.g. "3:00 PM" (actual time)
    ];

    // Helper: send template (scheduled or immediate)
    const sendTemplateToPhone = async (phone, label) => {
        const normalizedPhone = normalizePhone(phone);

        // Agar schedule time past ho chuki ho — turant template bhejo
        if (scheduledTime <= now) {
            console.warn(`[WhatsApp] Demo reminder time already past for ${studentName} (${label}) — sending immediately via template`);
            try {
                const res = await fetch(`${CHDS_BASE_URL}/api/messages/send-template`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        Authorization: `Bearer ${apiKey}`,
                    },
                    body: JSON.stringify({
                        phone: normalizedPhone,
                        template_name: "demo_class_scheduled",
                        language: "en",
                        template_values: templateValues,
                    }),
                });
                const rawText = await res.text();
                console.log(`[WhatsApp] Immediate template raw response (${label}):`, rawText);
                let data;
                try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }
                if (!res.ok) {
                    console.error(`[WhatsApp] Immediate template send failed (${label}):`, data);
                    return { success: false, error: data?.message || rawText };
                }
                console.log(`[WhatsApp]  Template sent immediately (${label}) for ${studentName}`);
                return { success: true, data };
            } catch (err) {
                console.error(`[WhatsApp] Network error on immediate template (${label}):`, err.message);
                return { success: false, error: err.message };
            }
        }

        // Future time hai — schedule karo
        const sendAt = scheduledTime.toISOString();
        try {
            const res = await fetch(`${CHDS_BASE_URL}/api/scheduled-messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    contact_phone: normalizedPhone,
                    send_at: sendAt,
                    message_type: "template",
                    template_name: "demo_class_scheduled",
                    language: "en",
                    template_values: templateValues,
                }),
            });

            const rawText = await res.text();
            console.log(`[WhatsApp] Scheduled template raw response (${label}):`, rawText);
            let data;
            try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }
            if (!res.ok) {
                console.error(`[WhatsApp] Demo template schedule failed (${label}) for ${studentName}:`, data);
                return { success: false, error: data?.message || rawText };
            }

            console.log(`[WhatsApp] ✅ Demo template scheduled (${label}) for ${studentName} on ${sendAt}`);
            return { success: true, scheduledId: data?.id || data?.data?.id };
        } catch (err) {
            console.error(`[WhatsApp] Network error scheduling template (${label}) for ${studentName}:`, err.message);
            return { success: false, error: err.message };
        }
    };

    const [studentResult, parentResult] = await Promise.all([
        sendTemplateToPhone(studentPhone, "student"),
        sendTemplateToPhone(parentPhone, "parent"),
    ]);

    return {
        success: studentResult.success || parentResult.success,
        results: [
            { to: "student", phone: studentPhone, ...studentResult },
            { to: "parent", phone: parentPhone, ...parentResult },
        ],
    };
};

// ─── cancelScheduledReminder ─────────────────────────────────────────────────
// Call this before rescheduling a demo to cancel the old CHDS scheduled message.
// Safe to call with null/undefined — will no-op silently.
/**
 * @param {string|null} msgId - CHDS scheduled message ID to cancel
 * @returns {{ success: boolean, error?: string }}
 */
export const cancelScheduledReminder = async (msgId) => {
    if (!msgId) return { success: true, skipped: true };

    const apiKey = process.env.CHDS_WA_API_KEY;
    if (!apiKey) {
        console.error("[WhatsApp] CHDS_WA_API_KEY is not set in .env");
        return { success: false, error: "API key not configured" };
    }

    try {
        const res = await fetch(`${CHDS_BASE_URL}/api/scheduled-messages/${msgId}`, {
            method: "DELETE",
            headers: {
                Authorization: `Bearer ${apiKey}`,
            },
        });

        if (!res.ok) {
            const rawText = await res.text();
            console.warn(`[WhatsApp] Cancel scheduled msg ${msgId} failed:`, rawText);
            return { success: false, error: rawText };
        }

        console.log(`[WhatsApp] ✅ Cancelled scheduled message: ${msgId}`);
        return { success: true };
    } catch (err) {
        console.error(`[WhatsApp] Network error cancelling msg ${msgId}:`, err.message);
        return { success: false, error: err.message };
    }
};

// ─── sendDemoRescheduledNow ─────────────────────────────────────────────────
// Call this ONLY when a demo is manually rescheduled or auto-rescheduled on absence.
// Sends the demo_class_scheduled template IMMEDIATELY (no scheduling delay).
// Same template as scheduleDemoReminder — different delivery: instant, not next-day 9 AM.
/**
 * @param {{ studentName: string, studentPhone: string, parentPhone: string, scheduledDate: Date, lectureNumber: number, subject?: string }} param0
 * @returns {{ success: boolean, results: Array }}
 */
export const sendDemoRescheduledNow = async ({
    studentName,
    studentPhone,
    parentPhone,
    scheduledDate,
    lectureNumber,
    subject = "",
}) => {
    const apiKey = process.env.CHDS_WA_API_KEY;
    if (!apiKey) {
        console.error("[WhatsApp] CHDS_WA_API_KEY is not set in .env");
        return { success: false, error: "API key not configured" };
    }

    const demoDate = new Date(scheduledDate);

    const demoDateDisplay = demoDate.toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    });

    const demoTimeDisplay = demoDate.toLocaleTimeString("en-IN", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
        timeZone: "Asia/Kolkata",
    });

    // Template variables — same as scheduleDemoReminder
    // {{1}} = Name, {{2}} = Subject, {{3}} = Date, {{4}} = Time
    const templateValues = [
        studentName,
        subject || "Demo Class",
        demoDateDisplay,
        demoTimeDisplay,
    ];

    const sendToPhone = async (phone, label) => {
        const normalizedPhone = normalizePhone(phone);
        try {
            const res = await fetch(`${CHDS_BASE_URL}/api/messages/send-template`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    phone: normalizedPhone,
                    template_name: "demo_class_scheduled",
                    language: "en",
                    template_values: templateValues,
                }),
            });
            const rawText = await res.text();
            console.log(`[WhatsApp] Reschedule immediate raw (${label}):`, rawText);
            let data;
            try { data = JSON.parse(rawText); } catch { data = { message: rawText }; }
            if (!res.ok) {
                console.error(`[WhatsApp] Reschedule send failed (${label}) for ${studentName}:`, data);
                return { success: false, error: data?.message || rawText };
            }
            console.log(`[WhatsApp] ✅ Reschedule message sent immediately (${label}) to ${studentName}`);
            return { success: true, data };
        } catch (err) {
            console.error(`[WhatsApp] Network error on reschedule (${label}) for ${studentName}:`, err.message);
            return { success: false, error: err.message };
        }
    };

    const [studentResult, parentResult] = await Promise.all([
        sendToPhone(studentPhone, "student"),
        sendToPhone(parentPhone, "parent"),
    ]);

    return {
        success: studentResult.success || parentResult.success,
        results: [
            { to: "student", phone: studentPhone, ...studentResult },
            { to: "parent", phone: parentPhone, ...parentResult },
        ],
    };
};

// ─── Template version (uncomment when Meta template is approved) ──────────────
// export const sendFeeReminderTemplate = async ({ studentName, parentPhone, month, year }) => {
//     const MONTH_NAMES = ["","January","February","March","April","May","June","July","August","September","October","November","December"];
//     const apiKey = process.env.CHDS_WA_API_KEY;
//     const res = await fetch(`${CHDS_BASE_URL}/api/messages/send-template`, {
//         method: "POST",
//         headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
//         body: JSON.stringify({
//             phone: normalizePhone(parentPhone),
//             template_name: "monthly_fees_reminder",   // <-- your template name here
//             language: "hi",
//             template_values: [studentName, MONTH_NAMES[month], String(year)],
//         }),
//     });
//     return res.ok ? { success: true } : { success: false, error: (await res.json())?.message };
// };
