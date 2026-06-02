import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-navbar', // tag usada para inserir esse componente em outros HTMLs
  standalone: true,
  imports: [
    CommonModule,      // permite usar *ngIf, *ngFor no HTML
    RouterLink,        // permite usar routerLink nos links de navegação
    RouterLinkActive   // permite adicionar classe CSS no link da página atual
  ],
  templateUrl: './navbar.html',
  styleUrl: './navbar.scss'
})
export class Navbar implements OnInit {

  // Nome do usuário logado, exibido no canto superior direito
  userName = '';

  // Controla se o menu mobile está aberto ou fechado
  menuOpen = false;

  constructor(
    private authService: AuthService, // serviço de autenticação
    private router: Router            // usado para navegar entre rotas
  ) {}

  async ngOnInit() {
    // Busca os dados do usuário logado assim que o componente carrega
    const user = await this.authService.getUser();

    // Tenta pegar o nome, o nome completo ou o email como fallback
    this.userName = user?.user_metadata?.['name'] || user?.email || 'Usuário';
  }

  // Faz logout e redireciona para o login (lógica está no AuthService)
  async onLogout() {
    await this.authService.signOut();
  }

  // Alterna o menu mobile entre aberto e fechado
  toggleMenu() {
    this.menuOpen = !this.menuOpen;
  }
}