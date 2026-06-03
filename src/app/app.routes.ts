import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth-guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'auth',
    children: [
      {
        path: 'login',
        loadComponent: () =>
          import('./features/auth/login/login').then(m => m.Login)
      },
      {
        path: 'register',
        loadComponent: () =>
          import('./features/auth/register/register').then(m => m.Register)
      }
    ]
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/dashboard/dashboard/dashboard').then(m => m.Dashboard)
  },
  {
    path: 'transactions',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/transactions/transactions/transactions').then(m => m.Transactions)
  },
  {
  path: 'goals',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/goals/goals/goals').then(m => m.Goals)
 },
 {
  path: 'reports',
  canActivate: [authGuard],
  loadComponent: () =>
    import('./features/reports/reports/reports').then(m => m.Reports)
},
{
  path: 'confirm',
  loadComponent: () =>
    import('./features/auth/confirm/confirm').then(m => m.Confirm)
},
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];