{/* 📱 MOBILE TOP BAR - SOLID BACKGROUND */}
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
    borderBottom: '1px solid #1e293b',
    boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)',
    backdropFilter: 'none',
    WebkitBackdropFilter: 'none'
  }}
  className="lg:hidden"
>
  <div className="flex items-center gap-2">
    <div className="h-8 w-8 rounded flex items-center justify-center font-bold text-white" style={{ backgroundColor: '#2563eb' }}>L</div>
    <span className="font-bold text-lg text-white">LeadFlow</span>
  </div>
  <button 
    onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} 
    className="text-white p-1"
  >
    {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
  </button>
</div>

{/* 📱 MOBILE MENU OVERLAY */}
{isMobileMenuOpen && (
  <div 
    style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      zIndex: 40,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      backdropFilter: 'none',
      WebkitBackdropFilter: 'none'
    }}
    onClick={() => setIsMobileMenuOpen(false)}
  >
    <div 
      style={{ 
        position: 'absolute',
        top: 0,
        left: 0,
        bottom: 0,
        width: '80%',
        maxWidth: '300px',
        backgroundColor: '#0f172a',
        paddingTop: '80px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '4px 0 15px rgba(0,0,0,0.5)',
        backdropFilter: 'none',
        WebkitBackdropFilter: 'none'
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex-1 px-4 space-y-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => {
                navigate(item.path);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-colors text-white"
              style={{
                backgroundColor: isActive ? '#2563eb' : 'transparent',
                border: isActive ? 'none' : '1px solid #334155'
              }}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>
      <div className="p-6 border-t border-slate-800 pb-10">
        <button 
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-400 bg-red-900/10 font-bold"
        >
          <LogOut size={20} />
          <span>Sign Out</span>
        </button>
      </div>
    </div>
  </div>
)}
