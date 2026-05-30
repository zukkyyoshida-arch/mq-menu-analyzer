export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost: number;
}

export interface RecipeItem {
  ingredientId: string;
  amount: number;
}

export interface Menu {
  id: string;
  name: string;
  price: number;
  recipe: RecipeItem[];
}

export interface SalesRecord {
  menuId: string;
  quantity: number;
}

// ダッシュボード等で計算済みのメニューデータとして扱う型
export interface CalculatedMenuData {
  id: string;
  name: string;
  price: number;
  cost: number; // 原価
  mq: number; // 限界利益
  sales: number; // 販売数量
}
