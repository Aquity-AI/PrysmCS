import React, { useState, useEffect } from 'react';
import { MessageSquare, X, Plus, Eye, EyeOff } from 'lucide-react';
import { supabase } from './supabaseClient';

interface SuccessStory {
  id: string;
  client_id: string;
  quote: string;
  initials: string;
  context: string;
  is_visible: boolean;
  show_in_main_tab: boolean;
  created_at: string;
  updated_at: string;
}

interface SuccessStoriesSectionProps {
  clientId: string;
}

export function SuccessStoriesSection({ clientId }: SuccessStoriesSectionProps) {
  const [stories, setStories] = useState<SuccessStory[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingStories, setEditingStories] = useState<Array<Partial<SuccessStory>>>([]);

  useEffect(() => {
    loadStories();

    const channel = supabase
      .channel(`stories-health-${clientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'success_stories',
          filter: `client_id=eq.${clientId}`,
        },
        () => {
          loadStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [clientId]);

  const loadStories = async () => {
    try {
      const { data, error } = await supabase
        .from('success_stories')
        .select('*')
        .eq('client_id', clientId)
        .eq('show_in_main_tab', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStories(data || []);
    } catch (error) {
      console.error('Error loading success stories:', error);
    }
  };

  const openEditModal = async () => {
    const { data: allStories } = await supabase
      .from('success_stories')
      .select('*')
      .eq('client_id', clientId)
      .order('created_at', { ascending: false });

    setEditingStories(allStories && allStories.length > 0 ? allStories : [{ quote: '', initials: '', context: '', is_visible: true }]);
    setShowModal(true);
  };

  const handleAddStory = () => {
    setEditingStories([...editingStories, { quote: '', initials: '', context: '', is_visible: true }]);
  };

  const handleRemoveStory = (index: number) => {
    setEditingStories(editingStories.filter((_, i) => i !== index));
  };

  const handleStoryChange = (index: number, field: keyof SuccessStory, value: string | boolean) => {
    const updated = [...editingStories];
    updated[index] = { ...updated[index], [field]: value };
    setEditingStories(updated);
  };

  const handleSave = async () => {
    try {
      const { data: allExistingStories } = await supabase
        .from('success_stories')
        .select('id')
        .eq('client_id', clientId);

      const existingIds = allExistingStories?.map(s => s.id) || [];
      const editingIds = editingStories.filter(s => s.id).map(s => s.id);
      const storiesToDelete = existingIds.filter(id => !editingIds.includes(id));

      if (storiesToDelete.length > 0) {
        await supabase
          .from('success_stories')
          .delete()
          .in('id', storiesToDelete);
      }

      for (let i = 0; i < editingStories.length; i++) {
        const story = editingStories[i];

        if (!story.quote?.trim()) continue;

        const storyData = {
          client_id: clientId,
          quote: story.quote,
          initials: story.initials || '',
          context: story.context || '',
          is_visible: story.is_visible !== false,
          show_in_main_tab: true,
        };

        if (story.id && existingIds.includes(story.id)) {
          await supabase
            .from('success_stories')
            .update(storyData)
            .eq('id', story.id);
        } else {
          await supabase
            .from('success_stories')
            .insert(storyData);
        }
      }

      await loadStories();
      setShowModal(false);
    } catch (error) {
      console.error('Error saving success stories:', error);
      alert('Failed to save success stories. Please try again.');
    }
  };

  const visibleStories = stories.filter(s => s.is_visible);

  return (
    <div style={{
      background: 'white',
      borderRadius: '12px',
      padding: '32px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      marginBottom: '24px'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '12px',
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: '16px'
          }}>
            <MessageSquare size={24} color="white" />
          </div>
          <div>
            <h2 style={{ fontSize: '24px', fontWeight: 700, color: '#0f172a', margin: 0 }}>Stories & Feedback</h2>
            <p style={{ fontSize: '14px', color: '#64748b', margin: 0 }}>Patient success stories and testimonials</p>
          </div>
        </div>
        <button
          onClick={openEditModal}
          style={{
            padding: '10px 20px',
            background: '#14b8a6',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '14px',
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          Edit Stories
        </button>
      </div>

      {visibleStories.length === 0 ? (
        <div style={{
          padding: '48px',
          textAlign: 'center',
          color: '#94a3b8',
          fontSize: '14px'
        }}>
          No success stories yet. Click "Edit Stories" to add testimonials.
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '20px' }}>
          {visibleStories.map((story) => (
            <div key={story.id} style={{
              padding: '24px',
              background: '#f8fafc',
              borderRadius: '12px',
              borderLeft: '4px solid #06b6d4',
              position: 'relative'
            }}>
              <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
                {story.context || 'Success Story'}
              </h3>
              <p style={{
                fontSize: '15px',
                lineHeight: '1.7',
                color: '#475569',
                fontStyle: 'italic',
                marginBottom: '12px'
              }}>
                "{story.quote}"
              </p>
              <p style={{
                fontSize: '13px',
                color: '#94a3b8',
                fontWeight: 500
              }}>
                — {story.initials || 'Anonymous'}
              </p>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '24px'
        }} onClick={() => setShowModal(false)}>
          <div style={{
            background: '#1e293b',
            borderRadius: '16px',
            width: '100%',
            maxWidth: '900px',
            maxHeight: '90vh',
            overflow: 'auto',
            boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
          }} onClick={(e) => e.stopPropagation()}>
            <div style={{
              padding: '24px',
              borderBottom: '1px solid #334155',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <MessageSquare size={20} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#f1f5f9', margin: 0 }}>
                    Success Stories & Feedback
                  </h3>
                  <p style={{ fontSize: '13px', color: '#94a3b8', margin: 0 }}>
                    Testimonials and positive feedback from participants
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  width: '32px',
                  height: '32px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '6px',
                  color: '#94a3b8'
                }}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: '24px' }}>
              {editingStories.map((story, index) => (
                <div key={index} style={{ marginBottom: '24px' }}>
                  {index > 0 && (
                    <div style={{
                      height: '1px',
                      background: '#334155',
                      marginBottom: '24px'
                    }} />
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                    <label style={{ fontSize: '12px', fontWeight: 600, color: '#cbd5e1', letterSpacing: '0.5px' }}>
                      Quote/Testimonial
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <button
                        onClick={() => handleStoryChange(index, 'is_visible', !story.is_visible)}
                        style={{
                          padding: '6px 12px',
                          background: story.is_visible !== false ? '#10b981' : '#475569',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '12px',
                          fontWeight: 600,
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}
                      >
                        {story.is_visible !== false ? <Eye size={14} /> : <EyeOff size={14} />}
                        {story.is_visible !== false ? 'Visible' : 'Hidden'}
                      </button>
                      {editingStories.length > 1 && (
                        <button
                          onClick={() => handleRemoveStory(index)}
                          style={{
                            background: 'transparent',
                            border: 'none',
                            color: '#ef4444',
                            cursor: 'pointer',
                            fontSize: '13px',
                            fontWeight: 500,
                            padding: '4px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          <X size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                  <textarea
                    value={story.quote || ''}
                    onChange={(e) => handleStoryChange(index, 'quote', e.target.value)}
                    placeholder="Enter the testimonial or success story..."
                    style={{
                      width: '100%',
                      padding: '12px 16px',
                      background: '#0f172a',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: '#f1f5f9',
                      minHeight: '100px',
                      resize: 'vertical',
                      fontFamily: 'inherit',
                      marginBottom: '16px'
                    }}
                  />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        Initials (anonymous)
                      </label>
                      <input
                        type="text"
                        value={story.initials || ''}
                        onChange={(e) => handleStoryChange(index, 'initials', e.target.value)}
                        placeholder="e.g., J.S."
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#f1f5f9'
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '12px', fontWeight: 600, color: '#cbd5e1', marginBottom: '8px', letterSpacing: '0.5px' }}>
                        Condition/Context
                      </label>
                      <input
                        type="text"
                        value={story.context || ''}
                        onChange={(e) => handleStoryChange(index, 'context', e.target.value)}
                        placeholder="e.g., Hypertension Management"
                        style={{
                          width: '100%',
                          padding: '12px 16px',
                          background: '#0f172a',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                          fontSize: '14px',
                          color: '#f1f5f9'
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddStory}
                style={{
                  width: '100%',
                  padding: '14px',
                  background: 'transparent',
                  border: '2px dashed #334155',
                  borderRadius: '8px',
                  color: '#94a3b8',
                  fontSize: '14px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  marginBottom: '24px'
                }}
              >
                <Plus size={18} />
                Add Another Story
              </button>

              <div style={{
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '12px',
                paddingTop: '16px',
                borderTop: '1px solid #334155'
              }}>
                <button
                  onClick={() => setShowModal(false)}
                  style={{
                    padding: '12px 24px',
                    background: '#334155',
                    color: '#f1f5f9',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  style={{
                    padding: '12px 24px',
                    background: '#14b8a6',
                    color: 'white',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontWeight: 600,
                    cursor: 'pointer'
                  }}
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
