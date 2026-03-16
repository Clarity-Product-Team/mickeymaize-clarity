import { redirect } from 'next/navigation'

/** Root redirects directly to the verification flow. */
export default function RootPage() {
  redirect('/verify')
}
