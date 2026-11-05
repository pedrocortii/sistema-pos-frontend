import { forwardRef } from "react";

export const Textarea = forwardRef(function Textarea(
    {
        label,
        error,
        hint,
        variant = "box",
        id,
        name,
        required = false,
        className = "",
        containerClassName = "",
        rows = 3,
        ...props
    },
    ref
) {
    const textareaId = id || name;
    const mensajeError = typeof error === "object" ? error?.message : error;

    const estilosTextarea =
        variant === "line"
            ? "w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors text-sm placeholder:text-ink/40 resize-y"
            : "w-full border border-line bg-ticket p-2 text-ink outline-none focus:border-forest text-sm placeholder:text-ink/40 transition-colors resize-y";

    return (
        <div className={`flex flex-col ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={textareaId}
                    className="text-xs text-ink/60 mb-1"
                >
                    {label} {required && <span className="text-forest">*</span>}
                </label>
            )}

            <textarea
                ref={ref}
                id={textareaId}
                name={name}
                rows={rows}
                required={required}
                className={`${estilosTextarea} ${mensajeError ? "border-red-500 focus:border-red-600" : ""} ${className}`}
                {...props}
            />

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

Textarea.displayName = "Textarea";

export default Textarea;
