interface AppHeaderProps {
  title?: string
  subtitle?: string
}

export function AppHeader({
  title = 'Task Manager',
  subtitle = 'Organize your day, one task at a time',
}: AppHeaderProps) {
  return (
    <header className="header">
      <h1>{title}</h1>
      <p className="subtitle">{subtitle}</p>
    </header>
  )
}
