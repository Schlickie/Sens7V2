import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SenslabStorageService } from '../senslab/senslab-storage.service';

@Component({
  selector: 'app-panel-queue',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="shell" *ngIf="session">
    <h2>Session Queue</h2>
    <div class="muted">
      Code: <b>{{ session.sessionCode }}</b> · Status: <b>{{ session.status }}</b>
      <span *ngIf="seatNumber" class="muted"> · Seat <b>{{ seatNumber }}</b></span>
    </div>

    <div *ngIf="session.status !== 'ready'" class="warn">
      This session is not ready yet.
    </div>

    <div class="card">
      <div class="muted">Panelist: <b>{{ panelistId }}</b></div>

      <div class="list">
        <button type="button" class="row"
                *ngFor="let smp of samples"
                (click)="open(smp.id)">
          <div class="title">{{ smp.label }}</div>
          <div class="meta">Method: <b>{{ smp.methodCore.method }}</b> · {{ doneMap[smp.id] ? 'Done' : 'Open' }}</div>
        </button>
      </div>
    </div>
  </div>
  `,
  styles: [`
    .shell{ padding:16px; max-width:900px; margin:0 auto; }
    .muted{ opacity:.7; font-size:13px; margin-top:6px; }
    .warn{ margin-top:10px; padding:10px; border:1px solid #f0c; border-radius:12px; opacity:.85; }
    .card{ margin-top:12px; padding:12px; border:1px solid #ddd; border-radius:12px; }
    .list{ margin-top:10px; display:flex; flex-direction:column; gap:10px; }
    .row{ text-align:left; padding:10px; border:1px solid #eee; border-radius:12px; background:#fff; cursor:pointer; }
    .title{ font-weight:700; }
    .meta{ opacity:.75; font-size:13px; margin-top:4px; }
  `]
})
export class PanelQueueComponent implements OnInit {
  sessionId = '';
  session: any = null;

  panelistId = '';
  panelistName = '';
  seatNumber: number | null = null;

  samples: any[] = [];
  doneMap: Record<string, boolean> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: SenslabStorageService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    this.session = this.store.getSessionById(this.sessionId);

    const nav = this.router.getCurrentNavigation();
    const st: any = nav?.extras?.state || history.state || {};
    this.panelistId = st.panelistId || '';
    this.panelistName = st.panelistName || '';
    this.seatNumber = (st.seatNumber ?? null);

    if (!this.panelistId) {
      try {
        const raw = sessionStorage.getItem(`senslab_panelist_${this.sessionId}`);
        const p = raw ? JSON.parse(raw) : null;
        this.panelistId = p?.panelistId || '';
        this.panelistName = p?.panelistName || '';
        this.seatNumber = (p?.seatNumber ?? null);
      } catch {}
    }

    if (!this.panelistId) {
      this.router.navigate(['/panel']);
      return;
    }

    this.reload();
  }

  reload(): void {
    this.session = this.store.getSessionById(this.sessionId);
    this.samples = this.store.getSamplesForSession(this.sessionId);

    this.doneMap = {};
    for (const s of this.samples) {
      const resp = this.store.getResponseForPanelist(s.id, this.panelistId);
      this.doneMap[s.id] = !!resp;
    }
  }

  open(sampleId: string): void {
    if (!this.session || this.session.status !== 'ready') return;

    this.router.navigate(
      ['/panel/session', this.sessionId, 'sample', sampleId],
      { state: { panelistId: this.panelistId, panelistName: this.panelistName, seatNumber: this.seatNumber } }
    );
  }
}
