import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import './styles/globals.css'
import { Header } from '@/widgets/header'
import { MainProvider } from './providers'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin']
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin']
})

export const metadata: Metadata = {
	title: 'Культурный калейдоскоп'
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="ru" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
			>
				<MainProvider>
					<Header />

					<main className="grow">{children}</main>

					<footer className="border-t border-amber-900/10 bg-white/70 dark:border-zinc-700/70 dark:bg-zinc-950/60">
						<div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-3 px-4 py-5 text-sm sm:grid-cols-3 sm:items-center sm:px-6 lg:px-8">
							<p className="text-muted-foreground/90 text-center sm:text-left">
								© 2026 Культурный калейдоскоп
							</p>
							<p className="text-muted-foreground/80 text-center">
								Квесты, ремесла и культурные точки
							</p>
						</div>
					</footer>
				</MainProvider>
			</body>
		</html>
	)
}
