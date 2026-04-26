import React, { useEffect, useState, useContext } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line
} from 'recharts';
import { ArrowUp, ArrowDown, Download, Award } from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#ffc658'];

const Analytics = () => {
  const { user } = useContext(AuthContext);
  const [monthlyData, setMonthlyData] = useState([]);
  const [categoryData, setCategoryData] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const [monthlyRes, categoryRes, txRes] = await Promise.all([
          axios.get('/api/analytics/monthly'),
          axios.get('/api/analytics/category?type=expense'),
          axios.get('/api/transactions')
        ]);
        
        // Format month data
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const formattedMonthly = monthlyRes.data.data.map(item => ({
          name: months[item.month - 1],
          Income: item.income,
          Expense: item.expense
        }));
        
        setMonthlyData(formattedMonthly);
        
        // Format category data
        const formattedCategory = categoryRes.data.data.map(item => ({
          name: item._id,
          value: item.totalAmount
        }));
        
        
        setCategoryData(formattedCategory);
        setTransactions(txRes.data.data);
      } catch (err) {
        console.error('Failed to fetch analytics', err);
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, []);

  if (loading) {
    return <div className="text-center mt-20">Loading Analytics...</div>;
  }

  // Calculate Trend
  let trendPercentage = 0;
  let trendIsUp = false;
  if (monthlyData.length >= 2) {
    const currentMonth = monthlyData[monthlyData.length - 1].Expense;
    const previousMonth = monthlyData[monthlyData.length - 2].Expense;
    if (previousMonth > 0) {
      trendPercentage = ((currentMonth - previousMonth) / previousMonth) * 100;
      trendIsUp = trendPercentage > 0;
    }
  }

  // Advanced AI Insights Logic
  const getAIInsight = () => {
    if (categoryData.length === 0 || transactions.length === 0) return "Add more transactions to see deep insights.";
    
    const topCat = categoryData[0];
    const now = new Date();
    const thisMonth = now.getMonth();
    const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;
    const thisYear = now.getFullYear();
    const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;

    const lastMonthTopCatTotal = transactions
      .filter(tx => {
        const d = new Date(tx.date);
        return tx.category === topCat.name && tx.type === 'expense' && d.getMonth() === lastMonth && d.getFullYear() === lastYear;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    if (lastMonthTopCatTotal > 0) {
      const diff = ((topCat.value - lastMonthTopCatTotal) / lastMonthTopCatTotal) * 100;
      if (Math.abs(diff) > 1) {
        return `You spent ${Math.abs(diff).toFixed(0)}% ${diff > 0 ? 'more' : 'less'} on ${topCat.name} compared to last month.`;
      }
    }
    
    return `Your top spending this month is on ${topCat.name}. Try to set a budget for it!`;
  };

  const aiInsight = getAIInsight();

  const downloadCSV = () => {
    const thisMonth = new Date().getMonth();
    const thisYear = new Date().getFullYear();
    const currentTx = transactions.filter(tx => {
      const d = new Date(tx.date);
      return d.getMonth() === thisMonth && d.getFullYear() === thisYear;
    });

    if (currentTx.length === 0) {
      alert("No transactions this month to export.");
      return;
    }

    const headers = ['Date,Type,Category,Amount,Note'];
    const csvRows = currentTx.map(tx => {
      return `${new Date(tx.date).toLocaleDateString()},${tx.type},${tx.category},${tx.amount},"${tx.note || ''}"`;
    });

    const csvString = headers.concat(csvRows).join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.setAttribute('href', url);
    a.setAttribute('download', `expense_report_${thisMonth + 1}_${thisYear}.csv`);
    a.click();
  };

  return (
    <div className="space-y-8 animate-fade-in-up">
      <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2">
        Financial Analytics
      </h1>
      <p className="text-gray-500 mb-6">Visualize your spending patterns and trends.</p>

      {/* AI Insight Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-1 rounded-2xl shadow-lg mb-8">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 flex items-center gap-4">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
            <span className="text-2xl">🤖</span>
          </div>
          <div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">AI Financial Insight</p>
            <p className="text-lg font-medium text-gray-800 dark:text-white">"{aiInsight}"</p>
          </div>
        </div>
      </div>
      
      {/* Smart Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        
        {/* Top Category */}
        <div className="bg-gradient-to-br from-purple-500 to-fuchsia-600 p-6 rounded-2xl shadow-md text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm font-medium mb-1">Top Expense Category</p>
            <h3 className="text-2xl font-bold">{categoryData.length > 0 ? categoryData[0].name : 'N/A'}</h3>
            <p className="text-sm mt-1 text-purple-100">₹{categoryData.length > 0 ? categoryData[0].value.toFixed(2) : '0.00'}</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            <Award className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Spending Trend */}
        <div className={`p-6 rounded-2xl shadow-md text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center justify-between ${trendIsUp ? 'bg-gradient-to-br from-rose-400 to-red-500' : 'bg-gradient-to-br from-emerald-400 to-teal-500'}`}>
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">Spending Trend</p>
            <h3 className="text-2xl font-bold">{Math.abs(trendPercentage).toFixed(1)}%</h3>
            <p className="text-sm mt-1 text-white/90">{trendIsUp ? 'More' : 'Less'} than last month</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            {trendIsUp ? <ArrowUp className="w-8 h-8 text-white" /> : <ArrowDown className="w-8 h-8 text-white" />}
          </div>
        </div>

        {/* Auto-Report CSV */}
        <div className="bg-gradient-to-br from-blue-500 to-cyan-500 p-6 rounded-2xl shadow-md text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center justify-between cursor-pointer" onClick={downloadCSV}>
          <div>
            <p className="text-blue-100 text-sm font-medium mb-1">Monthly Report</p>
            <h3 className="text-xl font-bold">Download CSV</h3>
            <p className="text-sm mt-1 text-blue-100">Auto-generated summary</p>
          </div>
          <div className="bg-white/20 p-3 rounded-full backdrop-blur-sm">
            <Download className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Monthly Spending Trend Line Chart */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-white flex items-center">
            <span className="w-3 h-3 rounded-full bg-indigo-500 mr-2"></span>
            Monthly Spending Trend
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f9fafb'}} formatter={(value) => `₹${value.toFixed(2)}`} />
                <Legend />
                <Line type="monotone" dataKey="Expense" stroke="#6366f1" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        
        {/* Income vs Expense Bar Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-white flex items-center">
            <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
            Income vs Expense (This Year)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={monthlyData}
                margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <Tooltip cursor={{fill: '#f9fafb'}} />
                <Legend />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Pie Chart */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-white flex items-center">
            <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
            Expense Breakdown (This Month)
          </h3>
          <div className="h-80">
            {categoryData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                No expense data for this month.
              </div>
            )}
          </div>
        </div>

        {/* Recent Transactions Mini-Widget */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
          <h3 className="text-lg font-bold mb-6 text-gray-800 dark:text-white flex items-center">
            <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
            Recent Transactions
          </h3>
          <ul className="divide-y divide-gray-100 dark:divide-gray-700">
            {transactions.slice(0, 5).map(tx => (
              <li key={tx._id} className="py-3 flex justify-between items-center group">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-full ${tx.type === 'income' ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'}`}>
                    {tx.type === 'income' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 dark:text-white">{tx.category}</p>
                    <p className="text-xs text-gray-400">{new Date(tx.date).toLocaleDateString()}</p>
                  </div>
                </div>
                <span className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
                </span>
              </li>
            ))}
            {transactions.length === 0 && <li className="text-gray-500 text-center py-4">No transactions found.</li>}
          </ul>
        </div>

      </div>
    </div>
  );
};

export default Analytics;
