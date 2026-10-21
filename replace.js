const fs = require('fs');
const file = 'g:/STITCH HABIT TRACKER/definite-habit-tracker/src/pages/Analytics.jsx';
let content = fs.readFileSync(file, 'utf8');

const oldOverall =           const formattedData = chartData.map((d) => {
            const val = d.overallScore;
            if (val === null || val === undefined) {
              return {
                value: 0,
                symbol: 'circle',
                symbolSize: 7,
                itemStyle: {
                  color: '#ffffff',
                  borderColor: '#0f172a',
                  borderWidth: 2
                },
                isUnrecorded: true,
                meta: d.meta
              };
            }
            return {
              value: val,
              symbol: 'none',
              symbolSize: 0,
              meta: d.meta
            };
          });;

const newOverall =           const formattedData = chartData.map((d, i, arr) => {
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
               return { value: val, symbol: 'emptyCircle', symbolSize: 6, itemStyle: { color: '#000000', borderColor: '#000000', borderWidth: 2 }, meta: d.meta };
            } else {
               return { value: val, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#10b981' }, meta: d.meta };
            }
          });;

content = content.replace(oldOverall, newOverall);

const oldHabit =           const formattedData = chartData.map((d) => {
            const val = d[id];
            if (val === null || val === undefined) {
              return {
                value: 0,
                symbol: 'circle',
                symbolSize: 7,
                itemStyle: {
                  color: '#ffffff',
                  borderColor: '#0f172a',
                  borderWidth: 2
                },
                isUnrecorded: true
              };
            }
            return {
              value: val,
              symbol: 'none',
              symbolSize: 0
            };
          });;

const newHabit =           const formattedData = chartData.map((d, i, arr) => {
            const isFuture = d.meta && d.meta.isFuture;
            if (isFuture) return { value: '-', symbol: 'none' };

            let val = d[id];
            let isUnrecorded = false;
            
            if (val === null || val === undefined) {
              val = getInterpolatedValue(arr, i, id);
              isUnrecorded = true;
            }

            if (isUnrecorded) {
              return { value: val, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#0f172a', borderColor: '#0f172a', borderWidth: 2 }, isUnrecorded: true, meta: d.meta };
            } else if (val > 0 && val < 100) {
              return { value: val, symbol: 'emptyCircle', symbolSize: 6, itemStyle: { color: '#000000', borderColor: '#000000', borderWidth: 2 }, meta: d.meta };
            } else {
              return { value: val, symbol: 'circle', symbolSize: 6, itemStyle: { color: '#10b981' }, meta: d.meta };
            }
          });;

content = content.replace(oldHabit, newHabit);
fs.writeFileSync(file, content);
console.log("Done");
