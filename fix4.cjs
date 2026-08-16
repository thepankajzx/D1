const fs = require('fs');

let content = fs.readFileSync('src/pages/Analytics.jsx', 'utf8');

// 1. Dependency array
content = content.replace(
  /\[summaries, entries, selectedHabits, startDate, endDate\]/g,
  "[summaries, entries, selectedHabit, startDate, endDate]"
);

// 2. remove combined/separate toggle completely
// We need to just search for the specific lines left
content = content.replace(/\{selectedHabits\.length > 1 && \([\s\S]*?<\!-- Pills/m, "{/* Pills");
content = content.replace(/\{selectedHabits\.length > 1 && \([\s\S]*?<\/div>[\s]*\)}/m, "");

// 3. Pills logic
content = content.replace(/onClick=\{\(\) => setSelectedHabits\(\[\]\)\}/g, "onClick={() => setSelectedHabit('overall')}");
content = content.replace(/selectedHabits\.length === 0 \?/g, "selectedHabit === 'overall' ?");
content = content.replace(/setSelectedHabits\(selectedHabits\.filter\(id => id !== h\.id\)\);/g, "setSelectedHabit('overall');");
content = content.replace(/setSelectedHabits\(\[\.\.\.selectedHabits, h\.id\]\);/g, "setSelectedHabit(h.id);");

// 4. habitsToShow
content = content.replace(
  /if \(selectedHabits\.length === 0\) \{[\s\S]*?habitsToShow = selectedHabits;\n              \}/m,
  "let habitsToShow = [selectedHabit];"
);

// 5. Chart rendering
content = content.replace(
  /\{chartMode === 'combined' \|\| selectedHabits\.length <= 1 \? \([\s\S]*?<ReactEChartsCore echarts=\{echarts\} option=\{getEChartOption\(selectedHabits\)\} style=\{\{ height: '350px', width: '100%' \}\} \/>\n            \) : \(\n              selectedHabits\.map\(habitId => \{/m,
  "{selectedHabit === 'overall' ? (\n              <ReactEChartsCore echarts={echarts} option={getEChartOption('overall')} style={{ height: '350px', width: '100%' }} />\n            ) : (\n              [selectedHabit].map(habitId => {"
);

// 6. heatmap string
content = content.replace(
  /if \(selectedHabits\.length === 1\) \{[\s\S]*?const habitId = selectedHabits\[0\];/m,
  "if (selectedHabit !== 'overall') {\n                      const habitId = selectedHabit;"
);

content = content.replace(
  /\{selectedHabits\.length === 1 \? habits\.find\(h => h\.id === selectedHabits\[0\]\)\?\.name \+ " \(All-Time Avg\)" : "Overall \(All-Time Avg\)"\}/g,
  "{selectedHabit !== 'overall' ? habits.find(h => h.id === selectedHabit)?.name + \" (All-Time Avg)\" : \"Overall (All-Time Avg)\"}"
);

fs.writeFileSync('src/pages/Analytics.jsx', content);
