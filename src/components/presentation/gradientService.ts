import { supabase } from '../dashboard-graphs/supabaseClient';
import type { CustomGradient, GradientColorStop } from './types';
import { buildGradientCSS } from './gradientUtils';

export async function fetchSavedGradients(clientId: string): Promise<CustomGradient[]> {
  const { data, error } = await supabase
    .from('custom_gradients')
    .select('*')
    .eq('client_id', clientId)
    .eq('is_preset', false)
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Failed to fetch saved gradients:', error);
    return [];
  }
  return (data || []) as CustomGradient[];
}

export async function saveCustomGradient(
  clientId: string,
  name: string,
  gradientType: 'linear' | 'radial',
  colors: GradientColorStop[],
  angle: number,
): Promise<CustomGradient | null> {
  const gradientCss = buildGradientCSS(gradientType, colors, angle);

  const { data, error } = await supabase
    .from('custom_gradients')
    .insert({
      client_id: clientId,
      name,
      category: 'custom',
      gradient_css: gradientCss,
      gradient_type: gradientType,
      colors,
      angle,
      is_preset: false,
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('Failed to save gradient:', error);
    return null;
  }
  return data as CustomGradient | null;
}

export async function deleteCustomGradient(gradientId: string): Promise<boolean> {
  const { error } = await supabase
    .from('custom_gradients')
    .update({ deleted_at: new Date().toISOString() })
    .eq('id', gradientId);

  if (error) {
    console.error('Failed to delete gradient:', error);
    return false;
  }
  return true;
}
