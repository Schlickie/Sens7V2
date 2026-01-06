import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SenslabStorageService } from './senslab-storage.service';
import type { SenslabResponse } from './models/senslab-response.model';

@Component({
  selector: 'app-senslab-session-detail',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="shell" *ngIf="session">
    <div class="head">
      <div>
        <h2 style="margin:0">{{ session.title }}</h2>
        <div class="meta">
          Domain: <b>{{ session.domain }}</b> ·
          Status: <b>{{ session.status }}</b> ·
          Code: <b>{{ session.sessionCode }}</b>
        </div>
      </div>
      <div class="actions">
        <button type="button" (click)="setStatus('draft')" [disabled]="session.status==='draft'">Draft</button>
        <button type="button" (click)="setStatus('ready')" [disabled]="session.status==='ready'">Ready</button>
        <button type="button" (click)="setStatus('closed')" [disabled]="session.status==='closed'">Closed</button>
      </div>
    </div>

    <div class="card">
      <div style="font-weight:700; margin-bottom:6px">Invite (one-time QR token)</div>
      <button type="button" (click)="createToken()">Generate token</button>
      <div *ngIf="inviteUrl" style="margin-top:8px; word-break:break-all;">
        Panel URL: <a [href]="inviteUrl">{{ inviteUrl }}</a>
      </div>
      <div class="muted" style="margin-top:6px">
        Token ist one-time; enthält keine Seat-Nummer; Join-Flow bleibt identisch zur manuellen Eingabe.
      </div>
    </div>

    <div class="card">
      <div class="rowline">
        <div style="font-weight:700">Samples</div>
        <button type="button" (click)="addProfile()">+ Add Profile sample</button>
      </div>

      <div class="samples">
        <div class="srow" *ngFor="let smp of samples">
          <a class="slink"
             [routerLink]="['/senslab/sessions', session.id, 'samples', smp.id]">
            <div class="stitle">{{ smp.label }}</div>
            <div class="smeta">
              Method: <b>{{ smp.methodCore.method }}</b>
              · Updated: {{ smp.updatedAt }}
            </div>
          </a>

          <div class="resp">
            <div class="respHead">
              Responses: <b>{{ (responsesBySampleId[smp.id] || []).length }}</b>
            </div>

            <div *ngIf="(responsesBySampleId[smp.id] || []).length === 0" class="muted">
              No responses yet.
            </div>

            <div class="respList" *ngIf="(responsesBySampleId[smp.id] || []).length > 0">
              <div class="respRow" *ngFor="let r of responsesBySampleId[smp.id]">
                <div class="rMain">
                  <b>{{ r.panelistName || r.panelistId }}</b>
                  <span class="muted">({{ r.panelistId }})</span>
                </div>
                <div class="rMeta muted">
                  {{ r.submittedAt }}
                </div>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>

  </div>
  `,
  styles: [`
    .shell{ padding:16px; max-width:1000px; margin:0 auto; }
    .head{ display:flex; gap:12px; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; }
    .meta{ opacity:.75; margin-top:6px; }
    .actions{ display:flex; gap:8px; }
    .card{ margin-top:12px; padding:12px; border:1px solid #ddd; border-radius:12px; }
    .muted{ opacity:.7; font-size:13px; }
    .rowline{ display:flex; justify-content:space-between; align-items:center; gap:10px; }
    .samples{ margin-top:10px; display:flex; flex-direction:column; gap:10px; }

    .srow{ border:1px solid #eee; border-radius:12px; overflow:hidden; }
    .slink{ display:block; padding:10px; text-decoration:none; color:inherit; }
    .stitle{ font-weight:700; }
    .smeta{ opacity:.75; font-size:13px; margin-top:4px; }

    .resp{ border-top:1px solid #eee; padding:10px; background:#fafafa; }
    .respHead{ font-size:13px; margin-bottom:6px; }
    .respList{ display:flex; flex-direction:column; gap:6px; }
    .respRow{ display:flex; justify-content:space-between; gap:10px; padding:8px; background:#fff; border:1px solid #eee; border-radius:10px; }
    .rMain{ font-size:13px; }
    .rMeta{ font-size:12px; }
  `]
})
export class SenslabSessionDetailComponent implements OnInit {
  sessionId = '';
  session: any = null;
  samples: any[] = [];
  inviteUrl: string | null = null;

  responsesBySampleId: Record<string, SenslabResponse[]> = {};

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: SenslabStorageService
  ) {}

  ngOnInit(): void {
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    this.reload();
  }

  reload(): void {
    this.session = this.store.getSessionById(this.sessionId);
    this.samples = this.store.getSamplesForSession(this.sessionId);

    const all = this.store.getResponsesForSession(this.sessionId);
    const map: Record<string, SenslabResponse[]> = {};
    for (const r of all) {
      (map[r.sampleId] ||= []).push(r);
    }

    // newest first per sample
    for (const sid of Object.keys(map)) {
      map[sid] = [...map[sid]].sort((a, b) => (b.submittedAt || '').localeCompare(a.submittedAt || ''));
    }

    this.responsesBySampleId = map;
  }

  setStatus(status: 'draft'|'ready'|'closed'): void {
    this.store.setSessionStatus(this.sessionId, status);
    this.reload();
  }

  addProfile(): void {
    const smp = this.store.createProfileSample(this.sessionId, 'Product Profile');
    this.router.navigate(['/senslab/sessions', this.sessionId, 'samples', smp.id]);
  }

  createToken(): void {
    const tok = this.store.createInviteToken(this.sessionId);
    this.inviteUrl = `${location.origin}/panel/join?token=${encodeURIComponent(tok.token)}`;
  }
}
