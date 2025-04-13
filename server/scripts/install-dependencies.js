/**
 * Script to install required dependencies for the import process
 * 
 * Usage: node install-dependencies.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const PACKAGE_JSON_PATH = path.resolve(__dirname, '../package.json');
const REQUIRED_PACKAGES = ['fast-csv'];

/**
 * Check if a package is already installed
 * @param {string} packageName - Package to check
 * @returns {boolean} - Whether package is installed
 */
function isPackageInstalled(packageName) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
    return (
      (packageJson.dependencies && packageJson.dependencies[packageName]) ||
      (packageJson.devDependencies && packageJson.devDependencies[packageName])
    );
  } catch (error) {
    console.error('Error reading package.json:', error);
    return false;
  }
}

/**
 * Install missing packages
 */
function installMissingPackages() {
  const packagesToInstall = REQUIRED_PACKAGES.filter(
    pkg => !isPackageInstalled(pkg)
  );

  if (packagesToInstall.length === 0) {
    console.log('All required packages are already installed.');
    return;
  }

  console.log(`Installing packages: ${packagesToInstall.join(', ')}...`);
  
  const command = `npm install --save ${packagesToInstall.join(' ')}`;
  
  exec(command, { cwd: path.resolve(__dirname, '..') }, (error, stdout, stderr) => {
    if (error) {
      console.error(`Error installing packages: ${error.message}`);
      return;
    }
    
    if (stderr) {
      console.error(`Installation warnings: ${stderr}`);
    }
    
    console.log(`Packages installed successfully: ${packagesToInstall.join(', ')}`);
    console.log('You can now run the import script with: node import_property_data.js');
  });
}

// Run the installation process
installMissingPackages(); 