export interface SenslabInviteToken {
  token: string;
  sessionId: string;

  createdAt: string;
  createdBy?: string;

  expiresAt?: string | null;
  usedAt?: string | null;
}
