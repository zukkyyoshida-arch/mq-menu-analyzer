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
import { CalculatedMenuData } from '../types'

interface DashboardProps {
  data: CalculatedMenuData[];
}

export function Dashboard({ data }: DashboardProps) {
  const totalSales = data.reduce((sum, item) => sum + (item.price * item.sales), 0)
  const totalCost = data.reduce((sum, item) => sum + (item.cost * item.sales), 0)
  const totalMQ = data.reduce((sum, item) => sum + (item.mq * item.sales), 0)
  const costRate = totalSales > 0 ? (totalCost / totalSales) * 100 : 0

  const avgSales = data.length > 0 ? data.reduce((sum, item) => sum + item.sales, 0) / data.length : 0
  const avgMQ = data.length > 0 ? data.reduce((sum, item) => sum + item.mq, 0) / data.length : 0

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <header>
        <h2 className="text-3xl font-bold tracking-tight">MQ分析ダッシュボード</h2>
        <p className="text-slate-400 mt-2">各商品の「売れ筋」と「儲かり筋」を可視化し、次の打ち手を導き出します。</p>
      </header>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <SummaryCard title="総売上" value={`¥${totalSales.toLocaleString()}`} />
        <SummaryCard title="総原価" value={`¥${totalCost.toLocaleString()}`} />
        <SummaryCard title="総限界利益 (MQ)" value={`¥${totalMQ.toLocaleString()}`} highlight />
        <SummaryCard title="全体原価率" value={`${costRate.toFixed(1)}%`} />
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
                formatter={(value: any, name: string) => [value, name === 'sales' ? '販売数' : name === 'mq' ? '限界利益(¥)' : value]}
              />
              <ReferenceLine x={avgSales} stroke="#64748b" strokeDasharray="3 3" label={{ position: 'top', value: '平均販売数', fill: '#64748b', fontSize: 12 }} />
              <ReferenceLine y={avgMQ} stroke="#64748b" strokeDasharray="3 3" label={{ position: 'right', value: '平均利益', fill: '#64748b', fontSize: 12 }} />
              <Scatter name="Menus" data={data} fill="#3b82f6" />
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
