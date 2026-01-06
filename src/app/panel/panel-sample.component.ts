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
    <div class="muted">Method: <b>{{ sample.methodCore.method }}</b></div>

    <div *ngIf="session.status !== 'ready'" class="warn">
      Session not ready.
    </div>

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

      <button type="button" (click)="submit()" [disabled]="session.status !== 'ready'">Submit</button>
      <div class="muted" style="margin-top:8px" *ngIf="hint">{{ hint }}</div>
    </div>

    <div class="card" *ngIf="sample.methodCore.method !== 'profile'">
      v1: Only <b>profile</b> is wired end-to-end in this drop.
    </div>
  </div>
  `,
  styles: [`
    .shell{ padding:16px; max-width:900px; margin:0 auto; }
    .muted{ opacity:.7; font-size:13px; margin-top:6px; }
    .warn{ margin-top:10px; padding:10px; border:1px solid #f0c; border-radius:12px; opacity:.85; }
    .card{ margin-top:12px; padding:12px; border:1px solid #ddd; border-radius:12px; }
    .hint{ opacity:.8; margin-bottom:10px; }
    .grid{ display:grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap:10px; }
    .ar{ border:1px solid #eee; border-radius:12px; padding:10px; }
    .name{ font-weight:700; margin-bottom:6px; }
    .val{ opacity:.75; margin-top:6px; font-size:13px; }
    textarea{ width:100%; padding:8px; border:1px solid #ddd; border-radius:10px; }
    .row{ display:flex; flex-direction:column; gap:6px; }
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
  hint = '';

  profileItems: { id: string; name: string; description?: string }[] = [];
  scores: Record<string, number> = {};
  freeText = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: SenslabStorageService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    this.sampleId = this.route.snapshot.paramMap.get('sampleId') || '';

    const nav = this.router.getCurrentNavigation();
    const st: any = nav?.extras?.state || history.state || {};
    this.panelistId = st.panelistId || '';
    this.panelistName = st.panelistName || '';

    if (!this.panelistId) {
      try {
        const raw = sessionStorage.getItem(`senslab_panelist_${this.sessionId}`);
        const p = raw ? JSON.parse(raw) : null;
        this.panelistId = p?.panelistId || '';
        this.panelistName = p?.panelistName || '';
      } catch {}
    }

    this.reload();
  }

  reload(): void {
    this.session = this.store.getSessionById(this.sessionId);
    this.sample = this.store.getSampleById(this.sampleId);

    if (!this.panelistId) {
      this.hint = 'Missing panelist ID. Please re-join the session.';
      return;
    }

    if (this.sample?.methodCore?.method === 'profile') {
      const snap = this.sample.methodCore.config.snapshot || [];
      this.profileItems = snap.length
        ? snap
        : (this.sample.methodCore.config.descriptorLeafIds || []).map((id: string) => ({ id, name: id }));

      const ids = this.profileItems.map(x => x.id);
      const next: Record<string, number> = {};
      for (const id of ids) next[id] = Number.isFinite(this.scores[id]) ? this.scores[id] : 0;
      this.scores = next;

      const existing = this.store.getResponseForPanelist(this.sampleId, this.panelistId);
      if (existing && existing.method === 'profile') {
        this.scores = { ...next, ...(existing.methodCoreAnswer?.intensities || {}) };
        this.freeText = existing.freeText || '';
      }
    }
  }

  submit(): void {
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
      seatNumber: null,
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
      state: { panelistId: this.panelistId, panelistName: this.panelistName }
    });
  }
}
