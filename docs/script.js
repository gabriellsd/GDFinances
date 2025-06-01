console.log("GDFinances iniciado!");

// Configuração inicial do tema
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
document.body.classList.toggle('dark', prefersDark);
document.body.classList.toggle('light', !prefersDark);

// Variáveis globais
let db;
let token = localStorage.getItem('token');
let currentUser = null;
let SQL;

// Definição dos ícones
const icons = {
    bank: `<svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
        <path d="M11.584 2.376a.75.75 0 01.832 0l9 6a.75.75 0 11-.832 1.248L12 3.901 3.416 9.624a.75.75 0 01-.832-1.248l9-6z" />
        <path fill-rule="evenodd" d="M20.25 10.332v9.918H21a.75.75 0 010 1.5H3a.75.75 0 010-1.5h.75v-9.918a.75.75 0 01.634-.74A49.109 49.109 0 0112 9c2.59 0 5.134.202 7.616.592a.75.75 0 01.634.74zm-7.5 2.418a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75zm3-.75a.75.75 0 01.75.75v6.75a.75.75 0 01-1.5 0v-6.75a.75.75 0 01.75-.75zM9 12.75a.75.75 0 00-1.5 0v6.75a.75.75 0 001.5 0v-6.75z" clip-rule="evenodd" />
    </svg>`,
    card: `<svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
        <path d="M4.5 3.75a3 3 0 00-3 3v.75h21v-.75a3 3 0 00-3-3h-15z" />
        <path fill-rule="evenodd" d="M22.5 9.75h-21v7.5a3 3 0 003 3h15a3 3 0 003-3v-7.5zm-18 3.75a.75.75 0 01.75-.75h6a.75.75 0 010 1.5h-6a.75.75 0 01-.75-.75zm.75 2.25a.75.75 0 000 1.5h3a.75.75 0 000-1.5h-3z" clip-rule="evenodd" />
    </svg>`,
    savings: `<svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
        <path d="M10.464 8.746c.227-.18.497-.311.786-.394v2.795a2.252 2.252 0 01-.786-.393c-.394-.313-.546-.681-.546-1.004 0-.323.152-.691.546-1.004zM12.75 15.662v-2.824c.347.085.664.228.921.421.427.32.579.686.579.991 0 .305-.152.671-.579.991a2.534 2.534 0 01-.921.42z" />
        <path fill-rule="evenodd" d="M12 2.25c-5.385 0-9.75 4.365-9.75 9.75s4.365 9.75 9.75 9.75 9.75-4.365 9.75-9.75S17.385 2.25 12 2.25zM12.75 6a.75.75 0 00-1.5 0v.816a3.836 3.836 0 00-1.72.756c-.712.566-1.112 1.35-1.112 2.178 0 .829.4 1.612 1.113 2.178.502.4 1.102.647 1.719.756v2.978a2.536 2.536 0 01-.921-.421l-.879-.66a.75.75 0 00-.9 1.2l.879.66c.533.4 1.169.645 1.821.75V18a.75.75 0 001.5 0v-.81a4.124 4.124 0 001.821-.749c.745-.559 1.179-1.344 1.179-2.191 0-.847-.434-1.632-1.179-2.191a4.122 4.122 0 00-1.821-.75V8.354c.29.082.559.213.786.393l.415.33a.75.75 0 00.933-1.175l-.415-.33a3.836 3.836 0 00-1.719-.755V6z" clip-rule="evenodd" />
    </svg>`,
    investment: `<svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
        <path d="M18.375 2.25c-1.035 0-1.875.84-1.875 1.875v15.75c0 1.035.84 1.875 1.875 1.875h.75c1.035 0 1.875-.84 1.875-1.875V4.125c0-1.036-.84-1.875-1.875-1.875h-.75zM9.75 8.625c0-1.036.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v11.25c0 1.035-.84 1.875-1.875 1.875h-.75a1.875 1.875 0 01-1.875-1.875V8.625zM3 13.125c0-1.036.84-1.875 1.875-1.875h.75c1.035 0 1.875.84 1.875 1.875v6.75c0 1.035-.84 1.875-1.875 1.875h-.75A1.875 1.875 0 013 19.875v-6.75z" />
    </svg>`,
    wallet: `<svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
        <path d="M2.273 5.625A4.483 4.483 0 015.25 4.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 3H5.25a3 3 0 00-2.977 2.625zM2.273 8.625A4.483 4.483 0 015.25 7.5h13.5c1.141 0 2.183.425 2.977 1.125A3 3 0 0018.75 6H5.25a3 3 0 00-2.977 2.625zM5.25 9a3 3 0 00-3 3v6a3 3 0 003 3h13.5a3 3 0 003-3v-6a3 3 0 00-3-3H15a.75.75 0 00-.75.75 2.25 2.25 0 01-4.5 0A.75.75 0 009 9H5.25z" />
    </svg>`
};

