import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth';
import { TransactionService, Transaction } from '../../../core/services/transaction';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class Dashboard implements OnInit {

  userName = '';
  loading = true;
  transactions: Transaction[] = [];
  totalIncome = 0;
  totalExpense = 0;
  balance = 0;

  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private router: Router,
    private cdr: ChangeDetectorRef // detecta mudanças manualmente
  ) {
    console.log('Dashboard iniciado!');
  }

  async ngOnInit() {
    console.log('ngOnInit iniciado!');
    try {
      const user = await this.authService.getUser();
      this.userName = user?.user_metadata?.['name'] || user?.user_metadata?.['full_name'] || user?.email || 'Usuário';
      await this.loadTransactions();
    } catch (error) {
      console.error('Erro no ngOnInit:', error);
      this.loading = false;
      this.cdr.detectChanges(); // força atualização da tela
    }
  }

  async loadTransactions() {
    try {
      this.loading = true;
      this.transactions = await this.transactionService.getByMonth(
        this.currentYear,
        this.currentMonth
      );
      this.calculateTotals();
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges(); // força atualização da tela
    }
  }

  calculateTotals() {
    this.totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    this.totalExpense = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    this.balance = this.totalIncome - this.totalExpense;
    this.cdr.detectChanges(); // força atualização da tela
  }

  async onLogout() {
    await this.authService.signOut();
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}