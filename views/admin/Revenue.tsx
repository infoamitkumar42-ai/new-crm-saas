import { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { Loader2 } from 'lucide-react';

export default function Revenue() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRevenueData();
  }, []);

  const fetchRevenueData = async () => {
    try {
      setLoading(true);
      setError(null);

      // Simple query without join first
      const { data, error: fetchError } = await supabase
        .from('payments')
        .select('*')
        .order('created_at', { ascending: false });

      if (fetchError) {
        console.error('Supabase Error:', fetchError);
        setError(fetchError.message);
      } else {
        console.log('Payments Data:', data);
        setPayments(data || []);
      }
    } catch (err) {
      console.error('Catch Error:', err);
      setError('Unexpected error occurred');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="animate-spin text-blue-600" size={32} />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-600">
        Error: {error}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Revenue</h1>
      
      <div className="bg-white p-6 rounded-lg shadow">
        <h2 className="text-lg font-semibold mb-4">Debug Info:</h2>
        <p>Total Payments Found: {payments.length}</p>
        
        {payments.length > 0 && (
          <div className="mt-4">
            <h3 className="font-semibold">First Payment:</h3>
            <pre className="bg-gray-100 p-2 rounded mt-2 text-xs overflow-auto">
              {JSON.stringify(payments[0], null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  );
}
