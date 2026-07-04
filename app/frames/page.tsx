import { redirect } from 'next/navigation'

/**
 * Legacy frames route redirects to Studio
 * @returns Never returns (redirect)
 */
export default function FramesPage() {
  redirect('/studio')
}
