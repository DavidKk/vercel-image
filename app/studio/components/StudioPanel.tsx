'use client'

/**
 * Shared Studio panel shell with unified header sizing
 */
import { type ComponentPropsWithoutRef, type ElementType, forwardRef, type ReactNode } from 'react'

/** Unified single-row panel header height and layout */
export const STUDIO_PANEL_HEADER_CLASS = 'flex h-10 shrink-0 items-center gap-2 border-b border-[var(--studio-panel-border)] bg-white px-3'

/** Unified panel title typography */
export const STUDIO_PANEL_TITLE_CLASS = 'flex-1 truncate text-sm font-semibold text-gray-800'

/** Secondary header row below the title bar */
export const STUDIO_PANEL_HEADER_EXTRA_CLASS = 'flex min-h-8 shrink-0 items-center gap-1 border-b border-[var(--studio-panel-border)] px-3 py-1.5'

/** Toolbar row below the header (tabs, filters, etc.) */
export const STUDIO_PANEL_TOOLBAR_CLASS = 'shrink-0 border-b border-[var(--studio-panel-border)] px-3 py-1.5'

/** Default scrollable panel body (direction applied via StudioPanelBody) */
export const STUDIO_PANEL_BODY_CLASS = 'flex min-h-0 flex-1'

/** Standard icon button for panel header actions */
export const STUDIO_PANEL_ICON_BUTTON_CLASS = 'inline-flex h-7 w-7 items-center justify-center rounded-md text-gray-600 transition-colors hover:bg-gray-100 hover:text-blue-600'

interface StudioPanelProps {
  /** Root element tag */
  as?: ElementType
  /** Root element classes (width, borders, etc.) */
  className?: string
  /** Panel content */
  children: ReactNode
}

/**
 * Studio panel container (Library, Inspector, TopBar shell, etc.)
 * @param props Panel configuration
 * @param ref Ref to the root element
 * @returns Panel root element
 */
export const StudioPanel = forwardRef<HTMLElement, StudioPanelProps>(function StudioPanel(props, ref) {
  const { as: Tag = 'aside', className = '', children } = props
  const rootClass = ['flex min-h-0 flex-col bg-white', className].filter(Boolean).join(' ')

  return (
    <Tag ref={ref} className={rootClass}>
      {children}
    </Tag>
  )
})

StudioPanel.displayName = 'StudioPanel'

interface StudioPanelHeaderProps {
  /** Panel title text */
  title?: ReactNode
  /** Header action controls (right side) */
  actions?: ReactNode
  /** Extra header classes */
  className?: string
  /** Custom header content (overrides title/actions layout) */
  children?: ReactNode
}

/**
 * Unified single-row panel header
 * @param props Header configuration
 * @returns Header element
 */
export function StudioPanelHeader(props: StudioPanelHeaderProps) {
  const { title, actions, className = '', children } = props
  const headerClass = [STUDIO_PANEL_HEADER_CLASS, className].filter(Boolean).join(' ')

  if (children) {
    return <div className={headerClass}>{children}</div>
  }

  return (
    <div className={headerClass}>
      {title ? <h2 className={STUDIO_PANEL_TITLE_CLASS}>{title}</h2> : null}
      {actions ? <div className="flex shrink-0 items-center gap-1">{actions}</div> : null}
    </div>
  )
}

interface StudioPanelHeaderExtraProps {
  /** Secondary header content */
  children: ReactNode
  /** Extra row classes */
  className?: string
}

/**
 * Secondary panel header row (selection tools, summary, etc.)
 * @param props Extra header configuration
 * @returns Extra header element
 */
export function StudioPanelHeaderExtra(props: StudioPanelHeaderExtraProps) {
  const { children, className = '' } = props
  const extraClass = [STUDIO_PANEL_HEADER_EXTRA_CLASS, className].filter(Boolean).join(' ')

  return <div className={extraClass}>{children}</div>
}

interface StudioPanelToolbarProps {
  /** Toolbar content */
  children: ReactNode
  /** Toolbar classes */
  className?: string
}

/**
 * Panel toolbar row below the header
 * @param props Toolbar configuration
 * @returns Toolbar element
 */
export function StudioPanelToolbar(props: StudioPanelToolbarProps) {
  const { children, className = '' } = props
  const toolbarClass = [STUDIO_PANEL_TOOLBAR_CLASS, className].filter(Boolean).join(' ')

  return <div className={toolbarClass}>{children}</div>
}

interface StudioPanelBodyProps extends ComponentPropsWithoutRef<'div'> {
  /** Body content */
  children: ReactNode
  /** Flex direction for body layout */
  direction?: 'col' | 'row'
}

/**
 * Panel body wrapper with flex growth and min-height zero
 * @param props Body configuration
 * @returns Body element
 */
export function StudioPanelBody(props: StudioPanelBodyProps) {
  const { children, className = '', direction = 'col', ...rest } = props
  const directionClass = direction === 'row' ? 'flex-row' : 'flex-col'
  const bodyClass = [STUDIO_PANEL_BODY_CLASS, directionClass, className].filter(Boolean).join(' ')

  return (
    <div className={bodyClass} {...rest}>
      {children}
    </div>
  )
}

interface StudioPanelIconButtonProps extends ComponentPropsWithoutRef<'button'> {
  /** Accessible label (required for icon-only buttons) */
  'aria-label': string
}

/**
 * Standard icon button for panel header actions
 * @param props Button props
 * @returns Icon button element
 */
export function StudioPanelIconButton(props: StudioPanelIconButtonProps) {
  const { className = '', type = 'button', ...rest } = props
  const buttonClass = [STUDIO_PANEL_ICON_BUTTON_CLASS, className].filter(Boolean).join(' ')

  return <button type={type} className={buttonClass} {...rest} />
}
