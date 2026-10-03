import type { ReactNode } from 'react'

interface DashboardLayoutProps {
  collapsed?: boolean
  sidebar?: ReactNode
  topBar?: ReactNode
  children: ReactNode
  rightPanel?: ReactNode
}

export function DashboardLayout({
  collapsed = false,
  sidebar,
  topBar,
  children,
  rightPanel,
}: DashboardLayoutProps) {
  return (
    <div className={`app-shell ${collapsed ? 'sidebar-collapsed' : ''}`}>
      {sidebar}

      <div className="app-center-region">
        {topBar}
        <main className="app-main-content">{children}</main>
      </div>

      {rightPanel}
    </div>
  )
}
