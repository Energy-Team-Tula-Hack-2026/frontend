export const PLATFORM_ROLE = {
	VISITOR: 'visitor',
	SELLER_IP: 'seller_ip',
	SELLER_ORG: 'seller_org',
	PLATFORM_ADMIN: 'platform_admin',
	LEGACY_USER: 'user',
	LEGACY_ADMIN: 'admin'
} as const

export type PlatformRole = (typeof PLATFORM_ROLE)[keyof typeof PLATFORM_ROLE]

export function isPlatformAdmin(role?: string | null): boolean {
	return (
		role === PLATFORM_ROLE.PLATFORM_ADMIN ||
		role === PLATFORM_ROLE.LEGACY_ADMIN
	)
}

export function getRoleLabel(role?: string | null): string {
	switch (role) {
		case PLATFORM_ROLE.PLATFORM_ADMIN:
		case PLATFORM_ROLE.LEGACY_ADMIN:
			return 'Администратор платформы'
		case PLATFORM_ROLE.SELLER_ORG:
			return 'Продавец (организация)'
		case PLATFORM_ROLE.SELLER_IP:
			return 'Продавец (ИП)'
		case PLATFORM_ROLE.VISITOR:
		case PLATFORM_ROLE.LEGACY_USER:
			return 'Посетитель'
		default:
			return 'Пользователь'
	}
}
