# Mod Guardian (Devvit)

**Mod Guardian** es una app de moderación para Reddit construida con [Devvit Web](https://developers.reddit.com/) (servidor TypeScript + Hono + Vite). El slug técnico de la app en Reddit es `modaiguard` (configurado en `devvit.json`).

Incluye:

- **Automoderación en nuevos posts**: trigger `onPostSubmit` que analiza título, cuerpo y enlaces.
- **Reglas demo**: palabras tipo spam, lenguaje tóxico básico y enlaces sospechosos (acortadores, IP literal, algunos TLD).
- **Acción**: si hay infracciones, el post se **filtra** a la cola de moderación (`reddit.filter`) para revisión humana (menos agresivo que borrar al instante).
- **Herramientas “Mop”** (plantilla original): limpieza masiva de comentarios desde el menú de mods.

## Configuración del proyecto

| Archivo | Rol |
| --- | --- |
| `devvit.json` | **Fuente de verdad** para Devvit CLI (nombre, permisos, triggers, menús, build). |
| `devvit.yaml` | Espejo legible en YAML; **el CLI no lo carga** salvo que Reddit lo documente explícitamente — mantenlo alineado con `devvit.json` si lo usas como referencia. |
| `src/index.ts` | Punto de entrada del servidor (requerido por `@devvit/start`): arranca Hono con `serve`. |
| `src/main.ts` | Ensambla rutas `/api` e `/internal/*`. |
| `src/routes/triggers.ts` | `onAppInstall` + **`onPostSubmit`** → llama a las reglas y filtra si aplica. |
| `src/rules.ts` | Listas y evaluación de reglas. |
| `src/utils.ts` | Normalización de IDs (`t3_`), texto del post y extracción de URLs. |

## Requisitos

- Node.js **≥ 22.2** (según `package.json`).
- Cuenta de desarrollador y CLI autenticada (`npm run login`).

## Comandos

```bash
npm install
npm run dev        # playtest: build + instala en el sub de desarrollo y streaming de logs
npm run build      # empaqueta el servidor a dist/server/index.cjs
npm run type-check # tsc
npm run lint       # eslint
npm run test       # vitest (reglas en src/rules.test.ts)
npm run deploy     # type-check + lint + test + devvit upload
```

## Flujo de moderación automática

1. Un usuario publica un post en un sub donde la app está instalada.
2. Reddit invoca `POST /internal/triggers/on-post-submit` (declarado en `devvit.json`).
3. El handler lee `post` / `author`, arma el texto con `collectPostText`, extrae URLs y ejecuta `runModerationRules`.
4. Si hay violaciones, se registra cada una con `console.warn` y se llama a `reddit.filter` con un motivo combinado.
5. Si no hay violaciones, solo se deja traza en consola.

Se omiten posts ya marcados como spam/eliminados y el usuario `AutoModerator`.

## Personalización

- Edita listas en `src/rules.ts` (`SPAM_PHRASES`, `TOXIC_TERMS`, dominios acortadores, etc.).
- Para **borrar** en lugar de filtrar, puedes sustituir `reddit.filter` por `reddit.remove(postId, true | false)` según tu política (más riesgo de falsos positivos).

## Estructura actual del repo

```
src/
├── index.ts              # Entry del servidor Devvit
├── main.ts               # Construcción de la app Hono
├── utils.ts              # Helpers de texto / IDs / URLs
├── rules.ts              # Motor de reglas básicas
├── rules.test.ts         # Tests de reglas
├── core/
│   └── nuke.ts           # Lógica “Mop” (bulk comments)
└── routes/
    ├── api.ts
    ├── forms.ts
    ├── menu.ts
    └── triggers.ts       # Triggers + Mod Guardian onPostSubmit
```

## Documentación

- [Triggers (Devvit)](https://developers.reddit.com/docs/capabilities/server/triggers)
- [Devvit Web](https://developers.reddit.com/docs/)
