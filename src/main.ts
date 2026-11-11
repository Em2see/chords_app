import './style.css'
import { buildChord, chordDisplay, CHORD_TYPES, type ChordType } from './theory/chords'
import { leadVoice, voiceMovement, type Voicing } from './theory/voicing'
import {
  circleOfFifths, circleOfFourths, iiVIAllKeys,
  diatonicMajor, chromaticUp, chromaticDown, randomProgression,
  type ChordSpec,
} from './theory/progressions'
import { noteDisplay } from './theory/notes'
import {
  loadSettings, saveSettings, keyRootNote, KEY_ROOTS, DEFAULT,
  type Settings, type ProgressionMode, type InversionMode, type AccidentalFilter,
} from './state/settings'
import { renderKeyboard, type KeyHighlight } from './ui/keyboard'
import { playChord } from './audio/synth'
import { Metronome } from './audio/metronome'
import { unlockAudio } from './audio/context'
import { startMic } from './audio/mic'
import { initPractice } from './ui/practice'

const THEME_KEY = 'chord-trainer-theme'

// ── state ──────────────────────────────────────────────────────────────────
let settings: Settings = loadSettings()
let progression: ChordSpec[] = []
let pos = 0
let prevV: Voicing | null = null
let curV:  Voicing | null = null
let hintRevealed = true
let hintTimer: ReturnType<typeof setTimeout> | null = null
let sessionCount = 0
let currentBeat  = -1

// microphone
let micActive = false
let micStop:   (() => void) | null = null
let micMatched: Set<number> = new Set()   // target MIDIs confirmed by mic

// mobile keyboard visibility
let kbdVisible = false

// ── metronome ──────────────────────────────────────────────────────────────
const metro = new Metronome(settings.bpm, settings.beatsPerChord, {
  onBeat:    (beat) => { currentBeat = beat; renderBeats() },
  onAdvance: () => { if (settings.autoAdvance) advance() },
})

// ── progression ────────────────────────────────────────────────────────────
function genRaw(): ChordSpec[] {
  const { progressionMode: m, chordType: t, seam } = settings
  const kr = keyRootNote(settings)
  if (m === 'fifths')         return circleOfFifths(t, { seam })
  if (m === 'fourths')        return circleOfFourths(t, { seam })
  if (m === 'ii-V-I')         return iiVIAllKeys({ seam })
  if (m === 'diatonic')       return diatonicMajor(kr)
  if (m === 'chromatic-up')   return chromaticUp(t, kr)
  if (m === 'chromatic-down') return chromaticDown(t, kr)
  return randomProgression(t)
}

function applyAccidentalFilter(specs: ChordSpec[]): ChordSpec[] {
  const f = settings.accidentalFilter
  if (f === 'both') return specs
  const filtered = specs.filter(s => {
    if (f === 'no-flats')  return s.root.alt >= 0
    if (f === 'no-sharps') return s.root.alt <= 0
    if (f === 'naturals')  return s.root.alt === 0
    return true
  })
  return filtered.length > 0 ? filtered : specs
}

function genProgression(): ChordSpec[] { return applyAccidentalFilter(genRaw()) }

function allowedInversions(chordSize: number): readonly number[] | undefined {
  const m = settings.inversionMode
  if (m === 'all')      return undefined
  if (m === 'root')     return [0]
  if (m === 'first')    return [1]
  if (m === 'second')   return [2]
  if (m === 'non-root') return Array.from({ length: chordSize - 1 }, (_, i) => i + 1)
  return undefined
}

function initProgression() {
  progression = genProgression()
  pos = 0
  prevV = null
  const spec = progression[0]!
  const chord = buildChord(spec.root, spec.type)
  curV = leadVoice(chord, null, { allowedInversions: allowedInversions(chord.notes.length) })
  startHintCycle()
}

// ── hint lifecycle ─────────────────────────────────────────────────────────
function startHintCycle() {
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = null }
  if (settings.hintLevel === 1) {
    hintRevealed = true
  } else if (settings.hintLevel === 2) {
    hintRevealed = false
    hintTimer = setTimeout(
      () => { hintRevealed = true; renderKbd(); updateHintBtn() },
      settings.hintDelay * 1000,
    )
  } else {
    hintRevealed = false
  }
  updateHintBtn()
}

function revealHint() {
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = null }
  if (hintRevealed) return
  hintRevealed = true
  renderKbd()
  updateHintBtn()
}

