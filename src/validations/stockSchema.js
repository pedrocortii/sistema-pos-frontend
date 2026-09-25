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
