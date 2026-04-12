import { api } from '../../services/api'
import type {
    CreateUserBody,
    CreateUserResponse,
    DeactivateUserResponse,
    GetUsersQuery,
    UpdateUserBody,
    UpdateUserResponse,
    UserByIdResponse,
    UsersListResponse,
} from './types'

export async function createUser(body: CreateUserBody): Promise<CreateUserResponse> {
    const res = await api.post<CreateUserResponse>('/users', body)
    return res.data
}

export async function getUsers(params: GetUsersQuery): Promise<UsersListResponse> {
    const res = await api.get<UsersListResponse>('/users', {
        params: {
            page: params.page,
            limit: params.limit,
            ...(params.role ? { role: params.role } : {}),
            ...(params.search ? { search: params.search } : {}),
            ...(params.isActiveFilter !== undefined
                ? { isActiveFilter: params.isActiveFilter }
                : {}),
        },
    })
    return res.data
}

export async function getUserById(id: string): Promise<UserByIdResponse> {
    const res = await api.get<UserByIdResponse>(`/users/${id}`)
    return res.data
}

export async function updateUser(
    id: string,
    body: UpdateUserBody
): Promise<UpdateUserResponse> {
    const res = await api.put<UpdateUserResponse>(`/users/${id}`, body)
    return res.data
}

export async function deactivateUser(id: string): Promise<DeactivateUserResponse> {
    const res = await api.delete<DeactivateUserResponse>(`/users/${id}`)
    return res.data
}
