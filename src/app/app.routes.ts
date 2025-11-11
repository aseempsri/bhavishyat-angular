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
    path: 'kundali',
    loadComponent: () => import('./pages/kundali/kundali.component').then(m => m.KundaliComponent)
  },
  {
    path: 'class-recordings',
    loadComponent: () => import('./pages/class-recordings/class-recordings.component').then(m => m.ClassRecordingsComponent)
  },
  {
    path: 'remedies-seva',
    loadComponent: () => import('./pages/remedies-seva/remedies-seva.component').then(m => m.RemediesSevaComponent)
  },
  {
    path: '**',
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
