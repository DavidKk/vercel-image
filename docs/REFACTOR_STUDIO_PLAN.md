# Vercel Image — Studio 重构方案（待确认）

> 版本：v0.1 · 日期：2026-07-04  
> 状态：**草案，确认后开始实施**

---

## 1. 背景

### 1.1 项目现状

当前仓库同时承载两类能力，但**彼此割裂、数据无法流转**：

| 模块      | 路由        | 能力                | 问题                     |
| --------- | ----------- | ------------------- | ------------------------ |
| Mosaic    | `/mosaic`   | 多图拼贴布局        | 与 AI 后处理无关，体量大 |
| Progress  | `/progress` | AI 去背景、批量处理 | 仅图片，无持久化         |
| Frames    | `/frames`   | 视频抽帧、GIF 合并  | 与 Progress 未打通       |
| IndexedDB | Worker 内   | 仅缓存 AI 模型文件  | 未用于用户素材           |

已有三方库：`@imgly/background-removal`、`gifenc`、`heic2any`。

### 1.2 业务场景（你的核心诉求）

```text
AI 生成图片 / 视频
        │
        ▼
  导入浏览器（不上传服务器）
        │
        ├─► 批量去背景（PNG / WEBP + 透明）
        │
        ├─► 格式转换（PNG → WEBP、JPEG 等）
        │
        ├─► 视频 → 按 ms 抽帧 → 可选再去背景
        │
        └─► 动画合成
              ├─► GIF（循环预览 + 下载）
              └─► 雪碧图 Sprite Sheet（游戏/前端动画用）
        │
        ▼
  临时保存在 IndexedDB（刷新可恢复）
        │
        ▼
  批量导出（单张 / ZIP）
```

**关键约束（延续项目原则）：**

- 全部在浏览器端处理，素材不上传服务器
- 隐私优先，IndexedDB 仅存本地
- 支持批量，面向 AI 产出物（多图、短视频）

---

## 2. 重构目标

### 2.1 目标（Must Have）

1. **统一工作台 Studio**：一个入口完成「导入 → 处理 → 预览 → 导出」
2. **资产层 Asset Store**：所有图片/帧/GIF 结果写入 IndexedDB，可恢复、可复用
3. **可串联的处理流水线 Pipeline**：上一步输出可作为下一步输入
4. **批量处理**：队列执行、进度、失败重试
5. **覆盖场景**：
   - 去背景（AI）
   - 格式转换（PNG ↔ WEBP ↔ JPEG）
   - 视频抽帧（ms 时间范围）
   - 合成 GIF（带预览）
   - 合成雪碧图（可配置行列/间距）
   - 批量下载 / ZIP 打包

### 2.2 非目标（本期不做）

- 服务器端 FFmpeg / 图片处理 API
- 用户账号云同步
- 复杂图像编辑（图层、画笔、滤镜）
- 替换 / 重构 Mosaic 拼贴引擎（保留原路由，仅共享底层工具）

---

## 3. 技术方案总览

### 3.1 架构原则

```text
┌─────────────────────────────────────────────────────────┐
│                    Studio UI (React)                     │
│  AssetPanel │ Preview/BatchGrid │ OperationPanel        │
└─────────────┬───────────────────────┬───────────────────┘
              │                       │
              ▼                       ▼
┌─────────────────────┐   ┌───────────────────────────────┐
│  Studio Store       │   │  Processing Orchestrator       │
│  (React + IDB sync) │◄──│  Job Queue + Worker Pool       │
└─────────┬───────────┘   └───────────────┬───────────────┘
          │                               │
          ▼                               ▼
┌─────────────────────┐   ┌───────────────────────────────┐
│  IndexedDB (Dexie)  │   │  Web Workers                   │
│  assets / projects  │   │  segmentation / convert / gif  │
└─────────────────────┘   └───────────────────────────────┘
```

