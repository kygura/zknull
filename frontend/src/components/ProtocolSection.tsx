export function ProtocolSection() {
  const features = [{
    label: '01',
    title: 'Zero-Knowledge Proofs',
    description: 'Cryptographic verification without revelation. Your transactions remain yours.'
  }, {
    label: '02',
    title: 'EVM Native',
    description: 'Full compatibility with Ethereum and L2s.'
  }, {
    label: '03',
    title: 'Integrated Stablecoin',
    description: 'zkNull serves as a private and stable unit of account.'
  }];
  return <section id="protocol" className="py-24 px-6">
    <div className="max-w-5xl mx-auto">
      {/* Section header */}
      <div className="mb-20">
        <div className="font-mono text-sm text-muted-foreground mb-4">// core <span className="text-primary">//</span> protocol
        </div>
        <h2 className="font-display text-3xl md:text-5xl font-bold max-w-2xl">
          Privacy is not a feature.
          <br />
          <span className="text-muted-foreground">
            It's a meme.</span>
        </h2>
      </div>

      {/* Features grid */}
      <div className="grid md:grid-cols-3 gap-px bg-border">
        {features.map(feature => <div key={feature.label} className="bg-background p-8 group">
          <div className="font-mono text-xs text-primary mb-6">{feature.label}</div>
          <h3 className="font-display text-xl font-semibold mb-3 group-hover:text-primary transition-colors">
            {feature.title}
          </h3>
          <p className="font-mono text-sm text-muted-foreground leading-relaxed">
            {feature.description}
          </p>
        </div>)}
      </div>

      {/* Terminal block */}
      <div className="mt-20 border border-border bg-card">
        <div className="border-b border-border px-4 py-2 flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-destructive" />
          <div className="w-2 h-2 rounded-full bg-muted" />
          <div className="w-2 h-2 rounded-full bg-primary" />
          <span className="font-mono text-xs text-muted-foreground ml-2">
            protocol://zkStats
          </span>
        </div>
        <div className="p-6 font-mono text-sm space-y-2">
          <div className="text-primary">
            <span className="text-primary">const</span> zkStats = {'{'}
          </div>
          <div className="pl-4 text-muted-foreground">
            ticker: <span className="text-foreground">$ZKN</span>,
          </div>
          <div className="pl-4 text-muted-foreground">
            total_supply: <span className="text-foreground">10_000_000</span>,
          </div>
          <div className="pl-4 text-muted-foreground">
            circulating: <span className="text-foreground">1_000_000</span>,
          </div>
          <div className="pl-4 text-muted-foreground">
            burnt: <span className="text-foreground">0</span>,
          </div>

          <div className="pl-4 text-muted-foreground">
            collateral_ratio: <span className="text-primary">1.12
            </span>,
          </div>
          <div className="text-muted-foreground">{'}'}</div>
        </div>
      </div>
    </div>
  </section>;
}
