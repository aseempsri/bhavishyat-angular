import { Routes } from '@angular/router';
import { ROUTE_SEO } from './core/seo/seo.config';

export const routes: Routes = [
  {
    path: '',
    title: ROUTE_SEO[''].title,
    loadComponent: () => import('./pages/home/home.component').then(m => m.HomeComponent)
  },
  {
    path: 'daily-panchang',
    title: ROUTE_SEO['daily-panchang'].title,
    loadComponent: () => import('./pages/daily-panchang/daily-panchang.component').then(m => m.DailyPanchangComponent)
  },
  {
    path: 'shinrin-yoku',
    title: ROUTE_SEO['shinrin-yoku'].title,
    loadComponent: () => import('./pages/shinrin-yoku/shinrin-yoku.component').then(m => m.ShinrinYokuComponent)
  },
  {
    path: 'escape-retreats',
    title: ROUTE_SEO['escape-retreats'].title,
    loadComponent: () => import('./pages/escape-retreats/escape-retreats.component').then(m => m.EscapeRetreatsComponent)
  },
  {
    path: 'kundali',
    title: ROUTE_SEO['kundali'].title,
    loadComponent: () => import('./pages/kundali/kundali.component').then(m => m.KundaliComponent)
  },
  {
    path: 'class-recordings',
    title: ROUTE_SEO['class-recordings'].title,
    loadComponent: () => import('./pages/class-recordings/class-recordings.component').then(m => m.ClassRecordingsComponent)
  },
  {
    path: 'house-signification',
    title: ROUTE_SEO['house-signification'].title,
    loadComponent: () => import('./pages/house-signification/house-signification.component').then(m => m.HouseSignificationComponent)
  },
  {
    path: 'remedies-seva',
    title: ROUTE_SEO['remedies-seva'].title,
    loadComponent: () => import('./pages/remedies-seva/remedies-seva.component').then(m => m.RemediesSevaComponent)
  },
  {
    path: 'aarohanam',
    title: ROUTE_SEO['aarohanam'].title,
    loadComponent: () => import('./pages/aarohanam/aarohanam.component').then(m => m.AarohanamComponent)
  },
  {
    path: '**',
    title: ROUTE_SEO['**'].title,
    loadComponent: () => import('./pages/not-found/not-found.component').then(m => m.NotFoundComponent)
  }
];
