# Task Manager

A modern task manager built with **React + TypeScript + Vite**, powered by the free [DummyJSON](https://dummyjson.com/docs/todos) REST API.

## Features

- Load sample tasks from DummyJSON on first visit
- Add, edit, complete, and delete tasks
- Filter by All / Active / Completed
- Progress stats with completion percentage
- Tasks persist in **localStorage** (DummyJSON is a mock API — changes are saved locally)

## API Used

**DummyJSON Todos API** — free, no API key required:

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `https://dummyjson.com/todos` | Fetch all todos |
| POST | `https://dummyjson.com/todos/add` | Add a todo (simulated) |
| PUT/PATCH | `https://dummyjson.com/todos/:id` | Update a todo (simulated) |
| DELETE | `https://dummyjson.com/todos/:id` | Delete a todo (simulated) |

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |

## Project Structure

```
src/
├── components/     # UI components (TaskForm, TaskList, etc.)
├── hooks/          # useTodos custom hook
├── services/       # DummyJSON API + localStorage layer
└── types/          # TypeScript interfaces
```
