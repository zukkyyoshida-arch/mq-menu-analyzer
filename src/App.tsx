import { useState, useMemo } from 'react'
import { LayoutDashboard, Utensils, ReceiptText, Settings as SettingsIcon, TrendingUp, PackageSearch } from 'lucide-react'
import { Dashboard } from './components/Dashboard'
import { MenuManager } from './components/MenuManager'
import { SalesManager } from './components/SalesManager'
import { InventoryManager } from './components/InventoryManager'
import { Settings } from './components/Settings'
import { Ingredient, Menu, SalesRecord, CalculatedMenuData } from './types'

// Mock Data
const initialIngredients: Ingredient[] = [
  { id: 'i1', name: '特製パティ', unit: '枚', cost: 250, stock: 1000, lowStockThreshold: 200 },
  { id: 'i2', name: 'バンズ', unit: '個', cost: 80, stock: 800, lowStockThreshold: 100 },
  { id: 'i3', name: 'スライスチーズ', unit: '枚', cost: 40, stock: 500, lowStockThreshold: 50 },
  { id: 'i4', name: 'レタス', unit: '枚', cost: 20, stock: 300, lowStockThreshold: 50 },
  { id: 'i5', name: 'トマト', unit: 'スライス', cost: 30, stock: 400, lowStockThreshold: 100 },
  { id: 'i6', name: 'じゃがいも', unit: '100g', cost: 70, stock: 2000, lowStockThreshold: 500 },
  { id: 'i7', name: 'コーラシロップ', unit: '回', cost: 50, stock: 150, lowStockThreshold: 20 },
  { id: 'i8', name: '炭酸水', unit: '杯', cost: 10, stock: 500, lowStockThreshold: 100 },
  { id: 'i9', name: 'タマネギ', unit: '100g', cost: 50, stock: 300, lowStockThreshold: 50 },
  { id: 'i10', name: 'アイスクリーム', unit: 'スクープ', cost: 100, stock: 100, lowStockThreshold: 20 },
]

const initialMenus: Menu[] = [
  { 
    id: 'm1', name: '特製ハンバーガー', price: 800, 
    recipe: [
      { ingredientId: 'i1', amount: 1 },
      { ingredientId: 'i2', amount: 1 },
      { ingredientId: 'i4', amount: 1 },
      { ingredientId: 'i5', amount: 1 }
    ] 
  },
  { 
    id: 'm2', name: 'チーズバーガー', price: 750, 
    recipe: [
      { ingredientId: 'i1', amount: 1 },
      { ingredientId: 'i2', amount: 1 },
      { ingredientId: 'i3', amount: 1 }
    ] 
  },
  { 
    id: 'm3', name: 'フライドポテト', price: 350, 
    recipe: [
      { ingredientId: 'i6', amount: 1.5 }
    ] 
  },
  { 
    id: 'm4', name: 'クラフトコーラ', price: 500, 
    recipe: [
      { ingredientId: 'i7', amount: 1 },
      { ingredientId: 'i8', amount: 1 }
    ] 
  },
  { 
    id: 'm5', name: 'オニオンリング', price: 300, 
    recipe: [
      { ingredientId: 'i9', amount: 1.2 }
    ] 
  },
  { 
    id: 'm6', name: '期間限定シェイク', price: 650, 
    recipe: [
      { ingredientId: 'i10', amount: 2 }
    ] 
  },
]

const initialSalesRecords: SalesRecord[] = [
  { menuId: 'm1', quantity: 450 },
  { menuId: 'm2', quantity: 300 },
  { menuId: 'm3', quantity: 800 },
  { menuId: 'm4', quantity: 300 },
  { menuId: 'm5', quantity: 150 },
  { menuId: 'm6', quantity: 250 },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // Global State
  const [ingredients, setIngredients] = useState<Ingredient[]>(initialIngredients)
  const [menus, setMenus] = useState<Menu[]>(initialMenus)
  const [salesRecords, setSalesRecords] = useState<SalesRecord[]>(initialSalesRecords)

  // メニューから原価・限界利益・販売数を計算して統合データを生成
  const calculatedMenuData: CalculatedMenuData[] = useMemo(() => {
    return menus.map(menu => {
      // 1. 原価計算
      const cost = menu.recipe.reduce((total, recipeItem) => {
        const ing = ingredients.find(i => i.id === recipeItem.ingredientId)
        return total + (ing ? ing.cost * recipeItem.amount : 0)
      }, 0)

      // 2. 限界利益計算
      const mq = menu.price - cost

      // 3. 販売数取得
      const sales = salesRecords.find(r => r.menuId === menu.id)?.quantity || 0

      return {
        id: menu.id,
        name: menu.name,
        price: menu.price,
        cost,
        mq,
        sales
      }
    })
  }, [ingredients, menus, salesRecords])

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] border-r border-slate-800 flex flex-col z-10 shadow-2xl">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
            <TrendingUp />
            MQ Analyzer
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2 mt-4">
          <NavItem icon={<LayoutDashboard size={20} />} label="ダッシュボード" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Utensils size={20} />} label="メニュー管理" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
          <NavItem icon={<ReceiptText size={20} />} label="販売データ入力" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
          <NavItem icon={<PackageSearch size={20} />} label="在庫管理・発注" active={activeTab === 'inventory'} onClick={() => setActiveTab('inventory')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <NavItem icon={<SettingsIcon size={20} />} label="設定" active={activeTab === 'settings'} onClick={() => setActiveTab('settings')} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8 relative">
        {/* Decorator background */}
        <div className="absolute top-0 left-0 w-full h-96 bg-blue-900/10 rounded-full blur-3xl -z-10 pointer-events-none transform -translate-y-1/2"></div>
        
        {activeTab === 'dashboard' && <Dashboard data={calculatedMenuData} />}
        {activeTab === 'menu' && (
          <MenuManager 
            ingredients={ingredients} 
            setIngredients={setIngredients} 
            menus={menus} 
            setMenus={setMenus} 
          />
        )}
        {activeTab === 'sales' && (
          <SalesManager 
            menus={menus} 
            salesRecords={salesRecords} 
            setSalesRecords={setSalesRecords} 
          />
        )}
        {activeTab === 'inventory' && (
          <InventoryManager 
            ingredients={ingredients} 
            setIngredients={setIngredients} 
            menus={menus} 
            salesRecords={salesRecords} 
          />
        )}
        {activeTab === 'settings' && <Settings />}
      </main>
    </div>
  )
}

function NavItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
        active 
          ? 'bg-blue-600/20 text-blue-400 shadow-[inset_4px_0_0_0_rgba(59,130,246,1)] font-semibold' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 font-medium'
      }`}
    >
      {icon}
      <span className="text-sm">{label}</span>
    </button>
  )
}
