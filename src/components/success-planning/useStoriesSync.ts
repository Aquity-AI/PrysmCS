import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabaseClient';
import {
  migrateDashboardStoriesToSupabase,
  checkIfDashboardMigrationNeeded,
  getStoriesFromSupabase,
  saveStoryToSupabase,
  deleteStoryFromSupabase,
} from './dashboardStoriesMigration';

interface Story {
  id: string;
  quote: string;
  initials?: string;
  context?: string;
  patientInitials?: string;
  condition?: string;
  is_visible?: boolean;
  show_in_main_tab?: boolean;
  month_association?: string;
  display_order?: number;
}

interface LegacyStory {
  id: number;
  quote: string;
  patientInitials?: string;
  condition?: string;
  title?: string;
}

export function useStoriesSync(
  clientId: string,
  selectedMonth: string,
  legacyStories?: { [month: string]: LegacyStory[] }
) {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationComplete, setMigrationComplete] = useState(false);

  const loadStories = useCallback(async () => {
    if (!clientId) {
      setStories([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      if (legacyStories && !migrationComplete) {
        const needsMigration = await checkIfDashboardMigrationNeeded(clientId, legacyStories);

        if (needsMigration) {
          setIsMigrating(true);
          const result = await migrateDashboardStoriesToSupabase(clientId, legacyStories);
          setIsMigrating(false);
          setMigrationComplete(true);

          if (!result.success) {
            console.error('Migration failed:', result.error);
          }
        }
      }

      const storiesData = await getStoriesFromSupabase(clientId, selectedMonth);

      const mappedStories = storiesData.map((s: any) => ({
        id: s.id,
        quote: s.quote,
        initials: s.initials,
        context: s.context,
        patientInitials: s.initials,
        condition: s.context,
        is_visible: s.is_visible,
        show_in_main_tab: s.show_in_main_tab,
        month_association: s.month_association,
        display_order: s.display_order,
      }));

      setStories(mappedStories);
    } catch (error) {
      console.error('Error loading stories:', error);
      setStories([]);
    } finally {
      setIsLoading(false);
    }
  }, [clientId, selectedMonth, legacyStories, migrationComplete]);

  useEffect(() => {
    loadStories();
  }, [loadStories]);

  useEffect(() => {
    if (!clientId) return;

    const channel = supabase
      .channel(`stories-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'success_stories',
          filter: `client_id=eq.${clientId}`,
        },
        (payload) => {
          console.log('Story change detected:', payload);
          loadStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId, loadStories]);

  const addStory = useCallback(
    async (story: Partial<Story>) => {
      if (!clientId) return null;

      const maxOrder = stories.length > 0 ? Math.max(...stories.map(s => s.display_order || 0)) : -1;

      const result = await saveStoryToSupabase(clientId, {
        quote: story.quote || '',
        initials: story.initials || story.patientInitials || '',
        context: story.context || story.condition || '',
        month_association: selectedMonth,
        display_order: maxOrder + 1,
        is_visible: true,
        show_in_main_tab: true,
      });

      if (result.success) {
        await loadStories();
        return result.id;
      }

      return null;
    },
    [clientId, selectedMonth, stories, loadStories]
  );

  const updateStory = useCallback(
    async (storyId: string, updates: Partial<Story>) => {
      if (!clientId) return false;

      const story = stories.find(s => s.id === storyId);
      if (!story) return false;

      const result = await saveStoryToSupabase(clientId, {
        id: storyId,
        quote: updates.quote !== undefined ? updates.quote : story.quote,
        initials: updates.initials !== undefined ? updates.initials : (updates.patientInitials || story.initials),
        context: updates.context !== undefined ? updates.context : (updates.condition || story.context),
        month_association: story.month_association,
        display_order: updates.display_order !== undefined ? updates.display_order : story.display_order,
        is_visible: updates.is_visible !== undefined ? updates.is_visible : story.is_visible,
        show_in_main_tab: updates.show_in_main_tab !== undefined ? updates.show_in_main_tab : story.show_in_main_tab,
      });

      if (result.success) {
        await loadStories();
        return true;
      }

      return false;
    },
    [clientId, stories, loadStories]
  );

  const deleteStory = useCallback(
    async (storyId: string) => {
      if (!clientId) return false;

      const success = await deleteStoryFromSupabase(storyId);

      if (success) {
        await loadStories();
        return true;
      }

      return false;
    },
    [clientId, loadStories]
  );

  return {
    stories,
    isLoading,
    isMigrating,
    addStory,
    updateStory,
    deleteStory,
    refreshStories: loadStories,
  };
}
