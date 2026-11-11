import {
  ACTIVITY_NAMES, GOAL_ACTIVITIES, GOAL_NAMES,
  activityName, buildPracticeBlocks, loadPracticePlan, practiceGoalName, savePracticePlan,
  type PracticeBlock, type PracticeGoal,
} from '../state/practice'

type Tab = 'chords' | 'plan' | 'session'

let plan = loadPracticePlan()
let sessionGoal = practiceGoalName(plan)
let sessionMinutes = plan.minutes
let blocks: PracticeBlock[] = []
let blockIndex = 0
let remaining = 0
let deadline = 0
let running = false
let finished = false
let timer: ReturnType<typeof setInterval> | null = null

const escapeHtml = (value: string): string => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char]!)

function selectTab(tab: Tab): void {
  document.querySelectorAll<HTMLButtonElement>('[data-tab]').forEach(button => {
    const active = button.dataset['tab'] === tab
    button.setAttribute('aria-selected', String(active))
    button.classList.toggle('active', active)
  })
  document.querySelectorAll<HTMLElement>('[data-tab-panel]').forEach(panel => {
    panel.hidden = panel.dataset['tabPanel'] !== tab
  })
}

function renderPlan(): void {
  const el = document.querySelector<HTMLElement>('#practice-plan')!
  const activityOptions = Object.entries(ACTIVITY_NAMES).map(([id, name]) => `
    <label class="practice-option">
      <input type="checkbox" value="${id}"${plan.activities.includes(id) ? ' checked' : ''}>
      <span>${name}</span>
    </label>`).join('')
  const customOptions = plan.activities.filter(id => id.startsWith('custom:')).map(id => `
    <div class="practice-custom-item"><span>${escapeHtml(activityName(id))}</span>
      <button class="btn practice-remove" data-remove="${escapeHtml(id)}" aria-label="Убрать ${escapeHtml(activityName(id))}">✕</button>
    </div>`).join('')
  const preview = buildPracticeBlocks(plan).map(block => `
    <li><span>${escapeHtml(block.name)}</span><strong>${block.minutes} мин</strong></li>`).join('')

  el.innerHTML = `
    <div class="practice-intro"><h1>План занятий</h1>
      <p>Выберите цель и упражнения. Время распределится между ними поровну.</p></div>
    <div class="practice-card">
      <label for="practice-goal">Цель</label>
      <select id="practice-goal">${(Object.keys(GOAL_NAMES) as PracticeGoal[]).map(goal =>
        `<option value="${goal}"${goal === plan.goal ? ' selected' : ''}>${GOAL_NAMES[goal]}</option>`,
      ).join('')}</select>
      ${plan.goal === 'custom' ? `<input id="practice-custom-goal" type="text" maxlength="80"
        value="${escapeHtml(plan.customGoal)}" placeholder="Например, выучить блюз в F"
        aria-label="Название своей цели">` : ''}
      <fieldset class="practice-duration"><legend>Время занятия</legend>
        <label><input type="radio" name="practice-minutes" value="30"${plan.minutes === 30 ? ' checked' : ''}> 30 минут</label>
        <label><input type="radio" name="practice-minutes" value="60"${plan.minutes === 60 ? ' checked' : ''}> 60 минут</label>
      </fieldset>
    </div>
    <div class="practice-card"><h2>Чем заниматься</h2>
      <div class="practice-options">${activityOptions}</div>
      <div class="practice-custom">${customOptions}</div>
      <form id="practice-add-form" class="practice-add">
        <input id="practice-add-name" type="text" maxlength="60" placeholder="Своё упражнение" aria-label="Своё упражнение">
        <button class="btn" type="submit">Добавить</button>
      </form>
      <p id="practice-error" class="practice-error" role="status"></p>
    </div>
    <div class="practice-card"><h2>Порядок занятия</h2>
      <ol class="practice-preview">${preview}</ol>
      <button id="practice-start" class="btn btn-primary">Начать занятие</button>
    </div>`
}

function saveAndRender(): void {
  savePracticePlan(plan)
  renderPlan()
}

function saveAndUpdatePreview(): void {
  savePracticePlan(plan)
  document.querySelector<HTMLElement>('#practice-plan .practice-preview')!.innerHTML =
    buildPracticeBlocks(plan).map(block => `
      <li><span>${escapeHtml(block.name)}</span><strong>${block.minutes} мин</strong></li>`).join('')
}

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}

