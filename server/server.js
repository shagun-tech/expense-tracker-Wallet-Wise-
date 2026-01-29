const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Database Setup (SQLite)
// In production, this file would be on a persistent volume
const dbPath = path.resolve(__dirname, 'expenses.db');
const db = new sqlite3.Database(dbPath, (err) => {
    if (err) console.error('Could not connect to database', err);
    else console.log('Connected to SQLite database');
});

// Initialize Table
// We store amount as INTEGER (cents) to avoid floating point errors [cite: 33, 74]
// We use idempotency_key to prevent duplicate entries on retries [cite: 24]
db.serialize(() => {
    db.run(`
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            amount INTEGER NOT NULL, 
            category TEXT NOT NULL,
            description TEXT NOT NULL,
            date TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            idempotency_key TEXT UNIQUE
        )
    `);
});

// --- API ROUTES ---

// GET /expenses [cite: 26]
app.get('/expenses', (req, res) => {
    const { category, sort } = req.query;

    let query = "SELECT * FROM expenses";
    let params = [];

    // Filter by Category [cite: 29]
    if (category) {
        query += " WHERE category = ?";
        params.push(category);
    }

    // Sort by Date [cite: 30]
    if (sort === 'date_desc') {
        query += " ORDER BY date DESC";
    } else {
        // Default sort creates a stable list
        query += " ORDER BY created_at DESC";
    }

    db.all(query, params, (err, rows) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json(rows);
    });
});

// POST /expenses [cite: 19]
app.post('/expenses', (req, res) => {
    const { amount, category, description, date } = req.body;
    const idempotencyKey = req.headers['idempotency-key'];

    // Basic Validation [cite: 58]
    if (!amount || !category || !date || !idempotencyKey) {
        return res.status(400).json({ error: 'Missing required fields or Idempotency-Key' });
    }

    // 1. Check for Idempotency (Handling Network Retries) [cite: 24]
    // If we have seen this key before, return the PREVIOUSLY created record.
    const checkSql = "SELECT * FROM expenses WHERE idempotency_key = ?";
    db.get(checkSql, [idempotencyKey], (err, row) => {
        if (err) return res.status(500).json({ error: err.message });

        if (row) {
            console.log(`Idempotency hit: Returning existing record for ${idempotencyKey}`);
            return res.status(200).json(row);
        }

        // 2. Create New Expense
        const insertSql = `
            INSERT INTO expenses (amount, category, description, date, idempotency_key)
            VALUES (?, ?, ?, ?, ?)
        `;

        db.run(insertSql, [amount, category, description, date, idempotencyKey], function (err) {
            if (err) {
                // Handle race condition where two requests hit exactly at the same time
                if (err.message.includes('UNIQUE constraint failed')) {
                     return db.get(checkSql, [idempotencyKey], (e, r) => res.status(200).json(r));
                }
                return res.status(500).json({ error: err.message });
            }

            // Return the created object
            res.status(201).json({
                id: this.lastID,
                amount,
                category,
                description,
                date,
                idempotency_key: idempotencyKey
            });
        });
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});