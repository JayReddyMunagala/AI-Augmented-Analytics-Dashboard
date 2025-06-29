import { useState } from 'react';
import { SalesData } from '../types/dashboard';

// OpenAI API configuration
const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

interface OpenAIResponse {
  insights: string;
  summary: string;
  recommendations: string[];
}

export const useOpenAI = () => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateInsights = async (data: SalesData[], filters: any): Promise<OpenAIResponse | null> => {
    if (!OPENAI_API_KEY) {
      setError('OpenAI API key not configured. Please add VITE_OPENAI_API_KEY to your environment variables.');
      return null;
    }

    setIsGenerating(true);
    setError(null);

    try {
      // Prepare data summary for OpenAI
      const totalSales = data.reduce((sum, item) => sum + item.sales, 0);
      const uniqueRegions = [...new Set(data.map(item => item.region))];
      const uniqueProducts = [...new Set(data.map(item => item.product))];
      
      // Calculate trends
      const sortedData = data.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      const firstHalf = sortedData.slice(0, Math.floor(sortedData.length / 2));
      const secondHalf = sortedData.slice(Math.floor(sortedData.length / 2));
      
      const firstHalfTotal = firstHalf.reduce((sum, item) => sum + item.sales, 0);
      const secondHalfTotal = secondHalf.reduce((sum, item) => sum + item.sales, 0);
      const growthRate = ((secondHalfTotal - firstHalfTotal) / firstHalfTotal * 100).toFixed(1);

      // Regional performance
      const regionPerformance = uniqueRegions.map(region => {
        const regionData = data.filter(item => item.region === region);
        const regionTotal = regionData.reduce((sum, item) => sum + item.sales, 0);
        return { region, total: regionTotal, percentage: ((regionTotal / totalSales) * 100).toFixed(1) };
      }).sort((a, b) => b.total - a.total);

      // Product performance
      const productPerformance = uniqueProducts.map(product => {
        const productData = data.filter(item => item.product === product);
        const productTotal = productData.reduce((sum, item) => sum + item.sales, 0);
        return { product, total: productTotal, percentage: ((productTotal / totalSales) * 100).toFixed(1) };
      }).sort((a, b) => b.total - a.total);

      const prompt = `
Analyze this business dataset and provide insights:

DATASET OVERVIEW:
- Total Records: ${data.length.toLocaleString()}
- Total Sales: $${totalSales.toLocaleString()}
- Date Range: ${sortedData[0]?.date} to ${sortedData[sortedData.length - 1]?.date}
- Growth Rate: ${growthRate}% (period-over-period)

REGIONAL PERFORMANCE:
${regionPerformance.map(r => `- ${r.region}: $${r.total.toLocaleString()} (${r.percentage}%)`).join('\n')}

PRODUCT PERFORMANCE:
${productPerformance.map(p => `- ${p.product}: $${p.total.toLocaleString()} (${p.percentage}%)`).join('\n')}

APPLIED FILTERS:
- Date Range: ${filters.dateRange?.start?.toLocaleDateString()} to ${filters.dateRange?.end?.toLocaleDateString()}
- Regions: ${filters.regions?.length ? filters.regions.join(', ') : 'All'}
- Products: ${filters.products?.length ? filters.products.join(', ') : 'All'}
- Categories: ${filters.categories?.length ? filters.categories.join(', ') : 'All'}

Please provide:
1. A concise executive summary (2-3 sentences)
2. 3-5 key insights with specific metrics
3. 2-3 actionable recommendations

Format as JSON with this structure:
{
  "summary": "Executive summary here",
  "insights": "Detailed insights with metrics",
  "recommendations": ["recommendation 1", "recommendation 2", "recommendation 3"]
}
`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: 'You are a senior business analyst with expertise in sales data analysis. Provide clear, actionable insights with specific metrics and percentages. Always include dollar amounts and growth rates where relevant.'
            },
            {
              role: 'user',
              content: prompt
            }
          ],
          max_tokens: 1000,
          temperature: 0.3,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to generate insights');
      }

      const responseData = await response.json();
      const content = responseData.choices[0].message.content;
      
      try {
        const parsedContent = JSON.parse(content);
        return parsedContent;
      } catch (parseError) {
        // Fallback if JSON parsing fails
        return {
          summary: content.substring(0, 200) + '...',
          insights: content,
          recommendations: ['Review the generated insights for actionable recommendations']
        };
      }

    } catch (error) {
      console.error('OpenAI API Error:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate insights');
      return null;
    } finally {
      setIsGenerating(false);
    }
  };

  return {
    generateInsights,
    isGenerating,
    error,
  };
};