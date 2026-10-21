const fs = require('fs');
const file = 'g:/STITCH HABIT TRACKER/definite-habit-tracker/src/pages/Analytics.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /else return 0;\r?\n  };\r?\n\r?\n              connectNulls: true,/;

const replacement = else return 0;\n  };\n\n  // ECharts Options Generator\n  const getEChartOption = (habitId) => {\n    const isOverall = habitId === 'overall';\n    const series = isOverall\n      ? (() => {\n          const formattedData = chartData.map((d, i, arr) => {\n            const isFuture = d.meta.isFuture;\n            let val = d.overallScore;\n            \n            if (isFuture) return { value: '-', symbol: 'none', meta: d.meta };\n            \n            if (val === null || val === undefined) {\n               val = getInterpolatedValue(arr, i, 'overallScore');\n            }\n\n            const recorded = d.meta.recordedCount || 0;\n            const expected = d.meta.expectedCount || 1;\n            \n            if (recorded === 0) {\n               return { value: val, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#0f172a', borderColor: '#0f172a', borderWidth: 2 }, isUnrecorded: true, meta: d.meta };\n            } else if (recorded < expected) {\n               return { value: val, symbol: 'emptyCircle', symbolSize: 6, itemStyle: { color: '#ffffff', borderColor: '#0f172a', borderWidth: 2 }, meta: d.meta };\n            } else {\n               return { value: val, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#10b981' }, meta: d.meta };\n            }\n          });\n          return [\n            {\n              name: 'Overall Score',\n              type: 'line',\n              data: formattedData,\n              connectNulls: true,;

content = content.replace(regex, replacement);
fs.writeFileSync(file, content);
console.log("Restored and modified");
