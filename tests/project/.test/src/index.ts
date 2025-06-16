type User = {
	camelCase: string
}

function getUser(): User {
	return {
		camelCase: 'camelCase',
	}
}

export type GetUserReturnType = Omit<ReturnType<typeof getUser>, 'camelCase'>
