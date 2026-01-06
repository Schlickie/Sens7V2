export type AromaWheelKind = 'group' | 'leaf';

export interface AromaWheelNode {
  id: string;
  name: string;
  kind: AromaWheelKind;
  parentId: string | null;       // wichtig: nie undefined
  description?: string;
}

export interface AromaWheelTreeNode extends AromaWheelNode {
  children: AromaWheelTreeNode[];
}
