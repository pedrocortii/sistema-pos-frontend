import * as yup from "yup";

export const registroSchema = yup.object().shape({
    nombre: yup.string()
        .trim()
        .required("El nombre es obligatorio"),
    apellido: yup.string()
        .trim()
        .required("El apellido es obligatorio"),
    dni: yup.string()
        .trim()
        .required("El DNI es obligatorio"),
    email: yup.string()
        .trim()
        .email("El email no es válido")
        .required("El email es obligatorio"),
    contrasena: yup.string()
        .min(6, "La contraseña debe tener al menos 6 caracteres")
        .required("La contraseña es obligatoria"),
    confirmarContrasena: yup.string()
        .required("Debes confirmar la contraseña")
        .oneOf([yup.ref("contrasena"), null], "Las contraseñas no coinciden")
});
