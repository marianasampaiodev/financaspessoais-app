import { Component, OnInit, OnDestroy, ChangeDetectorRef, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { TransactionService, Transaction } from '../../../core/services/transaction';
import { Navbar } from '../../../shared/components/navbar/navbar';
import { Chart, ArcElement, Tooltip, Legend, PieController } from 'chart.js';

// Registra os componentes necessários do Chart.js
Chart.register(ArcElement, Tooltip, Legend, PieController);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, Navbar],
  templateUrl: './reports.html',
  styleUrl: './reports.scss'
})
export class Reports implements OnInit, OnDestroy, AfterViewInit {

  @ViewChild('expenseChart') expenseChartRef!: ElementRef;
  @ViewChild('incomeChart') incomeChartRef!: ElementRef;

  transactions: Transaction[] = [];
  loading = true;
  expenseSummary: { name: string; color: string; total: number; percentage: number }[] = [];
  incomeSummary: { name: string; color: string; total: number; percentage: number }[] = [];

  totalIncome = 0;
  totalExpense = 0;
  balance = 0;

  currentMonthName = new Date().toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  currentMonth = new Date().getMonth() + 1;
  currentYear = new Date().getFullYear();

  private expenseChart: Chart | null = null;
  private incomeChart: Chart | null = null;
  private subscription: Subscription | null = null;

  constructor(
    private transactionService: TransactionService,
    private cdr: ChangeDetectorRef
  ) {}

  async ngOnInit() {
    await this.loadData();

    this.subscription = this.transactionService.transactionsUpdated$.subscribe(() => {
      this.loadData().catch(error => {
        console.error('Erro ao recarregar relatório:', error);
      });
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  ngAfterViewInit() {
    // Renderiza os gráficos após a view estar pronta
    if (!this.loading) {
      this.renderCharts();
    }
  }

  async loadData() {
    try {
      this.loading = true;
      this.transactions = await this.transactionService.getByMonth(
        this.currentYear,
        this.currentMonth
      );
      this.calculateSummary();
    } catch (error) {
      console.error('Erro ao carregar relatório:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
      // Renderiza os gráficos após carregar os dados
      setTimeout(() => this.renderCharts(), 100);
    }
  }

  calculateSummary() {
    this.totalIncome = this.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    this.totalExpense = this.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + Number(t.amount), 0);

    this.balance = this.totalIncome - this.totalExpense;

    // Agrupa despesas por categoria
    this.expenseSummary = this.groupByCategory(
      this.transactions.filter(t => t.type === 'expense'),
      this.totalExpense
    );

    // Agrupa receitas por categoria
    this.incomeSummary = this.groupByCategory(
      this.transactions.filter(t => t.type === 'income'),
      this.totalIncome
    );
  }

  // Agrupa transações por categoria e calcula percentuais
  groupByCategory(
    transactions: Transaction[],
    total: number
  ): { name: string; color: string; total: number; percentage: number }[] {
    const map = new Map<string, { name: string; color: string; total: number }>();

    transactions.forEach(t => {
      const key = t.categories?.name || 'Sem categoria';
      const color = t.categories?.color || '#6366f1';

      if (map.has(key)) {
        map.get(key)!.total += Number(t.amount);
      } else {
        map.set(key, { name: key, color, total: Number(t.amount) });
      }
    });

    return Array.from(map.values())
      .map(c => ({
        ...c,
        percentage: total > 0 ? (c.total / total) * 100 : 0
      }))
      .sort((a, b) => b.total - a.total);
  }

  // Renderiza os gráficos de pizza
  renderCharts() {
    this.renderPieChart('expense');
    this.renderPieChart('income');
  }

  renderPieChart(type: 'expense' | 'income') {
    const summary = type === 'expense' ? this.expenseSummary : this.incomeSummary;
    const chartRef = type === 'expense' ? this.expenseChartRef : this.incomeChartRef;
    const chartInstance = type === 'expense' ? this.expenseChart : this.incomeChart;

    if (!chartRef?.nativeElement || summary.length === 0) return;

    // Destrói o gráfico anterior se existir
    if (chartInstance) chartInstance.destroy();

    const chart = new Chart(chartRef.nativeElement, {
      type: 'pie',
      data: {
        labels: summary.map(c => c.name),
        datasets: [{
          data: summary.map(c => c.total),
          backgroundColor: summary.map(c => c.color),
          borderWidth: 2,
          borderColor: '#fff'
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            position: 'bottom',
            labels: { padding: 16, font: { size: 12 } }
          },
          tooltip: {
            callbacks: {
              label: (context) => {
                const value = context.parsed;
                return ` ${this.formatCurrency(value)} (${summary[context.dataIndex].percentage.toFixed(1)}%)`;
              }
            }
          }
        }
      }
    });

    if (type === 'expense') {
      this.expenseChart = chart;
    } else {
      this.incomeChart = chart;
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  async exportPDF() {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF();

    doc.setFontSize(20);
    doc.setTextColor(99, 102, 241);
    doc.text('FinançasPessoais — Relatório', 20, 20);

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(`Período: ${this.currentMonthName}`, 20, 30);

    doc.setDrawColor(200, 200, 200);
    doc.line(20, 35, 190, 35);

    doc.setFontSize(14);
    doc.setTextColor(0, 0, 0);
    doc.text('Resumo Financeiro', 20, 45);

    doc.setFontSize(11);
    doc.setTextColor(16, 185, 129);
    doc.text(`Receitas: ${this.formatCurrency(this.totalIncome)}`, 20, 55);

    doc.setTextColor(239, 68, 68);
    doc.text(`Despesas: ${this.formatCurrency(this.totalExpense)}`, 20, 63);

    doc.setTextColor(0, 0, 0);
    doc.text(`Saldo: ${this.formatCurrency(this.balance)}`, 20, 71);

    doc.line(20, 78, 190, 78);
    doc.setFontSize(14);
    doc.text('Despesas por Categoria', 20, 88);

    let y = 98;
    this.expenseSummary.forEach(c => {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`${c.name}: ${this.formatCurrency(c.total)} (${c.percentage.toFixed(1)}%)`, 20, y);
      y += 8;
    });

    y += 5;
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(14);
    doc.text('Receitas por Categoria', 20, y);
    y += 10;

    this.incomeSummary.forEach(c => {
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text(`${c.name}: ${this.formatCurrency(c.total)} (${c.percentage.toFixed(1)}%)`, 20, y);
      y += 8;
    });

    y += 5;
    doc.line(20, y, 190, y);
    y += 10;
    doc.setFontSize(14);
    doc.text('Transações do Mês', 20, y);
    y += 10;

    this.transactions.forEach(t => {
      if (y > 270) { doc.addPage(); y = 20; }
      doc.setFontSize(10);
      doc.setTextColor(t.type === 'income' ? 16 : 239, t.type === 'income' ? 185 : 68, t.type === 'income' ? 129 : 68);
      const prefix = t.type === 'income' ? '+' : '-';
      doc.text(`${t.date} | ${t.description} | ${t.categories?.name || 'Sem categoria'} | ${prefix}${this.formatCurrency(t.amount)}`, 20, y);
      y += 7;
    });

    doc.save(`relatorio-${this.currentYear}-${this.currentMonth}.pdf`);
  }
}