import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import {
    AUTH_STATE_CHANGED_EVENT,
    clearAuthSession,
    getAccessToken,
    getAuthUser,
    setAuthSession,
    type AuthUser,
} from '@/auth/session'
import {
    changePassword as changePasswordRequest,
    forgotPassword as forgotPasswordRequest,
    login as loginRequest,
    logout as logoutRequest,
    register as registerRequest,
    resendVerification as resendVerificationRequest,
    resetPassword as resetPasswordRequest,
} from '@/services/auth.service'
import { APP_ROLES } from '@/auth/roles'
import type {
    ChangePasswordDTO,
    ForgotPasswordDTO,
    RegisterDTO,
    ResendVerificationDTO,
    ResendVerificationStatusDTO,
    ResetPasswordDTO,
} from '@/api/types'

interface AuthContextValue {
    user: AuthUser | null
    token: string | null
    isAuthenticated: boolean
    isAdmin: boolean
    isUser: boolean
    login: (payload: { email: string; password: string }) => Promise<void>
    register: (payload: RegisterDTO) => Promise<void>
    changePassword: (payload: ChangePasswordDTO) => Promise<void>
    forgotPassword: (payload: ForgotPasswordDTO) => Promise<void>
    resetPassword: (payload: ResetPasswordDTO) => Promise<void>
    resendVerification: (payload: ResendVerificationDTO) => Promise<ResendVerificationStatusDTO>
    logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [token, setToken] = useState<string | null>(() => getAccessToken())
    const [user, setUser] = useState<AuthUser | null>(() => getAuthUser())

    useEffect(() => {
        function syncAuthState() {
            setToken(getAccessToken())
            setUser(getAuthUser())
        }

        window.addEventListener(AUTH_STATE_CHANGED_EVENT, syncAuthState)
        window.addEventListener('storage', syncAuthState)

        return () => {
            window.removeEventListener(AUTH_STATE_CHANGED_EVENT, syncAuthState)
            window.removeEventListener('storage', syncAuthState)
        }
    }, [])

    async function login(payload: { email: string; password: string }) {
        const response = await loginRequest(payload)
        const data = response.data

        if (!data.token || !data.userId || !data.email) {
            throw new Error('Login response is missing required auth fields.')
        }

        const nextUser: AuthUser = {
            userId: data.userId,
            email: data.email,
            roles: data.roles ?? [],
        }

        setAuthSession(data.token, nextUser)
        setToken(data.token)
        setUser(nextUser)
    }

    async function register(payload: RegisterDTO) {
        await registerRequest(payload)
    }

    async function changePassword(payload: ChangePasswordDTO) {
        await changePasswordRequest(payload)
    }

    async function forgotPassword(payload: ForgotPasswordDTO) {
        await forgotPasswordRequest(payload)
    }

    async function resetPassword(payload: ResetPasswordDTO) {
        await resetPasswordRequest(payload)
    }

    async function resendVerification(payload: ResendVerificationDTO) {
        const response = await resendVerificationRequest(payload)
        return response.data
    }

    function logout() {
        const logoutRequestPromise = logoutRequest().catch(() => {
            // Local logout should not depend on the API being reachable.
        })

        clearAuthSession()
        setToken(null)
        setUser(null)

        void logoutRequestPromise
        return Promise.resolve()
    }

    const value = useMemo(
        () => ({
            user,
            token,
            isAuthenticated: Boolean(token),
            isAdmin: (user?.roles ?? []).includes(APP_ROLES.ADMIN),
            isUser: (user?.roles ?? []).includes(APP_ROLES.USER),
            login,
            register,
            changePassword,
            forgotPassword,
            resetPassword,
            resendVerification,
            logout,
        }),
        [user, token],
    )

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider.')
    }
    return context
}
