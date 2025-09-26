export function newId(): string {
  // ID stable sans Web Crypto
  return 'id_' + Math.floor(Date.now() * 1000 + Math.random() * 1000).toString(36);
}
