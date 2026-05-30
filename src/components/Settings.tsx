import { useState, useEffect } from 'react';
import { KeyRound, Check, AlertCircle } from 'lucide-react';

export function Settings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const savedKey = localStorage.getItem('GEMINI_API_KEY');
    if (savedKey) setApiKey(savedKey);
  }, []);

  const handleSave = () => {
    localStorage.setItem('GEMINI_API_KEY', apiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="max-w-2xl mx-auto animate-in fade-in duration-500">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">設定</h2>
        <p className="text-slate-400 mt-2">アプリケーションの各種設定を行います。</p>
      </header>

      <div className="bg-[#1e293b] rounded-xl border border-slate-800 p-6 shadow-xl">
        <div className="flex items-center gap-3 mb-4">
          <KeyRound className="text-blue-400" />
          <h3 className="text-xl font-semibold">Gemini API設定</h3>
        </div>
        
        <p className="text-sm text-slate-400 mb-6">
          「メニューの自動レシピ考案」機能を利用するためには、Google Gemini APIキーが必要です。<br/>
          入力されたキーはブラウザにのみ保存され、外部のサーバーには送信されません。
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">API Key</label>
            <input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full bg-[#0f172a] border border-slate-700 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-blue-500"
            />
          </div>
          
          <button
            onClick={handleSave}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
          >
            {saved ? <Check size={18} /> : '保存する'}
            {saved && '保存しました'}
          </button>
        </div>

        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-start gap-3 text-blue-200">
          <AlertCircle size={20} className="shrink-0 mt-0.5 text-blue-400" />
          <div className="text-sm">
            <p className="font-semibold mb-1">APIキーの取得方法</p>
            <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">
              Google AI Studio
            </a>
            にアクセスし、Googleアカウントでログインして新しいAPIキーを作成してください。（無料で利用可能です）
          </div>
        </div>
      </div>
    </div>
  );
}
