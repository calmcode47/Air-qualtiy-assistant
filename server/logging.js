export function structuredLog(logger, level, entry) {
  const method = typeof logger?.[level] === 'function' ? logger[level] : logger?.log;
  if (typeof method === 'function') method.call(logger, JSON.stringify(entry));
}

export function safeError(error, secrets = []) {
  const replaceSecrets = (value) => secrets.reduce(
    (result, secret) => result.replaceAll(secret, '[redacted]'),
    String(value || '')
  );
  const message = replaceSecrets(error?.message || 'Request failed').slice(0, 1000);
  const stack = typeof error?.stack === 'string' ? replaceSecrets(error.stack).slice(0, 4000) : undefined;
  return {
    name: typeof error?.name === 'string' ? error.name.slice(0, 100) : 'Error',
    code: typeof error?.code === 'string' ? error.code.slice(0, 100) : undefined,
    message,
    stack
  };
}
