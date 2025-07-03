import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);

  const isLoggedIn = localStorage.getItem('loggedIn') === 'true';// ✅ usa sessionStorage

  if (!isLoggedIn) {
    router.navigate(['/login']);
    return false;
  }

  return true;
};
