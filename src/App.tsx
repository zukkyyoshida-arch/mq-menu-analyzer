import { useState } from 'react'
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ScatterChart,
  Scatter,
  ZAxis,
  ReferenceLine
} from 'recharts'
import { LayoutDashboard, Utensils, ReceiptText, Settings, TrendingUp } from 'lucide-react'

const mockMenuData = [
  { id: 1, name: '特製ハンバーガー', sales: 450, mq: 350, cost: 450, price: 800 },
  { id: 2, name: 'チーズバーガー', sales: 600, mq: 250, cost: 500, price: 750 },
  { id: 3, name: 'フライドポテト', sales: 800, mq: 280, cost: 70, price: 350 },
  { id: 4, name: 'クラフトコーラ', sales: 300, mq: 400, cost: 100, price: 500 },
  { id: 5, name: 'オニオンリング', sales: 150, mq: 150, cost: 150, price: 300 },
  { id: 6, name: '期間限定シェイク', sales: 250, mq: 450, cost: 200, price: 650 },
]

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard')

  // 平均値の計算（4象限の基準線用）
  const avgSales = mockMenuData.reduce((sum, item) => sum + item.sales, 0) / mockMenuData.length
  const avgMQ = mockMenuData.reduce((sum, item) => sum + item.mq, 0) / mockMenuData.length

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-[#1e293b] border-r border-slate-800 flex flex-col">
        <div className="p-6">
          <h1 className="text-xl font-bold flex items-center gap-2 text-blue-400">
            <TrendingUp />
            MQ Analyzer
          </h1>
        </div>
        <nav className="flex-1 px-4 space-y-2">
          <NavItem icon={<LayoutDashboard size={20} />} label="ダッシュボード" active={activeTab === 'dashboard'} onClick={() => setActiveTab('dashboard')} />
          <NavItem icon={<Utensils size={20} />} label="メニュー管理" active={activeTab === 'menu'} onClick={() => setActiveTab('menu')} />
          <NavItem icon={<ReceiptText size={20} />} label="販売データ入力" active={activeTab === 'sales'} onClick={() => setActiveTab('sales')} />
        </nav>
        <div className="p-4 border-t border-slate-800">
          <NavItem icon={<Settings size={20} />} label="設定" active={false} onClick={() => {}} />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto p-8">
        {activeTab === 'dashboard' && (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
            <header>
              <h2 className="text-3xl font-bold tracking-tight">MQ分析ダッシュボード</h2>
              <p className="text-slate-400 mt-2">各商品の「売れ筋」と「儲かり筋」を可視化し、次の打ち手を導き出します。</p>
            </header>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <SummaryCard title="総売上" value="¥1,450,000" />
              <SummaryCard title="総原価" value="¥580,000" />
              <SummaryCard title="総限界利益 (MQ)" value="¥870,000" highlight />
              <SummaryCard title="全体原価率" value="40.0%" />
            </div>

            {/* Matrix Analysis */}
            <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 shadow-xl">
              <div className="mb-6">
                <h3 className="text-xl font-semibold mb-1">メニュー別ポートフォリオ (PPM分析)</h3>
                <p className="text-sm text-slate-400">縦軸: 限界利益(MQ) / 横軸: 販売数量。円の大きさは売上規模を示します。</p>
              </div>
              <div className="h-[500px] w-full bg-[#0f172a]/50 rounded-lg p-4">
                <ResponsiveContainer width="100%" height="100%">
                  <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                    <XAxis type="number" dataKey="sales" name="販売数" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                    <YAxis type="number" dataKey="mq" name="限界利益" stroke="#94a3b8" tick={{ fill: '#94a3b8' }} />
                    <ZAxis type="number" dataKey="price" range={[100, 500]} name="価格" />
                    <Tooltip
                      cursor={{ strokeDasharray: '3 3' }}
                      contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                      itemStyle={{ color: '#f8fafc' }}
                    />
                    <ReferenceLine x={avgSales} stroke="#64748b" strokeDasharray="3 3" label={{ position: 'top', value: '平均販売数', fill: '#64748b', fontSize: 12 }} />
                    <ReferenceLine y={avgMQ} stroke="#64748b" strokeDasharray="3 3" label={{ position: 'right', value: '平均利益', fill: '#64748b', fontSize: 12 }} />
                    <Scatter name="Menus" data={mockMenuData} fill="#3b82f6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
              
              {/* Quadrant Explanation */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                <QuadrantLegend title="花形 (右上)" desc="よく売れて利益も高い主力商品" color="bg-blue-500/10 text-blue-400 border-blue-500/20" />
                <QuadrantLegend title="金のなる木 (左上)" desc="数は出ないが利益率が高い商品" color="bg-emerald-500/10 text-emerald-400 border-emerald-500/20" />
                <QuadrantLegend title="問題児 (右下)" desc="よく売れるが利益が少ない商品" color="bg-amber-500/10 text-amber-400 border-amber-500/20" />
                <QuadrantLegend title="負け犬 (左下)" desc="売れず利益も出ない商品" color="bg-red-500/10 text-red-400 border-red-500/20" />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'menu' && (
          <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold mb-6">メニュー・原価管理</h2>
            <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 text-center py-20 text-slate-400">
              <Utensils className="mx-auto mb-4 opacity-50" size={48} />
              <p>メニューごとの材料・レシピ登録機能は今後実装予定です。</p>
            </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <div className="max-w-6xl mx-auto animate-in fade-in duration-500">
            <h2 className="text-3xl font-bold mb-6">販売データ入力</h2>
            <div className="bg-[#1e293b] rounded-xl p-6 border border-slate-800 text-center py-20 text-slate-400">
              <ReceiptText className="mx-auto mb-4 opacity-50" size={48} />
              <p>日々の販売数入力機能は今後実装予定です。</p>
            </div>
          </div>
        )}
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
          ? 'bg-blue-600/20 text-blue-400 shadow-[inset_4px_0_0_0_rgba(59,130,246,1)]' 
          : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200'
      }`}
    >
      {icon}
      <span className="font-medium text-sm">{label}</span>
    </button>
  )
}

function SummaryCard({ title, value, highlight = false }: { title: string, value: string, highlight?: boolean }) {
  return (
    <div className={`p-6 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${highlight ? 'bg-blue-900/20 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]' : 'bg-[#1e293b] border-slate-800'}`}>
      <h3 className="text-sm font-medium text-slate-400 mb-2">{title}</h3>
      <p className={`text-3xl font-bold tracking-tight ${highlight ? 'text-blue-400' : 'text-slate-50'}`}>{value}</p>
    </div>
  )
}

function QuadrantLegend({ title, desc, color }: { title: string, desc: string, color: string }) {
  return (
    <div className={`p-4 rounded-lg border ${color}`}>
      <h4 className="font-bold mb-1 text-sm">{title}</h4>
      <p className="text-xs opacity-80 leading-relaxed">{desc}</p>
    </div>
  )
}
