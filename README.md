# MODULAR ARCHIVE

Portafolio 3D interactivo para proyectos de videojuegos. Un mecanismo de cristal oscuro formado por ocho módulos permite rotar un cubo 2×2×2 y descubrir seis registros animados.

## Stack

- React 18 + TypeScript + Vite
- Three.js + React Three Fiber + drei
- postprocessing (bloom y SMAA)
- gifuct-js para decodificar los GIF y compartir una textura animada por proyecto
- Vitest para geometría, detección de caras y mapeo de texturas

## Desarrollo

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite, normalmente `http://localhost:5173`.

## Verificación

```bash
npm test
npm run build
npm run preview
```

`npm test` ejecuta 21 pruebas. `npm run build` valida TypeScript y genera `dist`.

## Personalización

- `src/data/siteConfig.ts`: nombre, rol, textos de About, tags, email y enlaces. Los enlaces con `null` no se muestran.
- `src/data/projects.ts`: títulos, descripciones, género, año, tecnologías, GIF, cara del cubo, `imageFit`, `focalPoint` y URL externa.
- `public/projects/`: GIFs finales. Conserva los nombres o actualiza `image` en `projects.ts`.
- `src/utils/geometry.ts`: tamaños, separación, umbrales magnéticos y geometría de los paneles.
- `src/components/scene/ModularCube.tsx`: materiales del cuerpo, marcos, cristal y núcleo.

Las caras disponibles son `+X`, `-X`, `+Y`, `-Y`, `+Z` y `-Z`. Cada GIF se reparte automáticamente entre los cuatro módulos de su cara, por lo que conviene usar imágenes centradas y con el sujeto dentro del encuadre.

## GIF recomendados

- Formato GIF animado, sin audio.
- Resolución cuadrada o cercana a 1:1 para las caras.
- Evita archivos de decenas de MB: se decodifican completos en el navegador y afectan la memoria y el arranque.
- Si cambias el nombre de un archivo, actualiza `image` y `sourceFile` en `projects.ts`.

Los GIF actuales pesan entre 71 KB y 15.5 MB. Para producción conviene optimizarlos a 480–640 px y reducir el número de fotogramas.

## Despliegue en GitHub Pages

1. Crea un repositorio y sube el proyecto.
2. En GitHub, entra en **Settings → Pages** y selecciona **GitHub Actions** como origen.
3. Haz push a `main`. El workflow `.github/workflows/deploy.yml` instala dependencias, ejecuta las pruebas, compila y publica `dist`.

El workflow compila con `VITE_BASE=/<nombre-del-repositorio>/`. Si el sitio se publica en `https://usuario.github.io/` (repositorio `usuario.github.io`), cambia ese valor a `/` en el workflow.

También puedes compilar manualmente:

```bash
$env:VITE_BASE="/nombre-del-repositorio/"
npm run build
```

Para probar la compilación con rutas relativas, `npm run build` sin `VITE_BASE` usa `./`.

## Notas técnicas

- Los GIF se decodifican una sola vez por proyecto y se comparten entre los cuatro paneles de la cara.
- El cristal usa transparencia alpha en lugar de `transmission` para mantener visibles los GIF en renderizadores por software y equipos sin GPU dedicada.
- La introducción y el snap usan tiempo real para no depender de los FPS.
- En móvil el cubo se aleja para que la composición completa quepa en pantalla.
- `main.tsx` no usa `StrictMode` porque el remontaje de desarrollo liberaba las texturas animadas compartidas.
- El build genera un chunk de ~1.2 MB (374 KB gzip). Es normal por Three.js; si el peso importa, se puede dividir con `manualChunks`.

## Estructura

```text
src/
  components/
    interaction/   controlador de rotación y snap
    interface/     HUD, paneles, modal, navegación y fallback
    scene/         Canvas, cámara, cubo, luces y postprocesado
  data/            proyectos, caras, orientaciones y configuración
  hooks/           texturas animadas, WebGL y reduced motion
  lib/             GifTextureManager
  state/           estado de interfaz y acciones
  styles/          estilos globales e interfaz
  utils/           geometría, detección de caras y texturas
public/
  projects/        GIFs servidos en producción
  favicon.svg
```
