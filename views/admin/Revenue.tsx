import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Loader2 } from 'lucide-react';

export default function Revenue() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalRevenue, setTotalRevenue] = useState(0);
  const [debugInfo, setDebugInfo] = useState<any>({});

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      
      // Get current user for debug
      const { data: userData } = await supabase.auth.getUser();
      
      // Fetch payments with join
      const { data, error } = await supabase
        .from('payments')
        .select('*, users(email)')
        .order('created_at', { ascending: false });

      setDebugInfo({
        currentUser: userData?.user?.email,
        error: error,
        dataReceived: data?.length || 0
      });

      if (error) {
        console.error('Revenue fetch error:', error);
      } else if (data) {
        setPayments(data);
        
        // Calculate total
        const total = data
          .filter(p => p.status === 'captured')
          .reduce((sum, curr) => sum + Number(curr.amount), 0);
        setTotalRevenue(total);
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      setDebugInfo(prev => ({ ...prev, catchError: err }));
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-6">Revenue Dashboard</h1>
      
      {/* Debug Panel */}
      <div className="bg-yellow-50 border border-yellow-200 rounded p-4 mb-6">
        <h3 className="font-semibold text-yellow-800 mb-2">Debug Info:</h3>
        <div className="text-sm text-yellow-700">
          <p>Logged in as: {debugInfo.currentUser}</p>
          <p>Payments found: {debugInfo.dataReceived}</p>
          {debugInfo.error && (
            <p className="text-red-600">Error: {JSON.stringify(debugInfo.error)}</p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Revenue</p>
          <p className="text-2xl font-bold text-green-600">
            {formatCurrency(totalRevenue)}
          </p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow">
          <p className="text-sm text-gray-500">Total Transactions</p>
          <p className="text-2xl font-bold text-blue-600">{payments.length}</p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="min-w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">User</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
              <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {payments.map((payment) => (
              <tr key={payment.id}>
                <td className="px-4 py-2 text-sm">
                  {new Date(payment.created_at).toLocaleDateString()}
                </td>
                <td className="px-4 py-2 text-sm">
                  {payment.users?.email || payment.payer_email || 'Unknown'}
                </td>
                <td className="px-4 py-2 text-sm font-medium">
                  {formatCurrency(payment.amount)}
                </td>
                <td className="px-4 py-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    payment.status === 'captured' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-yellow-100 text-yellow-800'
                  }`}>
                    {payment.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
