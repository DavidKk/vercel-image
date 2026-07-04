# 统一图像编辑器 — Layout 与模块方案

> 版本：v0.3 · 日期：2026-07-04  
> 状态：**已确认，进入实施**  
> 范围：**除 Mosaic 外全部能力合并为一个编辑器（路由 `/studio`）**；Mosaic 路由与代码本期不动。

## 已确认决策

1. 路由：**`/studio`**
2. 五区 Layout（A/B/C/D/E）：**通过**
3. Inspector 操作组织：**Tab**
4. 底栏：**保留帧 Timeline + Job Queue**
5. **保留 Compare 对比视图**

关联文档：[REFACTOR_STUDIO_PLAN.md](./REFACTOR_STUDIO_PLAN.md)（技术栈、IDB、Pipeline、任务拆分）

---

## 1. 定位

### 1.1 是什么

一个 **浏览器端 AI 素材后处理编辑器**（下称 **Editor**），单页完成：

- 导入 AI 生成的图片 / 视频
- 批量去背景、格式转换
- 视频抽帧、合成 GIF、合成雪碧图
- IndexedDB 临时保存、刷新可恢复
- 预览与批量导出

### 1.2 不是什么

- **不是** Mosaic 拼贴编辑器（`/mosaic/*` 保持独立，导航分开）
- **不是** Photoshop 级修图工具

### 1.3 路由

| 路由                   | 说明                                    |
| ---------------------- | --------------------------------------- |
| **`/studio`**          | 新的统一编辑器（主入口）                |
| `/mosaic`              | 不动                                    |
| `/mosaic/editor`       | 不动（Schema 编辑，与本文 Editor 无关） |
| `/progress`、`/frames` | 迁移完成后重定向 → `/studio`            |

导航建议：`Studio | Mosaic | Mosaic Editor`

---

## 2. 整体 Layout（桌面优先）

```text
┏━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┓
┃ A. Top Bar — 全局工具栏 + 任务状态                                      ┃
┣━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┳━━━━━━━━━━━━━━━━━━━━┫
┃          ┃                                      ┃                    ┃
┃ B.       ┃  C. Canvas Area                      ┃ D.                 ┃
┃ Library  ┃  （主预览 / 批量网格 / GIF 播放）      ┃ Inspector          ┃
┃ 资产库    ┃                                      ┃ 检查器 + 操作       ┃
┃ 280px    ┃  flex-1                              ┃ 360px              ┃
┃          ┃                                      ┃                    ┃
┃          ┣━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┫                    ┃
┃          ┃ E. Timeline / Queue Bar（可选展开）    ┃                    ┃
┃          ┃  48px ~ 120px                        ┃                    ┃
┗━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━┻━━━━━━━━━━━━━━━━━━━━┛
```

**尺寸约定：**

- 最小宽度：1280px（窄屏时 B/D 可折叠为抽屉）
- 高度：`calc(100vh - 全局 Nav/Footer)`
- B、D 面板可拖拽调整宽度（二期）；首期固定宽度

---

## 3. 模块详解

---

### A. Top Bar — 全局顶栏

**位置：** 编辑器最顶部，全宽，高度 ~48px

**内容分区：**

| 区域 | 内容                                  | 行为                                      |
| ---- | ------------------------------------- | ----------------------------------------- |
| 左   | 项目标题 `Untitled Project`（可编辑） | 写入 IDB `projects.name`                  |
| 左   | 存储用量 `12.4 MB / ~50 MB`           | 读 IDB 估算，接近上限警告                 |
| 中   | **导入** 按钮 + 拖放提示              | 打开文件选择；支持 image/_、video/_、多选 |
| 中   | **撤销队列**（仅 UI 占位，二期）      | 本期不做历史栈                            |
| 右   | **导出** 下拉：选中 / 全部 / ZIP      | 调用 fflate                               |
| 右   | **清空缓存**                          | 确认后清 IDB 当前项目                     |
| 右   | 设置 ⚙                               | 全局默认参数（WebGPU、默认 WEBP 等）      |

**状态条（顶栏下方细条，可选）：**

- 当前 Job：`去背景 3/12` + 进度条 + 取消
- AI 模型：`模型就绪` / `下载中 45%`

---

### B. Library — 左侧资产库

**位置：** 左侧固定 280px，可滚动

**结构（自上而下）：**

