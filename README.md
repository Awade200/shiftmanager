# Shift Manager

A web application for people who work rotating or variable shifts and need a clearer way to track schedules, hours and work patterns.

This project is part of my product portfolio and reflects how I approach practical workflow problems: understand the user journey, reduce manual admin, surface useful information and iterate around real use.

## What the product covers

The current product includes workflows for:

- adding individual shifts
- pasting or importing shift information
- viewing today's shifts and all shifts
- grouping shifts for easier review
- calendar-based schedule viewing
- analytics and work-pattern insights
- authentication and personal settings

## Product thinking

The core problem is simple: shift workers often receive schedules in different formats and then have to manually work out what they are doing, when they are working and how their pattern is changing.

The product brings those tasks into one place and turns raw shift information into a usable operational view.

Key product themes:

- **Workflow clarity** — make it fast to capture and review shifts.
- **Information hierarchy** — show today's work first, then broader schedule context.
- **Data visibility** — use analytics to make working patterns easier to understand.
- **Flexible input** — support more than one way of entering shift information.
- **Privacy-conscious configuration** — application secrets and environment configuration are kept outside source control.

## Technology

- React
- TypeScript
- Vite
- Tailwind CSS
- shadcn/ui
- Supabase
- TanStack Query
- React Router
- Recharts

## Run locally

```bash
git clone https://github.com/Awade200/shiftmanager.git
cd shiftmanager
npm install
cp .env.example .env
npm run dev
```

Add your own Supabase project values to `.env` before using features that require the backend.

## Why this project matters in my portfolio

Shift Manager demonstrates my ability to move from an everyday operational problem to a structured digital workflow. It also shows hands-on collaboration with product design, frontend implementation, data-backed views and backend services.

My wider work focuses on Product, HealthTech and operational systems.

## More about my work

- Portfolio: https://lawal-healthtech-portfolio.vercel.app
- LinkedIn: https://www.linkedin.com/in/lawal-sulaiman-3a4331295/

---

**Lawal Sulaiman Adetunji**  
Product & Operations | HealthTech | Digital Systems
