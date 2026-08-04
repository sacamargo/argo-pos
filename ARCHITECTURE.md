# Argo POS

> Un sistema de punto de venta (POS) moderno, local-first, táctil y extremadamente simple de usar.

---

# Filosofía del producto

Argo POS NO busca competir con un ERP.

No queremos construir otro Odoo.

No queremos construir un sistema lleno de módulos que nunca se usan.

El objetivo es construir un POS que cualquier persona pueda aprender a usar en menos de cinco minutos.

El producto debe priorizar:

- Simplicidad
- Velocidad
- Estabilidad
- Escalabilidad
- Mantenibilidad

Antes que cantidad de funcionalidades.

---

# Principios no negociables

## 1. Offline First

La aplicación debe funcionar el 100% del tiempo sin conexión a internet.

Nunca una venta dependerá de un servidor.

SQLite será la fuente de verdad.

Internet será opcional.

Si mañana existe sincronización con la nube será una funcionalidad adicional, nunca una dependencia.

---

## 2. Local First

Toda la información vive en el computador del negocio.

No existe dependencia de servicios externos.

El sistema debe seguir funcionando aunque:

- no haya internet
- falle el router
- falle el ISP

Mientras el computador permanezca encendido gracias al UPS, el negocio debe seguir vendiendo normalmente.

---

## 3. Touch First

La aplicación está diseñada para pantallas táctiles.

No para mouse.

Todo debe ser cómodo para tocar con los dedos.

Esto implica:

- botones grandes
- separación amplia
- textos legibles
- acciones claras
- pocas acciones por pantalla

---

## 4. Venta en menos de 10 segundos

Todo el diseño gira alrededor de vender rápido.

Cada clic debe justificarse.

El vendedor no debe pensar.

Debe tocar.

---

## 5. Minimalismo

No construir funcionalidades "por si acaso".

Cada módulo debe resolver un problema real.

Si una funcionalidad no aporta valor inmediato al negocio, no entra al MVP.

---

## 6. Ventas inmutables

Las ventas nunca se editan.

Si ocurre un error:

- se anula
- se registra motivo
- se devuelve inventario automáticamente

Siempre debe existir auditoría.

---

## 7. Inventario por movimientos

Nunca modificar cantidades directamente.

Todo cambio debe generar un movimiento.

Ejemplos:

- Entrada
- Ajuste
- Venta
- Anulación
- Devolución (futuro)

---

# Objetivos

Crear un POS que:

- cualquier persona pueda usar
- sea extremadamente rápido
- funcione offline
- sea fácil de mantener
- sea escalable para múltiples negocios en el futuro

---

# Público objetivo

Pequeños negocios.

Ejemplos:

- Granizados
- Tiendas de barrio
- Cafeterías
- Restaurantes pequeños
- Panaderías
- Heladerías

---

# Stack tecnológico

## Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui (como base)
- TanStack Query (si aplica para estado asíncrono local)
- React Hook Form
- Zod

---

## Desktop

Tauri v2

Razones:

- muy liviano
- bajo consumo de RAM
- excelente rendimiento
- multiplataforma
- integración con Rust

---

## Base de datos

SQLite

Razones:

- ACID
- cero configuración
- un solo archivo
- extremadamente estable
- ideal para POS

---

## ORM

Drizzle ORM

Razones:

- TypeScript First
- excelente soporte SQLite
- migraciones simples
- tipado fuerte

---

## Runtime

Node LTS

pnpm

---

## Lenguaje

TypeScript estricto.

Nunca usar `any`.

---

## Estado global

Zustand

Solo para estado de UI.

Nunca almacenar la fuente de verdad de negocio en Zustand.

---

## Validaciones

Zod.

---

## Testing (futuro)

Vitest

Playwright

---

# Arquitectura

Arquitectura basada en capas.

```
UI

↓

Application

↓

Domain

↓

Infrastructure

↓

SQLite
```

La UI nunca debe conocer SQLite.

La UI nunca debe conocer Drizzle.

La UI nunca debe conocer Tauri.

Todo debe pasar por servicios.

---

# Estructura del proyecto

```
src/

    app/

    modules/

        pos/

        dashboard/

        inventory/

        catalog/

        users/

        settings/

        backup/

        help/

    components/

    layouts/

    shared/

        hooks/

        lib/

        types/

        constants/

        utils/

    database/

        drizzle/

        schema/

        migrations/

    domain/

        entities/

        repositories/

        services/

        value-objects/

    infrastructure/

        repositories/

        sqlite/

        tauri/

```

