import { Component, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
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
export class Dashboard implements OnInit, OnDestroy {

  userName = '';
  loading = true;
  transactions: Transaction[] = [];
  totalIncome = 0;
  totalExpense = 0;
  balance = 0;

  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();
  currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });

  private subscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private transactionService: TransactionService,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    console.log('Dashboard iniciado!');
  }

  async ngOnInit() {
    console.log('ngOnInit iniciado!');
    try {
      const user = await this.authService.getUser();
      this.userName = user?.user_metadata?.['name'] || user?.user_metadata?.['full_name'] || user?.email || 'Usuário';
      await this.loadTransactions();

      console.log('Dashboard se inscrevendo no observable de transações');
      this.subscription = this.transactionService.transactionsUpdated$.subscribe(() => {
        console.log('Dashboard recebeu notificação de mudança');
        this.loadTransactions().catch(error => {
          console.error('Erro ao recarregar transações:', error);
        });
      });
    } catch (error) {
      console.error('Erro no ngOnInit:', error);
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async loadTransactions() {
    try {
      this.loading = true;
      console.log('Carregando transações do mês:', this.currentMonth);
      this.transactions = await this.transactionService.getByMonth(
        this.currentYear,
        this.currentMonth
      );
      console.log('Transações carregadas:', this.transactions.length);
      this.calculateTotals();
    } catch (error) {
      console.error('Erro ao carregar transações:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
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