import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function POST(request: Request) {
  try {
    const { businessId } = await request.json();
    
    if (!businessId) {
      return NextResponse.json(
        { error: "Missing businessId parameter" },
        { status: 400 }
      );
    }
    
    console.log('Seeding pipelines for business ID:', businessId);
    
    // Create server-side Supabase client (bypasses RLS)
    const supabase = createClient();
    
    // Check if pipelines already exist for this business
    const { data: existingPipelines, error: checkError } = await supabase
      .from('pipelines')
      .select('id')
      .eq('business_id', businessId);
      
    if (checkError) {
      console.error('Error checking existing pipelines:', checkError);
      return NextResponse.json(
        { error: "Failed to check existing pipelines" },
        { status: 500 }
      );
    }
    
    // If pipelines already exist, don't create duplicates
    if (existingPipelines && existingPipelines.length > 0) {
      console.log('Pipelines already exist for this business');
      return NextResponse.json({ 
        message: "Pipelines already exist", 
        count: existingPipelines.length 
      });
    }
    
    // Create Real Estate Deals pipeline
    const { data: realEstatePipeline, error: realEstateError } = await supabase
      .from('pipelines')
      .insert({
        name: 'Real Estate Deals',
        business_id: businessId
      })
      .select()
      .single();
    
    if (realEstateError) {
      console.error('Error creating real estate pipeline:', realEstateError);
      return NextResponse.json(
        { error: "Failed to create real estate pipeline" },
        { status: 500 }
      );
    }
    
    // Create stages for Real Estate pipeline
    const realEstateStages = [
      { name: 'Lead', position: 1, pipeline_id: realEstatePipeline.id, business_id: businessId },
      { name: 'Property Viewing', position: 2, pipeline_id: realEstatePipeline.id, business_id: businessId },
      { name: 'Negotiation', position: 3, pipeline_id: realEstatePipeline.id, business_id: businessId },
      { name: 'Contract', position: 4, pipeline_id: realEstatePipeline.id, business_id: businessId },
      { name: 'Closed', position: 5, pipeline_id: realEstatePipeline.id, business_id: businessId }
    ];
    
    for (const stage of realEstateStages) {
      const { error: stageError } = await supabase
        .from('pipeline_stages')
        .insert(stage);
        
      if (stageError) {
        console.error('Error creating stage:', stageError);
      }
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
      console.error('Error creating investor pipeline:', investorError);
      return NextResponse.json({
        message: "Created real estate pipeline only",
        pipelines: [realEstatePipeline]
      });
    }
    
    // Create stages for Investor pipeline
    const investorStages = [
      { name: 'Initial Contact', position: 1, pipeline_id: investorPipeline.id, business_id: businessId },
      { name: 'Presentation', position: 2, pipeline_id: investorPipeline.id, business_id: businessId },
      { name: 'Due Diligence', position: 3, pipeline_id: investorPipeline.id, business_id: businessId },
      { name: 'Term Sheet', position: 4, pipeline_id: investorPipeline.id, business_id: businessId },
      { name: 'Funding', position: 5, pipeline_id: investorPipeline.id, business_id: businessId }
    ];
    
    for (const stage of investorStages) {
      const { error: stageError } = await supabase
        .from('pipeline_stages')
        .insert(stage);
        
      if (stageError) {
        console.error('Error creating stage:', stageError);
      }
    }
    
    return NextResponse.json({
      message: "Successfully created pipelines",
      pipelines: [realEstatePipeline, investorPipeline]
    });
    
  } catch (error: any) {
    console.error('Error in pipeline seed endpoint:', error);
    return NextResponse.json(
      { error: error.message || "Failed to seed pipelines" },
      { status: 500 }
    );
  }
} 