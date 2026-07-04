'use client'

import { AiOutlineLoading3Quarters } from 'react-icons/ai'

export interface SpinnerProps {
  /** Tailwind color class for the spinner icon */
  color?: string
  /** Additional size or layout classes */
  className?: string
}

/**
 * Animated loading spinner for async UI states
 * @param props Spinner configuration
 * @returns Spinner element
 */
export function Spinner(props: SpinnerProps) {
  const { color = 'text-white', className = 'h-5 w-5' } = props

  return <AiOutlineLoading3Quarters className={['animate-spin', className, color].filter(Boolean).join(' ')} aria-hidden />
}
