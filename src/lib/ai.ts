import { GoogleGenerativeAI } from '@google/generative-ai';
import { Ingredient } from '../types';

export interface GeneratedRecipe {
  ingredients: Omit<Ingredient, 'id'>[];
  recipe: { ingredientName: string; amount: number }[];
  suggestedPrice: number;
}

export async function generateRecipeWithAI(menuName: string, apiKey: string): Promise<GeneratedRecipe | null> {
  if (!apiKey) throw new Error('Gemini API key is required');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  // 高速なレスポンスが可能な gemini-1.5-flash を利用
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
    // マークダウンの ```json などが含まれていた場合に除去
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    return JSON.parse(text) as GeneratedRecipe;
  } catch (error) {
    console.error('Failed to generate recipe with AI:', error);
    throw error;
  }
}
