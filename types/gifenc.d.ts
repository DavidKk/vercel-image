declare module 'gifenc' {
  export interface GifWriteFrameOptions {
    palette?: number[][]
    delay?: number
    repeat?: number
    transparent?: boolean
    transparentIndex?: number
    dispose?: number
    first?: boolean
  }

  export interface QuantizeOptions {
    format?: 'rgb565' | 'rgb444' | 'rgba4444'
    oneBitAlpha?: boolean | number
    clearAlpha?: boolean
    clearAlphaThreshold?: number
    clearAlphaColor?: number
  }

  export interface PrequantizeOptions {
    roundRGB?: number
    roundAlpha?: number
    oneBitAlpha?: boolean | number
  }

  export function GIFEncoder(opts?: { auto?: boolean; initialCapacity?: number }): {
    writeFrame(index: Uint8Array, width: number, height: number, options?: GifWriteFrameOptions): void
    finish(): void
    bytes(): Uint8Array
    bytesView(): Uint8Array
    reset(): void
  }

  export function quantize(rgba: Uint8Array | Uint8ClampedArray | Uint32Array, maxColors: number, options?: QuantizeOptions): number[][]

  export function applyPalette(rgba: Uint8Array | Uint8ClampedArray | Uint32Array, palette: number[][], format?: string): Uint8Array

  export function prequantize(rgba: Uint32Array, options?: PrequantizeOptions): void
}
