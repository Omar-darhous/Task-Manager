# Task Manager

A full-stack task management application featuring a polished React + TypeScript + Vite frontend and a secure, production-grade Express + TypeScript + MongoDB backend foundation.

---

## Repository Structure

```
task-manager/
├── .github/
│   └── workflows/
│       ├── ci.yml        # Main CI workflow (Frontend & Backend)
│       └── docker.yml    # Docker build & Compose validation
├── frontend/             # Independent React + TypeScript + Vite client application
│   ├── public/           # Static assets
│   ├── src/              # React components, hooks, services, styles, types
│   ├── package.json      # Frontend dependencies and scripts
│   ├── tsconfig.json     # Frontend TypeScript configuration
│   └── vite.config.ts    # Vite bundler configuration
│
├── backend/              # Node.js + Express + TypeScript + Mongoose API service
│   ├── src/
│   │   ├── config/       # Environment, Database, Swagger OpenAPI specs
│   │   ├── controllers/  # Request handling and response formatting
│   │   ├── middleware/   # Centralized error handler, request validator
│   │   ├── models/       # Mongoose models (User, Task, Category)
│   │   ├── routes/       # Express route definitions and routers
│   │   ├── schemas/      # Zod validation schemas
│   │   ├── services/     # Business logic layer
│   │   ├── utils/        # Logger, AppError classes
│   │   ├── app.ts        # Express app configuration & middleware
│   │   └── server.ts     # Server entrypoint and graceful shutdown
│   ├── .env.example      # Environment variable template
│   ├── package.json      # Backend dependencies and scripts
│   └── tsconfig.json     # Backend TypeScript configuration (ESM / NodeNext)
│
├── .dockerignore         # Docker ignore configuration
├── docker-compose.yml    # Container orchestration configuration
├── .gitignore            # Monorepo-level gitignore
└── README.md             # Project documentation
```

---

## Frontend Setup & Execution

The frontend is an independent Vite single-page application. During Phase 10, it continues to use its existing local state, localStorage, and mock API integration.

### Prerequisites

- Node.js (v18+ recommended)
- npm (v9+)

### Running Frontend Locally

```bash
# Navigate to the frontend workspace
cd frontend

# Install dependencies
npm install

# Start the Vite development server
npm run dev
```

