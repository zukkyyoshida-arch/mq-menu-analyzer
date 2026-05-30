import { Menu, SalesRecord } from '../types'

interface SalesManagerProps {
  menus: Menu[];
  salesRecords: SalesRecord[];
  setSalesRecords: React.Dispatch<React.SetStateAction<SalesRecord[]>>;
}

export function SalesManager({ menus, salesRecords, setSalesRecords }: SalesManagerProps) {

  const handleUpdateSales = (menuId: string, quantity: number) => {
    const existingIndex = salesRecords.findIndex(r => r.menuId === menuId)
    if (existingIndex >= 0) {
      const newRecords = [...salesRecords]
      newRecords[existingIndex].quantity = quantity
      setSalesRecords(newRecords)
    } else {
      setSalesRecords([...salesRecords, { menuId, quantity }])
    }
  }

  const getSalesCount = (menuId: string) => {
    return salesRecords.find(r => r.menuId === menuId)?.quantity || 0
  }

  return (
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">販売データ入力</h2>
        <p className="text-slate-400 mt-2">分析したい期間（1ヶ月間など）のメニューごとの販売数を入力してください。</p>
      </header>

      <div className="bg-[#1e293b] rounded-xl border border-slate-800 overflow-hidden shadow-xl">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">メニュー名</th>
              <th className="px-6 py-4 font-medium">販売価格</th>
              <th className="px-6 py-4 font-medium w-48">販売数</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {menus.map(menu => (
              <tr key={menu.id} className="hover:bg-slate-800/50 transition-colors">
                <td className="px-6 py-4 font-medium text-slate-200">{menu.name}</td>
                <td className="px-6 py-4 text-slate-400">¥{menu.price.toLocaleString()}</td>
                <td className="px-6 py-3">
                  <input
                    type="number"
                    min="0"
                    value={getSalesCount(menu.id) || ''}
                    onChange={(e) => handleUpdateSales(menu.id, Number(e.target.value) || 0)}
                    className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-blue-500 text-right"
                    placeholder="0"
                  />
                </td>
              </tr>
            ))}
            {menus.length === 0 && (
              <tr>
                <td colSpan={3} className="px-6 py-8 text-center text-slate-500">メニューが登録されていません。<br/>先にメニュー管理からメニューを登録してください。</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