// Configuração do tema
const themeToggle = document.getElementById('themeToggle');
themeToggle.addEventListener('click', () => {
    const isDark = document.body.classList.contains('dark');
    document.body.classList.toggle('dark', !isDark);
    document.body.classList.toggle('light', isDark);
    localStorage.setItem('theme', isDark ? 'light' : 'dark');
});

// Carregar tema salvo
const savedTheme = localStorage.getItem('theme');
if (savedTheme) {
    document.body.classList.remove('dark', 'light');
    document.body.classList.add(savedTheme);
}

// Inicialização do SQLite
async function initSQLite() {
    try {
        // Carrega o SQL.js WebAssembly
        const sqlPromise = await initSqlJs({
            locateFile: file => `lib/${file}`
        });
        SQL = sqlPromise;
        
        // Cria ou carrega o banco de dados
        const dbData = localStorage.getItem('database');
        if (dbData) {
            const uint8Array = new Uint8Array(dbData.split(',').map(Number));
            db = new SQL.Database(uint8Array);
        } else {
            db = new SQL.Database();
            // Cria as tabelas necessárias
            db.run(`
                CREATE TABLE IF NOT EXISTS users (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    email TEXT UNIQUE NOT NULL,
                    password TEXT NOT NULL
                );
                
                CREATE TABLE IF NOT EXISTS accounts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    user_id INTEGER NOT NULL,
                    name TEXT NOT NULL,
                    type TEXT NOT NULL,
                    balance REAL NOT NULL,
                    color TEXT,
                    icon TEXT,
                    FOREIGN KEY (user_id) REFERENCES users(id)
                );
                
                CREATE TABLE IF NOT EXISTS transactions (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    account_id INTEGER NOT NULL,
                    type TEXT NOT NULL,
                    amount REAL NOT NULL,
                    category TEXT,
                    date TEXT NOT NULL,
                    description TEXT,
                    tags TEXT,
                    FOREIGN KEY (account_id) REFERENCES accounts(id)
                );
            `);
            saveDatabase();
        }
        console.log('SQLite inicializado com sucesso!');
        return true;
    } catch (error) {
        console.error('Erro ao inicializar SQLite:', error);
        return false;
    }
}

// Salva o banco de dados no localStorage
function saveDatabase() {
    const data = db.export();
    const array = Array.from(data);
    localStorage.setItem('database', array.toString());
}

// Funções de autenticação
async function login(email, password) {
    try {
        if (!db) {
            const initialized = await initSQLite();
            if (!initialized) {
                return false;
            }
        }

        const stmt = db.prepare('SELECT id FROM users WHERE email = ? AND password = ?');
        const row = stmt.getAsObject([email, password]);
        stmt.free();
        
        if (row.id) {
            token = btoa(email);
            localStorage.setItem('token', token);
            currentUser = { id: row.id, email };
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            updateDashboardOverview();
            return true;
        }
        
        return false;
    } catch (error) {
        console.error('Erro no login:', error);
        return false;
    }
}

async function register(email, password) {
    try {
        if (!db) {
            const initialized = await initSQLite();
            if (!initialized) {
                return false;
            }
        }

        try {
            db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, password]);
            saveDatabase();
            token = btoa(email);
            localStorage.setItem('token', token);
            const stmt = db.prepare('SELECT id FROM users WHERE email = ?');
            const row = stmt.getAsObject([email]);
            stmt.free();
            currentUser = { id: row.id, email };
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            updateDashboardOverview();
            return true;
        } catch (err) {
            console.error('Erro ao registrar:', err);
            return false;
        }
    } catch (error) {
        console.error('Erro no registro:', error);
        return false;
    }
}

function logout() {
    token = null;
    currentUser = null;
    localStorage.removeItem('token');
    document.getElementById('login-screen').style.display = 'flex';
    document.getElementById('dashboard').style.display = 'none';
}

// Funções de conta
async function createAccount(name, type, balance, color = '#10B981', icon = 'bank', creditCardInfo = {}) {
    try {
        if (!currentUser) return false;
        
        db.run(`
            INSERT INTO accounts (user_id, name, type, balance, color, icon)
            VALUES (?, ?, ?, ?, ?, ?)
        `, [currentUser.id, name, type, balance, color, icon]);
        
        if (type === 'credit_card' && creditCardInfo) {
            const stmt = db.prepare('SELECT last_insert_rowid() as id');
            const { id } = stmt.getAsObject();
            stmt.free();
            
            db.run(`
                INSERT INTO credit_cards (account_id, brand, closing_day, due_day, credit_limit)
                VALUES (?, ?, ?, ?, ?)
            `, [id, creditCardInfo.card_brand, creditCardInfo.closing_day, creditCardInfo.due_day, creditCardInfo.credit_limit]);
        }
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        return false;
    }
}

