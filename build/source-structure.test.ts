import { readdirSync } from 'node:fs';
import { basename, dirname, extname, join, relative, sep } from 'node:path';
import { describe, expect, it } from 'vitest';

const srcRoot = join(import.meta.dirname, '..', 'src');

const allowedFiles = new Set([
  'main.tsx',
  'router.tsx',
  'vite-env.d.ts',
  'utils/cx.ts',
  'utils/is-react-component.ts',
  'hooks/use-breakpoint.ts',
  'hooks/use-clipboard.ts',
]);
const allowedDirectories = ['components/base/', 'components/application/', 'components/foundations/'];

const kebabCase = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function listSourceFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? listSourceFiles(path) : [path];
  });
}

const files = listSourceFiles(srcRoot)
  .map((path) => relative(srcRoot, path).split(sep).join('/'))
  .filter((path) => /\.tsx?$/.test(path))
  .filter((path) => !allowedFiles.has(path) && !allowedDirectories.some((prefix) => path.startsWith(prefix)));

describe('source structure', () => {
  it('names every .ts and .tsx file in kebab-case', () => {
    const offenders = files.filter((path) => {
      const name = basename(path, extname(path)).replace(/\.d$/, '');
      return !kebabCase.test(name);
    });
    expect(offenders).toEqual([]);
  });

  it('keeps every .tsx file in a folder of the same name', () => {
    const offenders = files
      .filter((path) => path.endsWith('.tsx'))
      .filter((path) => basename(dirname(path)) !== basename(path, '.tsx'));
    expect(offenders).toEqual([]);
  });
});
