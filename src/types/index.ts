// Tipos para contas
export interface Account {
    id: number;
    name: string;
    type: AccountType;
    balance: number;
    color?: string;
    icon?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type AccountType = 'checking' | 'savings' | 'investment' | 'credit';

// Tipos para transações
export interface Transaction {
    id: number;
    type: 'income' | 'expense';
    amount: number;
    category: string;
    date: Date;
    description?: string;
    tags?: string[];
    accountId: number;
}

// Tipos para orçamentos
export interface Budget {
    id: number;
    category: string;
    limit: number;
    month: string;
    spent: number;
}

// Tipos para metas
export interface Goal {
    id: number;
    name: string;
    target: number;
    progress: number;
    deadline: Date;
}

// Tipos para respostas da API
export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
}

// Tipos para formulários
export interface AccountFormData {
    name: string;
    type: AccountType;
    balance: number;
    color?: string;
    icon?: string;
} 
