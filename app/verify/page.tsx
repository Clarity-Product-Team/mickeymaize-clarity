import type { Metadata } from 'next'
import { VerifyFlow } from '@/flows/VerifyFlow'

export const metadata: Metadata = {
  title: 'Identity Verification — Clarity Verify',
}

/**
 * Server component wrapper.
 * The actual flow is a client component that manages its own state.
 */
export default function VerifyPage() {
  return <VerifyFlow />
}
