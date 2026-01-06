import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AromaWheelRepository } from '../descriptors/aroma-wheel.repository';

@Component({
  selector: 'app-admin-descriptors',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
  <div class="shell">
    <h2>Admin · Descriptors</h2>

    <div class="card">
      <div style="font-weight:700">Beer Aroma Wheel (seed)</div>
      <button type="button" (click)="reset()">Reset to seed</button>
      <div class="muted" style="margin-top:8px">
        Nodes: <b>{{ count }}</b> · Leaves: <b>{{ leaves }}</b>
      </div>
    </div>

    <div style="margin-top:12px">
      <a [routerLink]="['/senslab']">Back to senslab</a>
    </div>
  </div>
  `,
  styles: [`
    .shell{ padding:16px; max-width:900px; margin:0 auto; }
    .card{ margin-top:12px; padding:12px; border:1px solid #ddd; border-radius:12px; }
    .muted{ opacity:.7; font-size:13px; }
  `]
})
export class AdminDescriptorsComponent implements OnInit {
  private repo = new AromaWheelRepository();
  count = 0;
  leaves = 0;

  ngOnInit(): void {
    this.repo.ensureSeeded();
    this.refresh();
  }

  reset(): void {
    this.repo.ensureSeeded(true);
    this.refresh();
  }

  refresh(): void {
    const all = this.repo.getAll();
    this.count = all.length;
    this.leaves = all.filter(n => n.kind === 'leaf').length;
  }
}
