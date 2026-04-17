import { buttonVariants } from '@/shared/components/ui/button'
import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
	title: 'Страница не найдена | Культурный калейдоскоп',
	description: 'Запрошенная страница отсутствует или была перемещена.'
}

export default function NotFound() {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
			<div className="flex min-h-[60vh] flex-col items-center justify-center rounded-3xl border border-amber-200/70 bg-gradient-to-br from-amber-50 via-orange-50 to-emerald-50 p-8 text-center dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
				<h1 className="text-6xl font-bold tracking-tight">404</h1>
				<h2 className="mt-3 text-2xl font-semibold">
					Страница не найдена
				</h2>
				<p className="text-muted-foreground mt-3 max-w-xl text-base sm:text-lg">
					Похоже, вы перешли по устаревшей ссылке или страница была
					перемещена.
				</p>
				<Link
					href="/"
					className={buttonVariants({
						size: 'lg',
						className: 'mt-6'
					})}
				>
					На главную
				</Link>
			</div>
		</div>
	)
}
