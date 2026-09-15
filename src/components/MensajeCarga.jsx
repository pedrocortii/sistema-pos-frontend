function MensajeCarga({ texto = "Cargando...", className = "" }) {
    return <p className={"font-mono-ticket text-sm text-ink/60 " + className}>{texto}</p>;
}

export default MensajeCarga;
