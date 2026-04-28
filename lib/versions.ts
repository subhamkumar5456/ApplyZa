import { createServerSupabaseClient } from '@/lib/supabase/server';
import { AppError } from '@/lib/errors';

export interface SaveVersionParams {
  userId: string;
  resumeId: string;
  analysisId?: string | null;
  latexContent: string;
  source: 'manual' | 'ai_refined' | 'ai_generated' | 'template';
  versionLabel?: string;
  jobTitle?: string;
  company?: string;
  atsScore?: number;
  diffSummary?: string;
  modifications?: string[];
}

export async function saveVersion(params: SaveVersionParams) {
  const supabase = createServerSupabaseClient();

  // Determine count to auto-generate version_label
  const { count, error: countError } = await supabase
    .from('resume_versions')
    .select('*', { count: 'exact', head: true })
    .eq('resume_id', params.resumeId)
    .eq('source', params.source);

  if (countError) {
    console.error('[Versions] Error counting versions:', countError);
    throw new AppError('Failed to count existing versions', 'COUNT_VERSIONS_ERROR', 500, true);
  }

  const versionCount = (count || 0) + 1;
  
  let generatedLabel = params.versionLabel;
  
  if (!generatedLabel) {
    let labelParts = [];
    if (params.source === 'manual') labelParts.push(`Manual v${versionCount}`);
    else if (params.source === 'ai_refined') labelParts.push(`Refined v${versionCount}`);
    else if (params.source === 'ai_generated') labelParts.push(`Generated v${versionCount}`);
    else if (params.source === 'template') labelParts.push(`Template v${versionCount}`);

    if (params.jobTitle) {
      labelParts.push(params.company ? `${params.jobTitle} @ ${params.company}` : params.jobTitle);
    }
    generatedLabel = labelParts.join(' — ');
  }

  const { data, error } = await supabase
    .from('resume_versions')
    .insert({
      user_id: params.userId,
      resume_id: params.resumeId,
      analysis_id: params.analysisId ?? null,
      version_type: params.source === 'manual' ? 'manual' : 'refined', // legacy compat
      latex_content: params.latexContent,
      modifications: params.modifications ?? [],
      version_label: generatedLabel,
      source: params.source,
      job_title: params.jobTitle ?? null,
      company: params.company ?? null,
      ats_score: params.atsScore ?? null,
      diff_summary: params.diffSummary ?? null,
    })
    .select('*')
    .single();

  if (error) {
    console.error('[Versions] Error saving version:', error);
    throw new AppError('Failed to save resume version', 'SAVE_VERSION_ERROR', 500, true);
  }

  return data;
}

export async function getVersions(resumeId: string, userId: string) {
  const supabase = createServerSupabaseClient();
  
  const { data, error } = await supabase
    .from('resume_versions')
    .select('id, version_type, version_label, modifications, analysis_id, source, job_title, company, ats_score, diff_summary, is_favorite, created_at')
    .eq('resume_id', resumeId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[Versions] Error fetching versions:', error);
    throw new AppError('Failed to fetch resume versions', 'FETCH_VERSIONS_ERROR', 500, true);
  }

  return data;
}

export async function toggleFavorite(versionId: string, userId: string, isFavorite: boolean) {
  const supabase = createServerSupabaseClient();

  const { data, error } = await supabase
    .from('resume_versions')
    .update({ is_favorite: isFavorite })
    .eq('id', versionId)
    .eq('user_id', userId)
    .select('*')
    .single();

  if (error) {
    console.error('[Versions] Error toggling favorite:', error);
    throw new AppError('Failed to update favorite status', 'UPDATE_FAVORITE_ERROR', 500, true);
  }

  return data;
}