function updateHintBtn() {
  const btn = q<HTMLButtonElement>('#btn-hint')
  if (!btn) return
  btn.hidden = settings.hintLevel === 1 || hintRevealed
}

// ── advance ────────────────────────────────────────────────────────────────
function advance() {
  if (hintTimer) { clearTimeout(hintTimer); hintTimer = null }
  pos = (pos + 1) % progression.length
  if (pos === 0 && settings.progressionMode === 'random') progression = genProgression()
  prevV = curV
  const spec = progression[pos]!
  const chord = buildChord(spec.root, spec.type)
  curV = leadVoice(chord, prevV, { allowedInversions: allowedInversions(chord.notes.length) })
  micMatched = new Set()
  sessionCount++
  if (settings.playSound && curV) playChord([...curV.right, curV.left])
  render()
  startHintCycle()
}

// ── microphone ─────────────────────────────────────────────────────────────
// Match detected MIDI (pitch-class only) against curV notes.
// Stores the TARGET midi (exact voicing note) in micMatched.
function onMicNote(detectedMidi: number) {
  if (!curV) return
  const detectedPc = detectedMidi % 12
  const targets = [curV.left, ...curV.right]
  for (const t of targets) {
    if (t % 12 === detectedPc && !micMatched.has(t)) {
      micMatched.add(t)
      renderKbd()
      renderMicLegend()

      // All right-hand notes confirmed → brief highlight, then optionally advance
      const rightConfirmed = (curV.right as number[]).every(m => micMatched.has(m))
      if (rightConfirmed) {
        setTimeout(() => {
          if (settings.autoAdvance) advance()
        }, 500)
      }
      break
    }
  }
}

async function toggleMic() {
  if (micActive) {
    micStop?.()
    micStop   = null
    micActive = false
    micMatched = new Set()
    renderKbd()
    renderMicLegend()
  } else {
    const stop = await startMic(onMicNote)
    if (stop === null) {
      alert('Не удалось получить доступ к микрофону. Проверьте разрешения браузера.')
      return
    }
    micStop   = stop
    micActive = true
  }
  renderMicBtn()
}

function renderMicBtn() {
  const btn = q<HTMLButtonElement>('#btn-mic')
  if (!btn) return
  btn.classList.toggle('active', micActive)
  btn.setAttribute('aria-pressed', String(micActive))
  btn.title = micActive ? 'Микрофон включён — нажмите, чтобы выключить' : 'Включить распознавание нот через микрофон'
}

function renderMicLegend() {
  const el = q('#mic-legend')
  if (!el || !curV) return
  if (!micActive) { el.textContent = ''; return }
  const total = (curV.right as number[]).length
  const done  = (curV.right as number[]).filter(m => micMatched.has(m)).length
  el.textContent = done > 0
    ? `🎵 ${done} / ${total} нот сыграно`
    : 'Сыграйте ноты аккорда — микрофон слушает'
}

// ── render ─────────────────────────────────────────────────────────────────
function render() {
  renderChord()
  renderKbd()
  renderChain()
  updateHintBtn()
  renderMetro()
  renderMicBtn()
  renderMicLegend()
}

function renderChord() {
  const cur = progression[pos]!
  const nxt = progression[(pos + 1) % progression.length]!
  q('#chord-current')!.textContent = chordDisplay(buildChord(cur.root, cur.type))
  q('#chord-next')!.textContent    = '→ ' + chordDisplay(buildChord(nxt.root, nxt.type))
  q('#chord-inv')!.textContent     = invLabel(curV?.inversion ?? 0)
  const cntEl = q('#session-count')
  if (cntEl) cntEl.textContent = sessionCount > 0 ? `${sessionCount} аккордов` : ''
}

function invLabel(inv: number): string {
  if (inv === 0) return 'осн. вид'
  if (inv === 1) return '1-е обращение'
  if (inv === 2) return '2-е обращение'
  if (inv === 3) return '3-е обращение'
  return ''
}

function renderKbd() {
  if (!curV) return
  if (!hintRevealed) { q('#kbd')!.innerHTML = renderKeyboard([]); return }

  const shifts = prevV ? [...voiceMovement(prevV, curV).shifts] : []
  const hl: KeyHighlight[] = [
    { midi: curV.left, hand: 'left', matched: micMatched.has(curV.left) },
    ...(curV.right as number[]).map((midi, i) => {
      const s = shifts[i] ?? 0
      return {
        midi,
        hand: 'right' as const,
        label: s > 0 ? `↑${s}` : s < 0 ? `↓${Math.abs(s)}` : undefined,
        matched: micMatched.has(midi),
      }
    }),
  ]
  q('#kbd')!.innerHTML = renderKeyboard(hl)
}