function renderSession(): void {
  const el = document.querySelector<HTMLElement>('#practice-session')!
  if (blocks.length === 0) {
    el.innerHTML = '<div class="practice-empty"><h1>Занятие</h1><p>Сначала составьте план.</p><button class="btn btn-primary" id="session-plan">К плану</button></div>'
    return
  }
  if (finished) {
    el.innerHTML = `<div class="practice-empty"><h1>Занятие завершено</h1>
      <p>${sessionMinutes} минут по плану «${escapeHtml(sessionGoal)}».</p>
      <button class="btn btn-primary" id="session-again">Повторить</button>
      <button class="btn" id="session-plan">Изменить план</button></div>`
    return
  }
  const current = blocks[blockIndex]!
  const items = blocks.map((block, index) => `
    <li class="${index === blockIndex ? 'current' : index < blockIndex ? 'done' : ''}">
      <span>${index < blockIndex ? '✓ ' : ''}${escapeHtml(block.name)}</span>
      <span>${block.minutes} мин</span>
    </li>`).join('')
  el.innerHTML = `
    <div class="practice-intro"><h1>Занятие</h1><p>${escapeHtml(sessionGoal)} · ${sessionMinutes} минут</p></div>
    <div class="practice-card practice-now">
      <p class="practice-step">Блок ${blockIndex + 1} из ${blocks.length}</p>
      <h2>${escapeHtml(current.name)}</h2>
      <div class="practice-clock" role="timer" aria-label="Осталось времени">${formatTime(remaining)}</div>
      <div class="practice-session-actions">
        <button class="btn btn-primary" id="session-toggle">${running ? 'Пауза' : 'Продолжить'}</button>
        <button class="btn" id="session-next">${blockIndex === blocks.length - 1 ? 'Завершить' : 'Следующее →'}</button>
      </div>
      ${current.name === ACTIVITY_NAMES['chords'] ? '<button class="btn practice-chords" id="session-chords">Открыть тренажёр аккордов</button>' : ''}
    </div>
    <div class="practice-card"><h2>План</h2><ol class="practice-preview">${items}</ol></div>`
}

function stopTimer(): void {
  if (timer) clearInterval(timer)
  timer = null
  running = false
}

function nextBlock(): void {
  if (blockIndex === blocks.length - 1) {
    stopTimer()
    finished = true
  } else {
    blockIndex++
    remaining = blocks[blockIndex]!.minutes * 60
    if (running) deadline = Date.now() + remaining * 1000
  }
  renderSession()
}

function tick(): void {
  if (!running) return
  const now = Date.now()
  while (deadline <= now && !finished) {
    if (blockIndex === blocks.length - 1) {
      stopTimer()
      finished = true
    } else {
      blockIndex++
      deadline += blocks[blockIndex]!.minutes * 60_000
    }
  }
  remaining = finished ? 0 : Math.max(0, Math.ceil((deadline - now) / 1000))
  renderSession()
}

function toggleTimer(): void {
  if (running) {
    tick()
    stopTimer()
  } else {
    running = true
    deadline = Date.now() + remaining * 1000
    timer = setInterval(tick, 1000)
  }
  renderSession()
}

function startSession(): void {
  stopTimer()
  blocks = buildPracticeBlocks(plan)
  sessionGoal = practiceGoalName(plan)
  sessionMinutes = plan.minutes
  blockIndex = 0
  remaining = blocks[0]!.minutes * 60
  finished = false
  selectTab('session')
  toggleTimer()
}

export function initPractice(): void {
  renderPlan()
  renderSession()

  document.querySelector<HTMLElement>('.app-tabs')!.addEventListener('click', event => {
    const button = (event.target as Element).closest<HTMLButtonElement>('[data-tab]')
    if (button) selectTab(button.dataset['tab'] as Tab)
  })

  const planEl = document.querySelector<HTMLElement>('#practice-plan')!
  planEl.addEventListener('input', event => {
    const target = event.target as HTMLInputElement
    if (target.id === 'practice-custom-goal') {
      plan = { ...plan, customGoal: target.value }
      savePracticePlan(plan)
    }
  })
  planEl.addEventListener('change', event => {
    const target = event.target as HTMLInputElement | HTMLSelectElement
    if (target.id === 'practice-goal') {
      plan = { ...plan, goal: target.value as PracticeGoal, activities: [...GOAL_ACTIVITIES[target.value as PracticeGoal]] }
      saveAndRender()
      return
    } else if (target.name === 'practice-minutes') {
      plan = { ...plan, minutes: Number(target.value) as 30 | 60 }
    } else if (target.type === 'checkbox') {
      const activities = target.checked
        ? [...plan.activities, target.value]
        : plan.activities.filter(id => id !== target.value)
      if (activities.length === 0) {
        target.checked = true
        planEl.querySelector<HTMLElement>('#practice-error')!.textContent = 'Оставьте хотя бы одно упражнение'
        return
      }
      plan = { ...plan, activities }
    } else return
    saveAndUpdatePreview()
  })
  planEl.addEventListener('submit', event => {
    event.preventDefault()
    const input = planEl.querySelector<HTMLInputElement>('#practice-add-name')!
    const name = input.value.trim()
    if (!name) return
    const id = `custom:${name}`
    if (!plan.activities.includes(id) && plan.activities.length < 12) {
      plan = { ...plan, activities: [...plan.activities, id] }
    }
    saveAndRender()
  })
  planEl.addEventListener('click', event => {
    const target = event.target as Element
    const remove = target.closest<HTMLButtonElement>('[data-remove]')
    if (remove) {
      const activities = plan.activities.filter(id => id !== remove.dataset['remove'])
      if (activities.length > 0) { plan = { ...plan, activities }; saveAndRender() }
    }
    if (target.closest('#practice-start')) startSession()
  })

  document.querySelector<HTMLElement>('#practice-session')!.addEventListener('click', event => {
    const target = event.target as Element
    if (target.closest('#session-toggle')) toggleTimer()
    if (target.closest('#session-next')) nextBlock()
    if (target.closest('#session-plan')) selectTab('plan')
    if (target.closest('#session-again')) startSession()
    if (target.closest('#session-chords')) selectTab('chords')
  })
}
