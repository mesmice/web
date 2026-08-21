# concord-web

Aplicação Web do Concord. Interface principal da plataforma no navegador, consumindo os serviços da `concord-api`.

## Stack

- Vite 7 + React 19 + TypeScript (strict)
- TanStack Query para estado de servidor
- Zustand para estado de UI (tema claro/escuro persistido, status do gateway)
- React Router v7
- MSW para mocks de API derivados dos contratos
- Vitest + Testing Library (unit) e Playwright (E2E)

## Setup

Requisitos: Node.js >= 22.

```bash
npm install
cp .env.example .env.local
npm run dev
```

O dev server sobe em `http://localhost:5173` com proxy de `/api` para a API local (`http://localhost:3000`).

## Scripts

| Comando         | Ação                                    |
| --------------- | --------------------------------------- |
| `npm run dev`   | Desenvolvimento (Vite)                  |
| `npm run build` | Build de produção                       |
| `npm run preview` | Servir o build de produção            |
| `npm run typecheck` | Verificação de tipos                |
| `npm run lint`  | ESLint                                  |
| `npm test`      | Testes unitários (vitest + MSW)         |
| `npm run e2e`   | Testes E2E (Playwright, Chromium)       |

## Estrutura

```text
src/
├── main.tsx               Bootstrap (QueryClient, ThemeProvider, Router)
├── routes/                Router + layout raiz (header com status do gateway)
├── features/              Páginas por domínio (home, auth)
├── components/ui/         Componentes base (Button, Spinner, ThemeToggle)
├── lib/api/               Cliente HTTP tipado com envelope de erro padrão
├── lib/ws/                Cliente WebSocket com reconexão automática
├── lib/types/             Espelho local dos contratos até publicar @concord-mdm/contracts
├── providers/             Tema claro/escuro persistido (localStorage)
├── stores/                Estado global (Zustand)
├── styles/                Design tokens + reset
├── mocks/                 Handlers MSW (HTTP)
└── test/                  Setup de testes
```

## Contratos

O espelho local dos contratos está em `src/lib/types/api.ts`. Quando o pacote `@concord-mdm/contracts` for publicado no GitHub Packages, substituir por:

```bash
npm install @concord-mdm/contracts
```

com `.npmrc`:

```text
@concord-mdm:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_TOKEN}
```

## Contribuição

Siga as regras da organização ([repositório docs](https://github.com/concord-mdm/docs)): nada direto na `main`, branch descritiva → commit convencional → Pull Request → code review.

Roadmap desta fase: [docs/ROADMAP.md — Fase 1](https://github.com/concord-mdm/docs).
