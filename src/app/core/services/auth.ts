import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { SupabaseService } from './supabase';

@Injectable({
  providedIn: 'root'
})
export class AuthService {

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  // Retorna a sessão atual do usuário (null se não estiver logado)
  async getSession() {
    const { data } = await this.supabase.client.auth.getSession();
    return data.session;
  }

  // Retorna os dados do usuário logado
  async getUser() {
    const { data } = await this.supabase.client.auth.getUser();
    return data.user;
  }

  // Cadastro com email e senha
  async signUp(email: string, password: string, name: string) {
    const { data, error } = await this.supabase.client.auth.signUp({
      email,
      password,
      options: {
        data: { name } // salva o nome no perfil
      }
    });

    if (error) {
      throw error;
    }

    // Supabase pode retornar um objeto de usuário ofuscado sem sessão quando o
    // email já existe e o usuário está confirmado. Nesse caso, não devemos
    // considerar o cadastro como bem-sucedido.
    if (data?.user && !data?.session) {
      const user = data.user;
      const duplicateUserDetected =
        !user.email ||
        !!user.email_confirmed_at ||
        !!user.phone_confirmed_at ||
        (Array.isArray(user.identities) && user.identities.length === 0);

      if (duplicateUserDetected) {
        const duplicateError = new Error('User already registered');
        duplicateError.name = 'AuthApiError';
        throw duplicateError;
      }
    }

    return data;
  }

  // Login com email e senha
  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.client.auth.signInWithPassword({
      email,
      password
    });

    if (error) throw error;
    return data;
  }

  // Login com Google
  async signInWithGoogle() {
    const { error } = await this.supabase.client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/dashboard`
      }
    });

    if (error) throw error;
  }

  // Logout
  async signOut() {
    await this.supabase.client.auth.signOut();
    this.router.navigate(['/auth/login']);
  }

  // Escuta mudanças no estado de autenticação
  // Útil para reagir quando o token expira ou o usuário faz login
  onAuthChange(callback: (session: any) => void) {
    this.supabase.client.auth.onAuthStateChange((_event: any, session: any) => {
      callback(session);
    });
  }
}