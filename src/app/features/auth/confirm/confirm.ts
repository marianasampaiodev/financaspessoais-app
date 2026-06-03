import { Component, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../../core/services/supabase';

@Component({
  selector: 'app-confirm',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './confirm.html',
  styleUrl: './confirm.scss'
})
export class Confirm implements OnInit {

  // Status da confirmação
  status: 'loading' | 'success' | 'error' = 'loading';

  constructor(
    private supabase: SupabaseService,
    private router: Router
  ) {}

  async ngOnInit() {
    try {
      // O Supabase processa o token automaticamente pela URL
      const { data, error } = await this.supabase.client.auth.getSession();

      if (error) throw error;

      if (data.session) {
        // Usuário confirmado e logado com sucesso
        this.status = 'success';
        // Redireciona para o dashboard após 3 segundos
        setTimeout(() => this.router.navigate(['/dashboard']), 3000);
      } else {
        this.status = 'error';
      }
    } catch (error) {
      this.status = 'error';
    }
  }
}