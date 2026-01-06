import { Routes } from '@angular/router';

export const routes: Routes = [
  // Default: senslab (ändere auf 'admin', wenn du das lieber willst)
  { path: '', redirectTo: 'senslab', pathMatch: 'full' },

  {
    path: 'senslab',
    loadChildren: () => import('./senslab/senslab.routes').then(m => m.senslabRoutes)
  },
  {
    path: 'panel',
    loadChildren: () => import('./panel/panel.routes').then(m => m.panelRoutes)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.routes').then(m => m.adminRoutes)
  },

  { path: '**', redirectTo: 'senslab' }
];
