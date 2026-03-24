import { Routes } from '@angular/router';
import {
  canActivateDashboard,
  resolveDashboardStatus,
} from './dashboard/dashboard.component';
import { resolvePost } from './post/post.component';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./landing/landing.component'),
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component'),
    canActivate: [canActivateDashboard],
    resolve: {
      ...resolveDashboardStatus,
    },
  },
  {
    path: 'post/:id',
    loadComponent: () => import('./post/post.component'),
    resolve: {
      ...resolvePost,
    },
  },
  {
    path: '**',
    redirectTo: '',
  },
];
