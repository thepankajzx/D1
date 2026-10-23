import React from 'react';

export default function CoreXIcon({ name, size = 18, weight = "bold", className = "", style = {} }) {
  if (!name) name = "Sparkle";

  // Map known weird names to standard Phosphor names if necessary
  const nameMap = {
    'download': 'download-simple',
    'sliders': 'sliders-horizontal',
  };

  let normalizedName = nameMap[name] || name;

  // Convert PascalCase to kebab-case
  const kebab = normalizedName.replace(/([a-z0-9])([A-Z])/g, '$1-$2').toLowerCase();
  
  // Weights in webfont: ph (regular), ph-fill, ph-bold, ph-light, ph-thin, ph-duotone
  let weightClass = 'ph';
  if (weight && weight !== 'regular') {
      weightClass = `ph-${weight}`;
  }

  return (
    <i 
      className={`${weightClass} ph-${kebab} ${className}`}
      style={{ fontSize: size, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', ...style }}
    />
  );
}