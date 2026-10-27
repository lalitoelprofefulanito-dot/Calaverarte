/** Errores con mensajes pensados para mostrarse a la persona usuaria. */
export class AppError extends Error {
  constructor(message, { code = 'APP_ERROR', details = null } = {}) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message, fieldErrors = {}) {
    super(message, { code: 'VALIDATION_ERROR', details: fieldErrors });
    this.name = 'ValidationError';
    this.fieldErrors = fieldErrors;
  }
}

export class StorageError extends AppError {
  constructor(message, { code = 'STORAGE_ERROR', cause = null } = {}) {
    super(message, { code });
    this.name = 'StorageError';
    this.cause = cause;
  }
}

/** Traduce errores nativos de IndexedDB a mensajes comprensibles. */
export function toStorageError(error) {
  if (error instanceof StorageError) return error;
  const name = error?.name || '';
  if (name === 'QuotaExceededError') {
    return new StorageError(
      'El espacio de almacenamiento del navegador está lleno. Exporta un respaldo y elimina obras que ya no necesites.',
      { code: 'QUOTA_EXCEEDED', cause: error },
    );
  }
  if (name === 'VersionError') {
    return new StorageError(
      'Los datos guardados pertenecen a una versión más reciente de CalaverArte. Actualiza la página.',
      { code: 'VERSION_ERROR', cause: error },
    );
  }
  return new StorageError(
    'No se pudo acceder al almacenamiento del dispositivo. Revisa que el navegador permita guardar datos (algunas ventanas privadas lo impiden).',
    { code: 'STORAGE_UNAVAILABLE', cause: error },
  );
}
