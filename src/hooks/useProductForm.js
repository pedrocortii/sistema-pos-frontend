import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import { productSchema } from "../validations/productSchema";

const vacio = { nombre: "", descripcion: "", precio: "", stock: "", categoria: "" };

export function useProductForm(producto, alGuardar) {
    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        resolver: yupResolver(productSchema),
        defaultValues: vacio,
    });

    useEffect(function () {
        reset(producto ? {
            nombre: producto.nombre,
            descripcion: producto.descripcion || "",
            precio: producto.precio,
            stock: producto.stock,
            categoria: producto.categoria
        } : vacio);
    }, [producto, reset]);

    const onSubmit = (datos) => {
        alGuardar({
            nombre: datos.nombre.trim(),
            descripcion: datos.descripcion?.trim() || undefined,
            precio: Number(datos.precio),
            stock: Number(datos.stock),
            categoria: datos.categoria.trim(),
        });
    };

    return {
        register,
        handleSubmit: handleSubmit(onSubmit),
        errors,
    };
}
