import * as yup from "yup";
import { validarFormatoDni } from "./dni";

export const registroSchema = yup.object().shape({
    nombre: yup.string()
        .trim()
        .max(100, "El nombre no puede superar los 100 caracteres")
        .required("El nombre es obligatorio"),
    apellido: yup.string()
        .trim()
        .max(100, "El apellido no puede superar los 100 caracteres")
        .required("El apellido es obligatorio"),
    dni: yup.string()
        .trim()
        .max(20, "El DNI no es válido")
        .test("formato-dni", "El DNI no es válido", validarFormatoDni)
        .required("El DNI es obligatorio"),
    email: yup.string()
        .trim()
        .max(255, "El email no puede superar los 255 caracteres")
        .email("El email no es válido")
        .required("El email es obligatorio"),
    contrasena: yup.string()
        .min(8, "La contraseña debe tener al menos 8 caracteres")
        .max(72, "La contraseña no puede superar los 72 caracteres")
        .required("La contraseña es obligatoria"),
    confirmarContrasena: yup.string()
        .required("Debes confirmar la contraseña")
        .oneOf([yup.ref("contrasena"), null], "Las contraseñas no coinciden")
});
