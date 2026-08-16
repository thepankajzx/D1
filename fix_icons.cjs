const fs = require('fs');
let content = fs.readFileSync('src/pages/Analytics.jsx', 'utf8');

// Add import
if (!content.includes('import Icon')) {
  content = content.replace(
    /import RadialGauge from '\.\.\/components\/RadialGauge';/,
    `import RadialGauge from '../components/RadialGauge';\nimport Icon from '../components/Icon';`
  );
}

// Replace all <span className="material-symbols-outlined"...>icon</span> with <Icon name="icon" className="..." />
content = content.replace(/<span className="material-symbols-outlined([^"]*)">([^<]+)<\/span>/g, '<Icon name="$2" className="$1" />');
content = content.replace(/<span class(?:Name)?="material-symbols-outlined([^"]*)" style=\{([^>]+)\}>([^<]+)<\/span>/g, '<Icon name="$3" className="$1" style={$2} />');

fs.writeFileSync('src/pages/Analytics.jsx', content);
