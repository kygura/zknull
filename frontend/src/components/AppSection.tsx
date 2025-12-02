import { MixerInterface } from './MixerInterface';
export function AppSection() {
  return <section id="app" className="py-32 px-6 bg-surface-elevated">
      <div className="max-w-5xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="font-mono text-sm text-muted-foreground mb-4">
          <span className="text-primary">//</span> application
          </div>
          <h2 className="font-display text-3xl md:text-4xl font-bold mb-4">Showcase</h2>
          <p className="font-mono text-muted-foreground text-sm max-w-lg mx-auto">
            Fund, transfer, and withdraw with zero-knowledge proofs. 
            Your financial activity remains confidential.
          </p>
        </div>

        {/* Mixer Interface */}
        <MixerInterface />

        {/* Stats row */}
{/*         <div className="mt-20 grid grid-cols-3 gap-px bg-border border border-border">
          <div className="bg-background p-6 text-center">
            <div className="font-display text-2xl md:text-3xl font-bold text-primary">$--M</div>
            <div className="font-mono text-xs text-muted-foreground mt-1">Total Value Locked</div>
          </div>
          <div className="bg-background p-6 text-center">
            <div className="font-display text-2xl md:text-3xl font-bold">--K</div>
            <div className="font-mono text-xs text-muted-foreground mt-1">Transactions</div>
          </div>
          <div className="bg-background p-6 text-center">
            <div className="font-display text-2xl md:text-3xl font-bold">--</div>
            <div className="font-mono text-xs text-muted-foreground mt-1">Unique Users</div>
          </div>
        </div> */}

      </div>
    </section>;
}
