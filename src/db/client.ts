import * as SQLite from 'expo-sqlite';
import { genId } from '../utils/id';

/**
 * db 薄封装:表少、量小,直接 SQL。
 * 全部使用同步 API(本地小数据量),模块加载即初始化,
 * 冷启动首帧即可查询,不需要 loading 状态。
 */
export const db = SQLite.openDatabaseSync('bookkeeping.db', { enableChangeListener: false });

db.execSync(`
PRAGMA journal_mode = WAL;

CREATE TABLE IF NOT EXISTS transactions (
  id            TEXT PRIMARY KEY NOT NULL,
  type          TEXT NOT NULL CHECK (type IN ('expense','income')),
  amount_cent   INTEGER NOT NULL CHECK (amount_cent > 0),
  category_id   TEXT NOT NULL,
  account_id    TEXT NOT NULL DEFAULT 'cash',
  note          TEXT NOT NULL DEFAULT '',
  occurred_date TEXT NOT NULL,
  created_at    TEXT NOT NULL,
  updated_at    TEXT NOT NULL,
  deleted_at    TEXT
);
CREATE INDEX IF NOT EXISTS idx_txn_date ON transactions(occurred_date);
CREATE INDEX IF NOT EXISTS idx_txn_category ON transactions(category_id);

CREATE TABLE IF NOT EXISTS categories (
  id         TEXT PRIMARY KEY NOT NULL,
  name       TEXT NOT NULL,
  icon       TEXT NOT NULL,
  type       TEXT NOT NULL CHECK (type IN ('expense','income')),
  sort_order INTEGER NOT NULL DEFAULT 0,
  color      TEXT NOT NULL DEFAULT '#4A90E2',
  hidden     INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS accounts (
  id           TEXT PRIMARY KEY NOT NULL,
  name         TEXT NOT NULL,
  type         TEXT NOT NULL CHECK (type IN ('cash','bank','credit','virtual')),
  balance_cent INTEGER NOT NULL DEFAULT 0,
  sort_order   INTEGER NOT NULL DEFAULT 0,
  hidden       INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY NOT NULL,
  value TEXT
);
`);

/** 内置默认分类:支出 9 个 + 收入 3 个(「其他」无实际作用,已移除,可在管理页自建) */
const DEFAULT_CATEGORIES: Array<{
  id: string;
  name: string;
  icon: string;
  color: string;
  type: 'expense' | 'income';
}> = [
  { id: 'cat_food', name: '餐饮', icon: 'silverware-fork-knife', color: '#F09A4E', type: 'expense' },
  { id: 'cat_transport', name: '交通', icon: 'bus', color: '#4A90E2', type: 'expense' },
  { id: 'cat_shopping', name: '购物', icon: 'shopping', color: '#E2789B', type: 'expense' },
  { id: 'cat_home', name: '居住', icon: 'home-city', color: '#5B8FD9', type: 'expense' },
  { id: 'cat_fun', name: '娱乐', icon: 'gamepad-variant', color: '#9B7ED9', type: 'expense' },
  { id: 'cat_medical', name: '医疗', icon: 'medical-bag', color: '#4ECBC4', type: 'expense' },
  { id: 'cat_social', name: '人情', icon: 'gift-outline', color: '#E25C4A', type: 'expense' },
  { id: 'cat_digital', name: '数码', icon: 'laptop', color: '#5B6ED9', type: 'expense' },
  { id: 'cat_study', name: '学习', icon: 'book-open-variant', color: '#3BA978', type: 'expense' },
  { id: 'cat_salary', name: '工资', icon: 'cash', color: '#3BA978', type: 'income' },
  { id: 'cat_bonus', name: '奖金', icon: 'gift-outline', color: '#E2789B', type: 'income' },
  { id: 'cat_invest', name: '理财', icon: 'trending-up', color: '#4A90E2', type: 'income' },
];

function seedIfEmpty(): void {
  const hasCategory = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM categories');
  if (!hasCategory || hasCategory.n === 0) {
    db.withTransactionSync(() => {
      DEFAULT_CATEGORIES.forEach((c, i) => {
        db.runSync(
          'INSERT INTO categories (id, name, icon, type, sort_order, color, hidden) VALUES (?, ?, ?, ?, ?, ?, 0)',
          [c.id, c.name, c.icon, c.type, i, c.color],
        );
      });
    });
  }

  // MVP 只做默认账户(现金),UI 先藏,v0.2 再开放
  const hasAccount = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM accounts');
  if (!hasAccount || hasAccount.n === 0) {
    db.runSync(
      "INSERT INTO accounts (id, name, type, balance_cent, sort_order, hidden) VALUES ('cash', '现金', 'cash', 0, 0, 0)",
    );
  }

  // 清理旧版默认「其他」分类:无流水引用的直接删掉,有流水的不动
  db.runSync(
    `DELETE FROM categories
     WHERE id IN ('cat_other', 'cat_income_other')
       AND NOT EXISTS (SELECT 1 FROM transactions WHERE transactions.category_id = categories.id)`,
  );
}

seedIfEmpty();

export { genId };