async function getAccounts() {
    try {
        if (!currentUser) return [];
        
        const stmt = db.prepare(`
            SELECT * FROM accounts 
            WHERE user_id = ?
            ORDER BY name
        `);
        
        const accounts = [];
        while (stmt.step()) {
            const row = stmt.getAsObject();
            accounts.push(row);
        }
        stmt.free();
        
        return accounts;
    } catch (error) {
        console.error('Erro ao buscar contas:', error);
        return [];
    }
}

async function updateAccount(id, name, type, balance, color, icon, creditCardInfo = {}) {
    try {
        if (!currentUser) return false;
        
        db.run(`
            UPDATE accounts 
            SET name = ?, type = ?, balance = ?, color = ?, icon = ?
            WHERE id = ? AND user_id = ?
        `, [name, type, balance, color, icon, id, currentUser.id]);
        
        if (type === 'credit_card' && creditCardInfo) {
            db.run(`
                UPDATE credit_cards 
                SET brand = ?, closing_day = ?, due_day = ?, credit_limit = ?
                WHERE account_id = ?
            `, [creditCardInfo.card_brand, creditCardInfo.closing_day, creditCardInfo.due_day, creditCardInfo.credit_limit, id]);
        }
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('Erro ao atualizar conta:', error);
        return false;
    }
}

async function deleteAccount(id) {
    try {
        if (!currentUser) return false;
        
        db.run('DELETE FROM accounts WHERE id = ? AND user_id = ?', [id, currentUser.id]);
        saveDatabase();
        
        await renderAccounts();
        await updateDashboardCards();
        await updateCashFlowChart();
        await updateExpensesChart();
        return true;
    } catch (error) {
        console.error('Erro ao excluir conta:', error);
        return false;
    }
}

// Funções de transação
async function createTransaction(accountId, type, amount, category, date, description = '', tags = '') {
    try {
        if (!currentUser) return false;
        
        // Verifica se a conta pertence ao usuário
        const stmt = db.prepare('SELECT id FROM accounts WHERE id = ? AND user_id = ?');
        const account = stmt.getAsObject([accountId, currentUser.id]);
        stmt.free();
        
        if (!account.id) return false;
        
        db.run(`
            INSERT INTO transactions (account_id, type, amount, category, date, description, tags)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `, [accountId, type, amount, category, date, description, tags]);
        
        // Atualiza o saldo da conta
        const balanceChange = type === 'expense' ? -amount : amount;
        db.run(`
            UPDATE accounts 
            SET balance = balance + ? 
            WHERE id = ?
        `, [balanceChange, accountId]);
        
        saveDatabase();
        return true;
    } catch (error) {
        console.error('Erro ao criar transação:', error);
        return false;
    }
}

async function getTransactions(filters = {}) {
    try {
        if (!currentUser) return [];
        
        let query = `
            SELECT t.*, a.name as account_name 
            FROM transactions t
            JOIN accounts a ON t.account_id = a.id
            WHERE a.user_id = ?
        `;
        
        const params = [currentUser.id];
        
        if (filters.startDate) {
            query += ' AND t.date >= ?';
            params.push(filters.startDate);
        }
        
        if (filters.endDate) {
            query += ' AND t.date <= ?';
            params.push(filters.endDate);
        }
        
        if (filters.type) {
            query += ' AND t.type = ?';
            params.push(filters.type);
        }
        
        if (filters.category) {
            query += ' AND t.category = ?';
            params.push(filters.category);
        }
        
        query += ' ORDER BY t.date DESC';
        
        const stmt = db.prepare(query);
        const transactions = [];
        
        while (stmt.step()) {
            const row = stmt.getAsObject();
            transactions.push(row);
        }
        stmt.free();
        
        return transactions;
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        return [];
    }
}

// Funções de orçamento
async function createBudget(category, limitAmount, month) {
    return await api('budgets', 'POST', {
        category,
        limit_amount: limitAmount,
        month
    });
}

async function getBudgets(month = null) {
    const queryParams = month ? `?month=${month}` : '';
    const response = await api(`budgets${queryParams}`);
    return response.success ? response.data : [];
}

// Funções de meta
async function createGoal(name, target, deadline) {
    return await api('goals', 'POST', { name, target, deadline });
}

async function getGoals() {
    const response = await api('goals');
    return response.success ? response.data : [];
}

