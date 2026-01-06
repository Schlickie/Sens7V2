import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { SenslabStorageService } from '../senslab/senslab-storage.service';

@Component({
  selector: 'app-panel-join',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
  <div class="shell">
    <h2>Panelist Join</h2>

    <div class="card">
      <div class="row">
        <label>Session code</label>
        <input [(ngModel)]="sessionCode" placeholder="e.g. 7KQ2PF" />
      </div>

      <div class="row">
        <label>Panelist ID</label>
        <input [(ngModel)]="panelistId" placeholder="e.g. stefan" />
      </div>

      <div class="row">
        <label>Display name (optional)</label>
        <input [(ngModel)]="panelistName" placeholder="e.g. Stefan" />
      </div>

      <button type="button" (click)="joinManual()">Join</button>

      <div class="muted" style="margin-top:8px" *ngIf="hint">{{ hint }}</div>
    </div>
  </div>
  `,
  styles: [`
    .shell{ padding:16px; max-width:720px; margin:0 auto; }
    .card{ padding:12px; border:1px solid #ddd; border-radius:12px; }
    .row{ display:flex; flex-direction:column; gap:6px; margin-bottom:10px; }
    input{ padding:8px; border:1px solid #ddd; border-radius:10px; }
    .muted{ opacity:.7; font-size:13px; }
  `]
})
export class PanelJoinComponent implements OnInit {
  token: string | null = null;

  sessionCode = '';
  panelistId = '';
  panelistName = '';
  hint = '';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private store: SenslabStorageService
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParamMap.get('token');
    if (this.token) {
      const t = this.store.resolveToken(this.token);
      if (!t) {
        this.hint = 'Invalid token.';
        return;
      }
      // token -> sessionId -> sessionCode auto-fill
      const s = this.store.getSessionById(t.sessionId);
      if (!s) {
        this.hint = 'Token session not found.';
        return;
      }
      this.sessionCode = s.sessionCode;
      this.hint = 'Token recognized. Please enter your panelist ID and join.';
    }
  }

  joinManual(): void {
    const code = (this.sessionCode || '').trim().toUpperCase();
    const pid = (this.panelistId || '').trim();
    if (!code || !pid) {
      this.hint = 'Please enter session code and panelist ID.';
      return;
    }

    const session = this.store.getSessions().find(s => s.sessionCode === code) || null;
    if (!session) {
      this.hint = 'Session code not found.';
      return;
    }

    if (this.token) this.store.markTokenUsed(this.token);

    // v1: Panelist-Daten hängen wir an navigation state (kein eigenes User-System)
    this.router.navigate(
      ['/panel/session', session.id],
      { state: { panelistId: pid, panelistName: (this.panelistName || '').trim() || pid } }
    );
  }
}