#### B1. 导入区（折叠头）

- 拖放区（虚线框）
- 「选择文件 / 文件夹」
- 支持：PNG、JPEG、WEBP、HEIC、MP4、WebM

#### B2. 筛选与视图

| 控件     | 选项                                   |
| -------- | -------------------------------------- |
| 类型筛选 | 全部 / 图片 / 视频 / 帧 / GIF / 雪碧图 |
| 状态筛选 | 全部 / 原图 / 已处理 / 失败            |
| 排序     | 导入时间 / 名称 / 时间戳（帧）         |
| 搜索     | 按文件名                               |

#### B3. 资产列表

每项 **Asset Card** 包含：

```text
┌────────────────────────┐
│ [缩略图 64×64]  name.png │
│ 1024×1024 · WEBP · 原图  │
│ ● 就绪  ☐ 多选           │
└────────────────────────┘
```

- 单击：选中并在 C 区预览
- Ctrl/Cmd+单击：多选
- Shift+单击：范围选
- 双击：C 区进入 Detail
- 右键菜单：重命名 / 删除 / 下载 / 「作为输入执行…」
- 层级：子资产缩进（`parentId`，如帧序列挂在视频下）

**树形分组（可选展示）：**

```text
▼ video-001.mp4
    ├─ frame-0010ms
    ├─ frame-0110ms
    └─ ...
▼ batch-import (12)
    ├─ img-01-processed.webp
    └─ ...
```

#### B4. 底部统计

- `已选 5 / 共 48`
- 「全选当前筛选结果」

---

### C. Canvas Area — 中央画布区

**位置：** 中间 flex 区域，核心预览

**顶部：视图 Tab（互斥）**

| Tab         | 何时可用                | 内容                                   |
| ----------- | ----------------------- | -------------------------------------- |
| **Grid**    | 有 ≥1 资产              | 批量缩略图网格（多选高亮）             |
| **Detail**  | 选中单资产              | 单张 zoom/pan 预览（复用 PreviewPane） |
| **Compare** | 选中且有 parent         | 左原图 / 右处理后滑块对比              |
| **GIF**     | 已生成 GIF 资产或预览态 | 动图循环播放 + 棋盘格背景              |
| **Sprite**  | 已生成雪碧图            | 整图预览 + 帧网格叠加线（可选）        |

**Grid 模式：**

- 列数自适应
- 卡片显示：缩略图、文件名、状态角标、时间戳（帧）
- 与 B 区选中同步

**Detail 模式：**

- 缩放、平移、适应窗口
- 信息 overlay：尺寸、格式、大小、来源

**GIF 模式：**

- `<img>` 或 `<canvas>` 播放
- 帧数、间隔 ms、文件大小
- 播放 / 暂停（可选）

**空状态：**

- 无资产：引导拖入 AI 素材
- 有资产未选：Grid 全览或提示「从左侧选择」

---

### D. Inspector — 右侧检查器 + 操作

**位置：** 右侧 360px，可滚动

**分两大部分：上下文信息 + 可执行操作**

---

#### D1. Selection Info — 选中信息（只读）

根据选中类型动态显示：

| 选中 | 显示字段                                 |
| ---- | ---------------------------------------- |
| 图片 | 名、尺寸、格式、体积、导入时间、处理状态 |
| 视频 | 名、分辨率、时长(ms)、格式               |
| 帧   | 父视频、timestampMs、索引                |
| GIF  | 帧数、总时长、循环、体积                 |
| 多选 | `已选 N 项`、类型统计                    |

---

#### D2. Operations — 操作面板（核心）

**操作以 Accordion / Tab 组织，按选中类型启用/禁用：**

##### Tab 1：AI 去背景

| 字段                  | 说明                         |
| --------------------- | ---------------------------- |
| Mode                  | 去背景 / 去前景 / Alpha 蒙版 |
| Model                 | isnet_quint8 / fp16 / fp32   |
| Device                | CPU / WebGPU                 |
| Output                | WEBP / PNG / JPEG            |
| Quality               | JPEG/WebP 质量滑块           |
| Edge Smooth / Feather | 0–3                          |
| Rescale / Debug 等    | 沿用现 Progress 配置         |
| **执行**              | 「处理选中 (N)」             |
| 模型                  | Reload Model 按钮            |