async function updateGoalProgress(id, progress) {
    return await api(`goals/${id}/progress`, 'PUT', { progress });
}

// Funções de UI
function setupTheme() {
    // Esta função agora está vazia pois movemos a lógica para o início do arquivo
    // Mantemos ela para compatibilidade com o código existente
}

function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

function getLastSixMonths() {
    const months = [];
    const date = new Date();
    
    for (let i = 0; i < 6; i++) {
        const month = date.getMonth() - i;
        const year = date.getFullYear();
        const adjustedDate = new Date(year, month);
        
        months.unshift({
            month: adjustedDate.getMonth(),
            year: adjustedDate.getFullYear(),
            label: adjustedDate.toLocaleString('pt-BR', { month: 'short', year: 'numeric' })
        });
    }
    
    return months;
}

async function updateDashboardCards() {
    const transactions = await getTransactions();
    const accounts = await getAccounts();
    
    const totalBalance = accounts.reduce((sum, account) => sum + account.balance, 0);
    const monthlyIncome = transactions
        .filter(t => t.type === 'income' && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);
    const monthlyExpense = transactions
        .filter(t => t.type === 'expense' && new Date(t.date).getMonth() === new Date().getMonth())
        .reduce((sum, t) => sum + t.amount, 0);
    
    document.getElementById('totalBalance').textContent = formatCurrency(totalBalance);
    document.getElementById('monthlyIncome').textContent = formatCurrency(monthlyIncome);
    document.getElementById('monthlyExpense').textContent = formatCurrency(monthlyExpense);
}

async function updateCashFlowChart() {
    const months = getLastSixMonths();
    const transactions = await getTransactions();
    
    const incomeData = months.map(m => {
        return transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'income' && 
                       date.getMonth() === m.month && 
                       date.getFullYear() === m.year;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    });
    
    const expenseData = months.map(m => {
        return transactions
            .filter(t => {
                const date = new Date(t.date);
                return t.type === 'expense' && 
                       date.getMonth() === m.month && 
                       date.getFullYear() === m.year;
            })
            .reduce((sum, t) => sum + t.amount, 0);
    });
    
    const ctx = document.getElementById('cashFlowChart').getContext('2d');
    new Chart(ctx, {
        type: 'line',
        data: {
            labels: months.map(m => m.label),
            datasets: [
                {
                    label: 'Receitas',
                    data: incomeData,
                    borderColor: '#22c55e',
                    backgroundColor: 'rgba(34, 197, 94, 0.1)',
                    fill: true
                },
                {
                    label: 'Despesas',
                    data: expenseData,
                    borderColor: '#ef4444',
                    backgroundColor: 'rgba(239, 68, 68, 0.1)',
                    fill: true
                }
            ]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top'
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: value => formatCurrency(value)
                    }
                }
            }
        }
    });
}

