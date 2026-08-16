import React from 'react';
import Icon from './Icon';

export default function ScoringModal({ type, onClose }) {
  if (!type) return null;

  return (
    <div className={`scoring-modal-overlay ${type ? 'active' : ''}`} onClick={onClose}>
        <div className="scoring-modal" onClick={e => e.stopPropagation()}>
            <div className="sm-header">
                <div className="sm-header-text">
                    <h2><Icon name="science" className="text-primary" /> How Scoring Works</h2>
                    <p>We use smart scoring engines to evaluate your habits fairly. Each habit follows a specific logic based on its type, target and tolerance.</p>
                </div>
                <button className="btn-close-modal" onClick={onClose}>
                    <Icon name="close" />
                </button>
            </div>

            <div className="sm-body">
                {type === 'all' && (
                  <div className="sm-overview" id="scoring-overview">
                      <div className="smo-card">
                          <div className="smo-icon"><Icon name="radar" /></div>
                          <h4>Target Based</h4>
                          <p>Every habit has a target you set.</p>
                      </div>
                      <div className="smo-card">
                          <div className="smo-icon" style={{color:'#10B981', background:'#D1FAE5'}}><Icon name="flaky" /></div>
                          <h4>Tolerance Window</h4>
                          <p>You get full score within your tolerance range.</p>
                      </div>
                      <div className="smo-card">
                          <div className="smo-icon" style={{color:'#3B82F6', background:'#DBEAFE'}}><Icon name="ssid_chart" /></div>
                          <h4>Score Adjusts</h4>
                          <p>Score increases or decreases gradually.</p>
                      </div>
                      <div className="smo-card">
                          <div className="smo-icon" style={{color:'#F59E0B', background:'#FEF3C7'}}><Icon name="score" /></div>
                          <h4>100 to 0 Scale</h4>
                          <p>All habits are scored between 0 and 100.</p>
                      </div>
                  </div>
                )}

                {/* Target Time */}
                {(type === 'all' || type === 'target_time') && (
                <div className="engine-row" id="engine-target-time">
                    <div className="er-info">
                        <div className="er-title">
                            <div className="er-icon" style={{color:'#10B981'}}><Icon name="schedule" /></div>
                            1. Target Time
                        </div>
                        <div className="er-badge">Most Used</div>
                        <div className="er-desc">You get full score when you complete the habit within the tolerance window around the target time.</div>
                    </div>
                    
                    <div className="er-visual">
                        <div className="er-visual-title">How it works</div>
                        <svg className="chart-svg" viewBox="0 0 300 100">
                            <line x1="10" y1="80" x2="290" y2="80" className="axis-line" />
                            <path className="chart-area" fill="#10B981" d="M 20 80 L 80 80 L 120 20 L 180 20 L 220 80 L 280 80 Z" />
                            <path className="chart-line chart-point-green" stroke="#10B981" d="M 20 80 L 80 80 L 120 20 L 180 20 L 220 80 L 280 80" />
                            <circle cx="150" cy="20" r="4" className="chart-point chart-point-green"/>
                            <text x="150" y="10" textAnchor="middle" className="chart-text" fill="#10B981">Target Time</text>
                            <text x="50" y="50" textAnchor="middle" className="chart-text">Drops</text>
                            <text x="250" y="50" textAnchor="middle" className="chart-text">Drops</text>
                        </svg>
                    </div>

                    <div className="er-table-box">
                        <div className="er-example-title">Example <span>(Target: 7:00 AM)</span></div>
                        <table className="sm-table">
                            <tbody>
                            <tr><th>You Complete</th><th style={{textAlign:'right'}}>Score</th></tr>
                            <tr><td>6:50 AM</td><td className="score-val">100 <Icon name="check" className="text-[#10B981]" /></td></tr>
                            <tr><td>7:15 AM</td><td className="score-val">100 <Icon name="check" className="text-[#10B981]" /></td></tr>
                            <tr><td>7:45 AM</td><td className="score-val">75 <Icon name="check" className="text-[#F59E0B]" /></td></tr>
                            <tr><td>8:15 AM</td><td className="score-val">40 <Icon name="check" className="text-[#F59E0B]" /></td></tr>
                            <tr><td>9:00 AM</td><td className="score-val">0 <Icon name="close" className="text-[#EF4444]" /></td></tr>
                            </tbody>
                        </table>
                        <div className="best-for">
                            <h5>Best for</h5>
                            <ul>
                                <li><Icon name="check" className="text-primary text-[14px]" /> Wake Up</li>
                                <li><Icon name="check" className="text-primary text-[14px]" /> Sleep Time</li>
                            </ul>
                        </div>
                    </div>
                </div>
                )}

                {/* Duration */}
                {(type === 'all' || type === 'duration' || type === 'numeric' || type === 'higher') && (
                <div className="engine-row" id="engine-duration">
                    <div className="er-info">
                        <div className="er-title">
                            <div className="er-icon" style={{color:'#3B82F6'}}><Icon name="trending_up" /></div>
                            2. Duration / Higher is Better
                        </div>
                        <div className="er-desc">The longer or higher you go (up to your target), the higher your score.</div>
                    </div>
                    
                    <div className="er-visual">
                        <div className="er-visual-title">How it works</div>
                        <svg className="chart-svg" viewBox="0 0 300 100">
                            <line x1="10" y1="80" x2="290" y2="80" className="axis-line" />
                            <path className="chart-area" fill="#3B82F6" opacity="0.1" d="M 20 80 L 150 20 L 280 20 L 280 80 Z" />
                            <path className="chart-line" stroke="#3B82F6" d="M 20 80 L 150 20 L 280 20" />
                            <circle cx="150" cy="20" r="4" className="chart-point" stroke="#3B82F6"/>
                            <text x="150" y="10" textAnchor="middle" className="chart-text" fill="#3B82F6">Target</text>
                            <text x="20" y="95" className="chart-text">0</text>
                        </svg>
                    </div>

                    <div className="er-table-box">
                        <div className="er-example-title">Example <span>(Target: 45 min)</span></div>
                        <table className="sm-table">
                            <tbody>
                            <tr><th>You Do</th><th style={{textAlign:'right'}}>Score</th></tr>
                            <tr><td>45m or more</td><td className="score-val">100 <Icon name="check" className="text-[#10B981]" /></td></tr>
                            <tr><td>30 min</td><td className="score-val">70 <Icon name="check" className="text-[#F59E0B]" /></td></tr>
                            <tr><td>15 min</td><td className="score-val">40 <Icon name="check" className="text-[#F59E0B]" /></td></tr>
                            <tr><td>0 min</td><td className="score-val">0 <Icon name="close" className="text-[#EF4444]" /></td></tr>
                            </tbody>
                        </table>
                        <div className="best-for">
                            <h5>Best for</h5>
                            <ul>
                                <li><Icon name="check" className="text-primary text-[14px]" /> Exercise, Meditation</li>
                                <li><Icon name="check" className="text-primary text-[14px]" /> Study, Reading</li>
                            </ul>
                        </div>
                    </div>
                </div>
                )}

                {/* Reverse Duration / Lower is Better */}
                {(type === 'all' || type === 'reverse_duration' || type === 'lower_is_better' || type === 'lower') && (
                <div className="engine-row" id="engine-reverse-duration">
                    <div className="er-info">
                        <div className="er-title">
                            <div className="er-icon" style={{color:'#EF4444'}}><Icon name="trending_down" /></div>
                            3. Lower is Better
                        </div>
                        <div className="er-desc">Lower value is better. Score decreases as input increases beyond the ideal limit.</div>
                    </div>
                    
                    <div className="er-visual">
                        <div className="er-visual-title">How it works</div>
                        <svg className="chart-svg" viewBox="0 0 300 100">
                            <line x1="10" y1="80" x2="290" y2="80" className="axis-line" />
                            <path className="chart-area-red" d="M 20 20 L 100 20 L 250 80 L 20 80 Z" />
                            <path className="chart-line chart-line-red" d="M 20 20 L 100 20 L 250 80" />
                            <circle cx="100" cy="20" r="4" className="chart-point chart-point-red"/>
                            <text x="100" y="10" textAnchor="middle" className="chart-text" fill="#EF4444">Ideal Limit</text>
                            <text x="260" y="95" className="chart-text">Wasted &rarr;</text>
                        </svg>
                    </div>

                    <div className="er-table-box">
                        <div className="er-example-title">Example <span>(Max: 2 hrs)</span></div>
                        <table className="sm-table">
                            <tbody>
                            <tr><th>You Spend</th><th style={{textAlign:'right'}}>Score</th></tr>
                            <tr><td>0 - 2 hrs</td><td className="score-val">100 <Icon name="check" className="text-[#10B981]" /></td></tr>
                            <tr><td>2 - 3 hrs</td><td className="score-val">80 <Icon name="check" className="text-[#F59E0B]" /></td></tr>
                            <tr><td>3 - 4 hrs</td><td className="score-val">50 <Icon name="check" className="text-[#F59E0B]" /></td></tr>
                            <tr><td>5+ hrs</td><td className="score-val">0 <Icon name="close" className="text-[#EF4444]" /></td></tr>
                            </tbody>
                        </table>
                        <div className="best-for">
                            <h5>Best for</h5>
                            <ul>
                                <li><Icon name="check" className="text-primary text-[14px]" /> Screen Time limit</li>
                                <li><Icon name="check" className="text-primary text-[14px]" /> Junk Food Limit</li>
                            </ul>
                        </div>
                    </div>
                </div>
                )}

                {/* Optimal Range */}
                {(type === 'all' || type === 'optimal_range') && (
                <div className="engine-row" id="engine-optimal-range">
                    <div className="er-info">
                        <div className="er-title">
                            <div className="er-icon" style={{color:'#A855F7'}}><Icon name="bar_chart" /></div>
                            4. Optimal Range
                        </div>
                        <div className="er-desc">You get highest score when your duration stays in the optimal sweet spot. Too high or low drops score.</div>
                    </div>
                    
                    <div className="er-visual">
                        <div className="er-visual-title">How it works</div>
                        <svg className="chart-svg" viewBox="0 0 300 100">
                            <line x1="10" y1="80" x2="290" y2="80" className="axis-line" />
                            <path fill="#A855F7" opacity="0.1" d="M 20 80 Q 80 80, 100 20 L 200 20 Q 220 80, 280 80 Z" />
                            <path stroke="#A855F7" fill="none" strokeWidth="2.5" strokeLinecap="round" d="M 20 80 Q 80 80, 100 20 L 200 20 Q 220 80, 280 80" />
                            <line x1="100" y1="20" x2="200" y2="20" stroke="#A855F7" strokeWidth="3" />
                            <text x="150" y="10" textAnchor="middle" className="chart-text" fill="#A855F7">Optimal Range</text>
                            <text x="40" y="95" textAnchor="middle" className="chart-text">Too Low</text>
                            <text x="260" y="95" textAnchor="middle" className="chart-text">Too High</text>
                        </svg>
                    </div>

                    <div className="er-table-box">
                        <div className="er-example-title">Example <span>(Sleep Duration)</span></div>
                        <table className="sm-table">
                            <tbody>
                            <tr><th>You Sleep</th><th style={{textAlign:'right'}}>Score</th></tr>
                            <tr><td>7 - 8.5 hrs</td><td className="score-val">100 <Icon name="check" className="text-[#10B981]" /></td></tr>
                            <tr><td>6 - 7 hrs</td><td className="score-val">80 <Icon name="check" className="text-[#F59E0B]" /></td></tr>
                            <tr><td>5 - 6 hrs</td><td className="score-val">50 <Icon name="check" className="text-[#F59E0B]" /></td></tr>
                            <tr><td>&lt; 4 or &gt; 10 hrs</td><td className="score-val">0 <Icon name="close" className="text-[#EF4444]" /></td></tr>
                            </tbody>
                        </table>
                        <div className="best-for">
                            <h5>Best for</h5>
                            <ul>
                                <li><Icon name="check" className="text-primary text-[14px]" /> Sleep Target (Duration)</li>
                            </ul>
                        </div>
                    </div>
                </div>
                )}

                {/* Yes / No */}
                {(type === 'all' || type === 'yes_no' || type === 'yn') && (
                <div className="engine-row" id="engine-yes-no">
                    <div className="er-info">
                        <div className="er-title">
                            <div className="er-icon" style={{color:'#EC4899'}}><Icon name="done_all" /></div>
                            5. Yes / No
                        </div>
                        <div className="er-desc">Binary scoring. You either did it or you didn't.</div>
                    </div>
                    
                    <div className="er-visual" style={{background: 'transparent', border: 'none', alignItems: 'center'}}>
                        <div style={{display:'flex', gap:'16px'}}>
                            <div style={{background:'#FDF2F8', border:'2px solid #EC4899', borderRadius:'12px', padding:'24px', textAlign:'center', width:'120px'}}>
                                <div style={{fontSize:'1.5rem', fontWeight:'800', color:'#EC4899'}}>100</div>
                                <div style={{fontSize:'0.75rem', color:'#EC4899', fontWeight:'600'}}>YES</div>
                            </div>
                            <div style={{background:'#F1F5F9', border:'2px solid #CBD5E1', borderRadius:'12px', padding:'24px', textAlign:'center', width:'120px'}}>
                                <div style={{fontSize:'1.5rem', fontWeight:'800', color:'#64748B'}}>0</div>
                                <div style={{fontSize:'0.75rem', color:'#64748B', fontWeight:'600'}}>NO</div>
                            </div>
                        </div>
                    </div>

                    <div className="er-table-box">
                        <div className="er-example-title">Example <span>(Take Vitamins)</span></div>
                        <table className="sm-table">
                            <tbody>
                            <tr><th>Action</th><th style={{textAlign:'right'}}>Score</th></tr>
                            <tr><td>Yes, took them</td><td className="score-val">100 <Icon name="check" className="text-[#10B981]" /></td></tr>
                            <tr><td>No, forgot</td><td className="score-val">0 <Icon name="close" className="text-[#EF4444]" /></td></tr>
                            </tbody>
                        </table>
                        <div className="best-for">
                            <h5>Best for</h5>
                            <ul>
                                <li><Icon name="check" className="text-primary text-[14px]" /> Did you do it?</li>
                            </ul>
                        </div>
                    </div>
                </div>
                )}
            </div>
        </div>
    </div>
  );
}
