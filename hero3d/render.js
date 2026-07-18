// Renders three-scene.html headlessly across N frames and encodes them into an animated GIF.
const puppeteer = require('puppeteer');
const GIFEncoder = require('gifencoder');
const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const WIDTH = 1200;
const HEIGHT = 340;
const FRAMES = 48;

(async () => {
  const outDir = path.join(__dirname, 'dist');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const browser = await puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  await page.setViewport({ width: WIDTH, height: HEIGHT });
  await page.goto('file://' + path.join(__dirname, 'three-scene.html'));
  await page.waitForFunction('window.sceneReady === true');

  const encoder = new GIFEncoder(WIDTH, HEIGHT);
  const outPath = path.join(outDir, 'hero-banner-3d.gif');
  const outStream = fs.createWriteStream(outPath);
  encoder.createReadStream().pipe(outStream);
  encoder.start();
  encoder.setRepeat(0);
  encoder.setDelay(60);
  encoder.setQuality(10);

  for (let i = 0; i < FRAMES; i++) {
    const t = i / FRAMES;
    await page.evaluate((t) => { window.setFrame(t); }, t);
    const buffer = await page.screenshot({ type: 'png' });
    const png = PNG.sync.read(buffer);
    encoder.addFrame(png.data);
    console.log(`frame ${i + 1}/${FRAMES} captured`);
  }

  encoder.finish();
  await browser.close();
  console.log('GIF written to', outPath);
})();
