import {
	DatabaseError,
	createUser,
	deleteUser,
	findAllUsers,
	findUserById,
	updateUser,
} from './database'
import type {
	ApiResponse,
	CreateUserRequest,
	PaginatedResponse,
	QueryOptions,
	UpdateUserRequest,
	User,
} from './types'
import {
	filterUsersByStatus,
	paginateArray,
	sortUsers,
	validateUserData,
} from './utils'

export class ValidationError extends Error {
	public readonly errors: readonly string[]

	constructor(errors: readonly string[]) {
		super(`Validation failed: ${errors.join(', ')}`)
		this.name = 'ValidationError'
		this.errors = errors
	}
}

export class NotFoundError extends Error {
	public readonly resourceType: string
	public readonly resourceId: string | number

	constructor(resourceType: string, resourceId: string | number) {
		super(`${resourceType} with id ${resourceId} not found`)
		this.name = 'NotFoundError'
		this.resourceType = resourceType
		this.resourceId = resourceId
	}
}

export async function getUserById(id: number): Promise<ApiResponse<User>> {
	try {
		const user = await findUserById(id)

		if (!user) {
			throw new NotFoundError('User', id)
		}

		return {
			data: user,
			status: 200,
			message: 'User retrieved successfully',
			timestamp: new Date(),
		}
	} catch (error) {
		if (error instanceof NotFoundError) {
			return {
				data: {} as User,
				status: 404,
				message: error.message,
				timestamp: new Date(),
			}
		}

		throw error
	}
}

export async function getAllUsers(
	options: QueryOptions = {},
): Promise<PaginatedResponse<User>> {
	let users = await findAllUsers()
	if (options.status) {
		users = filterUsersByStatus(users, options.status)
	}

	if (options.sortBy) {
		users = sortUsers(users, options.sortBy, options.sortOrder || 'asc')
	}

	const page = options.page || 1
	const limit = options.limit || 10
	const paginatedResult = paginateArray(users, page, limit)

	return {
		data: paginatedResult.data,
		status: 200,
		message: 'Users retrieved successfully',
		timestamp: new Date(),
		pagination: paginatedResult.pagination,
	}
}

export async function createNewUser(
	userData: CreateUserRequest,
): Promise<ApiResponse<User>> {
	try {
		const validation = validateUserData(userData)
		if (!validation.isValid) {
			throw new ValidationError(validation.errors)
		}

		const user = await createUser(userData)

		return {
			data: user,
			status: 201,
			message: 'User created successfully',
			timestamp: new Date(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			return {
				data: {} as User,
				status: 400,
				message: error.message,
				timestamp: new Date(),
			}
		}

		if (error instanceof DatabaseError && error.code === 'DUPLICATE_EMAIL') {
			return {
				data: {} as User,
				status: 409,
				message: error.message,
				timestamp: new Date(),
			}
		}

		throw error
	}
}

export async function updateExistingUser(
	id: number,
	updates: UpdateUserRequest,
): Promise<ApiResponse<User>> {
	try {
		const validation = validateUserData(updates)
		if (!validation.isValid) {
			throw new ValidationError(validation.errors)
		}

		const user = await updateUser(id, updates)

		if (!user) {
			throw new NotFoundError('User', id)
		}

		return {
			data: user,
			status: 200,
			message: 'User updated successfully',
			timestamp: new Date(),
		}
	} catch (error) {
		if (error instanceof ValidationError) {
			return {
				data: {} as User,
				status: 400,
				message: error.message,
				timestamp: new Date(),
			}
		}

		if (error instanceof NotFoundError) {
			return {
				data: {} as User,
				status: 404,
				message: error.message,
				timestamp: new Date(),
			}
		}

		if (error instanceof DatabaseError && error.code === 'DUPLICATE_EMAIL') {
			return {
				data: {} as User,
				status: 409,
				message: error.message,
				timestamp: new Date(),
			}
		}

		throw error
	}
}

export async function removeUser(
	id: number,
): Promise<ApiResponse<{ readonly success: boolean }>> {
	try {
		const success = await deleteUser(id)

		if (!success) {
			throw new NotFoundError('User', id)
		}

		return {
			data: { success: true },
			status: 200,
			message: 'User deleted successfully',
			timestamp: new Date(),
		}
	} catch (error) {
		if (error instanceof NotFoundError) {
			return {
				data: { success: false },
				status: 404,
				message: error.message,
				timestamp: new Date(),
			}
		}

		throw error
	}
}
