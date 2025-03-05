import { supabase } from './supabase';
import { getCurrentUser } from './supabase';
import { 
  ContactCreate, ContactUpdate, 
  PipelineCreate, PipelineUpdate, 
  PipelineStageCreate, PipelineStageUpdate,
  OpportunityCreate, OpportunityUpdate
} from '../types/database';

// Get the current business ID for the logged-in user
export async function getCurrentBusinessId(userId?: string) {
  try {
    console.log('getCurrentBusinessId: Getting current user');
    // const user = await getCurrentUser();
    // console.log('getCurrentBusinessId: Current user:', user ? user.email : 'null');
    
    // Almog hardcoded business ID (return regardless of user)
    const ALMOG_BUSINESS_ID = '3a541cbd-2a17-4a28-b384-448f1ce8cf32';
    
    // if(!user) {
    //   /// if user null  go to login
    //   console.log('getCurrentBusinessId: No user found, returning null');
      
    // }
    // // If user is null, but we're in a server context (like API routes), 
    // // return the hardcoded business ID for testing purposes
    // if (!user) {
    //   console.log('getCurrentBusinessId: No user found, returning hardcoded business for testing');
    //   return ALMOG_BUSINESS_ID;
    // }
    
    // // Special handling for almog@gaya.app user
    // if (user.id === '1fba1611-fdc5-438b-8575-34670faafe05' || user.email === 'almog@gaya.app') {
    //   console.log('Special handling for almog@gaya.app user in CRM module');
    //   // Return the hardcoded business ID that matches the one used in other components
    //   return ALMOG_BUSINESS_ID;
    // }
    
    if(!userId){
      console.log(`Returning ALMOG businessId as userId is ${userId}`)
    }
    // Normal flow for other users
    const { data, error } = await supabase
      .from('businesses')
      .select('id')
      .eq('user_id', userId || ALMOG_BUSINESS_ID)
      .single();
    
    if (error) {
      console.error('Error fetching business ID:', error);
      return null;
    }
    
    return data?.id;
  } catch (error) {
    console.error('Error in getCurrentBusinessId:', error);
    return '3a541cbd-2a17-4a28-b384-448f1ce8cf32'; // Fallback to hardcoded business ID
  }
}

// -------------------- CONTACTS --------------------

export async function getContacts(params: any) {
  const currentUserId = params.userId;
  const businessId = await getCurrentBusinessId(currentUserId);
  if (!businessId) return { contacts: [], meta: { total: 0 } };
  
  const { data, error, count } = await supabase
    .from('contacts')
    .select('*', { count: 'exact' })
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching contacts:', error);
    return { contacts: [], meta: { total: 0 } };
  }
  
  return { 
    contacts: data || [], 
    meta: { 
      total: count || 0,
      count: data?.length || 0,
      currentPage: 1,
      nextPage: null,
      prevPage: null 
    } 
  };
}

export async function getContactById(contactId: string, params: any) {
  const businessId = await getCurrentBusinessId(params.userId);
  if (!businessId) return null;
  
  const { data, error } = await supabase
    .from('contacts')
    .select('*')
    .eq('id', contactId)
    .eq('business_id', businessId)
    .single();
  
  if (error) {
    console.error('Error fetching contact:', error);
    return null;
  }
  
  return data;
}

export async function createContact(contact: ContactCreate, params: any) {
  const businessId = await getCurrentBusinessId(params.userId);
  if (!businessId) throw new Error('No business found for current user');
  
  const { data, error } = await supabase
    .from('contacts')
    .insert({ ...contact, business_id: businessId })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating contact:', error);
    throw error;
  }
  
  return data;
}

export async function updateContact(contactId: string, updates: ContactUpdate, params: any) {
  const businessId = await getCurrentBusinessId(params.userId);
  if (!businessId) throw new Error('No business found for current user');
  
  const { data, error } = await supabase
    .from('contacts')
    .update(updates)
    .eq('id', contactId)
    .eq('business_id', businessId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating contact:', error);
    throw error;
  }
  
  return data;
}

