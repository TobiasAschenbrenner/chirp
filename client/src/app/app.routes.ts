import { Routes } from '@angular/router';

import { authGuard } from './guards/auth.guard';
import { guestGuard } from './guards/guest.guard';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in | Chirp',
    loadComponent: () => import('./pages/login/login').then((module) => module.Login),
    canActivate: [guestGuard],
  },
  {
    path: 'register',
    title: 'Sign up | Chirp',
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
        title: 'Feed | Chirp',
        loadComponent: () => import('./pages/home/home').then((module) => module.Home),
      },
      {
        path: 'posts/:id',
        title: 'Post | Chirp',
        loadComponent: () => import('./pages/single-post/single-post').then((module) => module.SinglePost),
      },
      {
        path: 'users/:id',
        title: 'Profile | Chirp',
        loadComponent: () => import('./pages/profile/profile').then((module) => module.Profile),
      },
      {
        path: 'bookmarks',
        title: 'Bookmarks | Chirp',
        loadComponent: () => import('./pages/bookmarks/bookmarks').then((module) => module.Bookmarks),
      },
      { path: '', redirectTo: 'home', pathMatch: 'full' },
    ],
  },

  { path: '**', redirectTo: '' },
];
