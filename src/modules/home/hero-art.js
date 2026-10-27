/** Ilustración de la portada: calavera florida sobre un medallón. Solo atributos SVG (la CSP prohíbe estilos en línea). */
function flor(cx, cy, r, petalo = '#F28C0F', centro = '#FFC247') {
  const petalos = Array.from({ length: 10 }, (_, i) => `<ellipse cx="0" cy="${-r * 0.55}" rx="${r * 0.3}" ry="${r * 0.5}" fill="${petalo}" stroke="#8A3B00" stroke-width="1" transform="rotate(${i * 36})"/>`).join('');
  return `<g transform="translate(${cx} ${cy})">${petalos}<circle r="${r * 0.3}" fill="${centro}" stroke="#8A3B00" stroke-width="1"/><circle r="${r * 0.1}" fill="#8A3B00"/></g>`;
}

function ojo(cx, cy) {
  const picos = Array.from({ length: 12 }, (_, i) => `<circle cx="0" cy="-33" r="2.6" fill="${i % 2 ? '#FFC247' : '#FFFBF0'}" transform="rotate(${i * 30})"/>`).join('');
  return `<g transform="translate(${cx} ${cy})"><circle r="29" fill="#B5175E" stroke="#26123F" stroke-width="3"/><circle r="22" fill="#FFFBF0" stroke="#26123F" stroke-width="2"/><circle r="16" fill="#26123F"/><circle r="6" fill="#F28C0F"/><circle r="2" fill="#FFFBF0"/>${picos}</g>`;
}

function dientes() {
  const lineas = Array.from({ length: 7 }, (_, i) => `<path d="M${88 + i * 14} 196v26" stroke="#26123F" stroke-width="3" stroke-linecap="round"/>`).join('');
  return `<path d="M72 204q58 20 116 0" fill="none" stroke="#26123F" stroke-width="4" stroke-linecap="round"/><path d="M78 218q52 14 104 0" fill="none" stroke="#26123F" stroke-width="3" stroke-linecap="round"/>${lineas}`;
}

export const HERO_ART = `<svg viewBox="0 0 260 300" role="img" aria-label="Calavera decorada con flores de cempasúchil" xmlns="http://www.w3.org/2000/svg">
  <circle cx="130" cy="150" r="124" fill="#4A1F6B"/>
  <circle cx="130" cy="150" r="124" fill="none" stroke="#F28C0F" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/>
  <circle cx="130" cy="150" r="112" fill="none" stroke="#B5175E" stroke-width="2"/>
  <path d="M130 26C80 26 44 62 44 110c0 29 13 51 33 64v32c0 12 10 22 22 22h62c12 0 22-10 22-22v-32c20-13 33-35 33-64 0-48-36-84-86-84z" fill="#FFFBF0" stroke="#26123F" stroke-width="4" stroke-linejoin="round"/>
  <path d="M60 96c8-34 36-56 70-56" fill="none" stroke="#7A3FB0" stroke-width="3" stroke-dasharray="1 8" stroke-linecap="round"/>
  <path d="M200 96c-8-34-36-56-70-56" fill="none" stroke="#7A3FB0" stroke-width="3" stroke-dasharray="1 8" stroke-linecap="round"/>
  ${ojo(94, 112)}${ojo(166, 112)}
  <path d="M130 146l-10 20q10 8 20 0z" fill="#26123F"/>
  <path d="M130 52c6 8 6 16 0 24-6-8-6-16 0-24z" fill="#B5175E" stroke="#26123F" stroke-width="2"/>
  <circle cx="64" cy="158" r="13" fill="#1FA39B" stroke="#26123F" stroke-width="2.5"/><circle cx="64" cy="158" r="5" fill="#FFFBF0"/>
  <circle cx="196" cy="158" r="13" fill="#1FA39B" stroke="#26123F" stroke-width="2.5"/><circle cx="196" cy="158" r="5" fill="#FFFBF0"/>
  <path d="M82 180q-10 6-6 16M178 180q10 6 6 16" fill="none" stroke="#B5175E" stroke-width="3" stroke-linecap="round"/>
  ${dientes()}
  ${flor(68, 54, 26)}${flor(192, 54, 26)}${flor(40, 96, 16, '#FFC247', '#F28C0F')}${flor(220, 96, 16, '#FFC247', '#F28C0F')}
  ${flor(130, 264, 22)}${flor(98, 270, 14, '#FFC247', '#F28C0F')}${flor(162, 270, 14, '#FFC247', '#F28C0F')}
</svg>`;
