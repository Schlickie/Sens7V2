import type { AromaWheelNode, AromaWheelTreeNode } from './aroma-wheel.model';
import { AROMA_WHEEL_SEED, AROMA_WHEEL_SEED_VERSION } from './aroma-wheel.seed';
import { safeParse } from '../shared/storage.util';

const LS_KEY = 'senslab_aromaWheel_nodes';
const LS_VER_KEY = 'senslab_aromaWheel_seedVersion';

export class AromaWheelRepository {
  ensureSeeded(force = false): void {
    const existing = safeParse<AromaWheelNode[]>(localStorage.getItem(LS_KEY), []);
    const storedVer = safeParse<number>(localStorage.getItem(LS_VER_KEY), 0);

    const needsSeed =
      force ||
      !Array.isArray(existing) ||
      existing.length === 0 ||
      storedVer !== AROMA_WHEEL_SEED_VERSION;

    if (!needsSeed) return;

    localStorage.setItem(LS_KEY, JSON.stringify(AROMA_WHEEL_SEED));
    localStorage.setItem(LS_VER_KEY, JSON.stringify(AROMA_WHEEL_SEED_VERSION));
  }

  getAll(): AromaWheelNode[] {
    return safeParse<AromaWheelNode[]>(localStorage.getItem(LS_KEY), []);
  }

  getLeaves(): AromaWheelNode[] {
    return this.getAll().filter(n => n.kind === 'leaf');
  }

  resolveIds(ids: string[]): { id: string; name: string; description?: string }[] {
    const all = this.getAll();
    const map = new Map(all.map(n => [n.id, n]));
    return (ids || [])
      .map(id => map.get(id))
      .filter((n): n is AromaWheelNode => !!n)
      .map(n => ({ id: n.id, name: n.name, description: n.description }));
  }

  buildTree(): AromaWheelTreeNode {
    const all = this.getAll();

    const map = new Map<string, AromaWheelTreeNode>();
    for (const n of all) {
      // parentId garantiert: string | null
      map.set(n.id, { ...n, children: [] });
    }

    const rootCandidate = all.find(n => n.parentId === null);
    const root = rootCandidate ? map.get(rootCandidate.id) : undefined;

    if (!root) {
      return { id: 'wheel', name: 'Aroma Wheel', kind: 'group', parentId: null, children: [] };
    }

    for (const node of map.values()) {
      if (node.parentId === null) continue;
      const parent = map.get(node.parentId);
      if (parent) parent.children.push(node);
    }

    return root;
  }

  searchLeaves(term: string): AromaWheelNode[] {
    const t = (term || '').trim().toLowerCase();
    if (!t) return this.getLeaves();
    return this.getLeaves().filter(n =>
      (n.name || '').toLowerCase().includes(t) ||
      (n.description || '').toLowerCase().includes(t)
    );
  }
}
