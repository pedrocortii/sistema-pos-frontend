export function Card({
    children,
    hover = false,
    className = "",
    ...props
}) {
    return (
        <div
            className={`bg-ticket border border-line p-6 ${hover ? "hover:border-forest transition-colors" : ""} ${className}`}
            {...props}
        >
            {children}
        </div>
    );
}

export function CardHeader({ children, className = "" }) {
    return <div className={`mb-4 ${className}`}>{children}</div>;
}

export function CardTitle({ children, className = "" }) {
    return <h2 className={`font-display text-xl text-ink ${className}`}>{children}</h2>;
}

export function CardDescription({ children, className = "" }) {
    return <p className={`mt-1 font-mono-ticket text-xs text-ink/60 ${className}`}>{children}</p>;
}

export function CardContent({ children, className = "" }) {
    return <div className={className}>{children}</div>;
}

export function CardFooter({ children, className = "" }) {
    return (
        <div className={`mt-6 pt-4 border-t border-line flex items-center justify-between ${className}`}>
            {children}
        </div>
    );
}

export default Card;
