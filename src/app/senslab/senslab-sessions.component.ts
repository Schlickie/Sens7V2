import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SenslabStorageService } from './senslab-storage.service';

@Component({
  selector: 'app-senslab-sessions',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="shell">
    <h2>Sessions</h2>

    <div class="list">
      <a class="row" *ngFor="let s of sessions" [routerLink]="['/senslab/sessions', s.id]">
        <div class="title">{{ s.title }}</div>
        <div class="meta">
          <span>Domain: <b>{{ s.domain }}</b></span>
          <span>Status: <b>{{ s.status }}</b></span>
          <span>Code: <b>{{ s.sessionCode }}</b></span>
          <span>Samples: <b>{{ s.sampleIds.length }}</b></span>
        </div>
      </a>
    </div>
  </div>
  `,
  styles: [`
    .shell{ padding:16px; max-width:1000px; margin:0 auto; }
    .list{ display:flex; flex-direction:column; gap:10px; }
    .row{ display:block; padding:12px; border:1px solid #ddd; border-radius:12px; text-decoration:none; color:inherit; }
    .title{ font-weight:700; }
    .meta{ display:flex; gap:12px; flex-wrap:wrap; opacity:.75; margin-top:6px; font-size:13px; }
  `]
})
export class SenslabSessionsComponent {
  constructor(private store: SenslabStorageService) {}

  get sessions() {
    return this.store.getSessions();
  }
}
