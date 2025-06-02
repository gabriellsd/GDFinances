import {
    auth,
    db,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut,
    onAuthStateChanged,
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    getDocs,
    addDoc,
    serverTimestamp
} from './firebase-config.js';

// Funções de Autenticação
export async function loginWithEmail(email, password) {
    try {
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Erro no login:', error);
        return { success: false, error: error.message };
    }
}

export async function registerWithEmail(email, password) {
    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, 'users', userCredential.user.uid), {
            email: email,
            createdAt: serverTimestamp()
        });
        return { success: true, user: userCredential.user };
    } catch (error) {
        console.error('Erro no registro:', error);
        return { success: false, error: error.message };
    }
}

export async function logoutUser() {
    try {
        await signOut(auth);
        return { success: true };
    } catch (error) {
        console.error('Erro no logout:', error);
        return { success: false, error: error.message };
    }
}

// Funções de Conta
export async function createAccount(userId, accountData) {
    try {
        const accountRef = await addDoc(collection(db, 'accounts'), {
            userId,
            ...accountData,
            createdAt: serverTimestamp()
        });
        return { success: true, accountId: accountRef.id };
    } catch (error) {
        console.error('Erro ao criar conta:', error);
        return { success: false, error: error.message };
    }
}

export async function getAccounts(userId) {
    try {
        const q = query(collection(db, 'accounts'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const accounts = [];
        querySnapshot.forEach((doc) => {
            accounts.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, accounts };
    } catch (error) {
        console.error('Erro ao buscar contas:', error);
        return { success: false, error: error.message };
    }
}

export async function updateAccount(accountId, accountData) {
    try {
        await updateDoc(doc(db, 'accounts', accountId), {
            ...accountData,
            updatedAt: serverTimestamp()
        });
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar conta:', error);
        return { success: false, error: error.message };
    }
}

export async function deleteAccount(accountId) {
    try {
        await deleteDoc(doc(db, 'accounts', accountId));
        return { success: true };
    } catch (error) {
        console.error('Erro ao deletar conta:', error);
        return { success: false, error: error.message };
    }
}

// Funções de Transação
export async function createTransaction(userId, transactionData) {
    try {
        const transactionRef = await addDoc(collection(db, 'transactions'), {
            userId,
            ...transactionData,
            createdAt: serverTimestamp()
        });
        
        // Atualizar saldo da conta
        const accountRef = doc(db, 'accounts', transactionData.accountId);
        const accountDoc = await getDoc(accountRef);
        
        if (accountDoc.exists()) {
            const currentBalance = accountDoc.data().balance || 0;
            const amount = transactionData.type === 'expense' ? -transactionData.amount : transactionData.amount;
            
            await updateDoc(accountRef, {
                balance: currentBalance + amount
            });
        }
        
        return { success: true, transactionId: transactionRef.id };
    } catch (error) {
        console.error('Erro ao criar transação:', error);
        return { success: false, error: error.message };
    }
}

export async function getTransactions(userId, filters = {}) {
    try {
        let q = query(collection(db, 'transactions'), where('userId', '==', userId));
        
        if (filters.startDate) {
            q = query(q, where('date', '>=', filters.startDate));
        }
        if (filters.endDate) {
            q = query(q, where('date', '<=', filters.endDate));
        }
        if (filters.type) {
            q = query(q, where('type', '==', filters.type));
        }
        if (filters.category) {
            q = query(q, where('category', '==', filters.category));
        }
        
        const querySnapshot = await getDocs(q);
        const transactions = [];
        querySnapshot.forEach((doc) => {
            transactions.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, transactions };
    } catch (error) {
        console.error('Erro ao buscar transações:', error);
        return { success: false, error: error.message };
    }
}

// Funções de Orçamento
export async function createBudget(userId, budgetData) {
    try {
        const budgetRef = await addDoc(collection(db, 'budgets'), {
            userId,
            ...budgetData,
            createdAt: serverTimestamp()
        });
        return { success: true, budgetId: budgetRef.id };
    } catch (error) {
        console.error('Erro ao criar orçamento:', error);
        return { success: false, error: error.message };
    }
}

export async function getBudgets(userId, month = null) {
    try {
        let q = query(collection(db, 'budgets'), where('userId', '==', userId));
        
        if (month) {
            q = query(q, where('month', '==', month));
        }
        
        const querySnapshot = await getDocs(q);
        const budgets = [];
        querySnapshot.forEach((doc) => {
            budgets.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, budgets };
    } catch (error) {
        console.error('Erro ao buscar orçamentos:', error);
        return { success: false, error: error.message };
    }
}

// Funções de Meta
export async function createGoal(userId, goalData) {
    try {
        const goalRef = await addDoc(collection(db, 'goals'), {
            userId,
            ...goalData,
            currentAmount: 0,
            createdAt: serverTimestamp()
        });
        return { success: true, goalId: goalRef.id };
    } catch (error) {
        console.error('Erro ao criar meta:', error);
        return { success: false, error: error.message };
    }
}

export async function getGoals(userId) {
    try {
        const q = query(collection(db, 'goals'), where('userId', '==', userId));
        const querySnapshot = await getDocs(q);
        const goals = [];
        querySnapshot.forEach((doc) => {
            goals.push({ id: doc.id, ...doc.data() });
        });
        return { success: true, goals };
    } catch (error) {
        console.error('Erro ao buscar metas:', error);
        return { success: false, error: error.message };
    }
}

export async function updateGoalProgress(goalId, amount) {
    try {
        const goalRef = doc(db, 'goals', goalId);
        const goalDoc = await getDoc(goalRef);
        
        if (goalDoc.exists()) {
            const currentAmount = goalDoc.data().currentAmount || 0;
            await updateDoc(goalRef, {
                currentAmount: currentAmount + amount,
                updatedAt: serverTimestamp()
            });
        }
        
        return { success: true };
    } catch (error) {
        console.error('Erro ao atualizar progresso da meta:', error);
        return { success: false, error: error.message };
    }
} 