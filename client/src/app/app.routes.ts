import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./pages/login/login').then((module) => module.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register').then((module) => module.Register),
    canActivate: [guestGuard],
  },

  {
    path: '',
    loadComponent: () => import('./pages/main-layout/main-layout').then((module) => module.MainLayout),
    canActivate: [authGuard],
    children: [
      {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((module) => module.Home),
      },
      {
        path: 'posts/:id',
        loadComponent: () => import('./pages/single-post/single-post').then((module) => module.SinglePost),
      },
      {
        path: 'users/:id',
        loadComponent: () => import('./pages/profile/profile').then((module) => module.Profile),
      },
      {
        path: 'bookmarks',
        loadComponent: () => import('./pages/bookmarks/bookmarks').then((module) => module.Bookmarks),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: '' },
];
