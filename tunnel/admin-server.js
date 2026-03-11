// ─── ADMIN LOCAL SERVER ──────────────────────────────────────────────────────
// This runs on Admin's PC (localhost:3001)
// Fees data stays HERE — never goes to cloud!
// Cloudflare Tunnel exposes this to the cloud app

import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());
app.use(express.static(join(__dirname, 'public')));

// ─── SQLite Database (LOCAL file on admin's PC) ─────────────────────────────
const db = new Database(join(__dirname, 'fees.db'));

// Create tables
db.exec(`
  CREATE TABLE IF NOT EXISTS students (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    parentPhone TEXT NOT NULL,
    branch TEXT DEFAULT '',
    totalFee REAL DEFAULT 0,
    paymentMode TEXT DEFAULT 'installment',
    createdAt TEXT DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS fee_installments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    installmentNumber INTEGER NOT NULL,
    amount REAL NOT NULL,
    paidAmount REAL DEFAULT 0,
    dueDate TEXT NOT NULL,
    status TEXT DEFAULT 'pending',
    paidAt TEXT,
    FOREIGN KEY (studentId) REFERENCES students(id)
  );

  CREATE TABLE IF NOT EXISTS call_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    studentId INTEGER NOT NULL,
    studentName TEXT NOT NULL,
    parentPhone TEXT NOT NULL,
    reason TEXT DEFAULT 'Fee overdue',
    status TEXT DEFAULT 'pending',
    createdAt TEXT DEFAULT (datetime('now')),
    calledAt TEXT,
    FOREIGN KEY (studentId) REFERENCES students(id)
  );
`);

// ─── Insert sample data if empty ────────────────────────────────────────────
const count = db.prepare('SELECT COUNT(*) as c FROM students').get();
if (count.c === 0) {
    console.log('📦 Inserting sample data...');

    // Sample students
    const insertStudent = db.prepare(
        'INSERT INTO students (name, parentPhone, branch, totalFee, paymentMode) VALUES (?, ?, ?, ?, ?)'
    );
    insertStudent.run('Rahul Sharma', '9876543210', 'Science', 40000, 'installment');
    insertStudent.run('Priya Patel', '9876543211', 'Commerce', 40000, 'lumpsum');
    insertStudent.run('Amit Kumar', '9876543212', 'Science', 40000, 'installment');

    // Sample installments for Rahul (4 installments of ₹10,000)
    const insertInst = db.prepare(
        'INSERT INTO fee_installments (studentId, installmentNumber, amount, dueDate, status) VALUES (?, ?, ?, ?, ?)'
    );
    insertInst.run(1, 1, 10000, '2026-03-10', 'paid');
    insertInst.run(1, 2, 10000, '2026-04-10', 'pending');
    insertInst.run(1, 3, 10000, '2026-05-10', 'pending');
    insertInst.run(1, 4, 10000, '2026-06-10', 'pending');

    // Priya: lumpsum
    insertInst.run(2, 1, 40000, '2026-03-10', 'pending');

    // Amit: installments
    insertInst.run(3, 1, 10000, '2026-03-10', 'paid');
    insertInst.run(3, 2, 10000, '2026-04-10', 'overdue');
    insertInst.run(3, 3, 10000, '2026-05-10', 'pending');
    insertInst.run(3, 4, 10000, '2026-06-10', 'pending');

    // Sample call request (Amit is overdue)
    db.prepare(
        'INSERT INTO call_requests (studentId, studentName, parentPhone, reason) VALUES (?, ?, ?, ?)'
    ).run(3, 'Amit Kumar', '9876543212', 'Fee overdue - Installment 2');

    console.log('✅ Sample data inserted!');
}

// ═══════════════════════════════════════════════════════════════════════════════
// API ENDPOINTS — These are what Cloudflare Tunnel exposes
// ═══════════════════════════════════════════════════════════════════════════════

// ─── GET all students with fees ──────────────────────────────────────────────
app.get('/api/fees/students', (req, res) => {
    const students = db.prepare(`
    SELECT s.*, 
      (SELECT SUM(paidAmount) FROM fee_installments WHERE studentId = s.id) as totalPaid,
      (SELECT COUNT(*) FROM fee_installments WHERE studentId = s.id AND status = 'overdue') as overdueCount
    FROM students s
  `).all();
    res.json({ success: true, data: students });
});

