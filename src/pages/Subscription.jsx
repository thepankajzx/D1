import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import './Subscription.css';

export default function Subscription() {
    const [selectedPlan, setSelectedPlan] = useState('yearly'); // 'quarterly' or 'yearly'
    const navigate = useNavigate();

    const handleUpgrade = () => {
        const text = "I WANT TO UPGRADE, SHARE THE PAYMENT DETAILS";
        const url = `https://wa.me/917018168156?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="subscription-page">
            <div className="container">
                {/* Hero Section */}
                <header className="hero">
                    <div className="hero-left">
                        <button 
                            onClick={() => navigate(-1)}
                            className="w-9 h-9 rounded-full flex items-center justify-center bg-on-surface text-surface hover:opacity-80 transition-opacity shadow-sm mb-3 shrink-0"
                            aria-label="Go back"
                        >
                            <Icon name="arrow_back" className="text-lg" />
                        </button>
                        
                        <div className="top-badge">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            Manage Subscription
                        </div>
                        
                        <h1>
                            Don't Just Build Habits.
                            <span className="gradient-text">Master Your Consistency.</span>
                        </h1>
                        
                        <p className="desc">
                            Consistency becomes effortless when every metric is transparent. 
                            Track daily routines, analyze behavioral bottlenecks, and unlock deep performance diagnostics.
                        </p>

                        <div className="hero-bullets">
                            <div className="hero-bullet">
                                <div className="hero-bullet-icon icon-green">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                </div>
                                <div><strong>Free</strong> gives you core tracking for up to 8 habits, daily check-offs, 7D/14D stats, and streaks.</div>
                            </div>
                            <div className="hero-bullet">
                                <div className="hero-bullet-icon icon-purple">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><polyline points="22 8.5 12 15.5 2 8.5"></polyline><polyline points="2 15.5 12 8.5 22 15.5"></polyline><line x1="12" y1="2" x2="12" y2="8.5"></line></svg>
                                </div>
                                <div><strong>Pro</strong> unlocks unlimited habits, custom date ranges, deep dive trend analytics, recovery resilience scores, and pro behavioral action plans.</div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="hero-right">
                        <div className="analytics-wrapper">
                            
                            {/* Dotted connecting lines */}
                            <div className="hub-lines">
                                <svg>
                                    <line x1="50%" y1="10%" x2="50%" y2="90%"></line>
                                    <line x1="10%" y1="50%" x2="90%" y2="50%"></line>
                                </svg>
                            </div>
                            
                            {/* Center Star Hub */}
                            <div className="hub-center">
                                <div className="hub-glow"></div>
                                <div className="hub-icon">
                                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                </div>
                            </div>
                            
                            {/* The 2x2 Grid with mock cards */}
                            <div className="analytics-grid">
                                
                                {/* Card 1: Heatmap */}
                                <div className="mock-card">
                                    <div className="mc-header">
                                        <div>
                                            <div className="mc-title">Daily Consistency</div>
                                            <div className="mc-sub">Last 30 Days</div>
                                        </div>
                                        <div className="mc-badge free">FREE</div>
                                    </div>
                                    <div className="heatmap-grid">
                                        <div className="hm-cell lvl-2"></div>
                                        <div className="hm-cell lvl-3"></div>
                                        <div className="hm-cell lvl-1"></div>
                                        <div className="hm-cell"></div>
                                        <div className="hm-cell lvl-3"></div>
                                        <div className="hm-cell lvl-2"></div>
                                        <div className="hm-cell"></div>
                                        
                                        <div className="hm-cell lvl-1"></div>
                                        <div className="hm-cell"></div>
                                        <div className="hm-cell lvl-3"></div>
                                        <div className="hm-cell lvl-2"></div>
                                        <div className="hm-cell"></div>
                                        <div className="hm-cell lvl-1"></div>
                                        <div className="hm-cell lvl-3"></div>
                                        
                                        <div className="hm-cell"></div>
                                        <div className="hm-cell lvl-3"></div>
                                        <div className="hm-cell lvl-1"></div>
                                        <div className="hm-cell lvl-2"></div>
                                        <div className="hm-cell lvl-3"></div>
                                        <div className="hm-cell"></div>
                                        <div className="hm-cell lvl-1"></div>
                                    </div>
                                </div>
                                
                                {/* Card 2: Trend Line */}
                                <div className="mock-card">
                                    <div className="mc-header">
                                        <div>
                                            <div className="mc-title">Long-term Trends</div>
                                            <div className="mc-sub">+24% vs last month</div>
                                        </div>
                                        <div className="pro-badge">PRO</div>
                                    </div>
                                    <div style={{height: '50px', position: 'relative'}}>
                                         <svg viewBox="0 0 100 40" preserveAspectRatio="none" style={{position: 'absolute', bottom: 0, left: 0, width: '100%', height: '100%'}}>
                                            <defs>
                                                <linearGradient id="gTrend" x1="0" x2="0" y1="0" y2="1">
                                                    <stop offset="0%" stopColor="#4F46E5" stopOpacity="0.2"/>
                                                    <stop offset="100%" stopColor="#4F46E5" stopOpacity="0"/>
                                                </linearGradient>
                                            </defs>
                                            <path d="M0,35 Q15,15 30,25 T55,10 T75,25 L85,5 L100,20 L100,40 L0,40 Z" fill="url(#gTrend)"/>
                                            <path d="M0,35 Q15,15 30,25 T55,10 T75,25 L85,5 L100,20" fill="none" stroke="#4F46E5" strokeWidth="2.5" strokeLinecap="round"/>
                                            <circle cx="85" cy="5" r="3" fill="white" stroke="#4F46E5" strokeWidth="2"/>
                                        </svg>
                                    </div>
                                </div>
                                
                                {/* Card 3: Goal Ring */}
                                <div className="mock-card" style={{alignItems: 'center', paddingTop: '24px'}}>
                                    <div className="mc-badge free" style={{position: 'absolute', top: '12px', right: '12px'}}>FREE</div>
                                    <div style={{width: '50px', height: '50px', borderRadius: '50%', background: 'conic-gradient(var(--sub-brand-green) 83%, #E2E8F0 83%)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '8px'}}>
                                        <div style={{width: '38px', height: '38px', borderRadius: '50%', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: '0.85rem'}}>83%</div>
                                    </div>
                                    <div className="mc-title">Goal Strike</div>
                                    <div className="mc-sub" style={{marginBottom: 0}}>All Habits</div>
                                </div>
                                
                                {/* Card 4: Pro Bars */}
                                <div className="mock-card">
                                    <div className="mc-header">
                                        <div>
                                            <div className="mc-title">Pro Insights</div>
                                            <div className="mc-sub">Top 5% Performer</div>
                                        </div>
                                        <div className="pro-badge">PRO</div>
                                    </div>
                                    <div className="bar-chart-mock">
                                        <div className="mock-bar" style={{height: '30%'}}></div>
                                        <div className="mock-bar semi" style={{height: '20%'}}></div>
                                        <div className="mock-bar active" style={{height: '90%', position: 'relative'}}>
                                            <div style={{position: 'absolute', top: '-16px', left: '50%', transform: 'translateX(-50%)', background: 'var(--sub-text-main)', color: 'white', fontSize: '0.5rem', fontWeight: 800, padding: '2px 4px', borderRadius: '2px'}}>98%</div>
                                        </div>
                                        <div className="mock-bar semi" style={{height: '50%'}}></div>
                                        <div className="mock-bar" style={{height: '35%'}}></div>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                    
                </header>

                {/* NEW COMBINED LAYOUT: 2x2 Grid */}
                <section className="comparison-layout">
                    
                    {/* ROW 1, COL 1: Free Plan */}
                    <article className="card free-pricing">
                        <div className="card-icon icon-free-card">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
                        </div>
                        
                        <h2>Free</h2>
                        <p className="sub">Essential tracking to build daily discipline.</p>
                        
                        <div className="price-wrap">
                            <div className="price">₹0</div>
                            <div className="price-span">Forever free</div>
                        </div>

                        <ul className="card-list">
                            <li><svg className="check-green" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Track up to 8 habits daily</li>
                            <li><svg className="check-green" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> 7-Day & 14-Day analytics views</li>
                            <li><svg className="check-green" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Streaks & milestone badges</li>
                        </ul>

                        <button className="btn btn-outline cursor-default">Current Plan <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg></button>
                    </article>
                    
                    {/* ROW 2, COL 1: Free Features */}
                    <div className="feature-card free-features">
                        <div className="fc-header">
                            <div className="fc-icon fc-icon-green">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect><rect x="3" y="14" width="7" height="7"></rect></svg>
                            </div>
                            <div>
                                <div className="fc-title">What's included in Free</div>
                                <div className="fc-sub">Core capabilities for daily habit building.</div>
                            </div>
                        </div>
                        
                        <div className="pills-container">
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Up to 8 Habits</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Up to 5 Custom Habits</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Daily Scoring Engine</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Streak Tracking</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> 9 Milestone Badges (Up to 365D)</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> 7D & 14D Heatmap Views</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Core Diagnostics Overview</span>
                        </div>
                    </div>

                    {/* ROW 1, COL 2: Pro Plan */}
                    <article className="card card-pro pro-pricing">
                        <div className="card-header-flex">
                            <div className="card-icon icon-pro-card">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><polyline points="22 8.5 12 15.5 2 8.5"></polyline><polyline points="2 15.5 12 8.5 22 15.5"></polyline><line x1="12" y1="2" x2="12" y2="8.5"></line></svg>
                            </div>
                            <div className="popular-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                Most Popular
                            </div>
                        </div>
                        
                        <h2>Pro</h2>
                        <p className="sub">Full analytics suite, diagnostics, and unlimited power.</p>

                        <div className="radio-group">
                            <label className={`radio-label ${selectedPlan === 'quarterly' ? 'active' : ''}`} onClick={() => setSelectedPlan('quarterly')}>
                                <div className="radio-left">
                                    <div className="custom-radio"></div>
                                    <div>
                                        <div className="radio-text-main">91 Days</div>
                                        <div className="radio-text-sub">One-time payment</div>
                                    </div>
                                </div>
                                <div className="radio-price">
                                    <div className="r-price">₹199</div>
                                </div>
                            </label>

                            <label className={`radio-label ${selectedPlan === 'yearly' ? 'active' : ''}`} onClick={() => setSelectedPlan('yearly')}>
                                <div className="radio-left">
                                    <div className="custom-radio"></div>
                                    <div>
                                        <div className="radio-text-main">Yearly <span className="save-badge">SAVE 20%</span></div>
                                        <div className="radio-text-sub">Billed once a year</div>
                                    </div>
                                </div>
                                <div className="radio-price">
                                    <div className="r-price">₹599</div>
                                    <div className="r-strike">₹749</div>
                                </div>
                            </label>
                        </div>

                        <ul className="card-list" style={{marginBottom: '24px'}}>
                            <li><svg className="check-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Everything in Free</li>
                            <li><svg className="check-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Unlimited habits & custom habits</li>
                            <li><svg className="check-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Custom date ranges & 30D/90D/All stats</li>
                            <li><svg className="check-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 8v8H4V8h4zm2 0h4v8h-4V8zm6 0h4v8h-4V8z"></path></svg> Recovery Hub & Pro Action Plans</li>
                        </ul>

                        <button className="btn btn-primary" onClick={handleUpgrade}>
                            Upgrade to Pro 
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                        </button>
                        <div className="secure-text">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg> Instant activation via WhatsApp
                        </div>
                    </article>

                    {/* ROW 2, COL 2: Pro Features */}
                    <div className="feature-card pro-features">
                        <div className="fc-header">
                            <div className="fc-icon fc-icon-purple">
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><polyline points="22 8.5 12 15.5 2 8.5"></polyline><polyline points="2 15.5 12 8.5 22 15.5"></polyline><line x1="12" y1="2" x2="12" y2="8.5"></line></svg>
                            </div>
                            <div>
                                <div className="fc-title">What Pro unlocks</div>
                                <div className="fc-sub">Everything in Free, plus the complete diagnostic suite.</div>
                            </div>
                        </div>
                        
                        <div className="pills-container">
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="13 2 13 9 20 9"></polyline><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path></svg> Unlimited Habits</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Unlimited Custom Habits</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg> Custom Date Range Picker</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> 30D, 90D & All-Time Analytics</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline></svg> Full Habit Deep Dive Suite</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg> Recovery Hub & Resilience Scores</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg> Pro Behavioral Action Plans</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Advanced Multi-Year Heatmaps</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20v-6M6 20V10M18 20V4"></path></svg> Priority Mode & Habit Weighting</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="7 10 12 15 17 10"></polyline><line x1="12" y1="15" x2="12" y2="3"></line></svg> Historical Data Migration Tool</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Pro Member Badge & Priority Support</span>
                        </div>
                    </div>

                </section>

                {/* Trust Footer */}
                <footer className="trust-footer">
                    <div className="trust-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                        <div>
                            <div className="trust-title">Secure & Private</div>
                            <div className="trust-desc">Your data is encrypted and always protected.</div>
                        </div>
                    </div>
                    
                    <div className="trust-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path><polyline points="3 3 3 8 8 8"></polyline></svg>
                        <div>
                            <div className="trust-title">Cancel Anytime</div>
                            <div className="trust-desc">No commitments. You're in control.</div>
                        </div>
                    </div>
                    
                    <div className="trust-item">
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path></svg>
                        <div>
                            <div className="trust-title">Built for You</div>
                            <div className="trust-desc">Designed to help you build a better you.</div>
                        </div>
                    </div>
                </footer>
            </div>
        </div>
    );
}
