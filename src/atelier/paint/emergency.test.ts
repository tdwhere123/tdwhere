import { describe, expect, it } from 'vitest'
import { emergencyGround } from './emergency'
import { presetFor } from './presets'

describe('catastrophic paint failure ground', () => {
  it('provides an image without depending on any failed module or image request', () => {
    const uri = emergencyGround(presetFor('landscape'))
    expect(uri).toMatch(/^data:image\/svg\+xml,/)
    const svg = decodeURIComponent(uri.split(',')[1])
    expect(svg).toContain('viewBox="0 0 1200 800"')
    expect(svg).toContain('<path')
    expect(svg).not.toMatch(/href=|script|url\(/)
    expect(uri).not.toBe(emergencyGround(presetFor('manuscript')))
  })
})
