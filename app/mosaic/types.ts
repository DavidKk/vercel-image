export interface Position {
  x: number | string // 支持像素值或百分比，默认为0
  y: number | string
}

export interface Size {
  width: number | string // 支持像素值或百分比，默认为100%
  height: number | string
}

export interface Shadow {
  x: number
  y: number
  blur: number
  color: string
}

export interface Mask {
  type: 'image' | 'shape'
  src?: string // 当type为image时使用
  shape?: 'rect' | 'circle' | 'polygon' // 当type为shape时使用
  polygonPoints?: Position[] // 多边形顶点坐标
}

// 定义媒体类型枚举
export type MediaType = 'image' | 'video'

// 定义媒体对象接口，用于表示图片或视频
export interface MediaObject {
  type: MediaType // 媒体类型：图片或视频
  src: string | null // 媒体源地址，可以是URL或base64数据
}

export interface ImageElement {
  // 基础几何属性
  x?: number | string // 左上角坐标（相对画布），默认为0
  y?: number | string
  width?: number | string // 宽高（可支持百分比 "50%"），默认为100%
  height?: number | string
  rotation?: number // 旋转角度（°，默认 0）
  zIndex?: number // 层级顺序（决定谁在上面）

  // 变换中心点（用于缩放和旋转的参考点）
  origin?: {
    x: number | string // 变换中心点 X 坐标（相对元素自身）
    y: number | string // 变换中心点 Y 坐标（相对元素自身）
  }

  // 图片相关
  src?: string // 图片 URL/base64
  fit?: 'cover' | 'contain' | 'fill' // 填充方式
  clipShape?: 'rect' | 'circle' | 'polygon' // 裁切形状
  polygonPoints?: Position[] // 自定义复杂区域的多边形顶点
  opacity?: number // 透明度（0–1）

  // 背景与遮罩
  backgroundColor?: string // 背景填充色
  mask?: Mask // 遮罩

  // 变换与效果
  scaleX?: number // 水平缩放（默认 1）
  scaleY?: number // 垂直缩放（默认 1）
  skewX?: number // 斜切（倾斜效果）
  skewY?: number // 斜切（倾斜效果）
  borderRadius?: number // 圆角（对矩形生效）
  shadow?: Shadow // 阴影参数

  // 间距方向控制：'both' 表示横向和纵向都调整，'horizontal' 表示仅调整横向，'vertical' 表示仅调整纵向
  spacingDirection?: 'both' | 'horizontal' | 'vertical'

  // 其他可选属性
  id?: string // 标识，用于动态替换
  name?: string // 标识，用于动态替换
  visible?: boolean // 是否显示
  blendMode?: string // 混合模式（multiply、overlay 等）
  link?: string // 点击跳转（如果是交互式）
}

export interface LayoutSchema {
  canvasWidth: number
  canvasHeight: number
  elements: ImageElement[]
  // 元素之间的间距（0-10%）
  spacing?: number
  // 内容与画布边缘的距离（0-10%）
  padding?: number
  // spacing和padding的范围配置 [min, max]
  spacingRange?: [number, number]
  paddingRange?: [number, number]
}

export interface ClickArea {
  elementId?: string
  elementIndex: number
  x: number
  y: number
  width: number
  height: number
}

// 以下是从types.ts合并过来的类型，用于向后兼容
export interface ImagePosition {
  index: number
  x: number
  y: number
  width: number
  height: number
}

export interface LayoutConfig {
  canvasWidth: number
  canvasHeight: number
}
