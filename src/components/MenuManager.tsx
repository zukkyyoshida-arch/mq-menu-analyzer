import { useState } from 'react'
import { Ingredient, Menu } from '../types'
import { Plus, Trash2 } from 'lucide-react'

interface MenuManagerProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  menus: Menu[];
  setMenus: React.Dispatch<React.SetStateAction<Menu[]>>;
}

export function MenuManager({ ingredients, setIngredients, menus, setMenus }: MenuManagerProps) {
  const [activeTab, setActiveTab] = useState<'menus' | 'ingredients'>('menus')

  // 材料追加用ステート
  const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({ name: '', unit: '', cost: 0 })

  // メニュー追加用ステート
  const [newMenu, setNewMenu] = useState<Partial<Menu>>({ name: '', price: 0, recipe: [] })

  const handleAddIngredient = () => {
    if (!newIngredient.name || !newIngredient.unit) return;
    const item: Ingredient = {
      id: Math.random().toString(36).substring(2, 9),
      name: newIngredient.name,
      unit: newIngredient.unit,
      cost: Number(newIngredient.cost) || 0
    }
    setIngredients([...ingredients, item])
    setNewIngredient({ name: '', unit: '', cost: 0 })
  }

  const handleDeleteIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id))
    // TODO: レシピに含まれている場合の警告処理
  }

  const handleAddMenu = () => {
    if (!newMenu.name) return;
    const item: Menu = {
      id: Math.random().toString(36).substring(2, 9),
      name: newMenu.name,
      price: Number(newMenu.price) || 0,
      recipe: newMenu.recipe || []
    }
    setMenus([...menus, item])
    setNewMenu({ name: '', price: 0, recipe: [] })
  }

  const handleDeleteMenu = (id: string) => {
    setMenus(menus.filter(m => m.id !== id))
  }

  const calculateCost = (menu: Menu) => {
    return menu.recipe.reduce((total, recipeItem) => {
      const ingredient = ingredients.find(i => i.id === recipeItem.ingredientId)
      return total + (ingredient ? ingredient.cost * recipeItem.amount : 0)
    }, 0)
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">メニュー・原価管理</h2>
        <p className="text-slate-400 mt-2">材料の仕入れ原価を登録し、メニューのレシピから1食あたりの原価を自動計算します。</p>
      </header>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-800 mb-6 pb-2">
        <button 
          onClick={() => setActiveTab('menus')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'menus' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          メニュー一覧
        </button>
        <button 
          onClick={() => setActiveTab('ingredients')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'ingredients' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          材料マスター
        </button>
      </div>

      {activeTab === 'ingredients' && (
        <div className="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-lg font-semibold mb-4">新規材料の追加</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">材料名</label>
                <input type="text" value={newIngredient.name} onChange={e => setNewIngredient({...newIngredient, name: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="例: 牛ひき肉" />
              </div>
              <div className="w-32">
                <label className="block text-xs text-slate-400 mb-1">単位</label>
                <input type="text" value={newIngredient.unit} onChange={e => setNewIngredient({...newIngredient, unit: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="例: 100g" />
              </div>
              <div className="w-32">
                <label className="block text-xs text-slate-400 mb-1">原価 (¥)</label>
                <input type="number" value={newIngredient.cost || ''} onChange={e => setNewIngredient({...newIngredient, cost: Number(e.target.value)})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="0" />
              </div>
              <button onClick={handleAddIngredient} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <Plus size={16} /> 追加
              </button>
            </div>
          </div>
          
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">材料名</th>
                <th className="px-6 py-3 font-medium">単位</th>
                <th className="px-6 py-3 font-medium">原価</th>
                <th className="px-6 py-3 font-medium w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {ingredients.map(ing => (
                <tr key={ing.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4">{ing.name}</td>
                  <td className="px-6 py-4 text-slate-400">{ing.unit}</td>
                  <td className="px-6 py-4 font-medium">¥{ing.cost.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <button onClick={() => handleDeleteIngredient(ing.id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10 transition-colors">
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
              {ingredients.length === 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-slate-500">材料が登録されていません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'menus' && (
        <div className="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-lg font-semibold mb-4">新規メニューの追加</h3>
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">メニュー名</label>
                <input type="text" value={newMenu.name} onChange={e => setNewMenu({...newMenu, name: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="例: 特製バーガー" />
              </div>
              <div className="w-32">
                <label className="block text-xs text-slate-400 mb-1">販売価格 (¥)</label>
                <input type="number" value={newMenu.price || ''} onChange={e => setNewMenu({...newMenu, price: Number(e.target.value)})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="0" />
              </div>
              <button onClick={handleAddMenu} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
                <Plus size={16} /> 追加
              </button>
            </div>
            <p className="text-xs text-slate-500 mt-2">※レシピ（材料構成）の追加・編集機能は今後アップデート予定です。</p>
          </div>
          
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase">
              <tr>
                <th className="px-6 py-3 font-medium">メニュー名</th>
                <th className="px-6 py-3 font-medium">販売価格</th>
                <th className="px-6 py-3 font-medium">1食あたり原価</th>
                <th className="px-6 py-3 font-medium">限界利益(MQ)</th>
                <th className="px-6 py-3 font-medium">原価率</th>
                <th className="px-6 py-3 font-medium w-20">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {menus.map(m => {
                const cost = calculateCost(m)
                const mq = m.price - cost
                const rate = m.price > 0 ? (cost / m.price) * 100 : 0
                return (
                  <tr key={m.id} className="hover:bg-slate-800/50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-200">{m.name}</td>
                    <td className="px-6 py-4 text-blue-400 font-bold">¥{m.price.toLocaleString()}</td>
                    <td className="px-6 py-4 text-red-400">¥{cost.toLocaleString()}</td>
                    <td className="px-6 py-4 text-emerald-400 font-bold">¥{mq.toLocaleString()}</td>
                    <td className="px-6 py-4 text-slate-400">{rate.toFixed(1)}%</td>
                    <td className="px-6 py-4">
                      <button onClick={() => handleDeleteMenu(m.id)} className="text-red-400 hover:text-red-300 p-1 rounded hover:bg-red-400/10 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                )
              })}
              {menus.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-500">メニューが登録されていません</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
