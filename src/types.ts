/** 交易类型:v0.1 只有支出/收入(转账留到 v0.2) */
export type TxnType = 'expense' | 'income';

export interface Transaction {
  id: string;
  type: TxnType;
  /** 金额,单位:分。铁律:绝不存浮点 */
  amount_cent: number;
  category_id: string;
  account_id: string;
  note: string;
  /** 只存日期 YYYY-MM-DD,按日聚合查询清爽 */
  occurred_date: string;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

/** 列表行使用的联表结构 */
export interface TransactionWithCategory extends Transaction {
  category_name: string;
  category_icon: string;
  category_color: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  type: TxnType;
  sort_order: number;
  color: string;
  hidden: 0 | 1;
}

export type AccountType = 'cash' | 'bank' | 'credit' | 'virtual';

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance_cent: number;
  sort_order: number;
  hidden: 0 | 1;
}

/** 上次录入快照(settings 表),动线顺滑的关键 */
export interface EntrySnapshot {
  lastType: TxnType | null;
  lastCategoryId: { expense: string | null; income: string | null };
  lastAccountId: string | null;
}

/** 快速模板:常用「金额×分类」组合,按使用频率自动生成 */
export interface QuickTemplate {
  amount_cent: number;
  type: TxnType;
  categoryId: string;
  categoryName: string;
  categoryIcon: string;
  categoryColor: string;
  count: number;
}

export interface MonthSummary {
  expense: number;
  income: number;
  /** 结余 = 收入 - 支出 */
  balance: number;
}
