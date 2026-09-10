import * as yup from 'yup';

export const checkoutSchema = yup.object().shape({
  nombre: yup.string()
    .trim()
    .required('El nombre es obligatorio'),
  apellido: yup.string()
    .trim()
    .required('El apellido es obligatorio'),
  dni: yup.string()
    .trim()
    .required('El DNI es obligatorio'),
  email: yup.string()
    .trim()
    .email('El email no es válido')
    .required('El email es obligatorio'),
  confirmarEmail: yup.string()
    .trim()
    .required('Debes confirmar tu email')
    .oneOf([yup.ref('email'), null], 'Los emails no coinciden'),
});
