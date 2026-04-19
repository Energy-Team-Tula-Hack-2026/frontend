import { MapPin, QrCode, Sparkles } from 'lucide-react'
import { Card, CardContent } from '@/shared/components/ui/card'

type AdminStatsProps = {
	stats: {
		totalQuests: number
		totalPoints: number
		avgRating: string
	}
}

export function AdminStats({ stats }: AdminStatsProps) {
	return (
		<div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground mb-1 text-sm">
								Всего квестов
							</p>
							<p className="text-foreground text-2xl font-bold">
								{stats.totalQuests}
							</p>
						</div>
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-950">
							<MapPin className="h-6 w-6 text-blue-600 dark:text-blue-400" />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground mb-1 text-sm">
								Контрольных точек
							</p>
							<p className="text-foreground text-2xl font-bold">
								{stats.totalPoints}
							</p>
						</div>
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-purple-100 dark:bg-purple-950">
							<QrCode className="h-6 w-6 text-purple-600 dark:text-purple-400" />
						</div>
					</div>
				</CardContent>
			</Card>

			<Card>
				<CardContent className="pt-6">
					<div className="flex items-center justify-between">
						<div>
							<p className="text-muted-foreground mb-1 text-sm">
								Средний рейтинг
							</p>
							<p className="text-foreground text-2xl font-bold">
								{stats.avgRating}
							</p>
						</div>
						<div className="flex h-12 w-12 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-950">
							<Sparkles className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
						</div>
					</div>
				</CardContent>
			</Card>
		</div>
	)
}
