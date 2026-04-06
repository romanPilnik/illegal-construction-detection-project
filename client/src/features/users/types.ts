export type UserRole = 'Admin' | 'Inspector'

export type UserListRow = {
    id: string
    username: string
    email: string
    role: UserRole
    is_active: boolean
}

export type UsersListMeta = {
    total: number
    page: number
    limit: number
    totalPages: number
    hasNextPage: boolean
}

export type UsersListResponse = {
    data: UserListRow[]
    meta: UsersListMeta
}

/** Shape of `GET /users/:id` — server does not include `is_active` on this endpoint. */
export type UserByIdData = {
    id: string
    username: string
    email: string
    role: UserRole
}

export type UserByIdResponse = {
    data: UserByIdData
}

export type UpdateUserBody = {
    username?: string
    email?: string
}

export type UpdateUserResponse = {
    message: string
    data: UserListRow
}

export type DeactivateUserResponse = {
    message: string
    data: UserListRow
}

export type GetUsersQuery = {
    page: number
    limit: number
    role?: UserRole
    search?: string
    /** Query string: `'0'` active only, `'1'` inactive only; omit to use server default (active-only). */
    isActiveFilter?: '0' | '1'
}
