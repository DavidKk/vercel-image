# Studio 主题重构方案

> 版本：v1.1 · 日期：2026-07-04  
> 状态：**P3 已实施，P4 进行中**

---

## 已确认决策

| 项             | 决策                               |
| -------------- | ---------------------------------- |
| 强调色         | **Teal**（`#14b8a6`）              |
| Inspector 宽度 | **360px**                          |
| 暗色主题       | **暂不实施**（全浅色 light theme） |

---

## 设计方向

**浅色 Chrome + 浅色画布** — 专业创意工具层级：

```text
┌─────────────────────────────────────────────┐
│  A. Chrome（浅灰 #fafafa）— TopBar、全局 Nav  │
├────────┬──────────────────────┬─────────────┤
│ B.     │ C. Canvas（最亮）     │ D.          │
│ Library│ 色彩准确的预览区       │ Inspector   │
│ 288px  │ checkerboard 背景     │ 360px       │
│ #fff   │ #fff + workspace 灰缝 │ #fff        │
├────────┴──────────────────────┴─────────────┤
│  E. Queue Bar — 时间轴、任务状态              │
└─────────────────────────────────────────────┘
```

Chrome 层（`#fafafa`）与 Surface 面板（`#ffffff`）通过底色差异 + 底阴影区分层级；面板之间由 Workspace 灰（`#ececee`）分隔。

---

## Token 架构

文件：`app/studio/theme/studio-tokens.css`  
作用域：`:root`（全局 Nav / Portal 组件）+ `[data-studio-theme="pro"]`（Studio 根节点）

| 层级      | 用途                        | 主要变量                    |
| --------- | --------------------------- | --------------------------- |
| Chrome    | TopBar、全局 Nav            | `--studio-chrome-*`         |
| Surface   | Library / Inspector / Queue | `--studio-surface-*`        |
| Workspace | 面板间隙                    | `--studio-workspace-bg`     |
| Canvas    | 预览区                      | `--studio-canvas-*`         |
| Accent    | 选中、主按钮、进度          | `--studio-accent-*`（teal） |

Tailwind 映射见 `tailwind.config.ts` → `studio.*`、`w-studio-inspector`、`rounded-studio-*`。

---

## 文件结构

```text
app/studio/
├── theme/
│   └── studio-tokens.css       # CSS 变量
├── styles/
│   └── studio-primitives.ts    # 表单/按钮 class 常量
└── components/
    └── primitives/
        └── StudioSegmentedControl.tsx  # TopBar / 侧栏分段控件
```

`components/form-styles.ts` 重新导出 `studio-primitives`，供 Select、FormField 等共享组件使用。

---

## 实施分期

| 阶段          | 内容                                          | 状态      |
| ------------- | --------------------------------------------- | --------- |
| P1 Token 基建 | tokens + Tailwind + 根节点 scope              | ✅        |
| P2 Primitives | SegmentedControl、form-styles 迁移            | ✅        |
| P3 五区换肤   | TopBar → Library → Canvas → Inspector → Queue | ✅        |
| P4 打磨       | 浮层 token 化、focus、a11y、侧栏 Tooltip      | 🔄 进行中 |

---

## 使用约定

1. Studio 组件内**禁止**硬编码 `blue-*` / `indigo-*` / `gray-*`，改用 `--studio-*` 或 `studio-*` Tailwind 类
2. 新表单控件样式写入 `studio-primitives.ts`
3. 共享组件（Select、Checkbox、Popover、Notification 等）通过 CSS 变量 + fallback 自动适配 Studio 主题
4. Mosaic / Progress 等模块**不在**本次范围，保持原样式
5. `.studio-checkerboard` 统一定义在 `globals.css`，引用 `--studio-canvas-checker-*` token

---

## 二期（未启动）

- 全暗色主题（含暗色画布）
- 主题切换 UI
- 面板宽度拖拽
- 窄屏抽屉布局
