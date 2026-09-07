import { describe, expect, it } from 'vitest';
import { getSafeExternalHref, normalizeExternalLinks, validateExternalLink } from './profile-links-utils.js';

describe('profile links utils', () => {
  it.each(['http://example.com', 'https://example.com/path'])('permite navegação HTTP(S): %s', (url) => expect(getSafeExternalHref(url)).toBe(url));
  it.each(['javascript:alert(1)', 'data:text/html,test', 'ftp://example.com', 'not a url'])('bloqueia navegação insegura ou inválida: %s', (url) => expect(getSafeExternalHref(url)).toBeNull());
  it('espelha os limites do contrato', () => {
    expect(validateExternalLink({ label: '', url: '' })).toEqual({ label: 'Informe um nome para o link.', url: 'Informe a URL.' });
    expect(validateExternalLink({ label: '   ', url: 'invalid' })).toEqual({ label: 'Informe um nome para o link.', url: 'Informe uma URL válida.' });
    expect(validateExternalLink({ label: 'a'.repeat(33), url: 'https://example.com' }).label).toBeDefined();
    expect(validateExternalLink({ label: 'Site', url: `https://example.com/${'a'.repeat(500)}` }).url).toBeDefined();
  });
  it('remove espaços apenas do label e produz somente o contrato persistido', () => {
    expect(normalizeExternalLinks([{ label: ' GitHub ', url: 'https://github.com/x ' }])).toEqual([{ label: 'GitHub', url: 'https://github.com/x ' }]);
  });
});
