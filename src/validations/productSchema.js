import * as yup from 'yup';

export const productSchema = yup.object().shape({
  nombre: yup.string()
    .trim()
    .required('El nombre es obligatorio'),
  categoria: yup.string()
    .trim()
    .required('La categoría es obligatoria'),
  precio: yup.number()
    .typeError('El precio debe ser un número')
    .positive('El precio debe ser mayor a 0')
    .required('El precio es obligatorio'),
  stock: yup.number()
    .typeError('El stock debe ser un número')
    .integer('El stock debe ser un número entero')
    .min(0, 'El stock no puede ser negativo')
    .required('El stock es obligatorio'),
  descripcion: yup.string()
    .trim()
    .optional(),
});
