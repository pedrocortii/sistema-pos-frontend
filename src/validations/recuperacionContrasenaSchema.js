import * as yup from "yup";

export const solicitarRecuperacionSchema = yup.object().shape({
    email: yup.string()
        .trim()
        .email("Ingresá un email válido")
        .required("El email es obligatorio")
});

export const restablecerContrasenaSchema = yup.object().shape({
    contrasena: yup.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(72, "La contraseña no puede superar los 72 caracteres")
        .required("La contraseña es obligatoria"),
    confirmarContrasena: yup.string()
        .required("Debes confirmar la contraseña")
        .oneOf([yup.ref("contrasena"), null], "Las contraseñas no coinciden")
});
