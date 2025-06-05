export type {
	User,
	Role,
	Permission,
	ApiResponse,
	PaginatedResponse,
	UserStatus,
	SortOrder,
	QueryOptions,
	CreateUserRequest,
	UpdateUserRequest,
} from './types'

export {
	isValidEmail,
	formatDate,
	generateId,
	sortUsers,
	filterUsersByStatus,
	paginateArray,
	validateUserData,
} from './utils'

export {
	DatabaseError,
	findUserById,
	findAllUsers,
	createUser,
	updateUser,
	deleteUser,
	findRoleById,
	findAllRoles,
} from './database'

export {
	ValidationError,
	NotFoundError,
	getUserById,
	getAllUsers,
	createNewUser,
	updateExistingUser,
	removeUser,
} from './service'

import * as Database from './database'
import * as UserManagement from './service'
import * as Types from './types'
import * as Utils from './utils'

export { UserManagement, Database, Utils, Types }

const api: {
	getUserById: typeof UserManagement.getUserById
	getAllUsers: typeof UserManagement.getAllUsers
	createNewUser: typeof UserManagement.createNewUser
	updateExistingUser: typeof UserManagement.updateExistingUser
	removeUser: typeof UserManagement.removeUser
} = {
	getUserById: UserManagement.getUserById,
	getAllUsers: UserManagement.getAllUsers,
	createNewUser: UserManagement.createNewUser,
	updateExistingUser: UserManagement.updateExistingUser,
	removeUser: UserManagement.removeUser,
} as const

export default api