function renderChain() {
  const el = q('#chain')!
  if (!settings.showChain) { el.innerHTML = ''; return }
  el.innerHTML = progression.map((spec, i) => {
    const name = chordDisplay(buildChord(spec.root, spec.type))
    const cls  = i === pos
      ? 'ci active'
      : i === (pos + 1) % progression.length ? 'ci next' : 'ci'
    return `<span class="${cls}">${name}</span>`
  }).join('')
}

function renderMetro() {
  const btn = q<HTMLButtonElement>('#btn-metro')
  if (btn) btn.classList.toggle('running', metro.running)
  q('#bpm-val')!.textContent = `${settings.bpm}`
  const autoBtn = q<HTMLButtonElement>('#btn-auto')
  if (autoBtn) {
    autoBtn.classList.toggle('active', settings.autoAdvance)
    autoBtn.setAttribute('aria-pressed', String(settings.autoAdvance))
  }
}

function renderBeats() {
  const dots = document.querySelectorAll<HTMLElement>('.beat-dot')
  const bpc  = settings.beatsPerChord
  dots.forEach((d, i) => {
    d.hidden = i >= bpc
    d.classList.toggle('active', metro.running && i === currentBeat)
  })
}

// ── BPM control ───────────────────────────────────────────────────────────
function changeBpm(delta: number) {
  settings = { ...settings, bpm: Math.max(40, Math.min(200, settings.bpm + delta)) }
  saveSettings(settings)
  metro.bpm = settings.bpm
  q('#bpm-val')!.textContent = `${settings.bpm}`
}

// ── keyboard toggle (mobile) ───────────────────────────────────────────────
function toggleKbd() {
  kbdVisible = !kbdVisible
  q<HTMLElement>('#kbd')!.classList.toggle('visible', kbdVisible)
  const btn = q<HTMLButtonElement>('#btn-kbd-toggle')
  if (btn) btn.classList.toggle('active', kbdVisible)
}

// ── theme ──────────────────────────────────────────────────────────────────
type Theme = 'auto' | 'light' | 'dark'

function loadTheme(): Theme {
  try { return (localStorage.getItem(THEME_KEY) as Theme) ?? 'auto' } catch { return 'auto' }
}

function applyTheme(t: Theme) {
  const root = document.documentElement
  if (t === 'auto') root.removeAttribute('data-theme')
  else              root.setAttribute('data-theme', t)
  try { localStorage.setItem(THEME_KEY, t) } catch {}
  const btn = q<HTMLButtonElement>('#btn-theme')
  if (!btn) return
  btn.textContent = t === 'dark' ? '☀' : t === 'light' ? '☾' : '◑'
  btn.title = t === 'dark' ? 'Тема: тёмная' : t === 'light' ? 'Тема: светлая' : 'Тема: авто'
}

function cycleTheme() {
  const cur = (document.documentElement.getAttribute('data-theme') as Theme | null) ?? 'auto'
  applyTheme(cur === 'auto' ? 'light' : cur === 'light' ? 'dark' : 'auto')
}

// ── Wake Lock ──────────────────────────────────────────────────────────────
async function requestWakeLock() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const wl = (navigator as any).wakeLock
    if (wl) await wl.request('screen')
  } catch {}
}

// ── fullscreen ─────────────────────────────────────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {})
  } else {
    document.exitFullscreen().catch(() => {})
  }
}

function updateFsBtn() {
  const btn = q<HTMLButtonElement>('#btn-fs')
  if (!btn) return
  btn.textContent = document.fullscreenElement ? '⊡' : '⛶'
}

// ── settings form ──────────────────────────────────────────────────────────
const MODE_LABELS: Record<ProgressionMode, string> = {
  'fifths':         'Круг квинт',
  'fourths':        'Круг кварт',
  'ii-V-I':         'ii–V–I',
  'diatonic':       'Диатоника',
  'chromatic-up':   'Хроматика ↑',
  'chromatic-down': 'Хроматика ↓',
  'random':         'Случайный',
}

const TYPE_LABELS: Record<ChordType, string> = {
  maj:'maj', min:'min', dim:'dim°', aug:'aug+', sus2:'sus2', sus4:'sus4',
  maj7:'Δ7', '7':'7', m7:'m7', m7b5:'ø7', dim7:'°7',
}

