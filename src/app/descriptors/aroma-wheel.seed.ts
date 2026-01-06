import type { AromaWheelNode } from './aroma-wheel.model';

export const AROMA_WHEEL_SEED_VERSION = 1;

export const AROMA_WHEEL_SEED: AromaWheelNode[] = [
  { id: 'wheel', name: 'Aroma Wheel', kind: 'group', parentId: null },

  { id: 'fruchtig', name: 'Fruchtig', kind: 'group', parentId: 'wheel' },
  { id: 'fruchtig_zitrus', name: 'Zitrusfrucht', kind: 'group', parentId: 'fruchtig' },
  { id: 'zitrone', name: 'Zitrone', kind: 'leaf', parentId: 'fruchtig_zitrus' },
  { id: 'grapefruit', name: 'Grapefruit', kind: 'leaf', parentId: 'fruchtig_zitrus' },
  { id: 'orange', name: 'Orange', kind: 'leaf', parentId: 'fruchtig_zitrus' },

  // … (deinen kompletten Seed hier weiter)
];
