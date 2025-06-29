import { SalesData, MetricCard, AIInsight } from '../types/dashboard';
import { format, subDays, subMonths } from 'date-fns';

const regions = ['North America', 'Europe', 'Asia Pacific', 'Latin America'];
const products = ['Product A', 'Product B', 'Product C', 'Product D', 'Product E'];
const categories = ['Electronics', 'Software', 'Services', 'Hardware'];

// Generate mock sales data
export const generateSalesData = (): SalesData[] => {
  const data: SalesData[] = [];
  const startDate = subMonths(new Date(), 6);
  
  for (let i = 0; i < 180; i++) {
    const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
    
    regions.forEach(region => {
      products.forEach(product => {
        const baseValue = Math.random() * 10000 + 5000;
        const seasonality = Math.sin((i / 30) * Math.PI) * 2000;
        const regionMultiplier = region === 'North America' ? 1.3 : region === 'Europe' ? 1.1 : region === 'Asia Pacific' ? 0.9 : 0.7;
        
        data.push({
          date,
          sales: Math.round((baseValue + seasonality) * regionMultiplier),
          region,
          product,
          category: categories[Math.floor(Math.random() * categories.length)],
        });
      });
    });
  }
  
  return data.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
};

export const mockSalesData = generateSalesData();

export const metricCards: MetricCard[] = [
  {
    title: 'Total Revenue',
    value: '$2.4M',
    change: 12.5,
    changeType: 'positive',
    icon: 'DollarSign',
  },
  {
    title: 'Active Customers',
    value: '15,234',
    change: 8.2,
    changeType: 'positive',
    icon: 'Users',
  },
  {
    title: 'Conversion Rate',
    value: '3.4%',
    change: -2.1,
    changeType: 'negative',
    icon: 'TrendingUp',
  },
  {
    title: 'Avg Order Value',
    value: '$158',
    change: 5.7,
    changeType: 'positive',
    icon: 'ShoppingCart',
  },
];

export const aiInsights: AIInsight[] = [
  {
    id: '1',
    title: 'Strong Q4 Performance in North America',
    summary: 'North American sales increased by 23% in Q4, primarily driven by Product A which saw a 45% uptick in the Electronics category. The holiday season and new product launch contributed significantly to this growth.',
    confidence: 94,
    type: 'trend',
    timestamp: '2 hours ago',
  },
  {
    id: '2',
    title: 'Conversion Rate Decline Detected',
    summary: 'Conversion rates have dropped 15% over the past 3 weeks across all regions. This coincides with the website redesign launch. Consider A/B testing the checkout process to identify friction points.',
    confidence: 87,
    type: 'warning',
    timestamp: '4 hours ago',
  },
  {
    id: '3',
    title: 'Emerging Opportunity in Asia Pacific',
    summary: 'Asia Pacific shows 31% month-over-month growth in the Services category. Market research indicates high demand for cloud solutions in this region. Recommend increasing marketing spend by 25%.',
    confidence: 91,
    type: 'opportunity',
    timestamp: '6 hours ago',
  },
  {
    id: '4',
    title: 'Unusual Sales Pattern in Europe',
    summary: 'European sales data shows irregular spikes every Tuesday for the past month. Investigation reveals correlation with competitor price changes. Automated pricing adjustments may be beneficial.',
    confidence: 78,
    type: 'anomaly',
    timestamp: '1 day ago',
  },
];