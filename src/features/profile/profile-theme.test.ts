import { describe, expect, it } from 'vitest';
import { getReadableProfileColors, isHexColor, normalizeHexColor } from './profile-theme.js';

describe('getReadableProfileColors', () => {
  it('aceita hexadecimal com ou sem # e normaliza para o formato persistido', () => {
    expect(isHexColor('#8b5cf6')).toBe(true);
    expect(isHexColor('8b5cf6')).toBe(true);
    expect(isHexColor('#XYZXYZ')).toBe(false);
    expect(normalizeHexColor(' 8b5cf6 ')).toBe('#8B5CF6');
  });

  it.each([
    ['#FFFFFF', '#201A2C'],
    ['#000000', '#FFFFFF'],
    ['#8B5CF6', '#FFFFFF'],
    ['#FFB6D9', '#201A2C'],
    ['#1D4ED8', '#FFFFFF']
  ])('escolhe um foreground local legível para %s', (profileColor, expectedForeground) => {
    expect(getReadableProfileColors(profileColor, '#D8CCFF').foreground).toBe(expectedForeground);
  });

  it('preserva as cores escolhidas nas superfícies derivadas e usa a secondary nos botões', () => {
    const colors = getReadableProfileColors('#8B5CF6', '#D8CCFF');

    expect(colors.primarySurface).toContain('#8B5CF6');
    expect(colors.secondarySurface).toContain('#D8CCFF');
    expect(colors.secondaryGlass).toContain('#D8CCFF');
    expect(colors.buttonBackground).toContain('#D8CCFF');
    expect(colors.buttonForeground).toBe('#201A2C');
  });

  it.each([
    ['#FFFFFF', '#E9E9EF', '#201A2C'],
    ['#080808', '#1E1028', '#FFFFFF'],
    ['#781D2A', '#343434', '#FFFFFF'],
    ['#0C4A6E', '#164E63', '#FFFFFF']
  ])('deriva contraste local para %s / %s', (primary, secondary, foreground) => {
    const colors = getReadableProfileColors(primary, secondary);

    expect(colors.foreground).toBe(foreground);
    expect(colors.primarySurface).toContain(primary);
    expect(colors.secondarySurface).toContain(secondary);
  });
});
