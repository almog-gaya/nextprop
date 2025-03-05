#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Path to schema file
const schemaPath = path.join(__dirname, '..', 'supabase', 'schema.sql');

console.log('\n📦 Supabase Database Initialization Helper 📦\n');

// Check if schema file exists
if (!fs.existsSync(schemaPath)) {
  console.error('❌ Schema file not found at:', schemaPath);
  process.exit(1);
}

// Read schema file
const schema = fs.readFileSync(schemaPath, 'utf8');

console.log('This script will help you initialize your Supabase database.\n');
console.log('Steps:');
console.log('1. Log in to your Supabase dashboard: https://app.supabase.io');
console.log('2. Select your project');
console.log('3. Go to the SQL Editor in the left sidebar');
console.log('4. Create a new query');
console.log('5. Copy and paste the SQL below into the editor');
console.log('6. Run the query\n');

rl.question('Would you like to copy the schema to clipboard? (y/n): ', (answer) => {
  if (answer.toLowerCase() === 'y') {
    try {
      // Try to copy to clipboard
      if (process.platform === 'darwin') {
        // macOS
        execSync(`echo "${schema}" | pbcopy`);
        console.log('✅ Schema copied to clipboard!');
      } else if (process.platform === 'win32') {
        // Windows
        execSync(`echo ${schema} | clip`);
        console.log('✅ Schema copied to clipboard!');
      } else if (process.platform === 'linux') {
        // Linux (requires xclip)
        try {
          execSync(`echo "${schema}" | xclip -selection clipboard`);
          console.log('✅ Schema copied to clipboard!');
        } catch (e) {
          console.log('❌ Failed to copy to clipboard. Do you have xclip installed?');
          console.log('You can install it with: sudo apt-get install xclip');
          printSchema();
        }
      } else {
        console.log('❌ Clipboard copy not supported on this platform.');
        printSchema();
      }
    } catch (error) {
      console.log('❌ Failed to copy to clipboard:', error.message);
      printSchema();
    }
  } else {
    printSchema();
  }
  
  rl.close();
});

function printSchema() {
  console.log('\n=== SQL SCHEMA START ===\n');
  console.log(schema);
  console.log('\n=== SQL SCHEMA END ===\n');
  
  console.log('Copy the SQL above and paste it into the Supabase SQL Editor, then run the query.');
} 