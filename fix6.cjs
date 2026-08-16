const fs = require('fs');
let c = fs.readFileSync('src/pages/Analytics.jsx', 'utf8');

c = c.replace(
  '[summaries, entries, selectedHabits, startDate, endDate]',
  '[summaries, entries, selectedHabit, startDate, endDate]'
);

c = c.replace(
  '{selectedHabits.length > 1 && (',
  '{false && ('
);

c = c.replace(
  'onClick={() => setSelectedHabits([])}',
  'onClick={() => setSelectedHabit(\'overall\')}'
);

c = c.replace(
  'selectedHabits.length === 0 ? \'bg-primary text-on-primary border-primary\' : \'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-variant\'}',
  'selectedHabit === \'overall\' ? \'bg-primary text-on-primary border-primary\' : \'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-variant\'}'
);

c = c.replace(
  'setSelectedHabits(selectedHabits.filter(id => id !== h.id));',
  'setSelectedHabit(\'overall\');'
);

c = c.replace(
  'setSelectedHabits([...selectedHabits, h.id]);',
  'setSelectedHabit(h.id);'
);

c = c.replace(
  `              if (selectedHabits.length === 0) {
                  habitsToShow = ['overall'];
              } else if (chartMode === 'combined' || selectedHabits.length <= 1) {
                  habitsToShow = selectedHabits;
              }`,
  `              if (selectedHabit === 'overall') {
                  habitsToShow = ['overall'];
              } else {
                  habitsToShow = [selectedHabit];
              }`
);

c = c.replace(
  `            {chartMode === 'combined' || selectedHabits.length <= 1 ? (
              <ReactEChartsCore echarts={echarts} option={getEChartOption(selectedHabits)} style={{ height: '350px', width: '100%' }} />
            ) : (
              selectedHabits.map(habitId => {`,
  `            {selectedHabit === 'overall' ? (
              <ReactEChartsCore echarts={echarts} option={getEChartOption('overall')} style={{ height: '350px', width: '100%' }} />
            ) : (
              [selectedHabit].map(habitId => {`
);

c = c.replace(
  `                {selectedHabits.length === 1 ? habits.find(h => h.id === selectedHabits[0])?.name + " (All-Time Avg)" : "Overall (All-Time Avg)"}`,
  `                {selectedHabit !== 'overall' ? habits.find(h => h.id === selectedHabit)?.name + " (All-Time Avg)" : "Overall (All-Time Avg)"}`
);

c = c.replace(
  `                    if (selectedHabits.length === 1) {
                      const habitId = selectedHabits[0];`,
  `                    if (selectedHabit !== 'overall') {
                      const habitId = selectedHabit;`
);

fs.writeFileSync('src/pages/Analytics.jsx', c);