// ─── GET installments for a student ──────────────────────────────────────────
app.get('/api/fees/student/:id', (req, res) => {
    const installments = db.prepare(
        'SELECT * FROM fee_installments WHERE studentId = ? ORDER BY installmentNumber'
    ).all(req.params.id);
    res.json({ success: true, data: installments });
});

// ─── MARK fee as paid (full or partial) ──────────────────────────────────────
app.patch('/api/fees/:id/pay', (req, res) => {
    const { amount } = req.body;
    const fee = db.prepare('SELECT * FROM fee_installments WHERE id = ?').get(req.params.id);
    if (!fee) return res.status(404).json({ success: false, error: 'Fee not found' });

    const paidAmount = amount || fee.amount;

    if (paidAmount >= fee.amount) {
        // Full payment
        db.prepare(
            "UPDATE fee_installments SET paidAmount = ?, status = 'paid', paidAt = datetime('now') WHERE id = ?"
        ).run(fee.amount, fee.id);
        res.json({ success: true, message: `✅ Full payment of ₹${fee.amount} recorded` });
    } else {
        // Partial payment — shortfall goes to remaining installments
        const shortfall = fee.amount - paidAmount;
        db.prepare(
            "UPDATE fee_installments SET paidAmount = ?, status = 'partial_paid', paidAt = datetime('now') WHERE id = ?"
        ).run(paidAmount, fee.id);

        // Distribute shortfall to remaining installments
        const remaining = db.prepare(
            "SELECT * FROM fee_installments WHERE studentId = ? AND status = 'pending' AND installmentNumber > ? ORDER BY installmentNumber"
        ).all(fee.studentId, fee.installmentNumber);

        if (remaining.length > 0) {
            const extra = Math.ceil(shortfall / remaining.length);
            for (const r of remaining) {
                db.prepare('UPDATE fee_installments SET amount = amount + ? WHERE id = ?')
                    .run(extra, r.id);
            }
        }

        res.json({
            success: true,
            message: `⚠️ Partial payment ₹${paidAmount}. Shortfall ₹${shortfall} distributed to ${remaining.length} remaining installments`,
        });
    }
});

// ─── ADMIN: Create call request ──────────────────────────────────────────────
app.post('/api/call-requests', (req, res) => {
    const { studentId, reason } = req.body;
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(studentId);
    if (!student) return res.status(404).json({ success: false, error: 'Student not found' });

    db.prepare(
        'INSERT INTO call_requests (studentId, studentName, parentPhone, reason) VALUES (?, ?, ?, ?)'
    ).run(student.id, student.name, student.parentPhone, reason || 'Fee follow-up');

    res.json({ success: true, message: `📞 Call request created for ${student.name}` });
});

// ─── GET call requests (for receptionist — only name + phone, NO fees!) ──────
app.get('/api/call-requests', (req, res) => {
    const status = req.query.status || 'pending';
    const requests = db.prepare(
        'SELECT id, studentName, parentPhone, reason, status, createdAt, calledAt FROM call_requests WHERE status = ? ORDER BY createdAt DESC'
    ).all(status);
    // ⬆️ Notice: NO fee amount, NO installment data — only name + phone!
    res.json({ success: true, data: requests });
});

// ─── RECEPTIONIST: Mark as called ────────────────────────────────────────────
app.patch('/api/call-requests/:id/called', (req, res) => {
    db.prepare(
        "UPDATE call_requests SET status = 'called', calledAt = datetime('now') WHERE id = ?"
    ).run(req.params.id);
    res.json({ success: true, message: '✅ Marked as called!' });
});

// ─── Health check (cloud app checks if admin server is online) ───────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'online', timestamp: new Date().toISOString() });
});

// ─── Start server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    console.log(`\n🏠 Admin Local Server running on http://localhost:${PORT}`);
    console.log(`📂 Database: ${join(__dirname, 'fees.db')}`);
    console.log(`\n📋 Admin Portal:  http://localhost:${PORT}`);
    console.log(`\n⏳ Now run Cloudflare Tunnel to expose this to the cloud:`);
    console.log(`   cloudflared tunnel --url http://localhost:${PORT}\n`);
});
