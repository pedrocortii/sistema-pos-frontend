import * as yup from "yup";
import { validarFormatoDni } from "./dni";

export const perfilSchema = yup.object().shape({
    nombre: yup.string()
        .trim()
        .required("El nombre es obligatorio")
        .max(100, "El nombre no puede superar los 100 caracteres"),
    apellido: yup.string()
        .trim()
        .required("El apellido es obligatorio")
        .max(100, "El apellido no puede superar los 100 caracteres"),
    dni: yup.string()
        .trim()
        .required("El DNI es obligatorio")
        .test("formato-dni", "El DNI no es válido", validarFormatoDni),
    email: yup.string()
        .trim()
        .email("El email no es válido")
        .required("El email es obligatorio")
        .max(255, "El email no puede superar los 255 caracteres")
});

export const cambiarContrasenaSchema = yup.object().shape({
    contrasenaActual: yup.string()
        .required("La contraseña actual es obligatoria"),
    contrasenaNueva: yup.string()
        .min(6, "La nueva contraseña debe tener al menos 6 caracteres")
        .required("La nueva contraseña es obligatoria"),
    confirmarContrasena: yup.string()
        .required("Debes confirmar la nueva contraseña")
        .oneOf([yup.ref("contrasenaNueva"), null], "Las contraseñas no coinciden")
});
