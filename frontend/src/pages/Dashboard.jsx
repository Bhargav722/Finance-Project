import React, { useEffect, useState, useContext } from 'react';
import axios from '../api/axios';
import { AuthContext } from '../context/AuthContext';
import TransactionForm from '../components/TransactionForm';
import TransactionList from '../components/TransactionList';
import { ArrowUpCircle, ArrowDownCircle, DollarSign, LogOut, Search, Filter, Calendar, Edit3, Download, AlertTriangle } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const Dashboard = () => {
  const { user, setUser, logout } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [filterDate, setFilterDate] = useState('all');
  
  const [isEditingBudget, setIsEditingBudget] = useState(false);
  const [newBudget, setNewBudget] = useState(user?.monthlyBudget || 0);

  const handleUpdateBudget = async () => {
    try {
      const res = await axios.put('/api/auth/budget', { budget: Number(newBudget) });
      setUser({ ...user, monthlyBudget: res.data.monthlyBudget }); // Update global context
      setIsEditingBudget(false);
    } catch (err) {
      console.error(err);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await axios.get('/api/transactions');
      setTransactions(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  const handleTransactionAdded = (newTx) => {
    setTransactions([newTx, ...transactions]);
  };

  const handleTransactionDeleted = (id) => {
    setTransactions(transactions.filter(tx => tx._id !== id));
  };

  // Filter logic
  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = tx.category.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (tx.note && tx.note.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesCategory = filterCategory === '' || tx.category === filterCategory;

    let matchesDate = true;
    if (filterDate !== 'all') {
      const txDate = new Date(tx.date);
      const today = new Date();
      if (filterDate === 'last7days') {
        const sevenDaysAgo = new Date(today.setDate(today.getDate() - 7));
        matchesDate = txDate >= sevenDaysAgo;
      } else if (filterDate === 'last30days') {
        const thirtyDaysAgo = new Date(today.setDate(today.getDate() - 30));
        matchesDate = txDate >= thirtyDaysAgo;
      } else if (filterDate === 'thisMonth') {
        matchesDate = txDate.getMonth() === new Date().getMonth() && txDate.getFullYear() === new Date().getFullYear();
      }
    }

    return matchesSearch && matchesCategory && matchesDate;
  });

  const uniqueCategories = [...new Set(transactions.map(tx => tx.category))];

  // Calculate stats based on filtered data
  const totalIncome = filteredTransactions
    .filter(tx => tx.type === 'income')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const totalExpense = filteredTransactions
    .filter(tx => tx.type === 'expense')
    .reduce((acc, curr) => acc + curr.amount, 0);
    
  const balance = totalIncome - totalExpense;

  const currentMonthExpense = transactions
    .filter(tx => {
      const d = new Date(tx.date);
      const now = new Date();
      return tx.type === 'expense' && d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    })
    .reduce((acc, curr) => acc + curr.amount, 0);

  const budgetExceeded = user?.monthlyBudget > 0 && currentMonthExpense > user?.monthlyBudget;

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.text("Expense Report", 14, 15);
    
    const tableColumn = ["Date", "Type", "Category", "Amount", "Note"];
    const tableRows = [];

    filteredTransactions.forEach(tx => {
      const rowData = [
        new Date(tx.date).toLocaleDateString(),
        tx.type,
        tx.category,
        `Rs ${tx.amount.toFixed(2)}`,
        tx.note || ''
      ];
      tableRows.push(rowData);
    });

    autoTable(doc, {
      head: [tableColumn],
      body: tableRows,
      startY: 20,
    });
    
    doc.save("transactions_report.pdf");
  };

  if (loading) {
    return <div className="text-center mt-20 dark:text-gray-300">Loading Dashboard...</div>;
  }

  return (
    <div>
      {budgetExceeded && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded-r-lg flex items-center shadow-sm">
          <AlertTriangle className="w-6 h-6 mr-3 flex-shrink-0" />
          <div>
            <p className="font-bold">Budget Exceeded!</p>
            <p className="text-sm">You have spent ₹{currentMonthExpense.toFixed(2)} this month, which is above your set limit of ₹{user?.monthlyBudget}.</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Hello, {user?.name}</h1>
          <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mt-1">
            <span>Monthly Budget: ₹{user?.monthlyBudget || 0}</span>
            <button onClick={() => {
              setNewBudget(user?.monthlyBudget || 0);
              setIsEditingBudget(!isEditingBudget);
            }} className="ml-2 hover:text-blue-500">
              <Edit3 className="w-4 h-4" />
            </button>
          </div>
          {isEditingBudget && (
            <div className="mt-2 flex gap-2">
              <input 
                type="number" 
                className="border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white p-1 rounded w-24 outline-none"
                value={newBudget}
                onChange={e => setNewBudget(e.target.value)}
              />
              <button onClick={handleUpdateBudget} className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700">Save</button>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <button onClick={exportPDF} className="flex items-center bg-gray-800 dark:bg-gray-700 text-white px-4 py-2 rounded-lg hover:bg-gray-900 dark:hover:bg-gray-600 transition shadow-sm text-sm sm:text-base">
            <Download className="w-4 h-4 mr-2" /> Export PDF
          </button>
          <button onClick={logout} className="flex items-center text-gray-600 dark:text-gray-300 hover:text-red-600 transition bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-4 py-2 rounded-lg shadow-sm text-sm sm:text-base">
            <LogOut className="w-4 h-4 mr-2" /> Logout
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="p-6 rounded-2xl shadow-md bg-gradient-to-br from-blue-500 to-indigo-600 text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center">
          <div className="bg-white/20 p-4 rounded-xl mr-4 backdrop-blur-sm">
            <DollarSign className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-blue-100 mb-1">Total Balance</p>
            <h3 className="text-3xl font-bold">₹{balance.toFixed(2)}</h3>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl shadow-md bg-gradient-to-br from-emerald-400 to-teal-500 text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center">
          <div className="bg-white/20 p-4 rounded-xl mr-4 backdrop-blur-sm">
            <ArrowUpCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-emerald-100 mb-1">Total Income</p>
            <h3 className="text-3xl font-bold">₹{totalIncome.toFixed(2)}</h3>
          </div>
        </div>
        
        <div className="p-6 rounded-2xl shadow-md bg-gradient-to-br from-rose-400 to-red-500 text-white transform transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex items-center">
          <div className="bg-white/20 p-4 rounded-xl mr-4 backdrop-blur-sm">
            <ArrowDownCircle className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="text-sm font-medium text-rose-100 mb-1">Total Expense</p>
            <h3 className="text-3xl font-bold">₹{totalExpense.toFixed(2)}</h3>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Col: Form */}
        <div className="lg:col-span-1 transform transition-all duration-300 hover:-translate-y-1">
          <TransactionForm onTransactionAdded={handleTransactionAdded} />
        </div>
        
        {/* Right Col: List */}
        <div className="lg:col-span-2 transform transition-all duration-300 hover:-translate-y-1">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 gap-4">
            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Recent Transactions</h3>
          </div>
          
          {/* Filters Bar */}
          <div className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 mb-6 flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <input 
                type="text" 
                placeholder="Search transactions..." 
                className="w-full pl-10 pr-4 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <div className="relative">
              <Filter className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <select 
                className="w-full pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition cursor-pointer"
                value={filterCategory}
                onChange={e => setFilterCategory(e.target.value)}
              >
                <option value="">All Categories</option>
                {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="relative">
              <Calendar className="w-5 h-5 absolute left-3 top-2.5 text-gray-400" />
              <select 
                className="w-full pl-10 pr-8 py-2 border border-gray-200 dark:border-gray-600 dark:bg-gray-700 dark:text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none appearance-none transition cursor-pointer"
                value={filterDate}
                onChange={e => setFilterDate(e.target.value)}
              >
                <option value="all">All Time</option>
                <option value="last7days">Last 7 Days</option>
                <option value="last30days">Last 30 Days</option>
                <option value="thisMonth">This Month</option>
              </select>
            </div>
          </div>

          <TransactionList 
            transactions={filteredTransactions} 
            onTransactionDeleted={handleTransactionDeleted} 
          />
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
