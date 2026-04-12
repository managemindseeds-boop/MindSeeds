// Quick test — run: node test_whatsapp.js
// Tests the time extraction logic WITHOUT sending a real message

// Simulate different demo times
const testCases = [
    { label: "Morning demo", date: "2026-04-13T04:30:00.000Z" },   // 10:00 AM IST
    { label: "Afternoon demo", date: "2026-04-13T09:30:00.000Z" }, // 3:00 PM IST
    { label: "Evening demo", date: "2026-04-13T12:00:00.000Z" },   // 5:30 PM IST
    { label: "Past demo (today)", date: new Date().toISOString() }, // Current time
];

console.log("=== WhatsApp Template Values Test ===\n");

for (const tc of testCases) {
    const demoDate = new Date(tc.date);

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

    const templateValues = [
        "Rahul Sharma",          // {{1}} studentName
        "Physics",               // {{2}} subject
        demoDateDisplay,         // {{3}} date
        demoTimeDisplay,         // {{4}} time
    ];

    console.log(`📌 ${tc.label}:`);
    console.log(`   Input:  ${tc.date}`);
    console.log(`   {{1}} Name:    ${templateValues[0]}`);
    console.log(`   {{2}} Subject: ${templateValues[1]}`);
    console.log(`   {{3}} Date:    ${templateValues[2]}`);
    console.log(`   {{4}} Time:    ${templateValues[3]}`);
    console.log(`   Message: "Hi ${templateValues[0]}, your ${templateValues[1]} demo is on ${templateValues[2]} at ${templateValues[3]}"`);
    console.log("");
}

console.log("✅ If times above match IST correctly, implementation is working!");
