import { supabase } from './supabaseClient';

interface LegacyStory {
  id: number;
  quote: string;
  patientInitials?: string;
  condition?: string;
  title?: string;
  patientType?: string;
}

interface LegacyClientData {
  clientId: string;
  stories: {
    [month: string]: LegacyStory[];
  };
}

export async function migrateDashboardStoriesToSupabase(
  clientId: string,
  legacyStories: { [month: string]: LegacyStory[] }
): Promise<{ success: boolean; migratedCount: number; error?: string }> {
  console.log('Starting Dashboard Management stories migration for client:', clientId);

  try {
    let migratedCount = 0;

    for (const [month, monthStories] of Object.entries(legacyStories)) {
      if (!monthStories || monthStories.length === 0) continue;

      for (let i = 0; i < monthStories.length; i++) {
        const story = monthStories[i];

        if (!story.quote || !story.quote.trim()) continue;

        const storyData = {
          client_id: clientId,
          quote: story.quote,
          initials: story.patientInitials || '',
          context: story.condition || story.title || '',
          is_visible: true,
          show_in_main_tab: true,
          month_association: month,
          display_order: i,
        };

        const { error } = await supabase
          .from('success_stories')
          .insert(storyData);

        if (error) {
          console.error('Error migrating story:', error);
        } else {
          migratedCount++;
        }
      }
    }

    console.log(`Successfully migrated ${migratedCount} stories for client ${clientId}`);
    return { success: true, migratedCount };
  } catch (error) {
    console.error('Migration failed:', error);
    return {
      success: false,
      migratedCount: 0,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function checkIfDashboardMigrationNeeded(
  clientId: string,
  localStories: { [month: string]: LegacyStory[] }
): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('success_stories')
      .select('id')
      .eq('client_id', clientId)
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Error checking migration status:', error);
      return true;
    }

    const hasLocalStories = Object.values(localStories).some(
      monthStories => monthStories && monthStories.length > 0
    );

    return hasLocalStories && !data;
  } catch (error) {
    console.error('Error checking migration status:', error);
    return false;
  }
}

export async function getStoriesFromSupabase(
  clientId: string,
  month?: string
): Promise<any[]> {
  try {
    let query = supabase
      .from('success_stories')
      .select('*')
      .eq('client_id', clientId)
      .order('display_order', { ascending: true });

    if (month) {
      query = query.eq('month_association', month);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Error fetching stories:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error fetching stories:', error);
    return [];
  }
}

export async function updateStoryOrder(
  storyId: string,
  newOrder: number
): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('success_stories')
      .update({ display_order: newOrder })
      .eq('id', storyId);

    if (error) {
      console.error('Error updating story order:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error updating story order:', error);
    return false;
  }
}

export async function saveStoryToSupabase(
  clientId: string,
  story: {
    id?: string;
    quote: string;
    initials?: string;
    context?: string;
    month_association?: string;
    display_order?: number;
    is_visible?: boolean;
    show_in_main_tab?: boolean;
  }
): Promise<{ success: boolean; id?: string; error?: string }> {
  try {
    const storyData = {
      client_id: clientId,
      quote: story.quote,
      initials: story.initials || '',
      context: story.context || '',
      is_visible: story.is_visible !== undefined ? story.is_visible : true,
      show_in_main_tab: story.show_in_main_tab !== undefined ? story.show_in_main_tab : true,
      month_association: story.month_association || null,
      display_order: story.display_order !== undefined ? story.display_order : 0,
    };

    if (story.id) {
      const { error } = await supabase
        .from('success_stories')
        .update(storyData)
        .eq('id', story.id);

      if (error) {
        console.error('Error updating story:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: story.id };
    } else {
      const { data, error } = await supabase
        .from('success_stories')
        .insert(storyData)
        .select('id')
        .single();

      if (error) {
        console.error('Error creating story:', error);
        return { success: false, error: error.message };
      }

      return { success: true, id: data.id };
    }
  } catch (error) {
    console.error('Error saving story:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

export async function deleteStoryFromSupabase(storyId: string): Promise<boolean> {
  try {
    const { error } = await supabase
      .from('success_stories')
      .delete()
      .eq('id', storyId);

    if (error) {
      console.error('Error deleting story:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error deleting story:', error);
    return false;
  }
}
