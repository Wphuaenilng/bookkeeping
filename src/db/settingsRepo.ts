import { db } from './client';
import type { EntrySnapshot, TxnType } from '../types';

export const SNAPSHOT_KEY = 'entry_snapshot';

export function getSetting(key: string): string | null {
  const row = db.getFirstSync<{ value: string | null }>('SELECT value FROM settings WHERE key = ?', [key]);
  return row?.value ?? null;
}

export function setSetting(key: string, value: string): void {
  db.runSync('INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value', [
    key,
    value,
  ]);
}

const EMPTY_SNAPSHOT: EntrySnapshot = {
  lastType: null,
  lastCategoryId: { expense: null, income: null },
  lastAccountId: null,
};

/** 上次录入快照:默认值继承的关键 */
export function getEntrySnapshot(): EntrySnapshot {
  const raw = getSetting(SNAPSHOT_KEY);
  if (!raw) return EMPTY_SNAPSHOT;
  try {
    const parsed = JSON.parse(raw) as Partial<EntrySnapshot>;
    return {
      lastType: parsed.lastType === 'income' ? 'income' : parsed.lastType === 'expense' ? 'expense' : null,
      lastCategoryId: {
        expense: parsed.lastCategoryId?.expense ?? null,
        income: parsed.lastCategoryId?.income ?? null,
      },
      lastAccountId: parsed.lastAccountId ?? null,
    };
  } catch {
    return EMPTY_SNAPSHOT;
  }
}

function writeSnapshot(snap: EntrySnapshot): void {
  setSetting(SNAPSHOT_KEY, JSON.stringify(snap));
}

/** 记完一笔后更新快照:下次录入自动继承 */
export function saveSnapshot(type: TxnType, categoryId: string): void {
  const snap = getEntrySnapshot();
  snap.lastType = type;
  snap.lastCategoryId[type] = categoryId;
  writeSnapshot(snap);
}
