import { useState, useEffect } from 'react';

const generateUUID = () => crypto.randomUUID();

// FIX: Ensure no trailing slash and prioritize environment variable
const BASE_URL = (import.meta.env.VITE_API_URL || 'https://expense-tracker-wallet-wise.onrender.com').replace(/\/$/, "");

function App() {
  const [expenses, setExpenses] = useState([]);
  const [filterCategory, setFilterCategory] = useState('');
  const [sortByDate, setSortByDate] = useState(true);
  const [loading, setLoading] = useState(false);
  const [idempotencyKey, setIdempotencyKey] = useState(generateUUID());
  
  const [formData, setFormData] = useState({
    amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0]
  });

  const fetchExpenses = async () => {
    setLoading(true);
    try {
      // FIX: Added /api/expenses path and fixed query string construction
      let url = `${BASE_URL}/api/expenses?${filterCategory ? `category=${filterCategory}&` : ''}${sortByDate ? 'sort=date_desc' : ''}`;
      const res = await fetch(url);
      if (res.ok) {
        setExpenses(await res.json());
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchExpenses(); }, [filterCategory, sortByDate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    const amountInCents = Math.round(parseFloat(formData.amount) * 100);

    try {
      // FIX: Pointing to the specific POST route /api/expenses
      const res = await fetch(`${BASE_URL}/api/expenses`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json', 
          'Idempotency-Key': idempotencyKey 
        },
        body: JSON.stringify({ ...formData, amount: amountInCents })
      });
      
      if (res.ok) {
        setFormData({ amount: '', category: 'Food', description: '', date: new Date().toISOString().split('T')[0] });
        setIdempotencyKey(generateUUID()); 
        fetchExpenses();
      }
    } catch (error) {
      console.error("Submit error:", error);
    } finally { setLoading(false); }
  };

  const totalCents = expenses.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 pb-10">
      {/* Header */}
      <div className="bg-blue-700 text-white py-10 px-4 shadow-lg mb-8">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold">WalletWise</h1>
          <p className="text-blue-100 opacity-80">Track your spending correctly</p>
          <div className="mt-6 bg-white/10 p-4 rounded-xl inline-block">
            <p className="text-xs uppercase font-bold tracking-widest">Total Visible</p>
            <p className="text-4xl font-black">${(totalCents / 100).toFixed(2)} </p>
          </div>
        </div>
      </div>

      <main className="max-w-2xl mx-auto px-4">
        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-md p-6 mb-8 border border-gray-200">
          <h2 className="font-bold text-gray-700 mb-4">Add Entry</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input required type="text" className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Description" value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} />
            <div className="grid grid-cols-2 gap-4">
              <input required type="number" step="0.01" className="bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Amount ($)" value={formData.amount} onChange={e => setFormData({...formData, amount: e.target.value})} />
              <select className="bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                <option>Food</option><option>Travel</option><option>Utilities</option><option>Entertainment</option><option>Other</option>
              </select>
            </div>
            <input required type="date" className="w-full bg-gray-50 border border-gray-300 rounded-lg p-3 focus:ring-2 focus:ring-blue-500 outline-none" value={formData.date} onChange={e => setFormData({...formData, date: e.target.value})} />
            <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-lg transition-colors shadow-md">
              {loading ? 'Adding...' : 'Add Expense'}
            </button>
          </form>
        </div>

        {/* List */}
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-lg text-gray-800">History</h3>
          <div className="flex gap-4">
            <select className="text-sm bg-transparent font-medium text-blue-600 outline-none" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="">All Categories</option>
              <option>Food</option><option>Travel</option><option>Utilities</option><option>Entertainment</option><option>Other</option>
            </select>
            <button onClick={() => setSortByDate(!sortByDate)} className="text-sm font-medium text-gray-500 underline">
              {sortByDate ? 'Newest First ' : 'Oldest First'}
            </button>
          </div>
        </div>

        <div className="space-y-3">
          {expenses.length === 0 && !loading && <p className="text-center text-gray-500 py-10">No expenses found.</p>}
          {expenses.map(exp => (
            <div key={exp.id} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-lg">
                  {exp.category === 'Food' ? '🍔' : exp.category === 'Travel' ? '✈️' : '💰'}
                </div>
                <div>
                  <p className="font-bold text-gray-800">{exp.description}</p>
                  <p className="text-xs text-gray-400 uppercase font-bold tracking-tighter">{exp.category} • {exp.date}</p>
                </div>
              </div>
              <p className="font-black text-lg">-${(exp.amount/100).toFixed(2)}</p>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

export default App;