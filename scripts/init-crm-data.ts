const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const { v4: uuidv4 } = require('uuid');
const fs = require('fs');
const path = require('path');

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

// Extract Supabase credentials from your app
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// For admin operations like creating records, we need the service role key
// Since you want to use your app's credentials, you'll need to set the SUPABASE_SERVICE_ROLE_KEY
// in .env.local file, or you can set it here directly
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhocml0c2lzenFhbWxoenh5Z2pwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc0MTEyNjUwOCwiZXhwIjoyMDU2NzAyNTA4fQ.bvj-AQepP2_vpnlqt16u-YG_-vfXqVk01l2wbEPbI1I";

if (!supabaseUrl) {
  console.error('Missing Supabase URL. Make sure NEXT_PUBLIC_SUPABASE_URL is set in .env.local');
  process.exit(1);
}

// Using Supabase service role key for admin operations
console.log(`Connecting to Supabase at: ${supabaseUrl}`);
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Get the first business ID for demo purposes
async function getFirstBusinessId() {
  const { data, error } = await supabase
    .from('businesses')
    .select('id')
    .limit(1)
    .single();
  
  if (error) {
    console.error('Error fetching business:', error);
    return null;
  }
  
  return data?.id;
}

// Create a demo pipeline with stages
async function createDemoPipeline(businessId: string, pipelineName: string, stages: string[]) {
  // Create the pipeline
  const { data: pipeline, error: pipelineError } = await supabase
    .from('pipelines')
    .insert({
      id: uuidv4(),
      name: pipelineName,
      business_id: businessId
    })
    .select()
    .single();
  
  if (pipelineError) {
    console.error(`Error creating pipeline ${pipelineName}:`, pipelineError);
    return null;
  }
  
  console.log(`Created pipeline: ${pipelineName}`);
  
  // Create the stages
  for (let i = 0; i < stages.length; i++) {
    const { error: stageError } = await supabase
      .from('pipeline_stages')
      .insert({
        id: uuidv4(),
        name: stages[i],
        pipeline_id: pipeline.id,
        order_num: i + 1
      });
    
    if (stageError) {
      console.error(`Error creating stage ${stages[i]}:`, stageError);
    } else {
      console.log(`Created stage: ${stages[i]}`);
    }
  }
  
  return pipeline;
}

// Create some demo contacts
async function createDemoContacts(businessId: string, contacts: any[]) {
  for (const contact of contacts) {
    const { error } = await supabase
      .from('contacts')
      .insert({
        id: uuidv4(),
        business_id: businessId,
        ...contact
      });
    
    if (error) {
      console.error(`Error creating contact ${contact.name}:`, error);
    } else {
      console.log(`Created contact: ${contact.name}`);
    }
  }
}

// Create some demo opportunities
async function createDemoOpportunities(businessId: string, pipelineId: string, stageId: string, opportunities: any[]) {
  for (const opportunity of opportunities) {
    const { error } = await supabase
      .from('opportunities')
      .insert({
        id: uuidv4(),
        business_id: businessId,
        pipeline_id: pipelineId,
        stage_id: stageId,
        ...opportunity
      });
    
    if (error) {
      console.error(`Error creating opportunity ${opportunity.name}:`, error);
    } else {
      console.log(`Created opportunity: ${opportunity.name}`);
    }
  }
}

// Main function
async function main() {
  try {
    const businessId = await getFirstBusinessId();
    
    if (!businessId) {
      console.error('No business found. Please create a business first.');
      process.exit(1);
    }
    
    // Create Real Estate pipeline
    const realEstatePipeline = await createDemoPipeline(
      businessId,
      'Real Estate Deals',
      ['Lead', 'Contacted', 'Property Assessment', 'Negotiation', 'Contract', 'Closing']
    );
    
    // Create Investor pipeline
    const investorPipeline = await createDemoPipeline(
      businessId,
      'Investor Relations',
      ['Prospecting', 'Initial Meeting', 'Proposal', 'Due Diligence', 'Investment', 'Follow-up']
    );
    
    // Create some contacts
    await createDemoContacts(businessId, [
      { name: 'John Smith', email: 'john@example.com', phone: '555-123-4567' },
      { name: 'Jane Doe', email: 'jane@example.com', phone: '555-987-6543' },
      { name: 'Bob Johnson', email: 'bob@example.com', phone: '555-456-7890' },
      { name: 'Sarah Williams', email: 'sarah@example.com', phone: '555-567-8901' }
    ]);
    
    // Get the first contact to use for opportunities
    const { data: contacts } = await supabase
      .from('contacts')
      .select('id')
      .eq('business_id', businessId)
      .limit(4);
    
    if (realEstatePipeline && contacts && contacts.length > 0) {
      // Get the first stage of the Real Estate pipeline
      const { data: stages } = await supabase
        .from('pipeline_stages')
        .select('id')
        .eq('pipeline_id', realEstatePipeline.id)
        .order('order_num', { ascending: true })
        .limit(3);
      
      if (stages && stages.length > 0) {
        // Create opportunities in the Lead stage
        await createDemoOpportunities(
          businessId,
          realEstatePipeline.id,
          stages[0].id,
          [
            { name: '123 Main St Property', monetary_value: 250000, status: 'active', contact_id: contacts[0].id },
            { name: '456 Oak Ave Property', monetary_value: 375000, status: 'active', contact_id: contacts[1].id }
          ]
        );
        
        // Create opportunities in the Contacted stage
        await createDemoOpportunities(
          businessId,
          realEstatePipeline.id,
          stages[1].id,
          [
            { name: '789 Pine Rd Property', monetary_value: 425000, status: 'active', contact_id: contacts[2].id }
          ]
        );
        
        // Create opportunities in the Property Assessment stage
        await createDemoOpportunities(
          businessId,
          realEstatePipeline.id,
          stages[2].id,
          [
            { name: '101 Cedar Ln Property', monetary_value: 550000, status: 'active', contact_id: contacts[3].id }
          ]
        );
      }
    }
    
    console.log('Demo data creation completed!');
    
  } catch (error) {
    console.error('Error creating demo data:', error);
  }
}

// Run the script
main(); 