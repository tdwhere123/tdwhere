import { useCallback, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Power } from 'lucide-react'
import Desk from '../sentinel/Desk'
import MachineStage from '../machine/MachineStage'
import { useWords } from '../hooks'

/**
 * SENTINEL as a painted still life: a real 3D machine rendered through the
 * oil pass. Its glass shows the case waiting; switched on, the night is
 * played at a desk where the same machine sits, its screen live.
 */
export default function PaintedMachine() {
  const w = useWords()
  const [active, setActive] = useState(true)
  const [powered, setPowered] = useState(false)
  // mounted on the first power-on, then kept so switching off keeps the night
  const [booted, setBooted] = useState(false)
  const button = useRef<HTMLButtonElement>(null)

  const power = useCallback((on: boolean) => {
    setPowered(on)
    if (on) setBooted(true)
  }, [])
  const off = useCallback(() => {
    power(false)
    button.current?.focus({ preventScroll: true })
  }, [power])

  const status = powered
    ? w('审查进行中。按 Esc 关机，这一夜会停在原处。', 'Review in progress. Esc switches off; the night waits where you left it.')
    : booted
      ? w('待机。这一夜还停在你离开的地方。', 'Standby. The night is still where you left it.')
      : w('待机。按电源键开机，机身右下角那颗也可以。', 'Standby. Press power, or the key at the bottom right of the case.')

  return (
    <figure className="a-machine">
      <MachineStage powered={powered} onPowerKey={() => power(!powered)} onVisible={setActive}>
        <div className="a-glass" data-on={powered ? '' : undefined} data-paused={active ? undefined : ''} aria-hidden="true">
          <p>
            <span className="a-glass-caret">_</span> 1011-07
          </p>
          <small>{powered ? w('审查中', 'under review') : w('第七区 · 待审查', 'Section 7 · awaiting review')}</small>
        </div>
      </MachineStage>
      <figcaption className="a-machine-controls">
        <button
          ref={button}
          type="button"
          className="a-machine-power"
          data-testid="open-terminal"
          aria-pressed={powered}
          onClick={() => power(!powered)}
        >
          <Power size={15} />
          {powered ? w('关机', 'Power off') : w('开机', 'Power on')}
        </button>
        <span aria-live="polite">{status}</span>
      </figcaption>
      {booted && createPortal(<Desk open={powered} onClose={off} />, document.body)}
    </figure>
  )
}
