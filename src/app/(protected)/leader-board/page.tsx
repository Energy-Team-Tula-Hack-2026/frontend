import { LeaderBoardWidget } from '@/widgets/leader-board'

export default function LeaderboardPage() {
	return (
		<div className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
			<section className="mb-6 rounded-3xl border border-amber-200/70 bg-gradient-to-r from-amber-50 via-orange-50 to-emerald-50 px-6 py-7 dark:border-amber-800/40 dark:from-zinc-900 dark:via-zinc-900 dark:to-amber-950/20">
				<h1 className="text-2xl font-semibold sm:text-3xl">
					Рейтинг участников
				</h1>
				<p className="text-muted-foreground mt-2 max-w-2xl text-sm sm:text-base">
					Смотрите, кто активнее всего проходит маршруты и набирает
					баллы.
				</p>
			</section>
			<LeaderBoardWidget />
		</div>
	)
}
