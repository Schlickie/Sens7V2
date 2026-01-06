import { Injectable } from '@angular/core';
import { safeParse } from '../shared/storage.util';
import { makeId, makeShortCode, makeToken, nowIso } from '../shared/id.util';

import type { SenslabSession } from './models/senslab-session.model';
import type { SenslabSample } from './models/senslab-sample.model';
import type { SenslabResponse } from './models/senslab-response.model';
import type { SenslabDomain } from './models/senslab-domain.model';
import type { SenslabInviteToken } from './models/senslab-invite-token.model';

const LS_SESSIONS = 'senslab_sessions';
const LS_SAMPLES = 'senslab_samples';
const LS_RESPONSES = 'senslab_responses';
const LS_TOKENS = 'senslab_inviteTokens';

@Injectable({ providedIn: 'root' })
export class SenslabStorageService {

  // ───────────────── Sessions ─────────────────
  getSessions(): SenslabSession[] {
    return safeParse<SenslabSession[]>(localStorage.getItem(LS_SESSIONS), []);
  }

  getSessionById(id: string): SenslabSession | null {
    return this.getSessions().find(s => s.id === id) || null;
  }

  getSessionByCode(sessionCode: string): SenslabSession | null {
    const code = (sessionCode || '').trim().toUpperCase();
    if (!code) return null;
    return this.getSessions().find(s => (s.sessionCode || '').toUpperCase() === code) || null;
  }

  upsertSession(session: SenslabSession): void {
    const all = this.getSessions();
    const idx = all.findIndex(s => s.id === session.id);
    if (idx >= 0) all[idx] = session;
    else all.unshift(session);
    localStorage.setItem(LS_SESSIONS, JSON.stringify(all));
  }

  createSession(domain: SenslabDomain, title?: string): SenslabSession {
    const t = nowIso();
    const session: SenslabSession = {
      id: makeId('senslab_session'),
      sessionCode: makeShortCode(6),
      domain,
      status: 'draft',
      title: (title || '').trim() || `${domain.toUpperCase()} Session`,
      createdAt: t,
      updatedAt: t,
      opensAt: null,
      sampleIds: []
    };
    this.upsertSession(session);
    return session;
  }

  setSessionStatus(sessionId: string, status: 'draft' | 'ready' | 'closed'): void {
    const s = this.getSessionById(sessionId);
    if (!s) return;
    s.status = status;
    s.updatedAt = nowIso();
    this.upsertSession(s);
  }

  // ───────────────── Samples ─────────────────
  getSamples(): SenslabSample[] {
    return safeParse<SenslabSample[]>(localStorage.getItem(LS_SAMPLES), []);
  }

  getSampleById(id: string): SenslabSample | null {
    return this.getSamples().find(x => x.id === id) || null;
  }

  getSamplesForSession(sessionId: string): SenslabSample[] {
    return this.getSamples().filter(s => s.sessionId === sessionId);
  }

  upsertSample(sample: SenslabSample): void {
    const all = this.getSamples();
    const idx = all.findIndex(s => s.id === sample.id);
    if (idx >= 0) all[idx] = sample;
    else all.unshift(sample);
    localStorage.setItem(LS_SAMPLES, JSON.stringify(all));
  }

  createProfileSample(sessionId: string, label?: string): SenslabSample {
    const session = this.getSessionById(sessionId);
    if (!session) throw new Error('Session not found');

    const t = nowIso();
    const sample: SenslabSample = {
      id: makeId('senslab_sample'),
      sessionId,
      label: (label || '').trim() || 'Profile',
      createdAt: t,
      updatedAt: t,
      methodCore: {
        method: 'profile',
        config: {
          descriptorSetId: 'beer_wheel_v1',
          descriptorLeafIds: [],
          snapshot: []
        }
      },
      addons: { schema: { widgets: [] } }
    };

    session.sampleIds = [...(session.sampleIds || []), sample.id];
    session.updatedAt = nowIso();
    this.upsertSample(sample);
    this.upsertSession(session);

    return sample;
  }

  updateProfileSelection(
    sampleId: string,
    leafIds: string[],
    snapshot?: { id: string; name: string; description?: string }[]
  ): void {
    const sample = this.getSampleById(sampleId);
    if (!sample || sample.methodCore.method !== 'profile') return;

    sample.methodCore.config.descriptorLeafIds = [...(leafIds || [])];
    sample.methodCore.config.snapshot = snapshot ? [...snapshot] : sample.methodCore.config.snapshot;

    sample.updatedAt = nowIso();
    this.upsertSample(sample);
  }

  // ───────────────── Responses ─────────────────
  getResponses(): SenslabResponse[] {
    return safeParse<SenslabResponse[]>(localStorage.getItem(LS_RESPONSES), []);
  }

  getResponsesForSession(sessionId: string): SenslabResponse[] {
    return this.getResponses().filter(r => r.sessionId === sessionId);
  }

  getResponsesForSample(sampleId: string): SenslabResponse[] {
    return this.getResponses().filter(r => r.sampleId === sampleId);
  }

  getResponseForPanelist(sampleId: string, panelistId: string): SenslabResponse | null {
    const pid = (panelistId || '').trim();
    if (!pid) return null;
    return this.getResponses().find(r => r.sampleId === sampleId && r.panelistId === pid) || null;
  }

  upsertResponse(resp: SenslabResponse): void {
    const all = this.getResponses();
    const idx = all.findIndex(r => r.id === resp.id);
    if (idx >= 0) all[idx] = resp;
    else all.unshift(resp);
    localStorage.setItem(LS_RESPONSES, JSON.stringify(all));
  }

  // ───────────────── Invite Tokens (one-time) ─────────────────
  getTokens(): SenslabInviteToken[] {
    return safeParse<SenslabInviteToken[]>(localStorage.getItem(LS_TOKENS), []);
  }

  createInviteToken(sessionId: string): SenslabInviteToken {
    const t = nowIso();
    const tokenObj: SenslabInviteToken = {
      token: makeToken(28),
      sessionId,
      createdAt: t,
      createdBy: undefined,
      expiresAt: null,
      usedAt: null
    };
    const all = this.getTokens();
    all.unshift(tokenObj);
    localStorage.setItem(LS_TOKENS, JSON.stringify(all));
    return tokenObj;
  }

  private isTokenExpired(t: SenslabInviteToken): boolean {
    if (!t.expiresAt) return false;
    const exp = Date.parse(t.expiresAt);
    if (Number.isNaN(exp)) return false;
    return exp < Date.now();
  }

  resolveToken(token: string): SenslabInviteToken | null {
    const tok = (token || '').trim();
    if (!tok) return null;

    const all = this.getTokens();
    const found = all.find(t => t.token === tok) || null;
    if (!found) return null;

    // one-time semantics:
    if (found.usedAt) return null;
    if (this.isTokenExpired(found)) return null;

    return found;
  }

  markTokenUsed(token: string): void {
    const tok = (token || '').trim();
    if (!tok) return;

    const all = this.getTokens();
    const idx = all.findIndex(t => t.token === tok);
    if (idx < 0) return;

    // idempotent
    if (all[idx].usedAt) return;

    all[idx] = { ...all[idx], usedAt: nowIso() };
    localStorage.setItem(LS_TOKENS, JSON.stringify(all));
  }
}
