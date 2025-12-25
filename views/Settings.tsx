import { usePushNotification } from '../hooks/usePushNotification';

export default function Settings() {
  const { subscribe, isSubscribed, isLoading } = usePushNotification();

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-lg p-8">
        <h1 className="text-3xl font-bold mb-6">⚙️ Settings</h1>
        
        <div className="border-t pt-6">
          <h2 className="text-xl font-semibold mb-4">🔔 Push Notifications</h2>
          
          <p className="text-gray-600 mb-4">
            Enable notifications to receive instant alerts when new leads arrive, 
            even when the dashboard is closed.
          </p>
          
          <button
            onClick={subscribe}
            disabled={isLoading || isSubscribed}
            className={`w-full py-4 px-6 rounded-xl font-bold text-lg transition-all ${
              isSubscribed
                ? 'bg-green-500 text-white cursor-not-allowed'
                : isLoading
                ? 'bg-gray-400 text-white cursor-wait'
                : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-95'
            }`}
          >
            {isLoading ? (
              '⏳ Setting up...'
            ) : isSubscribed ? (
              '✅ Notifications Active'
            ) : (
              '🔔 Enable Push Notifications'
            )}
          </button>
          
          {isSubscribed && (
            <p className="text-green-600 text-sm mt-3 text-center">
              ✅ You will receive notifications even when the app is closed
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