async function updateExpensesChart() {
    const transactions = await getTransactions({
        type: 'expense',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
        endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString().split('T')[0]
    });
    
    const categories = {};
    transactions.forEach(t => {
        categories[t.category] = (categories[t.category] || 0) + t.amount;
    });
    
    const ctx = document.getElementById('expensesChart').getContext('2d');
    new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(categories),
            datasets: [{
                data: Object.values(categories),
                backgroundColor: [
                    '#10B981',
                    '#3B82F6',
                    '#6366F1',
                    '#8B5CF6',
                    '#EC4899',
                    '#F59E0B',
                    '#EF4444'
                ]
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'right'
                },
                tooltip: {
                    callbacks: {
                        label: context => {
                            const value = context.raw;
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((value / total) * 100).toFixed(1);
                            return `${formatCurrency(value)} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

async function renderAccounts() {
    const accounts = await getAccounts();
    const accountsGrid = document.querySelector('.accounts-grid');
    const addAccountCard = document.querySelector('.new-account-card');
    
    // Limpar grid mantendo apenas o card de adicionar
    while (accountsGrid.firstChild) {
        if (accountsGrid.firstChild === addAccountCard) break;
        accountsGrid.removeChild(accountsGrid.firstChild);
    }
    
    accounts.forEach(account => {
        const card = document.createElement('div');
        card.className = 'account-card';
        card.style.setProperty('--hover-color', account.color);
        
        card.innerHTML = `
            <div class="card-header">
                <div class="card-title">
                    <div class="card-icon-wrapper" style="background: ${account.color}20">
                        ${icons[account.icon] || icons.bank}
                    </div>
                    <h3>${account.name}</h3>
                </div>
                <button type="button" class="menu-button" data-account-id="${account.id}">
                    <svg viewBox="0 0 24 24" fill="currentColor" class="nav-icon">
                        <path fill-rule="evenodd" d="M10.5 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0zm0 6a1.5 1.5 0 113 0 1.5 1.5 0 01-3 0z" clip-rule="evenodd" />
                    </svg>
                </button>
            </div>
            <div class="balance-info">
                <span class="balance-label">Saldo</span>
                <span class="balance ${account.balance >= 0 ? 'positive' : 'negative'}">
                    ${formatCurrency(account.balance)}
                </span>
            </div>
        `;
        
        accountsGrid.insertBefore(card, addAccountCard);
        
        // Adicionar evento ao botão de menu
        const menuButton = card.querySelector('.menu-button');
        menuButton.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            showContextMenu(e, account.id);
        });
    });
}

function showContextMenu(event, accountId) {
    // Remover menu existente se houver
    const existingMenu = document.querySelector('.context-menu');
    if (existingMenu) {
        existingMenu.remove();
    }
    
    const menu = document.createElement('div');
    menu.className = 'context-menu active';
    
    // Posicionar o menu no local do clique
    const rect = event.target.closest('.menu-button').getBoundingClientRect();
    const x = rect.right;
    const y = rect.top;
    
    menu.style.position = 'fixed';
    menu.style.top = `${y}px`;
    menu.style.left = `${x + 5}px`;
    
    menu.innerHTML = `
        <div class="context-menu-item edit-account" data-account-id="${accountId}">
            <svg viewBox="0 0 24 24" fill="currentColor" class="menu-icon">
                <path d="M21.731 2.269a2.625 2.625 0 00-3.712 0l-1.157 1.157 3.712 3.712 1.157-1.157a2.625 2.625 0 000-3.712zM19.513 8.199l-3.712-3.712-12.15 12.15a5.25 5.25 0 00-1.32 2.214l-.8 2.685a.75.75 0 00.933.933l2.685-.8a5.25 5.25 0 002.214-1.32L19.513 8.2z" />
            </svg>
            Editar
        </div>
        <div class="context-menu-item delete-account danger" data-account-id="${accountId}">
            <svg viewBox="0 0 24 24" fill="currentColor" class="menu-icon">
                <path fill-rule="evenodd" d="M16.5 4.478v.227a48.816 48.816 0 013.878.512.75.75 0 11-.256 1.478l-.209-.035-1.005 13.07a3 3 0 01-2.991 2.77H8.084a3 3 0 01-2.991-2.77L4.087 6.66l-.209.035a.75.75 0 01-.256-1.478A48.567 48.567 0 017.5 4.705v-.227c0-1.564 1.213-2.9 2.816-2.951a52.662 52.662 0 013.369 0c1.603.051 2.815 1.387 2.815 2.951zm-6.136-1.452a51.196 51.196 0 013.273 0C14.39 3.05 15 3.684 15 4.478v.113a49.488 49.488 0 00-6 0v-.113c0-.794.609-1.428 1.364-1.452zm-.355 5.945a.75.75 0 10-1.5.058l.347 9a.75.75 0 101.499-.058l-.346-9zm5.48.058a.75.75 0 10-1.498-.058l-.347 9a.75.75 0 001.5.058l.345-9z" clip-rule="evenodd" />
            </svg>
            Excluir
        </div>
    `;
    
    document.body.appendChild(menu);
    
    // Ajustar posição se o menu estiver fora da viewport
    const menuRect = menu.getBoundingClientRect();
    if (menuRect.right > window.innerWidth) {
        menu.style.left = `${x - menuRect.width - 5}px`;
    }
    if (menuRect.bottom > window.innerHeight) {
        menu.style.top = `${window.innerHeight - menuRect.height - 10}px`;
    }
    
    // Event listeners
    const editButton = menu.querySelector('.edit-account');
    const deleteButton = menu.querySelector('.delete-account');
    
    editButton.addEventListener('click', () => {
        editAccount(accountId);
        menu.remove();
    });
    
    deleteButton.addEventListener('click', async () => {
        if (confirm('Tem certeza que deseja excluir esta conta? Esta ação não pode ser desfeita.')) {
            const success = await deleteAccount(accountId);
            if (success) {
                menu.remove();
            }
        } else {
            menu.remove();
        }
    });
    
    // Fechar menu ao clicar fora
    function closeMenu(e) {
        if (!menu.contains(e.target) && !e.target.closest('.menu-button')) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        }
    }
    
    // Pequeno delay para evitar que o menu feche imediatamente
    setTimeout(() => {
        document.addEventListener('click', closeMenu);
    }, 100);
}

async function editAccount(accountId) {
    const accounts = await getAccounts();
    const account = accounts.find(a => a.id === accountId);
    
    if (!account) {
        alert('Conta não encontrada');
        return;
    }
    
    const modal = document.getElementById('accountModal');
    const form = document.getElementById('accountForm');
    const title = document.getElementById('modalTitle');
    
    title.textContent = 'Editar Conta';
    form.setAttribute('data-edit-id', accountId);
    
    // Preencher os campos com os dados da conta
    document.getElementById('accountName').value = account.name;
    document.getElementById('accountType').value = account.type;
    document.getElementById('accountBalance').value = account.balance;
    
    // Atualizar seleção de cor
    document.querySelectorAll('.color-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.color === account.color);
    });
    
    // Atualizar seleção de ícone
    document.querySelectorAll('.icon-option').forEach(option => {
        option.classList.toggle('selected', option.dataset.icon === account.icon);
    });
    
    modal.style.display = 'flex';
    modal.classList.add('active');
}

function setupAccountModal() {
    const modal = document.getElementById('accountModal');
    const form = document.getElementById('accountForm');
    const closeBtn = document.getElementById('closeModal');
    const cancelBtn = document.getElementById('cancelAccountBtn');
    const accountType = document.getElementById('accountType');
    const creditCardFields = document.getElementById('creditCardFields');
    
    // Mostrar/ocultar campos de cartão de crédito
    accountType.addEventListener('change', () => {
        creditCardFields.style.display = accountType.value === 'credit_card' ? 'block' : 'none';
        
        // Habilitar/desabilitar validação dos campos de cartão de crédito
        const creditCardInputs = creditCardFields.querySelectorAll('input, select');
        creditCardInputs.forEach(input => {
            input.required = accountType.value === 'credit_card';
        });
    });
    
    // Abrir modal para nova conta
    document.getElementById('addAccountBtn').addEventListener('click', () => {
        document.getElementById('modalTitle').textContent = 'Nova Conta';
        form.removeAttribute('data-edit-id');
        form.reset();
        
        // Resetar seleções
        document.querySelector('.color-option.selected').classList.remove('selected');
        document.querySelector('.color-option[data-color="#10B981"]').classList.add('selected');
        
        document.querySelector('.icon-option.selected').classList.remove('selected');
        document.querySelector('.icon-option[data-icon="bank"]').classList.add('selected');
        
        // Ocultar campos de cartão de crédito inicialmente
        creditCardFields.style.display = 'none';
        
        // Desabilitar validação dos campos de cartão de crédito
        const creditCardInputs = creditCardFields.querySelectorAll('input, select');
        creditCardInputs.forEach(input => {
            input.required = false;
        });
        
        modal.style.display = 'flex';
        modal.classList.add('active');
    });
    
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            form.reset();
            
            // Resetar campos de cartão de crédito
            creditCardFields.style.display = 'none';
            const creditCardInputs = creditCardFields.querySelectorAll('input, select');
            creditCardInputs.forEach(input => {
                input.required = false;
            });
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Seleção de cor
    document.querySelectorAll('.color-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelector('.color-option.selected').classList.remove('selected');
            option.classList.add('selected');
        });
    });
    
    // Seleção de ícone
    document.querySelectorAll('.icon-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelector('.icon-option.selected').classList.remove('selected');
            option.classList.add('selected');
        });
    });
    
    // Submit do formulário
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('accountName').value;
        const type = document.getElementById('accountType').value;
        const balance = parseFloat(document.getElementById('accountBalance').value);
        const color = document.querySelector('.color-option.selected').dataset.color;
        const icon = document.querySelector('.icon-option.selected').dataset.icon;
        
        // Adicionar informações do cartão de crédito se for o tipo selecionado
        let creditCardInfo = {};
        if (type === 'credit_card') {
            creditCardInfo = {
                card_brand: document.getElementById('creditCardBrand').value,
                closing_day: parseInt(document.getElementById('closingDay').value),
                due_day: parseInt(document.getElementById('dueDay').value),
                credit_limit: parseFloat(document.getElementById('creditLimit').value)
            };
        }
        
        const editId = form.getAttribute('data-edit-id');
        let result;
        
        try {
            if (editId) {
                result = await updateAccount(parseInt(editId), name, type, balance, color, icon, creditCardInfo);
            } else {
                result = await createAccount(name, type, balance, color, icon, creditCardInfo);
            }
            
            if (result.success) {
                closeModal();
                await renderAccounts();
                await updateDashboardCards();
                await updateCashFlowChart();
                await updateExpensesChart();
            } else {
                alert(result.message || 'Erro ao salvar conta');
            }
        } catch (error) {
            console.error('Erro ao salvar conta:', error);
            alert('Erro ao salvar conta. Tente novamente.');
        }
    });
}

function setupTransactionModal() {
    const modal = document.getElementById('transactionModal');
    const form = document.getElementById('transactionForm');
    const closeBtn = document.getElementById('closeTransactionModal');
    const cancelBtn = document.getElementById('cancelTransactionBtn');
    
    document.getElementById('addTransactionBtn').addEventListener('click', () => {
        document.getElementById('transactionModalTitle').textContent = 'Nova Transação';
        form.removeAttribute('data-edit-id');
        form.reset();
        modal.classList.add('active');
        modal.style.display = 'flex';
    });
    
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            form.reset();
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Configurar data padrão
    document.getElementById('transactionDate').valueAsDate = new Date();
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const type = document.querySelector('input[name="transactionType"]:checked').value;
        const amount = parseFloat(document.getElementById('transactionValue').value);
        const category = document.getElementById('transactionCategory').value;
        const date = document.getElementById('transactionDate').value;
        const description = document.getElementById('transactionDescription').value;
        const tags = document.getElementById('transactionTags').value;
        
        const result = await createTransaction(type, amount, category, date, description, tags);
        
        if (result.success) {
            closeModal();
            updateTransactionsList();
            updateDashboardOverview();
        } else {
            alert(result.message);
        }
    });
}

function setupBudgetModal() {
    const modal = document.getElementById('budgetModal');
    const form = document.getElementById('budgetForm');
    const closeBtn = document.getElementById('closeBudgetModal');
    const cancelBtn = document.getElementById('cancelBudgetBtn');
    
    document.getElementById('addBudgetBtn').addEventListener('click', () => {
        document.getElementById('budgetModalTitle').textContent = 'Novo Orçamento';
        form.removeAttribute('data-edit-id');
        form.reset();
        
        // Configurar mês padrão
        const today = new Date();
        document.getElementById('budgetMonth').value = 
            `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}`;
        
        modal.classList.add('active');
        modal.style.display = 'flex';
    });
    
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            form.reset();
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const category = document.getElementById('budgetCategory').value;
        const limit = parseFloat(document.getElementById('budgetLimit').value);
        const month = document.getElementById('budgetMonth').value;
        
        const result = await createBudget(category, limit, month);
        
        if (result.success) {
            closeModal();
            updateBudgetsList();
        } else {
            alert(result.message);
        }
    });
}

function setupGoalModal() {
    const modal = document.getElementById('goalModal');
    const form = document.getElementById('goalForm');
    const closeBtn = document.getElementById('closeGoalModal');
    const cancelBtn = document.getElementById('cancelGoalBtn');
    
    document.getElementById('addGoalBtn').addEventListener('click', () => {
        document.getElementById('goalModalTitle').textContent = 'Nova Meta';
        form.removeAttribute('data-edit-id');
        form.reset();
        modal.classList.add('active');
        modal.style.display = 'flex';
    });
    
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            form.reset();
        }, 300);
    };
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const name = document.getElementById('goalName').value;
        const target = parseFloat(document.getElementById('goalTarget').value);
        const deadline = document.getElementById('goalDeadline').value;
        
        const result = await createGoal(name, target, deadline);
        
        if (result.success) {
            closeModal();
            updateGoalsList();
        } else {
            alert(result.message);
        }
    });
}

function setupLogin() {
    const form = document.getElementById('login-form');
    const errorMessage = document.getElementById('login-error');
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('email').value;
        const password = document.getElementById('password').value;
        
        const success = await login(email, password);
        
        if (success) {
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            updateDashboardOverview();
        } else {
            errorMessage.style.display = 'block';
            errorMessage.textContent = 'Email ou senha inválidos';
        }
    });
    
    // Toggle password visibility
    const togglePassword = document.getElementById('toggle-password');
    const passwordInput = document.getElementById('password');
    const showIcon = togglePassword.querySelector('.show-password');
    const hideIcon = togglePassword.querySelector('.hide-password');
    
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        showIcon.style.display = type === 'password' ? 'block' : 'none';
        hideIcon.style.display = type === 'password' ? 'none' : 'block';
    });
}

function setupRegisterModal() {
    const modal = document.getElementById('registerModal');
    const form = document.getElementById('register-form');
    const closeBtn = document.getElementById('closeRegisterModal');
    const cancelBtn = document.getElementById('cancelRegisterBtn');
    const registerBtn = document.getElementById('register-button');
    const errorMessage = document.getElementById('register-error');
    
    const closeModal = () => {
        modal.classList.remove('active');
        setTimeout(() => {
            modal.style.display = 'none';
            form.reset();
            errorMessage.style.display = 'none';
        }, 300);
    };
    
    registerBtn.addEventListener('click', (e) => {
        e.preventDefault();
        modal.style.display = 'flex';
        modal.classList.add('active');
    });
    
    closeBtn.addEventListener('click', closeModal);
    cancelBtn.addEventListener('click', closeModal);
    
    // Toggle password visibility
    const togglePassword = document.getElementById('toggle-register-password');
    const passwordInput = document.getElementById('register-password');
    const showIcon = togglePassword.querySelector('.show-password');
    const hideIcon = togglePassword.querySelector('.hide-password');
    
    togglePassword.addEventListener('click', () => {
        const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
        passwordInput.setAttribute('type', type);
        showIcon.style.display = type === 'password' ? 'block' : 'none';
        hideIcon.style.display = type === 'password' ? 'none' : 'block';
    });
    
    form.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const email = document.getElementById('register-email').value;
        const password = document.getElementById('register-password').value;
        const confirmPassword = document.getElementById('register-password-confirm').value;
        
        if (password !== confirmPassword) {
            errorMessage.textContent = 'As senhas não coincidem';
            errorMessage.style.display = 'block';
            return;
        }
        
        const success = await register(email, password);
        
        if (success) {
            closeModal();
            document.getElementById('login-screen').style.display = 'none';
            document.getElementById('dashboard').style.display = 'flex';
            updateDashboardOverview();
        } else {
            errorMessage.textContent = 'Erro ao criar conta. Tente novamente.';
            errorMessage.style.display = 'block';
        }
    });
}

function setupDashboardNavigation() {
    const navLinks = document.querySelectorAll('.sidebar-nav a');
    const sections = document.querySelectorAll('.dashboard-section');
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            
            const targetSection = link.getAttribute('data-section');
            
            navLinks.forEach(l => l.classList.remove('active'));
            link.classList.add('active');
            
            sections.forEach(section => {
                section.style.display = section.id === targetSection ? 'block' : 'none';
            });
            
            // Atualizar conteúdo da seção
            switch (targetSection) {
                case 'overview':
                    updateDashboardOverview();
                    break;
                case 'accounts':
                    renderAccounts();
                    break;
                case 'transactions':
                    updateTransactionsList();
                    break;
                case 'budgets':
                    updateBudgetsList();
                    break;
                case 'goals':
                    updateGoalsList();
                    break;
            }
        });
    });
}

async function updateDashboardOverview() {
    await Promise.all([
        updateDashboardCards(),
        updateCashFlowChart(),
        updateExpensesChart()
    ]);
}

function setupNewButton() {
    const newButton = document.getElementById('newButton');
    const dropdown = document.getElementById('newDropdown');

    // Abre/fecha o dropdown ao clicar no botão
    newButton.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdown.classList.toggle('active');
    });

    // Fecha o dropdown ao clicar fora
    document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
            dropdown.classList.remove('active');
        }
    });

    // Manipula os cliques nos itens do dropdown
    dropdown.addEventListener('click', (e) => {
        e.preventDefault();
        const item = e.target.closest('.dropdown-item');
        if (!item) return;

        dropdown.classList.remove('active');

        // Abre o modal de transação correspondente
        const transactionModal = document.getElementById('transactionModal');
        const transactionForm = document.getElementById('transactionForm');
        const modalTitle = document.getElementById('transactionModalTitle');

        if (item.classList.contains('expense')) {
            modalTitle.textContent = 'Nova Despesa';
            document.getElementById('expense').checked = true;
        } else if (item.classList.contains('income')) {
            modalTitle.textContent = 'Nova Receita';
            document.getElementById('income').checked = true;
        } else if (item.classList.contains('credit-card')) {
            modalTitle.textContent = 'Nova Despesa de Cartão de Crédito';
            document.getElementById('expense').checked = true;
            // Adicionar lógica específica para cartão de crédito aqui
        } else if (item.classList.contains('transfer')) {
            modalTitle.textContent = 'Nova Transferência';
            // Adicionar lógica específica para transferência aqui
        }

        transactionModal.style.display = 'flex';
        setTimeout(() => transactionModal.classList.add('active'), 10);
    });
}

// Inicialização
async function init() {
    await initSQLite();
    setupTheme();
    setupLogin();
    setupRegisterModal();
    setupDashboardNavigation();
    setupNewButton();
    setupAccountModal();
    setupTransactionModal();
    setupBudgetModal();
    setupGoalModal();
    
    // Configurar botão de logout
    document.getElementById('logout').addEventListener('click', logout);
    
    // Verifica se há um token salvo
    if (token) {
        document.getElementById('login-screen').style.display = 'none';
        document.getElementById('dashboard').style.display = 'flex';
        updateDashboardOverview();
    }
}

// Iniciar aplicação
document.addEventListener('DOMContentLoaded', init);