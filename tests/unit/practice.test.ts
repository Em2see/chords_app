import { describe, expect, it } from 'vitest'
import { buildPracticeBlocks } from '../../src/state/practice'

describe('practice plan', () => {
  it('uses every minute and keeps the chosen order', () => {
    const blocks = buildPracticeBlocks({
      goal: 'jazz-blues', customGoal: '', minutes: 30, activities: ['chords', 'blues', 'repertoire', 'hanon'],
    })
    expect(blocks.map(block => block.name)).toEqual([
      'Аккорды', 'Блюзовая импровизация', 'Репертуар', 'Ганон',
    ])
    expect(blocks.map(block => block.minutes)).toEqual([8, 8, 7, 7])
    expect(blocks.reduce((sum, block) => sum + block.minutes, 0)).toBe(30)
  })
})
