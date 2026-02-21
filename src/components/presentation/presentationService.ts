import { supabase } from '../dashboard-graphs/supabaseClient';
import type { PresentationConfig, PresentationGlobalSettings, SlideOverride, SlideData } from './types';

export async function fetchPresentationConfig(clientId: string): Promise<PresentationConfig | null> {
  const { data, error } = await supabase
    .from('presentation_configs')
    .select('*')
    .eq('client_id', clientId)
    .eq('config_name', 'Default Presentation')
    .is('deleted_at', null)
    .maybeSingle();

  if (error) {
    console.error('[presentationService] Error fetching config:', error);
    return null;
  }
  return data as PresentationConfig | null;
}

export async function upsertPresentationConfig(
  clientId: string,
  slideOverrides: Record<string, SlideOverride>,
  globalSettings: PresentationGlobalSettings,
  customSlides: SlideData[],
): Promise<PresentationConfig | null> {
  const existing = await fetchPresentationConfig(clientId);

  if (existing) {
    const { data, error } = await supabase
      .from('presentation_configs')
      .update({
        slide_overrides: slideOverrides,
        global_settings: globalSettings,
        custom_slides: customSlides,
        last_opened_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', existing.id)
      .select()
      .maybeSingle();

    if (error) {
      console.error('[presentationService] Error updating config:', error);
      return null;
    }
    return data as PresentationConfig | null;
  }

  const { data, error } = await supabase
    .from('presentation_configs')
    .insert({
      client_id: clientId,
      config_name: 'Default Presentation',
      slide_overrides: slideOverrides,
      global_settings: globalSettings,
      custom_slides: customSlides,
      last_opened_at: new Date().toISOString(),
    })
    .select()
    .maybeSingle();

  if (error) {
    console.error('[presentationService] Error inserting config:', error);
    return null;
  }
  return data as PresentationConfig | null;
}

export async function touchPresentationConfig(clientId: string): Promise<void> {
  const existing = await fetchPresentationConfig(clientId);
  if (existing) {
    await supabase
      .from('presentation_configs')
      .update({ last_opened_at: new Date().toISOString() })
      .eq('id', existing.id);
  }
}
