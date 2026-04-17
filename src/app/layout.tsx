import type { Metadata } from 'next'
import { Geist, Geist_Mono } from 'next/font/google'

import { ThemeProvider } from '@/shared/components/theme-provider'

import './styles/globals.css'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { Button } from '@/shared/components/ui/button'
import Link from 'next/link'
import { UserCircle2 } from 'lucide-react'
import Image from 'next/image'

const geistSans = Geist({
	variable: '--font-geist-sans',
	subsets: ['latin']
})

const geistMono = Geist_Mono({
	variable: '--font-geist-mono',
	subsets: ['latin']
})

export const metadata: Metadata = {
	title: 'Tula Hack',
	description: 'Платформа Energy-Team Tula Hack',
	openGraph: {
		title: '',
		description: 'Платформа Energy-Team Tula Hack',
		url: 'https://energy-team-hack.ru',
		type: 'website'
	},
	twitter: {
		card: 'summary_large_image',
		title: 'Tula Hack',
		description: 'Платформа Tula Hack'
	}
}

export default function RootLayout({
	children
}: Readonly<{
	children: React.ReactNode
}>) {
	return (
		<html lang="ru" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} min-h-screen antialiased`}
			>
				<ThemeProvider
					attribute="class"
					defaultTheme="system"
					enableSystem
				>
					<header className="border-b">
						<div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
							<Link
								href="/"
								className="group flex items-center gap-3"
							>
								<div className="bg-primary/10 flex size-10 items-center justify-center rounded-xl transition-transform group-hover:scale-105">
									<Image
										src="/logo.svg"
										alt="Tula Hack logo"
										width={40}
										height={40}
										className="size-12 rounded-xl object-cover"
										priority
									/>
								</div>

								<div className="flex flex-col">
									<span className="text-muted-foreground text-sm">
										Платформа
									</span>
									<span className="text-lg leading-none font-semibold group-hover:opacity-80">
										Energy-Team Tula Hack
									</span>
								</div>
							</Link>

							<div className="flex items-center gap-2">
								<Button asChild variant="ghost" size="icon">
									<Link
										href="/profile"
										aria-label="Перейти в профиль"
									>
										<UserCircle2 className="size-5" />
									</Link>
								</Button>

								<ThemeToggle />
							</div>
						</div>
					</header>
					{children}
				</ThemeProvider>
			</body>
		</html>
	)
}