**输入：** 1~N 张图片或帧  
**输出：** 新 asset，`parentId` 指向源

---

##### Tab 2：格式转换

| 字段     | 说明              |
| -------- | ----------------- |
| 目标格式 | PNG / WEBP / JPEG |
| 质量     | 有损格式时        |
| 保留透明 | PNG/WEBP 时提示   |
| **执行** | 「转换选中 (N)」  |

**输入：** 图片 asset  
**输出：** 新 asset

---

##### Tab 3：视频抽帧

| 字段          | 说明                         |
| ------------- | ---------------------------- |
| 源视频        | 自动取选中项（须单选 video） |
| Start (ms)    | 支持负数（距结尾）           |
| End (ms)      | 0 = 视频结尾                 |
| Interval (ms) | 抽帧间隔                     |
| Max frames    | 上限                         |
| Max dimension | 缩放长边                     |
| 预估          | `约 45 帧`                   |
| **执行**      | 「提取帧」                   |

**输入：** 1 个 video asset  
**输出：** N 个 frame assets，挂在该视频下

---

##### Tab 4：合成 GIF

| 字段          | 说明                                   |
| ------------- | -------------------------------------- |
| 帧来源        | 当前多选（须同尺寸或自动缩放策略）     |
| 排序          | 按 timestamp / 按文件名 / 手动（二期） |
| Interval (ms) | 帧间隔                                 |
| Loop          | 是否循环                               |
| **执行**      | 「生成 GIF」→ 自动切 C 区 GIF Tab 预览 |
| **下载**      | 满意后下载                             |

**输入：** N 个 frame/image assets（有序）  
**输出：** 1 个 gif asset + 内存预览 URL

---

##### Tab 5：合成雪碧图

| 字段         | 说明                            |
| ------------ | ------------------------------- |
| 列数 / 行数  | 或 Auto（平方根取整）           |
| Padding (px) | 单元格间距                      |
| 背景色       | 透明 / 纯色                     |
| 输出格式     | PNG / WEBP                      |
| 导出 JSON    | ☑ 帧坐标 metadata              |
| **执行**     | 「生成雪碧图」→ C 区 Sprite Tab |

**输入：** N 张同系列图（通常已去背景）  
**输出：** 1 sprite asset + 可选 `.json`

---

##### Tab 6：导出

| 选项     | 说明                   |
| -------- | ---------------------- |
| 范围     | 选中 / 当前筛选 / 全部 |
| 格式     | 保持原样 / 统一转 WEBP |
| 打包     | 单张下载 / ZIP         |
| **执行** | 「导出」               |

---

#### D3. Quick Workflows — 快捷工作流（D 区底部固定）

一键串联 Pipeline（减少手动切 Tab）：

| 按钮            | 流程                                |
| --------------- | ----------------------------------- |
| **批量去背景**  | 选中图 → removeBackground           |
| **视频 → GIF**  | 抽帧 → 批量去背景 → 合成 GIF → 预览 |
| **帧 → 雪碧图** | 选中帧 → composeSprite              |
| **PNG → WEBP**  | 选中 → convertFormat                |

点击后展开步骤预览，可改参数再执行。

---

### E. Timeline / Queue Bar — 底栏

**位置：** C 区下方，默认收起 48px，展开最高 120px

**内容：**

| 模式 | 显示                                       |
| ---- | ------------------------------------------ |
| 收起 | 最近一条 Job 状态 + 展开箭头               |
| 展开 | Job 列表：类型、进度、耗时、错误信息、重试 |

**帧序列场景（可选增强）：**

- 选中某视频的帧组时，展示 **胶片条 Timeline**
- 每格一帧缩略图 + timestampMs
- 点击跳转 C 区 Detail

---

## 4. 模块间数据流

```text
         ┌──────────────┐
         │  B Library   │  选中 assetIds[]
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ D Inspector  │  用户配置 Operation + 点击执行
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ Orchestrator │  Job Queue → Workers
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ Dexie IDB    │  新 assets 写入
         └──────┬───────┘
                │
                ▼
         ┌──────────────┐
         │ B 列表刷新   │  + C 区切到对应 Tab 预览
         └──────────────┘
```

**选中同步规则：**

- B 选中 ↔ C Grid 高亮 ↔ D 显示对应 Operation 可用态
- 多选时 D 只显示「批量可用」的操作（去背景、转格式、合成 GIF 等）
- 单选 video 时 D 自动展开「视频抽帧」Tab

