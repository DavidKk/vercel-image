import { redirect } from 'next/navigation'

/**
 * Home route redirects to Studio (unified entry)
 * @returns Never returns (redirect)
 */
export default function Home() {
  redirect('/studio')
}
