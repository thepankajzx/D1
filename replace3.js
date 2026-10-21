const fs = require('fs');
const file = 'g:/STITCH HABIT TRACKER/definite-habit-tracker/src/pages/Analytics.jsx';
let content = fs.readFileSync(file, 'utf8');

const regex = /const getEChartOption = \(habitId\) => \{[\s\S]*?\}\)\.flat\(\);\r?\n  \};/;

const fullFunc = const getEChartOption = (habitId) => {
    const isOverall = habitId === 'overall';
    const series = isOverall
      ? (() => {
          const formattedData = chartData.map((d, i, arr) => {
            const isFuture = d.meta.isFuture;
            let val = d.overallScore;
            
            if (isFuture) return { value: '-', symbol: 'none', meta: d.meta };
            
            if (val === null || val === undefined) {
               val = getInterpolatedValue(arr, i, 'overallScore');
            }

            const recorded = d.meta.recordedCount || 0;
            const expected = d.meta.expectedCount || 1;
            
            if (recorded === 0) {
               return { value: val, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#0f172a', borderColor: '#0f172a', borderWidth: 2 }, isUnrecorded: true, meta: d.meta };
            } else if (recorded < expected) {
               return { value: val, symbol: 'emptyCircle', symbolSize: 6, itemStyle: { color: '#ffffff', borderColor: '#0f172a', borderWidth: 2 }, meta: d.meta };
            } else {
               return { value: val, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#10b981' }, meta: d.meta };
            }
          });
          return [
            {
              name: 'Overall Score',
              type: 'line',
              data: formattedData,
              connectNulls: true,
              itemStyle: { color: '#8b5cf6' },
              lineStyle: { width: 3, color: '#8b5cf6' },
              areaStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: 'rgba(139, 92, 246, 0.25)' },
                    { offset: 1, color: 'rgba(139, 92, 246, 0.01)' }
                  ]
                }
              },
              showSymbol: true,
              smooth: true
            }
          ];
        })()
      : [habitId].map((id) => {
          const habit = habits.find(h => h.id === id);
          const globalIndex = habits.findIndex(h => h.id === id);
          const colors = ['#3b82f6', '#8b5cf6', '#14b8a6', '#f59e0b', '#ef4444', '#ec4899', '#06b6d4', '#84cc16'];
          const color = colors[globalIndex % colors.length];
          
          const formattedData = chartData.map((d, i, arr) => {
            const isFuture = d.meta && d.meta.isFuture;
            if (isFuture) return { value: '-', symbol: 'none', meta: d.meta };

            let val = d[id];
            let isUnrecorded = false;
            
            if (val === null || val === undefined) {
              val = getInterpolatedValue(arr, i, id);
              isUnrecorded = true;
            }

            if (isUnrecorded) {
              return { value: val, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#0f172a', borderColor: '#0f172a', borderWidth: 2 }, isUnrecorded: true, meta: d.meta };
            } else if (val > 0 && val < 100) {
              return { value: val, symbol: 'emptyCircle', symbolSize: 6, itemStyle: { color: '#ffffff', borderColor: '#0f172a', borderWidth: 2 }, meta: d.meta };
            } else {
              return { value: val, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#10b981' }, meta: d.meta };
            }
          });

          return [
            {
              name: habit?.name || id,
              type: 'line',
              data: formattedData,
              connectNulls: true,
              itemStyle: { color },
              lineStyle: { width: 3, color },
              areaStyle: {
                color: {
                  type: 'linear', x: 0, y: 0, x2: 0, y2: 1,
                  colorStops: [
                    { offset: 0, color: color + '40' },
                    { offset: 1, color: color + '02' }
                  ]
                }
              },
              showSymbol: true,
              smooth: true
            }
          ];
        }).flat();
  };;

content = content.replace(regex, fullFunc);
fs.writeFileSync(file, content);
console.log("Done");
