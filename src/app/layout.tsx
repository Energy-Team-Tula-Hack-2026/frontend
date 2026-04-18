import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'
import Link from 'next/link'

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
						<div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-4 py-5 text-sm sm:px-6 md:flex-row md:items-center md:justify-between lg:px-8">
							<div className="text-center md:text-left">
								<p className="text-muted-foreground/90">
									© 2026 Культурный калейдоскоп
								</p>
								<p className="text-muted-foreground/80 text-xs">
									Квесты, ремесла и культурные точки
								</p>
							</div>

							<nav className="flex items-center justify-center gap-4 text-xs md:justify-end">
								<Link
									className="text-muted-foreground hover:text-foreground transition-colors"
									href="/crafts"
								>
									Ремесла
								</Link>
								<Link
									className="text-muted-foreground hover:text-foreground transition-colors"
									href="/shop"
								>
									Маркет
								</Link>
								<Link
									className="text-muted-foreground hover:text-foreground transition-colors"
									href="/profile"
								>
									Профиль
								</Link>
							</nav>
						</div>
					</footer>
				</MainProvider>
			</body>
		</html>
	)
}
