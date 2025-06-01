require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// Database setup
const db = new sqlite3.Database('./database.sqlite', (err) => {
    if (err) {
        console.error('Error opening database:', err);
    } else {
        console.log('Connected to SQLite database');
        createTables();
    }
});

// Create tables if they don't exist
function createTables() {
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Accounts table
        db.run(`CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            balance REAL DEFAULT 0,
            color TEXT DEFAULT '#10B981',
            icon TEXT DEFAULT 'bank',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Transactions table
        db.run(`CREATE TABLE IF NOT EXISTS transactions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            account_id INTEGER,
            type TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            description TEXT,
            date DATE NOT NULL,
            tags TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id),
            FOREIGN KEY (account_id) REFERENCES accounts(id)
        )`);

        // Budgets table
        db.run(`CREATE TABLE IF NOT EXISTS budgets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            category TEXT NOT NULL,
            limit_amount REAL NOT NULL,
            month TEXT NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);

        // Goals table
        db.run(`CREATE TABLE IF NOT EXISTS goals (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER,
            name TEXT NOT NULL,
            target REAL NOT NULL,
            progress REAL DEFAULT 0,
            deadline DATE NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id)
        )`);
    });
}

// Authentication middleware
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ success: false, message: 'Token não fornecido' });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'gdfinances_secret_key_2024', (err, user) => {
        if (err) {
            return res.status(403).json({ success: false, message: 'Token inválido' });
        }
        req.user = user;
        next();
    });
};

// Auth routes
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        
        db.run('INSERT INTO users (email, password) VALUES (?, ?)', 
            [email, hashedPassword],
            function(err) {
                if (err) {
                    if (err.code === 'SQLITE_CONSTRAINT') {
                        return res.status(400).json({ 
                            success: false, 
                            message: 'Email já cadastrado' 
                        });
                    }
                    return res.status(500).json({ 
                        success: false, 
                        message: 'Erro ao criar usuário' 
                    });
                }
                
                const token = jwt.sign(
                    { id: this.lastID, email }, 
                    process.env.JWT_SECRET || 'gdfinances_secret_key_2024',
                    { expiresIn: '24h' }
                );
                
                res.json({ 
                    success: true, 
                    message: 'Usuário criado com sucesso',
                    token 
                });
            }
        );
    } catch (error) {
        res.status(500).json({ 
            success: false, 
            message: 'Erro ao criar usuário' 
        });
    }
});

app.post('/api/login', (req, res) => {
    const { email, password } = req.body;
    
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao fazer login' 
            });
        }
        
        if (!user) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou senha inválidos' 
            });
        }
        
        const validPassword = await bcrypt.compare(password, user.password);
        
        if (!validPassword) {
            return res.status(401).json({ 
                success: false, 
                message: 'Email ou senha inválidos' 
            });
        }
        
        const token = jwt.sign(
            { id: user.id, email: user.email }, 
            process.env.JWT_SECRET || 'gdfinances_secret_key_2024',
            { expiresIn: '24h' }
        );
        
        res.json({ 
            success: true, 
            message: 'Login realizado com sucesso',
            token 
        });
    });
});

// Account routes
app.post('/api/accounts', authenticateToken, (req, res) => {
    const { name, type, balance, color, icon } = req.body;
    const userId = req.user.id;
    
    db.run(
        'INSERT INTO accounts (user_id, name, type, balance, color, icon) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, name, type, balance, color, icon],
        function(err) {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao criar conta' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Conta criada com sucesso',
                accountId: this.lastID 
            });
        }
    );
});

app.get('/api/accounts', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.all('SELECT * FROM accounts WHERE user_id = ?', [userId], (err, accounts) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar contas' 
            });
        }
        
        res.json({ 
            success: true, 
            data: accounts 
        });
    });
});

app.put('/api/accounts/:id', authenticateToken, (req, res) => {
    const { name, type, balance, color, icon } = req.body;
    const accountId = req.params.id;
    const userId = req.user.id;
    
    db.run(
        `UPDATE accounts 
         SET name = ?, type = ?, balance = ?, color = ?, icon = ?, updated_at = CURRENT_TIMESTAMP
         WHERE id = ? AND user_id = ?`,
        [name, type, balance, color, icon, accountId, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao atualizar conta' 
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Conta não encontrada' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Conta atualizada com sucesso' 
            });
        }
    );
});

