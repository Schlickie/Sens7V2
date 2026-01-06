import { Routes } from '@angular/router';

export const panelRoutes: Routes = [
  {
    path: '',
    loadComponent: () => import('./panel-join.component').then(m => m.PanelJoinComponent)
  },
  {
    path: 'join',
    loadComponent: () => import('./panel-join.component').then(m => m.PanelJoinComponent)
  },
  {
    path: 'session/:sessionId',
    loadComponent: () => import('./panel-queue.component').then(m => m.PanelQueueComponent)
  },
  {
    path: 'session/:sessionId/sample/:sampleId',
    loadComponent: () => import('./panel-sample.component').then(m => m.PanelSampleComponent)
  }
];
