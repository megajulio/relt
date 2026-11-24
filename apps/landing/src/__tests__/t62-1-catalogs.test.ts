/**
 * Orden #62 v2 · Paso 2 — T62-1 (ANEXO-62-A · D6).
 *
 * `es.json` y `en.json` tienen exactamente las mismas claves, sin valores vacíos;
 * cada clave usa el mismo conjunto de `{parámetros}`; y una clave plural tiene
 * `.one` y `.other` en los dos idiomas.
 */
import { describe, expect, it } from 'vitest';
import enJson from '@/i18n/messages/en.json';
import esJson from '@/i18n/messages/es.json';

const en = enJson as Record<string, string>;
const es = esJson as Record<string, string>;

function params(text: string): string[] {
  return (text.match(/\{(\w+)\}/g) ?? []).sort();
}

function pluralBases(catalog: Record<string, string>): Set<string> {
  const bases = new Set<string>();
  for (const key of Object.keys(catalog)) {
    const match = key.match(/^(.*)\.(one|other|zero|two|few|many)$/);
    if (match) bases.add(match[1]);
  }
  return bases;
}

describe('T62-1 · catálogos es/en', () => {
  it('tienen exactamente las mismas claves', () => {
    expect(Object.keys(es).sort()).toEqual(Object.keys(en).sort());
    expect(Object.keys(en).length).toBeGreaterThan(0);
  });

  it('no hay ningún valor vacío', () => {
    for (const [key, value] of Object.entries(en)) {
      expect(value.trim(), `en:${key}`).not.toBe('');
    }
    for (const [key, value] of Object.entries(es)) {
      expect(value.trim(), `es:${key}`).not.toBe('');
    }
  });

  it('los dos idiomas usan el mismo conjunto de parámetros por clave', () => {
    for (const key of Object.keys(en)) {
      expect(params(es[key]), key).toEqual(params(en[key]));
    }
  });

  it('las claves plurales tienen .one y .other en los dos idiomas', () => {
    const bases = pluralBases(en);
    for (const base of pluralBases(es)) bases.add(base);
    expect(bases.size).toBeGreaterThan(0);
    for (const base of bases) {
      expect(en[`${base}.one`], `en ${base}.one`).toBeTruthy();
      expect(en[`${base}.other`], `en ${base}.other`).toBeTruthy();
      expect(es[`${base}.one`], `es ${base}.one`).toBeTruthy();
      expect(es[`${base}.other`], `es ${base}.other`).toBeTruthy();
    }
  });

  it('las claves están agrupadas por pantalla', () => {
    const groups = new Set(Object.keys(en).map((key) => key.split('.')[0]));
    for (const expected of ['activity', 'agents', 'errors', 'landing', 'skills']) {
      expect(groups.has(expected), expected).toBe(true);
    }
  });
});