- **UI 层**：只负责选择与展示，不直接做重计算
- **Orchestrator**：统一调度任务（单张 / 批量），向 Worker 发消息
- **Asset Store**：所有 Blob 的唯一真相来源（含缩略图）
- **Worker**：CPU/GPU 密集任务隔离主线程

### 3.2 三方库选型（确认清单）

| 能力                 | 推荐库                         | 版本   | 理由                            | 现状        |
| -------------------- | ------------------------------ | ------ | ------------------------------- | ----------- |
| AI 去背景            | `@imgly/background-removal`    | ^1.7.0 | 浏览器端 ONNX，支持 WebGPU      | ✅ 已用     |
| ONNX Runtime         | `onnxruntime-web`（peer）      | 1.21.x | imgly 依赖                      | ✅ 间接依赖 |
| GIF 编码             | `gifenc`                       | ^1.0.3 | 轻量、纯 JS、支持透明           | ✅ 已用     |
| IndexedDB ORM        | **`dexie`**                    | ^4.x   | 比裸 IDB 易维护 Blob/索引       | 🆕 待引入   |
| ZIP 打包             | **`fflate`**                   | ^0.8.x | 体积小、支持流式 ZIP            | 🆕 待引入   |
| HEIC 解码            | `heic2any`                     | ^0.0.4 | iPhone 图片                     | ✅ 已有     |
| 雪碧图合成           | **自研**（Canvas 排列）        | —      | 需求简单，无需 texture-packer   | 🆕 自研     |
| 格式转换             | **浏览器原生** `canvas.toBlob` | —      | PNG/WEBP/JPEG 足够              | ✅ 已有封装 |
| 视频抽帧             | **浏览器原生** Video + Canvas  | —      | 无 FFmpeg 前提下唯一方案        | ✅ 已有     |
| 状态管理             | **React Context + Hooks**      | —      | 避免引入 Redux；项目已有 ahooks | 沿用        |
| 可选：IDB React 绑定 | `dexie-react-hooks`            | ^1.x   | `useLiveQuery` 自动刷新列表     | 可选        |

**明确不引入：**

- `ffmpeg.wasm`：体积大（~25MB+），首载慢，与「简单处理」定位不符
- `jszip`：可用但 `fflate` 更轻
- `sharp` / 服务端图像库：违背纯前端原则

### 3.3 IndexedDB 设计

**数据库名：** `vercel-image-studio`

| 表         | 字段                                                                                                           | 说明                         |
| ---------- | -------------------------------------------------------------------------------------------------------------- | ---------------------------- |
| `projects` | id, name, createdAt, updatedAt                                                                                 | 一次工作会话（可默认单项目） |
| `assets`   | id, projectId, parentId?, name, mimeType, blob, thumbBlob?, width, height, sourceType, status, meta, createdAt | 素材/产物                    |
| `jobs`     | id, projectId, type, inputAssetIds[], outputAssetId?, config, status, error?, createdAt                        | 处理任务记录（可恢复队列）   |

**容量策略：**

- 单资产软上限建议 **15MB**（可配置），超出提示
- 总容量接近浏览器配额时提示清理
- 缩略图最大边 **256px**，减少 IDB 压力
- 提供「清空项目 / 清空全部缓存」

**与现有 Worker 模型缓存的关系：**

- 模型缓存继续用现有 `progress-models` 库（Worker 内）
- 用户素材用新 `vercel-image-studio` 库
- **职责分离，不合并**

### 3.4 处理流水线（如何串联）

定义统一的 **Operation 类型**：

```typescript
type OperationType =
  | 'removeBackground' // AI 去背景
  | 'convertFormat' // PNG → WEBP 等
  | 'extractFrames' // 视频 → 多帧 assets
  | 'composeGif' // 多帧 → 单 GIF asset
  | 'composeSpriteSheet' // 多帧 → 单雪碧图 asset
  | 'duplicate' // 复制 asset（可选）

interface OperationJob {
  type: OperationType
  inputAssetIds: string[]
  config: OperationConfig // 各类型独立配置
}
```

