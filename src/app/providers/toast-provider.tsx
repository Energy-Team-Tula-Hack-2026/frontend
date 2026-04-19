'use client'

import { Toaster } from '@/shared/components/ui/sonner'

export const ToastProvider = () => (
	<Toaster position="bottom-right" duration={5000} closeButton />
)
