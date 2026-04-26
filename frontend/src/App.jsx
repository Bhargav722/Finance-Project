import React, { useContext, useState, useEffect } from 'react'
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Analytics from './pages/Analytics'
import ProtectedRoute from './components/ProtectedRoute'
import { PieChart, Home, BarChart2, Sun, Moon } from 'lucide-react'
import { AuthContext } from './context/AuthContext'

function AppContent() {
  const { user } = useContext(AuthContext);
  const [theme, setTheme] = useState(localStorage.getItem('theme') || 'light');

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 font-sans transition-colors duration-300">
        <nav className="bg-white dark:bg-gray-800 shadow-sm p-4 sticky top-0 z-10 transition-colors duration-300">
          <div className="container mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 font-bold text-xl text-blue-600 hover:text-blue-700 transition">
              <PieChart className="w-6 h-6" />
              FinTrack
            </Link>
            
            {user && (
              <div className="flex items-center gap-6">
                <Link to="/" className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
                  <Home className="w-4 h-4" /> Dashboard
                </Link>
                <Link to="/analytics" className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 font-medium transition">
                  <BarChart2 className="w-4 h-4" /> Analytics
                </Link>
                <button onClick={toggleTheme} className="text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white transition">
                  {theme === 'dark' ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>
            )}
          </div>
        </nav>

        <main className="container mx-auto p-4 sm:p-6 lg:p-8">
          <Routes>
            <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
          </Routes>
        </main>
      </div>
    </Router>
  )
}

function App() {
  return (
    <AppContent />
  )
}

export default App
