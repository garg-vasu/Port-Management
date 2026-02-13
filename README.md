# POR Management

A consignment (NFA) tracking and management system built with React, TypeScript, and Vite.

## Features

### Public Pages
- **Consignment Search** (`/nfa-search`) — Public page where anyone can enter a consignment code to track its status and pipeline progress. No login required.
- **Login** (`/login`) — Authentication page for admin/staff users.

### Authenticated Pages (require login)
- **Dashboard** (`/`) — Overview with consignment stats (Active, Under Custom, Pending Document) and tabbed views for Pending and Completed consignments.
- **Consignment Detail** (`/nfa-detail/:nfa_id`) — Detailed view of a specific consignment including basic info, status, progress bar, file attachments, and pipeline stage visualization.
- **Add Consignment** (`/add/nfa`) — Form to create a new consignment (NFA).
- **Approval Workflow** (`/working-nfa/:nfa_id/:stage_id`) — Stage-based approval interface for processing consignments.
- **User Management** (`/users`, `/user-creation`, `/edit-user/:user_id`) — Create, view, and edit system users.
- **Stage Management** (`/stages`, `/add/stage`, `/order-selection`) — Configure pipeline stages and their ordering.

## Tech Stack

- **Framework:** React 19 + TypeScript
- **Build Tool:** Vite 7
- **Routing:** React Router 7
- **Styling:** Tailwind CSS 4 + shadcn/ui components
- **HTTP Client:** Axios
- **Forms:** React Hook Form + Zod validation
- **Tables:** TanStack React Table
- **PDF Export:** jsPDF + jspdf-autotable
- **Icons:** Lucide React
- **Notifications:** Sonner (toast)

## Getting Started

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
npm install
```

### Environment Variables

Create a `.env` file in the project root:

```env
VITE_API_URL=http://your-api-url
```

### Development

```bash
npm run dev
```

### Build

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

### Lint

```bash
npm run lint
```

## Project Structure

```
src/
├── components/ui/    # Reusable shadcn/ui components
├── Layout/           # MainLayout, Sidebar, TopBar
├── Pages/
│   ├── nfa/          # Consignment pages (list, detail, add, approval)
│   ├── User/         # User management pages
│   ├── Stage/        # Stage configuration pages
│   ├── NfaSearchPage.tsx   # Public consignment search
│   └── login.tsx     # Login page
├── Provider/         # Context providers (UserProvider)
├── utils/            # API client, date formatting, helpers
└── Routes.tsx        # Route definitions
```
