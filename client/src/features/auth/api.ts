import { api } from '../../services/api'
import type {
    ChangePasswordBody,
    ChangePasswordResponse,
    ForgotPasswordBody,
    ForgotPasswordResponse,
    LoginBody,
    LoginResponse,
    RegisterBody,
    RegisterResponse,
    ResetPasswordBody,
    ResetPasswordResponse,
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

export async function forgotPassword(
    body: ForgotPasswordBody
): Promise<ForgotPasswordResponse> {
    const res = await api.post<ForgotPasswordResponse>('/auth/forgot-password', body)
    return res.data
}

export async function resetPassword(
    body: ResetPasswordBody
): Promise<ResetPasswordResponse> {
    const res = await api.post<ResetPasswordResponse>('/auth/reset-password', body)
    return res.data
}
