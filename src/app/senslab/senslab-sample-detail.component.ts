import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SenslabStorageService } from './senslab-storage.service';
import { AromaWheelRepository } from '../descriptors/aroma-wheel.repository';
import type { SenslabResponse } from './models/senslab-response.model';

type TriangleRow = {
  panelistId: string;
  panelistName?: string;
  seatNumber: number | null;
  choiceCode: string;
  correct: boolean;
  submittedAt: string;
  freeText?: string;
};

type SeatStat = { seat: number; n: number; correct: number; rate: number };
type PanelistStat = { panelistId: string; panelistName?: string; n: number; correct: number; rate: number };

@Component({
  selector: 'app-senslab-sample-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
  <div class="shell" *ngIf="sample">
    <h2 style="margin:0 0 6px 0">{{ sample.label }}</h2>
    <div class="muted">Method: <b>{{ sample.methodCore.method }}</b></div>

    <!-- PROFILE CONFIG -->
    <div *ngIf="sample.methodCore.method === 'profile'" class="card">
      <h3 style="margin:0 0 8px 0">Profile config</h3>

      <div class="row">
        <input class="search" placeholder="Search leaves..."
               [(ngModel)]="search" (ngModelChange)="refreshLeaves()" />
        <button type="button" (click)="selectNone()">Clear</button>
      </div>

      <div class="list">
        <label class="leaf" *ngFor="let l of filteredLeaves">
          <input type="checkbox" [checked]="isSelected(l.id)" (change)="toggle(l.id)" />
          <span class="name">{{ l.name }}</span>
          <span class="desc" *ngIf="l.description">{{ l.description }}</span>
        </label>
      </div>

      <button type="button" (click)="saveProfile()" style="margin-top:10px">
        Save selection + snapshot
      </button>

      <div class="muted" style="margin-top:8px">
        Selected: <b>{{ selectedIds.length }}</b>
      </div>
    </div>

    <!-- TRIANGLE CONFIG -->
    <div *ngIf="sample.methodCore.method === 'triangle'" class="card">
      <h3 style="margin:0 0 8px 0">Triangle config</h3>

      <div class="row" style="max-width:320px">
        <div style="flex:1">
          <label>Seat count</label>
          <input type="number" min="1" [(ngModel)]="triangleSeatCount" />
        </div>
        <div style="align-self:flex-end">
          <button type="button" (click)="saveTriangle()">Save</button>
        </div>
      </div>

      <div style="margin-top:10px; display:flex; gap:8px; flex-wrap:wrap;">
        <button type="button" (click)="generateTriplets()">Generate triplets</button>
        <button type="button" (click)="generateTriplets()">Regenerate</button>
      </div>

      <div class="muted" style="margin-top:8px">
        Seat-Abfrage im Join passiert nur, wenn seatCount &gt; 1. Token enthält keine Seat-Nummer.
      </div>

      <div class="subcard" *ngIf="trianglePreview.length > 0">
        <div style="font-weight:700; margin-bottom:8px">Triplets preview</div>

        <div class="trow" *ngFor="let row of trianglePreview">
          <div class="muted">Seat {{ row.seat }}</div>
          <div class="codes">
            <span [class.odd]="row.oddIndex===0">{{ row.codes[0] }}</span>
            <span [class.odd]="row.oddIndex===1">{{ row.codes[1] }}</span>
            <span [class.odd]="row.oddIndex===2">{{ row.codes[2] }}</span>
          </div>
        </div>

        <div class="muted" style="margin-top:8px">
          (odd = abweichende Probe; nur zur QA-Preview sichtbar)
        </div>
      </div>

      <div class="muted" style="margin-top:10px" *ngIf="trianglePreview.length === 0">
        No triplets generated yet.
      </div>
    </div>

    <!-- TRIANGLE RESULTS -->
    <div *ngIf="sample.methodCore.method === 'triangle'" class="card">
      <div class="rowline">
        <h3 style="margin:0">Triangle results</h3>
        <div class="btnrow">
          <button type="button" (click)="reload()">Refresh</button>
          <button type="button" (click)="copyTriangleCsv()" [disabled]="triangleRows.length===0">Copy CSV</button>
        </div>
      </div>

      <div class="kpis">
        <div class="kpi">
          <div class="kLab">Responses</div>
          <div class="kVal">{{ triangleRows.length }}</div>
        </div>
        <div class="kpi">
          <div class="kLab">Correct</div>
          <div class="kVal">{{ triangleCorrect }}</div>
        </div>
        <div class="kpi">
          <div class="kLab">Correct rate</div>
          <div class="kVal">{{ triangleRate | number:'1.0-1' }}%</div>
        </div>
      </div>

      <div *ngIf="triangleRows.length === 0" class="muted" style="margin-top:8px">
        No triangle responses yet.
      </div>

      <div *ngIf="triangleRows.length > 0" class="grid2" style="margin-top:12px">
        <div class="subcard">
          <div style="font-weight:700; margin-bottom:8px">By seat</div>
          <div class="statRow" *ngFor="let s of seatStats">
            <div>Seat <b>{{ s.seat }}</b></div>
            <div class="muted">{{ s.correct }}/{{ s.n }} · {{ s.rate | number:'1.0-1' }}%</div>
          </div>
        </div>

        <div class="subcard">
          <div style="font-weight:700; margin-bottom:8px">By panelist</div>
          <div class="statRow" *ngFor="let p of panelistStats">
            <div><b>{{ p.panelistName || p.panelistId }}</b> <span class="muted">({{ p.panelistId }})</span></div>
            <div class="muted">{{ p.correct }}/{{ p.n }} · {{ p.rate | number:'1.0-1' }}%</div>
          </div>
        </div>
      </div>

      <div *ngIf="triangleRows.length > 0" style="margin-top:12px">
        <div style="font-weight:700; margin-bottom:8px">Responses</div>
        <div class="respTable">
          <div class="respHead">
            <div>Panelist</div>
            <div>Seat</div>
            <div>Choice</div>
            <div>Correct</div>
            <div>Submitted</div>
          </div>

          <div class="respRow" *ngFor="let r of triangleRows">
            <div>
              <b>{{ r.panelistName || r.panelistId }}</b>
              <div class="muted" style="font-size:12px">{{ r.panelistId }}</div>
              <div class="muted" style="font-size:12px" *ngIf="r.freeText">“{{ r.freeText }}”</div>
            </div>
            <div>{{ r.seatNumber || '–' }}</div>
            <div><b>{{ r.choiceCode }}</b></div>
            <div>
              <span [class.ok]="r.correct" [class.bad]="!r.correct">
                {{ r.correct ? 'yes' : 'no' }}
              </span>
            </div>
            <div class="muted">{{ r.submittedAt }}</div>
          </div>
        </div>
      </div>

      <div class="muted" style="margin-top:10px" *ngIf="csvHint">{{ csvHint }}</div>
    </div>

  </div>
  `,
  styles: [`
    .shell{ padding:16px; max-width:1100px; margin:0 auto; }
    .card{ margin-top:12px; padding:12px; border:1px solid #ddd; border-radius:12px; background:#fff; }
    .subcard{ margin-top:12px; padding:12px; border:1px solid #eee; border-radius:12px; background:#fafafa; }
    .muted{ opacity:.7; font-size:13px; }
    .row{ display:flex; gap:8px; align-items:center; }
    .rowline{ display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
    .btnrow{ display:flex; gap:8px; flex-wrap:wrap; }

    .search{ flex:1; padding:8px; border:1px solid #ddd; border-radius:10px; }
    .list{ margin-top:10px; display:flex; flex-direction:column; gap:8px; max-height: 420px; overflow:auto; }
    .leaf{ display:flex; gap:10px; align-items:flex-start; border:1px solid #eee; padding:8px; border-radius:12px; }
    .name{ font-weight:600; }
    .desc{ opacity:.7; font-size:13px; }
    input[type="number"]{ padding:8px; border:1px solid #ddd; border-radius:10px; width:100%; }
    label{ display:block; font-size:13px; opacity:.8; }

    .trow{ display:flex; justify-content:space-between; gap:12px; padding:8px; border:1px solid #f2f2f2; border-radius:12px; margin-top:8px; background:#fff; }
    .codes{ display:flex; gap:10px; font-weight:700; flex-wrap:wrap; justify-content:flex-end; }
    .codes span{ padding:2px 8px; border:1px solid #eee; border-radius:999px; }
    .codes span.odd{ border-style:dashed; }

    .kpis{ margin-top:10px; display:grid; grid-template-columns: repeat(3, minmax(0,1fr)); gap:10px; }
    .kpi{ border:1px solid #eee; border-radius:12px; padding:10px; background:#fafafa; }
    .kLab{ font-size:12px; opacity:.7; }
    .kVal{ font-size:20px; font-weight:800; margin-top:2px; }

    .grid2{ display:grid; grid-template-columns: repeat(2, minmax(0,1fr)); gap:10px; }
    @media (max-width: 900px){ .grid2{ grid-template-columns: 1fr; } .kpis{ grid-template-columns: 1fr; } }

    .statRow{ display:flex; justify-content:space-between; gap:10px; padding:8px; border:1px solid #f2f2f2; border-radius:12px; background:#fff; margin-top:8px; }

    .respTable{ border:1px solid #eee; border-radius:12px; overflow:hidden; }
    .respHead{
      display:grid;
      grid-template-columns: 2fr .6fr .8fr .8fr 1.4fr;
      gap:10px;
      padding:10px;
      background:#fafafa;
      font-weight:700;
      border-bottom:1px solid #eee;
    }
    .respRow{
      display:grid;
      grid-template-columns: 2fr .6fr .8fr .8fr 1.4fr;
      gap:10px;
      padding:10px;
      border-bottom:1px solid #f2f2f2;
      align-items:start;
      background:#fff;
    }
    .respRow:last-child{ border-bottom:none; }

    .ok{ display:inline-block; padding:2px 8px; border:1px solid #cfe9d6; border-radius:999px; }
    .bad{ display:inline-block; padding:2px 8px; border:1px solid #f2c2c2; border-radius:999px; }
  `]
})
export class SenslabSampleDetailComponent implements OnInit {
  sessionId = '';
  sampleId = '';
  sample: any = null;

  private repo = new AromaWheelRepository();

  // profile config state
  leaves: any[] = [];
  filteredLeaves: any[] = [];
  search = '';
  selectedIds: string[] = [];

  // triangle config state
  triangleSeatCount = 1;
  trianglePreview: Array<{ seat: number; codes: [string,string,string]; oddIndex: number }> = [];

  // triangle results state
  triangleRows: TriangleRow[] = [];
  triangleCorrect = 0;
  triangleRate = 0;
  seatStats: SeatStat[] = [];
  panelistStats: PanelistStat[] = [];
  csvHint = '';

  constructor(private route: ActivatedRoute, private store: SenslabStorageService) {}

  ngOnInit(): void {
    this.repo.ensureSeeded();
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    this.sampleId = this.route.snapshot.paramMap.get('sampleId') || '';
    this.reload();
  }

  reload(): void {
    this.csvHint = '';
    this.sample = this.store.getSampleById(this.sampleId);

    // profile config
    if (this.sample?.methodCore?.method === 'profile') {
      this.selectedIds = [...(this.sample.methodCore.config.descriptorLeafIds || [])];
    } else {
      this.selectedIds = [];
    }

    // triangle config + preview
    if (this.sample?.methodCore?.method === 'triangle') {
      const sc = Number(this.sample.methodCore?.config?.seatCount);
      this.triangleSeatCount = Number.isFinite(sc) ? Math.max(1, Math.floor(sc)) : 1;

      const map = this.sample.methodCore.config.tripletsBySeat || {};
      const seatCount = Math.max(1, Math.floor(Number(this.sample.methodCore.config.seatCount || 1)));

      const prev: Array<{ seat: number; codes: [string,string,string]; oddIndex: number }> = [];
      for (let seat = 1; seat <= seatCount; seat++) {
        const t = map[String(seat)];
        if (t?.codes?.length === 3) prev.push({ seat, codes: t.codes, oddIndex: t.oddIndex });
      }
      this.trianglePreview = prev;
    } else {
      this.trianglePreview = [];
    }

    // aroma leaves list
    this.leaves = this.repo.getLeaves();
    this.refreshLeaves();

    // triangle results
    this.computeTriangleResults();
  }

  refreshLeaves(): void {
    const t = (this.search || '').trim().toLowerCase();
    this.filteredLeaves = !t
      ? this.leaves
      : this.leaves.filter(l =>
          (l.name || '').toLowerCase().includes(t) ||
          (l.description || '').toLowerCase().includes(t)
        );
  }

  isSelected(id: string): boolean {
    return this.selectedIds.includes(id);
  }

  toggle(id: string): void {
    if (this.isSelected(id)) this.selectedIds = this.selectedIds.filter(x => x !== id);
    else this.selectedIds = [...this.selectedIds, id];
  }

  selectNone(): void {
    this.selectedIds = [];
  }

  saveProfile(): void {
    const snapshot = this.repo.resolveIds(this.selectedIds);
    this.store.updateProfileSelection(this.sampleId, this.selectedIds, snapshot);
    this.reload();
  }

  saveTriangle(): void {
    this.store.updateTriangleSeatCount(this.sampleId, this.triangleSeatCount);
    this.reload();
  }

  generateTriplets(): void {
    this.store.generateTriangleTriplets(this.sampleId);
    this.reload();
  }

  private computeTriangleResults(): void {
    this.triangleRows = [];
    this.triangleCorrect = 0;
    this.triangleRate = 0;
    this.seatStats = [];
    this.panelistStats = [];

    if (!this.sample || this.sample.methodCore?.method !== 'triangle') return;

    const all: SenslabResponse[] = this.store.getResponsesForSample(this.sampleId) || [];
    const tri = all.filter(r => r?.method === 'triangle');

    const rows: TriangleRow[] = tri.map(r => ({
      panelistId: r.panelistId,
      panelistName: r.panelistName,
      seatNumber: (r.seatNumber ?? null),
      choiceCode: String(r?.methodCoreAnswer?.choiceCode || ''),
      correct: !!r?.methodCoreAnswer?.correct,
      submittedAt: String(r.submittedAt || ''),
      freeText: r.freeText || ''
    }))
    .sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));

    this.triangleRows = rows;

    const n = rows.length;
    const correct = rows.reduce((sum, r) => sum + (r.correct ? 1 : 0), 0);
    this.triangleCorrect = correct;
    this.triangleRate = n ? (correct / n) * 100 : 0;

    // seat stats
    const seatCount = Math.max(1, Math.floor(Number(this.sample.methodCore.config.seatCount || 1)));
    const bySeat = new Map<number, TriangleRow[]>();
    for (const r of rows) {
      const s = Number(r.seatNumber ?? 1);
      const seat = Number.isFinite(s) ? Math.max(1, Math.min(seatCount, Math.floor(s))) : 1;
      (bySeat.get(seat) || bySeat.set(seat, []).get(seat)!).push(r);
    }

    const seatStats: SeatStat[] = [];
    for (let seat = 1; seat <= seatCount; seat++) {
      const list = bySeat.get(seat) || [];
      const sn = list.length;
      const sc = list.reduce((sum, r) => sum + (r.correct ? 1 : 0), 0);
      seatStats.push({ seat, n: sn, correct: sc, rate: sn ? (sc / sn) * 100 : 0 });
    }
    this.seatStats = seatStats;

    // panelist stats
    const byP = new Map<string, TriangleRow[]>();
    for (const r of rows) {
      const key = r.panelistId || 'unknown';
      (byP.get(key) || byP.set(key, []).get(key)!).push(r);
    }

    const panelistStats: PanelistStat[] = [];
    for (const [pid, list] of byP.entries()) {
      const pn = list.length;
      const pc = list.reduce((sum, r) => sum + (r.correct ? 1 : 0), 0);
      panelistStats.push({
        panelistId: pid,
        panelistName: list.find(x => !!x.panelistName)?.panelistName,
        n: pn,
        correct: pc,
        rate: pn ? (pc / pn) * 100 : 0
      });
    }
    panelistStats.sort((a, b) => b.rate - a.rate || b.n - a.n || a.panelistId.localeCompare(b.panelistId));
    this.panelistStats = panelistStats;
  }

  async copyTriangleCsv(): Promise<void> {
    this.csvHint = '';
    if (!this.triangleRows.length) return;

    const esc = (v: any) => {
      const s = String(v ?? '');
      const needs = /[",\n]/.test(s);
      const out = s.replace(/"/g, '""');
      return needs ? `"${out}"` : out;
    };

    const header = ['panelistId','panelistName','seatNumber','choiceCode','correct','submittedAt','freeText'];
    const lines = [header.join(',')];

    for (const r of this.triangleRows) {
      lines.push([
        esc(r.panelistId),
        esc(r.panelistName || ''),
        esc(r.seatNumber ?? ''),
        esc(r.choiceCode),
        esc(r.correct ? '1' : '0'),
        esc(r.submittedAt),
        esc(r.freeText || '')
      ].join(','));
    }

    const csv = lines.join('\n');

    try {
      await navigator.clipboard.writeText(csv);
      this.csvHint = 'CSV copied to clipboard.';
    } catch {
      this.csvHint = 'Clipboard blocked by browser. (You can open DevTools → copy from console later.)';
      // fallback: at least log it
      // eslint-disable-next-line no-console
      console.log(csv);
    }
  }
}
