repo: francoalejandrob/adrian-gutierrez-arq
branch: master
path: app/(dashboard), components/dashboard, lib/content.ts, app/globals.css

## Last sync
date: 2026-08-21T14:08:43Z

### Updated in this project
- Diseñado el sistema visual completo de ARCHI.OS (panel admin, portal cliente, login) sobre la paleta y tipografía reales del repo (Fraunces + IBM Plex Sans/Mono, hueso/carbon/naranja/piedra/arena).
- Contenido de ejemplo tomado de los proyectos reales del estudio (Casa EG, Hormipen, Brangus, Tulum, Suite Palmar, Municipio de Salinas).
- Navegación y módulos alineados a las rutas ya construidas: dashboard, leads, clients, projects, finance, marketing, website, ai, notifications, login.

## Screen map
| Screen (ARCHI.OS.dc.html) | Repo source |
|---|---|
| Dashboard | app/(dashboard)/dashboard/page.tsx |
| CRM (Leads/Clientes/Pipeline) | app/(dashboard)/dashboard/leads/page.tsx, clients/page.tsx |
| Proyectos / Project Workspace | app/(dashboard)/dashboard/projects/page.tsx, projects/[id]/* |
| Finanzas | app/(dashboard)/dashboard/finance/page.tsx |
| Website / SEO | app/(dashboard)/dashboard/website/page.tsx |
| Marketing | app/(dashboard)/dashboard/marketing/page.tsx |
| Notificaciones | app/(dashboard)/dashboard/notifications/page.tsx |
| Archi AI | app/(dashboard)/dashboard/ai/page.tsx, ai/chat.tsx |
| Login | app/(dashboard)/login/page.tsx |
| Sidebar / nav | components/dashboard/sidebar.tsx, sidebar-nav.tsx |
| Brand tokens | app/globals.css, app/layout.tsx |
