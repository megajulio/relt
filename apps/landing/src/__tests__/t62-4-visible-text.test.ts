/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D3) — T62-4: guardián de la DEC-020.
 *
 * Falla si queda texto visible escrito en el código de `apps/landing/src`
 * (texto JSX, los 4 atributos, los valores de las propiedades de etiqueta y el
 * primer argumento de alert/confirm/toast), salvo lo que esté en la allowlist.
 */
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { allowlistTexts, scanProject, type Violation } from '@/i18n/visible-text';

const SRC = path.join(process.cwd(), 'src');

function format(violations: Violation[]): string {
  return violations
    .map((v) => `${v.file}:${v.line}:${v.column}  [${v.kind}]  ${JSON.stringify(v.text)}`)
    .join('\n');
}

describe('T62-4 · guardián de texto visible (DEC-020)', () => {
  it('no queda texto visible en el código: todo sale del catálogo', () => {
    const violations = scanProject(SRC);
    expect(format(violations), `${violations.length} textos sin migrar`).toBe('');
  });

  it('la allowlist solo lleva nombres propios y técnicos', () => {
    // Guardia del propio guardián: la allowlist es corta y revisable.
    expect(allowlistTexts.length).toBeLessThan(60);
    for (const text of allowlistTexts) {
      expect(text.trim()).toBe(text);
      expect(text.length).toBeGreaterThan(0);
    }
  });
});