---

# Diseño

Debe sentirse como:

Apple.

Notion.

Linear.

Raycast.

Stripe Dashboard.

No como un ERP.

---

# UI

Debe ser:

limpia

minimalista

mucho espacio

tipografía clara

sin ruido

sin sombras exageradas

sin gradientes innecesarios

---

# Colores

Soporte para:

Modo claro

Modo oscuro

El usuario puede cambiar el tema manualmente.

---

# Tipografía

Inter

---

# Iconografía

Lucide React.

---

# Layout principal

```
┌────────────────────────────────────────────┐

 Header

├──────────┬──────────────────────┬──────────┤

 Sidebar   Productos             Carrito

├──────────┼──────────────────────┼──────────┤

 Categorías

├──────────┴──────────────────────┴──────────┤

 Footer

└────────────────────────────────────────────┘
```

---

# Sidebar

Según permisos.

## Vendedor

Dashboard

Ventas

Historial

Cerrar sesión

---

## Admin

Dashboard

Ventas

Historial

Productos

Categorías

Inventario

Usuarios

Configuración

Backups

---

# POS

Es la pantalla más importante.

Debe ocupar la mayor parte del esfuerzo.

---

## Columna izquierda

Categorías.

Ejemplo:

Todos

Granizados

Cervezas

Gaseosas

Bebidas

Mecatos

Otros

---

## Centro

Grid de productos.

Cada tarjeta muestra:

Imagen

Nombre

Precio

Nada más.

---

## Derecha

Carrito permanente.

Siempre visible.

Nunca ocultarlo.

Debe mostrar:

Productos

Cantidad

Subtotal

Descuento

Total

Método de pago

Botón cobrar

---

# Dashboard

Minimalista.

Solo indicadores importantes.

Ventas del día.

Ingresos.

Productos vendidos.

Última venta.

Caja abierta.

---

# Inventario

No construir un ERP.

Solo:

Ingredientes

Entradas

Ajustes

Movimientos

Stock bajo

---

# Productos

Cada producto tendrá:

Nombre

Categoría

Imagen

Precio

Estado

Receta

---

# Categorías

Solo un nivel.

Nada de árboles infinitos.

---

# Usuarios

Dos roles.

## Admin

Acceso completo.

## Vendedor

Solo ventas.

---

# Seguridad

Contraseñas cifradas.

Nunca almacenar texto plano.

---

# Base de datos

SQLite será la única fuente de verdad.

Nunca depender de internet.

---

# Backups

Fundamental.

Debe existir un módulo dedicado.

Funciones:

Backup manual.

Backup automático.

Restaurar backup.

Mostrar fecha del último backup.

---

# Futuro

El sistema debe estar preparado para agregar:

Sincronización nube.

Múltiples sucursales.

Múltiples negocios.

Reportes avanzados.

Aplicación móvil.

Portal web administrativo.

Sin reescribir el proyecto.

---

# Funcionalidades del MVP

- Login
- Dashboard
- POS
- Carrito
- Cobro
- Cambio
- Historial
- Anulación
- Productos
- Categorías
- Inventario
- Usuarios
- Tema oscuro
- Tema claro
- Backup
- Restauración
- Apertura de caja
- Cierre de caja

---

# Fuera del MVP

No implementar todavía:

- Facturación electrónica
- Impresoras
- Lector de código de barras
- Cajón monedero
- Multi sucursal
- Sincronización nube
- CRM
- Compras
- Proveedores
- Contabilidad
- Costos avanzados
- Promociones complejas
- Programa de fidelización
- Integraciones externas

---

# Reglas de UX

- Nunca más de una acción principal por pantalla.
- Botones táctiles grandes.
- Navegación intuitiva.
- Evitar modales innecesarios.
- Confirmar acciones destructivas.
- Feedback visual inmediato.
- Mantener tiempos de respuesta menores a 100 ms para acciones locales.
- Priorizar la rapidez sobre las animaciones.

---

# Objetivo final

Construir un POS que parezca un producto comercial de primer nivel, no un sistema interno.

Debe transmitir:

Rapidez.

Calidad.

Confiabilidad.

Simplicidad.

El usuario nunca debe sentir que está usando un software complicado.

El software debe desaparecer y permitir que el negocio venda.
