export interface User {
	readonly id: number
	readonly name: string
	readonly email: string
	readonly isActive: boolean
	readonly roles: readonly Role[]
	readonly createdAt: Date
	readonly updatedAt: Date
}

export interface Role {
	readonly id: number
	readonly name: string
	readonly permissions: readonly Permission[]
}

export interface Permission {
	readonly id: number
	readonly name: string
	readonly resource: string
	readonly action: string
}

export interface ApiResponse<T> {
	readonly data: T
	readonly status: number
	readonly message: string
	readonly timestamp: Date
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
	readonly pagination: {
		readonly page: number
		readonly limit: number
		readonly total: number
		readonly totalPages: number
	}
}

export type UserStatus = 'active' | 'inactive' | 'pending' | 'suspended'

export type SortOrder = 'asc' | 'desc'

export interface QueryOptions {
	readonly page?: number
	readonly limit?: number
	readonly sortBy?: keyof User
	readonly sortOrder?: SortOrder
	readonly status?: UserStatus
}

export interface CreateUserRequest {
	readonly name: string
	readonly email: string
	readonly roleIds: readonly number[]
}

export interface UpdateUserRequest {
	readonly name?: string
	readonly email?: string
	readonly isActive?: boolean
	readonly roleIds?: readonly number[]
}
