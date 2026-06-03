import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, AbstractControl } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, RouterLink],
  templateUrl: './register.html',
  styleUrl: './register.scss'
})
export class Register {

  form: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.form = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', Validators.required]
    }, {
      // Validador customizado: verifica se as senhas coincidem
      validators: this.passwordMatchValidator
    });
  }

  // Validador que compara os dois campos de senha
  passwordMatchValidator(control: AbstractControl) {
    const password = control.get('password')?.value;
    const confirmPassword = control.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      control.get('confirmPassword')?.setErrors({ mismatch: true });
    } else {
      control.get('confirmPassword')?.setErrors(null);
    }
    return null;
  }

  get name() { return this.form.get('name'); }
  get email() { return this.form.get('email'); }
  get password() { return this.form.get('password'); }
  get confirmPassword() { return this.form.get('confirmPassword'); }

  async onSubmit() {
    if (this.form.invalid) return;

    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    try {
      await this.authService.signUp(
        this.form.value.email,
        this.form.value.password,
        this.form.value.name
      );
      // Limpa o formulário e mostra mensagem clara
      this.form.reset();
      this.successMessage = '✅ Conta criada com sucesso! Verifique seu email e clique no link de confirmação para ativar sua conta.';

    } catch (error: any) {
      console.log('Erro:', error.message);

      // Verifica o tipo de erro e exibe mensagem apropriada
      if (
        error.message?.includes('already registered') ||
        error.message?.includes('User already registered') ||
        error.message?.includes('email already')
      ) {
        this.errorMessage = 'Este email já está cadastrado. Tente fazer login ou use outro email.';
      } else if (error.message?.includes('invalid email')) {
        this.errorMessage = 'Digite um email válido.';
      } else if (error.message?.includes('weak password')) {
        this.errorMessage = 'A senha é muito fraca. Use pelo menos 6 caracteres.';
      } else {
        this.errorMessage = 'Erro ao criar conta. Tente novamente.';
      }

    } finally {
      this.loading = false;
    }
  }
}