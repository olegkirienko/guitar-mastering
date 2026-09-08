# 🎸 Гітара з нуля

Інтерактивний курс для вивчення класичної шестиструнної гітари з нуля.

## Stack

- React 19
- TypeScript
- Vite
- Tailwind CSS v4
- Untitled UI React ecosystem / React Aria
- pnpm
- GitHub Pages

## Local development

```bash
pnpm install
pnpm dev
```

Build:

```bash
pnpm build
```

Preview production build:

```bash
pnpm preview
```

## GitHub Pages

Проєкт використовує `HashRouter`, тому він коректно працює як статичний сайт на GitHub Pages без server-side routing.

Vite налаштований з `base: './'`, тому збірка використовує відносні asset paths.

## Structure

```text
src/
├── components/   # reusable UI
├── data/         # course data
├── lib/          # utilities
├── pages/        # route-level pages
├── styles/       # global Tailwind/theme
├── App.tsx
└── main.tsx
```

## Version

**v0.2.0** — React/Vite/TypeScript/Tailwind foundation + first lesson.

Наступні зміни робимо після проходження першого уроку та фідбеку.
