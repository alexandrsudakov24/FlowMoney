import { execSync } from 'child_process';
import fs from 'fs';

console.log('🔥 Cleaning Firebase Hosting...');

if (!fs.existsSync('empty')) {
    fs.mkdirSync('empty');
}

const original = fs.readFileSync('firebase.json', 'utf8');
const modified = original.replace('"public": "dist"', '"public": "empty"');

fs.writeFileSync('firebase.json', modified);

execSync('firebase deploy --only hosting', { stdio: 'inherit' });

console.log('✨ Hosting cleaned. Restoring config...');

fs.writeFileSync('firebase.json', original);

console.log('📦 Building project...');
execSync('npm run build', { stdio: 'inherit' });

console.log('🚀 Deploying fresh version...');
execSync('firebase deploy --only hosting', { stdio: 'inherit' });

console.log('🎉 Done! Fresh deploy completed.');
