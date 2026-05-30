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

export async function generateMenuFromLoss(ingredients: Ingredient[], apiKey: string): Promise<GeneratedRecipe | null> {
  if (!apiKey) throw new Error('Gemini API key is required');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  // 材料を渡し、AIに考えさせる
  const ingredientsStr = ingredients.map(i => `${i.name} (在庫: ${i.stock || 0}${i.unit}, 原価: ¥${i.cost})`).join('\n');

  const prompt = `あなたは飲食店のメニュー開発コンサルタントです。
現在、以下の食材が余り気味（在庫過多またはロス予備軍）になっています。
これらの食材のうち、いくつかを効果的に組み合わせて作れる、「原価率が低く、お客様に喜ばれる新メニュー（まかないや日替わりメニュー）」を1つ考案してください。

【余剰食材リスト】
${ingredientsStr}

以下のJSONフォーマットのテキストのみを出力してください（Markdownのバッククォートなどの装飾は一切含めないでください）。
{
  "menuName": "考案した新メニュー名",
  "ingredients": [
    { "name": "材料名(リストにない新規の追加材料があれば記述)", "unit": "単位", "cost": 仕入単価 }
  ],
  "recipe": [
    { "ingredientName": "使用する材料名(リストにあるもの、または上記ingredientsで追加したもの)", "amount": 1食あたりの使用量 }
  ],
  "suggestedPrice": 提案する販売価格(日本円)
}`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    let text = response.text();
    text = text.replace(/```json/g, '').replace(/```/g, '').trim();
    // 既存の GeneratedRecipe 型に合わせるために、パース結果に menuName が含まれているが、
    // 呼び出し側でそれを取り出す必要がある。ここでは ANY を返してキャストする形にするか、
    // 新しい型を返す。簡易的に ANY にキャストしてからオブジェクトを構築する。
    const parsed = JSON.parse(text) as any;
    return {
      ingredients: parsed.ingredients,
      recipe: parsed.recipe,
      suggestedPrice: parsed.suggestedPrice,
      // 便宜上、menuName を連携するためのハック
      ...parsed
    } as GeneratedRecipe & { menuName: string };
  } catch (error) {
    console.error('Failed to generate menu from loss:', error);
    throw error;
  }
}

export async function getLossPreventionAdvice(menuData: CalculatedMenuData[], ingredients: Ingredient[], apiKey: string): Promise<string> {
  if (!apiKey) throw new Error('Gemini API key is required');
  
  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

  const lossMenus = menuData.filter(m => (m.waste || 0) > 0).map(m => ({
    name: m.name,
    wasteQty: m.waste,
    wasteLoss: (m.waste || 0) * m.cost
  }));
  
  const surplusIngredients = ingredients
    .filter(i => (i.stock || 0) > (i.lowStockThreshold || 0))
    .map(i => ({
      name: i.name,
      excessQty: (i.stock || 0) - (i.lowStockThreshold || 0),
      excessValue: ((i.stock || 0) - (i.lowStockThreshold || 0)) * i.cost
    }));

  const prompt = `あなたは優秀な飲食店コンサルタントです。
以下のデータから、飲食店の最大の敵である「食品ロス（廃棄）」と「余剰在庫」を削減するための具体的な改善アドバイスをMarkdown形式で提案してください。

【廃棄が発生しているメニューデータ】
${JSON.stringify(lossMenus, null, 2)}

【適正在庫（発注点）を上回っている余剰在庫データ】
${JSON.stringify(surplusIngredients, null, 2)}

以下の点に触れて、現場のスタッフや店長が明日からすぐ実行できる対策を提示してください：
1. 廃棄が多いメニューへの対策（仕込み量の見直し、受注後調理への変更、提供方法の改善など）
2. 余っている在庫の消化方法（他メニューへの流用、セット化など）
3. 発注業務の改善アドバイス（発注点の見直し、適正発注サイクルの提案）

必ずMarkdown形式（見出しや箇条書きを活用）で出力してください。`;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Failed to generate loss prevention advice:', error);
    throw error;
  }
}
