# POS Web Frontend

## Descripción

Frontend del sistema POS Web desarrollado para optimizar la gestión comercial de pequeños y medianos negocios. Permitirá administrar ventas, productos, stock, clientes y reportes desde una interfaz web moderna e intuitiva.

## Documentación completa

La documentación detallada del proyecto (decisiones técnicas, módulos, endpoints consumidos) está en el siguiente Google Doc, compartido con el repositorio del backend:

[Documentación del proyecto](https://docs.google.com/document/d/1U9A7sZCXHqEEOIHKMWEZhd4TZFbID6rypjZ4SzBhiS0/edit?usp=sharing)

## Integrantes

* Corti Pedro Pablo
* Campuzano Juan Ignacio
* Centeno Lucas

## Tecnologías Utilizadas

* React
* Vite
* Tailwind CSS v4
* React Router
* Zustand
* Axios

## Instalación

1. Clonar el repositorio.

```bash
git clone https://github.com/pedrocortii/sistema-pos-frontend.git
```

2. Ingresar al proyecto.

```bash
cd sistema-pos-frontend
```

3. Instalar dependencias.

```bash
npm install
```

4. Crear un archivo `.env` en la raíz con la siguiente variable:

VITE_API_URL=http://localhost:3000

5. Asegurarse de tener el backend corriendo (ver README del repo sistema-pos-backend).

6. Ejecutar el proyecto.

```bash
npm run dev
```

## Módulos implementados

* **Login**: inicio de sesión conectado al backend (JWT)
* **Registro**: alta de nuevos clientes (autoservicio)

## Estado Actual

Frontend en desarrollo. Autenticación (login y registro) funcional. Pendiente: catálogo de productos, carrito de compra, y pantallas de gestión para el personal (productos, stock, ventas).