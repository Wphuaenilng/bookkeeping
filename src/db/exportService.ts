import { db } from './client';
import { allTransactionsForExport } from './transactionsRepo';
import { listCategories } from './categoriesRepo';

/**
 * 数据导出:长期使用的安全绳。
 * JSON(完整,未来可做导入恢复)+ CSV(表格软件可打开)。
 * 写到缓存目录后调系统分享,由用户决定存到哪里(配合手机自带云备份)。
 */
export async function exportData(format: 'json' | 'csv'): Promise<string> {
  const now = new Date();
  const stamp = now.toISOString().slice(0, 19).replace(/[:T]/g, '-');

  let content: string;
  let filename: string;
  let mime: string;

  if (format === 'json') {
    const payload = {
      app: 'bookkeeping',
      version: 1,
      exported_at: now.toISOString(),
      transactions: allTransactionsForExport().map((t) => ({
        id: t.id,
        type: t.type,
        amount_cent: t.amount_cent,
        category: t.category_name,
        category_id: t.category_id,
        account_id: t.account_id,
        note: t.note,
        occurred_date: t.occurred_date,
        created_at: t.created_at,
      })),
      categories: listCategories(false),
      accounts: db.getAllSync('SELECT * FROM accounts'),
    };
    content = JSON.stringify(payload, null, 2);
    filename = `bookkeeping-${stamp}.json`;
    mime = 'application/json';
  } else {
    const esc = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
    const lines = ['日期,类型,金额,分类,备注'];
    for (const t of allTransactionsForExport()) {
      const amount = (t.amount_cent / 100).toFixed(2);
      lines.push(
        [t.occurred_date, t.type === 'expense' ? '支出' : '收入', amount, esc(t.category_name), esc(t.note)].join(','),
      );
    }
    // BOM 让 Excel 正确识别 UTF-8 中文
    content = '\uFEFF' + lines.join('\n');
    filename = `bookkeeping-${stamp}.csv`;
    mime = 'text/csv';
  }

  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');
  const path = `${FileSystem.cacheDirectory}${filename}`;
  await FileSystem.writeAsStringAsync(path, content, { encoding: FileSystem.EncodingType.UTF8 });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(path, { mimeType: mime, dialogTitle: format === 'json' ? '导出 JSON' : '导出 CSV' });
  }
  return path;
}
