import { useState, useEffect } from 'react';

const taglines = [
  "A future for free-moving capital.",
  "Off-chain privacy enabled by zkProofs.",
  "Unlocking privacy in DeFi.",
  "Confidential transactions, powered by ZK.",
];

export function RotatingTagline() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => {
      setIsVisible(false);
      setTimeout(() => {
        setCurrentIndex((prev) => (prev + 1) % taglines.length);
        setIsVisible(true);
      }, 400);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="md:h-20 h-16 flex items-center justify-center">
      <p
        className={`text-lg md:text-1xl font-mono text-muted-foreground text-center max-w-3xl transition-all duration-400 ${
          isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'
        }`}
      >
        <span className="text-primary">&gt;</span> {taglines[currentIndex]}
      </p>
    </div>
  );
}
