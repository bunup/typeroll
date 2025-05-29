import type { User, UserRole } from '../types'

export class UserService {
	getUser(id: number): User | null {
		return null
	}

	hasRole(user: User, role: UserRole): boolean {
		return true
	}
}
