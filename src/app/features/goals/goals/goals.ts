import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { GoalService, Goal } from '../../../core/services/goal';
import { Navbar } from '../../../shared/components/navbar/navbar';

@Component({
  selector: 'app-goals',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, Navbar],
  templateUrl: './goals.html',
  styleUrl: './goals.scss'
})
export class Goals implements OnInit {

  goals: Goal[] = [];
  loading = true;
  showModal = false;
  showAddModal = false; // modal para adicionar valor à meta
  submitting = false;
  errorMessage = '';
  selectedGoal: Goal | null = null; // meta selecionada para adicionar valor

  // Formulário de nova meta
  form: FormGroup;

  // Formulário para adicionar valor à meta
  addForm: FormGroup;

  constructor(
    private goalService: GoalService,
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef
  ) {
    // Campos para criar uma nova meta
    this.form = this.fb.group({
      name: ['', Validators.required],
      target_amount: ['', [Validators.required, Validators.min(1)]],
      current_amount: [0],
      deadline: ['']
    });

    // Campo para adicionar valor a uma meta existente
    this.addForm = this.fb.group({
      amount: ['', [Validators.required, Validators.min(0.01)]]
    });
  }

  async ngOnInit() {
    await this.loadGoals();
  }

  async loadGoals() {
    try {
      this.loading = true;
      this.goals = await this.goalService.getAll();
    } catch (error) {
      console.error('Erro ao carregar metas:', error);
    } finally {
      this.loading = false;
      this.cdr.detectChanges();
    }
  }

  // Calcula o percentual de progresso da meta
  getProgress(goal: Goal): number {
    if (goal.target_amount === 0) return 0;
    const progress = (goal.current_amount / goal.target_amount) * 100;
    return Math.min(progress, 100); // máximo 100%
  }

  // Retorna a cor da barra de progresso baseado no percentual
  getProgressColor(goal: Goal): string {
    const progress = this.getProgress(goal);
    if (progress >= 100) return '#10B981'; // verde — meta atingida
    if (progress >= 50) return '#6366F1';  // roxo — mais da metade
    return '#F59E0B';                       // amarelo — menos da metade
  }

  openModal() {
    this.showModal = true;
    this.errorMessage = '';
    this.form.reset({ current_amount: 0 });
  }

  closeModal() {
    this.showModal = false;
  }

  openAddModal(goal: Goal) {
    this.selectedGoal = goal;
    this.showAddModal = true;
    this.addForm.reset();
  }

  closeAddModal() {
    this.showAddModal = false;
    this.selectedGoal = null;
  }

  async onSubmit() {
    if (this.form.invalid) return;

    this.submitting = true;
    this.errorMessage = '';

    try {
      await this.goalService.create(this.form.value);
      await this.loadGoals();
      this.closeModal();
    } catch (error) {
      this.errorMessage = 'Erro ao salvar meta. Tente novamente.';
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  async onAddAmount() {
    if (this.addForm.invalid || !this.selectedGoal) return;

    this.submitting = true;

    try {
      const newAmount = Number(this.selectedGoal.current_amount) + Number(this.addForm.value.amount);
      await this.goalService.updateAmount(this.selectedGoal.id!, newAmount);
      await this.loadGoals();
      this.closeAddModal();
    } catch (error) {
      console.error('Erro ao atualizar meta:', error);
    } finally {
      this.submitting = false;
      this.cdr.detectChanges();
    }
  }

  async onDelete(id: string) {
    if (!confirm('Deseja deletar esta meta?')) return;

    try {
      await this.goalService.delete(id);
      await this.loadGoals();
    } catch (error) {
      console.error('Erro ao deletar:', error);
    }
  }

  formatCurrency(value: number): string {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }
}