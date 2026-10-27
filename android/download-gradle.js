const fs = require('fs');
const https = require('https');
const path = require('path');
const { execSync } = require('child_process');

const destDir = 'C:\\Users\\user\\.gradle\\wrapper\\dists\\gradle-8.11.1-bin\\bpt9gzteqjrbo1mjrsomdt32c';
const zipPath = path.join(destDir, 'gradle-8.11.1-bin.zip');

if (!fs.existsSync(destDir)) {
  fs.mkdirSync(destDir, { recursive: true });
}

function downloadFile(url, dest, cb) {
  const file = fs.createWriteStream(dest);
  https.get(url, (res) => {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
      return downloadFile(res.headers.location, dest, cb);
    }
    if (res.statusCode !== 200) {
      console.error('Failed to download: status ' + res.statusCode);
      return;
    }
    const total = parseInt(res.headers['content-length'], 10);
    let downloaded = 0;
    res.on('data', chunk => {
      downloaded += chunk.length;
      process.stdout.write(`\rDownloading: ${(downloaded / 1024 / 1024).toFixed(1)} MB / ${(total / 1024 / 1024).toFixed(1)} MB`);
    });
    res.pipe(file);
    file.on('finish', () => {
      file.close(() => {
        console.log('\nDownload complete!');
        cb();
      });
    });
  }).on('error', err => {
    fs.unlinkSync(dest);
    console.error('Download error:', err.message);
  });
}

console.log('Starting Gradle 8.11.1 download via Node.js stream...');
downloadFile('https://services.gradle.org/distributions/gradle-8.11.1-bin.zip', zipPath, () => {
  console.log('Extracting archive...');
  try {
    execSync(`powershell -Command "Expand-Archive -Path '${zipPath}' -DestinationPath '${destDir}' -Force"`, { stdio: 'inherit' });
    fs.writeFileSync(path.join(destDir, 'gradle-8.11.1-bin.zip.ok'), '');
    console.log('Gradle 8.11.1 successfully extracted and registered in Gradle cache!');
  } catch (err) {
    console.error('Extraction error:', err.message);
  }
});
