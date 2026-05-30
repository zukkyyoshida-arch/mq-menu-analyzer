export interface Ingredient {
  id: string;
  name: string;
  unit: string;
  cost: number;
  stock?: number; // 現在の実在庫数
  lowStockThreshold?: number; // 発注点（安全在庫）
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
  waste?: number; // 廃棄数
  period?: string; // 期間 (例: "2024-04")
}

// ダッシュボード等で計算済みのメニューデータとして扱う型
export interface CalculatedMenuData {
  id: string;
  name: string;
  price: number;
  cost: number; // 原価
  mq: number; // 限界利益
  sales: number; // 販売数量
  waste: number; // 廃棄数
}
