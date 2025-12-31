import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient();
    
    // Buscar lista de cron jobs
    const { data: jobsData, error: jobsError } = await supabase.rpc('exec_sql', {
      query_text: `
        SELECT jobid, jobname, schedule, active
        FROM cron.job
        WHERE active = true
        ORDER BY jobid
      `
    });
    
    // Buscar últimas execuções
    const { data: execData, error: execError } = await supabase.rpc('exec_sql', {
      query_text: `
        SELECT 
          jrd.runid,
          jrd.jobid,
          j.jobname,
          jrd.status,
          jrd.start_time,
          jrd.end_time,
          LEFT(jrd.return_message, 200) as return_message
        FROM cron.job_run_details jrd
        LEFT JOIN cron.job j ON jrd.jobid = j.jobid
        WHERE jrd.start_time > NOW() - INTERVAL '24 hours'
        ORDER BY jrd.start_time DESC
        LIMIT 50
      `
    });
    
    return NextResponse.json({
      jobs: jobsData || [],
      executions: execData || [],
      timestamp: new Date().toISOString()
    });
    
  } catch (error: any) {
    console.error('Erro ao buscar cron jobs:', error);
    return NextResponse.json(
      { error: error.message, jobs: [], executions: [] },
      { status: 500 }
    );
  }
}
