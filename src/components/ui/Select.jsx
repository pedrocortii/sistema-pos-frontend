import { forwardRef } from "react";

export const Select = forwardRef(function Select(
    {
        label,
        error,
        hint,
        variant = "box",
        options = [],
        children,
        id,
        name,
        required = false,
        className = "",
        containerClassName = "",
        ...props
    },
    ref
) {
    const selectId = id || name;
    const mensajeError = typeof error === "object" ? error?.message : error;

    const estilosSelect =
        variant === "line"
            ? "w-full mt-1 pb-2 bg-transparent border-b-2 border-line focus:border-forest outline-none text-ink transition-colors text-sm"
            : "w-full border border-line bg-ticket p-2 text-ink outline-none focus:border-forest text-sm transition-colors";

    return (
        <div className={`flex flex-col ${containerClassName}`}>
            {label && (
                <label
                    htmlFor={selectId}
                    className="text-xs text-ink/60 mb-1"
                >
                    {label} {required && <span className="text-forest">*</span>}
                </label>
            )}

            <select
                ref={ref}
                id={selectId}
                name={name}
                required={required}
                className={`${estilosSelect} ${mensajeError ? "border-red-500 focus:border-red-600" : ""} ${className}`}
                {...props}
            >
                {options && options.length > 0
                    ? options.map(function (opt) {
                          if (typeof opt === "string") {
                              return (
                                  <option key={opt} value={opt}>
                                      {opt}
                                  </option>
                              );
                          }
                          return (
                              <option key={opt.value} value={opt.value}>
                                  {opt.label || opt.value}
                              </option>
                          );
                      })
                    : children}
            </select>

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

Select.displayName = "Select";

export default Select;
