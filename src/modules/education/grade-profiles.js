/** Perfiles educativos: recomendaciones de extensión, tono y actividades. */
import data from '../../data/educational-profiles.json';

export const PROFILES = data.profiles;

export function getProfile(id) {
  return PROFILES.find((p) => p.id === id) || null;
}
