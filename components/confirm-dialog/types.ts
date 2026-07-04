/**
 * Confirm dialog option and state types
 */

/** Options shown in a confirm dialog */
export interface ConfirmOptions {
  /** Dialog title */
  title?: string
  /** Dialog body message */
  message: string
  /** Primary action label */
  confirmLabel?: string
  /** Cancel action label */
  cancelLabel?: string
  /** Style confirm as a destructive action */
  destructive?: boolean
}

/** Pending confirm request held by the provider */
export interface ConfirmRequest {
  /** Dialog options */
  options: ConfirmOptions
  /** Resolves when the user chooses an action */
  resolve: (confirmed: boolean) => void
}

/** Confirm dialog API exposed by the provider */
export interface ConfirmApi {
  /**
   * Open a confirm dialog and wait for the user choice
   * @param options Dialog configuration
   * @returns True when confirmed, false when cancelled
   */
  confirm: (options: ConfirmOptions) => Promise<boolean>
}
