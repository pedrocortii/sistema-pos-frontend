import * as yup from 'yup';

export const stockAdjustmentSchema = yup.object().shape({
  cantidad: yup.number()
    .typeError('La cantidad debe ser un número')
    .integer('La cantidad debe ser un número entero')
    .notOneOf([0], 'La cantidad no puede ser cero')
    .required('La cantidad es obligatoria'),
  motivo: yup.string()
    .trim()
    .required('El motivo es obligatorio'),
});

export const umbralStockBajoSchema = yup.object().shape({
  umbralStockBajo: yup.number()
    .typeError('El umbral debe ser un número')
    .integer('El umbral debe ser un número entero')
    .min(0, 'El umbral no puede ser negativo')
    .required('El umbral es obligatorio'),
});
