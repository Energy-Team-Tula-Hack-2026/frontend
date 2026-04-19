import { Loader2, Pencil } from 'lucide-react'
import { Badge } from '@/shared/components/ui/badge'
import { Button } from '@/shared/components/ui/button'
import { Card, CardContent } from '@/shared/components/ui/card'
import {
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableHeader,
	TableRow
} from '@/shared/components/ui/table'
import type { UiQuest } from './model'

type QuestsTableProps = {
	quests: UiQuest[]
	isLoadingQuests: boolean
	onEditQuest: (quest: UiQuest) => void
	onOpenPoints: (quest: UiQuest) => void
}

function getDifficultyClass(difficulty: UiQuest['difficulty']) {
	if (difficulty === 'easy') return 'bg-green-50 text-green-700'
	if (difficulty === 'medium') return 'bg-yellow-50 text-yellow-700'
	return 'bg-red-50 text-red-700'
}

function getDifficultyLabel(difficulty: UiQuest['difficulty']) {
	if (difficulty === 'easy') return 'Легко'
	if (difficulty === 'medium') return 'Средне'
	return 'Сложно'
}

export function QuestsTable({
	quests,
	isLoadingQuests,
	onEditQuest,
	onOpenPoints
}: QuestsTableProps) {
	return (
		<Card>
			<CardContent className="overflow-x-auto p-0">
				{isLoadingQuests ? (
					<div className="flex justify-center py-12">
						<Loader2 className="h-8 w-8 animate-spin" />
					</div>
				) : quests.length === 0 ? (
					<div className="text-muted-foreground py-12 text-center">
						Нет маршрутов
					</div>
				) : (
					<div className="min-w-[800px]">
						<Table>
							<TableHeader>
								<TableRow>
									<TableHead className="w-[250px]">
										Название
									</TableHead>
									<TableHead>Категория</TableHead>
									<TableHead>Сложность</TableHead>
									<TableHead>Точек</TableHead>
									<TableHead>Рейтинг</TableHead>
									<TableHead className="text-right">
										Действия
									</TableHead>
								</TableRow>
							</TableHeader>

							<TableBody>
								{quests.map((quest) => (
									<TableRow key={quest.id}>
										<TableCell className="font-medium">
											<div className="flex items-center space-x-3">
												{quest.images[0] ? (
													<img
														src={quest.images[0]}
														className="h-10 w-10 flex-shrink-0 rounded object-cover"
														alt=""
													/>
												) : (
													<div className="bg-muted h-10 w-10 flex-shrink-0 rounded" />
												)}
												<span className="break-words">
													{quest.title}
												</span>
											</div>
										</TableCell>
										<TableCell>{quest.category}</TableCell>
										<TableCell>
											<Badge
												variant="outline"
												className={getDifficultyClass(
													quest.difficulty
												)}
											>
												{getDifficultyLabel(
													quest.difficulty
												)}
											</Badge>
										</TableCell>
										<TableCell>
											<Button
												variant="ghost"
												size="sm"
												onClick={() =>
													onOpenPoints(quest)
												}
											>
												{quest.checkpointsCount} точек
											</Button>
										</TableCell>
										<TableCell>
											{quest.rating} ({quest.reviewsCount}
											)
										</TableCell>
										<TableCell className="text-right">
											<div className="flex justify-end space-x-1">
												<Button
													variant="ghost"
													size="sm"
													onClick={() =>
														onEditQuest(quest)
													}
												>
													<Pencil className="h-4 w-4" />
												</Button>
											</div>
										</TableCell>
									</TableRow>
								))}
							</TableBody>
						</Table>
					</div>
				)}
			</CardContent>
		</Card>
	)
}
