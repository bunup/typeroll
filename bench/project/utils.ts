import type { SortOrder, User } from './types'

export function isValidEmail(email: string): boolean {
	const emailRegex = /^[^s@]+@[^s@]+.[^s@]+$/
	return emailRegex.test(email)
}

export function formatDate(date: Date): string {
	return date.toISOString().split('T')[0]
}

export function generateId(): number {
	return Math.floor(Math.random() * 1000000) + 1
}

export function sortUsers(
	users: readonly User[],
	sortBy: keyof User,
	order: SortOrder,
): User[] {
	return [...users].sort((a, b) => {
		const aValue = a[sortBy]
		const bValue = b[sortBy]

		let comparison = 0
		if (aValue < bValue) {
			comparison = -1
		} else if (aValue > bValue) {
			comparison = 1
		}

		return order === 'desc' ? -comparison : comparison
	})
}

export function filterUsersByStatus(
	users: readonly User[],
	status: string,
): User[] {
	return users.filter((user) => {
		if (status === 'active') return user.isActive
		if (status === 'inactive') return !user.isActive
		return true
	})
}

export function paginateArray<T>(
	array: readonly T[],
	page: number,
	limit: number,
): {
	readonly data: T[]
	readonly pagination: {
		readonly page: number
		readonly limit: number
		readonly total: number
		readonly totalPages: number
	}
} {
	const startIndex = (page - 1) * limit
	const endIndex = startIndex + limit
	const data = array.slice(startIndex, endIndex)

	return {
		data,
		pagination: {
			page,
			limit,
			total: array.length,
			totalPages: Math.ceil(array.length / limit),
		},
	}
}

export function validateUserData(data: {
	readonly name?: string
	readonly email?: string
}): {
	readonly isValid: boolean
	readonly errors: readonly string[]
} {
	const errors: string[] = []

	if (data.name && data.name.trim().length < 2) {
		errors.push('Name must be at least 2 characters long')
	}

	if (data.email && !isValidEmail(data.email)) {
		errors.push('Invalid email format')
	}

	return {
		isValid: errors.length === 0,
		errors,
	}
}
