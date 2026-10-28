/** Servicio de generación: motor local → obra → evaluación → almacenamiento. */
import { getProvider } from '../../adapters/generation-provider.js';
import { createPoem } from '../../core/poem-model.js';
import { splitNames } from '../../core/normalization.js';
import { evaluatePoem } from '../evaluator/evaluation-report.js';
import { validateParams } from './generation-schema.js';
import { ValidationError } from '../../core/errors.js';

export function generatePoem(rawParams, seed) {
  const { ok, params, errors, suggestions } = validateParams(rawParams);
  if (!ok) {
    const error = new ValidationError('Revisa los datos marcados.', errors);
    error.suggestions = suggestions;
    throw error;
  }
  const result = getProvider('local').generate(params, seed);
  const poem = createPoem({
    title: result.title,
    params,
    protagonists: splitNames(params.names),
    stanzas: result.stanzas,
    engine: result.engine,
  });
  poem.evaluation = evaluatePoem(poem);
  return { poem, warnings: result.warnings };
}
