#!/usr/bin/env node

/**
 * Design System Audit Script
 * This script scans through the codebase and identifies hardcoded design values
 * that should be using design system tokens.
 */

const fs = require('fs');
const path = require('path');
const glob = require('glob');

// Patterns to look for
const patterns = {
  // Hardcoded hex colors
  hexColors: /#[0-9a-fA-F]{3,6}/g,
  
  // Hardcoded RGB/HSL values
  rgbColors: /rgb\(.*?\)/g,
  rgbaColors: /rgba\(.*?\)/g,
  hslColors: /hsl\(.*?\)/g,
  hslaColors: /hsla\(.*?\)/g,
  
  // Hardcoded spacing values
  spacingPx: /(\b(margin|padding|gap|space|top|bottom|left|right|width|height): )\d+px/g,
  spacingRem: /(\b(margin|padding|gap|space|top|bottom|left|right|width|height): )[0-9.]+rem/g,
  
  // Hardcoded font sizes
  fontSizePx: /font-size: \d+px/g,
  fontSizeRem: /font-size: [0-9.]+rem/g,
  
  // Hardcoded font weights
  fontWeight: /font-weight: \d+/g,
  
  // Hardcoded box shadows
  boxShadow: /box-shadow: [^;]+;/g,
  
  // Tailwind arbitrary values
  tailwindArbitraryColor: /\b(bg|text|border|ring|shadow|fill|stroke)-\[#[0-9a-fA-F]{3,6}\]/g,
  tailwindArbitrarySize: /\b(p|m|gap|space|w|h)-\[\d+px\]/g,
};

// Exceptions - tokens and classes we should ignore
const exceptions = [
  // Design system documentation
  'DESIGN_SYSTEM.md',
  'design-system-migration.js',
  'migrate-design-system.js',
  'audit-design-system.js',
  
  // Allowed color values (e.g., standard colors)
  '#000000',
  '#ffffff',
  '#000',
  '#fff',
  'rgba(0, 0, 0',
  'rgba(255, 255, 255',
];

// Check if an issue should be ignored
function shouldIgnore(issue, filePath) {
  // Ignore exceptions
  for (const exception of exceptions) {
    if (issue.match.includes(exception)) {
      return true;
    }
  }
  
  // Ignore specific files
  if (filePath.includes('node_modules') ||
      filePath.includes('dist') ||
      filePath.includes('.next') ||
      filePath.includes('.git')) {
    return true;
  }
  
  return false;
}

// Scan a file for design system violations
function scanFile(filePath) {
  try {
    const content = fs.readFileSync(filePath, 'utf8');
    const issues = [];
    
    // Check each pattern
    for (const [name, pattern] of Object.entries(patterns)) {
      const matches = content.match(pattern);
      if (matches) {
        // Process each match
        matches.forEach(match => {
          if (!shouldIgnore({ match }, filePath)) {
            const lineNumber = getLineNumber(content, match);
            issues.push({
              type: name,
              match,
              line: lineNumber,
            });
          }
        });
      }
    }
    
    return issues;
  } catch (error) {
    console.error(`Error scanning ${filePath}:`, error.message);
    return [];
  }
}

// Get the line number for a match in the content
function getLineNumber(content, match) {
  const lines = content.split('\n');
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].includes(match)) {
      return i + 1;
    }
  }
  return -1;
}

// Format the results
function formatResults(results) {
  let output = '\nDesign System Audit Results\n==========================\n\n';
  
  // Summary
  const totalIssues = Object.values(results).reduce((sum, issues) => sum + issues.length, 0);
  output += `Total files scanned: ${Object.keys(results).length}\n`;
  output += `Total issues found: ${totalIssues}\n\n`;
  
  // Sort files by number of issues (highest first)
  const sortedFiles = Object.entries(results)
    .filter(([_, issues]) => issues.length > 0)
    .sort((a, b) => b[1].length - a[1].length);
  
  // If no issues, show a message
  if (sortedFiles.length === 0) {
    output += '🎉 No design system violations found! Great job!\n';
    return output;
  }
  
  // Group by issue type
  const issuesByType = {};
  for (const [file, issues] of sortedFiles) {
    for (const issue of issues) {
      if (!issuesByType[issue.type]) {
        issuesByType[issue.type] = [];
      }
      issuesByType[issue.type].push({ file, ...issue });
    }
  }
  
  // Display issues by type
  output += 'Issues by Type\n-------------\n\n';
  for (const [type, issues] of Object.entries(issuesByType)) {
    output += `${type}: ${issues.length} issues\n`;
  }
  output += '\n';
  
  // Display issues by file
  output += 'Issues by File\n-------------\n\n';
  for (const [file, issues] of sortedFiles) {
    output += `${file} (${issues.length} issues):\n`;
    
    // Group by issue type within file
    const fileIssuesByType = {};
    for (const issue of issues) {
      if (!fileIssuesByType[issue.type]) {
        fileIssuesByType[issue.type] = [];
      }
      fileIssuesByType[issue.type].push(issue);
    }
    
    for (const [type, typeIssues] of Object.entries(fileIssuesByType)) {
      output += `  ${type} (${typeIssues.length}):\n`;
      // Only show first 5 examples to avoid excessive output
      const samplesToShow = typeIssues.slice(0, 5);
      for (const issue of samplesToShow) {
        output += `    Line ${issue.line}: ${issue.match}\n`;
      }
      if (typeIssues.length > 5) {
        output += `    ... and ${typeIssues.length - 5} more\n`;
      }
    }
    
    output += '\n';
  }
  
  // Recommendations
  output += 'Recommendations\n--------------\n\n';
  output += '1. Replace hardcoded hex colors with design system tokens\n';
  output += '   Example: #7c3aed → var(--nextprop-primary) or text-primary-600\n\n';
  output += '2. Replace hardcoded spacing values with spacing tokens\n';
  output += '   Example: margin: 16px → margin: var(--spacing-4) or m-4\n\n';
  output += '3. Replace hardcoded font sizes with typography tokens\n';
  output += '   Example: font-size: 14px → font-size: var(--text-sm) or text-sm\n\n';
  output += '4. Use the migration script to automate these replacements\n';
  output += '   Run: node src/scripts/migrate-design-system.js\n';
  
  return output;
}

// Run the audit
function run() {
  const srcDir = path.join(process.cwd(), 'src');
  console.log(`Starting design system audit in ${srcDir}`);
  
  const results = {};
  
  // Scan React components
  const reactFiles = glob.sync(path.join(srcDir, '**/*.{tsx,jsx}'));
  for (const file of reactFiles) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`Scanning ${relPath}`);
    
    const issues = scanFile(file);
    if (issues.length > 0) {
      results[relPath] = issues;
    }
  }
  
  // Scan CSS files
  const cssFiles = glob.sync(path.join(srcDir, '**/*.{css,scss}'));
  for (const file of cssFiles) {
    const relPath = path.relative(process.cwd(), file);
    console.log(`Scanning ${relPath}`);
    
    const issues = scanFile(file);
    if (issues.length > 0) {
      results[relPath] = issues;
    }
  }
  
  // Format and display results
  const formattedResults = formatResults(results);
  console.log(formattedResults);
  
  // Write results to a file
  const outputPath = path.join(process.cwd(), 'design-system-audit.txt');
  fs.writeFileSync(outputPath, formattedResults, 'utf8');
  console.log(`Audit results saved to ${outputPath}`);
}

// Execute the script
run(); 