import { forwardRef } from "react";

const variantes = {
    primary: "bg-forest text-paper hover:bg-forest-dark disabled:opacity-60",
    secondary: "border border-line bg-ticket text-ink hover:bg-paper disabled:opacity-40",
    outline: "border border-forest text-forest hover:bg-forest hover:text-paper disabled:opacity-40",
    danger: "bg-red-600 text-paper hover:bg-red-700 disabled:opacity-60",
    "danger-outline": "border border-red-300 text-red-600 hover:bg-red-50 disabled:opacity-40",
    ghost: "text-ink/70 hover:text-forest hover:bg-paper disabled:opacity-40",
    accent: "bg-amber text-ink font-bold hover:brightness-95 disabled:opacity-60"
};

const tamanos = {
    sm: "px-3 py-1.5 text-xs",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-3 text-sm sm:text-base",
    xl: "w-full py-4 text-sm sm:text-base",
    icon: "p-2 text-sm",
    "icon-sm": "p-1 text-xs",
    "icon-md": "w-9 h-9 p-0 flex items-center justify-center",
    "icon-lg": "w-11 h-9 p-0 flex items-center justify-center"
};

export const Button = forwardRef(function Button(
    {
        children,
        variant = "primary",
        size = "md",
        type = "button",
        disabled = false,
        loading = false,
        loadingText,
        icon: Icono,
        iconPosition = "left",
        className = "",
        ...props
    },
    ref
) {
    const estiloVariante = variantes[variant] || variantes.primary;
    const estiloTamano = tamanos[size] || tamanos.md;

    return (
        <button
            ref={ref}
            type={type}
            disabled={disabled || loading}
            className={`inline-flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:cursor-not-allowed select-none focus-visible:outline-2 focus-visible:outline-forest focus-visible:outline-offset-2 ${estiloVariante} ${estiloTamano} ${className}`}
            {...props}
        >
            {loading ? (
                <>
                    <span className="inline-block h-3.5 w-3.5 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
                    <span>{loadingText || children}</span>
                </>
            ) : (
                <>
                    {Icono && iconPosition === "left" && <Icono size={16} aria-hidden="true" className="shrink-0" />}
                    {children}
                    {Icono && iconPosition === "right" && <Icono size={16} aria-hidden="true" className="shrink-0" />}
                </>
            )}
        </button>
    );
});

Button.displayName = "Button";

export default Button;
