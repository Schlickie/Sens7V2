import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SenslabStorageService } from '../senslab/senslab-storage.service';
import type { SenslabResponse } from '../senslab/models/senslab-response.model';
import { makeId, nowIso } from '../shared/id.util';

@Component({
  selector: 'app-panel-sample',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
  <div class="shell" *ngIf="sample && session">
    <h2 style="margin:0 0 6px 0">{{ sample.label }}</h2>
    <div class="muted">
      Method: <b>{{ sample.methodCore.method }}</b>
      <span *ngIf="seatNumber"> · Seat <b>{{ seatNumber }}</b></span>
    </div>

    <div *ngIf="session.status !== 'ready'" class="warn">
      Session not ready.
    </div>

    <!-- PROFILE -->
    <div class="card" *ngIf="sample.methodCore.method === 'profile'">
      <div class="hint">
        Use the sliders: <b>0 = wenig</b>, <b>100 = viel</b>.
      </div>

      <div class="grid">
        <div class="ar" *ngFor="let a of profileItems">
          <div class="name">{{ a.name }}</div>
          <input type="range" min="0" max="100" [(ngModel)]="scores[a.id]" />
          <div class="val">{{ scores[a.id] }}</div>
        </div>
      </div>

      <div class="row" style="margin-top:10px">
        <label>Free text (optional)</label>
        <textarea rows="3" [(ngModel)]="freeText" placeholder="Notes..."></textarea>
      </div>

      <button type="button" (click)="submitProfile()" [disabled]="session.status !== 'ready'">
        Submit
      </button>

      <div class="muted" style="margin-top:8px" *ngIf="hint">{{ hint }}</div>
    </div>

    <!-- TRIANGLE -->
    <div class="card" *ngIf="sample.methodCore.method === 'triangle'">
      <div class="hint">
        Wähle die Probe, die <b>abweicht</b>.
      </div>

      <div *ngIf="seatRequired && !seatNumber" class="warn">
        Seat required, but missing. Please re-join the session.
      </div>

      <div *ngIf="!triangleCodes.length" class="warn">
        Triangle is not configured yet (no triplets generated). Ask senslab to generate triplets.
      </div>

      <div *ngIf="triangleCodes.length" class="tri">
        <button type="button"
                class="triBtn"
                *ngFor="let c of triangleCodes"
                [class.sel]="triangleChoice === c"
                (click)="triangleChoice = c">
          {{ c }}
        </button>
      </div>

      <div class="row" style="margin-top:10px">
        <label>Free text (optional)</label>
        <textarea rows="3" [(ngModel)]="freeText" placeholder="Notes..."></textarea>
      </div>

      <button type="button"
              (click)="submitTriangle()"
              [disabled]="session.status !== 'ready' || !triangleCodes.length || !triangleChoice || (seatRequired && !seatNumber)">
        Submit
      </button>

      <div class="muted" style="margin-top:8px" *ngIf="hint">{{ hint }}</div>
    </div>

  </div>
  `,
  styles: [`
    .shell{ padding:16px; max-width:900px; margin:0 auto; }
    .muted{ opacity:.7; font-size:13px; margin-top:6px; }
    .warn{ margin-top:10px; padding:10px; border:1px solid #f0c; border-radius:12px; opacity:.85; }
    .card{ margin-top:12px; padding:12px; border:1px solid #ddd; border-radius:12px; background:#fff; }
    .hint{ opacity:.8; margin-bottom:10px; }
    .grid{ display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px; }
    .ar{ border:1px solid #eee; border-radius:12px; padding:10px; }
    .name{ font-weight:700; margin-bottom:6px; }
    .val{ opacity:.75; margin-top:6px; font-size:13px; }
    textarea{ width:100%; padding:8px; border:1px solid #ddd; border-radius:10px; }
    .row{ display:flex; flex-direction:column; gap:6px; }

    .tri{ display:flex; gap:10px; flex-wrap:wrap; margin-top:6px; }
    .triBtn{
      padding:14px 18px; border:1px solid #ddd; border-radius:14px;
      background:#fff; cursor:pointer; font-weight:800;
    }
    .triBtn.sel{ border-width:2px; }

    @media (max-width: 800px){ .grid{ grid-template-columns: 1fr; } }
  `]
})
export class PanelSampleComponent implements OnInit {
  sessionId = '';
  sampleId = '';

  session: any = null;
  sample: any = null;

  panelistId = '';
  panelistName = '';
  seatNumber: number | null = null;

  seatRequired = false;

  hint = '';

  // profile state
  profileItems: { id: string; name: string; description?: string }[] = [];
  scores: Record<string, number> = {};

  // shared
  freeText = '';

  // triangle state
  triangleCodes: string[] = [];
  triangleOddCode: string | null = null;
  triangleChoice: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: SenslabStorageService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    this.sampleId = this.route.snapshot.paramMap.get('sampleId') || '';

    // navigation state first
    const nav = this.router.getCurrentNavigation();
    const st: any = nav?.extras?.state || history.state || {};
    this.panelistId = st.panelistId || '';
    this.panelistName = st.panelistName || '';
    this.seatNumber = (st.seatNumber ?? null);

    // fallback to sessionStorage (reload safe)
    if (!this.panelistId) {
      try {
        const raw = sessionStorage.getItem(`senslab_panelist_${this.sessionId}`);
        const p = raw ? JSON.parse(raw) : null;
        this.panelistId = p?.panelistId || '';
        this.panelistName = p?.panelistName || '';
        this.seatNumber = (p?.seatNumber ?? null);
      } catch {}
    }

    this.reload();
  }

  reload(): void {
    this.hint = '';

    this.session = this.store.getSessionById(this.sessionId);
    this.sample = this.store.getSampleById(this.sampleId);

    // seat required?
    const seatCount = this.store.getSeatCountForSession(this.sessionId);
    this.seatRequired = seatCount > 1;

    if (!this.panelistId) {
      this.hint = 'Missing panelist ID. Please re-join the session.';
      return;
    }

    if (!this.sample) return;

    // reset method-specific state
    this.profileItems = [];
    this.scores = {};
    this.triangleCodes = [];
    this.triangleOddCode = null;
    this.triangleChoice = null;
    this.freeText = '';

    // ───── PROFILE ─────
    if (this.sample.methodCore?.method === 'profile') {
      const snap = this.sample.methodCore.config.snapshot || [];
      this.profileItems = snap.length
        ? snap
        : (this.sample.methodCore.config.descriptorLeafIds || []).map((id: string) => ({ id, name: id }));

      const ids = this.profileItems.map(x => x.id);
      const next: Record<string, number> = {};
      for (const id of ids) next[id] = 0;
      this.scores = next;

      const existing = this.store.getResponseForPanelist(this.sampleId, this.panelistId);
      if (existing && existing.method === 'profile') {
        this.scores = { ...next, ...(existing.methodCoreAnswer?.intensities || {}) };
        this.freeText = existing.freeText || '';
      }
    }

    // ───── TRIANGLE ─────
    if (this.sample.methodCore?.method === 'triangle') {
      if (this.seatRequired && !this.seatNumber) {
        // join should have collected it; block execution
        return;
      }

      const triplet = this.store.getTriangleTriplet(this.sampleId, this.seatNumber ?? 1);
      if (!triplet) {
        // not configured yet
        return;
      }

      this.triangleCodes = [...triplet.codes];
      this.triangleOddCode = triplet.codes[triplet.oddIndex] || null;

      const existing = this.store.getResponseForPanelist(this.sampleId, this.panelistId);
      if (existing && existing.method === 'triangle') {
        this.triangleChoice = existing.methodCoreAnswer?.choiceCode || null;
        this.freeText = existing.freeText || '';
      }
    }
  }

  submitProfile(): void {
    this.hint = '';

    if (!this.panelistId) {
      this.hint = 'Missing panelist ID. Please re-join.';
      return;
    }
    if (!this.session || this.session.status !== 'ready') return;
    if (!this.sample || this.sample.methodCore.method !== 'profile') return;

    const existing = this.store.getResponseForPanelist(this.sampleId, this.panelistId);

    const resp: SenslabResponse = {
      id: existing?.id || makeId('senslab_resp'),
      sessionId: this.sessionId,
      sampleId: this.sampleId,
      panelistId: this.panelistId,
      panelistName: this.panelistName || this.panelistId,
      seatNumber: this.seatNumber ?? null,
      method: 'profile',
      methodCoreAnswer: {
        intensities: { ...this.scores }
      },
      freeText: (this.freeText || '').trim(),
      addonsAnswers: null,
      submittedAt: nowIso()
    };

    this.store.upsertResponse(resp);

    this.router.navigate(['/panel/session', this.sessionId], {
      state: { panelistId: this.panelistId, panelistName: this.panelistName, seatNumber: this.seatNumber }
    });
  }

  submitTriangle(): void {
    this.hint = '';

    if (!this.panelistId) {
      this.hint = 'Missing panelist ID. Please re-join.';
      return;
    }
    if (!this.session || this.session.status !== 'ready') return;
    if (!this.sample || this.sample.methodCore.method !== 'triangle') return;

    if (this.seatRequired && !this.seatNumber) {
      this.hint = 'Seat required. Please re-join.';
      return;
    }

    if (!this.triangleCodes.length || !this.triangleOddCode) {
      this.hint = 'Triangle is not configured (no triplets).';
      return;
    }
    if (!this.triangleChoice) {
      this.hint = 'Please select one code.';
      return;
    }

    const existing = this.store.getResponseForPanelist(this.sampleId, this.panelistId);
    const correct = this.triangleChoice === this.triangleOddCode;

    const resp: SenslabResponse = {
      id: existing?.id || makeId('senslab_resp'),
      sessionId: this.sessionId,
      sampleId: this.sampleId,
      panelistId: this.panelistId,
      panelistName: this.panelistName || this.panelistId,
      seatNumber: this.seatNumber ?? null,
      method: 'triangle',
      methodCoreAnswer: {
        choiceCode: this.triangleChoice,
        correct
      },
      freeText: (this.freeText || '').trim(),
      addonsAnswers: null,
      submittedAt: nowIso()
    };

    this.store.upsertResponse(resp);

    this.router.navigate(['/panel/session', this.sessionId], {
      state: { panelistId: this.panelistId, panelistName: this.panelistName, seatNumber: this.seatNumber }
    });
  }
}
