import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../components/Icon';
import { useLanguage } from '../contexts/LanguageContext';
import './Subscription.css';

/**
 * Android MVP Subscription Page
 * Google Play Policy Compliant:
 * - 100% Free Consumer Edition
 * - Labeled clearly as 'D1 OS Pro — Coming Soon'
 * - Zero prices, zero checkout, zero external payment links
 */
export default function Subscription() {
    const { isHinglish } = useLanguage();
    const navigate = useNavigate();

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
                            D1 OS Free Edition
                        </div>
                        
                        <h1>
                            Don't Just Build Habits.
                            <span className="gradient-text">Master Your Consistency.</span>
                        </h1>
                        
                        <p className="desc">
                            Consistency becomes effortless when every metric is transparent. 
                            Track daily routines, analyze behavioral patterns, and master your consistency with D1 OS.
                        </p>

                        <div className="hero-bullets">
                            <div className="hero-bullet">
                                <div className="hero-bullet-icon icon-green">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"></polygon></svg>
                                </div>
                                <div><strong>Free</strong> gives you core tracking for habits, daily check-offs, 7D/14D stats, and streaks.</div>
                            </div>
                            <div className="hero-bullet">
                                <div className="hero-bullet-icon icon-purple">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><polyline points="22 8.5 12 15.5 2 8.5"></polyline><polyline points="2 15.5 12 8.5 22 15.5"></polyline><line x1="12" y1="2" x2="12" y2="8.5"></line></svg>
                                </div>
                                <div><strong>D1 OS Pro</strong> is coming soon with extended analytics, deep dive metrics, and advanced action plans.</div>
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
                                    </div>
                                    <div className="mc-footer">
                                        <span className="dot dot-green"></span> 88% Consistency Score
                                    </div>
                                </div>

                                <div className="mock-card">
                                    <div className="mc-header">
                                        <div>
                                            <div className="mc-title">Longest Streak</div>
                                            <div className="mc-sub">Consistency Chain</div>
                                        </div>
                                        <div className="mc-badge free">FREE</div>
                                    </div>
                                    <div className="spark-wrapper">
                                        <div className="spark-val">42 Days</div>
                                        <div className="spark-sub">Current streak active</div>
                                    </div>
                                    <div className="mc-footer">
                                        <span className="dot dot-purple"></span> Flame engine tracking
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </header>

                {/* 2x2 Comparison Grid */}
                <section className="comparison-layout">
                    {/* ROW 1, COL 1: Free Plan */}
                    <article className="card free-pricing">
                        <div className="card-icon icon-free-card">
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z"></path><path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12"></path></svg>
                        </div>
                        
                        <h2>Free Plan</h2>
                        <p className="sub">Essential tracking to build daily discipline.</p>
                        
                        <div className="price-wrap">
                            <div className="price">Free</div>
                            <div className="price-span">Included in D1 OS</div>
                        </div>

                        <ul className="card-list">
                            <li><svg className="check-green" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Track active habits daily</li>
                            <li><svg className="check-green" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> 7-Day & 14-Day analytics views</li>
                            <li><svg className="check-green" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Streaks & milestone badges</li>
                            <li><svg className="check-green" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> AI Habit Coach assistant</li>
                        </ul>

                        <button className="btn btn-outline cursor-default">
                            Active Plan
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
                        </button>
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
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Active Habit Tracking</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Custom Habits</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Daily Scoring Engine</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Streak Tracking</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> 9 Milestone Badges (Up to 365D)</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> 7D & 14D Heatmap Views</span>
                            <span className="pill pill-free"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Core Diagnostics Overview</span>
                        </div>
                    </div>

                    {/* ROW 1, COL 2: Pro Plan (Coming Soon) */}
                    <article className="card card-pro pro-pricing">
                        <div className="card-header-flex">
                            <div className="card-icon icon-pro-card">
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 22 8.5 22 15.5 12 22 2 15.5 2 8.5 12 2"></polygon><line x1="12" y1="22" x2="12" y2="15.5"></line><polyline points="22 8.5 12 15.5 2 8.5"></polyline><polyline points="2 15.5 12 8.5 22 15.5"></polyline><line x1="12" y1="2" x2="12" y2="8.5"></line></svg>
                            </div>
                            <div className="popular-badge">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                                {isHinglish ? 'शीघ्र आ रहा है' : 'Coming Soon'}
                            </div>
                        </div>
                        
                        <h2>D1 OS Pro — Coming Soon</h2>
                        <p className="sub">Extended analytics, deeper trends, and advanced habit tools.</p>

                        {/* Informational Callout */}
                        <div className="rounded-xl p-3 mb-4 text-center border border-indigo-200 dark:border-indigo-800 bg-indigo-50/50 dark:bg-indigo-950/30 text-indigo-900 dark:text-indigo-200">
                            <div className="text-xs font-black flex items-center justify-center gap-1.5 mb-0.5">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <circle cx="12" cy="12" r="10"></circle>
                                    <line x1="12" y1="8" x2="12" y2="12"></line>
                                    <line x1="12" y1="16" x2="12.01" y2="16"></line>
                                </svg>
                                <span>{isHinglish ? 'D1 OS पूरी तरह मुफ़्त है' : 'D1 OS is 100% Free'}</span>
                            </div>
                            <p className="text-[11px] font-medium opacity-90 leading-tight">
                                {isHinglish 
                                    ? 'वर्तमान में सभी मुख्य आदत ट्रैकिंग फीचर्स मुफ़्त उपलब्ध हैं। प्रो फीचर्स भविष्य के अपडेट में आएंगे।' 
                                    : 'All core habit tracking features are currently available at no charge. Pro features will launch in a future update.'}
                            </p>
                        </div>

                        <ul className="card-list" style={{marginBottom: '24px'}}>
                            <li><svg className="check-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><path d="M9 12l2 2 4-4"></path></svg> Everything in Free</li>
                            <li><svg className="check-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"></line><line x1="12" y1="20" x2="12" y2="4"></line><line x1="6" y1="20" x2="6" y2="14"></line></svg> Unlimited habits & custom habits</li>
                            <li><svg className="check-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path><polyline points="14 2 14 8 20 8"></polyline><line x1="16" y1="13" x2="8" y2="13"></line><line x1="16" y1="17" x2="8" y2="17"></line><polyline points="10 9 9 9 8 9"></polyline></svg> Custom date ranges & extended stats</li>
                            <li><svg className="check-purple" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M8 8v8H4V8h4zm2 0h4v8h-4V8zm6 0h4v8h-4V8z"></path></svg> Recovery Hub & Pro Action Plans</li>
                        </ul>

                        <div className="w-full py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-sm text-center flex items-center justify-center gap-2 cursor-default">
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg>
                            <span>{isHinglish ? 'D1 OS Pro — शीघ्र आ रहा है' : 'D1 OS Pro — Coming Soon'}</span>
                        </div>
                        <div className="secure-text">
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
                            {isHinglish ? 'निःशुल्क उपभोक्ता संस्करण' : 'Free Consumer Edition for Android'}
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
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Unlimited Active Habits</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Unlimited Custom Habits</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Recovery Hub & Resilience</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Pro Action Plans</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> 30D / 90D / All-Time Stats</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Power Duo Correlations</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Behavioral Drift Detection</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> 30-Day Better Report</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Streak Speedometer Engine</span>
                            <span className="pill pill-pro"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon></svg> Pro Member Badge & Support</span>
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
                            <div className="trust-title">100% Free MVP</div>
                            <div className="trust-desc">Enjoy full core tracking features with zero cost.</div>
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
