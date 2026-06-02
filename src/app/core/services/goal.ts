import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

export interface Goal {
  id?: string;
  user_id?: string;
  name: string;
  target_amount: number;
  current_amount: number;
  deadline?: string;
  created_at?: string;
}

@Injectable({
  providedIn: 'root'
})
export class GoalService {

  constructor(private supabase: SupabaseService) {}

  // Busca todas as metas do usuário
  async getAll(): Promise<Goal[]> {
    const { data, error } = await this.supabase.client
      .from('goals')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  }

  // Cria uma nova meta
  async create(goal: Omit<Goal, 'id' | 'user_id' | 'created_at'>): Promise<void> {
    const { data: { user } } = await this.supabase.client.auth.getUser();

    const { error } = await this.supabase.client
      .from('goals')
      .insert({ ...goal, user_id: user?.id });

    if (error) throw error;
  }

  // Atualiza o valor atual da meta
  async updateAmount(id: string, current_amount: number): Promise<void> {
    const { error } = await this.supabase.client
      .from('goals')
      .update({ current_amount })
      .eq('id', id);

    if (error) throw error;
  }

  // Deleta uma meta
  async delete(id: string): Promise<void> {
    const { error } = await this.supabase.client
      .from('goals')
      .delete()
      .eq('id', id);

    if (error) throw error;
  }
}