export async function deleteContact(contactId: string) {
  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error('No business found for current user');
  
  const { error } = await supabase
    .from('contacts')
    .delete()
    .eq('id', contactId)
    .eq('business_id', businessId);
  
  if (error) {
    console.error('Error deleting contact:', error);
    throw error;
  }
  
  return true;
}

// -------------------- PIPELINES --------------------

export async function getPipelines(businessId?: string) {
  console.log('getPipelines: Fetching business ID'); 
  console.log('getPipelines: Business ID retrieved:', businessId);
  
  if (!businessId) {
    console.log('getPipelines: No business ID found, returning empty array');
    return [];
  }
  
  console.log('getPipelines: Querying Supabase for pipelines with business ID:', businessId);
  let { data, error } = await supabase
    .from('pipelines')
    .select('*')
    .eq('business_id', businessId)
    .order('created_at', { ascending: false });
  
  if (error) {
    console.error('Error fetching pipelines:', error);
    return [];
  }
  
  console.log('getPipelines: Raw pipeline data:', data);
  
  // If no pipelines found for Almog's account, try to create them
  if ((!data || data.length === 0) && businessId === '3a541cbd-2a17-4a28-b384-448f1ce8cf32') {
    console.log('getPipelines: No pipelines found for Almog, attempting to create pipelines');
    
    try {
      // Try the seed API first (if we're in a browser context)
      if (typeof window !== 'undefined') {
        // Create a fully qualified URL that works in both client and server environments
        const apiUrl = `${window.location.origin}/api/pipelines/seed`;
        
        console.log('Calling seed API at:', apiUrl);
        
        // Call the seed API to create real pipelines in the database
        const response = await fetch(apiUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ businessId })
        });
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('Seed API returned error:', response.status, errorText);
        } else {
          const result = await response.json();
          console.log('Seed API response:', result);
        }
      } else {
        // Direct database seeding for server-side contexts where API calls might not work
        console.log('Server-side context detected, trying direct database seeding');
        
        // First, check if we have any pipelines again (might have been created since our first check)
        const { data: checkData } = await supabase
          .from('pipelines')
          .select('id')
          .eq('business_id', businessId);
          
        if (checkData && checkData.length > 0) {
          console.log('Pipelines now exist, skipping creation');
        } else {
          // Create Real Estate pipeline
          const { data: realEstatePipeline, error: realEstateError } = await supabase
            .from('pipelines')
            .insert({
              name: 'Real Estate Deals',
              business_id: businessId
            })
            .select()
            .single();
            
          if (realEstateError) {
            console.error('Error directly creating real estate pipeline:', realEstateError);
          } else if (realEstatePipeline) {
            // Create stages for Real Estate pipeline
            const realEstateStages = [
              { name: 'Lead', position: 1, pipeline_id: realEstatePipeline.id, business_id: businessId },
              { name: 'Property Viewing', position: 2, pipeline_id: realEstatePipeline.id, business_id: businessId },
              { name: 'Negotiation', position: 3, pipeline_id: realEstatePipeline.id, business_id: businessId },
              { name: 'Contract', position: 4, pipeline_id: realEstatePipeline.id, business_id: businessId },
              { name: 'Closed', position: 5, pipeline_id: realEstatePipeline.id, business_id: businessId }
            ];
            
            for (const stage of realEstateStages) {
              await supabase.from('pipeline_stages').insert(stage);
            }
            
            // Create Investor Relations pipeline
            const { data: investorPipeline, error: investorError } = await supabase
              .from('pipelines')
              .insert({
                name: 'Investor Relations',
                business_id: businessId
              })
              .select()
              .single();
              
            if (investorError) {
              console.error('Error directly creating investor pipeline:', investorError);
            } else if (investorPipeline) {
              // Create stages for Investor pipeline
              const investorStages = [
                { name: 'Initial Contact', position: 1, pipeline_id: investorPipeline.id, business_id: businessId },
                { name: 'Presentation', position: 2, pipeline_id: investorPipeline.id, business_id: businessId },
                { name: 'Due Diligence', position: 3, pipeline_id: investorPipeline.id, business_id: businessId },
                { name: 'Term Sheet', position: 4, pipeline_id: investorPipeline.id, business_id: businessId },
                { name: 'Funding', position: 5, pipeline_id: investorPipeline.id, business_id: businessId }
              ];
              
              for (const stage of investorStages) {
                await supabase.from('pipeline_stages').insert(stage);
              }
            }
          }
        }
      }
      
      // Fetch the pipelines again after our creation attempts
      const { data: refreshedData, error: refreshError } = await supabase
        .from('pipelines')
        .select('*')
        .eq('business_id', businessId)
        .order('created_at', { ascending: false });
        
      if (refreshError) {
        console.error('Error fetching pipelines after creation attempts:', refreshError);
        return [];
      }
      
      if (!refreshedData || refreshedData.length === 0) {
        console.log('Still no pipelines found after creation attempts, returning empty array');
        return [];
      }
      
      data = refreshedData; // Use the refreshed data
    } catch (seedError) {
      console.error('Error creating pipelines:', seedError);
    }
  }
  
  // For each pipeline, get its stages
  const pipelines = [];
  for (const pipeline of data || []) {
    console.log('getPipelines: Fetching stages for pipeline:', pipeline.id);
    const stages = await getPipelineStages(pipeline.id);
    pipelines.push({
      ...pipeline,
      stages
    });
  }
  
  console.log('getPipelines: Returning', pipelines.length, 'pipelines');
  return pipelines;
}

