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

  private defaultCategories: Category[] = [
    // Despesas
    { name: 'Alimentação', color: '#FF6B6B', type: 'expense' },
    { name: 'Transporte', color: '#4ECDC4', type: 'expense' },
    { name: 'Saúde', color: '#95E1D3', type: 'expense' },
    { name: 'Educação', color: '#FFE66D', type: 'expense' },
    { name: 'Lazer', color: '#FF85A2', type: 'expense' },
    { name: 'Compras', color: '#B19CD9', type: 'expense' },
    { name: 'Fixas', color: '#c4db3d', type: 'expense' },
    { name: 'Outros', color: '#A5D6A7', type: 'expense' },
    // Receitas
    { name: 'Salário', color: '#6BCB77', type: 'income' },
    { name: 'Freelance', color: '#4D96FF', type: 'income' },
    { name: 'Investimentos', color: '#FFD700', type: 'income' },
    { name: 'Bônus', color: '#FF6B9D', type: 'income' },
    { name: 'Outros', color: '#B2DFDB', type: 'income' }
  ];

  constructor(private supabase: SupabaseService) {}

  // Busca categorias do usuário, com fallback para categorias padrão
  async getAll(): Promise<Category[]> {
    const { data, error } = await this.supabase.client
      .from('categories')
      .select('*')
      .order('name');

    if (error) throw error;
    return data?.length ? data : this.getDefaultCategories();
  }

  // Retorna as categorias padrão sem persistir no banco
  getDefaultCategories(): Category[] {
    return this.defaultCategories;
  }

  // Cria uma nova categoria
  async create(category: Category): Promise<void> {
    const { error } = await this.supabase.client
      .from('categories')
      .insert(category);

    if (error) throw error;
  }
}