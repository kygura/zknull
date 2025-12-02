

export function Navigation() {
  return <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border">
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center">
            <span className="font-display font-bold text-xl text-primary">Z</span>
          </div>
          <span className="font-display font-semibold text-lg tracking-tight">zkNull</span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          
          
          
        </div>

        {/* <button className="border border-foreground px-4 py-2 font-mono text-sm hover:bg-foreground hover:text-background transition-colors">
          Launch App
        </button> */}
      </div>
    </nav>;
}
