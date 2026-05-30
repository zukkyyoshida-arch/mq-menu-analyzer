import { useMemo } from 'react'
import { Ingredient, Menu, SalesRecord } from '../types'
import { AlertTriangle, PackageSearch } from 'lucide-react'

interface InventoryManagerProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  menus: Menu[];
  salesRecords: SalesRecord[];
}

export function InventoryManager({ ingredients, setIngredients, menus, salesRecords }: InventoryManagerProps) {

  // 材料ごとの理論消費量を計算
  const consumptionMap = useMemo(() => {
    const map = new Map<string, number>()
    
    // 全販売記録をループ
    salesRecords.forEach(record => {
      if (record.quantity <= 0) return;
      const menu = menus.find(m => m.id === record.menuId)
      if (!menu) return;

      // このメニューのレシピを見て、使用量を消費マップに加算
      menu.recipe.forEach(recipeItem => {
        const currentAmount = map.get(recipeItem.ingredientId) || 0
        map.set(recipeItem.ingredientId, currentAmount + (recipeItem.amount * record.quantity))
      })
    })
    
    return map
  }, [menus, salesRecords])

  const handleUpdateStock = (id: string, newStock: number) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, stock: newStock } : ing
    ))
  }

  const handleUpdateThreshold = (id: string, newThreshold: number) => {
    setIngredients(ingredients.map(ing => 
      ing.id === id ? { ...ing, lowStockThreshold: newThreshold } : ing
    ))
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">在庫管理 (棚卸し・発注)</h2>
        <p className="text-slate-400 mt-2">
          販売データとレシピから「理論上の消費量」を自動計算し、発注が必要な材料をアラート表示します。
        </p>
      </header>

      {/* Alert Banner */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6 flex items-start gap-3">
        <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
        <div>
          <h4 className="font-semibold text-amber-200 text-sm mb-1">理論在庫と実在庫について</h4>
          <p className="text-xs text-amber-200/80 leading-relaxed">
            「予想残り在庫」は、登録した初期在庫から販売数に基づく「理論消費量」を引いたものです。<br/>
            実際の在庫数（実在庫）とズレがある場合は、「初期/実在庫」の数値を手動で修正して棚卸しを行ってください。
          </p>
        </div>
      </div>

      <div className="bg-[#1e293b] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <div className="p-6 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <PackageSearch className="text-blue-400" />
            材料在庫・発注ステータス
          </h3>
        </div>
        
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">材料名</th>
              <th className="px-6 py-4 font-medium w-32">初期/実在庫</th>
              <th className="px-6 py-4 font-medium text-red-300">理論消費量</th>
              <th className="px-6 py-4 font-medium text-emerald-300">予想残り在庫</th>
              <th className="px-6 py-4 font-medium w-32">発注アラート点</th>
              <th className="px-6 py-4 font-medium w-32">ステータス</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {ingredients.map(ing => {
              const stock = ing.stock || 0
              const threshold = ing.lowStockThreshold || 0
              const consumption = consumptionMap.get(ing.id) || 0
              const remaining = stock - consumption
              
              // 在庫がアラート点以下なら警告
              const isLowStock = remaining <= threshold
              // 在庫がマイナスなら異常（実在庫の修正が必要）
              const isNegative = remaining < 0

              return (
                <tr key={ing.id} className={`hover:bg-slate-800/30 transition-colors ${isLowStock ? 'bg-red-500/5' : ''}`}>
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200">{ing.name}</div>
                    <div className="text-xs text-slate-500">{ing.unit}</div>
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={stock === 0 && remaining === 0 ? '' : stock}
                      onChange={(e) => handleUpdateStock(ing.id, Number(e.target.value))}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-4 text-red-400 font-medium">
                    {consumption > 0 ? `-${consumption.toLocaleString()}` : '0'}
                  </td>
                  <td className={`px-6 py-4 font-bold text-lg ${isNegative ? 'text-red-500' : 'text-emerald-400'}`}>
                    {remaining.toLocaleString()}
                  </td>
                  <td className="px-6 py-4">
                    <input
                      type="number"
                      value={threshold === 0 ? '' : threshold}
                      onChange={(e) => handleUpdateThreshold(ing.id, Number(e.target.value))}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-4">
                    {isNegative ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-500/20 text-red-400 border border-red-500/30">
                        在庫異常
                      </span>
                    ) : isLowStock ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-500/20 text-amber-400 border border-amber-500/30 animate-pulse">
                        要発注
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        適正
                      </span>
                    )}
                  </td>
                </tr>
              )
            })}
            {ingredients.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-8 text-center text-slate-500">材料が登録されていません。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
