# Git Flow - Argo POS

> Este documento define la estrategia oficial de Git para Argo POS.
>
> El objetivo NO es únicamente tener el historial limpio, sino poder identificar rápidamente cualquier cambio, revertir funcionalidades sin afectar otras y facilitar el mantenimiento del proyecto a largo plazo.

---

# Principios

## 1. Una rama = Una responsabilidad

Cada rama debe resolver un único problema.

No mezclar funcionalidades.

No mezclar refactors.

No mezclar estilos.

No mezclar correcciones.

### ✅ Correcto

```
feature/login

feature/dashboard

feature/inventory

fix/cart-total

refactor/product-service
```

### ❌ Incorrecto

```
feature/login-dashboard-users-products-final
```

---

# 2. Commits pequeños

Nunca esperar dos días para hacer un commit.

Nunca hacer commits con cientos de archivos modificados si representan cambios distintos.

Un commit debe representar una única intención.

---

# 3. Commits atómicos

Cada commit debe poder responder una pregunta:

> ¿Qué hace exactamente este commit?

Si la respuesta necesita un párrafo...

...el commit está mal dividido.

---

# 4. Separar responsabilidades

Dentro de una misma rama se permiten varios commits.

Pero deben estar organizados.

Ejemplo:

```
feature/products

├── feat(database): create products schema
├── feat(repository): implement product repository
├── feat(service): create product service
├── feat(ui): create products page
├── style(products): improve spacing
├── style(products): improve responsive layout
├── test(products): add repository tests
```

Todo pertenece al módulo "Productos".

No hay commits de inventario.

No hay commits de usuarios.

---

# 5. No trabajar directamente sobre main

Nunca.

Absolutamente nunca.

---

# Flujo de ramas

```
main

↓

feature/...

↓

Pull Request

↓

Merge

↓

Delete branch
```

---

# Rama principal

```
main
```

Siempre estable.

Siempre funcional.

Siempre desplegable.

Nunca romper main.

---

# Tipos de ramas

## Nuevas funcionalidades

```
feature/login

feature/dashboard

feature/products

feature/categories

feature/inventory

feature/settings
```

---

## Correcciones

```
fix/cart-total

fix/login

fix/inventory

fix/backup
```

---

## Refactor

```
refactor/database

refactor/product-service

refactor/repositories
```

---

## Documentación

```
docs/readme

docs/setup

docs/git-flow
```

---

## Chore

Configuraciones internas.

```
chore/eslint

chore/prettier

chore/drizzle

chore/vite
```

---

# Tamaño ideal de una rama

Idealmente:

Entre

5

y

20 commits.

No hacer ramas gigantes.

---

# Duración ideal

Una rama debería vivir poco.

Ideal:

1 día

2 días

3 días máximo.

No tener ramas abiertas durante semanas.

---

# Commits

Formato oficial:

```
tipo(scope): descripción
```

Ejemplos:

```
feat(products): create products module

feat(pos): implement shopping cart

feat(database): create sale tables

fix(pos): calculate total correctly

fix(auth): prevent duplicated session

refactor(repository): simplify query builder

style(products): improve product cards

docs(readme): update installation guide

test(products): add repository tests

chore(eslint): update configuration
```

---

# Tipos permitidos

```
feat

fix

refactor

style

docs

test

chore
```

Nada más.

---

# Commits prohibidos

Nunca usar:

```
update

changes

new

last

final

final-final

fix

asdf

...

commit

version 2
```

El historial debe poder leerse dentro de cinco años.

---

# Frecuencia

Si llevas:

2 horas

sin hacer commit...

probablemente estás acumulando demasiados cambios.

Haz commits pequeños.

---

# Separación por responsabilidad

Supongamos que estás desarrollando Productos.

### Incorrecto

```
feat(products)

+ Backend

+ UI

+ CSS

+ Inventario

+ Usuarios

+ Configuración

Todo en un solo commit.
```

---

### Correcto

```
feat(database): create products schema

feat(repository): implement product repository

feat(service): create products service

feat(products): create products page

style(products): improve cards

style(products): improve spacing

test(products): add service tests
```

Cada commit tiene un propósito claro.

---

# Pull Requests

Antes de hacer merge revisar:

- Compila.
- Sin errores de TypeScript.
- Sin errores de ESLint.
- Sin código comentado.
- Sin console.log innecesarios.
- Sin archivos temporales.
- Sin TODO olvidados.

---

# Merge

Siempre mediante Pull Request.

Nunca trabajar directamente sobre main.

---

# Eliminar ramas

Después del merge:

Eliminar la rama.

No acumular ramas antiguas.

---

# Regla de oro

Antes de crear una rama, preguntarse:

> ¿Este cambio resuelve un único problema?

Si la respuesta es NO...

Crear otra rama.

---

# Filosofía

Preferimos:

100 commits pequeños

que

10 commits enormes.

Preferimos:

20 ramas pequeñas

que

2 ramas gigantes.

Preferimos:

un historial claro

que

un historial corto.

Git no es un respaldo.

Git es la historia del proyecto.

Cada commit debe contar una parte de esa historia.
