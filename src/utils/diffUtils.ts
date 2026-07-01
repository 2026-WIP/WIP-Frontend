import { diffLines } from 'diff';

export interface DiffSummary {
  added: number;
  removed: number;
}

export function computeDiffSummary(original: string, modified: string): DiffSummary {
  const changes = diffLines(original, modified);
  let added = 0;
  let removed = 0;
  for (const c of changes) {
    const lines = (c.value.match(/\n/g) ?? []).length;
    if (c.added) added += lines;
    if (c.removed) removed += lines;
  }
  return { added, removed };
}
