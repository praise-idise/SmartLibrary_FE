import { cn } from "@/lib/cn";

type BrandLogoProps = {
    className?: string;
    imageClassName?: string;
    titleClassName?: string;
    subtitleClassName?: string;
    subtitle?: boolean;
};

export function BrandLogo({
    className,
    imageClassName,
    titleClassName,
    subtitleClassName,
    subtitle = true,
}: BrandLogoProps) {
    return (
        <div className={cn("flex items-center gap-3", className)}>
            <img
                src="/logo.svg"
                alt="SmartLibrary"
                className={cn("h-9 w-auto shrink-0", imageClassName)}
            />
            <div className=" hidden md:block">
                <p className={cn("text-sm font-semibold", titleClassName)}>SmartLibrary</p>
                {subtitle && (
                    <p className={cn("text-xs text-muted-foreground", subtitleClassName)}>
                        Campus online books platform
                    </p>
                )}
            </div>
        </div>
    );
}