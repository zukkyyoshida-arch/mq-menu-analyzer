import { useState, useMemo } from 'react'
import { Menu, SalesRecord } from '../types'
import { FileUp, Calendar, Trash2 } from 'lucide-react'
import Papa from 'papaparse'

interface SalesManagerProps {
  menus: Menu[];
  salesRecords: SalesRecord[];
  setSalesRecords: React.Dispatch<React.SetStateAction<SalesRecord[]>>;
}

export function SalesManager({ menus, salesRecords, setSalesRecords }: SalesManagerProps) {
  // 期間（YYYY-MM）のステート。デフォルトは今月。
  const [currentPeriod, setCurrentPeriod] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  })

  // 現在の期間に紐づくレコードだけを抽出
  const currentRecords = useMemo(() => {
    return salesRecords.filter(r => (r.period || '') === currentPeriod)
  }, [salesRecords, currentPeriod])

  const handleUpdateSales = (menuId: string, field: 'quantity' | 'waste', value: number) => {
    const existingIndex = salesRecords.findIndex(r => r.menuId === menuId && (r.period || '') === currentPeriod)
    
    if (existingIndex >= 0) {
      const newRecords = [...salesRecords]
      newRecords[existingIndex] = {
        ...newRecords[existingIndex],
        [field]: value
      }
      setSalesRecords(newRecords)
    } else {
      const newRecord: SalesRecord = {
        menuId,
        quantity: field === 'quantity' ? value : 0,
        waste: field === 'waste' ? value : 0,
        period: currentPeriod
      }
      setSalesRecords([...salesRecords, newRecord])
    }
  }

  const getRecord = (menuId: string) => {
    return currentRecords.find(r => r.menuId === menuId) || { quantity: 0, waste: 0 }
  }

  // CSVインポート処理
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const newRecords = [...salesRecords]
        let importedCount = 0

        results.data.forEach((row: any) => {
          // CSVのカラム名として "メニュー名", "販売数", "廃棄数" を想定
          const menuName = row['メニュー名']
          const qty = Number(row['販売数']) || 0
          const wst = Number(row['廃棄数']) || 0

          const targetMenu = menus.find(m => m.name === menuName)
          if (targetMenu) {
            const existingIndex = newRecords.findIndex(r => r.menuId === targetMenu.id && (r.period || '') === currentPeriod)
            if (existingIndex >= 0) {
              newRecords[existingIndex].quantity = qty
              newRecords[existingIndex].waste = wst
            } else {
              newRecords.push({
                menuId: targetMenu.id,
                quantity: qty,
                waste: wst,
                period: currentPeriod
              })
            }
            importedCount++
          }
        })

        setSalesRecords(newRecords)
        alert(`${importedCount}件のメニューデータをインポートしました！`)
        // inputをリセット
        e.target.value = ''
      },
      error: (error) => {
        alert('CSVの読み込みに失敗しました: ' + error.message)
      }
    })
  }

  return (
    <div className="max-w-5xl mx-auto animate-in fade-in duration-500 pb-20">
      <header className="mb-8 flex items-end justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">販売・ロスデータ入力</h2>
          <p className="text-slate-400 mt-2">メニューごとの販売数と廃棄数（ロス）を入力します。</p>
        </div>
        
        {/* CSV Upload Button */}
        <div>
          <label className="cursor-pointer bg-blue-600/20 text-blue-400 hover:bg-blue-600/30 border border-blue-500/30 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors">
            <FileUp size={16} />
            CSVインポート
            <input type="file" accept=".csv" className="hidden" onChange={handleFileUpload} />
          </label>
        </div>
      </header>

      <div className="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        {/* 期間選択ヘッダー */}
        <div className="p-4 border-b border-slate-800 bg-slate-900/50 flex items-center gap-4">
          <Calendar className="text-slate-400" size={20} />
          <span className="text-sm font-medium text-slate-300">対象期間:</span>
          <input 
            type="month" 
            value={currentPeriod}
            onChange={(e) => setCurrentPeriod(e.target.value)}
            className="bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 text-slate-200"
          />
        </div>

        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">メニュー名</th>
              <th className="px-6 py-4 font-medium">販売価格</th>
              <th className="px-6 py-4 font-medium w-48 text-blue-300">販売数 (売上)</th>
              <th className="px-6 py-4 font-medium w-48 text-red-300 flex items-center gap-1">
                <Trash2 size={14} /> 廃棄数 (ロス)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {menus.map(menu => {
              const record = getRecord(menu.id)
              return (
                <tr key={menu.id} className="hover:bg-slate-800/50 transition-colors">
                  <td className="px-6 py-4 font-medium text-slate-200">{menu.name}</td>
                  <td className="px-6 py-4 text-slate-400">¥{menu.price.toLocaleString()}</td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      min="0"
                      value={record.quantity || ''}
                      onChange={(e) => handleUpdateSales(menu.id, 'quantity', Number(e.target.value) || 0)}
                      className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-right"
                      placeholder="0"
                    />
                  </td>
                  <td className="px-6 py-3">
                    <input
                      type="number"
                      min="0"
                      value={record.waste || ''}
                      onChange={(e) => handleUpdateSales(menu.id, 'waste', Number(e.target.value) || 0)}
                      className="w-full bg-red-950/20 border border-red-900/30 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-red-500 text-right text-red-200"
                      placeholder="0"
                    />
                  </td>
                </tr>
              )
            })}
            {menus.length === 0 && (
              <tr>
                <td colSpan={4} className="px-6 py-8 text-center text-slate-500">メニューが登録されていません。<br/>先にメニュー管理からメニューを登録してください。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 text-xs text-slate-500">
        ※CSVインポート時のフォーマット: 1行目に「メニュー名」「販売数」「廃棄数」というヘッダーを付けてください。
      </div>
    </div>
  )
}