**串联规则：**

```text
视频 Asset
  └─ extractFrames ──► Frame Assets (N)
        └─ removeBackground (batch) ──► Processed Frames (N)
              ├─ composeGif ──► GIF Asset
              └─ composeSpriteSheet ──► Sprite Asset

图片 Asset
  └─ removeBackground ──► PNG/WEBP Asset
        └─ convertFormat ──► WEBP Asset
```

**UI 串联方式：**

1. 在资产列表多选 → 右侧选择「操作」→ 执行 → 产物自动出现在列表（`parentId` 指向来源）
2. 支持 **预设工作流**（一键）：
   - `AI 图批量去背景`
   - `视频抽帧 → 去背景 → GIF`
   - `多帧 → 雪碧图`

### 3.5 Worker 拆分

| Worker                   | 职责                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- |
| `segmentation.worker.ts` | AI 模型加载 + 去背景（沿用现有，抽离到 `packages/workers` 或 `lib/workers`） |
| `image.worker.ts`        | 格式转换、缩略图、雪碧图排列                                                 |
| `gif.worker.ts`          | gifenc 编码（帧多时避免卡 UI）                                               |
| `video-frame.worker.ts`  | 可选；首期主线程 seek 即可，帧数 <500 可接受                                 |

Orchestrator 在 `lib/studio/orchestrator.ts` 中顺序调度 batch job。

---

## 4. 页面架构

### 4.1 路由规划

| 路由             | 名称             | 说明                                          |
| ---------------- | ---------------- | --------------------------------------------- |
| **`/studio`**    | Studio（新主页） | 统一 AI 后处理工作台                          |
| `/mosaic`        | Mosaic           | **保留**，拼贴工具，后期可「发送到 Studio」   |
| `/mosaic/editor` | Editor           | 保留                                          |
| `/progress`      | —                | **Deprecated** → 301 或入口提示跳转 `/studio` |
| `/frames`        | —                | **Deprecated** → 合并进 `/studio`             |
| `/`              | 首页             | 改为 Studio 介绍 + 入口卡片                   |

导航建议：

```text
Studio | Mosaic | Editor
```

### 4.2 Studio 页面布局

```text
┌──────────────────────────────────────────────────────────────┐
│  Header: 项目名 · 存储用量 · 清空缓存                          │
├──────────────┬─────────────────────────────┬─────────────────┤
│  Asset Panel │  Main Preview               │  Operations     │
│  (240px)     │  (flex)                     │  (320px)        │
│              │                             │                 │
│  · 上传区    │  · BatchGrid / Detail       │  · 操作类型选择  │
│  · 筛选      │  · GIF 预览                 │  · 参数配置      │
│  · 资产列表  │  · 对比 Original/Processed  │  · 执行 / 队列   │
│  · 多选      │                             │  · 导出          │
├──────────────┴─────────────────────────────┴─────────────────┤
│  Job Bar: 队列进度 · 当前任务 · 取消                           │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 核心组件拆分

```text
app/studio/
  page.tsx
  StudioClient.tsx
  components/
    AssetPanel/
    AssetGrid.tsx
    PreviewPane.tsx          # 复用 progress 的缩放预览
    GifPreview.tsx           # 迁移自 frames
    OperationPanel/
      RemoveBgSettings.tsx   # 迁移自 progress
      ConvertFormatSettings.tsx
      ExtractFramesSettings.tsx
      ComposeGifSettings.tsx
      ComposeSpriteSettings.tsx
    JobProgressBar.tsx
  hooks/
    useStudioStore.ts
    useAssetSelection.ts
    useJobQueue.ts
  lib/                       # 或提升到 src/lib/studio
    db.ts                    # Dexie schema
    asset-service.ts
    orchestrator.ts
    operations/
      remove-background.ts
      convert-format.ts
      extract-frames.ts
      compose-gif.ts
      compose-sprite.ts
    workers/                 # 从 app/progress、app/frames 迁入
