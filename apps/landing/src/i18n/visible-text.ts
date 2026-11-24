/**
 * Orden #62 v2 · Paso 2 (ANEXO-62-A · D3) — extractor del guardián T62-4.
 *
 * Vive bajo `src/i18n/` (que el guardián no mira). Reglas:
 *   1) texto JSX con letras;
 *   2) valor de `placeholder`/`aria-label`/`title`/`alt` con letras;
 *   3) en `.ts`/`.tsx`, literal con letras que sea valor de una propiedad
 *      `label`, `title`, `description`, `placeholder`, `text`, `message`,
 *      `heading`, `subtitle`, `cta`, `tooltip`, `helper` o `hint`;
 *   4) primer argumento de `alert`, `confirm`, `toast` o `toast.*`.
 *
 * Lo que esté en `allowlist.json` (nombres propios y técnicos) no cuenta.
 */
import fs from 'node:fs';
import path from 'node:path';
import * as ts from 'typescript';
import allowlist from './allowlist.json';

export interface Violation {
  file: string;
  line: number;
  column: number;
  kind: string;
  text: string;
}

const JSX_ATTRS = new Set(['placeholder', 'aria-label', 'title', 'alt']);
const LABEL_PROPS = new Set([
  'label',
  'title',
  'description',
  'placeholder',
  'text',
  'message',
  'heading',
  'subtitle',
  'cta',
  'tooltip',
  'helper',
  'hint',
]);
const CALLS = new Set(['alert', 'confirm', 'toast']);
const LETTERS = /[A-Za-z\u00C0-\u024F]/;
const EXCLUDED_DIRS = new Set(['node_modules', '__tests__', 'i18n', '.next']);

export const allowlistTexts: readonly string[] = allowlist as string[];

/** Todos los `.ts`/`.tsx` bajo `root`, sin `__tests__` ni `i18n/`. */
export function walkSources(root: string, acc: string[] = []): string[] {
  for (const entry of fs.readdirSync(root, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      walkSources(path.join(root, entry.name), acc);
    } else if (/\.tsx?$/.test(entry.name)) {
      acc.push(path.join(root, entry.name));
    }
  }
  return acc;
}

function literalText(node: ts.Node | undefined): string | null {
  if (!node) return null;
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isJsxExpression(node) && node.expression) {
    const inner = node.expression;
    if (ts.isStringLiteral(inner) || ts.isNoSubstitutionTemplateLiteral(inner)) return inner.text;
  }
  return null;
}

function propertyName(name: ts.PropertyName | undefined): string | null {
  if (!name) return null;
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return null;
}

function calleeName(expr: ts.Expression): string | null {
  if (ts.isIdentifier(expr)) return expr.text;
  if (ts.isPropertyAccessExpression(expr)) {
    const left = calleeName(expr.expression);
    return left ? `${left}.${expr.name.text}` : null;
  }
  return null;
}

/** Extrae las violaciones de un fichero (texto ya migrado -> lista vacía). */
export function findViolations(file: string, source: string, allow: Set<string>): Violation[] {
  const sf = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );
  const out: Violation[] = [];

  const check = (node: ts.Node, kind: string, raw: string) => {
    const text = raw.replace(/\s+/g, ' ').trim();
    if (!text || !LETTERS.test(text) || allow.has(text)) return;
    const { line, character } = sf.getLineAndCharacterOfPosition(node.getStart(sf));
    out.push({ file, line: line + 1, column: character + 1, kind, text });
  };

  const visit = (node: ts.Node) => {
    if (node.kind === ts.SyntaxKind.JsxText) {
      check(node, 'jsx-text', (node as ts.JsxText).text);
    } else if (ts.isJsxAttribute(node)) {
      const name = node.name.getText(sf);
      if (JSX_ATTRS.has(name)) {
        const value = literalText(node.initializer);
        if (value !== null) check(node, `attr:${name}`, value);
      }
    } else if (ts.isPropertyAssignment(node)) {
      const name = propertyName(node.name);
      if (name && LABEL_PROPS.has(name)) {
        const value = literalText(node.initializer);
        if (value !== null) check(node, `prop:${name}`, value);
      }
    } else if (ts.isCallExpression(node)) {
      const name = calleeName(node.expression);
      if (name && (CALLS.has(name) || name.startsWith('toast.'))) {
        const value = literalText(node.arguments[0]);
        if (value !== null) check(node, `call:${name}`, value);
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(sf);

  return out;
}

/** Todas las violaciones bajo `src/` (el conjunto que hace fallar T62-4). */
export function scanProject(srcDir: string): Violation[] {
  const allow = new Set(allowlistTexts);
  const out: Violation[] = [];
  for (const file of walkSources(srcDir).sort()) {
    const source = fs.readFileSync(file, 'utf8');
    out.push(
      ...findViolations(path.relative(srcDir, file).replace(/\\/g, '/'), source, allow),
    );
  }
  return out;
}
