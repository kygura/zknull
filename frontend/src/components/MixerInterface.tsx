import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { useWallet } from '@/contexts/WalletContext';
import { useVariableDeposit } from '@/hooks/useVariableDeposit';
import { useZkNullToken } from '@/hooks/useZkNullToken';
import { formatDecomposition } from '@/utils/decomposition';

type TabType = 'fund' | 'transfer' | 'withdraw';

const withdrawAmounts = ['0.1 ZKN', '0.3 ZKN', '0.5 ZKN', '1 ZKN'];

export function MixerInterface() {
  const { account, isConnecting, connectWallet, disconnectWallet } = useWallet();
  const { state: depositState, calculateDecomposition, deposit, resetState } = useVariableDeposit();
  const { balance: tokenBalance, mint, loading: mintLoading } = useZkNullToken();

  const [activeTab, setActiveTab] = useState<TabType>('fund');
  const [tokenAmount, setTokenAmount] = useState('');
  const [mintAmount, setMintAmount] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [selectedWithdrawAmount, setSelectedWithdrawAmount] = useState<string | null>(null);

  const tabs: { id: TabType; label: string }[] = [
    { id: 'fund', label: 'Fund' },
    { id: 'transfer', label: 'Transfer' },
    { id: 'withdraw', label: 'Withdraw' },
  ];

  // Calculate decomposition when amount changes
  useEffect(() => {
    if (activeTab === 'fund') {
      const timer = setTimeout(() => {
        calculateDecomposition(tokenAmount);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [tokenAmount, activeTab, calculateDecomposition]);

  const handleDeposit = async () => {
    if (!tokenAmount) return;
    await deposit(tokenAmount);
  };

  const handleMint = async () => {
    if (!mintAmount) return;
    await mint(mintAmount);
    setMintAmount('');
  };

  return (
    <div className="w-full max-w-lg mx-auto">
      <div className="bg-card border border-border">
        {/* Tabs */}
        <div className="flex border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id);
                resetState();
              }}
              className={cn(
                'flex-1 py-4 px-6 font-display text-sm md:text-base transition-colors relative',
                activeTab === tab.id
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
              {activeTab === tab.id && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-foreground" />
              )}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {activeTab === 'fund' && (
            <>
              {/* Mint Section */}
              <div className="space-y-2 border-b border-border pb-6">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground font-mono">Mint ZKN (Testnet)</label>
                </div>
                <div className="flex gap-2">
                  <div className="flex-1 flex border border-border bg-secondary">
                    <input
                      type="text"
                      value={mintAmount}
                      onChange={(e) => setMintAmount(e.target.value)}
                      placeholder="Amount to mint (max 10k)"
                      className="flex-1 bg-transparent px-4 py-3 font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
                    />
                    <div className="flex items-center px-4 border-l border-border bg-muted">
                      <span className="font-mono text-sm">ZKN</span>
                    </div>
                  </div>
                  <button
                    onClick={handleMint}
                    disabled={mintLoading || !account}
                    className="px-6 bg-secondary border border-border hover:bg-secondary/80 text-foreground font-mono text-sm disabled:opacity-50"
                  >
                    {mintLoading ? '...' : 'Mint'}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground font-mono">Token amount</label>
                  <span className="text-sm text-muted-foreground font-mono">
                    Wallet balance: <span className="text-foreground">{account ? parseFloat(tokenBalance).toFixed(4) : '0'}</span>{' '}
                    <span
                      className="text-primary cursor-pointer hover:underline"
                      onClick={() => account && setTokenAmount(tokenBalance)}
                    >
                      Max
                    </span>
                  </span>
                </div>
                <div className="flex border border-border bg-secondary">
                  <input
                    type="text"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent px-4 py-3 font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <div className="flex items-center px-4 border-l border-border bg-muted">
                    <span className="font-mono text-sm">ZKN</span>
                  </div>
                </div>

                {/* Decomposition Preview */}
                {depositState.decomposition && depositState.decomposition.success && (
                  <div className="mt-2 p-3 bg-surface-elevated border border-border text-xs font-mono">
                    <div className="flex justify-between mb-1">
                      <span className="text-muted-foreground">Decomposition:</span>
                      <span className="text-foreground">{depositState.decomposition.totalFragments} notes</span>
                    </div>
                    <div className="text-primary">
                      {formatDecomposition(depositState.decomposition)}
                    </div>
                  </div>
                )}

                {/* Deposit Status */}
                {depositState.status !== 'idle' && (
                  <div className={cn(
                    "mt-2 p-3 border text-xs font-mono",
                    depositState.status === 'error' ? "bg-red-500/10 border-red-500 text-red-500" :
                      depositState.status === 'success' ? "bg-green-500/10 border-green-500 text-green-500" :
                        "bg-primary/10 border-primary text-primary"
                  )}>
                    <p>{depositState.message}</p>
                    {depositState.txHash && (
                      <p className="mt-1 break-all">Tx: {depositState.txHash}</p>
                    )}
                  </div>
                )}
              </div>

              {/* Deposit Button */}
              {account && (
                <button
                  onClick={handleDeposit}
                  disabled={depositState.status === 'decomposing' || depositState.status === 'generating' || depositState.status === 'approving' || depositState.status === 'signing' || depositState.status === 'processing' || !depositState.decomposition?.success}
                  className="w-full bg-primary text-primary-foreground py-4 font-display font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-4"
                >
                  {depositState.status === 'processing' ? 'Processing...' :
                    depositState.status === 'approving' ? 'Approving...' : 'Deposit'}
                </button>
              )}
            </>
          )}

          {activeTab === 'transfer' && (
            <>
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground font-mono">Token amount</label>
                  <span className="text-sm text-muted-foreground font-mono">
                    Shielded balance: <span className="text-foreground">0</span>{' '}
                    <span className="text-primary cursor-pointer">Max</span>
                  </span>
                </div>
                <div className="flex border border-border bg-secondary">
                  <input
                    type="text"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent px-4 py-3 font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <div className="flex items-center px-4 border-l border-border bg-muted">
                    <span className="font-mono text-sm">ZKN</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-mono">Recipient address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Place recipient address here"
                  className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="border border-border bg-surface-elevated p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm font-medium">Transfer method</span>
                  <span className="font-mono text-sm text-muted-foreground">Relayer ⚙</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-mono">Relayer fee</span>
                  <span className="font-mono">—</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-border pt-3">
                  <span className="font-medium font-mono">Total</span>
                  <span className="font-mono">—</span>
                </div>
              </div>
            </>
          )}

          {activeTab === 'withdraw' && (
            <>
              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-mono">ZKN to withdraw</label>
                <div className="flex gap-2">
                  {withdrawAmounts.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => setSelectedWithdrawAmount(amount)}
                      className={cn(
                        'flex-1 py-2 px-3 border font-mono text-sm transition-colors',
                        selectedWithdrawAmount === amount
                          ? 'border-primary bg-primary/10 text-primary'
                          : 'border-border bg-secondary text-foreground hover:border-muted-foreground'
                      )}
                    >
                      {amount}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-sm text-muted-foreground font-mono">ZKN to receive</label>
                  <span className="text-sm text-muted-foreground font-mono">
                    Shielded balance: <span className="text-foreground">0</span>{' '}
                    <span className="text-primary cursor-pointer">Max</span>
                  </span>
                </div>
                <div className="flex border border-border bg-secondary">
                  <input
                    type="text"
                    value={tokenAmount}
                    onChange={(e) => setTokenAmount(e.target.value)}
                    placeholder="0.00"
                    className="flex-1 bg-transparent px-4 py-3 font-mono text-foreground placeholder:text-muted-foreground focus:outline-none"
                  />
                  <div className="flex items-center px-4 border-l border-border bg-muted">
                    <span className="font-mono text-sm">ZKN</span>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm text-muted-foreground font-mono">Recipient address</label>
                <input
                  type="text"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  placeholder="Place recipient address here"
                  className="w-full bg-secondary border border-border px-4 py-3 font-mono text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                />
              </div>

              <div className="border border-border bg-surface-elevated p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <span className="font-mono text-sm font-medium">Withdrawal method</span>
                  <span className="font-mono text-sm text-muted-foreground">Relayer ⚙</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-mono">L1 network fee</span>
                  <span className="font-mono">0.0085 ETH</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-mono">Total fee</span>
                  <span className="font-mono">—</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground font-mono">To receive</span>
                  <span className="font-mono">—</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-border pt-3">
                  <span className="font-medium font-mono">Total</span>
                  <span className="font-mono">—</span>
                </div>
              </div>
            </>
          )}

          {/* Connect/Disconnect Wallet Button */}
          {account ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between p-4 bg-surface-elevated border border-border">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground font-mono">Connected wallet</p>
                  <p className="font-mono text-sm text-foreground">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </p>
                </div>
                <div className="space-y-1 text-right">
                  <p className="text-xs text-muted-foreground font-mono">Balance</p>
                  <p className="font-mono text-sm text-foreground">{parseFloat(tokenBalance).toFixed(4)} ZKN</p>
                </div>
              </div>
              <button
                onClick={disconnectWallet}
                className="w-full bg-secondary text-foreground py-4 font-display font-semibold text-base hover:bg-secondary/80 transition-colors border border-border"
              >
                Disconnect wallet
              </button>
            </div>
          ) : (
            <button
              onClick={connectWallet}
              disabled={isConnecting}
              className="w-full bg-primary text-primary-foreground py-4 font-display font-semibold text-base hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isConnecting ? 'Connecting...' : 'Connect wallet'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