export async function getPipelineById(pipelineId: string) {
  const businessId = await getCurrentBusinessId();
  if (!businessId) return null;
  
  const { data, error } = await supabase
    .from('pipelines')
    .select('*')
    .eq('id', pipelineId)
    .eq('business_id', businessId)
    .single();
  
  if (error) {
    console.error('Error fetching pipeline:', error);
    return null;
  }
  
  // Get pipeline stages
  const stages = await getPipelineStages(pipelineId);
  
  return {
    ...data,
    stages
  };
}

export async function createPipeline(pipeline: PipelineCreate) {
  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error('No business found for current user');
  
  const { data, error } = await supabase
    .from('pipelines')
    .insert({ ...pipeline, business_id: businessId })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating pipeline:', error);
    throw error;
  }
  
  return data;
}

export async function updatePipeline(pipelineId: string, updates: PipelineUpdate) {
  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error('No business found for current user');
  
  const { data, error } = await supabase
    .from('pipelines')
    .update(updates)
    .eq('id', pipelineId)
    .eq('business_id', businessId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating pipeline:', error);
    throw error;
  }
  
  return data;
}

export async function deletePipeline(pipelineId: string) {
  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error('No business found for current user');
  
  const { error } = await supabase
    .from('pipelines')
    .delete()
    .eq('id', pipelineId)
    .eq('business_id', businessId);
  
  if (error) {
    console.error('Error deleting pipeline:', error);
    throw error;
  }
  
  return true;
}

// -------------------- PIPELINE STAGES --------------------

export async function getPipelineStages(pipelineId: string) {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .select('*')
    .eq('pipeline_id', pipelineId)
    .order('order_num', { ascending: true });
  
  if (error) {
    console.error('Error fetching pipeline stages:', error);
    return [];
  }
  
  return data || [];
}

export async function createPipelineStage(stage: PipelineStageCreate) {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .insert(stage)
    .select()
    .single();
  
  if (error) {
    console.error('Error creating pipeline stage:', error);
    throw error;
  }
  
  return data;
}

