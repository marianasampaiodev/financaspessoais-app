import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase';

export interface Category {
  id?: string;
  user_id?: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
}

@Injectable({
  providedIn: 'root'
})
export class CategoryService {

  constructor(private supabase: SupabaseService) {}

  // Busca todas as categorias do usuário
  async getAll(): Promise<Category[]> {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data || [];
  }

  // Cria uma nova categoria
  async create(category: Category): Promise<void> {
    const { error } = await this.supabase.client
      .from('categories')
      .insert(category);

    if (error) throw error;
  }
}