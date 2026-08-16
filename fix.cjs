const fs = require('fs');

function fixApp() {
  let content = fs.readFileSync('src/App.jsx', 'utf8');
  if (!content.includes('import Icon')) {
    content = content.replace(
      /import \{ ErrorBoundary \} from '\.\/components\/ErrorBoundary';/,
      "import { ErrorBoundary } from './components/ErrorBoundary';\nimport Icon from './components/Icon';"
    );
  }
  content = content.replace(/<span className=\"material-symbols-outlined([^\"]*)\">([^<]+)<\/span>/g, '<Icon name=\"$2\" className=\"$1\" />');
  content = content.replace(/<span className=\"material-symbols-outlined animate-spin text-4xl\">sync<\/span>/g, '<Icon name=\"sync\" className=\"animate-spin text-4xl\" />');
  fs.writeFileSync('src/App.jsx', content);
}

function fixAnalytics() {
  let content = fs.readFileSync('src/pages/Analytics.jsx', 'utf8');
  
  if (!content.includes('import Icon')) {
    content = content.replace(
      /import RadialGauge from '\.\.\/components\/RadialGauge';/,
      "import RadialGauge from '../components/RadialGauge';\nimport Icon from '../components/Icon';"
    );
  }

  content = content.replace(/<span className=\"material-symbols-outlined([^\"]*)\">([^<]+)<\/span>/g, '<Icon name=\"$2\" className=\"$1\" />');
  content = content.replace(/<span class(?:Name)?=\"material-symbols-outlined([^\"]*)\" style=\{([^>]+)\}>([^<]+)<\/span>/g, '<Icon name=\"$3\" className=\"$1\" style={$2} />');

  // Change selectedHabits to single string
  content = content.replace(/const \[selectedHabits, setSelectedHabits\] = useState\(\[\]\);/g, "const [selectedHabit, setSelectedHabit] = useState('overall');");
  
  // Update activeHabitId
  content = content.replace(/const activeHabitId = selectedHabits\.length === 1 \? selectedHabits\[0\] : 'overall';/g, "const activeHabitId = selectedHabit;");
  
  // Update habitsToShow
  content = content.replace(/let habitsToShow = \[\];[\s\S]*?if \(habitsToShow\.length === 0\) return null;/m, "let habitsToShow = [selectedHabit];");
  
  // Fix getEChartOption signature
  content = content.replace(/const getEChartOption = \(habitIds\) => \{/g, "const getEChartOption = (habitId) => {");
  content = content.replace(/const isOverall = habitIds\.length === 0;/g, "const isOverall = habitId === 'overall';");
  content = content.replace(/habitIds\.map\(\(id\) => \{/g, "[habitId].map((id) => {");
  
  // Fix pills
  content = content.replace(/<button[\s\S]*?onClick=\{\(\) => setSelectedHabits\(\[\]\)\}[\s\S]*?Overall[\s\S]*?<\/button>/m, `<button 
                    onClick={() => setSelectedHabit('overall')}
                    className={\`px-3 py-1 rounded-full border text-xs font-medium transition-colors \${selectedHabit === 'overall' ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-variant'}\`}
                >
                    Overall
                </button>`);
  
  content = content.replace(/const isSelected = selectedHabits\.includes\(h\.id\);/g, "const isSelected = selectedHabit === h.id;");
  content = content.replace(/if \(isSelected\) \{[\s\S]*?setSelectedHabits\(selectedHabits\.filter\(id => id !== h\.id\)\);[\s\S]*?\} else \{[\s\S]*?setSelectedHabits\(\[\.\.\.selectedHabits, h\.id\]\);[\s\S]*?\}/m, "setSelectedHabit(h.id);");
  
  // Remove combined/separate toggle
  content = content.replace(/\{selectedHabits\.length > 1 && \([\s\S]*?<\!-- Pills/m, "{/* Pills");
  
  // Update Chart area
  content = content.replace(/\{chartMode === 'combined' \|\| selectedHabits\.length <= 1 \? \([\s\S]*?ReactEChartsCore[\s\S]*?\) : \([\s\S]*?\}\)/m, `
            {selectedHabit === 'overall' ? (
              <ReactEChartsCore echarts={echarts} option={getEChartOption('overall')} style={{ height: '350px', width: '100%' }} />
            ) : (
              [selectedHabit].map(habitId => {
                const habit = habits.find(h => h.id === habitId);
                const globalIndex = habits.findIndex(h => h.id === habitId);
                const colors = ['#8b5cf6', '#3b82f6', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
                const color = colors[globalIndex % colors.length];
                
                const currentPeriodScores = summaries
                  .filter(s => s.habitScores && s.habitScores[habitId] !== undefined)
                  .map(s => s.habitScores[habitId]);
                const currentAvg = currentPeriodScores.length > 0 ? Math.round(currentPeriodScores.reduce((sum, score) => sum + score, 0) / currentPeriodScores.length) : 0;
                
                let timeframeLabel = 'All-Time';
                if (rangeOption !== 'all' && rangeOption !== 'custom') {
                    const days = parseInt(rangeOption) || 30;
                    timeframeLabel = \`\${days} Days\`;
                } else if (rangeOption === 'custom') {
                    timeframeLabel = 'Custom';
                }

                return (
                  <div key={\`chart-\${habitId}\`} className="flex flex-col bg-surface-container-low rounded-xl border border-outline-variant/50 p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
                      <div className="flex items-center gap-2 ml-1">
                        <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: color }}></div>
                        <h3 className="text-base font-semibold text-on-surface">{habit?.name || 'Unknown'}</h3>
                      </div>
                      <div className="w-full sm:w-[150px]">
                        <RadialGauge 
                          habitName={habit?.name || 'Unknown'} 
                          percentage={currentAvg} 
                          timeframeLabel={timeframeLabel}
                        />
                      </div>
                    </div>
                    <ReactEChartsCore echarts={echarts} option={getEChartOption(habitId)} style={{ height: '250px', width: '100%' }} />
                  </div>
                );
              })
            )}
  `);

  // Update heatmap All-Time average widget
  content = content.replace(/\{selectedHabits\.length === 1 \? habits\.find\(h => h\.id === selectedHabits\[0\]\)\?\.name \+ " \(All-Time Avg\)" : "Overall \(All-Time Avg\)"\}/g, `{selectedHabit !== 'overall' ? habits.find(h => h.id === selectedHabit)?.name + " (All-Time Avg)" : "Overall (All-Time Avg)"}`);
  content = content.replace(/if \(selectedHabits\.length === 1\) \{[\s\S]*?const habitId = selectedHabits\[0\];/m, `if (selectedHabit !== 'overall') {
                      const habitId = selectedHabit;`);
                      
  fs.writeFileSync('src/pages/Analytics.jsx', content);
}

fixApp();
fixAnalytics();
