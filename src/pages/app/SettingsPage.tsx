import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { getApiErrorMessage } from "@/api/types";
import { Badge, Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, toast } from "@/components/ui";
import { useAuth } from "@/hooks/use-auth";

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required."),
  newPassword: z.string().min(8, "New password must be at least 8 characters."),
  confirmPassword: z.string().min(1, "Confirm your new password."),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords do not match.",
  path: ["confirmPassword"],
});

type PasswordFormValues = z.infer<typeof passwordSchema>;

export function SettingsPage() {
  const { user, changePassword } = useAuth();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordSchema),
    defaultValues: { currentPassword: "", newPassword: "", confirmPassword: "" },
  });

  async function onSubmit(values: PasswordFormValues) {
    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      reset();
      toast.success("Password changed successfully.");
    } catch (error) {
      toast.error(getApiErrorMessage(error, "Unable to change password."));
    }
  }

  return (
    <main className="space-y-6">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Manage your account details and security.</p>
      </header>

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Account</CardTitle>
          <CardDescription>Your account information.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <div className="flex gap-2">
            <span className="font-medium text-muted-foreground">Email:</span>
            <span>{user?.email ?? "-"}</span>
          </div>
          <div className="flex gap-2">
            <span className="font-medium text-muted-foreground">User ID:</span>
            <span className="font-mono text-xs">{user?.userId ?? "-"}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-muted-foreground">Roles:</span>
            <div className="flex gap-1">
              {(user?.roles ?? []).map((role) => (
                <Badge key={role} variant="outline">{role}</Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface/95">
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
          <CardDescription>Update your account password.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="max-w-md space-y-4">
            <div className="space-y-1">
              <Label htmlFor="currentPassword" required>Current Password</Label>
              <Input id="currentPassword" type="password" error={!!errors.currentPassword} {...register("currentPassword")} />
              {errors.currentPassword && <p className="text-xs text-destructive">{errors.currentPassword.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="newPassword" required>New Password</Label>
              <Input id="newPassword" type="password" error={!!errors.newPassword} {...register("newPassword")} />
              {errors.newPassword && <p className="text-xs text-destructive">{errors.newPassword.message}</p>}
            </div>
            <div className="space-y-1">
              <Label htmlFor="confirmPassword" required>Confirm New Password</Label>
              <Input id="confirmPassword" type="password" error={!!errors.confirmPassword} {...register("confirmPassword")} />
              {errors.confirmPassword && <p className="text-xs text-destructive">{errors.confirmPassword.message}</p>}
            </div>
            <Button type="submit" disabled={isSubmitting}>{isSubmitting ? "Changing..." : "Change Password"}</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  );
}
