const { Jimp } = require('jimp');
const path = require('path');

const publicDir = path.join(__dirname, 'public');

async function compress() {
  try {
    console.log('Starting compression...');
    
    // Compress nature_bg
    console.log('Reading nature_bg.png...');
    const nature = await Jimp.read(path.join(publicDir, 'nature_bg.png'));
    console.log('Resizing and compressing nature_bg...');
    await nature
      .resize({ w: 1920 })      // Resize to 1920px width
      .write(path.join(publicDir, 'nature_bg.jpg'), { quality: 50 });
    console.log('Saved nature_bg.jpg');

    // Compress dashboard_bg
    console.log('Reading dashboard_bg.png...');
    const dashboard = await Jimp.read(path.join(publicDir, 'dashboard_bg.png'));
    console.log('Resizing and compressing dashboard_bg...');
    await dashboard
      .resize({ w: 1920 })      // Resize to 1920px width
      .write(path.join(publicDir, 'dashboard_bg.jpg'), { quality: 50 });
    console.log('Saved dashboard_bg.jpg');

    console.log('Compression completed successfully!');
  } catch (error) {
    console.error('Error during compression:', error);
  }
}

compress();
