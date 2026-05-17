import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { formatCooldown, useResendVerificationCooldown } from '@/auth/use-resend-verification-cooldown'
import { getAuthUser } from '@/auth/session'
import { getApiErrorMessage, isApiError } from '@/api/types'
import { BrandLogo } from '@/components/app/BrandLogo'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, toast } from '@/components/ui'
import { useAuth } from '@/hooks/use-auth'

const loginSchema = z.object({
    email: z.string().email('Enter a valid email address.'),
    password: z.string().min(1, 'Password is required.'),
})

type LoginFormValues = z.infer<typeof loginSchema>

export function LoginPage() {
    const navigate = useNavigate()
    const { login, resendVerification } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [unverifiedEmail, setUnverifiedEmail] = useState<string | null>(null)
    const [resendStatus, setResendStatus] = useState<'idle' | 'sending'>('idle')
    const { remainingSeconds, isCoolingDown, applyCooldown } = useResendVerificationCooldown(unverifiedEmail)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        clearErrors,
    } = useForm<LoginFormValues>({
        resolver: zodResolver(loginSchema),
        defaultValues: {
            email: '',
            password: '',
        },
    })

    async function onSubmit(values: LoginFormValues) {
        setUnverifiedEmail(null)
        setResendStatus('idle')
        clearErrors('root')

        try {
            await login(values)
            const authUser = getAuthUser()
            const isAdmin = authUser?.roles?.includes('ADMIN') ?? false
            navigate({ to: isAdmin ? '/app/admin' : '/app/dashboard' })
        } catch (error) {
            if (isApiError(error)) {
                const isUnverified =
                    error.statusCode === 401 &&
                    error.message.toLowerCase().includes('not verified')

                if (isUnverified) {
                    setUnverifiedEmail(values.email)
                }

                setError('root', { message: error.message })
                return
            }

            setError('root', { message: 'Unable to sign in right now. Please try again.' })
        }
    }

    async function handleResend() {
        if (!unverifiedEmail) return
        if (isCoolingDown) {
            toast.info(`Resend in ${formatCooldown(remainingSeconds)}.`)
            return
        }

        setResendStatus('sending')
        try {
            const status = await resendVerification({ email: unverifiedEmail })
            applyCooldown(status, unverifiedEmail)
            setResendStatus('idle')
            toast.success('A new verification link has been sent to your email.')
        } catch (error) {
            setResendStatus('idle')
            toast.error(getApiErrorMessage(error, 'Unable to resend verification link.'))
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-primary/20">
                <CardHeader>
                    <BrandLogo className="mb-4" imageClassName="h-8" subtitle={false} />
                    <CardTitle>Sign In</CardTitle>
                    <CardDescription>Welcome back. Sign in to continue borrowing and managing books.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" required>
                                Email
                            </Label>
                            <Input
                                id="email"
                                type="email"
                                placeholder="you@school.edu"
                                error={Boolean(errors.email)}
                                {...register('email')}
                            />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password" required>
                                    Password
                                </Label>
                                <Link to="/auth/forgot-password" className="text-xs text-primary hover:underline">
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="Enter your password"
                                    error={Boolean(errors.password)}
                                    className="pr-10"
                                    {...register('password')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((value) => !value)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
                        </div>

                        {errors.root?.message && (
                            <div className="space-y-2">
                                <p className="text-sm text-destructive">{errors.root.message}</p>
                                {unverifiedEmail && (
                                    <p className="text-xs text-muted-foreground">
                                        Need a new verification link?{' '}
                                        <button
                                            type="button"
                                            onClick={handleResend}
                                            disabled={resendStatus === 'sending' || isCoolingDown}
                                            className="font-medium text-primary hover:underline disabled:opacity-60"
                                        >
                                            {resendStatus === 'sending'
                                                ? 'Sending...'
                                                : isCoolingDown
                                                    ? `Resend in ${formatCooldown(remainingSeconds)}`
                                                    : 'Resend link'}
                                        </button>
                                    </p>
                                )}
                            </div>
                        )}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Signing in...' : 'Sign In'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-muted-foreground">
                            New to SmartLibrary?{' '}
                            <Link to="/auth/register" className="text-primary hover:underline font-medium">
                                Create account
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
