export interface DueDateStatus {
  label: string
  isOverdue: boolean
  isToday: boolean
}

const pad = (n: number) => String(n).padStart(2, '0')

/**
 * Returns YYYY-MM-DD string for a given Date in local time.
 */
export function toYMD(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/**
 * Returns today's date formatted as YYYY-MM-DD in local time.
 */
export function getTodayYMD(): string {
  return toYMD(new Date())
}

/**
 * Checks if two date representations point to the same local day.
 */
export function isSameDay(date1Str?: string, date2Str?: string): boolean {
  if (!date1Str || !date2Str) return false
  const d1 = date1Str.split('T')[0]
  const d2 = date2Str.split('T')[0]
  return d1 === d2
}

/**
 * Formats due date with contextual labels: Overdue, Today, Tomorrow, or "MMM D".
 */
export function formatDueDate(dueDateStr?: string): DueDateStatus | null {
  if (!dueDateStr) return null

  const parts = dueDateStr.split('T')[0].split('-').map(Number)
  if (parts.length < 3 || Number.isNaN(parts[0])) return null

  const [year, month, day] = parts
  const due = new Date(year, month - 1, day)
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())

  const diffTime = due.getTime() - today.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays < 0) {
    return { label: 'Overdue', isOverdue: true, isToday: false }
  }
  if (diffDays === 0) {
    return { label: 'Today', isOverdue: false, isToday: true }
  }
  if (diffDays === 1) {
    return { label: 'Tomorrow', isOverdue: false, isToday: false }
  }

  const formatted = due.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })
  return { label: formatted, isOverdue: false, isToday: false }
}

export interface CalendarDay {
  dateStr: string // YYYY-MM-DD
  dayNumber: number
  isCurrentMonth: boolean
  isToday: boolean
}

/**
 * Generates an array of CalendarDay objects for a 6-week or 5-week month grid.
 */
export function getCalendarGrid(year: number, month: number): CalendarDay[] {
  const todayYMD = getTodayYMD()

  // First day of target month (0 = Sunday, 1 = Monday, etc.)
  const firstDayOfMonth = new Date(year, month, 1)
  const startingDayOfWeek = firstDayOfMonth.getDay()

  // Number of days in target month
  const daysInMonth = new Date(year, month + 1, 0).getDate()

  // Number of days in previous month
  const daysInPrevMonth = new Date(year, month, 0).getDate()

  const days: CalendarDay[] = []

  // Leading days from previous month aligned to Monday (0=Mon, 1=Tue, ..., 6=Sun)
  const leadingDaysCount = (startingDayOfWeek + 6) % 7
  for (let i = leadingDaysCount - 1; i >= 0; i--) {
    const dayNumber = daysInPrevMonth - i
    const prevDate = new Date(year, month - 1, dayNumber)
    const dateStr = toYMD(prevDate)
    days.push({
      dateStr,
      dayNumber,
      isCurrentMonth: false,
      isToday: dateStr === todayYMD,
    })
  }

  // Days in current month
  for (let d = 1; d <= daysInMonth; d++) {
    const curDate = new Date(year, month, d)
    const dateStr = toYMD(curDate)
    days.push({
      dateStr,
      dayNumber: d,
      isCurrentMonth: true,
      isToday: dateStr === todayYMD,
    })
  }


  // Trailing days from next month to complete the row
  const remainingCells = (7 - (days.length % 7)) % 7
  for (let n = 1; n <= remainingCells; n++) {
    const nextDate = new Date(year, month + 1, n)
    const dateStr = toYMD(nextDate)
    days.push({
      dateStr,
      dayNumber: n,
      isCurrentMonth: false,
      isToday: dateStr === todayYMD,
    })
  }

  return days
}