const INV_LABELS: Record<InversionMode, string> = {
  all:        'Лучшее движение',
  root:       'Без обращений',
  first:      'Только 1-е',
  second:     'Только 2-е',
  'non-root': '1-е и 2-е',
}

const ACC_LABELS: Record<AccidentalFilter, string> = {
  both:        '♭ и #',
  'no-flats':  'без ♭ (только #)',
  'no-sharps': 'без # (только ♭)',
  naturals:    'без ♭ и # (натуральные)',
}

function buildSettingsBody(): string {
  const s = settings
  const m = s.progressionMode
  const showType  = !['ii-V-I', 'diatonic'].includes(m)
  const showKey   = ['diatonic', 'chromatic-up', 'chromatic-down'].includes(m)
  const showSeam  = ['fifths', 'fourths', 'ii-V-I'].includes(m)
  const showDelay = s.hintLevel === 2

  const opt = <T extends string>(v: T, label: string, cur: string) =>
    `<option value="${v}"${v === cur ? ' selected' : ''}>${label}</option>`

  const modeOpts = (Object.keys(MODE_LABELS) as ProgressionMode[]).map(k => opt(k, MODE_LABELS[k], m)).join('')
  const typeOpts = CHORD_TYPES.map(t => opt(t, TYPE_LABELS[t], s.chordType)).join('')
  const keyOpts  = KEY_ROOTS.map((n, i) =>
    `<option value="${i}"${i === s.keyRootPc ? ' selected' : ''}>${noteDisplay(n)}</option>`,
  ).join('')
  const invOpts  = (Object.keys(INV_LABELS) as InversionMode[]).map(k => opt(k, INV_LABELS[k], s.inversionMode)).join('')
  const accOpts  = (Object.keys(ACC_LABELS) as AccidentalFilter[]).map(k => opt(k, ACC_LABELS[k], s.accidentalFilter)).join('')
  const hintOpts = [
    opt('1', 'Сразу',         `${s.hintLevel}`),
    opt('2', 'Задержка',      `${s.hintLevel}`),
    opt('3', 'По кнопке (H)', `${s.hintLevel}`),
  ].join('')
  const bpcOpts  = ['1','2','4'].map(v =>
    `<option value="${v}"${Number(v) === s.beatsPerChord ? ' selected' : ''}>${v} уд.</option>`,
  ).join('')

  return `
    <div class="set-row"><label for="sel-mode">Режим</label>
      <select id="sel-mode">${modeOpts}</select></div>
    ${showType ? `<div class="set-row"><label for="sel-type">Тип аккорда</label>
      <select id="sel-type">${typeOpts}</select></div>` : ''}
    ${showKey ? `<div class="set-row"><label for="sel-key">Тональность</label>
      <select id="sel-key">${keyOpts}</select></div>` : ''}
    ${showSeam ? `<div class="set-row"><label for="sel-seam">Стык круга</label>
      <select id="sel-seam">
        ${opt('sharp','F#',s.seam)}${opt('flat','Gb',s.seam)}
      </select></div>` : ''}
    <div class="set-row"><label for="sel-acc">Знаки альтерации</label>
      <select id="sel-acc">${accOpts}</select></div>
    <div class="set-row"><label for="sel-inv">Обращения</label>
      <select id="sel-inv">${invOpts}</select></div>
    <div class="set-row"><label for="sel-hint">Подсказки</label>
      <select id="sel-hint">${hintOpts}</select></div>
    ${showDelay ? `<div class="set-row"><label for="inp-delay">Задержка (сек)</label>
      <input id="inp-delay" type="number" min="1" max="30" value="${s.hintDelay}" style="width:72px"></div>` : ''}
    <div class="set-row"><label for="sel-bpc">Ударов на аккорд</label>
      <select id="sel-bpc">${bpcOpts}</select></div>
    <div class="set-row"><label for="chk-auto">Авто-переход</label>
      <input type="checkbox" id="chk-auto"${s.autoAdvance ? ' checked' : ''}></div>
    <div class="set-row"><label for="chk-sound">Звук аккордов</label>
      <input type="checkbox" id="chk-sound"${s.playSound ? ' checked' : ''}></div>
    <div class="set-row"><label for="chk-chain">Цепочка</label>
      <input type="checkbox" id="chk-chain"${s.showChain ? ' checked' : ''}></div>
  `
}

