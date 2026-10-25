import { db, genId } from './client';
import type { Category, TxnType } from '../types';

function rowToCategory(r: any): Category {
  return {
    id: r.id,
    name: r.name,
    icon: r.icon,
    type: r.type,
    sort_order: r.sort_order,
    color: r.color,
    hidden: r.hidden ? 1 : 0,
  };
}

export function listCategories(onlyVisible = true): Category[] {
  const rows = onlyVisible
    ? db.getAllSync('SELECT * FROM categories WHERE hidden = 0 ORDER BY type, sort_order, id')
    : db.getAllSync('SELECT * FROM categories ORDER BY type, sort_order, id');
  return rows.map(rowToCategory);
}

export function getCategory(id: string): Category | null {
  const row = db.getFirstSync('SELECT * FROM categories WHERE id = ?', [id]);
  return row ? rowToCategory(row) : null;
}

export function createCategory(input: {
  name: string;
  icon: string;
  color: string;
  type: TxnType;
}): Category {
  const maxOrder = db.getFirstSync<{ m: number | null }>(
    'SELECT MAX(sort_order) AS m FROM categories WHERE type = ?',
    [input.type],
  );
  const sortOrder = (maxOrder?.m ?? -1) + 1;
  const id = genId();
  db.runSync(
    'INSERT INTO categories (id, name, icon, type, sort_order, color, hidden) VALUES (?, ?, ?, ?, ?, ?, 0)',
    [id, input.name, input.icon, input.type, sortOrder, input.color],
  );
  return { id, ...input, sort_order: sortOrder, hidden: 0 };
}

export function updateCategory(id: string, patch: { name?: string; icon?: string; color?: string }): void {
  const c = getCategory(id);
  if (!c) return;
  db.runSync('UPDATE categories SET name = ?, icon = ?, color = ? WHERE id = ?', [
    patch.name ?? c.name,
    patch.icon ?? c.icon,
    patch.color ?? c.color,
    id,
  ]);
}

export function setCategoryHidden(id: string, hidden: boolean): void {
  db.runSync('UPDATE categories SET hidden = ? WHERE id = ?', [hidden ? 1 : 0, id]);
}

/** 删除分类:已有流水的分类不允许物理删除,改为隐藏,避免历史数据失去归属 */
export function deleteCategory(id: string): { deleted: boolean; hiddenInstead: boolean } {
  const used = db.getFirstSync<{ n: number }>(
    'SELECT COUNT(*) AS n FROM transactions WHERE category_id = ? AND deleted_at IS NULL',
    [id],
  );
  if (used && used.n > 0) {
    setCategoryHidden(id, true);
    return { deleted: false, hiddenInstead: true };
  }
  db.runSync('DELETE FROM categories WHERE id = ?', [id]);
  return { deleted: true, hiddenInstead: false };
}

/** 上移/下移:与相邻分类交换 sort_order */
export function moveCategory(id: string, dir: 'up' | 'down', visibleOnly = true): void {
  const c = getCategory(id);
  if (!c) return;
  const hiddenFilter = visibleOnly ? 'AND hidden = 0' : '';
  const neighbor =
    dir === 'up'
      ? db.getFirstSync<any>(
          `SELECT * FROM categories WHERE type = ? AND sort_order < ? ${hiddenFilter} ORDER BY sort_order DESC LIMIT 1`,
          [c.type, c.sort_order],
        )
      : db.getFirstSync<any>(
          `SELECT * FROM categories WHERE type = ? AND sort_order > ? ${hiddenFilter} ORDER BY sort_order ASC LIMIT 1`,
          [c.type, c.sort_order],
        );
  if (!neighbor) return;
  db.withTransactionSync(() => {
    db.runSync('UPDATE categories SET sort_order = ? WHERE id = ?', [neighbor.sort_order, c.id]);
    db.runSync('UPDATE categories SET sort_order = ? WHERE id = ?', [c.sort_order, neighbor.id]);
  });
}

/** 分类是否被流水引用(含已删除流水) */
export function categoryUsageCount(id: string): number {
  const r = db.getFirstSync<{ n: number }>('SELECT COUNT(*) AS n FROM transactions WHERE category_id = ?', [id]);
  return r?.n ?? 0;
}
