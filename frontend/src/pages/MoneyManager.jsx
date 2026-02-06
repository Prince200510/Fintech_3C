import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';
import api from '../services/api';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip,
  BarChart, Bar, XAxis, YAxis, CartesianGrid 
} from 'recharts';
import { Mic, MicOff, Calculator, TrendingUp, Wallet, Target } from 'lucide-react';

const MoneyManager = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { strings } = useLanguage();
  const { isDark } = useTheme();
  
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceText, setVoiceText] = useState('');
  const [recognition, setRecognition] = useState(null);
  const [history, setHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [error, setError] = useState('');

  // Initialize speech recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recog = new SpeechRecognition();
      recog.continuous = false;
      recog.interimResults = false;
      recog.lang = strings.languageCode || 'hi-IN'; // Hindi or English
      
      recog.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setVoiceText(transcript);
        
        // Try to extract amount from voice input
        const amountMatch = transcript.match(/(\d+)/);
        if (amountMatch) {
          setAmount(amountMatch[1]);
        }
        setIsListening(false);
      };
      
      recog.onerror = (event) => {
        console.error('Speech recognition error', event.error);
        setIsListening(false);
      };
      
      recog.onend = () => {
        setIsListening(false);
      };
      
      setRecognition(recog);
    }
  }, [strings.languageCode]);

  // Fetch history
  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const response = await api.get('/money-manager/history');
      setHistory(response.data.history || []);
    } catch (error) {
      console.error('Error fetching history:', error);
    }
  };

  const toggleVoice = () => {
    if (isListening) {
      recognition?.stop();
      setIsListening(false);
    } else {
      recognition?.start();
      setIsListening(true);
      setVoiceText('');
    }
  };

  const handleAnalyze = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError(strings.moneyManager?.enterValidAmount || 'Please enter a valid amount');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await api.post('/money-manager/analyze', {
        amount: parseFloat(amount),
        language: strings.languageCode || 'en',
        voice_input: voiceText || null
      });

      setAnalysis(response.data);
      await fetchHistory(); // Refresh history
    } catch (error) {
      console.error('Error analyzing money:', error);
      setError(strings.moneyManager?.analysisError || 'Failed to analyze. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE'];

  const renderPieChart = () => {
    if (!analysis) return null;

    const data = analysis.allocations.map(alloc => ({
      name: alloc.category,
      value: alloc.amount,
      percentage: alloc.percentage
    }));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5" />
          {strings.moneyManager?.budgetBreakdown || 'Budget Breakdown'}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percentage }) => `${percentage}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    );
  };

  const renderBarChart = () => {
    if (!analysis) return null;

    const data = analysis.allocations.map(alloc => ({
      category: alloc.category.replace(/[^\w\s]/gi, '').substring(0, 10) + '...',
      amount: alloc.amount
    }));

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
        <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          {strings.moneyManager?.categoryWise || 'Category-wise Allocation'}
        </h3>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="category" tick={{ fontSize: 10 }} />
            <YAxis />
            <Tooltip formatter={(value) => `₹${value.toFixed(2)}`} />
            <Bar dataKey="amount" fill="#4ECDC4" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold mb-2 dark:text-white flex items-center justify-center gap-3">
            <Wallet className="w-10 h-10 text-purple-600" />
            {strings.moneyManager?.title || 'Money Manager'}
          </h1>
          <p className="text-gray-600 dark:text-gray-300 text-lg">
            {strings.moneyManager?.subtitle || 'Smart budgeting for your money'}
          </p>
        </div>

        {/* Input Section */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-xl mb-8">
          <div className="max-w-2xl mx-auto">
            <label className="block text-lg font-semibold mb-4 dark:text-white">
              {strings.moneyManager?.enterAmount || 'Enter Available Amount'}
            </label>
            
            <div className="flex gap-3 mb-4">
              <div className="flex-1 relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-2xl font-bold text-gray-500">
                  ₹
                </span>
                <input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder={strings.moneyManager?.amountPlaceholder || '5000'}
                  className="w-full pl-12 pr-4 py-4 text-2xl border-2 border-purple-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                />
              </div>
              
              <button
                onClick={toggleVoice}
                className={`px-6 py-4 rounded-xl font-semibold transition-all ${
                  isListening 
                    ? 'bg-red-500 hover:bg-red-600 text-white animate-pulse' 
                    : 'bg-green-500 hover:bg-green-600 text-white'
                }`}
              >
                {isListening ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
              </button>
            </div>

            {voiceText && (
              <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900 rounded-lg">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  🎤 {strings.moneyManager?.voiceInput || 'Voice Input'}: {voiceText}
                </p>
              </div>
            )}

            {error && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-900 rounded-lg">
                <p className="text-sm text-red-600 dark:text-red-200">{error}</p>
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-xl text-lg font-bold hover:from-purple-700 hover:to-blue-700 transition-all shadow-lg disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  {strings.moneyManager?.analyzing || 'Analyzing...'}
                </>
              ) : (
                <>
                  <Calculator className="w-5 h-5" />
                  {strings.moneyManager?.analyzeButton || 'Analyze My Money'}
                </>
              )}
            </button>
          </div>
        </div>

        {/* Analysis Results */}
        {analysis && (
          <div className="space-y-6">
            {/* Summary Cards */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-gradient-to-br from-green-400 to-green-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {strings.moneyManager?.totalAmount || 'Total Amount'}
                </h3>
                <p className="text-3xl font-bold">₹{analysis.total_amount.toLocaleString()}</p>
              </div>
              
              <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {strings.moneyManager?.savingsTarget || 'Savings Target'}
                </h3>
                <p className="text-3xl font-bold">₹{analysis.savings_suggestion.toLocaleString()}</p>
              </div>
              
              <div className="bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl p-6 text-white shadow-lg">
                <h3 className="text-lg font-semibold mb-2">
                  {strings.moneyManager?.investmentTarget || 'Investment'}
                </h3>
                <p className="text-3xl font-bold">₹{analysis.investment_suggestion.toLocaleString()}</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-6">
              {renderPieChart()}
              {renderBarChart()}
            </div>

            {/* Detailed Allocations */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                {strings.moneyManager?.detailedBreakdown || 'Detailed Breakdown'}
              </h3>
              <div className="space-y-3">
                {analysis.allocations.map((alloc, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div>
                      <p className="font-semibold dark:text-white">{alloc.category}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{alloc.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg dark:text-white">₹{alloc.amount.toFixed(2)}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{alloc.percentage}%</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Insights */}
            <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-gray-800 dark:to-gray-700 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 dark:text-white flex items-center gap-2">
                🤖 {strings.moneyManager?.aiInsights || 'AI Insights'}
              </h3>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-gray-700 dark:text-gray-200 whitespace-pre-line">
                  {analysis.ai_insights}
                </p>
              </div>
            </div>

            {/* Priority Tips */}
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg">
              <h3 className="text-xl font-bold mb-4 dark:text-white">
                {strings.moneyManager?.priorityTips || 'Priority Tips'}
              </h3>
              <div className="grid md:grid-cols-2 gap-4">
                {analysis.priority_tips.map((tip, index) => (
                  <div key={index} className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900 rounded-lg">
                    <span className="text-2xl">✅</span>
                    <p className="text-gray-700 dark:text-gray-200">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* History Section */}
        {history.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="w-full bg-white dark:bg-gray-800 p-4 rounded-xl shadow-lg text-left font-semibold dark:text-white hover:bg-gray-50 dark:hover:bg-gray-700 transition-all"
            >
              📊 {strings.moneyManager?.viewHistory || 'View Previous Analyses'} ({history.length})
            </button>
            
            {showHistory && (
              <div className="mt-4 space-y-3">
                {history.map((item, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-semibold dark:text-white">₹{item.amount.toLocaleString()}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {new Date(item.created_at).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setAmount(item.amount.toString());
                          setShowHistory(false);
                        }}
                        className="text-purple-600 hover:text-purple-700 font-semibold"
                      >
                        {strings.moneyManager?.reuse || 'Use Again'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </main>
      
      <Footer />
    </div>
  );
};

export default MoneyManager;
