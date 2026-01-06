import { Routes } from '@angular/router';

export const senslabRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./senslab-dashboard.component').then(m => m.SenslabDashboardComponent)
  },
  {
    path: 'sessions',
    loadComponent: () => import('./senslab-sessions.component').then(m => m.SenslabSessionsComponent)
  },
  {
    path: 'sessions/:sessionId',
    loadComponent: () => import('./senslab-session-detail.component').then(m => m.SenslabSessionDetailComponent)
  },
  {
    path: 'sessions/:sessionId/samples/:sampleId',
    loadComponent: () => import('./senslab-sample-detail.component').then(m => m.SenslabSampleDetailComponent)
  }
];
