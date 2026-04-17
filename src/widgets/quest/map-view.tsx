'use client'

import { ApiPoint, ApiQuest } from '@/shared'
import { YMaps, Map, Placemark } from '@iminside/react-yandex-maps'
import { useState } from 'react'
import { LOCATIONS } from './values'
import { Button } from '@/shared/components/ui/button'

interface MapViewProps {
	quest: ApiQuest
	points?: ApiPoint[]
	currentPoint?: ApiPoint | null
}

export function MapView({ quest, points, currentPoint }: MapViewProps) {
	const [currentLocation, setCurrentLocation] = useState<string | null>(null)

	const displayedPoints = points ?? quest.points

	const mapCenter: [number, number] = currentLocation
		? LOCATIONS[currentLocation].center
		: currentPoint
			? [currentPoint.latitude, currentPoint.longitude]
			: displayedPoints[0]
				? [displayedPoints[0].latitude, displayedPoints[0].longitude]
				: LOCATIONS['ryazan'].center

	return (
		<YMaps
			query={{
				lang: 'ru_RU',
				apikey: '1ac61b8a-843f-454f-abd8-a651a3c60f00',
				load: 'package.full'
			}}
		>
			<section className="h-110">
				{/* Location buttons */}
				<div className="scrollbar-hide flex flex-nowrap gap-x-2 overflow-x-auto px-3 py-3">
					{Object.keys(LOCATIONS).map((key) => {
						const isActive = currentLocation === key
						return (
							<Button
								key={key}
								onClick={() => setCurrentLocation(key)}
								variant={isActive ? 'default' : 'outline'}
								className="shrink-0"
							>
								{LOCATIONS[key].name}
							</Button>
						)
					})}
				</div>

				<Map
					defaultState={{
						center: mapCenter,
						zoom: 15
					}}
					state={{ center: mapCenter, zoom: 15 }}
					className="no-ymaps-copyright h-full w-full"
				>
					{/* All points with conditional icon */}
					{displayedPoints.map((point) => {
						const isCurrent = currentPoint?.id === point.id
						return (
							<Placemark
								key={point.id}
								geometry={[point.latitude, point.longitude]}
								properties={{
									hintContent: point.name
								}}
								options={{
									iconLayout: 'default#image',
									iconImageHref: isCurrent
										? '/icon-location-current.svg'
										: '/icon-location.svg',
									iconImageSize: isCurrent
										? [48, 48]
										: [32, 32]
								}}
							/>
						)
					})}
				</Map>
			</section>
		</YMaps>
	)
}
