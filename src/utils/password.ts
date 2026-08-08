// Gera uma senha temporária criptograficamente segura para novos usuários.
// Evita senhas fixas/hardcoded no código-fonte.
const PASSWORD_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789';

export const generateTemporaryPassword = (length = 12): string => {
  const pool = new Uint32Array(length);
  if (typeof crypto !== 'undefined' && typeof crypto.getRandomValues === 'function') {
    crypto.getRandomValues(pool);
  } else {
    // Fallback apenas para ambientes sem Web Crypto (não deve ocorrer em navegadores modernos)
    for (let i = 0; i < length; i++) {
      pool[i] = Math.floor(Math.random() * 0xffffffff);
    }
  }
  let password = '';
  for (let i = 0; i < length; i++) {
    password += PASSWORD_CHARS[pool[i] % PASSWORD_CHARS.length];
  }
  return password;
};
