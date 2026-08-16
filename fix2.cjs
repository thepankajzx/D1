const fs = require('fs');
let app = fs.readFileSync('src/App.jsx', 'utf8');
app = app.replace(/name="\{location\.pathname === '\/' \? 'home' : 'home'\}"/g, 'name="home"');
app = app.replace(/name="\{location\.pathname === '\/analytics' \? 'bar_chart' : 'bar_chart'\}"/g, 'name="bar_chart"');
fs.writeFileSync('src/App.jsx', app);