```

---

## 5. 功能规格摘要

### 5.1 去背景

- 库：`@imgly/background-removal`
- 配置：model / device / mode / outputFormat / quality / 边缘后处理（沿用现 Progress 配置）
- 默认：WebGPU（可用时）、WEBP、removeBackground
- 输入：图片 asset 或帧 asset
- 输出：新 asset，`parentId` 关联源

### 5.2 格式转换

- 实现：`canvas.toBlob(mime, quality)`
- 支持：PNG、WEBP、JPEG
- 批量：Orchestrator 逐张转换

### 5.3 视频抽帧

- 迁移自 `frames` 模块
- 时间单位：**ms**（已落地）
- 输出：每帧一个 asset，`meta.timestampMs`

### 5.4 合成 GIF

- 库：`gifenc`
- 必须：**生成后预览**，再下载（已实现，迁入 Studio）
- 配置：帧间隔 ms、是否循环

### 5.5 合成雪碧图（新功能）

- 实现：Canvas 将 N 张图按网格排列
- 配置：
  - 列数 / 行数（或自动计算）
  - 单元格 padding
  - 输出格式 PNG / WEBP
  - 可选：输出 JSON 元数据（每帧 `x,y,w,h` + `durationMs`，供 CSS/steps 动画）
- 场景：AI 多帧图合并为一张 sprite sheet

### 5.6 批量处理

- 多选 assets → 选择操作 → 入队
- 队列状态：pending / running / done / error
- 并发：**AI 去背景串行**（单 Worker 模型），格式转换可并行 2–3 个

### 5.7 导出

- 单张：`download` attribute
- 批量：`fflate` 打 ZIP
- 可选：仅导出选中 / 仅导出某次 job 产物

---

## 6. 目录重构与迁移策略

### 6.1 目标目录（建议）

```text
lib/
  studio/           # 核心业务（与 UI 解耦，可单测）
  image/            # 通用 image utils（从 progress 提升）
  workers/          # 所有 Worker 统一入口
app/
  studio/           # 新 UI
  mosaic/           # 不动
  progress/         # 过渡期保留 → 最终删除
  frames/           # 过渡期保留 → 最终删除
