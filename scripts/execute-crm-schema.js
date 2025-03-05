const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const fs = require('fs');
const path = require('path');

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhocml0c2lzenFhbWxoenh5Z2pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTEyNjUwOCwiZXhwIjoyMDU2NzAyNTA4fQ.bvj-AQepP2_vpnlqt16u-YG_-vfXqVk01l2wbEPbI1I";

if (!supabaseUrl) {
  console.error('Missing Supabase URL. Make sure NEXT_PUBLIC_SUPABASE_URL is set in .env.local');
  process.exit(1);
}

console.log(`Connecting to Supabase at: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Read the SQL schema file
const schemaFilePath = path.join(__dirname, '..', 'supabase', 'ghl_migration_schema.sql');
let schemaSQL;

try {
  schemaSQL = fs.readFileSync(schemaFilePath, 'utf8');
  console.log('Successfully read schema file');
} catch (error) {
  console.error('Error reading schema file:', error);
  process.exit(1);
}

// Execute the schema SQL against Supabase
async function executeSchema() {
  try {
    // First, check if the update_timestamp function exists
    // If not, create it before running the rest of the schema
    const timestampFunctionSQL = `
      CREATE OR REPLACE FUNCTION update_timestamp()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `;

    // Execute the timestamp function first to ensure it exists
    const { error: timestampError } = await supabase.rpc('execute_sql', { 
      sql_query: timestampFunctionSQL 
    });

    if (timestampError && !timestampError.message.includes('already exists')) {
      console.error('Error creating timestamp function:', timestampError);
    } else {
      console.log('Timestamp function is ready');
    }

    // Now execute the main schema
    const { error } = await supabase.rpc('execute_sql', { 
      sql_query: schemaSQL 
    });

    if (error) {
      console.error('Error executing schema SQL:', error);
      
      // Try executing statement by statement as a fallback
      console.log('Trying to execute SQL statements individually...');
      const statements = schemaSQL.split(';').filter(stmt => stmt.trim().length > 0);
      
      for (const statement of statements) {
        try {
          const { error: stmtError } = await supabase.rpc('execute_sql', { 
            sql_query: statement + ';' 
          });
          
          if (stmtError) {
            console.error(`Error executing statement: ${statement.substring(0, 50)}...`, stmtError);
          } else {
            console.log(`Successfully executed: ${statement.substring(0, 50)}...`);
          }
        } catch (stmtExecError) {
          console.error(`Exception executing statement: ${statement.substring(0, 50)}...`, stmtExecError);
        }
      }
    } else {
      console.log('Successfully executed schema SQL');
    }
  } catch (error) {
    console.error('Exception executing schema:', error);
  }
}

executeSchema().then(() => {
  console.log('Schema execution completed');
}).catch(error => {
  console.error('Unhandled error during schema execution:', error);
}); 