import { Routes } from '@angular/router';
import { Layout } from './features/contacts/components/layout/layout/layout';
import { ContactList } from './features/contacts/components/contact-list/contact-list/contact-list';
import { Login } from './features/auth/components/login/login/login';
import { AuthGuard } from './core/auth/guards/auth-guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: Login
  },
  {
    path: 'contacts',
    component: Layout,
    canActivate: [AuthGuard],
    children: [
      {
        path: '',
        component: ContactList
      }
    ]
  },
  {
    path: '',
    redirectTo: '/auth',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: '/auth'
  }
];
