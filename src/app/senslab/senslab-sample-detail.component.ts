import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';

import { SenslabStorageService } from './senslab-storage.service';
import { AromaWheelRepository } from '../descriptors/aroma-wheel.repository';

@Component({
  selector: 'app-senslab-sample-detail',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule],
  template: `
  <div class="shell" *ngIf="sample">
    <h2 style="margin:0 0 6px 0">{{ sample.label }}</h2>
    <div class="muted">Method: <b>{{ sample.methodCore.method }}</b></div>

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

      <button type="button" (click)="save()" style="margin-top:10px">Save selection + snapshot</button>

      <div class="muted" style="margin-top:8px">
        Selected: <b>{{ selectedIds.length }}</b>
      </div>
    </div>

  </div>
  `,
  styles: [`
    .shell{ padding:16px; max-width:1000px; margin:0 auto; }
    .card{ margin-top:12px; padding:12px; border:1px solid #ddd; border-radius:12px; }
    .muted{ opacity:.7; font-size:13px; }
    .row{ display:flex; gap:8px; align-items:center; }
    .search{ flex:1; padding:8px; border:1px solid #ddd; border-radius:10px; }
    .list{ margin-top:10px; display:flex; flex-direction:column; gap:8px; max-height: 420px; overflow:auto; }
    .leaf{ display:flex; gap:10px; align-items:flex-start; border:1px solid #eee; padding:8px; border-radius:12px; }
    .name{ font-weight:600; }
    .desc{ opacity:.7; font-size:13px; }
  `]
})
export class SenslabSampleDetailComponent implements OnInit {
  sessionId = '';
  sampleId = '';
  sample: any = null;

  private repo = new AromaWheelRepository();
  leaves: any[] = [];
  filteredLeaves: any[] = [];
  search = '';
  selectedIds: string[] = [];

  constructor(private route: ActivatedRoute, private store: SenslabStorageService) {}

  ngOnInit(): void {
    this.repo.ensureSeeded();
    this.sessionId = this.route.snapshot.paramMap.get('sessionId') || '';
    this.sampleId = this.route.snapshot.paramMap.get('sampleId') || '';
    this.reload();
  }

  reload(): void {
    this.sample = this.store.getSampleById(this.sampleId);
    if (this.sample?.methodCore?.method === 'profile') {
      this.selectedIds = [...(this.sample.methodCore.config.descriptorLeafIds || [])];
    } else {
      this.selectedIds = [];
    }
    this.leaves = this.repo.getLeaves();
    this.refreshLeaves();
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

  save(): void {
    const snapshot = this.repo.resolveIds(this.selectedIds);
    this.store.updateProfileSelection(this.sampleId, this.selectedIds, snapshot);
    this.reload();
  }
}
