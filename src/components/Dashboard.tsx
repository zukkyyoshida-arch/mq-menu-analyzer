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
import { CalculatedMenuData } from '../types'
import { Sparkles, Loader2, BotMessageSquare } from 'lucide-react'
import { getBusinessAdvice } from '../lib/ai'

interface DashboardProps {
  data: CalculatedMenuData[];
}

export function Dashboard({ data }: DashboardProps) {
  const [advice, setAdvice] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)

  // 廃棄数も考慮したコスト計算（原価×販売数 ＋ 原価×廃棄数）
  const totalSales = data.reduce((sum, item) => sum + (item.price * item.sales), 0)
  const totalCost = data.reduce((sum, item) => sum + (item.cost * (item.sales + (item.waste || 0))), 0)
  const totalWasteLoss = data.reduce((sum, item) => sum + (item.cost * (item.waste || 0)), 0)
  const totalMQ = totalSales - totalCost // 実質MQ
  const costRate = totalSales > 0 ? (totalCost / totalSales) * 100 : 0

  const avgSales = data.length > 0 ? data.reduce((sum, item) => sum + item.sales, 0) / data.length : 0
  const avgMQ = data.length > 0 ? data.reduce((sum, item) => sum + item.mq, 0) / data.length : 0

  const handleGetAdvice = async () => {
    const apiKey = localStorage.getItem('GEMINI_API_KEY')
    if (!apiKey) {
      alert('「設定」画面からGemini APIキーを登録してください。')
      return
    }

    setIsGenerating(true)
    try {
      const result = await getBusinessAdvice(data, apiKey)
      setAdvice(result)
    } catch (err) {
      alert('アドバイスの生成に失敗しました。APIキーが正しいか確認してください。')
    } finally {
      setIsGenerating(false)
    }
  }

  // 簡単なMarkdown風の装飾
  const renderAdvice = (text: string) => {
    return text.split('\n').map((line, i) => {
      if (line.startsWith('### ')) return <h4 key={i} className="text-lg font-bold mt-4 mb-2 text-blue-300">{line.replace('### ', '')}</h4>
      if (line.startsWith('## ')) return <h3 key={i} className="text-xl font-bold mt-6 mb-3 text-blue-400 border-b border-blue-500/30 pb-2">{line.replace('## ', '')}</h3>
      if (line.startsWith('# ')) return <h2 key={i} className="text-2xl font-bold mt-6 mb-4 text-blue-400">{line.replace('# ', '')}</h2>
      if (line.startsWith('- ') || line.startsWith('* ')) return <li key={i} className="ml-4 mb-1 text-slate-300">{line.replace(/^[-*]\s/, '')}</li>
      if (line.trim() === '') return <div key={i} className="h-2"></div>
      return <p key={i} className="mb-2 text-slate-300 leading-relaxed">{line.replace(/\*\*/g, '')}</p>
    })
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      <header className="flex justify-between items-end">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">MQ分析ダッシュボード</h2>
          <p className="text-slate-400 mt-2">商品の「売れ筋」と「儲かり筋」を可視化し、次の打ち手を導き出します。</p>
        </div>
        <button 
          onClick={handleGetAdvice}
          disabled={isGenerating || data.length === 0}
          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white px-6 py-3 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20"
        >
          {isGenerating ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
          {isGenerating ? 'AIが分析中...' : 'AI経営コンサルに診断してもらう'}
        </button>
      </header>

      {/* AI Advice Area */}
      {advice && (
        <div className="bg-gradient-to-br from-[#1e293b] to-blue-900/20 rounded-xl p-8 border border-blue-500/30 shadow-2xl relative overflow-hidden animate-in slide-in-from-top-4 duration-500">
          <div className="absolute top-0 right-0 p-6 opacity-5">
            <BotMessageSquare size={120} />
          </div>
          <div className="flex items-center gap-3 mb-6 relative z-10">
            <div className="p-3 bg-blue-500/20 rounded-lg">
              <Sparkles className="text-blue-400" size={24} />
            </div>
            <h3 className="text-2xl font-bold text-slate-100">AI 経営改善アドバイス</h3>
          </div>
          <div className="relative z-10 text-sm">
            {renderAdvice(advice)}
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <SummaryCard title="総売上" value={`¥${totalSales.toLocaleString()}`} />
        <SummaryCard title="総原価 (ロス含)" value={`¥${totalCost.toLocaleString()}`} />
        <SummaryCard title="廃棄ロス損失" value={`¥${totalWasteLoss.toLocaleString()}`} warning={totalWasteLoss > 0} />
        <SummaryCard title="実質限界利益" value={`¥${totalMQ.toLocaleString()}`} highlight />
        <SummaryCard title="実質原価率" value={`${costRate.toFixed(1)}%`} />
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

function SummaryCard({ title, value, highlight = false, warning = false }: { title: string, value: string, highlight?: boolean, warning?: boolean }) {
  let bgClass = 'bg-[#1e293b] border-slate-800'
  let textClass = 'text-slate-50'
  
  if (highlight) {
    bgClass = 'bg-blue-900/20 border-blue-500/30 shadow-[0_0_15px_rgba(59,130,246,0.1)]'
    textClass = 'text-blue-400'
  } else if (warning) {
    bgClass = 'bg-red-900/20 border-red-500/30'
    textClass = 'text-red-400'
  }

  return (
    <div className={`p-5 rounded-xl border transition-all duration-300 hover:-translate-y-1 ${bgClass}`}>
      <h3 className="text-xs font-medium text-slate-400 mb-2">{title}</h3>
      <p className={`text-2xl font-bold tracking-tight ${textClass}`}>{value}</p>
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
