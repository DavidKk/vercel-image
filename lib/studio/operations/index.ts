/**
 * Studio processing operations barrel export
 */
export {
  type AddTextConfig,
  addTextToImage,
  buildTextFont,
  drawTextAtPoint,
  drawTextBoxFrame,
  drawTextInBox,
  drawTextSelectionBox,
  hasTextBox,
  hitTestTextBoxEdge,
  isPointInTextBounds,
  isPointInTextBox,
  layoutTextLines,
  measureTextBounds,
  type TextBounds,
  type TextBoxEdge,
  type TextBoxRect,
  textBoxToPixels,
} from './add-text'
export { type ComposeGifConfig, composeGifFromFrames, sortFrameAssets } from './compose-gif'
export { composeSpriteFromFrames } from './compose-sprite'
export { type ConvertFormatConfig, convertFormatItem } from './convert-format'
export { extractFramesFromVideo, resolveVideoSource } from './extract-frames'
export { processGifRemoveBackgroundBatch, processGifRemoveBackgroundItem } from './process-gif-background'
export { processRemoveBackgroundBatch, processRemoveBackgroundItem } from './remove-background'
