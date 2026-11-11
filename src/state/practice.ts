export type PracticeGoal = 'jazz-blues' | 'technique' | 'custom'

export interface PracticePlan {
  goal: PracticeGoal
  customGoal: string
  minutes: 30 | 60
  activities: string[]
}

export interface PracticeBlock {
  name: string
  minutes: number
}

export const ACTIVITY_NAMES: Record<string, string> = {
  hanon: 'Ганон',
  pianomarvel: 'Piano Marvel',
  chords: 'Аккорды',
  scales: 'Гаммы',
  blues: 'Блюзовая импровизация',
  repertoire: 'Репертуар',
}

export const GOAL_NAMES: Record<PracticeGoal, string> = {
  'jazz-blues': 'Основы джаза и блюза',
  technique: 'Ежедневная техника',
  custom: 'Своя цель',
}

export const GOAL_ACTIVITIES: Record<PracticeGoal, string[]> = {
  'jazz-blues': ['chords', 'blues', 'repertoire'],
  technique: ['hanon', 'scales', 'pianomarvel'],
  custom: ['hanon', 'chords'],
}

const STORAGE_KEY = 'chord-trainer-practice-v1'

export const DEFAULT_PLAN: PracticePlan = {
  goal: 'jazz-blues',
  customGoal: '',
  minutes: 30,
  activities: [...GOAL_ACTIVITIES['jazz-blues']],
}

export function activityName(id: string): string {
  return ACTIVITY_NAMES[id] ?? id.slice(7)
}

export function practiceGoalName(plan: PracticePlan): string {
  return plan.goal === 'custom' ? plan.customGoal.trim() || GOAL_NAMES.custom : GOAL_NAMES[plan.goal]
}

export function buildPracticeBlocks(plan: PracticePlan): PracticeBlock[] {
  const activities = plan.activities.slice(0, plan.minutes)
  if (activities.length === 0) return []
  const base = Math.floor(plan.minutes / activities.length)
  const extra = plan.minutes % activities.length
  return activities.map((id, index) => ({
    name: activityName(id),
    minutes: base + (index < extra ? 1 : 0),
  }))
}

export function loadPracticePlan(): PracticePlan {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_PLAN, activities: [...DEFAULT_PLAN.activities] }
    const value: unknown = JSON.parse(raw)
    if (typeof value !== 'object' || value === null) throw new Error('Invalid plan')
    const plan = value as Partial<PracticePlan>
    if (!Object.keys(GOAL_NAMES).includes(plan.goal ?? '') || ![30, 60].includes(plan.minutes ?? 0)) {
      throw new Error('Invalid plan')
    }
    if (!Array.isArray(plan.activities)) throw new Error('Invalid activities')
    const activities = plan.activities.filter((id): id is string =>
      typeof id === 'string' && (Object.keys(ACTIVITY_NAMES).includes(id) || /^custom:.{1,60}$/.test(id)),
    ).slice(0, 12)
    if (activities.length === 0) throw new Error('Empty plan')
    return {
      goal: plan.goal!,
      customGoal: typeof plan.customGoal === 'string' ? plan.customGoal.slice(0, 80) : '',
      minutes: plan.minutes!,
      activities: [...new Set(activities)],
    }
  } catch {
    return { ...DEFAULT_PLAN, activities: [...DEFAULT_PLAN.activities] }
  }
}

export function savePracticePlan(plan: PracticePlan): void {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)) } catch {}
}
