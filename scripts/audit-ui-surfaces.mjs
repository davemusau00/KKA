import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { resolve, relative, dirname } from 'node:path';
import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process';
const require = createRequire(import.meta.url);
const ts = require('typescript');
const root = resolve(import.meta.dirname, '..');
const sourceRoot = resolve(root, 'apps/web/src');
const files = [];
function walk(directory) {
  for (const entry of readdirSync(directory, { withFileTypes: true })) {
    const file = resolve(directory, entry.name);
    if (entry.isDirectory()) walk(file);
    else if (/\.tsx?$/.test(entry.name)) files.push(file);
  }
}
walk(sourceRoot);
const parsed = new Map(files.map(file => [file, ts.createSourceFile(file, readFileSync(file, 'utf8'), ts.ScriptTarget.Latest, true)]));
const normalized = file => relative(root, file).replaceAll('\\', '/');
const imports = new Map();
for (const [file, source] of parsed) {
  const edges = [];
  for (const statement of source.statements) {
    if (!ts.isImportDeclaration(statement) || !ts.isStringLiteral(statement.moduleSpecifier) || statement.importClause?.isTypeOnly) continue;
    const specifier = statement.moduleSpecifier.text;
    if (!specifier.startsWith('.')) continue;
    const base = resolve(dirname(file), specifier);
    const target = [base, base + '.tsx', base + '.ts', resolve(base, 'index.ts'), resolve(base, 'index.tsx')].find(candidate => parsed.has(candidate));
    if (target) edges.push(target);
  }
  imports.set(file, edges);
}
const reachable = new Set();
function visitFile(file) { if (reachable.has(file)) return; reachable.add(file); for (const edge of imports.get(file) || []) visitFile(edge); }
visitFile(resolve(sourceRoot, 'App.tsx'));
const surfaces = [];
const contextActions = [];
for (const [file, source] of parsed) {
  const controls = [], apiCalls = [], contextBindings = new Set();
  const line = node => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;
  function scan(node) {
    if (ts.isCallExpression(node)) {
      const callee = node.expression.getText(source);
      if (/^(apiClient|[A-Za-z]+Api)\./.test(callee) || callee === 'fetch') apiCalls.push({ line: line(node), callee, argument: node.arguments[0]?.getText(source) || '' });
    }
    if (ts.isVariableDeclaration(node) && ts.isObjectBindingPattern(node.name) && node.initializer && /^useApp\(/.test(node.initializer.getText(source))) {
      for (const element of node.name.elements) contextBindings.add(element.name.getText(source));
    }
    if (file.endsWith('AppContext.tsx') && ts.isVariableDeclaration(node) && ts.isIdentifier(node.name) && node.initializer && ts.isCallExpression(node.initializer) && node.initializer.expression.getText(source) === 'useCallback') {
      const body = node.initializer.arguments[0]?.getText(source) || '';
      contextActions.push({ name: node.name.text, line: line(node), apiCalls: [...new Set(body.match(/\b(?:[A-Za-z]+Api|apiClient)\.[A-Za-z]+/g) || [])], localSetters: [...new Set(body.match(/\bset[A-Z][A-Za-z]+(?=\()/g) || [])] });
    }
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      const allAttributes = {};
      for (const attribute of node.attributes.properties) if (ts.isJsxAttribute(attribute)) allAttributes[attribute.name.getText(source)] = attribute.initializer?.getText(source) || 'true';
      if (['button', 'input', 'select', 'textarea', 'form', 'a'].includes(tag) || allAttributes.onClick || /cursor-pointer|button/.test((allAttributes.className || '') + (allAttributes.role || ''))) {
        const attributes = Object.fromEntries(Object.entries(allAttributes).filter(([name]) => name !== 'className' && name !== 'style'));
        const parent = ts.isJsxElement(node.parent) ? node.parent : undefined;
        const labels = [];
        function label(node) { if (ts.isJsxText(node)) labels.push(node.text.trim()); else if (ts.isJsxElement(node)) node.children.forEach(label); }
        parent?.children.forEach(label);
        const text = labels.filter(Boolean).join(' ').replace(/\s+/g, ' ');
        controls.push({ line: line(node), tag, text, attributes });
      }
    }
    ts.forEachChild(node, scan);
  }
  scan(source);
  if (file.includes(resolve(sourceRoot, 'components')) && file.endsWith('.tsx')) surfaces.push({ file: normalized(file), reachableFromAppImports: reachable.has(file), contextBindings: [...contextBindings].sort(), directApiCalls: apiCalls, controls });
}
surfaces.sort((a, b) => a.file.localeCompare(b.file));
const report = {
  revision: execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim(),
  methodology: 'Static TypeScript AST inventory. Reachability follows relative runtime imports from App.tsx, not permissions or runtime conditions. API call absence alone is not a defect: hooks/context may own persistence. Controls include repeated/template source nodes, not rendered instance counts. Classification requires the accompanying manual audit.',
  totals: { componentFiles: surfaces.length, reachableComponentFiles: surfaces.filter(row => row.reachableFromAppImports).length, nativeControlNodes: surfaces.reduce((sum, row) => sum + row.controls.filter(c => ['button', 'input', 'select', 'textarea', 'form', 'a'].includes(c.tag)).length, 0), allControlCandidates: surfaces.reduce((sum, row) => sum + row.controls.length, 0), contextCallbacks: contextActions.length, contextCallbacksWithDirectApiCalls: contextActions.filter(row => row.apiCalls.length).length },
  surfaces, contextActions,
};
writeFileSync(resolve(root, 'docs/UI_SURFACE_INVENTORY.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report.totals, null, 2));
