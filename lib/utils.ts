import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

/** Merge Tailwind classes safely, resolving conflicts. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Generate a mock verification ID. */
export function generateVerificationId(): string {
  return `VRF-${Math.random().toString(36).substring(2, 10).toUpperCase()}`
}
