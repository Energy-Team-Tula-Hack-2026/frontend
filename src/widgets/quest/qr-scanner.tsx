// components/qr-scanner.tsx
'use client'

import { useLayoutEffect, useRef, useId } from 'react'
import { Html5Qrcode, Html5QrcodeCameraScanConfig } from 'html5-qrcode'

interface QrScannerProps {
	onScanSuccess: (decodedText: string) => void
	onError?: (error: string) => void
	disabled?: boolean
	className?: string
}

export function QrScanner({
	onScanSuccess,
	onError,
	disabled,
	className
}: QrScannerProps) {
	const scannerRef = useRef<Html5Qrcode | null>(null)
	const containerRef = useRef<HTMLDivElement>(null)

	const uniqueId = useId()
	const containerId = `qr-reader-${uniqueId.replace(/:/g, '')}`

	const isActiveRef = useRef(false)
	const stopRequestedRef = useRef(false)

	const stopScanner = async () => {
		if (!scannerRef.current) return
		stopRequestedRef.current = true

		try {
			await scannerRef.current.stop()
			scannerRef.current.clear()
		} catch {}

		scannerRef.current = null
		isActiveRef.current = false
	}

	const startScanner = async () => {
		if (stopRequestedRef.current) return
		if (scannerRef.current) return

		try {
			const scanner = new Html5Qrcode(containerId)
			scannerRef.current = scanner

			const config: Html5QrcodeCameraScanConfig = {
				fps: 15,
				qrbox: { width: 200, height: 200 },
				aspectRatio: 1.0
			}

			await scanner.start(
				{ facingMode: 'environment' },
				config,
				(decodedText: string) => {
					if (!isActiveRef.current) return
					stopScanner()
						.then(() => {
							onScanSuccess(decodedText)
						})
						.catch(() => {
							onScanSuccess(decodedText)
						})
				},
				(errorMessage: string) => {
					if (
						errorMessage.includes('NotFoundException') ||
						errorMessage.includes('getImageData')
					) {
						return
					}
					onError?.(errorMessage)
				}
			)
			isActiveRef.current = true
			stopRequestedRef.current = false
		} catch (err) {
			console.error('QR scanner initialization failed:', err)
			onError?.(
				err instanceof Error ? err.message : 'Failed to start camera'
			)
			scannerRef.current = null
		}
	}

	useLayoutEffect(() => {
		if (disabled) {
			stopScanner()
			return
		}

		if (containerRef.current) {
			startScanner()
			return
		}

		let rafId: number
		const waitForContainer = () => {
			if (containerRef.current) {
				startScanner()
				return
			}
			rafId = requestAnimationFrame(waitForContainer)
		}
		rafId = requestAnimationFrame(waitForContainer)

		return () => {
			cancelAnimationFrame(rafId)
			stopScanner()
		}
	}, [disabled])

	return (
		<div
			id={containerId}
			ref={containerRef}
			className={className}
			style={{ width: '100%', height: '100%', minHeight: '200px' }}
		/>
	)
}
