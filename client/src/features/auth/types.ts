export type UserRole = 'Admin' | 'Inspector'

export type LoginBody = {
    email: string
    password: string
}

export type AuthUser = {
    id: string
    username: string
    email: string
    role: UserRole
}

export type LoginResponse = {
    message: string
    token: string
    user: AuthUser
}

export type RegisterBody = {
    username: string
    email: string
    password: string
    role?: UserRole
}

export type RegisterResponse = {
    message: string
    userId: string
}

export type ChangePasswordBody = {
    currentPassword: string
    newPassword: string
}

export type ChangePasswordResponse = {
    message: string
}
