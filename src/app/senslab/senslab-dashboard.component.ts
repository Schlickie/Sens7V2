import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { SenslabStorageService } from './senslab-storage.service';

@Component({
  selector: 'app-senslab-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="shell">
    <h2>senslab Dashboard</h2>

    <div class="grid">
      <button type="button" class="tile" (click)="start('product')">
        <div class="t-title">Product testing</div>
        <div class="t-sub">vergleichbar, reports-clean</div>
      </button>

      <button type="button" class="tile" (click)="start('panel')">
        <div class="t-title">Panel calibration</div>
        <div class="t-sub">panel performance / training</div>
      </button>

      <button type="button" class="tile" (click)="start('field')">
        <div class="t-title">Field / quick test</div>
        <div class="t-sub">maximal flexibel</div>
      </button>
    </div>

    <div style="margin-top:1rem">
      <a [routerLink]="['/senslab/sessions']">Open Sessions</a> ·
      <a [routerLink]="['/admin/descriptors']">Admin: Descriptors</a>
    </div>
  </div>
  `,
  styles: [`
    .shell{ padding:16px; max-width:1000px; margin:0 auto; }
    .grid{ display:grid; gap:12px; grid-template-columns: repeat(3, minmax(0, 1fr)); }
    .tile{ text-align:left; padding:14px; border:1px solid #ddd; border-radius:12px; background:#fff; cursor:pointer; }
    .t-title{ font-weight:700; }
    .t-sub{ opacity:.7; margin-top:4px; }
    @media (max-width: 900px){ .grid{ grid-template-columns: 1fr; } }
  `]
})
export class SenslabDashboardComponent {
  constructor(private store: SenslabStorageService, private router: Router) {}

  start(domain: 'product'|'panel'|'field'): void {
    const session = this.store.createSession(domain);
    // v1: direkt in Session Detail
    this.router.navigate(['/senslab/sessions', session.id]);
  }
}
