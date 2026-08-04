# Tutorial media (offline)

Assets served from Vite/`public` as `/help/<file>`.

## Formats

| Extensión | Uso |
|-----------|-----|
| `.svg` | Storyboards actuales (ligeros, nítidos) |
| `.png` / `.webp` | Capturas reales de pantalla |
| `.gif` | Flujos animados (grabaciones cortas de UI) |

## Cómo agregar un GIF

1. Graba el flujo en la app (p. ej. cobro POS) y exporta un GIF corto (&lt; ~3 MB).
2. Guárdalo aquí: `public/help/pos-cobrar.gif`
3. En `src/modules/help/content/visual-steps.ts` apunta `mediaSrc: "/help/pos-cobrar.gif"`.

La UI del Tutorial ya muestra GIF/PNG/SVG y tiene carrusel Anterior/Siguiente.
