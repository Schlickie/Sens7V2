export interface SenslabProduct {
  id: string;
  name: string;
  code?: string;
}

export interface SenslabBatch {
  id: string;
  productId: string;
  name: string;      // Batch label
  reference?: string;
}
