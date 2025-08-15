#!/usr/bin/env node

/**
 * GenieNotes Documentation Update Script
 * 
 * This script helps developers keep the living documentation system
 * in sync with code changes. Run it after making significant changes
 * to ensure documentation reflects the current state.
 */

import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logHeader(message) {
  log(`\n${'='.repeat(60)}`, 'bright');
  log(`  ${message}`, 'bright');
  log(`${'='.repeat(60)}`, 'bright');
}

function logSection(message) {
  log(`\n${message}`, 'cyan');
  log('-'.repeat(message.length), 'cyan');
}

function logSuccess(message) {
  log(`✅ ${message}`, 'green');
}

function logWarning(message) {
  log(`⚠️  ${message}`, 'yellow');
}

function logError(message) {
  log(`❌ ${message}`, 'red');
}

function logInfo(message) {
  log(`ℹ️  ${message}`, 'blue');
}

// Check if we're in the right directory
function checkProjectStructure() {
  logSection('Checking Project Structure');
  
  const requiredFiles = [
    'package.json',
    'src/App.tsx',
    'docs/README.md',
    'docs/FEATURES.md',
    'docs/ARCHITECTURE.md',
    'docs/UI-UX.md',
    'docs/DEVELOPMENT.md',
    'docs/CHANGELOG.md',
    'docs/ROADMAP.md'
  ];
  
  let allFilesExist = true;
  
  requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
      logSuccess(`${file} exists`);
    } else {
      logError(`${file} missing`);
      allFilesExist = false;
    }
  });
  
  return allFilesExist;
}

// Check for recent changes that might need documentation updates
function checkRecentChanges() {
  logSection('Checking Recent Changes');
  
  try {
    // Get recent commits
    const recentCommits = execSync('git log --oneline -10', { encoding: 'utf8' });
    logInfo('Recent commits:');
    console.log(recentCommits);
    
    // Check for modified files
    const modifiedFiles = execSync('git status --porcelain', { encoding: 'utf8' });
    if (modifiedFiles.trim()) {
      logWarning('Modified files detected:');
      console.log(modifiedFiles);
    } else {
      logSuccess('No uncommitted changes');
    }
    
  } catch (error) {
    logError('Could not check git status. Make sure you\'re in a git repository.');
  }
}

// Check documentation freshness
function checkDocumentationFreshness() {
  logSection('Checking Documentation Freshness');
  
  const docsDir = 'docs';
  const docsFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.md'));
  
  docsFiles.forEach(file => {
    const filePath = path.join(docsDir, file);
    const stats = fs.statSync(filePath);
    const lastModified = new Date(stats.mtime);
    const daysSinceModified = Math.floor((Date.now() - stats.mtime) / (1000 * 60 * 60 * 24));
    
    if (daysSinceModified > 30) {
      logWarning(`${file} hasn't been updated in ${daysSinceModified} days`);
    } else if (daysSinceModified > 7) {
      logInfo(`${file} updated ${daysSinceModified} days ago`);
    } else {
      logSuccess(`${file} recently updated (${daysSinceModified} days ago)`);
    }
  });
}

// Generate documentation update checklist
function generateUpdateChecklist() {
  logSection('Documentation Update Checklist');
  
  const checklist = [
    'Have you added new features? → Update FEATURES.md',
    'Have you changed the architecture? → Update ARCHITECTURE.md',
    'Have you modified UI/UX? → Update UI-UX.md',
    'Have you changed development process? → Update DEVELOPMENT.md',
    'Have you made significant changes? → Update CHANGELOG.md',
    'Have you updated plans? → Update ROADMAP.md',
    'Have you updated the main README.md?',
    'Have you committed your documentation changes?'
  ];
  
  checklist.forEach(item => {
    logInfo(item);
  });
}

// Check for common documentation issues
function checkCommonIssues() {
  logSection('Checking for Common Issues');
  
  const docsDir = 'docs';
  const docsFiles = fs.readdirSync(docsDir).filter(file => file.endsWith('.md'));
  
  docsFiles.forEach(file => {
    const filePath = path.join(docsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Check for TODO comments
    if (content.includes('TODO') || content.includes('FIXME')) {
      logWarning(`${file} contains TODO/FIXME comments`);
    }
    
    // Check for broken links
    const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    let match;
    while ((match = linkRegex.exec(content)) !== null) {
      const linkText = match[1];
      const linkUrl = match[2];
      
      if (linkUrl.startsWith('./') || linkUrl.startsWith('../')) {
        const fullPath = path.resolve(path.dirname(filePath), linkUrl);
        if (!fs.existsSync(fullPath)) {
          logError(`${file}: Broken link "${linkText}" → "${linkUrl}"`);
        }
      }
    }
    
    // Check for outdated version references
    if (content.includes('v0.') && file !== 'CHANGELOG.md') {
      logWarning(`${file} may contain outdated version references`);
    }
  });
}

// Main function
function main() {
  logHeader('GenieNotes Documentation Update Script');
  
  logInfo('This script helps you keep the living documentation system in sync.');
  logInfo('Run it after making significant changes to your codebase.\n');
  
  // Check project structure
  if (!checkProjectStructure()) {
    logError('Project structure check failed. Please ensure all required files exist.');
    process.exit(1);
  }
  
  // Check recent changes
  checkRecentChanges();
  
  // Check documentation freshness
  checkDocumentationFreshness();
  
  // Check for common issues
  checkCommonIssues();
  
  // Generate update checklist
  generateUpdateChecklist();
  
  logSection('Next Steps');
  logInfo('1. Review the warnings and errors above');
  logInfo('2. Update relevant documentation files');
  logInfo('3. Commit your documentation changes');
  logInfo('4. Run this script again to verify');
  
  logHeader('Documentation Update Complete');
}

// Run the script
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

export {
  checkProjectStructure,
  checkRecentChanges,
  checkDocumentationFreshness,
  checkCommonIssues,
  generateUpdateChecklist
};