app.delete('/api/accounts/:id', authenticateToken, (req, res) => {
    const accountId = req.params.id;
    const userId = req.user.id;
    
    db.run(
        'DELETE FROM accounts WHERE id = ? AND user_id = ?',
        [accountId, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao excluir conta' 
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Conta não encontrada' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Conta excluída com sucesso' 
            });
        }
    );
});

// Transaction routes
app.post('/api/transactions', authenticateToken, (req, res) => {
    const { account_id, type, amount, category, description, date, tags } = req.body;
    const userId = req.user.id;
    
    db.run(
        `INSERT INTO transactions 
         (user_id, account_id, type, amount, category, description, date, tags) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [userId, account_id, type, amount, category, description, date, tags],
        function(err) {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao criar transação' 
                });
            }
            
            // Update account balance
            const balanceChange = type === 'income' ? amount : -amount;
            db.run(
                'UPDATE accounts SET balance = balance + ? WHERE id = ? AND user_id = ?',
                [balanceChange, account_id, userId]
            );
            
            res.json({ 
                success: true, 
                message: 'Transação criada com sucesso',
                transactionId: this.lastID 
            });
        }
    );
});

app.get('/api/transactions', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { startDate, endDate, type, category } = req.query;
    
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    let params = [userId];
    
    if (startDate && endDate) {
        query += ' AND date BETWEEN ? AND ?';
        params.push(startDate, endDate);
    }
    
    if (type) {
        query += ' AND type = ?';
        params.push(type);
    }
    
    if (category) {
        query += ' AND category = ?';
        params.push(category);
    }
    
    query += ' ORDER BY date DESC';
    
    db.all(query, params, (err, transactions) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar transações' 
            });
        }
        
        res.json({ 
            success: true, 
            data: transactions 
        });
    });
});

// Budget routes
app.post('/api/budgets', authenticateToken, (req, res) => {
    const { category, limit_amount, month } = req.body;
    const userId = req.user.id;
    
    db.run(
        'INSERT INTO budgets (user_id, category, limit_amount, month) VALUES (?, ?, ?, ?)',
        [userId, category, limit_amount, month],
        function(err) {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao criar orçamento' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Orçamento criado com sucesso',
                budgetId: this.lastID 
            });
        }
    );
});

app.get('/api/budgets', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const { month } = req.query;
    
    let query = 'SELECT * FROM budgets WHERE user_id = ?';
    let params = [userId];
    
    if (month) {
        query += ' AND month = ?';
        params.push(month);
    }
    
    db.all(query, params, (err, budgets) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar orçamentos' 
            });
        }
        
        res.json({ 
            success: true, 
            data: budgets 
        });
    });
});

// Goal routes
app.post('/api/goals', authenticateToken, (req, res) => {
    const { name, target, deadline } = req.body;
    const userId = req.user.id;
    
    db.run(
        'INSERT INTO goals (user_id, name, target, deadline) VALUES (?, ?, ?, ?)',
        [userId, name, target, deadline],
        function(err) {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao criar meta' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Meta criada com sucesso',
                goalId: this.lastID 
            });
        }
    );
});

app.get('/api/goals', authenticateToken, (req, res) => {
    const userId = req.user.id;
    
    db.all('SELECT * FROM goals WHERE user_id = ?', [userId], (err, goals) => {
        if (err) {
            return res.status(500).json({ 
                success: false, 
                message: 'Erro ao buscar metas' 
            });
        }
        
        res.json({ 
            success: true, 
            data: goals 
        });
    });
});

app.put('/api/goals/:id/progress', authenticateToken, (req, res) => {
    const { progress } = req.body;
    const goalId = req.params.id;
    const userId = req.user.id;
    
    db.run(
        'UPDATE goals SET progress = ? WHERE id = ? AND user_id = ?',
        [progress, goalId, userId],
        function(err) {
            if (err) {
                return res.status(500).json({ 
                    success: false, 
                    message: 'Erro ao atualizar progresso da meta' 
                });
            }
            
            if (this.changes === 0) {
                return res.status(404).json({ 
                    success: false, 
                    message: 'Meta não encontrada' 
                });
            }
            
            res.json({ 
                success: true, 
                message: 'Progresso da meta atualizado com sucesso' 
            });
        }
    );
});

// Start server
app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}`);
}); 