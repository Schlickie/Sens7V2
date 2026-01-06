// src/app/senslab/senslab-session-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { SenslabStorageService } from './senslab-storage.service';

import type { SenslabSession } from './models/senslab-session.model';
import type { SenslabSample } from './models/senslab-sample.model';

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
        Token enthält keine Seat-Nummer; Panelist folgt dem gleichen Join-Flow wie manuell.
      </div>
    </div>

    <div class="card">
      <div class="rowline">
        <div style="font-weight:700">Samples</div>
        <button type="button" (click)="addProfile()">+ Add Profile sample</button>
      </div>

      <div class="samples">
        <a class="srow" *ngFor="let smp of samples"
           [routerLink]="['/senslab','sessions', session.id, 'samples', smp.id]">
          <div class="stitle">{{ smp.label }}</div>
          <div class="smeta">
            Method: <b>{{ smp.methodCore.method }}</b>
            · Updated: {{ smp.updatedAt }}
          </div>
        </a>
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
    .srow{ display:block; padding:10px; border:1px solid #eee; border-radius:12px; text-decoration:none; color:inherit; }
    .stitle{ font-weight:700; }
    .smeta{ opacity:.75; font-size:13px; margin-top:4px; }
  `]
})
export class SenslabSessionDetailComponent implements OnInit {
  sessionId = '';
  session: SenslabSession | null = null;
  samples: SenslabSample[] = [];
  inviteUrl: string | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: SenslabStorageService
  ) {}

  ngOnInit(): void {
    // supports both route param names ('id' or legacy 'sessionId')
    this.sessionId =
      this.route.snapshot.paramMap.get('id') ||
      this.route.snapshot.paramMap.get('sessionId') ||
      '';
    this.reload();
  }

  reload(): void {
    this.session = this.store.getSessionById(this.sessionId);
    this.samples = this.store.getSamplesForSession(this.sessionId);
  }

  setStatus(status: 'draft'|'ready'|'closed'): void {
    this.store.setSessionStatus(this.sessionId, status);
    this.reload();
  }

  addProfile(): void {
    const smp = this.store.createProfileSample(this.sessionId, 'Product Profile');
    this.router.navigate(['/senslab','sessions', this.sessionId, 'samples', smp.id]);
  }

  createToken(): void {
    const tok = this.store.createInviteToken(this.sessionId);
    this.inviteUrl = `${location.origin}/panel/join?token=${encodeURIComponent(tok.token)}`;
  }
}
