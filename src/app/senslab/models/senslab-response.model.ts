import type { SenslabMethod } from './senslab-sample.model';

export interface ResponseBase {
  id: string;
  sessionId: string;
  sampleId: string;

  panelistId: string;
  panelistName?: string;
  seatNumber?: number | null;

  method: SenslabMethod;

  // Freitext: immer vorhanden
  freeText?: string;

  // Addons: optional
  addonsAnswers?: any;

  submittedAt: string;
}

export interface ProfileResponse extends ResponseBase {
  method: 'profile';
  methodCoreAnswer: {
    intensities: Record<string, number>; // leafId -> 0..100
  };
}

export interface TriangleResponse extends ResponseBase {
  method: 'triangle';
  methodCoreAnswer: {
    choiceCode: string;
    correct: boolean;
  };
}

export interface ThresholdResponse extends ResponseBase {
  method: 'threshold';
  methodCoreAnswer: any;
}

export type SenslabResponse = ProfileResponse | TriangleResponse | ThresholdResponse;
