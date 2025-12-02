export function Footer() {
  return <footer className="hidden border-t border-border py-12 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-xl text-primary">Z</span>
              <span className="font-display font-semibold">zkNull</span>
            </div>
            <p className="font-mono text-xs text-muted-foreground max-w-xs">
              The first private stack and integrated stablecoin on the EVM.
            </p>
          </div>

          {/* Links */}
          <div className="flex gap-12">
            <div className="space-y-3">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Protocol</div>
              <div className="space-y-2">
                <a href="#" className="block font-mono text-sm text-foreground hover:text-primary transition-colors">
                  Documentation
                </a>
                <a href="#" className="block font-mono text-sm text-foreground hover:text-primary transition-colors">
                  Whitepaper
                </a>
                <a href="#" className="block font-mono text-sm text-foreground hover:text-primary transition-colors">
                  Audits
                </a>
              </div>
            </div>

            <div className="space-y-3">
              <div className="font-mono text-xs text-muted-foreground uppercase tracking-wider">Community</div>
              <div className="space-y-2">
                <a href="#" className="block font-mono text-sm text-foreground hover:text-primary transition-colors">
                  Discord
                </a>
                <a href="#" className="block font-mono text-sm text-foreground hover:text-primary transition-colors">
                  Twitter
                </a>
                <a href="#" className="block font-mono text-sm text-foreground hover:text-primary transition-colors">
                  GitHub
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        
      </div>
    </footer>;
}