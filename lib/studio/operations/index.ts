/**
 * Studio processing operations barrel export
 */
export { type ComposeGifConfig, composeGifFromFrames, sortFrameAssets } from './compose-gif'
export { composeSpriteFromFrames } from './compose-sprite'
export { type ConvertFormatConfig, convertFormatItem } from './convert-format'
export { extractFramesFromVideo, resolveVideoSource } from './extract-frames'
export { processGifRemoveBackgroundBatch, processGifRemoveBackgroundItem } from './process-gif-background'
export { processRemoveBackgroundBatch, processRemoveBackgroundItem } from './remove-background'
