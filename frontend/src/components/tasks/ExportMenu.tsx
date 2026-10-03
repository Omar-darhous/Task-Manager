import { useState, useRef, useEffect } from 'react'
import { Icon } from '../ui/Icon'
import type { Todo } from '../../types/todo'
import { exportTasksToCsv, exportTasksToJson } from '../../utils/taskExport'

interface ExportMenuProps {
  tasks: Todo[]
  onShowToast: (message: string) => void
}

export function ExportMenu({ tasks, onShowToast }: ExportMenuProps) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    window.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [open])

  const handleExportCsv = () => {
    setOpen(false)
    if (tasks.length === 0) {
      onShowToast('No tasks to export')
      return
    }
    exportTasksToCsv(tasks)
    onShowToast(`Exported ${tasks.length} task${tasks.length === 1 ? '' : 's'} as CSV`)
  }

  const handleExportJson = () => {
    setOpen(false)
    if (tasks.length === 0) {
      onShowToast('No tasks to export')
      return
    }
    exportTasksToJson(tasks)
    onShowToast(`Exported ${tasks.length} task${tasks.length === 1 ? '' : 's'} as JSON`)
  }

  return (
    <div className="export-menu-container" ref={menuRef}>
      <button
        type="button"
        className="btn btn-ghost"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="true"
        aria-expanded={open}
        aria-label="Export tasks"
        title="Export tasks as CSV or JSON"
      >
        <Icon name="download" size={15} />
        <span>Export</span>
      </button>

      {open && (
        <div className="export-dropdown-menu" role="menu" aria-label="Export formats">
          <button
            type="button"
            className="export-menu-item"
            role="menuitem"
            onClick={handleExportCsv}
          >
            <Icon name="file-text" size={15} />
            <span>Export as CSV</span>
          </button>
          <button
            type="button"
            className="export-menu-item"
            role="menuitem"
            onClick={handleExportJson}
          >
            <Icon name="database" size={15} />
            <span>Export as JSON</span>
          </button>
        </div>
      )}
    </div>
  )
}
