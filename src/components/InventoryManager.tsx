import { useState, useMemo } from 'react'
import type { Ingredient, Menu, SalesRecord } from '../types'
import { AlertTriangle, PackageSearch, Plus, Minus, CheckCircle2 } from 'lucide-react'

interface InventoryManagerProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  menus: Menu[];
  salesRecords: SalesRecord[];
}

export function InventoryManager({ ingredients, setIngredients, menus, salesRecords }: InventoryManagerProps) {
  const [filterMode, setFilterMode] = useState<'all' | 'alert'>('all')

  // 材料ごとの理論消費量を計算 (全期間合計の簡易版)
  const consumptionMap = useMemo(() => {
    const map = new Map<string, number>()
    
    salesRecords.forEach(record => {
      const totalQty = record.quantity + (record.waste || 0)
      if (totalQty <= 0) return;
      const menu = menus.find(m => m.id === record.menuId)
      if (!menu) return;

      menu.recipe.forEach(recipeItem => {
        const currentAmount = map.get(recipeItem.ingredientId) || 0
        map.set(recipeItem.ingredientId, currentAmount + (recipeItem.amount * totalQty))
      })
    })
    
    return map
  }, [menus, salesRecords])

  const handleUpdateStock = (id: string, newStock: number) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, stock: Math.max(0, newStock) } : ing
    ))
  }

  const handleApplyTheoreticalStock = (id: string, theoreticalRemaining: number) => {
    // 予想在庫をそのまま新しい実在庫として確定させ、消費計算の土台をリセットするイメージ
    // ※今回は簡易的に「実在庫の数値を上書き」するだけ。
    handleUpdateStock(id, theoreticalRemaining > 0 ? theoreticalRemaining : 0)
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-32 md:pb-20">
      <header className="mb-6 md:mb-8">
        <h2 className="text-2xl md:text-3xl font-bold tracking-tight">在庫管理・発注</h2>
        <p className="text-slate-400 mt-2 text-sm md:text-base">
          現場でサクサク入力できる棚卸しモードと、不足分を確認する発注モードを切り替えられます。
        </p>
      </header>

      {/* Tabs / Filters */}
      <div className="flex bg-[#1e293b] p-1 rounded-xl mb-6 shadow-lg inline-flex w-full md:w-auto">
        <button
          onClick={() => setFilterMode('all')}
          className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all ${
            filterMode === 'all' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          📦 全て (棚卸し)
        </button>
        <button
          onClick={() => setFilterMode('alert')}
          className={`flex-1 md:flex-none px-6 py-3 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-2 ${
            filterMode === 'alert' ? 'bg-red-500/20 text-red-400 shadow-md border border-red-500/30' : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          <AlertTriangle size={16} /> 要発注のみ
        </button>
      </div>

      {/* Grid List for Mobile & Desktop */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {ingredients.map(ing => {
          const stock = ing.stock || 0
          const threshold = ing.lowStockThreshold || 0
          const consumption = consumptionMap.get(ing.id) || 0
          const remaining = stock - consumption
          
          const isLowStock = remaining <= threshold
          const isNegative = remaining < 0

          // フィルター適用
          if (filterMode === 'alert' && !isLowStock) return null;

          return (
            <div key={ing.id} className={`bg-[#1e293b] rounded-2xl border p-5 shadow-xl relative overflow-hidden transition-all duration-300 ${
              isLowStock ? 'border-red-500/50 shadow-[0_0_20px_rgba(239,68,68,0.15)]' : 'border-slate-800'
            }`}>
              
              {/* Header: Name and Status */}
              <div className="flex justify-between items-start mb-4">
                <div className="pr-16">
                  <h3 className="font-bold text-lg text-slate-100">{ing.name}</h3>
                  {ing.supplierName && (
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                      <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px] uppercase">発注名</span>
                      {ing.supplierName}
                    </p>
                  )}
                </div>
                {/* Badge Absolute */}
                <div className="absolute top-4 right-4">
                  {isNegative ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-500 text-white shadow-lg animate-pulse">
                      在庫異常
                    </span>
                  ) : isLowStock ? (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-amber-500 text-white shadow-lg">
                      要発注
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-slate-800 text-emerald-400 border border-slate-700">
                      適正
                    </span>
                  )}
                </div>
              </div>

              {/* Data Rows */}
              <div className="space-y-3 mb-6 bg-[#0f172a]/50 p-4 rounded-xl border border-slate-800/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">初期/確定在庫</span>
                  <span className="font-mono text-slate-300">{stock} <span className="text-xs text-slate-500 ml-1">{ing.unit}</span></span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-slate-400">理論消費量 (売上等)</span>
                  <span className="font-mono text-red-400">
                    {consumption > 0 ? `-${consumption}` : '0'} <span className="text-xs text-slate-500 ml-1">{ing.unit}</span>
                  </span>
                </div>
                <div className="pt-2 border-t border-slate-700/50 flex justify-between items-end mt-2">
                  <span className="text-sm font-semibold text-slate-300">予想残り在庫</span>
                  <span className={`font-mono text-2xl font-bold ${isLowStock ? 'text-red-400' : 'text-emerald-400'}`}>
                    {remaining.toLocaleString()} <span className="text-sm text-slate-500 font-normal ml-1">{ing.unit}</span>
                  </span>
                </div>
                
                {/* ワンタップ確定ボタン */}
                <div className="pt-2">
                  <button 
                    onClick={() => handleApplyTheoreticalStock(ing.id, remaining)}
                    className="w-full bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border border-blue-500/30 py-2 rounded-lg text-xs font-bold flex items-center justify-center gap-2 transition-colors"
                  >
                    <CheckCircle2 size={14} />
                    この予想在庫で確定する (棚卸し)
                  </button>
                </div>
              </div>

              {/* Input Stepper */}
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">実在庫の修正・棚卸し</label>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleUpdateStock(ing.id, stock - 1)}
                    className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl flex-shrink-0 transition-colors active:scale-95"
                  >
                    <Minus size={20} />
                  </button>
                  <input
                    type="number"
                    value={stock === 0 ? '' : stock}
                    onChange={(e) => handleUpdateStock(ing.id, Number(e.target.value))}
                    className="flex-1 w-full bg-[#0f172a] border-2 border-slate-700 focus:border-blue-500 rounded-xl px-4 py-3 text-center text-xl font-bold font-mono focus:outline-none transition-colors"
                    placeholder="0"
                  />
                  <button 
                    onClick={() => handleUpdateStock(ing.id, stock + 1)}
                    className="bg-slate-700 hover:bg-slate-600 text-white p-3 rounded-xl flex-shrink-0 transition-colors active:scale-95"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>

            </div>
          )
        })}
      </div>

      {ingredients.length === 0 && (
        <div className="text-center py-20">
          <PackageSearch size={48} className="mx-auto text-slate-600 mb-4" />
          <p className="text-slate-400">材料が登録されていません。</p>
        </div>
      )}
    </div>
  )
}