function onSettingsChange() {
  const prevMode = settings.progressionMode
  const prevHint = settings.hintLevel

  const sel = (id: string) => (q<HTMLSelectElement>(`#${id}`) as HTMLSelectElement | null)?.value
  const chk = (id: string) => (q<HTMLInputElement>(`#${id}`)  as HTMLInputElement  | null)?.checked
  const num = (id: string, fb: number) => {
    const v = (q<HTMLInputElement>(`#${id}`) as HTMLInputElement | null)?.value
    return v !== undefined ? Number(v) : fb
  }

  const newMode = (sel('sel-mode') ?? settings.progressionMode) as ProgressionMode
  const kv = sel('sel-key')

  settings = {
    ...settings,
    progressionMode:  newMode,
    chordType:        (sel('sel-type')  ?? settings.chordType)  as ChordType,
    keyRootPc:        kv !== undefined ? Number(kv) : settings.keyRootPc,
    seam:             (sel('sel-seam')  as 'sharp' | 'flat' | undefined) ?? settings.seam,
    accidentalFilter: (sel('sel-acc')   as AccidentalFilter  | undefined) ?? settings.accidentalFilter,
    inversionMode:    (sel('sel-inv')   as InversionMode     | undefined) ?? settings.inversionMode,
    hintLevel:        Number(sel('sel-hint') ?? settings.hintLevel) as 1 | 2 | 3,
    hintDelay:        num('inp-delay', settings.hintDelay),
    beatsPerChord:    Number(sel('sel-bpc') ?? settings.beatsPerChord) as 1 | 2 | 4,
    autoAdvance:      chk('chk-auto')  ?? settings.autoAdvance,
    playSound:        chk('chk-sound') ?? settings.playSound,
    showChain:        chk('chk-chain') ?? settings.showChain,
  }
  saveSettings(settings)
  metro.beatsPerChord = settings.beatsPerChord

  if (newMode !== prevMode || settings.hintLevel !== prevHint) {
    q('.set-body')!.innerHTML = buildSettingsBody()
  }
  initProgression()
  render()
  renderBeats()
}

function openSettings() {
  const panel = q('#set-panel')!
  const body  = q('.set-body') as HTMLElement | null
  if (!body) return
  body.innerHTML = buildSettingsBody()
  panel.removeAttribute('hidden')
  if (!body.dataset['listening']) {
    body.dataset['listening'] = '1'
    body.addEventListener('change', onSettingsChange)
    body.addEventListener('input',  onSettingsChange)
  }
}

function closeSettings() { q('#set-panel')!.setAttribute('hidden', '') }

