export interface Location {
	name: string
	center: [number, number]
}

export interface Locations {
	[key: string]: Location
}

export const LOCATIONS: Locations = {
	ryazan: {
		name: 'Рязань',
		center: [54.63, 39.74]
	},
	ryazhsk: {
		name: 'Ряжск',
		center: [53.71, 40.06]
	},
	kasimov: {
		name: 'Касимов',
		center: [54.94, 41.4]
	},
	skopin: {
		name: 'Скопин',
		center: [53.82, 39.55]
	},
	sasovo: {
		name: 'Сасово',
		center: [54.35, 41.92]
	},
	korablino: {
		name: 'Кораблино',
		center: [53.92, 40.03]
	},
	mikhaylov: {
		name: 'Михайлов',
		center: [54.23, 39.03]
	},
	spassk_ryazansky: {
		name: 'Спасск-Рязанский',
		center: [54.41, 40.38]
	},
	shilovo: {
		name: 'Шилово',
		center: [54.32, 40.87]
	},
	novomichurinsk: {
		name: 'Новомичуринск',
		center: [54.03, 39.75]
	}
}
