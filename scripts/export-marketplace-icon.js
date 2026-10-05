#!/usr/bin/env node
/**
 * Export media/icon-marketplace.svg → icon.png (128×128).
 * Uses @resvg/resvg-js (devDependency).
 */
const fs = require('fs');
const path = require('path');

async function main() {
  const root = path.join(__dirname, '..');
  const svgPath = path.join(root, 'media', 'icon-marketplace.svg');
  const outPath = process.argv[2] ? path.resolve(process.argv[2]) : path.join(root, 'icon.png');
  const size = Number(process.argv[3] ?? 128);
  const svg = fs.readFileSync(svgPath);

  let Resvg;
  try {
    ({ Resvg } = require('@resvg/resvg-js'));
  } catch {
    console.error('Missing @resvg/resvg-js. Run: npm i -D @resvg/resvg-js');
    process.exit(1);
  }

  const resvg = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
  });
  const png = resvg.render().asPng();
  fs.writeFileSync(outPath, png);
  console.log(`Wrote ${outPath} (${png.length} bytes)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
