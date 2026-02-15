const COMMON_PASSWORDS = new Set([
  '12345678',
  '123456789',
  'password',
  'password123',
  'qwerty123',
  'abc12345',
  'letmein123',
  'admin1234',
  'welcome123',
  'iloveyou123'
]);

function normalize(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

export function getDjangoLikePasswordError(password: string): string | null {
  if (!password || password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.';
  }

  if (/^\d+$/.test(password)) {
    return 'La contraseña no puede ser completamente numérica.';
  }

  const normalized = normalize(password);
  if (COMMON_PASSWORDS.has(normalized)) {
    return 'La contraseña es demasiado común.';
  }

  return null;
}

export function isPasswordTooSimilar(password: string, candidates: Array<string | undefined | null>): boolean {
  const normalizedPassword = normalize(password);
  if (!normalizedPassword) {
    return false;
  }

  return candidates.some((candidate) => {
    const normalizedCandidate = normalize(candidate ?? '');
    if (normalizedCandidate.length < 3) {
      return false;
    }
    return normalizedPassword.includes(normalizedCandidate);
  });
}
