const CARACTERISTICAS = [
    "Ventas rapidas en un par de clics",
    "Control de stock en tiempo real",
    "Historial completo de operaciones"
];

function PanelAuth({ etiqueta, titulo, children }) {
    return (
        <div className="min-h-screen flex bg-paper">
            <div className="hidden lg:flex lg:w-2/5 bg-forest text-paper flex-col justify-between p-12">
                <div>
                    <p className="font-mono-ticket text-sm tracking-[0.3em] uppercase text-paper/70">
                        Sistema POS
                    </p>
                    <h1 className="font-display text-5xl leading-tight mt-6">
                        El mostrador,
                        <br />
                        en tu pantalla.
                    </h1>
                </div>

                <ul className="space-y-4">
                    {CARACTERISTICAS.map(function (texto, indice) {
                        return (
                            <li key={indice} className="font-mono-ticket text-sm text-paper/85 flex items-baseline gap-3">
                                <span className="text-amber">{String(indice + 1).padStart(2, "0")}</span>
                                <span>{texto}</span>
                            </li>
                        );
                    })}
                </ul>
            </div>

            <div
                className="flex-1 flex items-center justify-center p-6"
                style={{
                    backgroundImage: "radial-gradient(circle, var(--color-line) 1px, transparent 1px)",
                    backgroundSize: "24px 24px"
                }}
            >
                <div className="w-full max-w-md">
                    <div
                        className="h-4"
                        style={{
                            backgroundImage: "radial-gradient(circle at 8px 0px, transparent 8px, var(--color-paper) 8.5px)",
                            backgroundSize: "16px 16px",
                            backgroundColor: "var(--color-ticket)"
                        }}
                    ></div>

                    <div className="bg-ticket px-10 py-9 shadow-[0_20px_40px_-15px_rgba(30,35,33,0.25)]">
                        <p className="font-mono-ticket text-xs tracking-[0.25em] uppercase text-ink/50 text-center">
                            {etiqueta}
                        </p>
                        <h2 className="font-display text-3xl text-ink text-center mt-2 mb-8">
                            {titulo}
                        </h2>

                        {children}
                    </div>

                    <div
                        className="h-4"
                        style={{
                            backgroundImage: "radial-gradient(circle at 8px 16px, transparent 8px, var(--color-paper) 8.5px)",
                            backgroundSize: "16px 16px",
                            backgroundColor: "var(--color-ticket)"
                        }}
                    ></div>
                </div>
            </div>
        </div>
    );
}

export default PanelAuth;