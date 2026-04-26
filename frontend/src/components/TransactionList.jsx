import React from 'react';
import { Trash2 } from 'lucide-react';
import axios from '../api/axios';

const TransactionList = ({ transactions, onTransactionDeleted }) => {
  const handleDelete = async (id) => {
    try {
      await axios.delete(`/api/transactions/${id}`);
      onTransactionDeleted(id);
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  if (transactions.length === 0) {
    return <div className="text-gray-500 dark:text-gray-400 text-center py-6">No transactions found.</div>;
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-md border border-gray-100 dark:border-gray-700 overflow-hidden transition-colors duration-300">
      <ul className="divide-y divide-gray-100 dark:divide-gray-700">
        {transactions.map((tx) => (
          <li key={tx._id} className="p-4 hover:bg-blue-50 dark:hover:bg-gray-700 transition-all duration-200 flex items-center justify-between border-l-4 border-transparent hover:border-blue-500 group">
            <div className="flex flex-col">
              <span className="font-bold text-gray-800 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-400 transition-colors">{tx.category}</span>
              <span className="text-xs text-gray-500 dark:text-gray-400">{new Date(tx.date).toLocaleDateString()} {tx.note && `- ${tx.note}`}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className={`font-bold ${tx.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                {tx.type === 'income' ? '+' : '-'}₹{tx.amount.toFixed(2)}
              </span>
              <button 
                onClick={() => handleDelete(tx._id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Delete"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default TransactionList;
