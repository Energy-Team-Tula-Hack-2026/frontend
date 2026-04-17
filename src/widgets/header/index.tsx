'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
	BookOpenText,
	LayoutDashboard,
	ScrollText,
	ShoppingBag,
	Trophy,
	User
} from 'lucide-react'

import { cn } from '@/shared/lib/utils'
import { buttonVariants } from '@/shared/components/ui/button'
import { ThemeToggle } from '@/shared/components/theme-toggle'
import { useUser } from '@/shared/hooks/use-user'
import { isPlatformAdmin } from '@/shared/lib/roles'

const navLinks = [
	{ href: '/crafts', label: 'Ремесла', icon: BookOpenText },
	{ href: '/leader-board', label: 'Рейтинг', icon: Trophy },
	{ href: '/shop', label: 'Маркет', icon: ShoppingBag },
	{ href: '/profile', label: 'Профиль', icon: User }
]

export function Header() {
	const { user } = useUser()
	const pathname = usePathname()

	return (
		<header className="sticky top-0 z-40 border-b border-amber-900/10 bg-white/80 backdrop-blur-lg dark:border-zinc-700/70 dark:bg-zinc-950/80">
			<div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
				<Link
					href="/"
					className="group flex shrink-0 items-center gap-3"
				>
					<div className="from-primary/20 to-primary/5 text-primary flex size-10 items-center justify-center rounded-xl bg-gradient-to-br transition-transform group-hover:scale-105">
						<ScrollText className="size-5" />
					</div>

					<div className="hidden sm:flex sm:flex-col">
						<span className="text-muted-foreground text-xs tracking-wide uppercase">
							Культурная платформа
						</span>
						<span className="text-sm font-semibold sm:text-base">
							Культурный калейдоскоп
						</span>
					</div>
				</Link>

				<nav className="hidden items-center gap-1 md:flex">
					{navLinks.map(({ href, label, icon: Icon }) => {
						const isActive =
							pathname === href || pathname.startsWith(`${href}/`)

						return (
							<Link
								key={href}
								href={href}
								className={cn(
									'inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm transition-colors',
									isActive
										? 'bg-amber-100 text-amber-900 dark:bg-amber-900/30 dark:text-amber-100'
										: 'text-muted-foreground hover:bg-muted hover:text-foreground'
								)}
							>
								<Icon className="size-4" />
								<span>{label}</span>
							</Link>
						)
					})}
				</nav>

				<div className="flex items-center gap-2">
					{isPlatformAdmin(user?.role) && (
						<Link
							href="/admin"
							aria-label="Админ панель"
							className={buttonVariants({
								variant: 'ghost',
								size: 'icon'
							})}
						>
							<LayoutDashboard className="size-5" />
						</Link>
					)}
					<ThemeToggle />
				</div>
			</div>
		</header>
	)
}
