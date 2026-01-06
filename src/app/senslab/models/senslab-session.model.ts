import type { SenslabDomain, SenslabSessionStatus } from './senslab-domain.model';

export interface SenslabSession {
  id: string;
  sessionCode: string;

  domain: SenslabDomain;
  status: SenslabSessionStatus;

  title: string;

  createdAt: string;
  updatedAt: string;

  opensAt?: string | null;

  productId?: string;
  batchId?: string;

  panelGroupId?: string;

  sampleIds: string[];
}
