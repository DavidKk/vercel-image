'use client'

/**
 * Zone D: inspector configuration and execution for the active operation
 */
import { FiRotateCcw } from 'react-icons/fi'

import { STUDIO_BUTTON_HEIGHT_CLASS, STUDIO_BUTTON_ICON_CLASS, STUDIO_BUTTON_PRIMARY_CLASS } from '@/components/form-styles'
import { PanelEmptyState } from '@/components/PanelEmptyState'
import { Tooltip } from '@/components/Tooltip'

import { useStudio } from '../../context/StudioContext'
import { useOperationAction } from '../../hooks/useOperationAction'
import { OPERATION_TABS } from '../canvas/operation-tabs'
import { StudioPanel, StudioPanelBody, StudioPanelHeader } from '../StudioPanel'
import { InspectorProgressModule } from './InspectorProgressModule'
import { OperationPanel } from './operations'

/** Square icon button for inspector footer actions */
const INSPECTOR_ICON_BUTTON_CLASS = [
  STUDIO_BUTTON_HEIGHT_CLASS,
  STUDIO_BUTTON_ICON_CLASS,
  'w-10 border border-[var(--studio-surface-border)] bg-[var(--studio-surface-bg)] text-[var(--studio-surface-fg-muted)] hover:bg-[var(--studio-surface-muted)] hover:text-[var(--studio-surface-fg)]',
].join(' ')

/** Primary submit button for inspector footer */
const INSPECTOR_SUBMIT_BUTTON_CLASS = [STUDIO_BUTTON_PRIMARY_CLASS, 'w-full flex-1 px-5'].join(' ')

/**
 * Studio inspector panel (Zone D)
 * @returns Inspector panel element
 */
export function InspectorPanel() {
  const { activeTab, selectedIds } = useStudio()
  const action = useOperationAction(activeTab)
  const activeLabel = OPERATION_TABS.find((tab) => tab.value === activeTab)?.label ?? 'Settings'
  const needsSelection = activeTab !== 'export' && selectedIds.length === 0
  const showReset = action.canReset && Boolean(action.reset)
  const showSubmit = action.showSubmit
  const showFooterActions = showReset || showSubmit

  return (
    <StudioPanel className="relative h-full w-studio-inspector shrink-0 border-l border-[var(--studio-surface-border)]">
      <StudioPanelHeader title={activeLabel} />

      <StudioPanelBody className="min-h-0 overflow-hidden p-0">
        {needsSelection ? (
          <PanelEmptyState title="No selection" message={`Select assets in the library to configure ${activeLabel}`} />
        ) : (
          <div className="custom-scroll flex min-h-0 flex-1 flex-col overflow-y-auto p-3">
            <OperationPanel tab={activeTab} />
          </div>
        )}
      </StudioPanelBody>

      <InspectorProgressModule />

      {showFooterActions ? (
        <div className="flex w-full shrink-0 gap-2 bg-[var(--studio-surface-bg)] p-3">
          {showReset ? (
            <Tooltip content={action.resetTooltip} placement="top" wrapperClassName="shrink-0">
              <button
                type="button"
                onClick={() => void action.reset?.()}
                disabled={!action.canReset || needsSelection}
                className={INSPECTOR_ICON_BUTTON_CLASS}
                aria-label={action.resetTooltip}
              >
                <FiRotateCcw className="h-4 w-4" aria-hidden />
              </button>
            </Tooltip>
          ) : null}

          {showSubmit ? (
            <Tooltip content={action.submitTooltip} placement="top" wrapperClassName="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => void action.run()}
                disabled={!action.canRun || needsSelection}
                className={INSPECTOR_SUBMIT_BUTTON_CLASS}
                aria-label={action.submitTooltip}
              >
                {action.label}
              </button>
            </Tooltip>
          ) : null}
        </div>
      ) : null}
    </StudioPanel>
  )
}
