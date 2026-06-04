import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { SupabaseService } from './supabase';

export interface Transaction {
  id?: string;
  user_id?: string;
  category_id?: string;
  amount: number;
  type: 'income' | 'expense';
  description: string;
  date: string;
  created_at?: string;
  categories?: { name: string; color: string; };
}

@Injectable({
  providedIn: 'root'
})
export class TransactionService {

  private transactionsUpdated = new Subject<void>();
  transactionsUpdated$ = this.transactionsUpdated.asObservable();

  constructor(private supabase: SupabaseService) {}

  // Busca todas as transações do usuário ordenadas por data
  async getAll(): Promise<Transaction[]> {
    const { data, error } = await this.supabase.client
      .from('transactions')
      .select('*, categories(name, color)')
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Busca transações do mês atual
  async getByMonth(year: number, month: number): Promise<Transaction[]> {
    const start = `${year}-${String(month).padStart(2, '0')}-01`;
    const lastDay = new Date(year, month, 0).getDate();
    const end = `${year}-${String(month).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;

    const { data, error } = await this.supabase.client
      .from('transactions')
      .select('*, categories(name, color)')
      .gte('date', start)
      .lte('date', end)
      .order('date', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Cria uma nova transação

 async create(transaction: Transaction): Promise<void> {
  const { data: { user } } = await this.supabase.client.auth.getUser();

  const { error } = await this.supabase.client
    .from('transactions')
    .insert({
      ...transaction,
      // converte string vazia para null para não quebrar o banco
      category_id: transaction.category_id || null,
      user_id: user?.id
    });

  if (error) throw error;
}

  // Deleta uma transação
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('transactions')
      .delete()
      .eq('id', id);

    if (error) throw error;
    this.transactionsUpdated.next();
  }
}