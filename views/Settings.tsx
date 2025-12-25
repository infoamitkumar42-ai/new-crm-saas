// src/views/Settings.tsx (Updated button section)
import { usePushNotification } from '../hooks/usePushNotification';

// In your component:
const { 
  subscribe, 
  unsubscribe, 
  isSubscribed, 
  isLoading, 
  error,
  testNotification 
} = usePushNotification();

// In your JSX:
<div className="space-y-4">
  {/* Main Subscribe/Unsubscribe Button */}
  <button 
    onClick={isSubscribed ? unsubscribe : subscribe}
    disabled={isLoading}
    className={`w-full py-4 rounded-xl font-bold transition-all ${
      isLoading 
        ? 'bg-gray-400 cursor-not-allowed' 
        : isSubscribed 
          ? 'bg-green-600 hover:bg-green-700 text-white' 
          : 'bg-blue-600 hover:bg-blue-700 text-white'
    }`}
  >
    {isLoading ? (
      <span className="flex items-center justify-center gap-2">
        <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
        Processing...
      </span>
    ) : isSubscribed ? (
      "✅ Notifications Active (Click to Disable)"
    ) : (
      "🔔 Enable Mobile Alerts"
    )}
  </button>

  {/* Test Button (only show when subscribed) */}
  {isSubscribed && (
    <button 
      onClick={testNotification}
      className="w-full py-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-medium"
    >
      🧪 Send Test Notification
    </button>
  )}

  {/* Error Display */}
  {error && (
    <div className="p-3 bg-red-100 border border-red-400 rounded-lg text-red-700 text-sm">
      ⚠️ {error}
    </div>
  )}

  {/* Debug Info (remove in production) */}
  <div className="text-xs text-gray-500 p-2 bg-gray-100 rounded">
    Status: {isSubscribed ? '🟢 Subscribed' : '🔴 Not Subscribed'} | 
    Loading: {isLoading ? 'Yes' : 'No'}
  </div>
</div>
