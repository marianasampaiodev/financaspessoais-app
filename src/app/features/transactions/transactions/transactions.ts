import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TransactionService, Transaction } from '../../../core/services/transaction';
import { CategoryService, Category } from '../../../core/services/category';
import { Navbar } from '../../../shared/components/navbar/navbar'; // componente de navegação compartilhado

@Component({
  selector: 'app-transactions',
  standalone: true,
  imports: [
    CommonModule,        // permite usar *ngIf, *ngFor no HTML
    ReactiveFormsModule, // permite usar formulários reativos
    Navbar               // navbar compartilhada entre as páginas
  ],
  templateUrl: './transactions.html',
  styleUrl: './transactions.scss'
})
export class Transactions implements OnInit {

  // Lista de transações carregadas do banco
  transactions: Transaction[] = [];

  // Lista de categorias do usuário
  categories: Category[] = [];

  // Controla o spinner de carregamento
  loading = true;

  // Controla se o modal de nova transação está visível
  showModal = false;

  // Controla o estado do botão salvar (evita clique duplo)
  submitting = false;

  // Mensagem de erro exibida no modal
  errorMessage = '';

  // Formulário reativo com os campos da transação
  form: FormGroup;

  // Getter que filtra as categorias pelo tipo selecionado no formulário
  // Ex: se o tipo for 'expense', só mostra categorias de despesa
  get filteredCategories(): Category[] {
    const type = this.form.get('type')?.value;
    return this.categories.filter(c => c.type === type);
  }

  constructor(
    private transactionService: TransactionService, // serviço de transações
    private categoryService: CategoryService,       // serviço de categorias
    private fb: FormBuilder,                        // helper para criar formulários
    private cdr: ChangeDetectorRef                  // força atualização da tela
  ) {
    // Define os campos do formulário e suas validações
    this.form = this.fb.group({
      description: ['', Validators.required],                        // obrigatório
      amount: ['', [Validators.required, Validators.min(0.01)]],    // obrigatório e maior que 0
      type: ['expense', Validators.required],                        // padrão: despesa
      category_id: [''],                                             // opcional
      date: [new Date().toISOString().split('T')[0], Validators.required] // data de hoje como padrão
    });
  }

  // Executado automaticamente quando o componente é carregado
  async ngOnInit() {
    await this.loadData();
  }

  // Busca transações e categorias em paralelo (mais rápido que sequencial)
  async loadData() {
    try {
      this.loading = true;

      // Promise.all executa as duas buscas ao mesmo tempo
      const [transactions, categories] = await Promise.all([
        this.transactionService.getAll(),
        this.categoryService.getAll()
      ]);

      this.transactions = transactions;
      this.categories = categories;
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges(); // atualiza a tela após carregar
    }
  }

  // Abre o modal e reseta o formulário para os valores padrão
  openModal() {
    this.showModal = true;
    this.errorMessage = '';
    this.form.reset({
      type: 'expense',
      date: new Date().toISOString().split('T')[0]
    });
  }

  // Fecha o modal
  closeModal() {
    this.showModal = false;
  }

  // Chamado ao clicar em "Salvar" no modal
  async onSubmit() {
    if (this.form.invalid) return; // não envia se tiver campo inválido

    this.submitting = true;
    this.errorMessage = '';

    try {
      await this.transactionService.create(this.form.value);
      await this.loadData(); // recarrega a lista após salvar
      this.closeModal();
    } catch (error) {
      this.errorMessage = 'Erro ao salvar transação. Tente novamente.';
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  // Chamado ao clicar no X de uma transação
  async onDelete(id: string) {
    // Pede confirmação antes de deletar
    if (!confirm('Deseja deletar esta transação?')) return;

    try {
      await this.transactionService.delete(id);
      await this.loadData(); // recarrega a lista após deletar
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  }

  // Formata um número como moeda brasileira. Ex: 150 → R$ 150,00
  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}