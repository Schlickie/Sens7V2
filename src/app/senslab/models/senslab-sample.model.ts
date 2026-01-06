export type SenslabMethod = 'triangle' | 'profile' | 'threshold';

export interface MethodCoreBase {
  method: SenslabMethod;
}

export interface TriangleCore extends MethodCoreBase {
  method: 'triangle';
  config: {
    seatCount?: number;
    // v1: placeholder – randomization setups kommen später
  };
}

export interface ProfileCore extends MethodCoreBase {
  method: 'profile';
  config: {
    descriptorSetId: string;         // z.B. 'beer_wheel_v1' (v1 fix)
    descriptorLeafIds: string[];     // ausgewählte leaf IDs
    snapshot?: { id: string; name: string; description?: string }[];
  };
}

export interface ThresholdCore extends MethodCoreBase {
  method: 'threshold';
  config: {
    // v1 placeholder
    compoundId?: string;
    levels?: number[];
    seatCount?: number;
  };
}

export type MethodCore = TriangleCore | ProfileCore | ThresholdCore;

export interface SampleAddonSchema {
  // v1 bewusst generisch
  widgets?: any[];
}

export interface SenslabSample {
  id: string;
  sessionId: string;
  label: string;
  createdAt: string;
  updatedAt: string;

  methodCore: MethodCore;

  // Addons dürfen in ALLEN Domains existieren – werden bei Vergleichbarkeit ignoriert
  addons?: {
    schema?: SampleAddonSchema;
  };
}
