import { forwardRef } from "react";

export const Input = forwardRef(function Input(
    {
        label,
        error,
        hint,
        variant = "box",
        icon: Icono,
        id,
        name,
        type = "text",
        required = false,
        className = "",
        containerClassName = "",
        ...props
    },
    ref
) {
    const inputId = id || name;
    const mensajeError = typeof error === "object" ? error?.message : error;

    const estilosInput =
        variant === "line"
            ? "w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors text-sm placeholder:text-ink/40"
            : "w-full border border-line bg-ticket p-2 text-ink outline-none focus:border-forest text-sm placeholder:text-ink/40 transition-colors";

    return (
        <div className={`flex flex-col ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={inputId}
                    className="text-xs text-ink/60 mb-1"
                >
                    {label} {required && <span className="text-forest">*</span>}
                </label>
            )}

            <div className="relative flex items-center w-full">
                {Icono && (
                    <span className="absolute left-3 text-ink/40 pointer-events-none">
                        <Icono size={16} aria-hidden="true" />
                    </span>
                )}
                <input
                    ref={ref}
                    id={inputId}
                    name={name}
                    type={type}
                    required={required}
                    className={`${estilosInput} ${Icono ? "pl-9" : ""} ${mensajeError ? "border-red-500 focus:border-red-600" : ""} ${className}`}
                    {...props}
                />
            </div>

            {hint && !mensajeError && (
                <p className="mt-1 text-xs text-ink/50">{hint}</p>
            )}

            {mensajeError && (
                <p className="mt-1 text-xs text-red-600" role="alert">
                    {mensajeError}
                </p>
            )}
        </div>
    );
});

Input.displayName = "Input";

export default Input;