```

### 6.2 迁移阶段

| 阶段 | 内容                                 | 风险 |
| ---- | ------------------------------------ | ---- |
| P0   | Dexie + Asset 模型 + Studio 空壳页   | 低   |
| P1   | 迁入去背景 + 批量 + IDB 持久化       | 中   |
| P2   | 迁入抽帧 + GIF + 格式转换            | 中   |
| P3   | 雪碧图 + ZIP + 预设工作流            | 低   |
| P4   | 废弃 /progress、/frames，更新 README | 低   |

**原则：** 每个阶段可独立上线，不 big-bang。

---

## 7. 任务拆分（实施顺序）

### Phase 0 — 基础设施（约 2–3 天）

- [ ] 引入 `dexie`、`fflate`
- [ ] 实现 `lib/studio/db.ts` schema
- [ ] 实现 `asset-service`：导入、缩略图、删除、列表
- [ ] `StudioClient` 三栏布局空壳
- [ ] `useStudioStore` + IDB hydration（刷新恢复）

### Phase 1 — 去背景 + 批量（约 3–4 天）

- [ ] 迁移 `segmentation.worker` → `lib/workers`
- [ ] 迁移 `model-config`、`batch-utils` → `lib/studio/operations`
- [ ] OperationPanel：RemoveBgSettings
- [ ] Job 队列 + 进度条
- [ ] 产物写回 IDB，Grid 预览

### Phase 2 — 格式转换 + 导出（约 1–2 天）

- [ ] `convertFormat` operation
- [ ] 单张 / 批量下载
- [ ] ZIP 导出（fflate）

### Phase 3 — 视频 & 动画（约 3–4 天）

- [ ] 迁移 `extract-frames`、`gif-merge`
- [ ] GIF 预览 Tab
- [ ] `composeSpriteSheet` 新实现 + 元数据 JSON

### Phase 4 — 工作流 & 收尾（约 2 天）

- [ ] 预设：`视频→帧→去背景→GIF`、`多图批量去背景`
- [ ] `/progress`、`/frames` 重定向或移除
- [ ] README / 导航更新
- [ ] E2E：Studio 核心路径

**合计预估：11–15 人天**（单人串行）

---

## 8. 数据流示例（你的典型场景）

### 场景 A：AI 图片批量去背景 → WEBP

```text
1. 拖入 20 张 PNG → assets 写入 IDB
2. 全选 → 操作「去背景」→ 队列执行
3. 全选产物 → 操作「转 WEBP」
4. ZIP 导出
```

### 场景 B：AI 视频 → 透明 GIF

```text
1. 导入 MP4 → video asset
2. 抽帧（0 ~ 0, 每 100ms）→ 30 个 frame assets
3. 批量去背景
4. 合成 GIF → 预览 → 下载
5. 全部记录在 IDB，关闭浏览器后可继续
```

### 场景 C：多帧 → 雪碧图（游戏素材）

```text
1. 10 张 AI 图（已去背景）→ 多选
2. 合成雪碧图（5列×2行，padding 2px）
3. 导出 PNG + sprite.json（帧坐标与时长）
```

---

## 9. 风险与对策

| 风险                      | 对策                                                  |
| ------------------------- | ----------------------------------------------------- |
| IDB 容量不足              | 缩略图压缩、单文件上限、清理策略                      |
| AI 模型首载慢             | 继续 IDB 缓存模型 + preload 提示                      |
| 视频抽帧 seek 慢          | 限制最大帧数；后期 Worker 化                          |
| dev/build 缓存冲突        | 已加 `dev:clean` / `build:clean`                      |
| gifenc 不适合照片         | 文档说明适用扁平/透明动画；照片建议 WEBP 动图（二期） |
| Mosaic 与 Studio 代码重复 | 抽取 `lib/image`，Mosaic 逐步引用                     |

---

## 10. 待你确认的事项

请逐项确认或调整后再开工：

### 10.1 产品

- [ ] **统一入口 `/studio`**，废弃 `/progress` 和 `/frames`，是否同意？
- [ ] **Mosaic 保持独立**，仅共享底层库，是否同意？
- [ ] 默认 **单项目** 还是支持 **多项目列表**？（建议首期单项目，降低复杂度）
- [ ] 雪碧图是否需要 **JSON 元数据** 导出？（建议要）

### 10.2 技术

- [ ] IndexedDB 使用 **Dexie**，是否同意？
- [ ] ZIP 使用 **fflate**，是否同意？
- [ ] AI 去背景继续 **@imgly/background-removal**，不换方案？
- [ ] 雪碧图 **自研 Canvas**，不引入 texture-packer 类库？

### 10.3 默认参数

- [ ] 去背景：WebGPU + WEBP + `isnet_fp16`（与现 Progress 一致）
- [ ] 抽帧：100ms 间隔，最多 300 帧
- [ ] GIF：与抽帧 interval 一致

### 10.4 范围

- [ ] 本期 **不做** WEBP 动图（animated webp），仅 GIF？
- [ ] 本期 **不做** Mosaic → Studio 一键导入？（可放 P4）

---

## 11. 确认后的第一步

你确认本方案后，将从 **Phase 0** 开始：

1. 创建 `lib/studio/db.ts` + Dexie
2. 搭建 `/studio` 三栏 UI
3. 实现资产拖入与 IDB 持久化
4. 再迁移去背景能力

---

**请回复确认/修改意见（尤其第 10 节），确认后我再开始写代码。**
