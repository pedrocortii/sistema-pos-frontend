import * as yup from 'yup';
import { validarFormatoDni } from './dni';

export const checkoutSchema = yup.object().shape({
  nombre: yup.string()
    .trim()
    .max(100, 'El nombre no puede superar los 100 caracteres')
    .required('El nombre es obligatorio'),
  apellido: yup.string()
    .trim()
    .max(100, 'El apellido no puede superar los 100 caracteres')
    .required('El apellido es obligatorio'),
  dni: yup.string()
    .trim()
    .max(20, 'El DNI no es válido')
    .test('formato-dni', 'El DNI no es válido', validarFormatoDni)
    .required('El DNI es obligatorio'),
  email: yup.string()
    .trim()
    .max(255, 'El email no puede superar los 255 caracteres')
    .email('El email no es válido')
    .required('El email es obligatorio'),
  confirmarEmail: yup.string()
    .trim()
    .required('Debes confirmar tu email')
    .oneOf([yup.ref('email'), null], 'Los emails no coinciden'),
  nombrePersonalizado: yup.string()
    .trim()
    .max(80, 'El nombre de la compra no puede superar los 80 caracteres')
    .optional(),
});
