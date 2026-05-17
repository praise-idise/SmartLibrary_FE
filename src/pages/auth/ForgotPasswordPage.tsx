import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from '@tanstack/react-router'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { isApiError } from '@/api/types'
import { BrandLogo } from '@/components/app/BrandLogo'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, toast } from '@/components/ui'
import { useAuth } from '@/hooks/use-auth'

const forgotPasswordSchema = z.object({
    email: z.string().email('Enter a valid email address.'),
})

type ForgotPasswordFormValues = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
    const { forgotPassword } = useAuth()
    const [submitted, setSubmitted] = useState(false)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
        watch,
    } = useForm<ForgotPasswordFormValues>({
        resolver: zodResolver(forgotPasswordSchema),
        defaultValues: {
            email: '',
        },
    })

    const email = watch('email')

    async function onSubmit(values: ForgotPasswordFormValues) {
        try {
            await forgotPassword(values)
            setSubmitted(true)
            toast.success('If this email exists, a reset link has been sent.')
        } catch (error) {
            if (isApiError(error)) {
                setError('root', { message: error.message || 'Unable to process your request right now.' })
                return
            }

            setError('root', { message: 'An unexpected error occurred. Please try again.' })
        }
    }

    if (submitted) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md border-primary/20">
                    <CardHeader>
                        <BrandLogo className="mb-4" imageClassName="h-8" subtitle={false} />
                        <CardTitle>Check Your Email</CardTitle>
                        <CardDescription>Password reset instructions have been sent.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            We sent a password reset link to <span className="font-semibold text-foreground">{email}</span>.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            If you do not see the message, check your spam folder and try again.
                        </p>
                        <Button variant="outline" className="w-full" onClick={() => setSubmitted(false)}>
                            Use a different email
                        </Button>
                        <Link to="/auth/login" className="block text-center text-sm text-primary hover:underline">
                            Back to sign in
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
            <Card className="w-full max-w-md border-primary/20">
                <CardHeader>
                    <BrandLogo className="mb-4" imageClassName="h-8" subtitle={false} />
                    <CardTitle>Forgot Password</CardTitle>
                    <CardDescription>Enter your email and we will send a reset link.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="email" required>
                                Email
                            </Label>
                            <Input id="email" type="email" placeholder="you@school.edu" error={Boolean(errors.email)} {...register('email')} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

                        {errors.root?.message && <p className="text-sm text-destructive">{errors.root.message}</p>}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Sending link...' : 'Send Reset Link'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <Link to="/auth/login" className="text-primary hover:underline">
                            Back to sign in
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}