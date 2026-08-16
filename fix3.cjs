const fs = require('fs');

let content = fs.readFileSync('src/pages/Analytics.jsx', 'utf8');

// 1. State
content = content.replace(
  "const [selectedHabits, setSelectedHabits] = useState([]); // Array of habit IDs",
  "const [selectedHabit, setSelectedHabit] = useState('overall'); // 'overall' or habit ID"
);

// 2. activeHabitId
content = content.replace(
  "const activeHabitId = selectedHabits.length === 1 ? selectedHabits[0] : 'overall';",
  "const activeHabitId = selectedHabit;"
);

// 3. toggle combined mode - remove it
content = content.replace(
  "                {selectedHabits.length > 1 && (\n" +
  "                    <div className=\"flex items-center bg-surface-container-low rounded-lg p-1 border border-outline-variant/50\">\n" +
  "                        <button\n" +
  "                            onClick={() => setChartMode('combined')}\n" +
  "                            className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors ${chartMode === 'combined' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}\n" +
  "                        >\n" +
  "                            Combined\n" +
  "                        </button>\n" +
  "                        <button\n" +
  "                            onClick={() => setChartMode('separate')}\n" +
  "                            className={`px-3 py-1 text-[11px] font-bold uppercase tracking-wider rounded-md transition-colors ${chartMode === 'separate' ? 'bg-surface shadow-sm text-primary' : 'text-on-surface-variant hover:text-on-surface'}`}\n" +
  "                        >\n" +
  "                            Separate\n" +
  "                        </button>\n" +
  "                    </div>\n" +
  "                )}",
  ""
);

// 4. Pills logic
content = content.replace(
  "                <button \n" +
  "                    onClick={() => setSelectedHabits([])}\n" +
  "                    className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${selectedHabits.length === 0 ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-variant'}`}\n" +
  "                >\n" +
  "                    Overall\n" +
  "                </button>",
  "                <button \n" +
  "                    onClick={() => setSelectedHabit('overall')}\n" +
  "                    className={`px-3 py-1 rounded-full border text-xs font-medium transition-colors ${selectedHabit === 'overall' ? 'bg-primary text-on-primary border-primary' : 'bg-surface-container-low text-on-surface-variant border-outline-variant hover:bg-surface-variant'}`}\n" +
  "                >\n" +
  "                    Overall\n" +
  "                </button>"
);

content = content.replace(
  "                    const isSelected = selectedHabits.includes(h.id);",
  "                    const isSelected = selectedHabit === h.id;"
);

content = content.replace(
  "                                if (isSelected) {\n" +
  "                                    setSelectedHabits(selectedHabits.filter(id => id !== h.id));\n" +
  "                                } else {\n" +
  "                                    setSelectedHabits([...selectedHabits, h.id]);\n" +
  "                                }",
  "                                setSelectedHabit(h.id);"
);

// 5. habitsToShow
content = content.replace(
  "              let habitsToShow = [];\n" +
  "              if (selectedHabits.length === 0) {\n" +
  "                  habitsToShow = ['overall'];\n" +
  "              } else if (chartMode === 'combined' || selectedHabits.length <= 1) {\n" +
  "                  habitsToShow = selectedHabits;\n" +
  "              }\n" +
  "\n" +
  "              if (habitsToShow.length === 0) return null;",
  "              let habitsToShow = [selectedHabit];"
);

// 6. Chart rendering
content = content.replace(
  "            {chartMode === 'combined' || selectedHabits.length <= 1 ? (\n" +
  "              <ReactEChartsCore echarts={echarts} option={getEChartOption(selectedHabits)} style={{ height: '350px', width: '100%' }} />\n" +
  "            ) : (\n" +
  "              selectedHabits.map(habitId => {",
  "            {selectedHabit === 'overall' ? (\n" +
  "              <ReactEChartsCore echarts={echarts} option={getEChartOption('overall')} style={{ height: '350px', width: '100%' }} />\n" +
  "            ) : (\n" +
  "              [selectedHabit].map(habitId => {"
);

content = content.replace(
  "                    <ReactEChartsCore echarts={echarts} option={getEChartOption([habitId])} style={{ height: '250px', width: '100%' }} />",
  "                    <ReactEChartsCore echarts={echarts} option={getEChartOption(habitId)} style={{ height: '250px', width: '100%' }} />"
);

// 7. heatmap all-time string
content = content.replace(
  "                {selectedHabits.length === 1 ? habits.find(h => h.id === selectedHabits[0])?.name + \" (All-Time Avg)\" : \"Overall (All-Time Avg)\"}",
  "                {selectedHabit !== 'overall' ? habits.find(h => h.id === selectedHabit)?.name + \" (All-Time Avg)\" : \"Overall (All-Time Avg)\"}"
);

content = content.replace(
  "                    if (selectedHabits.length === 1) {\n" +
  "                      const habitId = selectedHabits[0];",
  "                    if (selectedHabit !== 'overall') {\n" +
  "                      const habitId = selectedHabit;"
);

// 8. getEChartOption params
content = content.replace(
  "  const getEChartOption = (habitIds) => {",
  "  const getEChartOption = (habitId) => {"
);
content = content.replace(
  "    const isOverall = habitIds.length === 0;",
  "    const isOverall = habitId === 'overall';"
);
content = content.replace(
  "    const selectedHabitIds = isOverall ? habits.map(h => h.id) : habitIds;",
  "    const selectedHabitIds = isOverall ? habits.map(h => h.id) : [habitId];"
);
content = content.replace(
  "      legend: { show: !isOverall && habitIds.length > 1, bottom: 0 },",
  "      legend: { show: false, bottom: 0 },"
);
content = content.replace(
  "      series: habitIds.map((id) => {",
  "      series: [habitId].map((id) => {"
);

fs.writeFileSync('src/pages/Analytics.jsx', content);