// ── scaffold ───────────────────────────────────────────────────────────────
function buildAppHTML(): string {
  const theme = loadTheme()
  const themeIcon = theme === 'dark' ? '☀' : theme === 'light' ? '☾' : '◑'

  return `
<header class="app-head">
  <button class="btn icon-btn" id="btn-set" aria-label="Настройки">⚙</button>
  <span id="session-count" class="session-count"></span>
  <div class="head-actions">
    <button class="btn icon-btn" id="btn-kbd-toggle" aria-label="Клавиатура">🎹</button>
    <button class="btn icon-btn" id="btn-theme" aria-label="Тема">${themeIcon}</button>
    <button class="btn icon-btn" id="btn-fs" aria-label="Полный экран">⛶</button>
  </div>
</header>
<nav class="app-tabs" role="tablist" aria-label="Разделы">
  <button class="app-tab active" id="tab-chords" role="tab" data-tab="chords" aria-controls="panel-chords" aria-selected="true">Аккорды</button>
  <button class="app-tab" id="tab-plan" role="tab" data-tab="plan" aria-controls="practice-plan" aria-selected="false">План</button>
  <button class="app-tab" id="tab-session" role="tab" data-tab="session" aria-controls="practice-session" aria-selected="false">Занятие</button>
</nav>
<main id="panel-chords" class="app-main" role="tabpanel" aria-labelledby="tab-chords" data-tab-panel="chords">
  <div class="chord-display">
    <div id="chord-current" class="chord-cur">…</div>
    <div id="chord-inv"     class="chord-inv"></div>
    <div id="chord-next"    class="chord-nxt">…</div>
  </div>
  <div id="kbd" class="kbd-wrap"></div>
  <div id="chain" class="chain"></div>
  <div class="metro-row">
    <button id="btn-metro" class="btn btn-metro" aria-label="Метроном">▶ <kbd>↵</kbd></button>
    <div class="bpm-group">
      <button id="btn-bpm-dec" class="btn btn-bpm" aria-label="-5 BPM">−</button>
      <span id="bpm-val" class="bpm-val">${settings.bpm}</span>
      <button id="btn-bpm-inc" class="btn btn-bpm" aria-label="+5 BPM">+</button>
    </div>
    <div class="beat-dots" aria-hidden="true">
      <span class="beat-dot"></span>
      <span class="beat-dot"></span>
      <span class="beat-dot"></span>
      <span class="beat-dot"></span>
    </div>
    <button id="btn-auto" class="btn btn-auto" aria-pressed="false">Авто</button>
  </div>
  <div class="controls">
    <button id="btn-hint" class="btn btn-hint" hidden>Подсказка <kbd>H</kbd></button>
    <button id="btn-mic"  class="btn btn-mic" aria-pressed="false" title="Включить распознавание нот через микрофон">🎤</button>
    <button id="btn-next" class="btn btn-primary">Следующий →</button>
  </div>
  <div id="mic-legend" class="mic-legend"></div>
</main>
<section id="practice-plan" class="practice-page" role="tabpanel" aria-labelledby="tab-plan" data-tab-panel="plan" hidden></section>
<section id="practice-session" class="practice-page" role="tabpanel" aria-labelledby="tab-session" data-tab-panel="session" hidden></section>
<div id="set-panel" class="set-panel" hidden>
  <div class="set-inner">
    <div class="set-head">
      <h2>Настройки</h2>
      <button class="btn icon-btn" id="btn-set-close" aria-label="Закрыть">✕</button>
    </div>
    <div class="set-body"></div>
    <div class="set-footer">
      <button class="btn" id="btn-reset">Сброс</button>
      <button class="btn btn-primary" id="btn-set-done">Готово</button>
    </div>
  </div>
</div>
`.trim()
}

// ── helpers ────────────────────────────────────────────────────────────────
function q<T extends Element = Element>(sel: string): T | null {
  return document.querySelector<T>(sel)
}

// ── boot ───────────────────────────────────────────────────────────────────
document.getElementById('app')!.innerHTML = buildAppHTML()
initPractice()
applyTheme(loadTheme())
unlockAudio()
void requestWakeLock()

document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') void requestWakeLock()
})
document.addEventListener('fullscreenchange', updateFsBtn)

q('#btn-next')!.addEventListener('click', advance)
q('#btn-hint')!.addEventListener('click', revealHint)
q('#btn-set')!.addEventListener('click', openSettings)
q('#btn-set-close')!.addEventListener('click', closeSettings)
q('#btn-set-done')!.addEventListener('click', closeSettings)
q('#btn-metro')!.addEventListener('click', () => { metro.toggle(); renderMetro(); renderBeats() })
q('#btn-bpm-dec')!.addEventListener('click', () => changeBpm(-5))
q('#btn-bpm-inc')!.addEventListener('click', () => changeBpm(+5))
q('#btn-auto')!.addEventListener('click', () => {
  settings = { ...settings, autoAdvance: !settings.autoAdvance }
  saveSettings(settings)
  renderMetro()
})
q('#btn-mic')!.addEventListener('click', () => { void toggleMic() })
q('#btn-kbd-toggle')!.addEventListener('click', toggleKbd)
q('#btn-theme')!.addEventListener('click', cycleTheme)
q('#btn-fs')!.addEventListener('click', toggleFullscreen)
q('#btn-reset')!.addEventListener('click', () => {
  settings = { ...DEFAULT }
  saveSettings(settings)
  metro.bpm = settings.bpm
  metro.beatsPerChord = settings.beatsPerChord
  q('.set-body')!.innerHTML = buildSettingsBody()
  initProgression()
  render()
  renderBeats()
})
q('#set-panel')!.addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeSettings()
})

document.addEventListener('keydown', (e) => {
  if (!q('#set-panel')!.hasAttribute('hidden')) return
  if (q<HTMLElement>('.app-main')!.hidden) return
  if (e.code === 'Space' || e.code === 'ArrowRight' || e.code === 'PageDown') {
    e.preventDefault(); advance()
  }
  if (e.code === 'KeyH')  { e.preventDefault(); revealHint() }
  if (e.code === 'Enter') { e.preventDefault(); metro.toggle(); renderMetro(); renderBeats() }
})

initProgression()
render()
renderBeats()