export async function updatePipelineStage(stageId: string, updates: PipelineStageUpdate) {
  const { data, error } = await supabase
    .from('pipeline_stages')
    .update(updates)
    .eq('id', stageId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating pipeline stage:', error);
    throw error;
  }
  
  return data;
}

export async function deletePipelineStage(stageId: string) {
  const { error } = await supabase
    .from('pipeline_stages')
    .delete()
    .eq('id', stageId);
  
  if (error) {
    console.error('Error deleting pipeline stage:', error);
    throw error;
  }
  
  return true;
}

// -------------------- OPPORTUNITIES --------------------

export async function getOpportunitiesByPipeline(pipelineId: string, params: any) {
  const businessId = await getCurrentBusinessId(params.userId);
  if (!businessId) return { opportunities: [], meta: { total: 0 } };
  
  const { data, error, count } = await supabase
    .from('opportunities')
    .select('*, contacts(*), pipeline_stages(*)', { count: 'exact' })
    .eq('pipeline_id', pipelineId)
    .eq('business_id', businessId);
  
  if (error) {
    console.error('Error fetching opportunities:', error);
    return { opportunities: [], meta: { total: 0 } };
  }
  
  // Format the opportunities to match the expected structure from GHL API
  const formattedOpportunities = (data || []).map(opp => ({
    id: opp.id,
    name: opp.name,
    monetaryValue: opp.monetary_value,
    pipelineId: opp.pipeline_id,
    pipelineStageId: opp.stage_id,
    status: opp.status,
    source: "",
    updatedAt: opp.updated_at,
    contact: opp.contacts ? {
      id: opp.contacts.id,
      name: opp.contacts.name,
      email: opp.contacts.email,
      phone: opp.contacts.phone,
      company: "",
      tags: opp.contacts.tags || []
    } : null
  }));
  
  return {
    opportunities: formattedOpportunities,
    meta: {
      total: count || 0
    }
  };
}

export async function getOpportunityById(opportunityId: string, params: any) {
  const businessId = await getCurrentBusinessId(params.userId);
  if (!businessId) return null;
  
  const { data, error } = await supabase
    .from('opportunities')
    .select('*, contacts(*)')
    .eq('id', opportunityId)
    .eq('business_id', businessId)
    .single();
  
  if (error) {
    console.error('Error fetching opportunity:', error);
    return null;
  }
  
  // Format to match the expected structure
  return {
    id: data.id,
    name: data.name,
    monetaryValue: data.monetary_value,
    status: data.status,
    contact: data.contacts,
    pipelineId: data.pipeline_id,
    stageId: data.stage_id,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
    // Add more fields as needed
  };
}

export async function createOpportunity(opportunity: Omit<OpportunityCreate, 'business_id'>) {
  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error('No business found for current user');
  
  const { data, error } = await supabase
    .from('opportunities')
    .insert({ ...opportunity, business_id: businessId })
    .select()
    .single();
  
  if (error) {
    console.error('Error creating opportunity:', error);
    throw error;
  }
  
  return data;
}

export async function updateOpportunity(opportunityId: string, updates: OpportunityUpdate) {
  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error('No business found for current user');
  
  const { data, error } = await supabase
    .from('opportunities')
    .update(updates)
    .eq('id', opportunityId)
    .eq('business_id', businessId)
    .select()
    .single();
  
  if (error) {
    console.error('Error updating opportunity:', error);
    throw error;
  }
  
  return data;
}

export async function moveOpportunity(opportunityId: string, newStageId: string) {
  return updateOpportunity(opportunityId, { stage_id: newStageId });
}

export async function deleteOpportunity(opportunityId: string) {
  const businessId = await getCurrentBusinessId();
  if (!businessId) throw new Error('No business found for current user');
  
  const { error } = await supabase
    .from('opportunities')
    .delete()
    .eq('id', opportunityId)
    .eq('business_id', businessId);
  
  if (error) {
    console.error('Error deleting opportunity:', error);
    throw error;
  }
  
  return true;
} 