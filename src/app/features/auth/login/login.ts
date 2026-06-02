import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.scss'
})
export class Login {

  // O formulário com seus campos e validações
  form: FormGroup;

  // Controla se está carregando (para desabilitar o botão)
  loading = false;

  // Mensagem de erro para mostrar na tela
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    // Cria o formulário com dois campos
    this.form = this.fb.group({
      // email: obrigatório e deve ser um email válido
      email: ['', [Validators.required, Validators.email]],
      // senha: obrigatória e mínimo 6 caracteres
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  // Atalhos para acessar os campos no HTML
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }

  // Chamado ao submeter o formulário
  async onSubmit() {
    if (this.form.invalid) return; // não envia se tiver erro

    this.loading = true;
    this.errorMessage = '';

    try {
      await this.authService.signIn(
        this.form.value.email,
        this.form.value.password
      );
      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      this.errorMessage = 'Email ou senha incorretos. Tente novamente.';
    } finally {
      this.loading = false;
    }
  }

  // Login com Google
  async onGoogleLogin() {
    try {
      await this.authService.signInWithGoogle();
    } catch (error: any) {
      this.errorMessage = 'Erro ao conectar com o Google.';
    }
  }
}