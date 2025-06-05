import type { CreateUserRequest, Role, UpdateUserRequest, User } from './types'
import { generateId } from './utils'

const users: User[] = []
const roles: Role[] = [
	{
		id: 1,
		name: 'Admin',
		permissions: [
			{ id: 1, name: 'read_users', resource: 'users', action: 'read' },
			{ id: 2, name: 'write_users', resource: 'users', action: 'write' },
			{ id: 3, name: 'delete_users', resource: 'users', action: 'delete' },
		],
	},
	{
		id: 2,
		name: 'User',
		permissions: [
			{ id: 1, name: 'read_users', resource: 'users', action: 'read' },
		],
	},
]

export class DatabaseError extends Error {
	public readonly code: string

	constructor(message: string, code = 'DB_ERROR') {
		super(message)
		this.name = 'DatabaseError'
		this.code = code
	}
}

export async function findUserById(id: number): Promise<User | null> {
	return new Promise((resolve) => {
		setTimeout(() => {
			const user = users.find((u) => u.id === id) || null
			resolve(user)
		}, 10)
	})
}

export async function findAllUsers(): Promise<readonly User[]> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve([...users])
		}, 15)
	})
}

export async function createUser(userData: CreateUserRequest): Promise<User> {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const existingUser = users.find((u) => u.email === userData.email)
			if (existingUser) {
				reject(
					new DatabaseError(
						'User with this email already exists',
						'DUPLICATE_EMAIL',
					),
				)
				return
			}

			const userRoles = roles.filter((r) => userData.roleIds.includes(r.id))

			const newUser: User = {
				id: generateId(),
				name: userData.name,
				email: userData.email,
				isActive: true,
				roles: userRoles,
				createdAt: new Date(),
				updatedAt: new Date(),
			}

			users.push(newUser)
			resolve(newUser)
		}, 20)
	})
}

export async function updateUser(
	id: number,
	updates: UpdateUserRequest,
): Promise<User | null> {
	return new Promise((resolve, reject) => {
		setTimeout(() => {
			const userIndex = users.findIndex((u) => u.id === id)
			if (userIndex === -1) {
				resolve(null)
				return
			}

			if (updates.email) {
				const existingUser = users.find(
					(u) => u.email === updates.email && u.id !== id,
				)
				if (existingUser) {
					reject(
						new DatabaseError(
							'User with this email already exists',
							'DUPLICATE_EMAIL',
						),
					)
					return
				}
			}

			const currentUser = users[userIndex]
			const updatedRoles = currentUser.roles

			const updatedUser: User = {
				...currentUser,
				name: updates.name ?? currentUser.name,
				email: updates.email ?? currentUser.email,
				isActive: updates.isActive ?? currentUser.isActive,
				roles: updatedRoles,
				updatedAt: new Date(),
			}

			users[userIndex] = updatedUser
			resolve(updatedUser)
		}, 25)
	})
}

export async function deleteUser(id: number): Promise<boolean> {
	return new Promise((resolve) => {
		setTimeout(() => {
			const userIndex = users.findIndex((u) => u.id === id)
			if (userIndex === -1) {
				resolve(false)
				return
			}

			users.splice(userIndex, 1)
			resolve(true)
		}, 15)
	})
}

export async function findRoleById(id: number): Promise<Role | null> {
	return new Promise((resolve) => {
		setTimeout(() => {
			const role = roles.find((r) => r.id === id) || null
			resolve(role)
		}, 5)
	})
}

export async function findAllRoles(): Promise<readonly Role[]> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve([...roles])
		}, 10)
	})
}
