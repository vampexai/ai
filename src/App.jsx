import React, { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { 
  Wallet, 
  Coins, 
  Users, 
  Lock, 
  ArrowUpRight, 
  ShieldCheck, 
  History, 
  Settings,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  TrendingUp,
  Brain,
  Zap,
  Globe,
  Database,
  Shield,
  MessageSquare,
  LogOut,
  Copy,
  ExternalLink,
  Menu,
  X
} from 'lucide-react';
import { STAKING_ADDRESS, VAMP_ADDRESS, STAKING_ABI, VAMP_ABI } from './contracts/config';
import logo from './assets/logo.png';

function App() {
  const [account, setAccount] = useState(null);
  const [balance, setBalance] = useState('0');
  const [userProfile, setUserProfile] = useState(null);
  const [stakes, setStakes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [referralInput, setReferralInput] = useState('');
  const [stakeAmount, setStakeAmount] = useState('');
  const [secretInput, setSecretInput] = useState('');
  const [status, setStatus] = useState({ type: '', message: '' });
  const [fetchingProfile, setFetchingProfile] = useState(false);
  const [fetchError, setFetchError] = useState(null);

  const notify = (type, message) => {
    setStatus({ type, message });
    setTimeout(() => setStatus({ type: '', message: '' }), 5000);
  };

  const isMobile = () => /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);

  const connectWallet = async () => {
    if (window.ethereum) {
      try {
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        setAccount(accounts[0]);
      } catch (err) {
        notify('error', 'Failed to connect wallet');
      }
    } else if (isMobile()) {
      const dappUrl = 'rajverma51.github.io/vampexai.github.io';
      window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
    } else {
      notify('error', 'Please install MetaMask → https://metamask.io');
    }
  };

  const disconnectWallet = () => {
    setAccount(null);
    setUserProfile(null);
    setStakes([]);
    notify('success', 'Wallet disconnected');
  };

  // Auto-fill referrer from URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get('ref');
    if (ref && ethers.isAddress(ref)) {
      setReferralInput(ref);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!account) return;
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, provider);
      const tokenContract = new ethers.Contract(VAMP_ADDRESS, VAMP_ABI, provider);

      // Check if code exists
      const code = await provider.getCode(STAKING_ADDRESS);
      if (code === "0x") {
        setFetchError(`No contract at ${STAKING_ADDRESS}. Is it deployed on this network?`);
        setFetchingProfile(false);
        return;
      }

      // Token Balance
      const bal = await tokenContract.balanceOf(account).catch(() => 0n);
      setBalance(ethers.formatEther(bal));

      // User Profile
      const profile = await stakingContract.users(account);
      console.log("Profile Data:", profile);
      
      const isReg = profile.isRegistered || profile[0];

      setUserProfile({
        isRegistered: !!isReg,
        referrer: profile.referrer || profile[1],
        referralRewards: ethers.formatEther(profile.referralRewards || profile[3]),
        totalStaked: ethers.formatEther(profile.totalStaked || profile[4])
      });

      // User Stakes
      const stakeCount = await stakingContract.getUserStakeCount(account).catch(() => 0n);
      const userStakes = [];
      for (let i = 0; i < Number(stakeCount); i++) {
        const s = await stakingContract.userStakes(account, i);
        const reward = await stakingContract.getPendingReward(account, i).catch(() => 0n);
        userStakes.push({
          index: i,
          amount: ethers.formatEther(s.amount),
          startTime: Number(s.startTime),
          withdrawn: s.withdrawn,
          pendingReward: ethers.formatEther(reward)
        });
      }
      setStakes(userStakes.reverse());
      setFetchError(null);
      setFetchingProfile(false);
    } catch (err) {
      console.error("Fetch error:", err);
      setFetchError(err.message);
      setFetchingProfile(false);
    }
  }, [account]);

  useEffect(() => {
    if (account) {
        setFetchingProfile(true);
        fetchData();
        const interval = setInterval(fetchData, 15000);
        return () => clearInterval(interval);
    }
  }, [account, fetchData]);

  const handleRegister = async () => {
    if (!secretInput) return notify('error', 'Secret password is required');
    if (!referralInput || !ethers.isAddress(referralInput)) {
      return notify('error', 'Valid Sponsor/Referrer address is mandatory');
    }
    if (referralInput.toLowerCase() === account.toLowerCase()) {
      return notify('error', 'You cannot refer yourself');
    }

    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);

      const secretHash = ethers.keccak256(ethers.toUtf8Bytes(secretInput));

      const tx = await contract.register(referralInput, secretHash);
      await tx.wait();
      notify('success', 'Successfully registered!');
      setFetchingProfile(true);
      fetchData();
    } catch (err) {
      notify('error', err.reason || 'Registration failed');
    }
    setLoading(false);
  };

  const handleStake = async () => {
    if (!stakeAmount || isNaN(stakeAmount)) return notify('error', 'Invalid amount');
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);
      const tokenContract = new ethers.Contract(VAMP_ADDRESS, VAMP_ABI, signer);

      const amount = ethers.parseEther(stakeAmount);
      const allowance = await tokenContract.allowance(account, STAKING_ADDRESS);
      if (allowance < amount) {
        const approveTx = await tokenContract.approve(STAKING_ADDRESS, ethers.MaxUint256);
        await approveTx.wait();
      }

      const tx = await stakingContract.stake(amount);
      await tx.wait();
      notify('success', 'Staked successfully!');
      fetchData();
    } catch (err) {
      notify('error', err.reason || 'Staking failed');
    }
    setLoading(false);
  };

  const handleWithdraw = async (index) => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);

      const tx = await contract.withdrawStake(index);
      await tx.wait();
      notify('success', 'Withdrawal successful!');
      fetchData();
    } catch (err) {
      notify('error', err.reason || 'Withdrawal failed. Check lock period.');
    }
    setLoading(false);
  };

  const handleClaimReferral = async () => {
    setLoading(true);
    try {
      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer);

      const tx = await contract.claimReferralRewards();
      await tx.wait();
      notify('success', 'Rewards claimed!');
      fetchData();
    } catch (err) {
      notify('error', err.reason || 'Claim failed');
    }
    setLoading(false);
  };

  const [activeView, setActiveView] = useState('landing'); // 'landing' or 'app'
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);
  const closeMenu = () => setIsMenuOpen(false);

  return (
    <div className="app-container" style={{ maxWidth: '100%', padding: 0 }}>
      {/* Mobile Menu Overlay */}
      <div className={`mobile-overlay ${isMenuOpen ? 'active' : ''}`}>
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button className="mobile-menu-btn" onClick={toggleMenu}><X size={32} /></button>
        </div>
        <div className="logo" style={{ marginBottom: '2rem' }}>VampExAI</div>
        <a href="#protocol" className="nav-link" style={{ fontSize: '1.5rem' }} onClick={closeMenu}>Protocol</a>
        <a href="#ai-engine" className="nav-link" style={{ fontSize: '1.5rem' }} onClick={closeMenu}>AI Engine</a>
        <a href="#tokenomics" className="nav-link" style={{ fontSize: '1.5rem' }} onClick={closeMenu}>Tokenomics</a>
        <a href="#roadmap" className="nav-link" style={{ fontSize: '1.5rem' }} onClick={closeMenu}>Roadmap</a>
        <a href="#audit" className="nav-link" style={{ fontSize: '1.5rem' }} onClick={closeMenu}>Audit</a>
        <button className="btn btn-primary" onClick={() => { setActiveView('app'); closeMenu(); }} style={{ width: '100%', marginTop: '2rem' }}>
          Launch App
        </button>
      </div>

      {/* Navigation */}
      <nav className="navbar">
        <div className="logo" onClick={() => setActiveView('landing')} style={{ cursor: 'pointer' }}>
          <img src={logo} alt="VampExAI Logo" style={{ height: '32px' }} />
          VampExAI
        </div>
        
        <div className="nav-links desktop-only">
          <a href="#protocol" className="nav-link">Protocol</a>
          <a href="#ai-engine" className="nav-link">AI Engine</a>
          <a href="#tokenomics" className="nav-link">Tokenomics</a>
          <a href="#roadmap" className="nav-link">Roadmap</a>
          <a href="#audit" className="nav-link">Audit</a>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="desktop-only" style={{ display: 'flex', gap: '1rem' }}>
            {account ? (
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <div className="btn btn-outline" style={{ cursor: 'default' }}>
                  <Wallet size={18} />
                  {account.slice(0, 6)}...{account.slice(-4)}
                </div>
                <button className="btn btn-outline" onClick={disconnectWallet} title="Disconnect" style={{ padding: '0.8rem' }}>
                  <LogOut size={18} color="#ef4444" />
                </button>
              </div>
            ) : (
              <button className="btn btn-outline" onClick={connectWallet}>
                Connect Wallet
              </button>
            )}
            <button className="btn btn-primary" onClick={() => setActiveView('app')}>
              <ArrowUpRight size={18} />
              Launch App
            </button>
          </div>
          <button className="mobile-menu-btn" onClick={toggleMenu}><Menu size={28} /></button>
        </div>
      </nav>

      {activeView === 'landing' ? (
        <>
          {/* Hero Section — transparent over fixed bg image */}
          <section style={{ 
            position: 'relative', 
            width: '100%', 
            height: '95vh',  
            display: 'flex', 
            alignItems: 'center',
            background: 'transparent'
          }}>
            <div className="app-container" style={{ width: '100%' }}>
              <div className="hero-content animated" style={{ 
                maxWidth: '520px', 
                background: 'rgba(5,2,20,0.52)', 
                backdropFilter: 'blur(18px)', 
                WebkitBackdropFilter: 'blur(18px)',
                padding: '2.5rem', 
                borderRadius: '24px', 
                border: '1px solid rgba(139,92,246,0.25)'
              }}>
                <div className="badge glass" style={{ padding: '0.4rem 1rem', borderRadius: '20px', marginBottom: '1.5rem', display: 'inline-block', fontSize: '0.75rem', color: '#00d4ff', border: '1px solid rgba(0,212,255,0.3)' }}>
                  🧠 AI-POWERED • BSC • NON-CUSTODIAL
                </div>
                <h1 style={{ fontSize: 'clamp(2rem, 4vw, 3rem)', marginBottom: '1rem', lineHeight: 1.15 }}>The Future of DeFi is <span className="gradient-text">Intelligent</span></h1>
                <p style={{ fontSize: '1rem', color: 'var(--text-secondary)', marginBottom: '2rem', lineHeight: '1.7' }}>
                  VampExAi combines advanced AI algorithms with immutable smart contracts to optimize your yield, minimize risk, and maximize returns — 24/7.
                </p>
                <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                  <button className="btn btn-primary" onClick={() => setActiveView('app')} style={{ padding: '0.9rem 2rem' }}>
                    Start Earning <ChevronRight size={18} />
                  </button>
                  <button className="btn btn-outline" style={{ padding: '0.9rem 2rem' }}>Documentation</button>
                </div>
                <div style={{ marginTop: '2rem', display: 'flex', gap: '1.5rem', flexWrap: 'wrap', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><ShieldCheck size={14} /> Non-Custodial</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Lock size={14} /> Immutable</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Shield size={14} /> Audited</span>
                </div>
              </div>
            </div>
          </section>

          {/* Price Ticker */}
          <div className="ticker-wrap">
            <div className="ticker">
              {[1, 2, 3].map(i => (
                <div key={i} className="ticker-item">
                  <span>VAMP TOKEN: <span style={{ color: '#22c55e' }}>$0.00124 ▲ +5.2%</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span>MARKET CAP: <span style={{ color: 'var(--cyber-blue)' }}>$1.24M</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span>HOLDERS: <span style={{ color: 'var(--liquid-gold)' }}>8,420</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                  <span>24H VOLUME: <span style={{ color: 'var(--cyber-blue)' }}>$245K</span></span>
                  <span style={{ color: 'var(--text-muted)' }}>|</span>
                </div>
              ))}
            </div>
          </div>

          {/* Features Section */}
          <section id="protocol" className="app-container">
            <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
              <h2 style={{ fontSize: '3rem' }}>Why <span className="gradient-text">VampExAi?</span></h2>
              <div className="divider" style={{ width: '150px', margin: '1.5rem auto 0 auto', height: '3px' }}></div>
            </div>
            <div className="dashboard-grid">
              {[
                { icon: <Brain />, title: "AI Yield Optimizer", desc: "Proprietary AI engine analyzes market conditions in real-time to auto-allocate funds across highest-yielding pools." },
                { icon: <Zap />, title: "Zero Gas Architecture", desc: "Optimized BSC infrastructure batches transactions to deliver near-zero gas fees for all users." },
                { icon: <Shield />, title: "Battle-Tested Security", desc: "Contracts audited by CertiK. Reentrancy guards, timelocks, and immutable logic protect every transaction." },
                { icon: <Globe />, title: "Global & Permissionless", desc: "No KYC. No borders. Connect your wallet and start earning in under 60 seconds from anywhere." },
                { icon: <Database />, title: "Sustainable Tokenomics", desc: "Fixed supply of 10,000,000 tokens. Deflationary mechanisms ensure long-term value appreciation." },
                { icon: <Users />, title: "Infinite Static Referral", desc: "Build your network and earn passive income from base to Infinite Static referral levels. Grow together with VampExAi." }
              ].map((f, i) => (
                <div key={i} className="card animated" style={{ borderTop: `4px solid ${i % 2 === 0 ? '#ff0040' : '#8b5cf6'}` }}>
                  <div style={{ color: i % 2 === 0 ? '#ff0040' : '#8b5cf6', marginBottom: '1.5rem' }}>{React.cloneElement(f.icon, { size: 40 })}</div>
                  <h3 style={{ marginBottom: '1rem' }}>{f.title}</h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', lineHeight: '1.6' }}>{f.desc}</p>
                </div>
              ))}
            </div>
          </section>

          {/* AI Engine Section */}
          <section id="ai-engine" className="app-container glass" style={{ borderRadius: '40px', margin: '4rem auto', padding: '4rem 3rem' }}>
            <div className="dashboard-grid" style={{ alignItems: 'center' }}>
              <div>
                <h2 style={{ fontSize: '2.5rem', marginBottom: '2rem' }}>The VampExAi <span className="gradient-text">Intelligence Engine</span></h2>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '2rem' }}>
                  Our AI doesn't just follow trends — it predicts them. Trained on millions of DeFi data points to continuously optimize your portfolio.
                </p>
                <div style={{ display: 'grid', gap: '1rem' }}>
                  {['Real-time sentiment analysis', 'Automated risk assessment', 'Predictive yield forecasting', 'MEV protection'].map((item, idx) => (
                    <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
                      <CheckCircle2 color="#22c55e" size={20} />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
                <button className="btn btn-primary" style={{ marginTop: '2.5rem' }}>
                  Explore AI Features <ChevronRight size={18} />
                </button>
              </div>
              <div style={{ position: 'relative', textAlign: 'center' }}>
                 <div style={{ width: '100%', height: '300px', background: 'radial-gradient(circle, rgba(255,0,64,0.1) 0%, transparent 70%)', display: 'flex', alignItems: 'center', justify: 'center' }}>
                    <Brain size={150} color="#ff0040" style={{ filter: 'drop-shadow(0 0 20px rgba(255,0,64,0.5))' }} />
                 </div>
              </div>
            </div>
          </section>

          {/* Tokenomics Section */}
          <section id="tokenomics" className="app-container">
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }}>Sustainable <span className="gradient-text">Tokenomics</span></h2>
            <div className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}>
              {[
                { icon: <Coins />, label: "Total Supply", val: "10,000,000" },
                { icon: <Globe />, label: "Network", val: "BSC (Mainnet)" },
                { icon: <Coins />, label: "Launch Price", val: "$0.001" },
                { icon: <Zap />, label: "Minting", val: "Forever Disabled" },
                { icon: <Lock />, label: "Security", val: "Immutable" },
                { icon: <Zap />, label: "Utility", val: "Yield & Governance" }
              ].map((t, i) => (
                <div key={i} className="card glass" style={{ textAlign: 'center', padding: '1.5rem' }}>
                  <div style={{ color: 'var(--primary-glow)', marginBottom: '1rem' }}>{React.cloneElement(t.icon, { size: 24 })}</div>
                  <div className="stat-label">{t.label}</div>
                  <div style={{ fontSize: '1.2rem', fontWeight: 800, marginTop: '0.5rem' }}>{t.val}</div>
                </div>
              ))}
            </div>
          </section>

          {/* Roadmap Section */}
          <section id="roadmap" className="app-container">
            <h2 style={{ textAlign: 'center', fontSize: '2.5rem', marginBottom: '4rem' }}>Development <span className="gradient-text">Roadmap</span></h2>
            <div style={{ position: 'relative', borderLeft: '2px solid var(--primary-glow)', marginLeft: '2rem', paddingLeft: '2rem' }}>
              {[
                { phase: "Phase 1: Foundation", items: ["Blockchain Architecture Design", "Consensus & Validator Model", "Native VAMP Token Launch"] },
                { phase: "Phase 2: Testnet", items: ["Public Testnet Deployment", "Validator Onboarding", "Bug Bounty Program"] },
                { phase: "Phase 3: Mainnet", items: ["Mainnet Activation", "Staking Rewards Enablement", "Governance initialization"] },
                { phase: "Phase 4: Ecosystem", items: ["Mobile Wallets", "Cross-chain Bridge Solutions", "Developer SDKs"] }
              ].map((p, i) => (
                <div key={i} style={{ marginBottom: '3rem', position: 'relative' }}>
                  <div style={{ position: 'absolute', left: '-2.7rem', top: '0', width: '20px', height: '20px', borderRadius: '50%', background: 'var(--primary-glow)', boxShadow: '0 0 10px var(--primary-glow)' }}></div>
                  <h3 style={{ marginBottom: '1rem', color: 'var(--primary-glow)' }}>{p.phase}</h3>
                  <div style={{ display: 'grid', gap: '0.5rem' }}>
                    {p.items.map((item, idx) => <span key={idx} style={{ color: 'var(--text-secondary)' }}>• {item}</span>)}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Security & Audit Section */}
          <section id="audit" className="app-container" style={{ textAlign: 'center' }}>
            <div className="card glass" style={{ padding: '4rem 2rem' }}>
              <Shield size={64} color="#ff0040" style={{ marginBottom: '2rem' }} />
              <h2 style={{ fontSize: '2.5rem', marginBottom: '1.5rem' }}>Security <span className="gradient-text">First</span></h2>
              <p style={{ maxWidth: '700px', margin: '0 auto 2.5rem', color: 'var(--text-secondary)' }}>
                VampExAi contracts follow industry-standard security practices. No admin withdrawal. No hidden minting. Fully transparent code verifiable on BSCScan.
              </p>
              <div style={{ display: 'flex', gap: '2rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                {['Immutable Contracts', 'Reentrancy Protection', 'On-Chain Verification', 'CertiK Audited'].map((s, i) => (
                  <div key={i} className="badge glass" style={{ padding: '0.8rem 1.5rem', borderRadius: '12px', border: '1px solid rgba(34, 197, 94, 0.3)', color: '#22c55e' }}>
                    ✓ {s}
                  </div>
                ))}
              </div>
            </div>
          </section>

          {/* Footer Highlights */}
          <footer style={{ padding: '6rem 2rem 3rem', textAlign: 'center', borderTop: '1px solid rgba(139,92,246,0.15)', marginTop: '4rem' }}>
            <div className="app-container" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '3rem', textAlign: 'left', marginBottom: '3rem' }}>
              {/* Brand Column */}
              <div>
                <div className="logo" style={{ marginBottom: '1.2rem', fontSize: '1.8rem' }}>VampExAI</div>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.7' }}>The future of decentralized intelligent finance. Built for security, optimized for yield.</p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(139,92,246,0.12)', border: '1px solid rgba(139,92,246,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    <Globe size={18} color="#8b5cf6" />
                  </div>
                  <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(0,212,255,0.1)', border: '1px solid rgba(0,212,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.3s ease' }}>
                    <Users size={18} color="#00d4ff" />
                  </div>
                </div>
              </div>

              {/* Protocol Links Column */}
              <div>
                <h4 style={{ marginBottom: '1.5rem', fontSize: '1rem', letterSpacing: '1.5px', textTransform: 'uppercase', background: 'linear-gradient(to right, #8b5cf6, #00d4ff)', WebkitBackgroundClip: 'text', backgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Protocol</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
                  {[
                    { label: 'AI Reward Logic', icon: <Brain size={16} />, color: '#ff0040' },
                    { label: 'Staking Pools', icon: <Coins size={16} />, color: '#8b5cf6' },
                    { label: 'Audit Report', icon: <ShieldCheck size={16} />, color: '#00d4ff' }
                  ].map((item, i) => (
                    <a key={i} href="#" style={{
                      display: 'flex', alignItems: 'center', gap: '0.8rem',
                      padding: '0.75rem 1rem', borderRadius: '12px',
                      background: 'rgba(10, 5, 30, 0.5)',
                      border: '1px solid rgba(139,92,246,0.12)',
                      color: 'var(--text-secondary)', fontSize: '0.9rem',
                      textDecoration: 'none',
                      transition: 'all 0.35s ease',
                      backdropFilter: 'blur(8px)'
                    }}
                    onMouseEnter={e => {
                      e.currentTarget.style.borderColor = item.color;
                      e.currentTarget.style.boxShadow = `0 0 20px ${item.color}33, inset 0 0 15px ${item.color}15`;
                      e.currentTarget.style.color = '#fff';
                      e.currentTarget.style.transform = 'translateX(6px)';
                    }}
                    onMouseLeave={e => {
                      e.currentTarget.style.borderColor = 'rgba(139,92,246,0.12)';
                      e.currentTarget.style.boxShadow = 'none';
                      e.currentTarget.style.color = 'var(--text-secondary)';
                      e.currentTarget.style.transform = 'translateX(0)';
                    }}
                    >
                      <span style={{ color: item.color, display: 'flex', alignItems: 'center' }}>{item.icon}</span>
                      {item.label}
                      <ChevronRight size={14} style={{ marginLeft: 'auto', opacity: 0.4 }} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            {/* Divider line */}
            <div className="divider" style={{ width: '100%', height: '1px', margin: '0 auto 1.5rem' }}></div>

            <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', letterSpacing: '0.5px' }}>
              © 2026 VampExAI Protocol. Decentralized • Transparent • Permissionless
            </div>
          </footer>
        </>
      ) : (
        <div className="app-main animated" style={{ padding: '2rem' }}>
          <button className="btn btn-outline" onClick={() => setActiveView('landing')} style={{ marginBottom: '2rem' }}>
            ← Back to Landing
          </button>
          
          {/* Status Messages */}
          {status.message && (
            <div className={`animated card`} style={{ marginBottom: '2rem', borderLeft: `4px solid ${status.type === 'error' ? '#ef4444' : '#22c55e'}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {status.type === 'error' ? <AlertCircle color="#ef4444" /> : <CheckCircle2 color="#22c55e" />}
                <p>{status.message}</p>
              </div>
            </div>
          )}

          {fetchError && (
            <div className="card" style={{ marginBottom: '2rem', background: 'rgba(239, 68, 68, 0.1)', borderColor: '#ef4444' }}>
              <h4 style={{ color: '#ef4444' }}>Protocol Connection Error</h4>
              <p style={{ fontSize: '0.8rem', marginTop: '0.5rem' }}>{fetchError}</p>
            </div>
          )}

      {account && fetchingProfile && (
        <div className="card animated" style={{ textAlign: 'center', padding: '3rem' }}>
          <p>Syncing with Blockchain Protocol...</p>
        </div>
      )}

      {account && !fetchingProfile && !userProfile?.isRegistered && (
        <section className="animated card" style={{ marginBottom: '3rem' }}>
          <h2 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ShieldCheck color="#8b5cf6" />
            Complete Registration
          </h2>
          <div className="dashboard-grid">
            <div className="input-group">
              <label>Sponsor/Referrer Wallet Address</label>
              <input 
                placeholder="Enter Sponsor's 0x Address" 
                value={referralInput} 
                onChange={(e) => setReferralInput(e.target.value)}
              />
            </div>
            <div className="input-group">
              <label>Secret Recovery Password (SAVE THIS!)</label>
              <input 
                type="password" 
                placeholder="Enter a strong password" 
                value={secretInput} 
                onChange={(e) => setSecretInput(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleRegister} disabled={loading}>
            {loading ? 'Processing...' : 'Register Account'}
          </button>
        </section>
      )}

      {account && !fetchingProfile && userProfile?.isRegistered && (
        <main className="dashboard-grid">
          <div className="card animated">
            <div className="stat-label">Total Balance</div>
            <div className="stat-value">{Number(balance).toFixed(2)} VAMP</div>
            <div className="stat-label" style={{ color: '#8b5cf6', marginTop: '1rem' }}>Currently Staked</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 700 }}>{userProfile.totalStaked} VAMP</div>
          </div>

          <div className="card animated">
            <h3 style={{ marginBottom: '1.5rem', fontSize: '1.2rem' }}>New Stake</h3>
            <div className="input-group">
              <label>Amount to Stake (100 Days Lock)</label>
              <input 
                type="number" 
                placeholder="0.00" 
                value={stakeAmount} 
                onChange={(e) => setStakeAmount(e.target.value)}
              />
            </div>
            <div style={{ marginBottom: '1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
              ROI: 1% Daily | Total 200% Returns
            </div>
            <button className="btn btn-primary" style={{ width: '100%' }} onClick={handleStake} disabled={loading}>
              <Lock size={18} />
              {loading ? 'Approving...' : 'Stake Now'}
            </button>
          </div>

          <div className="card animated">
            <div className="stat-label">Referral Rewards</div>
            <div className="stat-value" style={{ color: '#22c55e' }}>{userProfile.referralRewards} VAMP</div>
            <button className="btn btn-outline" style={{ width: '100%', marginBottom: '1rem' }} onClick={handleClaimReferral} disabled={loading}>
              <ArrowUpRight size={18} />
              Claim Referral Bonus
            </button>
            <div className="glass" style={{ padding: '1rem', borderRadius: '12px', fontSize: '0.8rem' }}>
              <div style={{ color: 'var(--text-secondary)', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Users size={14} /> My Referral Link
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input 
                  readOnly 
                  value={`${window.location.origin}${window.location.pathname}?ref=${account}`}
                  style={{ background: 'rgba(0,0,0,0.2)', border: 'none', padding: '0.5rem', borderRadius: '6px', width: '100%', fontSize: '0.7rem', color: '#8b5cf6' }}
                />
                <button 
                  className="btn btn-outline" 
                  style={{ padding: '0.5rem' }} 
                  onClick={() => {
                    navigator.clipboard.writeText(`${window.location.origin}${window.location.pathname}?ref=${account}`);
                    notify('success', 'Link copied to clipboard!');
                  }}
                >
                  <Copy size={14} />
                </button>
              </div>
            </div>
          </div>

          <div className="card animated" style={{ gridColumn: '1 / -1' }}>
            <h3 style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <History color="#8b5cf6" />
              Active Stakes
            </h3>
            <div className="stake-list">
              {stakes.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#94a3b8', padding: '2rem' }}>No stakes found.</div>
              ) : (
                stakes.map((s, idx) => (
                  <div key={idx} className="stake-item">
                    <div>
                      <div style={{ fontWeight: 600 }}>{s.amount} VAMP</div>
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                        Started: {new Date(s.startTime * 1000).toLocaleDateString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#22c55e', fontWeight: 600 }}>+{s.pendingReward} VAMP</div>
                      {s.withdrawn ? (
                        <span className="badge badge-success">Withdrawn</span>
                      ) : (
                        <button 
                          className="btn btn-outline" 
                          style={{ padding: '0.4rem 0.8rem', fontSize: '0.75rem' }}
                          onClick={() => handleWithdraw(s.index)}
                          disabled={loading}
                        >
                          Withdraw
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </main>
      )}

      {!account && (
        <section className="animated" style={{ textAlign: 'center', padding: '5rem 0' }}>
          <img src={logo} alt="VampExAI Logo" style={{ height: '120px', marginBottom: '2rem' }} />
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>Earn 1% Daily Rewards</h1>
          <p style={{ color: '#94a3b8', maxWidth: '600px', margin: '0 auto 2rem' }}>
            Secure your VAMP tokens in the high-yield protocol. 100 days lock period with transparent blockchain verification.
          </p>
          <button className="btn btn-primary" style={{ margin: '0 auto', padding: '1rem 3rem' }} onClick={connectWallet}>
            Explore Dashboard
          </button>
        </section>
      )}

          <footer style={{ marginTop: '5rem', textAlign: 'center', color: '#475569', fontSize: '0.9rem' }}>
            © 2026 VampExAI Protocol. Powered by Blockchain Intelligence.
          </footer>
        </div>
      )}
    </div>
  );
}

export default App;
