import { api } from '../../services/api'
import type {
    ChangePasswordBody,
    ChangePasswordResponse,
    LoginBody,
    LoginResponse,
    RegisterBody,
    RegisterResponse,
} from './types'

export async function login(body: LoginBody): Promise<LoginResponse> {
    const res = await api.post<LoginResponse>('/auth/login', body)
    return res.data
}

export async function register(body: RegisterBody): Promise<RegisterResponse> {
    const res = await api.post<RegisterResponse>('/auth/register', body)
    return res.data
}

export async function changePassword(
    body: ChangePasswordBody
): Promise<ChangePasswordResponse> {
    const res = await api.post<ChangePasswordResponse>('/auth/change-password', body)
    return res.data
}
