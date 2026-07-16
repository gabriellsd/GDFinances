/**
 * Camada de serviços — integrações e regras de aplicação.
 */

export { listAccounts, createAccount, updateAccount, deleteAccount } from "@/features/accounts/actions";
export {
  listCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "@/features/categories/actions";
export {
  listTransactions,
  createTransaction,
  deleteTransaction,
  getDashboardStats,
} from "@/features/transactions/actions";
