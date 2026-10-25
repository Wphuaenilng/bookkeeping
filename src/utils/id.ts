let lastTime = 0;

/**
 * 时间戳 + 随机的 ID:按时间排序天然友好。
 * 加单调递增保护,同一毫秒内多次调用也能保持先后顺序。
 */
export function genId(): string {
  let now = Date.now();
  if (now <= lastTime) now = lastTime + 1;
  lastTime = now;
  return `${now.toString(36)}${Math.random().toString(36).slice(2, 8)}`;
}
