{/* --- MOBILE HEADER --- */}
<div 
  style={{ 
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '12px 16px',
    backgroundColor: '#0f172a',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none'
  }}
  className="md:hidden"
>
  <span className="font-bold text-lg tracking-tight text-white">LeadFlow</span>
  <button 
    onClick={() => setMobileMenuOpen(!mobileMenuOpen)} 
    className="p-2 active:bg-slate-800 rounded-lg text-white"
  >
    {mobileMenuOpen ? (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
      </svg>
    ) : (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
      </svg>
    )}
  </button>
</div>

{/* --- MOBILE MENU OVERLAY --- */}
{mobileMenuOpen && (
  <div 
    style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      zIndex: 40,
      backgroundColor: '#0f172a',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none'
    }}
    className="md:hidden"
  >
    <div 
      style={{ 
        paddingTop: '80px',
        paddingLeft: '24px',
        paddingRight: '24px',
        height: '100%'
      }}
    >
      <nav className="space-y-3">
        <button 
          onClick={() => handleTabChange('dashboard')} 
          className={`w-full text-left py-4 px-4 rounded-xl text-lg font-medium transition-all ${
            activeTab === 'dashboard' 
              ? 'bg-brand-600 text-white shadow-lg' 
              : 'text-white hover:bg-slate-800'
          }`}
        >
          Dashboard
        </button>
        <button 
          onClick={() => handleTabChange('filters')} 
          className={`w-full text-left py-4 px-4 rounded-xl text-lg font-medium transition-all ${
            activeTab === 'filters' 
              ? 'bg-brand-600 text-white shadow-lg' 
              : 'text-white hover:bg-slate-800'
          }`}
        >
          Target Audience
        </button>
        <button 
          onClick={() => handleTabChange('subscription')} 
          className={`w-full text-left py-4 px-4 rounded-xl text-lg font-medium transition-all ${
            activeTab === 'subscription' 
              ? 'bg-brand-600 text-white shadow-lg' 
              : 'text-white hover:bg-slate-800'
          }`}
        >
          Plans & Billing
        </button>
        {isAdmin && (
          <button 
            onClick={() => handleTabChange('admin')} 
            className="w-full text-left py-4 px-4 rounded-xl text-lg font-medium text-amber-400 hover:bg-slate-800"
          >
            Admin Panel
          </button>
        )}
        <div className="h-px bg-slate-800 my-4"></div>
        <button 
          onClick={signOut} 
          className="w-full text-left py-4 px-4 rounded-xl text-lg font-medium text-red-400 hover:bg-red-900/10"
        >
          Sign Out
        </button>
      </nav>
    </div>
  </div>
)}
