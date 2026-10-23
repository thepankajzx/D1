import * as XLSX from 'xlsx';

export function exportCoreXToExcel(config, logs) {
  // 1. Prepare Daily Log Sheet
  const dailyLogData = [];
  
  // Headers
  const header1 = ["Date", "Outcome"];
  const header2 = ["(YYYY-MM-DD)", config.outcome.label];

  config.factors.forEach(f => {
    if (f.active) {
      header1.push(f.name);
      header2.push("Had?");
      f.properties.forEach(p => {
        header1.push(f.name); // Merge visually later or keep repeated
        header2.push(p.label + (p.unit ? ` (${p.unit})` : ""));
      });
    }
  });
  
  dailyLogData.push(header1);
  dailyLogData.push(header2);

  // Rows
  const sortedLogs = [...logs].sort((a, b) => new Date(a.date) - new Date(b.date));
  
  sortedLogs.forEach(log => {
    const row = [log.date, log.outcome !== undefined ? log.outcome : ""];
    
    config.factors.forEach(f => {
      if (f.active) {
        const factorData = log.factors && log.factors[f.id];
        const had = factorData && factorData.had === true;
        row.push(had ? "Yes" : (factorData?.had === false ? "No" : ""));
        
        f.properties.forEach(p => {
          if (had && factorData[p.id] !== undefined) {
            row.push(factorData[p.id]);
          } else {
            row.push("");
          }
        });
      }
    });
    
    dailyLogData.push(row);
  });

  const wsDaily = XLSX.utils.aoa_to_sheet(dailyLogData);

  // 2. Prepare Config Sheet (Schema)
  const configData = [
    ["Entity", "Name", "Type/Details"],
    ["Habit/CoreX", config.name, ""],
    ["Outcome", config.outcome.label, `${config.outcome.type} (Higher is better: ${config.outcome.higherIsBetter})`],
  ];
  config.factors.forEach(f => {
    configData.push(["Factor", f.name, f.active ? "Active" : "Archived"]);
    f.properties.forEach(p => {
      configData.push(["- Property", p.label, `${p.type} ${p.unit ? `(${p.unit})` : ""}`]);
    });
  });

  const wsConfig = XLSX.utils.aoa_to_sheet(configData);

  // Build Workbook
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, wsDaily, "Daily Logs");
  XLSX.utils.book_append_sheet(wb, wsConfig, "Schema Config");

  // Export
  XLSX.writeFile(wb, `CoreX_${config.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
}
