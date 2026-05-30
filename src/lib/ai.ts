import { GoogleGenerativeAI } from '@google/generative-ai';
import type { Ingredient, CalculatedMenuData } from '../types';

export interface GeneratedRecipe {
  ingredients: Omit<Ingredient, 'id'>[];
  recipe: { ingredientName: string; amount: number }[];
  suggestedPrice: number;
}

export async function generateRecipeWithAI(menuName: string, apiKey: string): Promise<GeneratedRecipe | null> {
  if (!apiKey) throw new Error('Gemini API key is required');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const prompt = `あなたは飲食店の原価計算コンサルタントです。
指定されたメニューを作るための一般的な材料構成、仕入原価の目安、1食あたりの使用量、および適切な販売価格を考えてください。

メニュー名: ${menuName}

以下のJSONフォーマットのテキストのみを出力してください（Markdownのバッククォートなどの装飾は一切含めないでください）。
{
  "ingredients": [
    { "name": "材料名", "unit": "単位(g, 個, 枚など)", "cost": 仕入単価の目安(日本円の数値) }
  ],
  "recipe": [
    { "ingredientName": "材料名(上のingredientsのnameと完全に一致させること)", "amount": 1食あたりの使用量(数値) }
  ],
  "suggestedPrice": 提案する販売価格(日本円の数値)
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text) as GeneratedRecipe;
  } catch (error) {
    console.error('Failed to generate recipe with AI:', error);
    throw error;
  }
}

export async function getBusinessAdvice(menuData: CalculatedMenuData[], apiKey: string): Promise<string> {
  if (!apiKey) throw new Error('Gemini API key is required');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const dataStr = JSON.stringify(menuData, null, 2);

  const prompt = `あなたは優秀な飲食店経営コンサルタントです。
以下のメニュー別の販売データ（売上、原価、限界利益(mq)、販売数、廃棄数）を分析し、
利益を最大化するための具体的な改善アドバイスをMarkdown形式で提案してください。

データ:
${dataStr}

特に以下の点に触れてください：
1. 全体のPPM分析（花形・金のなる木・問題児・負け犬）からの洞察
2. 「問題児（売れるが利益率が低い）」の価格改定やレシピ見直し案
3. 「ロス（廃棄）」が多いメニューへの対策
4. 全体的な利益率向上のための次の一手（What-Ifシミュレーションの提案など）

出力は必ずMarkdown形式（見出しや箇条書きを活用）で、経営者がすぐに実行できる具体的なアクションプランを提示してください。`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Failed to generate business advice:', error);
    throw error;
  }
}
