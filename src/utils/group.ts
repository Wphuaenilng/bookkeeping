import type { TransactionWithCategory } from '../types';

export interface DaySection {
  date: string;
  /** SectionList 约定:每组数据必须叫 data */
  data: TransactionWithCategory[];
  expenseCent: number;
}

/** 按天分组 + 组内保持原序(倒序流水中同日新记的在前),天倒序 */
export function groupByDay(transactions: TransactionWithCategory[]): DaySection[] {
  const map = new Map<string, DaySection>();
  for (const t of transactions) {
    let sec = map.get(t.occurred_date);
    if (!sec) {
      sec = { date: t.occurred_date, data: [], expenseCent: 0 };
      map.set(t.occurred_date, sec);
    }
    sec.data.push(t);
    if (t.type === 'expense') sec.expenseCent += t.amount_cent;
  }
  return Array.from(map.values()).sort((a, b) => (a.date < b.date ? 1 : -1));
}
