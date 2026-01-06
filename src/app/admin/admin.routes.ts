import { Routes } from '@angular/router';

export const adminRoutes: Routes = [
  {
    path: 'descriptors',
    loadComponent: () => import('./admin-descriptors.component').then(m => m.AdminDescriptorsComponent)
  },
  { path: '', redirectTo: 'descriptors', pathMatch: 'full' }
];
