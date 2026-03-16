// ─── CHDS WhatsApp Service ────────────────────────────────────────────────────
// Docs: https://whatsapp-integration-system-chds.vercel.app/api-docs
// CHDS has built-in scheduling — no cron job needed on our server!
// Fee reminder is handled by a separate external system.
// This file handles: generic send + demo lecture reminders.

const CHDS_BASE_URL = "https://whatsapp-integration-system-chds.vercel.app";

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
// CHDS will automatically send WhatsApp 1 day before scheduledDate at 9:00 AM IST.
// Sends to BOTH student phone and parent phone.
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

    // Demo ki IST date string nikalo
    const IST_OFFSET_MS = 5.5 * 60 * 60 * 1000;
    const demoDateIST = new Date(new Date(scheduledDate).getTime() + IST_OFFSET_MS);
    const demoDateISTStr = demoDateIST.toISOString().split("T")[0]; // "2026-03-15"

    const demoDateDisplay = new Date(scheduledDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Kolkata",
    });

    // 1 din pehle subah 9:00 AM IST
    const parts = demoDateISTStr.split("-");
    const dayBefore = new Date(
        parseInt(parts[0]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]) - 1
    );
    const yyyy = dayBefore.getFullYear();
    const mm = String(dayBefore.getMonth() + 1).padStart(2, "0");
    const dd = String(dayBefore.getDate()).padStart(2, "0");
    const scheduledTime = new Date(`${yyyy}-${mm}-${dd}T09:00:00+05:30`);
    const now = new Date();

    const subjectLine = subject ? `📖 *Subject:* ${subject}\n` : "";
    const lectureLabel = `Demo Lecture ${lectureNumber}`;

    // Student ko message
    const studentMessage =
        `🎓 *MindSeeds Demo Reminder*\n\n` +
        `Hi *${studentName}*,\n\n` +
        `Kal aapka *${lectureLabel}* scheduled hai!\n\n` +
        `📅 *Date:* ${demoDateDisplay}\n` +
        `⏰ *Time:* 9:00 AM\n` +
        subjectLine +
        `\nKripaya samay par aayein.\nDhanyavaad! 🙏`;

    // Parent ko message
    const parentMessage =
        `🎓 *MindSeeds Demo Reminder*\n\n` +
        `Dear Parent,\n\n` +
        `Kal aapke bache *${studentName}* ka *${lectureLabel}* scheduled hai!\n\n` +
        `📅 *Date:* ${demoDateDisplay}\n` +
        `⏰ *Time:* 9:00 AM\n` +
        subjectLine +
        `\nKripaya unhe samay par bhejein.\nDhanyavaad! 🙏`;

    // Helper: schedule OR immediate send
    const scheduleOne = async (phone, message, label) => {
        const normalizedPhone = normalizePhone(phone);

        // Agar time already past ho toh turant bhejo
        if (scheduledTime <= now) {
            console.warn(`[WhatsApp] Demo reminder time already past for ${studentName} (${label}) — sending immediately`);
            return sendWhatsAppMessage(phone, message);
        }

        const sendAt = scheduledTime.toISOString();
        try {
            const res = await fetch(`https://whatsapp-integration-system-chds.vercel.app/api/scheduled-messages`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    contact_phone: normalizedPhone,
                    send_at: sendAt,
                    message,
                    message_type: "text",
                }),
            });

            const data = await res.json();
            if (!res.ok) {
                console.error(`[WhatsApp] Demo reminder schedule failed (${label}) for ${studentName}:`, data);
                return { success: false, error: data?.message || "Unknown error" };
            }

            console.log(`[WhatsApp] ✅ Demo reminder scheduled (${label}) for ${studentName} on ${sendAt}`);
            return { success: true, scheduledId: data?.id || data?.data?.id };
        } catch (err) {
            console.error(`[WhatsApp] Network error (${label}) for ${studentName}:`, err.message);
            return { success: false, error: err.message };
        }
    };

    const [studentResult, parentResult] = await Promise.all([
        scheduleOne(studentPhone, studentMessage, "student"),
        scheduleOne(parentPhone, parentMessage, "parent"),
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
