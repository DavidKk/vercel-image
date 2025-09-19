export interface Position {
  /** 支持像素值或百分比，默认为0 */
  x: number | string
  /** 支持像素值或百分比，默认为0 */
  y: number | string
}

export interface Size {
  /** 支持像素值或百分比，默认为100% */
  width: number | string
  /** 支持像素值或百分比，默认为100% */
  height: number | string
}

export interface Shadow {
  /** 阴影X轴偏移量 */
  x: number
  /** 阴影Y轴偏移量 */
  y: number
  /** 阴影模糊半径 */
  blur: number
  /** 阴影颜色 */
  color: string
}

export interface Mask {
  /** 遮罩类型：image表示图片遮罩，shape表示形状遮罩 */
  type: 'image' | 'shape'
  /** 当type为image时使用的遮罩图片URL */
  src?: string
  /** 当type为shape时使用的形状类型 */
  shape?: 'rect' | 'circle' | 'polygon'
  /** 多边形顶点坐标，当shape为polygon时使用 */
  polygonPoints?: Position[]
}

// 定义媒体类型枚举
export type MediaType = 'image' | 'video'

// 定义媒体对象接口，用于表示图片或视频
export interface MediaObject {
  /** 媒体类型：图片或视频 */
  type: MediaType
  /** 媒体源地址，可以是URL或base64数据 */
  src: string | null
}

export interface ImageElement {
  // 基础几何属性
  /** 左上角X坐标（相对画布），默认为0 */
  x?: number | string
  /** 左上角Y坐标（相对画布），默认为0 */
  y?: number | string
  /** 元素宽度（可支持百分比 "50%"），默认为100% */
  width?: number | string
  /** 元素高度（可支持百分比 "50%"），默认为100% */
  height?: number | string
  /** 旋转角度（°，默认 0） */
  rotation?: number
  /** 层级顺序（决定谁在上面） */
  zIndex?: number

  // 变换中心点（用于缩放和旋转的参考点）
  origin?: {
    /** 变换中心点 X 坐标（相对元素自身） */
    x: number | string
    /** 变换中心点 Y 坐标（相对元素自身） */
    y: number | string
  }

  // 图片相关
  /** 图片 URL/base64 */
  src?: string
  /** 填充方式 */
  fit?: 'cover' | 'contain' | 'fill'
  /** 裁切形状 */
  clipShape?: 'rect' | 'circle' | 'polygon'
  /** 自定义复杂区域的多边形顶点 */
  polygonPoints?: Position[]
  /** 透明度（0–1） */
  opacity?: number

  // 背景与遮罩
  /** 背景填充色 */
  backgroundColor?: string
  /** 遮罩 */
  mask?: Mask

  // 变换与效果
  /** 水平缩放（默认 1） */
  scaleX?: number
  /** 垂直缩放（默认 1） */
  scaleY?: number
  /** 水平斜切（倾斜效果） */
  skewX?: number
  /** 垂直斜切（倾斜效果） */
  skewY?: number
  /** 圆角（对矩形生效） */
  borderRadius?: number
  /** 阴影参数 */
  shadow?: Shadow

  /** 间距方向控制：'both' 表示横向和纵向都调整，'horizontal' 表示仅调整横向，'vertical' 表示仅调整纵向 */
  spacingDirection?: 'both' | 'horizontal' | 'vertical'

  /** 元素是否可拖拽，默认为 true */
  draggable?: boolean
  /** 拖拽方向限制，'both' 表示可以任意方向拖拽，'horizontal' 表示只能水平拖拽，'vertical' 表示只能垂直拖拽 */
  dragDirection?: 'both' | 'horizontal' | 'vertical'

  // 其他可选属性
  /** 标识，用于动态替换 */
  id?: string
  /** 标识，用于动态替换 */
  name?: string
  /** 是否显示 */
  visible?: boolean
  /** 混合模式（multiply、overlay 等） */
  blendMode?: string
  /** 点击跳转（如果是交互式） */
  link?: string
}

export interface LayoutSchema {
  /** 画布宽度 */
  canvasWidth: number
  /** 画布高度 */
  canvasHeight: number
  /** 图片元素数组 */
  elements: ImageElement[]
  /** 元素之间的间距（0-10%） */
  spacing?: number
  /** 内容与画布边缘的距离（0-10%） */
  padding?: number
  /** spacing的范围配置 [min, max] */
  spacingRange?: [number, number]
  /** padding的范围配置 [min, max] */
  paddingRange?: [number, number]
}

export interface ClickArea {
  /** 元素ID */
  elementId?: string
  /** 元素索引 */
  elementIndex: number
  /** 点击区域左上角X坐标 */
  x: number
  /** 点击区域左上角Y坐标 */
  y: number
  /** 点击区域宽度 */
  width: number
  /** 点击区域高度 */
  height: number
}

// 以下是从types.ts合并过来的类型，用于向后兼容
export interface ImagePosition {
  /** 元素索引 */
  index: number
  /** 元素左上角X坐标 */
  x: number
  /** 元素左上角Y坐标 */
  y: number
  /** 元素宽度 */
  width: number
  /** 元素高度 */
  height: number
}

export interface LayoutConfig {
  /** 画布宽度 */
  canvasWidth: number
  /** 画布高度 */
  canvasHeight: number
}
