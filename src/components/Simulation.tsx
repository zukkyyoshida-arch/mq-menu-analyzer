import { useState, useMemo } from 'react'
import type { CalculatedMenuData } from '../types'
import { ArrowRight, Calculator } from 'lucide-react'

interface SimulationProps {
  data: CalculatedMenuData[];
}

export function Simulation({ data }: SimulationProps) {
  // 各メニューのシミュレーション用の変動値 (パーセンテージ: -100 〜 +100 など)
  const [changes, setChanges] = useState<Record<string, { price: number, sales: number, cost: number }>>({})

  // 変動値の取得ヘルパー
  const getChange = (id: string, field: 'price' | 'sales' | 'cost') => {
    return changes[id]?.[field] || 0
  }

  // 変動値の更新ヘルパー
  const updateChange = (id: string, field: 'price' | 'sales' | 'cost', value: number) => {
    setChanges(prev => ({
      ...prev,
      [id]: {
        ...(prev[id] || { price: 0, sales: 0, cost: 0 }),
        [field]: value
      }
    }))
  }

  // 現状とシミュレーション後の集計データを計算
  const { current, simulated } = useMemo(() => {
    let curSales = 0, curCost = 0, curMQ = 0
    let simSales = 0, simCost = 0, simMQ = 0

    data.forEach(item => {
      // 現状
      const cSalesAmt = item.price * item.sales
      const cCostAmt = item.cost * item.sales
      const cMQAmt = item.mq * item.sales
      curSales += cSalesAmt
      curCost += cCostAmt
      curMQ += cMQAmt

      // シミュレーション後
      const pPrice = item.price * (1 + getChange(item.id, 'price') / 100)
      const pCost = item.cost * (1 + getChange(item.id, 'cost') / 100)
      const pSalesCount = item.sales * (1 + getChange(item.id, 'sales') / 100)

      simSales += pPrice * pSalesCount
      simCost += pCost * pSalesCount
      simMQ += (pPrice - pCost) * pSalesCount
    })

    const curCostRate = curSales > 0 ? (curCost / curSales) * 100 : 0
    const simCostRate = simSales > 0 ? (simCost / simSales) * 100 : 0

    return {
      current: { sales: curSales, cost: curCost, mq: curMQ, rate: curCostRate },
      simulated: { sales: simSales, cost: simCost, mq: simMQ, rate: simCostRate }
    }
  }, [data, changes])

  return (
    <div className="max-w-6xl mx-auto animate-in fade-in duration-500 pb-20">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">What-If シミュレーション</h2>
        <p className="text-slate-400 mt-2">
          価格改定や材料費の変動、販売数の増減が全体の利益にどう影響するかをシミュレーションします。
        </p>
      </header>

      {/* Summary Comparison */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-lg">
          <h3 className="text-slate-400 text-sm font-medium mb-4">現状 (Current)</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-slate-500">総限界利益 (MQ)</p>
              <p className="text-2xl font-bold text-slate-200">¥{Math.round(current.mq).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-slate-500">原価率</p>
              <p className="text-2xl font-bold text-slate-200">{current.rate.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <div className="bg-blue-900/10 border border-blue-500/30 rounded-xl p-6 shadow-lg relative overflow-hidden">
          <div className="absolute top-1/2 left-0 -translate-x-1/2 -translate-y-1/2 p-2 bg-[#0f172a] rounded-full border border-slate-700 md:block hidden">
            <ArrowRight size={20} className="text-blue-400" />
          </div>
          <h3 className="text-blue-400 text-sm font-medium mb-4 flex items-center gap-2">
            <Calculator size={16} /> 予測 (Simulated)
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-blue-300/70">予測限界利益</p>
              <p className={`text-2xl font-bold ${simulated.mq >= current.mq ? 'text-emerald-400' : 'text-red-400'}`}>
                ¥{Math.round(simulated.mq).toLocaleString()}
                <span className="text-sm ml-2 font-medium">
                  ({simulated.mq >= current.mq ? '+' : ''}{Math.round(simulated.mq - current.mq).toLocaleString()})
                </span>
              </p>
            </div>
            <div>
              <p className="text-xs text-blue-300/70">予測原価率</p>
              <p className={`text-2xl font-bold ${simulated.rate <= current.rate ? 'text-emerald-400' : 'text-red-400'}`}>
                {simulated.rate.toFixed(1)}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Editor Table */}
      <div className="bg-[#1e293b] rounded-xl border border-slate-800 shadow-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-900/80 text-slate-400 text-xs uppercase">
            <tr>
              <th className="px-6 py-4 font-medium">メニュー名</th>
              <th className="px-6 py-4 font-medium w-48 text-emerald-300">販売価格の変動 (%)</th>
              <th className="px-6 py-4 font-medium w-48 text-blue-300">販売数の変動 (%)</th>
              <th className="px-6 py-4 font-medium w-48 text-red-300">原価の変動 (%)</th>
              <th className="px-6 py-4 font-medium w-32">予測利益/食</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800">
            {data.map(item => {
              const pChange = getChange(item.id, 'price')
              const sChange = getChange(item.id, 'sales')
              const cChange = getChange(item.id, 'cost')
              
              const newPrice = item.price * (1 + pChange / 100)
              const newCost = item.cost * (1 + cChange / 100)
              const newMQ = newPrice - newCost

              return (
                <tr key={item.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="font-medium text-slate-200">{item.name}</div>
                    <div className="text-xs text-slate-500">現状MQ: ¥{Math.round(item.mq)}</div>
                  </td>
                  <td className="px-6 py-4">
                    <input type="range" min="-50" max="100" step="5" value={pChange} onChange={e => updateChange(item.id, 'price', Number(e.target.value))} className="w-full accent-emerald-500" />
                    <div className="text-center text-xs text-emerald-400 font-medium mt-1">{pChange > 0 ? '+' : ''}{pChange}% (¥{Math.round(newPrice)})</div>
                  </td>
                  <td className="px-6 py-4">
                    <input type="range" min="-100" max="200" step="5" value={sChange} onChange={e => updateChange(item.id, 'sales', Number(e.target.value))} className="w-full accent-blue-500" />
                    <div className="text-center text-xs text-blue-400 font-medium mt-1">{sChange > 0 ? '+' : ''}{sChange}%</div>
                  </td>
                  <td className="px-6 py-4">
                    <input type="range" min="-50" max="100" step="5" value={cChange} onChange={e => updateChange(item.id, 'cost', Number(e.target.value))} className="w-full accent-red-500" />
                    <div className="text-center text-xs text-red-400 font-medium mt-1">{cChange > 0 ? '+' : ''}{cChange}% (¥{Math.round(newCost)})</div>
                  </td>
                  <td className="px-6 py-4 font-bold text-slate-200">
                    ¥{Math.round(newMQ)}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