---

## 5. 页面状态机（Canvas Tab）

```text
无资产          → Empty（拖入引导）
有资产、无选中   → Grid
单选图片/帧     → Grid 或 Detail（用户切换）
单选 + 有 parent → 可开 Compare
执行 GIF 后     → 自动 GIF Tab
执行 Sprite 后  → 自动 Sprite Tab
```

---

## 6. 与 Mosaic 的边界

| 项目 | Studio (`/studio`)        | Mosaic (`/mosaic/*`) |
| ---- | ------------------------- | -------------------- |
| 目标 | AI 素材后处理             | 多图拼贴布局         |
| 数据 | Dexie 资产库              | 内存 / URL state     |
| 导航 | 独立入口                  | 独立入口             |
| 代码 | `app/studio/*`            | `app/mosaic/*` 不改  |
| 共享 | 仅 `lib/image/*` 工具函数 | 同左                 |

**本期不做：** Mosaic → Studio 导入、Studio → Mosaic 导出。

---

## 7. 目录结构（Studio 专用）

```text
app/studio/
  page.tsx                    # Server entry
  StudioClient.tsx            # 布局壳：A/B/C/D/E 五区
  components/
    top-bar/
      TopBar.tsx
      JobStatusStrip.tsx
      ExportMenu.tsx
    library/
      LibraryPanel.tsx
      AssetCard.tsx
      AssetTree.tsx
      ImportDropzone.tsx
      LibraryFilters.tsx
    canvas/
      CanvasArea.tsx
      GridView.tsx              # 迁移 BatchPreviewGrid
      DetailView.tsx            # 迁移 PreviewPane
      CompareView.tsx
      GifView.tsx               # 迁移 GifPreview
      SpriteView.tsx
    inspector/
      InspectorPanel.tsx
      SelectionInfo.tsx
      operations/
        RemoveBackgroundOp.tsx  # 迁移 ProcessingSettings
        ConvertFormatOp.tsx
        ExtractFramesOp.tsx
        ComposeGifOp.tsx
        ComposeSpriteOp.tsx
        ExportOp.tsx
      QuickWorkflows.tsx
    timeline/
      QueueBar.tsx
      FrameTimeline.tsx         # 帧胶片条（已确认保留）
  hooks/
    useStudioStore.ts
    useAssetSelection.ts
    useJobQueue.ts
  context/
    StudioContext.tsx

lib/studio/
  db.ts                         # Dexie
  asset-service.ts
  orchestrator.ts
  operations/*.ts
  workflows/*.ts                # 快捷工作流定义

lib/workers/                    # 从 progress/frames 迁入
  segmentation.worker.ts
  gif.worker.ts
  image.worker.ts
```

---

## 8. 响应式与折叠（二期预留）

| 断点        | 行为                           |
| ----------- | ------------------------------ |
| ≥1280px     | 五区全显示                     |
| 1024–1279px | D Inspector 改为右侧抽屉       |
| <1024px     | 仅建议桌面使用；移动显示提示页 |

---

## 9. 实施顺序（仅 Studio）

| 阶段   | 交付                                    |
| ------ | --------------------------------------- |
| **E0** | `/studio` 空壳 Layout（A/B/C/D/E 占位） |
| **E1** | B 库 + Dexie 导入/列表/多选             |
| **E2** | C Grid + Detail + D SelectionInfo       |
| **E3** | D 去背景 + E Queue + IDB 持久化         |
| **E4** | D 格式转换 + Tab6 导出/ZIP              |
| **E5** | D 抽帧 + C Timeline 胶片条              |
| **E6** | D GIF + C GIF Tab 预览                  |
| **E7** | D 雪碧图 + C Sprite Tab                 |
| **E8** | Quick Workflows + 废弃 progress/frames  |

---

## 10. 确认结果（定稿）

1. 路由名：**`/studio`**（与 `/mosaic/editor` 区分清晰）
2. Layout 五区 A/B/C/D/E：**通过**
3. Inspector 操作组织：**Tab**
4. 底栏：**帧 Timeline 胶片条 + Job Queue 均保留**
5. Compare 对比视图：**首期保留**

---

下一步：从 **E0** 开始搭 `/studio` Layout 空壳，再进入 E1（Dexie + 资产库）。
