// scripts/dist.js

import fs from 'fs-extra';
import path from 'path';

const releaseDir = './release';
const jsSource = './dist/yz-audio-visualiser.js';
const typesSource = './dist/index.d.ts';

const jsDest = path.join(releaseDir, 'yz-audio-visualiser.js');
const typesDest = path.join(releaseDir, 'yz-audio-visualiser.d.ts');

async function createDist() {
  try {
    console.log('Creating clean release distribution...');
    
    await fs.emptyDir(releaseDir);
    await fs.copy(jsSource, jsDest);
    console.log(`Successfully copied JS to ${jsDest}`);
    await fs.copy(typesSource, typesDest);
    console.log(`Successfully copied Types to ${typesDest}`);
    console.log('Distribution successfully created in /release folder.');
  } catch (err) {
    console.error('Error creating distribution:', err);
    process.exit(1);
  }
}

createDist();
