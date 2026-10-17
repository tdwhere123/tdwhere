import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { X } from 'lucide-react'
import { useWords } from '../hooks'
import { Art } from '../components/Primitives'
import { rolls } from '../film'

/**
 * One frame, full screen and nothing else: the roll's strip along the
 * bottom, and above, a switch between the frame as shot and repainted.
 * Arrow keys step through the roll; Escape goes back to the collection.
 */
export default function FilmViewer() {
  const w = useWords(),
    navigate = useNavigate(),
    params = useParams()
  const roll = rolls.find((r) => r.id === params.roll),
    at = roll?.frames.findIndex((f) => f.name === params.frame) ?? -1
  const frame = roll?.frames[at]
  const [painted, setPainted] = useState(false),
    [ratio, setRatio] = useState(3 / 2)
  const strip = useRef<HTMLOListElement>(null)
  useEffect(() => {
    if (!frame) return
    let live = true
    const image = new Image()
    image.src = frame.src
    image
      .decode()
      .then(() => live && setRatio(image.naturalWidth / image.naturalHeight))
      .catch(() => {
        /* the image element shows the failure; keep the last proportions */
      })
    strip.current
      ?.querySelector('[aria-current]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
    return () => {
      live = false
    }
  }, [frame])
  useEffect(() => {
    if (!roll) return
    const go = (i: number) =>
      navigate(`/film/${roll.id}/${roll.frames[(i + roll.frames.length) % roll.frames.length].name}`, {
        replace: true,
      })
    const key = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') go(at + 1)
      else if (e.key === 'ArrowLeft') go(at - 1)
      else if (e.key === 'Escape') navigate('/film')
    }
    addEventListener('keydown', key)
    return () => removeEventListener('keydown', key)
  }, [roll, at, navigate])
  if (!roll || !frame) return <Navigate to="/film" replace />
  const alt = w(frame.alt.zh, frame.alt.en)
  return (
    <div className="a-viewer" style={{ '--a-ratio': ratio } as CSSProperties}>
      <div className="a-viewer-bar">
        <Link to="/film" className="a-viewer-close" aria-label={w('回到胶片集', 'Back to the collection')}>
          <X size={20} aria-hidden="true" />
        </Link>
        <p>
          {w(roll.title.zh, roll.title.en)}
          <span>
            {String(at + 1).padStart(2, '0')} / {String(roll.frames.length).padStart(2, '0')}
          </span>
        </p>
        <div role="group" aria-label={w('显示方式', 'Show as')}>
          <button type="button" aria-pressed={!painted} onClick={() => setPainted(false)}>
            {w('原片', 'As shot')}
          </button>
          <button type="button" aria-pressed={painted} onClick={() => setPainted(true)}>
            {w('油画', 'Repainted')}
          </button>
        </div>
      </div>
      <figure className="a-viewer-stage">
        <div className="a-viewer-frame">
          {painted ? (
            <>
              <Art frame={frame} eager />
              <span className="sr-only">{alt}</span>
            </>
          ) : (
            <img key={frame.id} src={frame.src} alt={alt} draggable={false} />
          )}
        </div>
      </figure>
      <ol className="a-viewer-strip" ref={strip} aria-label={w('这一卷', 'This roll')}>
        {roll.frames.map((f, i) => (
          <li key={f.id}>
            <Link
              to={`/film/${roll.id}/${f.name}`}
              replace
              aria-current={i === at ? 'true' : undefined}
              aria-label={w(`第 ${i + 1} 格`, `Frame ${i + 1}`)}
            >
              <img src={f.src} alt="" loading="lazy" draggable={false} />
            </Link>
          </li>
        ))}
      </ol>
    </div>
  )
}
