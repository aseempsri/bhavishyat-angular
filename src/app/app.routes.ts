import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'shinrin-yoku',
    loadComponent: () => import('./pages/shinrin-yoku/shinrin-yoku.component').then(m => m.ShinrinYokuComponent)
  },
  {
    path: 'escape-retreats',
    loadComponent: () => import('./pages/escape-retreats/escape-retreats.component').then(m => m.EscapeRetreatsComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
