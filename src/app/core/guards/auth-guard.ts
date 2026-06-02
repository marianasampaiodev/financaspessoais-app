import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth';

// Guard funcional (padrão moderno do Angular 17+)
export const authGuard: CanActivateFn = async () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Verifica se existe uma sessão ativa
  const session = await authService.getSession();

  if (session) {
    return true; // usuário logado, pode entrar
  }

  // Não está logado — redireciona para o login
  router.navigate(['/auth/login']);
  return false;
};