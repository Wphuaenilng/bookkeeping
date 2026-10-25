import { db, genId } from './client';
import type {
  MonthSummary,
  QuickTemplate,
  Transaction,
  TransactionWithCategory,
  TxnType,
} from '../types';

function rowToTxn(r: any): Transaction {
  return {
    id: r.id,
    type: r.type,
    amount_cent: r.amount_cent,
    category_id: r.category_id,
    account_id: r.account_id,
    note: r.note ?? '',
    occurred_date: r.occurred_date,
    created_at: r.created_at,
    updated_at: r.updated_at,
    deleted_at: r.deleted_at ?? null,
  };
}

const SELECT_WITH_CATEGORY = `
  SELECT t.*, c.name AS category_name, c.icon AS category_icon, c.color AS category_color
  FROM transactions t
  LEFT JOIN categories c ON c.id = t.category_id
`;

export function insertTransaction(input: {
  type: TxnType;
  amount_cent: number;
  category_id: string;
  note: string;
  occurred_date: string;
  account_id?: string;
}): Transaction {
  const now = new Date().toISOString();
  const txn: Transaction = {
    id: genId(),
    type: input.type,
    amount_cent: input.amount_cent,
    category_id: input.category_id,
    account_id: input.account_id ?? 'cash',
    note: input.note,
    occurred_date: input.occurred_date,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  db.runSync(
    `INSERT INTO transactions (id, type, amount_cent, category_id, account_id, note, occurred_date, created_at, updated_at, deleted_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    [
      txn.id,
      txn.type,
      txn.amount_cent,
      txn.category_id,
      txn.account_id,
      txn.note,
      txn.occurred_date,
      txn.created_at,
      txn.updated_at,
    ],
  );
  return txn;
}

export function updateTransaction(
  id: string,
  patch: { type: TxnType; amount_cent: number; category_id: string; note: string; occurred_date: string },
): void {
  db.runSync(
    `UPDATE transactions SET type = ?, amount_cent = ?, category_id = ?, note = ?, occurred_date = ?, updated_at = ?
     WHERE id = ?`,
    [patch.type, patch.amount_cent, patch.category_id, patch.note, patch.occurred_date, new Date().toISOString(), id],
  );
}

/** 软删除:撤销的底气 */
export function softDeleteTransaction(id: string): void {
  db.runSync('UPDATE transactions SET deleted_at = ?, updated_at = ? WHERE id = ?', [
    new Date().toISOString(),
    new Date().toISOString(),
    id,
  ]);
}

/** 撤销删除 */
export function restoreTransaction(id: string): void {
  db.runSync('UPDATE transactions SET deleted_at = NULL, updated_at = ? WHERE id = ?', [
    new Date().toISOString(),
    id,
  ]);
}

export function getTransaction(id: string): Transaction | null {
  const row = db.getFirstSync('SELECT * FROM transactions WHERE id = ?', [id]);
  return row ? rowToTxn(row) : null;
}

/** 某月流水(按天倒序,同日内新记的在前) */
export function listMonthTransactions(month: string): TransactionWithCategory[] {
  const rows = db.getAllSync<any>(
    `${SELECT_WITH_CATEGORY}
     WHERE t.deleted_at IS NULL AND t.occurred_date LIKE ?
     ORDER BY t.occurred_date DESC, t.created_at DESC`,
    [`${month}%`],
  );
  return rows.map((r) => ({ ...rowToTxn(r), category_name: r.category_name ?? '未分类', category_icon: r.category_icon ?? 'dots-horizontal', category_color: r.category_color ?? '#7A8699' }));
}

/** 本月概览:支出 / 收入 / 结余 三个数 */
export function monthSummary(month: string): MonthSummary {
  const rows = db.getAllSync<{ type: string; total: number }>(
    `SELECT type, SUM(amount_cent) AS total FROM transactions
     WHERE deleted_at IS NULL AND occurred_date LIKE ? GROUP BY type`,
    [`${month}%`],
  );
  let expense = 0;
  let income = 0;
  for (const r of rows) {
    if (r.type === 'expense') expense = r.total ?? 0;
    if (r.type === 'income') income = r.total ?? 0;
  }
  return { expense, income, balance: income - expense };
}

/**
 * 快速模板:按最近 90 天使用频率取「金额×分类」组合。
 * 一键记一笔,零配置。
 */
export function quickTemplates(limit = 4): QuickTemplate[] {
  const since = new Date(Date.now() - 90 * 24 * 3600 * 1000).toISOString();
  const rows = db.getAllSync<any>(
    `SELECT t.amount_cent, t.type, t.category_id, c.name AS category_name, c.icon AS category_icon, c.color AS category_color, COUNT(*) AS count
     FROM transactions t LEFT JOIN categories c ON c.id = t.category_id
     WHERE t.deleted_at IS NULL AND t.created_at >= ? AND t.type = 'expense'
     GROUP BY t.amount_cent, t.category_id
     HAVING COUNT(*) >= 2
     ORDER BY count DESC, MAX(t.created_at) DESC
     LIMIT ?`,
    [since, limit],
  );
  return rows.map((r) => ({
    amount_cent: r.amount_cent,
    type: r.type,
    categoryId: r.category_id,
    categoryName: r.category_name ?? '未分类',
    categoryIcon: r.category_icon ?? 'dots-horizontal',
    categoryColor: r.category_color ?? '#4A90E2',
    count: r.count,
  }));
}

/** 导出用:全部未删除流水 */
export function allTransactionsForExport(): TransactionWithCategory[] {
  const rows = db.getAllSync<any>(
    `${SELECT_WITH_CATEGORY} WHERE t.deleted_at IS NULL ORDER BY t.occurred_date ASC, t.created_at ASC`,
  );
  return rows.map((r) => ({ ...rowToTxn(r), category_name: r.category_name ?? '', category_icon: r.category_icon ?? '', category_color: r.category_color ?? '' }));
}

/** 高频备注:按使用次数取最近常用的,输入时一键带入 */
export function topNotes(limit = 6): string[] {
  const rows = db.getAllSync<{ note: string }>(
    `SELECT note, COUNT(*) AS n FROM transactions
     WHERE deleted_at IS NULL AND note != ''
     GROUP BY note
     ORDER BY n DESC, MAX(created_at) DESC
     LIMIT ?`,
    [limit],
  );
  return rows.map((r) => r.note);
}
