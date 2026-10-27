/**
 * Punto de integración de proveedores de generación.
 *
 * Contrato de un proveedor:
 *   { id, label, isLocal, generate(params, seed), regenerateStanza(poem, index, seed), generateVariant(poem, seed) }
 *
 * Esta versión registra solo el motor local. Un proveedor externo (p. ej. un
 * servicio de IA) tendría que implementar el mismo contrato, pedir el
 * consentimiento explícito de la persona antes de enviar su texto y añadirse
 * a la política connect-src de vite.config.js. No se incluye ninguno.
 */
import { generate, regenerateStanza, generateVariant } from '../modules/literary-engine/engine.js';

const localProvider = Object.freeze({
  id: 'local',
  label: 'Motor local de reglas y plantillas',
  isLocal: true,
  generate,
  regenerateStanza,
  generateVariant,
});

const providers = new Map([[localProvider.id, localProvider]]);

export function getProvider(id = 'local') {
  return providers.get(id) || localProvider;
}

export function listProviders() {
  return [...providers.values()];
}
