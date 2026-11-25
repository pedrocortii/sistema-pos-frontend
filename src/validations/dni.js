export function validarFormatoDni(dni) {
    if (!dni || typeof dni !== "string") return false;
    const dniNormalizado = dni.trim();
    return /^\d{7,8}$/.test(dniNormalizado) || /^\d{1,2}(?:\.\d{3}){2}$/.test(dniNormalizado);
}

export function limpiarDni(dni) {
    if (!dni || typeof dni !== "string") return "";
    return dni.trim().replace(/\./g, "");
}
