function MensajeError({ texto, className = "" }) {
    return (
        <p className={"border border-red-200 bg-red-50 p-3 font-mono-ticket text-sm text-red-700 " + className}>
            {texto}
        </p>
    );
}

export default MensajeError;
