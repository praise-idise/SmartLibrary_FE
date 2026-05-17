import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useSearch } from '@tanstack/react-router'
import { AlertCircle, CheckCircle, Loader } from 'lucide-react'
import { formatCooldown, useResendVerificationCooldown } from '@/auth/use-resend-verification-cooldown'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, toast } from '@/components/ui'
import { getApiErrorMessage, isApiError } from '@/api/types'
import { BrandLogo } from '@/components/app/BrandLogo'
import { useAuth } from '@/hooks/use-auth'
import { verifyEmail } from '@/services/auth.service'

export function VerifyEmailPage() {
    const { email, token } = useSearch({ from: '/verify-email' })
    const navigate = useNavigate()
    const { resendVerification } = useAuth()
    const hasRequestedVerification = useRef(false)
    const { remainingSeconds, isCoolingDown, applyCooldown } = useResendVerificationCooldown(email)

    const [status, setStatus] = useState<'loading' | 'success' | 'error' | 'resending' | 'ready-to-resend'>('loading')
    const [errorMessage, setErrorMessage] = useState<string | null>(null)

    useEffect(() => {
        if (email && !token) {
            setStatus('ready-to-resend')
            setErrorMessage(null)
            return
        }

        if (!email || !token) {
            setStatus('error')
            setErrorMessage('Invalid or missing verification link.')
            return
        }

        if (hasRequestedVerification.current) {
            return
        }

        hasRequestedVerification.current = true

        verifyEmail(email, token)
            .then(() => {
                setStatus('success')
            })
            .catch((error) => {
                if (isApiError(error)) {
                    if (error.statusCode === 409 && error.message === 'Email is already verified') {
                        setStatus('success')
                        setErrorMessage(null)
                        return
                    }

                    setErrorMessage(error.message || 'Email verification failed.')
                } else {
                    setErrorMessage('An unexpected error occurred.')
                }
                setStatus('error')
            })
    }, [email, token])

    async function handleResendVerification() {
        if (!email) return
        if (isCoolingDown) {
            toast.info(`Resend in ${formatCooldown(remainingSeconds)}.`)
            return
        }

        setStatus('resending')
        setErrorMessage(null)
        try {
            const resendStatus = await resendVerification({ email })
            applyCooldown(resendStatus, email)
            setStatus('ready-to-resend')
            toast.success('A new verification link has been sent.')
        } catch (error) {
            setErrorMessage(getApiErrorMessage(error, 'Failed to resend verification email.'))
            setStatus('ready-to-resend')
        }
    }

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md border-primary/20">
                    <CardHeader>
                        <BrandLogo className="mb-4" imageClassName="h-8" subtitle={false} />
                        <CardTitle>Verifying Email</CardTitle>
                        <CardDescription>Please wait while we verify your email address.</CardDescription>
                    </CardHeader>
                    <CardContent className="flex justify-center">
                        <Loader className="size-8 text-primary animate-spin" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (status === 'success') {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md border-primary/20">
                    <CardHeader>
                        <BrandLogo className="mb-4" imageClassName="h-8" subtitle={false} />
                        <div className="mb-4 flex justify-center">
                            <CheckCircle className="size-12 text-success" />
                        </div>
                        <CardTitle>Email Verified</CardTitle>
                        <CardDescription>Your account is now active.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            You can now sign in and start borrowing or managing books.
                        </p>
                        <Button className="w-full" onClick={() => navigate({ to: '/auth/login' })}>
                            Go to Sign In
                        </Button>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const isResendMode = status === 'ready-to-resend' || status === 'resending'

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-primary/20">
                <CardHeader>
                    <BrandLogo className="mb-4" imageClassName="h-8" subtitle={false} />
                    <div className="mb-4 flex justify-center">
                        <AlertCircle className="size-12 text-destructive" />
                    </div>
                    <CardTitle>{isResendMode ? 'Resend Verification Email' : 'Verification Failed'}</CardTitle>
                    <CardDescription>
                        {isResendMode ? 'Request a new verification link for your account.' : 'We could not verify your email with this link.'}
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground">
                        {isResendMode
                            ? errorMessage || 'Your previous link may have expired. Request a new one below.'
                            : errorMessage || 'The verification link is invalid or expired.'}
                    </p>

                    {email && isResendMode && (
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={handleResendVerification}
                            disabled={status === 'resending' || isCoolingDown}
                        >
                            {status === 'resending'
                                ? 'Sending...'
                                : isCoolingDown
                                    ? `Resend in ${formatCooldown(remainingSeconds)}`
                                    : `Resend link to ${email}`}
                        </Button>
                    )}

                    <Link
                        to="/auth/register"
                        className="inline-flex h-10 w-full items-center justify-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-muted"
                    >
                        Create new account
                    </Link>

                    <Link to="/auth/login" className="block text-center text-sm text-primary hover:underline">
                        Back to sign in
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
}