The frontend will be available at [http://localhost:5173](http://localhost:5173).

### Frontend Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Type-check and build production bundle |
| `npm run lint` | Run ESLint code checks |
| `npm run preview` | Locally preview production build |

---

## Backend Setup & Execution

The backend is built with Node.js, Express, TypeScript, MongoDB, and Mongoose. It uses native ES modules (`NodeNext`) and Zod schema validation.

### Environment Configuration

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
3. Configure the environment variables in `.env`:

| Variable | Description | Default / Example |
|----------|-------------|-------------------|
| `PORT` | Port number for the HTTP server | `5000` |
| `NODE_ENV` | Application environment (`development`, `production`, `test`) | `development` |
| `MONGODB_URI` | MongoDB connection string | `mongodb://localhost:27017/task_manager` |
| `CLIENT_URL` | Allowed frontend origin for CORS | `http://localhost:5173` |

> **Security Note:** Never commit `.env` or any real database credentials to Git. The `.env` file is ignored by `.gitignore`.

### Running Backend Locally

```bash
# Navigate to the backend workspace
cd backend

# Install dependencies
npm install

# Start development server with live reload
npm run dev

# Or build and run production bundle
npm run build
npm run start
```

When started, the backend services are available at:
- **API Base:** `http://localhost:5000/api`
- **Health Check:** `http://localhost:5000/api/health`
- **Swagger Documentation:** `http://localhost:5000/api/docs`

### Backend Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run development server with live watching (`tsx watch`) |
| `npm run build` | Compile TypeScript to JavaScript in `dist/` |
| `npm run start` | Run compiled server with Node.js (`node dist/server.js`) |

---

## API Endpoints Overview

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/health` | Service, environment, uptime, and database health status |
| `GET` | `/api/health/readiness` | Readiness probe (checks DB connectivity, returns 200/503) |
| `GET` | `/api/health/liveness` | Liveness probe (checks process vitality, returns 200) |
| `GET` | `/api/docs` | Interactive Swagger / OpenAPI documentation |
| `POST` | `/api/auth/register` | Register new user account |
| `POST` | `/api/auth/login` | Authenticate and obtain JWT token |
| `GET` | `/api/auth/me` | Fetch authenticated user profile |
| `PATCH` | `/api/users/me` | Update authenticated user name/email |
| `PATCH` | `/api/users/me/password` | Change user password |
| `GET` | `/api/tasks` | List user tasks (supports filters & sorting) |
| `POST` | `/api/tasks` | Create task with Zod validation |
| `GET` | `/api/tasks/:id` | Get task details by ID |
| `PATCH` | `/api/tasks/:id` | Update task with Zod validation |
| `PATCH` | `/api/tasks/bulk` | Bulk complete, activate, or delete tasks |
| `DELETE` | `/api/tasks/:id` | Delete task |
| `GET` | `/api/categories` | List user categories |
| `POST` | `/api/categories` | Create category with duplicate prevention |
| `PATCH` | `/api/categories/:id` | Rename category (cascades to user tasks) |
| `DELETE` | `/api/categories/:id` | Delete category (reassigns tasks to General) |

---

## Docker & Containerization

The repository provides multi-stage production Docker configurations for both frontend and backend services, orchestrated using `docker-compose.yml`.

> **Note:** The application uses MongoDB Atlas as its managed cloud database. No local MongoDB container is required or configured.

### Environment Setup

1. Copy `.env.example` in both workspaces:
   ```bash
   cp backend/.env.example backend/.env
   cp frontend/.env.example frontend/.env
   ```
2. Populate the required environment variables:
   * `backend/.env`: Set `MONGODB_URI`, `JWT_SECRET` (at least 32 characters in production), and `CLIENT_URL`.
   * `frontend/.env`: Set `VITE_API_URL` (e.g. `http://localhost:5000/api`).

### Running with Docker Compose

```bash
# Validate compose configuration
docker compose config

# Build container images
docker compose build

# Start services in detached mode
docker compose up -d

# Check service logs
docker compose logs -f

# Stop services
docker compose down
```

### Individual Image Builds

```bash
# Backend (Multi-stage Node.js Alpine image running non-root)
docker build -t task-manager-backend ./backend

# Frontend (Multi-stage build served via Nginx with SPA routing)
docker build -t task-manager-frontend ./frontend
```

---

## Health & Monitoring Probes

* **`GET /api/health`**: General application health status. Returns API status, database connectivity status, environment, version, and uptime.
* **`GET /api/health/readiness`**: Kubernetes/container readiness probe. Returns HTTP 200 when initialized and connected to MongoDB; returns HTTP 503 if the database is unreachable.
* **`GET /api/health/liveness`**: Kubernetes/container liveness probe. Returns HTTP 200 indicating the Node.js process is responsive.

---

## Automated Test Suites

From the `backend` workspace:

```bash
# Phase 11: Authentication, JWT, and Data Ownership isolation suite (19 tests)
npm run test:auth

# Phase 12: Profile, Password, Bulk Operations, Category Cascades suite (20 tests)
npm run test:phase12

# Phase 13: Health, Readiness, Liveness, Logger, and Config suite (10 tests)
npm run test:phase13
```

---

## CI/CD Automation & GitHub Actions

TaskFlow features an automated Continuous Integration pipeline implemented with GitHub Actions that runs on every pull request and push to the `main` branch.

> **Important:** Phase 14 establishes CI validation workflows only. It does **not** deploy the application or publish container images to any registry.

### Workflow Architecture

```
.github/
└── workflows/
    ├── ci.yml       # Main CI: Frontend lint & build, Backend build & tests
    └── docker.yml   # Container CI: Multi-stage Docker builds & Compose validation
```

#### 1. Main CI Workflow (`ci.yml`)

Runs two parallel, independent jobs:
* **Frontend CI (`frontend`)**:
  * Environment: Ubuntu latest, Node.js 20 LTS with npm dependency caching
  * Clean installation via `npm ci`
  * Static code analysis with ESLint: `npm run lint`
  * TypeScript typecheck and production build: `npm run build`
* **Backend CI (`backend`)**:
  * Environment: Ubuntu latest, Node.js 20 LTS with npm dependency caching
  * Clean installation via `npm ci`
  * TypeScript compilation: `npm run build`
  * Phase 11 Authentication & Data Ownership suite: `npm run test:auth`
  * Phase 12 Profile, Password & Bulk Operations suite: `npm run test:phase12`
  * Phase 13 Production Readiness & Health suite: `npm run test:phase13`

#### 2. Docker Validation Workflow (`docker.yml`)

Validates containerization and multi-stage builds without pushing to a registry:
* **Backend Docker Build**: Validates multi-stage build (`node:20-alpine`), TypeScript compilation, non-root `node` user execution.
* **Frontend Docker Build**: Validates client build with `VITE_API_URL` build argument and Nginx Alpine static serving.
* **Docker Compose Validation**: Validates `docker-compose.yml` syntax, service definitions (`frontend`, `backend`), port mappings (`5000:5000`, `3000:80`), service dependencies (`depends_on`), and ensures no local database service is introduced.

### Required GitHub Secrets

To execute the backend integration test suites in GitHub Actions against MongoDB Atlas, configure the following repository secrets under **Settings > Secrets and variables > Actions**:

| Secret Name | Description | Example / Format |
|-------------|-------------|------------------|
| `MONGODB_URI` | MongoDB Atlas connection string for CI testing | `mongodb+srv://<user>:<password>@cluster.mongodb.net/test_db?retryWrites=true&w=majority` |
| `JWT_SECRET` | Secret key for JWT signing (minimum 10 characters for test/dev, 32 for production) | `ci-secret-token-key-must-be-at-least-32-chars` |
| `CLIENT_URL` *(optional)* | Allowed CORS origin (defaults to `http://localhost:5173`) | `http://localhost:5173` |

> **Credential Handling & Security:** If secrets are omitted or unconfigured, the backend build passes, but integration test suites will fail clearly and report missing database credentials without exposing any secret values in logs. GitHub Actions automatically masks all configured secrets in workflow execution logs.

### Reproducing CI Checks Locally

To replicate the CI pipeline locally, execute the following commands:

```bash
# --- Frontend Checks ---
cd frontend
npm ci
npm run lint
npm run build

# --- Backend Checks ---
cd ../backend
npm ci
npm run build
npm run test:auth
npm run test:phase12
npm run test:phase13

# --- Docker Checks (requires Docker CLI & daemon) ---
cd ..
docker compose config
docker build -t task-manager-backend ./backend
docker build -t task-manager-frontend ./frontend
```


