import { WireframePyramid } from './WireframePyramid';
import { RotatingTagline } from './RotatingTagline';

export function HeroSection() {
  return <section className="min-h-screen flex flex-col items-center justify-center px-6 pt-20">
      <div className="flex flex-col items-center gap-8 animate-fade-up">
        {/* 3D Wireframe Pyramid */}
        <WireframePyramid />

        {/* Title */}
        <div className="text-center space-y-4">
          <h1 className="font-display text-5xl md:text-7xl lg:text-8xl font-bold tracking-tight">
            zk<span className="text-primary">Null</span>
          </h1>
          <p className="font-mono text-muted-foreground text-sm md:text-base">Private capital for the decentralized economy</p>
        </div>

        {/* Rotating Tagline */}
        <RotatingTagline />

 

        {/* Terminal-style status */}
        <div className="mt-8 font-mono text-sm border border-border bg-card px-6 py-3 ">
        <span className='text-muted-foreground'>status: </span>
        live on <span className="text-primary animate-pulse">::sepolia testnet::</span>
        
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
        
      </div>
    </section>;
}
