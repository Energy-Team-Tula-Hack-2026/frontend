'use client'

import { YMaps, Map, Placemark } from '@iminside/react-yandex-maps'
import { Building2 } from 'lucide-react'

import { ApiQuest } from '@/shared'
import { LOCATIONS } from './values'

interface MapViewProps {
	quest: ApiQuest
}

function getQuestCoordinates(quest: ApiQuest): [number, number] {
	const latitude = quest.location?.latitude
	const longitude = quest.location?.longitude

	if (
		typeof latitude === 'number' &&
		typeof longitude === 'number' &&
		Number.isFinite(latitude) &&
		Number.isFinite(longitude)
	) {
		return [latitude, longitude]
	}

	return LOCATIONS['ryazan'].center
}

export function MapView({ quest }: MapViewProps) {
	const mapCenter = getQuestCoordinates(quest)
	const locationTitle =
		quest.location?.city_name || quest.location?.region_name
			? [quest.location?.city_name, quest.location?.region_name]
					.filter(Boolean)
					.join(', ')
			: 'Место прохождения квеста'

	return (
		<YMaps
			query={{
				lang: 'ru_RU',
				apikey: '1ac61b8a-843f-454f-abd8-a651a3c60f00',
				load: 'package.full'
			}}
		>
			<section className="relative h-85 overflow-hidden rounded-xl sm:h-105">
				<div className="bg-background/95 absolute bottom-4 left-1/2 z-10 max-w-md -translate-x-1/2 rounded-lg border px-4 py-2 shadow-sm backdrop-blur">
					<div className="flex items-center justify-center gap-2 text-center">
						<Building2 className="size-4 shrink-0 text-amber-600" />
						<div className="min-w-0">
							<p className="truncate text-sm font-semibold">
								{quest.name}
							</p>
							<p className="text-muted-foreground truncate text-xs">
								{locationTitle}
							</p>
						</div>
					</div>
				</div>

				<Map
					defaultState={{
						center: mapCenter,
						zoom: 15
					}}
					state={{ center: mapCenter, zoom: 15 }}
					className="no-ymaps-copyright h-full w-full"
				>
					<Placemark
						geometry={mapCenter}
						properties={{
							hintContent: quest.name,
							balloonContentHeader: quest.name,
							balloonContentBody: locationTitle
						}}
						options={{
							iconLayout: 'default#image',
							iconImageHref: '/icon-location-current.svg',
							iconImageSize: [48, 48],
							iconImageOffset: [-24, -48]
						}}
					/>
				</Map>
			</section>
		</YMaps>
	)
}
