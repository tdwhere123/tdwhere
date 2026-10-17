/**
 * The author's film, read from src/assets/film/. Each folder is one roll:
 *
 *   src/assets/film/2025-10-yichang/01.jpg, 02.jpg, …   (date, then a name)
 *   src/assets/film/2025-10-yichang/roll.json            (optional)
 *
 * A folder named for a date (YYYY-MM or YYYY-MM-DD) is dated by it; rolls are
 * shown newest first, undated ones last, and frames in file-name order.
 * roll.json may give a title, place, stock, camera and a note, and per frame
 * (by file name without extension) an alt text and a crop focus. A picture
 * named canister.* (a cut-out PNG is best) stands for the roll on the shelf
 * instead of the drawn canister; it is not a frame.
 * The home painting and the shelf's backdrop live in src/assets/ground/,
 * outside this folder, so they are not rolls.
 */
import homeStill from '../assets/ground/home.jpg'
import filmStill from '../assets/ground/film.jpg'

export type Words = { zh: string; en: string }

export type RollNote = {
  title?: Words
  place?: Words
  stock?: string
  camera?: string
  note?: Words
  frames?: Record<string, { alt?: Words; focus?: string }>
}

export type FilmFrame = {
  /** `roll/name`, unique across the collection. */
  id: string
  roll: string
  /** File name without extension; also the frame's place in the viewer URL. */
  name: string
  src: string
  /** Where a crop holds when the frame is cover-fit, as a CSS object-position. */
  focus: string
  alt: Words
}

export type FilmRoll = Omit<RollNote, 'frames' | 'title'> & {
  id: string
  /** A picture of the roll's own canister, if one was added. */
  canister?: string
  /** YYYY-MM or YYYY-MM-DD, from the folder name. */
  date?: string
  title: Words
  frames: FilmFrame[]
}

const byName = (a: string, b: string) => a.localeCompare(b, undefined, { numeric: true })

/** Builds the collection from file paths (…/<roll>/<file>) to image URLs, and each roll's notes. */
export function collect(images: Record<string, string>, notes: Record<string, RollNote>): FilmRoll[] {
  const files = new Map<string, [string, string][]>(),
    canisters = new Map<string, string>()
  for (const [path, src] of Object.entries(images)) {
    const [roll, file] = path.split('/').slice(-2)
    const name = file.replace(/\.[^.]+$/, '')
    if (name.toLowerCase() === 'canister') canisters.set(roll, src)
    else files.set(roll, [...(files.get(roll) ?? []), [name, src]])
  }
  const noteOf = (roll: string) =>
    Object.entries(notes).find(([path]) => path.split('/').slice(-2)[0] === roll)?.[1] ?? {}
  const rolls = [...files].map(([id, list]): FilmRoll => {
    const { frames: perFrame = {}, title, ...rest } = noteOf(id)
    const [, date, slug] = id.match(/^(\d{4}-\d{2}(?:-\d{2})?)(?:-(.+))?$/) ?? [null, undefined, id]
    const name = slug ? slug.replace(/[-_]+/g, ' ') : (date ?? id)
    const words = title ?? { zh: name, en: name }
    return {
      ...rest,
      id,
      canister: canisters.get(id),
      date,
      title: words,
      frames: list
        .sort(([a], [b]) => byName(a, b))
        .map(([frame, src], i) => ({
          id: `${id}/${frame}`,
          roll: id,
          name: frame,
          src,
          focus: perFrame[frame]?.focus ?? '50% 50%',
          alt: perFrame[frame]?.alt ?? {
            zh: `${words.zh}，第 ${i + 1} 格`,
            en: `${words.en}, frame ${i + 1}`,
          },
        })),
    }
  })
  return rolls.sort((a, b) =>
    a.date && b.date ? byName(b.date, a.date) : a.date ? -1 : b.date ? 1 : byName(a.id, b.id),
  )
}

export const rolls = collect(
  import.meta.glob<string>('../assets/film/*/*.{jpg,jpeg,png,webp,avif,JPG,JPEG,PNG}', {
    eager: true,
    import: 'default',
  }),
  import.meta.glob<RollNote>('../assets/film/*/roll.json', { eager: true, import: 'default' }),
)

export const frameById = (id: string) =>
  rolls.flatMap((r) => r.frames).find((f) => f.id === id)

/** A frame kept for painting, outside the shelf. */
function ground(name: string, src: string, focus: string, alt: Words): FilmFrame {
  return { id: `ground/${name}`, roll: 'ground', name, src, focus, alt }
}

/** The home page and the overture. Not a roll. */
export const heroFrame = ground('home', homeStill, '64% 50%', {
  zh: '逆光的水面碎成一片波光，几只水鸟游过一台黄色的增氧机。',
  en: 'Backlit water broken into glitter; a few water birds swim past a yellow aerator.',
})

/** The dim painting behind the film shelf. Not a roll. */
export const filmBackdrop = ground('film', filmStill, '38% 50%', {
  zh: '蓝调时分的江面，橙色栏杆的船梯下，远处一线灯火。',
  en: 'A river at blue hour, seen from under an orange-railed gangway; a line of lights far off.',
})
