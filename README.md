# 轻记账

个人日常流水记账 App · 仅安卓 · 前端独立开发。

**核心指标:录入速度 —— 掏手机到记完一笔 ≤ 5 秒。**

技术栈:Expo (SDK 58) + React Native + TypeScript + Expo Router + expo-sqlite + Zustand + dayjs。
金额一律整数「分」存储,杜绝浮点误差。

## 快速开始

```bash
npm install
npx expo start        # 手机装 Expo Go 扫码,或安卓真机 USB 调试 npm run android
```

打 APK 装自己手机(不上架):

```bash
eas build -p android --profile preview
```

## 功能(v0.1 MVP)

- **明细+录入同屏**:顶部「支出/收入」切换 + 本月收入/支出/结余三个数;中部按天分组流水,当天总额置顶;底部金额备注栏 + 自绘数字键盘(7-8-9/4-5-6/1-2-3/·-0-00,右列「今天、+、−、完成」)常驻。
- **动线**:
  - 列表态直接按数字键 → 自动进入录入态(不用先点加号);
  - 默认继承上次分类/账户/今天日期;最近用的分类自动选中;
  - 键盘「今天」键一键切「昨天」,再深弹日历(补记 ≤ 2 步);
  - 保存无弹窗:落库 → toast → 3 秒内可撤销;
  - 金额支持连续加减(`12.5+8−3`),「完成」落库;
  - 快速模板:按最近 90 天记账频率自动生成「金额×分类」组合,一键记一笔。
- **列表**:点条目进编辑;左滑删除(无确认,可撤销)。
- **图表页**:本月支出/收入分类排行 + 占比横条(环形图等 v0.2 再上 gifted-charts)。
- **我的页**:导出 JSON(完整备份)/ CSV(表格可开,带 BOM);分类管理。
- **分类管理**:增删改、上移下移排序;有流水的分类删除时转为隐藏,历史数据不失去归属;内置 10 个支出 + 4 个收入默认分类。
- 深色模式跟随系统;数据全部仅存本机 SQLite。

## 明确不做(提醒自己)

注册登录、云同步、多币种、汇率、账单自动导入、OCR 扫小票、投资资产、家庭共享、会员、广告。
尤其 OCR 与自动导入 —— 那是商业产品护城河,不是个人项目起手式。
**v1.0 之前不写任何服务端代码。** 备份靠导出 JSON + 手机自带云备份。

## 目录结构

```
src/
  app/                 # Expo Router 文件路由
    (tabs)/index.tsx   # 明细+录入同屏主界面(定稿)
    (tabs)/stats.tsx   # 图表(分类排行)
    (tabs)/profile.tsx # 我的(导出/分类管理入口)
    (tabs)/_layout.tsx # 底部导航(中间凸起记账键)
    category-manage.tsx# 分类管理
  components/          # 自绘键盘 / 金额栏 / 分类宫格 / 流水列表(左滑删) / Toast / 日历 / 备注
  db/                  # client(建表+种子) / transactionsRepo / categoriesRepo / settingsRepo / exportService
  store/               # Zustand: ledger(月度) / entry(录入状态机) / category / ui(toast)
  theme/colors.ts      # 蓝色调色板(浅蓝 #4A90E2,深色跟随系统)
  utils/               # money(分运算+键盘输入引擎) / date / id
scripts/money-test.ts  # 键盘输入引擎单元验证(npx tsx scripts/money-test.ts)
```

## 开发约定(避坑)

- expo-sqlite 与 SDK 版本对齐,装完跑 `npx expo-doctor`(当前 20/20 通过)。
- 不留「以后可能用」的字段;4 张表(transactions/categories/accounts/settings)够用一年。
- 所有金额用整数分;输入过程的浮点只在显示层,每步运算四舍五入到 2 位。
- 离线优先:本地先写库,不依赖任何实时接口。
- 转账/多账户为 v0.2 预留,MVP 只做默认「现金」账户且 UI 隐藏。
