import React, { useState } from 'react'
import type { Ingredient, Menu, RecipeItem } from '../types'
import { Plus, Trash2, Sparkles, Loader2, ChevronDown, ChevronUp, Utensils, Save } from 'lucide-react'
import { generateRecipeWithAI, generateMenuFromLoss } from '../lib/ai'

interface MenuManagerProps {
  ingredients: Ingredient[];
  setIngredients: React.Dispatch<React.SetStateAction<Ingredient[]>>;
  menus: Menu[];
  setMenus: React.Dispatch<React.SetStateAction<Menu[]>>;
}

export function MenuManager({ ingredients, setIngredients, menus, setMenus }: MenuManagerProps) {
  const [activeTab, setActiveTab] = useState<'menus' | 'ingredients'>('menus')

  // UI State
  const [newIngredient, setNewIngredient] = useState<Partial<Ingredient>>({ name: '', supplierName: '', unit: '', cost: 0 })
  const [newMenu, setNewMenu] = useState<Partial<Menu>>({ name: '', price: 0, recipe: [] })
  const [isGenerating, setIsGenerating] = useState(false)
  const [aiMenuName, setAiMenuName] = useState('')
  const [expandedMenuId, setExpandedMenuId] = useState<string | null>(null)

  // レシピ編集中の一時ステート
  const [editingRecipe, setEditingRecipe] = useState<RecipeItem[]>([])

  const handleAddIngredient = (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!newIngredient.name || !newIngredient.unit) return;
    const item: Ingredient = {
      id: Math.random().toString(36).substring(2, 9),
      name: newIngredient.name,
      supplierName: newIngredient.supplierName,
      unit: newIngredient.unit,
      cost: Number(newIngredient.cost) || 0,
      stock: 0,
      lowStockThreshold: 0
    }
    setIngredients([...ingredients, item])
    setNewIngredient({ name: '', supplierName: '', unit: '', cost: 0 })
  }

  const handleDeleteIngredient = (id: string) => {
    setIngredients(ingredients.filter(i => i.id !== id))
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

  const handleAIGenerate = async () => {
    if (!aiMenuName) return;
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      alert('「設定」画面からGemini APIキーを登録してください。');
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateRecipeWithAI(aiMenuName, apiKey);
      if (generated) {
        applyGeneratedRecipe(aiMenuName, generated);
      }
    } catch (err) {
      alert('レシピの生成に失敗しました。APIキーが正しいか確認してください。');
    } finally {
      setIsGenerating(false);
    }
  }

  const handleGenerateFromLoss = async () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY');
    if (!apiKey) {
      alert('「設定」画面からGemini APIキーを登録してください。');
      return;
    }

    // 在庫が多い順にトップ5を取得 (余剰食材)
    const surplusIngredients = [...ingredients]
      .sort((a, b) => ((b.stock || 0) - (b.lowStockThreshold || 0)) - ((a.stock || 0) - (a.lowStockThreshold || 0)))
      .slice(0, 5)

    if (surplusIngredients.length === 0 || (surplusIngredients[0].stock || 0) === 0) {
      alert('現在、余剰在庫として提案できる材料がありません。');
      return;
    }

    setIsGenerating(true);
    try {
      const generated = await generateMenuFromLoss(surplusIngredients, apiKey);
      if (generated) {
        // AIが提案した名前を使用する
        const name = (generated as any).menuName || 'ロス活用限定メニュー';
        applyGeneratedRecipe(name, generated);
      }
    } catch (err) {
      alert('レシピの生成に失敗しました。APIキーが正しいか確認してください。');
    } finally {
      setIsGenerating(false);
    }
  }

  const applyGeneratedRecipe = (menuName: string, generated: import('../lib/ai').GeneratedRecipe) => {
    const newIngs = [...ingredients];
    const addedRecipeItems: RecipeItem[] = [];

    for (const aiIng of generated.ingredients) {
      // 同じ名前の材料がすでにあればそれを使う
      let existing = newIngs.find(i => i.name === aiIng.name);
      if (!existing) {
        existing = {
          id: Math.random().toString(36).substring(2, 9),
          name: aiIng.name,
          unit: aiIng.unit,
          cost: aiIng.cost
        };
        newIngs.push(existing);
      }
    }

    // レシピの構築
    for (const item of generated.recipe) {
      const ing = newIngs.find(i => i.name === item.ingredientName);
      if (ing) {
        addedRecipeItems.push({ ingredientId: ing.id, amount: item.amount });
      }
    }

    const newMenuItem: Menu = {
      id: Math.random().toString(36).substring(2, 9),
      name: menuName,
      price: generated.suggestedPrice,
      recipe: addedRecipeItems
    };

    setIngredients(newIngs);
    setMenus([...menus, newMenuItem]);
    setAiMenuName('');
    alert('AIによるレシピの生成と登録が完了しました！');
  }

  const toggleExpand = (menu: Menu) => {
    if (expandedMenuId === menu.id) {
      setExpandedMenuId(null)
    } else {
      setExpandedMenuId(menu.id)
      setEditingRecipe([...menu.recipe])
    }
  }

  const handleRecipeChange = (index: number, field: keyof RecipeItem, value: any) => {
    const newRecipe = [...editingRecipe]
    newRecipe[index] = { ...newRecipe[index], [field]: value }
    setEditingRecipe(newRecipe)
  }

  const addRecipeRow = () => {
    setEditingRecipe([...editingRecipe, { ingredientId: '', amount: 1 }])
  }

  const removeRecipeRow = (index: number) => {
    const newRecipe = [...editingRecipe]
    newRecipe.splice(index, 1)
    setEditingRecipe(newRecipe)
  }

  const saveRecipe = (menuId: string) => {
    const newMenus = menus.map(m => {
      if (m.id === menuId) {
        return { ...m, recipe: editingRecipe.filter(r => r.ingredientId !== '') }
      }
      return m
    })
    setMenus(newMenus)
    setExpandedMenuId(null)
  }

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
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
          メニュー一覧・レシピ管理
        </button>
        <button 
          onClick={() => setActiveTab('ingredients')}
          className={`px-4 py-2 font-medium transition-colors ${activeTab === 'ingredients' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-slate-400 hover:text-slate-200'}`}
        >
          材料マスター
        </button>
      </div>

      {activeTab === 'ingredients' && (
        <div className="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
          <div className="p-6 border-b border-slate-800 bg-slate-900/50">
            <h3 className="text-sm font-medium text-slate-400 mb-4 uppercase tracking-wider">新規材料の追加</h3>
            <form onSubmit={handleAddIngredient} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full flex flex-col gap-3">
                <input
                  type="text"
                  placeholder="現場の呼び名 (例: トマト)"
                  value={newIngredient.name}
                  onChange={(e) => setNewIngredient({...newIngredient, name: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
                <input
                  type="text"
                  placeholder="業者発注名 (任意 / 例: トマト Lサイズ)"
                  value={newIngredient.supplierName || ''}
                  onChange={(e) => setNewIngredient({...newIngredient, supplierName: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="flex-1 w-full">
                <input
                  type="text"
                  placeholder="単位 (例: 個, g, ml)"
                  value={newIngredient.unit}
                  onChange={(e) => setNewIngredient({...newIngredient, unit: e.target.value})}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                />
              </div>
              <div className="flex-1 w-full">
                <input
                  type="number"
                  placeholder="仕入原価 (円)"
                  value={newIngredient.cost || ''}
                  onChange={(e) => setNewIngredient({...newIngredient, cost: Number(e.target.value)})}
                  className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                  required
                  min="0"
                />
              </div>
              <button 
                type="submit"
                className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-6 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> 追加
              </button>
            </form>
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
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200">{ing.name}</div>
                    {ing.supplierName && (
                      <div className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                        <span className="bg-slate-800 px-1.5 py-0.5 rounded text-[10px]">発注名</span>
                        {ing.supplierName}
                      </div>
                    )}
                  </td>
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
        <div className="space-y-6">
          {/* AI Generation Box */}
          <div className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 rounded-xl border border-blue-500/20 p-6 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Sparkles size={100} />
            </div>
            <h3 className="text-lg font-semibold mb-2 flex items-center gap-2 text-blue-200">
              <Sparkles size={20} className="text-blue-400" />
              AI レシピ自動考案 ＆ 余剰在庫の活用
            </h3>
            <p className="text-sm text-slate-300 mb-4">
              メニュー名を入力するか、または現在の余剰在庫（ロス）を活用した新メニューをAIに考案させます。
            </p>
            <div className="flex flex-col md:flex-row gap-4 relative z-10">
              <div className="flex flex-1 gap-4 items-end">
                <div className="flex-1">
                  <input 
                    type="text" 
                    value={aiMenuName} 
                    onChange={e => setAiMenuName(e.target.value)} 
                    className="w-full bg-[#0f172a] border border-blue-500/30 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-blue-400 shadow-inner" 
                    placeholder="例: スパイスカレー、マルゲリータピザ..." 
                    disabled={isGenerating}
                  />
                </div>
                <button 
                  onClick={handleAIGenerate} 
                  disabled={isGenerating || !aiMenuName}
                  className="bg-blue-600 hover:bg-blue-500 disabled:bg-blue-900 disabled:text-blue-400 text-white px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-2 transition-all shadow-lg whitespace-nowrap"
                >
                  {isGenerating && aiMenuName ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                  AIに考えさせる
                </button>
              </div>
              
              <div className="hidden md:block w-px bg-slate-700 mx-2 my-2"></div>
              
              <button 
                onClick={handleGenerateFromLoss} 
                disabled={isGenerating}
                className="bg-purple-600/20 hover:bg-purple-600/40 border border-purple-500/30 disabled:opacity-50 text-purple-300 px-6 py-3 rounded-lg text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg whitespace-nowrap"
              >
                {isGenerating && !aiMenuName ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                ♻️ 余剰在庫から考案
              </button>
            </div>
          </div>

          {/* Manual Menu Add */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-6 shadow-xl">
            <h3 className="text-lg font-semibold mb-4">手動でメニューを追加</h3>
            <div className="flex gap-4 items-end max-w-2xl">
              <div className="flex-1">
                <label className="block text-xs text-slate-400 mb-1">メニュー名</label>
                <input type="text" value={newMenu.name} onChange={e => setNewMenu({...newMenu, name: e.target.value})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="例: 特製バーガー" />
              </div>
              <div className="w-32">
                <label className="block text-xs text-slate-400 mb-1">販売価格 (¥)</label>
                <input type="number" value={newMenu.price || ''} onChange={e => setNewMenu({...newMenu, price: Number(e.target.value)})} className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" placeholder="0" />
              </div>
              <button onClick={handleAddMenu} className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors border border-slate-600">
                <Plus size={16} /> 追加
              </button>
            </div>
          </div>
          
          {/* Menu List */}
          <div className="bg-[#1e293b] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase">
                <tr>
                  <th className="px-6 py-4 font-medium">メニュー名</th>
                  <th className="px-6 py-4 font-medium">販売価格</th>
                  <th className="px-6 py-4 font-medium">1食あたり原価</th>
                  <th className="px-6 py-4 font-medium">限界利益(MQ)</th>
                  <th className="px-6 py-4 font-medium">原価率</th>
                  <th className="px-6 py-4 font-medium w-32">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {menus.map(m => {
                  const cost = calculateCost(m)
                  const mq = m.price - cost
                  const rate = m.price > 0 ? (cost / m.price) * 100 : 0
                  const isExpanded = expandedMenuId === m.id

                  return (
                    <React.Fragment key={m.id}>
                      <tr className={`hover:bg-slate-800/30 transition-colors ${isExpanded ? 'bg-slate-800/50' : ''}`}>
                        <td className="px-6 py-4 font-medium text-slate-200">{m.name}</td>
                        <td className="px-6 py-4 text-blue-400 font-bold">¥{m.price.toLocaleString()}</td>
                        <td className="px-6 py-4 text-red-400">¥{cost.toLocaleString()}</td>
                        <td className="px-6 py-4 text-emerald-400 font-bold">¥{mq.toLocaleString()}</td>
                        <td className="px-6 py-4 text-slate-400">{rate.toFixed(1)}%</td>
                        <td className="px-6 py-4 flex items-center gap-2">
                          <button onClick={() => toggleExpand(m)} className="text-blue-400 hover:text-blue-300 p-1.5 rounded hover:bg-blue-400/10 transition-colors flex items-center gap-1 text-xs font-medium">
                            {isExpanded ? <><ChevronUp size={14}/> 閉じる</> : <><ChevronDown size={14}/> レシピ</>}
                          </button>
                          <button onClick={() => handleDeleteMenu(m.id)} className="text-red-400 hover:text-red-300 p-1.5 rounded hover:bg-red-400/10 transition-colors">
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                      {/* Recipe Editor Accordion */}
                      {isExpanded && (
                        <tr className="bg-[#0f172a]/50">
                          <td colSpan={6} className="px-6 py-6 border-b-2 border-slate-800">
                            <div className="max-w-3xl ml-10">
                              <h4 className="text-sm font-semibold mb-3 flex items-center gap-2 text-slate-300">
                                <Utensils size={16} />
                                レシピ構成（材料と分量）
                              </h4>
                              
                              <div className="space-y-2 mb-4">
                                {editingRecipe.map((recipeItem, idx) => (
                                  <div key={idx} className="flex items-center gap-3">
                                    <div className="flex-1">
                                      <select 
                                        value={recipeItem.ingredientId} 
                                        onChange={(e) => handleRecipeChange(idx, 'ingredientId', e.target.value)}
                                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500"
                                      >
                                        <option value="">材料を選択...</option>
                                        {ingredients.map(ing => (
                                          <option key={ing.id} value={ing.id}>
                                            {ing.name} (¥{ing.cost}/{ing.unit})
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="w-24">
                                      <input 
                                        type="number" 
                                        value={recipeItem.amount || ''} 
                                        onChange={(e) => handleRecipeChange(idx, 'amount', Number(e.target.value))}
                                        className="w-full bg-[#1e293b] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500" 
                                        placeholder="数量" 
                                      />
                                    </div>
                                    <span className="text-slate-500 text-sm w-12">
                                      {ingredients.find(i => i.id === recipeItem.ingredientId)?.unit || '-'}
                                    </span>
                                    <button onClick={() => removeRecipeRow(idx)} className="text-slate-500 hover:text-red-400 p-2">
                                      <Trash2 size={16} />
                                    </button>
                                  </div>
                                ))}
                              </div>
                              
                              <div className="flex items-center gap-3 mt-4">
                                <button onClick={addRecipeRow} className="text-sm text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 bg-blue-500/10 px-3 py-1.5 rounded-lg">
                                  <Plus size={14} /> 材料を追加
                                </button>
                                <button onClick={() => saveRecipe(m.id)} className="text-sm text-white bg-blue-600 hover:bg-blue-500 font-medium flex items-center gap-1 px-4 py-1.5 rounded-lg shadow-lg ml-auto">
                                  <Save size={14} /> レシピを保存
                                </button>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
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
        </div>
      )}
    </div>
  )
}
