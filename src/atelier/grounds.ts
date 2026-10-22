/** The two authored grounds are independent of the roll catalog and its derivative URLs. */
import homeStill from '../assets/ground/home.jpg'
import filmStill from '../assets/ground/film.jpg'
import type { FilmFrame, Words } from './film'

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
