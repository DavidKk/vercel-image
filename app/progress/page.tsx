import { redirect } from 'next/navigation'

/**
 * Legacy progress route redirects to Studio
 * @returns Never returns (redirect)
 */
export default function ProgressPage() {
  redirect('/studio')
}
