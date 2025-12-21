// Imports ke saath upar add karo:
import { usePushNotification } from '../hooks/usePushNotification';

// Component ke andar:
export const LeadAlert: React.FC = () => {
  const { session } = useAuth();
  const { subscribeToPush, loading } = usePushNotification(); // 👈 Hook use kiya

  // ... baaki purana code ...

  return (
    <>
      {/* 🛠️ SETUP BUTTON (Temporary for Testing) */}
      <div className="fixed bottom-24 right-4 z-50">
        <button 
            onClick={() => session?.user?.id && subscribeToPush(session.user.id)}
            disabled={loading}
            className="bg-purple-600 text-white p-3 rounded-full shadow-lg flex items-center gap-2 font-bold"
        >
            {loading ? 'Activating...' : '🔔 Enable Background Push'}
        </button>
      </div>

      {/* ... baaki components ... */}
    </>
  );
};
