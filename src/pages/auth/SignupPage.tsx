import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Eye, EyeOff } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { isApiError } from '@/api/types'
import { BrandLogo } from '@/components/app/BrandLogo'
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, toast } from '@/components/ui'
import { useAuth } from '@/hooks/use-auth'

const signupSchema = z.object({
    firstName: z.string().trim().min(1, 'First name is required.'),
    lastName: z.string().trim().min(1, 'Last name is required.'),
    email: z.string().email('Enter a valid email address.'),
    phoneNumber: z
        .string()
        .trim()
        .regex(/^\+[1-9]\d{7,14}$/, 'Use international format (example: +2348012345678).'),
    password: z.string()
        .min(8, 'Password must be at least 8 characters.')
        .regex(/[A-Z]/, 'Password must include an uppercase letter.')
        .regex(/[a-z]/, 'Password must include a lowercase letter.')
        .regex(/[0-9]/, 'Password must include a number.'),
    confirmPassword: z.string(),
}).refine((values) => values.password === values.confirmPassword, {
    message: 'Passwords do not match.',
    path: ['confirmPassword'],
})

type SignupFormValues = z.infer<typeof signupSchema>

export function SignupPage() {
    const navigate = useNavigate()
    const { register: registerUser } = useAuth()
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [submittedEmail, setSubmittedEmail] = useState<string | null>(null)

    const {
        register,
        handleSubmit,
        formState: { errors, isSubmitting },
        setError,
    } = useForm<SignupFormValues>({
        resolver: zodResolver(signupSchema),
        defaultValues: {
            firstName: '',
            lastName: '',
            email: '',
            phoneNumber: '',
            password: '',
            confirmPassword: '',
        },
    })

    async function onSubmit(values: SignupFormValues) {
        try {
            await registerUser({
                firstName: values.firstName,
                lastName: values.lastName,
                email: values.email,
                phoneNumber: values.phoneNumber,
                password: values.password,
            })

            setSubmittedEmail(values.email)
            toast.success('Account created. Please check your email to verify your account.')
        } catch (error) {
            if (isApiError(error)) {
                setError('root', { message: error.message || 'Unable to create account right now.' })
                return
            }

            setError('root', { message: 'An unexpected error occurred while creating your account.' })
        }
    }

    if (submittedEmail) {
        return (
            <div className="min-h-screen flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8">
                <Card className="w-full max-w-md border-primary/20">
                    <CardHeader>
                        <BrandLogo className="mb-4" imageClassName="h-8" subtitle={false} />
                        <CardTitle>Verify Your Email</CardTitle>
                        <CardDescription>Your account was created successfully.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <p className="text-sm text-muted-foreground">
                            We sent a verification link to <span className="font-semibold text-foreground">{submittedEmail}</span>.
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Open your inbox and click the link to activate your account.
                        </p>
                        <Button className="w-full" onClick={() => navigate({ to: '/auth/login' })}>
                            Back to Sign In
                        </Button>
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
                    <CardTitle>Create Account</CardTitle>
                    <CardDescription>Join SmartLibrary to request and manage books online.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label htmlFor="firstName" required>
                                    First Name
                                </Label>
                                <Input id="firstName" placeholder="Ada" error={Boolean(errors.firstName)} {...register('firstName')} />
                                {errors.firstName && <p className="text-xs text-destructive">{errors.firstName.message}</p>}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="lastName" required>
                                    Last Name
                                </Label>
                                <Input id="lastName" placeholder="Lovelace" error={Boolean(errors.lastName)} {...register('lastName')} />
                                {errors.lastName && <p className="text-xs text-destructive">{errors.lastName.message}</p>}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" required>
                                Email
                            </Label>
                            <Input id="email" type="email" placeholder="you@school.edu" error={Boolean(errors.email)} {...register('email')} />
                            {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phoneNumber" required>
                                Phone Number
                            </Label>
                            <Input
                                id="phoneNumber"
                                type="tel"
                                placeholder="+2348012345678"
                                error={Boolean(errors.phoneNumber)}
                                {...register('phoneNumber')}
                            />
                            {errors.phoneNumber && <p className="text-xs text-destructive">{errors.phoneNumber.message}</p>}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" required>
                                Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="At least 8 characters"
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

                        <div className="space-y-2">
                            <Label htmlFor="confirmPassword" required>
                                Confirm Password
                            </Label>
                            <div className="relative">
                                <Input
                                    id="confirmPassword"
                                    type={showConfirmPassword ? 'text' : 'password'}
                                    placeholder="Re-enter your password"
                                    error={Boolean(errors.confirmPassword)}
                                    className="pr-10"
                                    {...register('confirmPassword')}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirmPassword((value) => !value)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                    aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                                >
                                    {showConfirmPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                                </button>
                            </div>
                            {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
                        </div>

                        {errors.root?.message && <p className="text-sm text-destructive">{errors.root.message}</p>}

                        <Button type="submit" className="w-full" disabled={isSubmitting}>
                            {isSubmitting ? 'Creating account...' : 'Create Account'}
                        </Button>
                    </form>

                    <div className="mt-6 text-center text-sm">
                        <p className="text-muted-foreground">
                            Already have an account?{' '}
                            <Link to="/auth/login" className="text-primary hover:underline font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}