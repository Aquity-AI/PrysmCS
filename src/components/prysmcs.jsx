import React, { useState, useEffect, createContext, useContext, useRef, useCallback, useMemo } from "react";
import ReactDOM from "react-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Area, AreaChart,
  PieChart as RechartsPieChart, Pie, Cell, Legend,
  RadialBarChart, RadialBar, ComposedChart, Scatter
} from "recharts";
import { LayoutDashboard, Users, DollarSign, Heart, MessageSquare, Lightbulb, ChevronRight, ChevronLeft, TrendingUp, Activity, Calendar, Download, Building2, Clock, Settings, Save, CheckCircle, HelpCircle, AlertCircle, Mail, Phone, FileText, Lock, LogOut, Shield, Eye, EyeOff, UserCheck, ClipboardList, AlertTriangle, Palette, Image, Type, GripVertical, ToggleLeft, ToggleRight, RefreshCw, Upload, Trash2, Plus, Minus, X, ChevronUp, ChevronDown, ChevronsUp, ChevronsDown, Bell, BellRing, Zap, Target, UserCog, ArrowLeft, CreditCard as Edit3, Star, Award, Briefcase, PieChart, BarChart2, Grid2x2 as Grid, LayoutGrid as Layout, Building, Layers, Copy, Move, Maximize2, Minimize2, CreditCard as Edit2, Pencil, RotateCcw, Menu, Send, Pill, Smartphone, HeartPulse, Stethoscope, Sparkles, Columns, Globe } from "lucide-react";
import { createClient } from '@supabase/supabase-js';
import { SuccessPlanning } from './success-planning';
import { useStoriesSync } from './success-planning/useStoriesSync';
import { useStrategicPrioritiesSync } from './success-planning/useStrategicPrioritiesSync';
import { useNotificationAlerts } from './success-planning/useNotificationAlerts';
import { PageSummaryManager } from './page-summary/PageSummaryManager';
import { getGridItemStyle } from './utils/gridUtils';
import { getCurrentMonthKey, generateAvailableMonths, isCurrentMonth, getAvailableMonthsForClient } from '../utils/dateUtils';
import { IconPickerDropdown } from './IconPickerDropdown';
import { DeletedAccountsPanel } from './settings/DeletedAccountsPanel';
import { EditLayoutProvider, EditLayoutButton, DashboardGraphGrid, SavedGraphsList, useEditLayout } from './dashboard-graphs';
import { invalidateBrandingPaletteCache } from './dashboard-graphs/brandingPalette';
import { SignInCard } from './SignInCard';
import { MetricsManager } from './metrics-management';
import { PDFReportModal as DynamicPDFReportModal } from './report';
import { PresentationMode as DynamicPresentationMode } from './presentation';
import {
  WidgetLayoutProvider,
  useWidgetLayout,
  EditablePageGrid,
  DraggableWidget,
  DraggableKpiSection,
  DraggableKpiCard,
  DraggableChartCard,
  DraggableFunnelChart,
  DraggableSummaryCard,
  DraggableCampaignSection,
  DraggableGenericSection,
  fetchPageLayout,
  savePageLayout,
  WidgetSizeButton,
  DragGhostOverlay,
  DropPlaceholder,
} from './widget-layout';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-key';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Log initialization for debugging
console.log('[PrysmCS] Initializing with Supabase URL:', supabaseUrl.substring(0, 30) + '...');

// ============================================================
// AUTHENTICATION & AUTHORIZATION SYSTEM
// ============================================================

// Role definitions with permissions
const ROLES = {
  admin: {
    name: 'Administrator',
    permissions: [
      'view_dashboard', 'view_patients', 'view_financial', 'view_outcomes',
      'view_stories', 'view_opportunities', 'view_initiatives',
      'edit_data', 'edit_sensitive_data', 'export_reports', 'manage_users', 'view_audit_log',
      'view_portfolio_analytics', 'manage_customization', 'access_all_clients', 'edit_client_info', 'delete_data'
    ],
    description: 'Full system access including user management and audit logs'
  },
  client: {
    name: 'Client',
    permissions: [
      'view_dashboard', 'view_patients', 'view_outcomes',
      'view_stories', 'view_opportunities', 'view_initiatives',
      'export_reports'
    ],
    description: 'View-only access for healthcare practice clients'
  },
  csm: {
    name: 'Customer Success Manager',
    permissions: [
      'view_dashboard', 'view_patients', 'view_financial', 'view_outcomes',
      'view_stories', 'view_opportunities', 'view_initiatives',
      'edit_data', 'export_reports', 'manage_users'
    ],
    description: 'Data entry and client management for assigned accounts'
  }
};

// ============================================================
// ============================================================
// DATA ACCESS LAYER (DAL)
// ============================================================
// Abstracts all data operations behind a unified interface.
// Allows plugging in a backend without changing UI components.
// Currently uses localStorage as the default storage adapter.
// ============================================================

// ============================================================
// FEATURE FLAGS - Toggle these to enable backend integration
// ============================================================
// Set these to `true` when your backend API is ready.
// All flags default to `false` to preserve current demo behavior.
//
// Environment variable pattern (if using a build system):
//   const USE_BACKEND_AUTH = process.env.REACT_APP_USE_BACKEND_AUTH === 'true';
//
// For now, simply change `false` to `true` to enable each feature.

const USE_BACKEND_AUTH = false;         // Use API for authentication & sessions
const USE_BACKEND_MONTHLY_DATA = false; // Use API for client/monthly data CRUD
const USE_BACKEND_AUDIT = false;        // Send audit logs to backend server

// Additional behavioral flags
const USE_OFFLINE_SUPPORT = true;       // Cache data locally for offline access
const USE_OPTIMISTIC_UPDATES = true;    // Update UI immediately, sync in background

// ============================================================
// DAL Configuration (derived from feature flags)
// ============================================================
const DAL_CONFIG = {
  // Storage adapter mode
  storageAdapter: (USE_BACKEND_AUTH || USE_BACKEND_MONTHLY_DATA) ? 'api' : 'localStorage',
  
  // Feature flags (exposed for runtime checks)
  features: {
    useRemoteAuth: USE_BACKEND_AUTH,
    useRemoteData: USE_BACKEND_MONTHLY_DATA,
    useRemoteAudit: USE_BACKEND_AUDIT,
    offlineSupport: USE_OFFLINE_SUPPORT,
    optimisticUpdates: USE_OPTIMISTIC_UPDATES,
  },
  
  // API endpoints (configure these when backend is ready)
  endpoints: {
    baseUrl: '/api/v1',
    auth: '/auth',
    clients: '/clients',
    monthlyData: '/monthly-data',
    audit: '/audit',
  },
};

// Storage keys for localStorage
const STORAGE_KEYS = {
  SESSION: 'medkick_session',
  CLIENTS_DATA: 'medkick_dashboard_data',
  CUSTOMIZATION: 'medkick_customization',
  AUDIT_LOG: 'medkick_audit_log',
};

// ============================================================
// Storage Adapter Interface
// ============================================================
// Abstract interface for storage operations.
// Implementations: LocalStorageAdapter, ApiAdapter (future)

class LocalStorageAdapter {
  async get(key) {
    try {
      const value = localStorage.getItem(key);
      return value ? JSON.parse(value) : null;
    } catch (e) {
      console.warn(`[DAL] Failed to get ${key}:`, e);
      return null;
    }
  }

  async set(key, value) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return { success: true };
    } catch (e) {
      console.warn(`[DAL] Failed to set ${key}:`, e);
      return { success: false, error: e.message };
    }
  }

  async remove(key) {
    try {
      localStorage.removeItem(key);
      return { success: true };
    } catch (e) {
      console.warn(`[DAL] Failed to remove ${key}:`, e);
      return { success: false, error: e.message };
    }
  }
}

// Future: API adapter for backend integration
class ApiAdapter {
  constructor(baseUrl) {
    this.baseUrl = baseUrl;
  }

  async request(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions = {
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    };

    try {
      const response = await fetch(url, { ...defaultOptions, ...options });
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (e) {
      console.error(`[DAL] API request failed:`, e);
      throw e;
    }
  }

  async get(endpoint) {
    return this.request(endpoint, { method: 'GET' });
  }

  async post(endpoint, data) {
    return this.request(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put(endpoint, data) {
    return this.request(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint) {
    return this.request(endpoint, { method: 'DELETE' });
  }
}

// Initialize storage adapter based on config
const storageAdapter = new LocalStorageAdapter();
const apiAdapter = DAL_CONFIG.features.useRemoteData 
  ? new ApiAdapter(DAL_CONFIG.endpoints.baseUrl) 
  : null;

// ============================================================
// Auth Client
// ============================================================
// Handles authentication and session management.
// Currently uses in-memory user database with localStorage session.

const authClient = {
  /**
   * Login with credentials
   * @param {Object} credentials - { email, password }
   * @returns {Promise<{success: boolean, user?: Object, error?: string}>}
   */
  async login(credentials) {
    if (DAL_CONFIG.features.useRemoteAuth && apiAdapter) {
      try {
        const result = await apiAdapter.post(DAL_CONFIG.endpoints.auth + '/login', credentials);
        if (result.success && result.user) {
          await storageAdapter.set(STORAGE_KEYS.SESSION, {
            user: result.user,
            expiry: result.expiry,
          });
        }
        return result;
      } catch (e) {
        // Fallback to local auth if API fails and offline support is enabled
        if (DAL_CONFIG.features.offlineSupport) {
          console.warn('[DAL] Remote auth failed, falling back to local');
          return this._localLogin(credentials);
        }
        return { success: false, error: 'Authentication service unavailable' };
      }
    }
    // Use local authentication (handled by AuthProvider for now)
    return this._localLogin(credentials);
  },

  /**
   * Local login placeholder - actual logic is in AuthProvider
   * This allows AuthProvider to call DAL methods while we migrate
   */
  _localLogin(credentials) {
    // Return a marker that tells AuthProvider to use its internal login
    return { _useLocalAuth: true, credentials };
  },

  /**
   * Logout current user
   * @returns {Promise<{success: boolean}>}
   */
  async logout() {
    if (DAL_CONFIG.features.useRemoteAuth && apiAdapter) {
      try {
        await apiAdapter.post(DAL_CONFIG.endpoints.auth + '/logout', {});
      } catch (e) {
        console.warn('[DAL] Remote logout failed:', e);
      }
    }
    await storageAdapter.remove(STORAGE_KEYS.SESSION);
    return { success: true };
  },

  /**
   * Get current session
   * @returns {Promise<{user: Object, expiry: string} | null>}
   */
  async getSession() {
    if (DAL_CONFIG.features.useRemoteAuth && apiAdapter) {
      try {
        const result = await apiAdapter.get(DAL_CONFIG.endpoints.auth + '/session');
        if (result.user) {
          // Update local cache
          await storageAdapter.set(STORAGE_KEYS.SESSION, result);
          return result;
        }
      } catch (e) {
        console.warn('[DAL] Remote session check failed, using local cache');
      }
    }
    return await storageAdapter.get(STORAGE_KEYS.SESSION);
  },

  /**
   * Extend/refresh session
   * @returns {Promise<{success: boolean, expiry?: string}>}
   */
  async extendSession(newExpiry) {
    const session = await this.getSession();
    if (session) {
      session.expiry = newExpiry;
      await storageAdapter.set(STORAGE_KEYS.SESSION, session);
      return { success: true, expiry: newExpiry };
    }
    return { success: false, error: 'No active session' };
  },

  /**
   * Save session to storage
   * @param {Object} sessionData - { user, expiry }
   */
  async saveSession(sessionData) {
    return await storageAdapter.set(STORAGE_KEYS.SESSION, sessionData);
  },
};

// ============================================================
// Monthly Data Client
// ============================================================
// Handles all client monthly data CRUD operations.

const monthlyDataClient = {
  // In-memory cache for the current session
  _cache: null,
  _cacheTimestamp: null,
  _cacheTTL: 5 * 60 * 1000, // 5 minutes

  /**
   * Get all clients data (full dataset)
   * @returns {Promise<Object>}
   */
  async getAllClientsData() {
    // Check cache first
    if (this._cache && this._cacheTimestamp && 
        (Date.now() - this._cacheTimestamp) < this._cacheTTL) {
      return this._cache;
    }

    if (DAL_CONFIG.features.useRemoteData && apiAdapter) {
      try {
        const result = await apiAdapter.get(DAL_CONFIG.endpoints.clients);
        this._cache = result;
        this._cacheTimestamp = Date.now();
        // Also save to local storage for offline access
        if (DAL_CONFIG.features.offlineSupport) {
          await storageAdapter.set(STORAGE_KEYS.CLIENTS_DATA, result);
        }
        return result;
      } catch (e) {
        console.warn('[DAL] Remote data fetch failed, using local cache');
      }
    }
    
    const data = await storageAdapter.get(STORAGE_KEYS.CLIENTS_DATA);
    this._cache = data;
    this._cacheTimestamp = Date.now();
    return data;
  },

  /**
   * Save all clients data
   * @param {Object} data - Full clients data object
   * @returns {Promise<{success: boolean}>}
   */
  async saveAllClientsData(data) {
    // Update cache
    this._cache = data;
    this._cacheTimestamp = Date.now();

    if (DAL_CONFIG.features.useRemoteData && apiAdapter) {
      try {
        await apiAdapter.put(DAL_CONFIG.endpoints.clients, data);
      } catch (e) {
        console.warn('[DAL] Remote save failed:', e);
        if (!DAL_CONFIG.features.offlineSupport) {
          return { success: false, error: 'Failed to save data' };
        }
      }
    }

    // Always save to local storage
    return await storageAdapter.set(STORAGE_KEYS.CLIENTS_DATA, data);
  },

  /**
   * Get monthly data for a specific client and month
   * @param {string} clientId 
   * @param {string} monthKey - Format: 'YYYY-MM'
   * @returns {Promise<Object | null>}
   */
  async getMonthlyData(clientId, monthKey) {
    if (DAL_CONFIG.features.useRemoteData && apiAdapter) {
      try {
        return await apiAdapter.get(
          `${DAL_CONFIG.endpoints.monthlyData}/${clientId}/${monthKey}`
        );
      } catch (e) {
        console.warn('[DAL] Remote fetch failed, using local cache');
      }
    }

    const allData = await this.getAllClientsData();
    return allData?.[clientId]?.monthlyData?.[monthKey] || null;
  },

  /**
   * Save monthly data for a specific client and month
   * @param {string} clientId 
   * @param {string} monthKey - Format: 'YYYY-MM'
   * @param {Object} payload - Monthly data object
   * @returns {Promise<{success: boolean}>}
   */
  async saveMonthlyData(clientId, monthKey, payload) {
    if (DAL_CONFIG.features.useRemoteData && apiAdapter) {
      try {
        if (DAL_CONFIG.features.optimisticUpdates) {
          // Update local cache immediately
          this._updateLocalCache(clientId, monthKey, payload);
        }
        await apiAdapter.put(
          `${DAL_CONFIG.endpoints.monthlyData}/${clientId}/${monthKey}`,
          payload
        );
        return { success: true };
      } catch (e) {
        console.warn('[DAL] Remote save failed:', e);
        if (!DAL_CONFIG.features.offlineSupport) {
          return { success: false, error: 'Failed to save data' };
        }
      }
    }

    // Local storage update
    const allData = await this.getAllClientsData() || {};
    if (!allData[clientId]) {
      allData[clientId] = { monthlyData: {}, stories: {}, opportunities: {} };
    }
    if (!allData[clientId].monthlyData) {
      allData[clientId].monthlyData = {};
    }
    allData[clientId].monthlyData[monthKey] = payload;
    
    return await this.saveAllClientsData(allData);
  },

  /**
   * Get monthly data for a range of months
   * @param {string} clientId 
   * @param {string} startMonthKey - Format: 'YYYY-MM'
   * @param {string} endMonthKey - Format: 'YYYY-MM'
   * @returns {Promise<Object>} - { 'YYYY-MM': data, ... }
   */
  async getMonthlyRange(clientId, startMonthKey, endMonthKey) {
    if (DAL_CONFIG.features.useRemoteData && apiAdapter) {
      try {
        return await apiAdapter.get(
          `${DAL_CONFIG.endpoints.monthlyData}/${clientId}/range?start=${startMonthKey}&end=${endMonthKey}`
        );
      } catch (e) {
        console.warn('[DAL] Remote range fetch failed, using local cache');
      }
    }

    const allData = await this.getAllClientsData();
    const clientData = allData?.[clientId]?.monthlyData || {};
    const result = {};

    // Filter months in range
    Object.keys(clientData)
      .filter(month => month >= startMonthKey && month <= endMonthKey)
      .sort()
      .forEach(month => {
        result[month] = clientData[month];
      });

    return result;
  },

  /**
   * Get client info
   * @param {string} clientId 
   * @returns {Promise<Object | null>}
   */
  async getClientInfo(clientId) {
    const allData = await this.getAllClientsData();
    return allData?.[clientId]?.clientInfo || null;
  },

  /**
   * Save client info
   * @param {string} clientId 
   * @param {Object} clientInfo 
   * @returns {Promise<{success: boolean}>}
   */
  async saveClientInfo(clientId, clientInfo) {
    const allData = await this.getAllClientsData() || {};
    if (!allData[clientId]) {
      allData[clientId] = { monthlyData: {}, stories: {}, opportunities: {} };
    }
    allData[clientId].clientInfo = clientInfo;
    return await this.saveAllClientsData(allData);
  },

  /**
   * Get stories for a client and month
   * @param {string} clientId 
   * @param {string} monthKey 
   * @returns {Promise<Array>}
   */
  async getStories(clientId, monthKey) {
    const allData = await this.getAllClientsData();
    return allData?.[clientId]?.stories?.[monthKey] || [];
  },

  /**
   * Save stories for a client and month
   * @param {string} clientId 
   * @param {string} monthKey 
   * @param {Array} stories 
   * @returns {Promise<{success: boolean}>}
   */
  async saveStories(clientId, monthKey, stories) {
    const allData = await this.getAllClientsData() || {};
    if (!allData[clientId]) {
      allData[clientId] = { monthlyData: {}, stories: {}, opportunities: {} };
    }
    if (!allData[clientId].stories) {
      allData[clientId].stories = {};
    }
    allData[clientId].stories[monthKey] = stories;
    return await this.saveAllClientsData(allData);
  },

  /**
   * Get opportunities for a client and month
   * @param {string} clientId 
   * @param {string} monthKey 
   * @returns {Promise<Array>}
   */
  async getOpportunities(clientId, monthKey) {
    const allData = await this.getAllClientsData();
    return allData?.[clientId]?.opportunities?.[monthKey] || [];
  },

  /**
   * Save opportunities for a client and month
   * @param {string} clientId 
   * @param {string} monthKey 
   * @param {Array} opportunities 
   * @returns {Promise<{success: boolean}>}
   */
  async saveOpportunities(clientId, monthKey, opportunities) {
    const allData = await this.getAllClientsData() || {};
    if (!allData[clientId]) {
      allData[clientId] = { monthlyData: {}, stories: {}, opportunities: {} };
    }
    if (!allData[clientId].opportunities) {
      allData[clientId].opportunities = {};
    }
    allData[clientId].opportunities[monthKey] = opportunities;
    return await this.saveAllClientsData(allData);
  },

  /**
   * Create a new client
   * @param {string} clientId 
   * @param {Object} clientData 
   * @returns {Promise<{success: boolean}>}
   */
  async createClient(clientId, clientData) {
    const allData = await this.getAllClientsData() || {};
    allData[clientId] = clientData;
    return await this.saveAllClientsData(allData);
  },

  /**
   * Delete a client
   * @param {string} clientId 
   * @returns {Promise<{success: boolean}>}
   */
  async deleteClient(clientId) {
    const allData = await this.getAllClientsData() || {};
    delete allData[clientId];
    return await this.saveAllClientsData(allData);
  },

  /**
   * Update local cache helper
   */
  _updateLocalCache(clientId, monthKey, payload) {
    if (this._cache && this._cache[clientId]) {
      if (!this._cache[clientId].monthlyData) {
        this._cache[clientId].monthlyData = {};
      }
      this._cache[clientId].monthlyData[monthKey] = payload;
    }
  },

  /**
   * Invalidate cache
   */
  invalidateCache() {
    this._cache = null;
    this._cacheTimestamp = null;
  },
};

// ============================================================
// Audit Client
// ============================================================
// Handles audit logging for compliance and security.

const auditClient = {
  /**
   * Log an audit event
   * @param {string} eventType - One of AUDIT_ACTIONS values
   * @param {Object} payload - Event details
   * @param {Object} user - Current user (optional)
   * @returns {Promise<{success: boolean}>}
   */
  async logEvent(eventType, payload = {}, user = null) {
    const entry = {
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      action: eventType,
      userId: user?.email || 'system',
      userRole: user?.role || 'unknown',
      details: payload,
      ipAddress: 'localhost', // Would be set by server in production
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };

    if (DAL_CONFIG.features.useRemoteAudit && apiAdapter) {
      try {
        await apiAdapter.post(DAL_CONFIG.endpoints.audit, entry);
        // Don't store locally if remote succeeds (avoid duplication)
        return { success: true };
      } catch (e) {
        console.warn('[DAL] Remote audit log failed:', e);
        // Fall through to local storage
      }
    }

    // Store locally
    return await this._logLocally(entry);
  },

  /**
   * Store audit entry locally
   */
  async _logLocally(entry) {
    try {
      const log = await storageAdapter.get(STORAGE_KEYS.AUDIT_LOG) || [];
      log.unshift(entry);
      // Keep only last 1000 entries to prevent localStorage bloat
      const trimmed = log.slice(0, 1000);
      await storageAdapter.set(STORAGE_KEYS.AUDIT_LOG, trimmed);
      return { success: true };
    } catch (e) {
      console.warn('[DAL] Local audit log failed:', e);
      return { success: false, error: e.message };
    }
  },

  /**
   * Get audit log entries
   * @param {Object} filters - { userId, action, startDate, endDate, limit }
   * @returns {Promise<Array>}
   */
  async getAuditLog(filters = {}) {
    if (DAL_CONFIG.features.useRemoteAudit && apiAdapter) {
      try {
        const queryParams = new URLSearchParams(filters).toString();
        return await apiAdapter.get(`${DAL_CONFIG.endpoints.audit}?${queryParams}`);
      } catch (e) {
        console.warn('[DAL] Remote audit log fetch failed, using local');
      }
    }

    let log = await storageAdapter.get(STORAGE_KEYS.AUDIT_LOG) || [];

    // Apply filters
    if (filters.userId) {
      log = log.filter(e => e.userId === filters.userId);
    }
    if (filters.action) {
      log = log.filter(e => e.action === filters.action);
    }
    if (filters.startDate) {
      log = log.filter(e => e.timestamp >= filters.startDate);
    }
    if (filters.endDate) {
      log = log.filter(e => e.timestamp <= filters.endDate);
    }
    if (filters.limit) {
      log = log.slice(0, filters.limit);
    }

    return log;
  },

  /**
   * Clear audit log (admin only, local only)
   * @returns {Promise<{success: boolean}>}
   */
  async clearAuditLog() {
    return await storageAdapter.remove(STORAGE_KEYS.AUDIT_LOG);
  },
};

// ============================================================
// Customization Client
// ============================================================
// Handles dashboard customization settings.

const customizationClient = {
  /**
   * Get customization settings
   * @returns {Promise<Object | null>}
   */
  async getCustomization() {
    return await storageAdapter.get(STORAGE_KEYS.CUSTOMIZATION);
  },

  /**
   * Save customization settings
   * @param {Object} customization
   * @returns {Promise<{success: boolean}>}
   */
  async saveCustomization(customization) {
    return await storageAdapter.set(STORAGE_KEYS.CUSTOMIZATION, customization);
  },

  /**
   * Reset customization to defaults
   * @returns {Promise<{success: boolean}>}
   */
  async resetCustomization() {
    return await storageAdapter.remove(STORAGE_KEYS.CUSTOMIZATION);
  },

  /**
   * Save customization to Supabase database
   * @param {string} clientId - The client identifier
   * @param {Object} customizationData - The customization data to save
   * @returns {Promise<{success: boolean, error?: string}>}
   */
  async saveToSupabase(clientId, customizationData) {
    try {
      // Step 1: Sync sections to their dedicated tables based on sectionType
      const formSchema = customizationData?.formSchema || {};
      const sections = formSchema.sections || [];
      const deletedSectionIds = customizationData?.deletedSectionIds || [];

      const pageSummarySections = sections.filter(s => s.sectionType === 'page_summary');

      // Sync page_summaries
      if (pageSummarySections.length > 0) {
        const pageSummaryRecords = pageSummarySections.map(section => ({
          client_id: clientId,
          page_id: section.linkedTabId || 'main',
          section_id: section.id,
          title: section.title || '',
          subtitle: section.subtitle || '',
          summary_mode: section.summaryMode || 'manual',
          layout_style: section.layoutStyle || 'grid',
          max_items: section.maxItems || 4,
          enabled: section.enabled ?? true,
          display_order: section.order || 0,
          width_units: section.widthUnits || 12,
          row_position: section.rowPosition || 0,
          column_position: section.columnPosition || 0,
          updated_at: new Date().toISOString()
        }));

        const { error: psError } = await supabase
          .from('page_summaries')
          .upsert(pageSummaryRecords, {
            onConflict: 'client_id,page_id,section_id',
            ignoreDuplicates: false
          });

        if (psError) {
          console.error('[customizationClient] Error syncing page_summaries:', psError);
          return { success: false, error: `Failed to sync page summaries: ${psError.message}` };
        }
        console.log(`[customizationClient] Synced ${pageSummaryRecords.length} page_summary sections`);
      }

      // Step 2: Hard-delete removed sections from dedicated tables
      if (deletedSectionIds.length > 0) {
        console.log('[customizationClient] Processing hard-delete for sections:', deletedSectionIds);

        // First, get IDs of page_summaries to delete (needed for child records)
        const { data: pageSummariesToDelete } = await supabase
          .from('page_summaries')
          .select('id')
          .eq('client_id', clientId)
          .in('section_id', deletedSectionIds);

        // Delete child records from page_summary_items first (foreign key constraint)
        if (pageSummariesToDelete && pageSummariesToDelete.length > 0) {
          const summaryIds = pageSummariesToDelete.map(ps => ps.id);
          const { error: itemsDeleteError } = await supabase
            .from('page_summary_items')
            .delete()
            .in('summary_id', summaryIds);

          if (itemsDeleteError) {
            console.error('[customizationClient] Error deleting page_summary_items:', itemsDeleteError);
          }
        }

        // Hard-delete from page_summaries
        const { error: psDeleteError } = await supabase
          .from('page_summaries')
          .delete()
          .eq('client_id', clientId)
          .in('section_id', deletedSectionIds);

        if (psDeleteError) {
          console.error('[customizationClient] Error deleting page_summaries:', psDeleteError);
        }

        console.log(`[customizationClient] Hard-deleted ${deletedSectionIds.length} sections from dedicated tables`);
        // Clear deletedSectionIds from customization data after hard-delete
        // since those sections no longer exist and don't need to be tracked
        customizationData = {
          ...customizationData,
          deletedSectionIds: []
        };
      }

      // Step 3: Save full customization to client_customizations (JSONB)
      const { error } = await supabase
        .from('client_customizations')
        .upsert({
          client_id: clientId,
          customization_data: customizationData,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'client_id'
        });

      if (error) {
        console.error('[customizationClient] Supabase save error:', error);
        return { success: false, error: error.message };
      }

      console.log('[customizationClient] Saved customization to Supabase for client:', clientId);
      return { success: true };
    } catch (err) {
      console.error('[customizationClient] Unexpected error saving to Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Load customization from Supabase database
   * @param {string} clientId - The client identifier
   * @returns {Promise<{success: boolean, data?: Object, error?: string}>}
   */
  async loadFromSupabase(clientId) {
    try {
      const { data, error } = await supabase
        .from('client_customizations')
        .select('customization_data')
        .eq('client_id', clientId)
        .maybeSingle();

      if (error) {
        console.error('[customizationClient] Supabase load error:', error);
        return { success: false, error: error.message };
      }

      // Load page_summaries (excluding soft-deleted records)
      const { data: pageSummaries, error: summariesError } = await supabase
        .from('page_summaries')
        .select('section_id, page_id, summary_mode, layout_style, max_items, title, subtitle, width_units, row_position, column_position, display_order, enabled')
        .eq('client_id', clientId)
        .is('deleted_at', null);

      if (summariesError) {
        console.error('[customizationClient] Error loading page_summaries:', summariesError);
      }

      if (!data) {
        console.log('[customizationClient] No customization found in Supabase for client:', clientId);

        // Even if no customization exists, we might have dedicated table records
        const allSections = [];

        if (pageSummaries && pageSummaries.length > 0) {
          const pageSummarySections = pageSummaries.map((ps, index) => createFormSection(ps.section_id, {
            title: ps.title || ps.section_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
            subtitle: ps.subtitle || 'Key metrics and highlights',
            icon: 'LayoutDashboard',
            iconColor: 'brand',
            order: ps.display_order ?? index + 0.5,
            linkedTabId: ps.page_id,
            sectionType: 'page_summary',
            summaryMode: ps.summary_mode || 'manual',
            layoutStyle: ps.layout_style || 'grid',
            maxItems: ps.max_items || 4,
            enabled: ps.enabled !== false,
            widthUnits: ps.width_units || 12,
            rowPosition: ps.row_position || 0,
            columnPosition: ps.column_position || 0,
            fields: [],
          }));
          allSections.push(...pageSummarySections);
        }

        if (allSections.length > 0) {
          return {
            success: true,
            data: {
              formSchema: {
                ...DEFAULT_FORM_SCHEMA,
                sections: [...DEFAULT_FORM_SCHEMA.sections, ...allSections]
              }
            }
          };
        }

        return { success: true, data: null };
      }

      let customizationData = data.customization_data;
      const existingFormSchema = customizationData.formSchema || DEFAULT_FORM_SCHEMA;
      const existingSectionIds = new Set(existingFormSchema.sections.map(s => s.id));
      const deletedSectionIds = new Set(customizationData.deletedSectionIds || []);

      // Merge page_summaries into formSchema if they exist
      if (pageSummaries && pageSummaries.length > 0) {
        // Create sections for page_summaries that don't exist in formSchema
        // Also exclude sections that are in deletedSectionIds to prevent resurrection
        const pageSummarySections = pageSummaries
          .filter(ps => !existingSectionIds.has(ps.section_id) && !deletedSectionIds.has(ps.section_id))
          .map((ps, index) => {
            const defaultSection = DEFAULT_FORM_SCHEMA.sections.find(s => s.id === ps.section_id);

            return createFormSection(ps.section_id, {
              title: ps.title || defaultSection?.title || ps.section_id.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
              subtitle: ps.subtitle || defaultSection?.subtitle || 'Key metrics and highlights',
              icon: defaultSection?.icon || 'LayoutDashboard',
              iconColor: defaultSection?.iconColor || 'brand',
              order: ps.display_order ?? defaultSection?.order ?? (existingFormSchema.sections.length + index + 0.5),
              linkedTabId: ps.page_id,
              sectionType: 'page_summary',
              summaryMode: ps.summary_mode || 'manual',
              layoutStyle: ps.layout_style || 'grid',
              maxItems: ps.max_items || 4,
              enabled: ps.enabled !== false,
              widthUnits: ps.width_units || 12,
              rowPosition: ps.row_position || 0,
              columnPosition: ps.column_position || 0,
              fields: [],
            });
          });

        if (pageSummarySections.length > 0) {
          customizationData = {
            ...customizationData,
            formSchema: {
              ...existingFormSchema,
              sections: [...existingFormSchema.sections, ...pageSummarySections]
            }
          };
          console.log(`[customizationClient] Merged ${pageSummarySections.length} page_summary sections into formSchema`);
        }

        // Update existing page_summary sections with latest database values
        // Skip sections that are in deletedSectionIds
        customizationData.formSchema.sections = customizationData.formSchema.sections.map(section => {
          if (section.sectionType === 'page_summary' && !deletedSectionIds.has(section.id)) {
            const dbRecord = pageSummaries.find(ps => ps.section_id === section.id);
            if (dbRecord) {
              return {
                ...section,
                title: dbRecord.title || section.title,
                subtitle: dbRecord.subtitle || section.subtitle,
                summaryMode: dbRecord.summary_mode || section.summaryMode,
                layoutStyle: dbRecord.layout_style || section.layoutStyle,
                maxItems: dbRecord.max_items || section.maxItems,
                linkedTabId: dbRecord.page_id || section.linkedTabId,
                enabled: dbRecord.enabled !== undefined ? dbRecord.enabled : section.enabled,
                widthUnits: dbRecord.width_units || section.widthUnits,
                rowPosition: dbRecord.row_position !== undefined ? dbRecord.row_position : section.rowPosition,
                columnPosition: dbRecord.column_position !== undefined ? dbRecord.column_position : section.columnPosition,
                order: dbRecord.display_order !== undefined ? dbRecord.display_order : section.order,
              };
            }
          }
          return section;
        });
      }

      console.log('[customizationClient] Loaded customization from Supabase for client:', clientId);
      return { success: true, data: customizationData };
    } catch (err) {
      console.error('[customizationClient] Unexpected error loading from Supabase:', err);
      return { success: false, error: err.message };
    }
  },

  async loadGlobalBranding() {
    try {
      const { data, error } = await supabase
        .from('platform_branding')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('[customizationClient] Error loading global branding:', error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: true, data: null };
      }

      return {
        success: true,
        data: {
          platformName: data.platform_name,
          platformTagline: data.platform_tagline,
          logoUrl: data.logo_url,
          logoText: data.logo_text,
          logoMode: data.logo_mode,
          primaryColor: data.primary_color,
          secondaryColor: data.secondary_color,
          accentColor: data.accent_color,
          sidebarBg: data.sidebar_bg,
          sidebarTextColor: data.sidebar_text_color,
          slideBg: data.slide_bg,
          headerBg: data.header_bg,
          fontFamily: data.font_family,
          siteTitle: data.site_title,
          faviconUrl: data.favicon_url,
          ogImageUrl: data.og_image_url,
        },
      };
    } catch (err) {
      console.error('[customizationClient] Unexpected error loading global branding:', err);
      return { success: false, error: err.message };
    }
  },

  async saveGlobalBranding(branding) {
    try {
      const { data: existing } = await supabase
        .from('platform_branding')
        .select('id')
        .limit(1)
        .maybeSingle();

      const row = {
        platform_name: branding.platformName || 'PrysmCS',
        platform_tagline: branding.platformTagline || '',
        logo_url: branding.logoUrl || null,
        logo_text: branding.logoText || 'PrysmCS',
        logo_mode: branding.logoMode || 'default',
        primary_color: branding.primaryColor || '#06b6d4',
        secondary_color: branding.secondaryColor || '#0f172a',
        accent_color: branding.accentColor || '#14b8a6',
        sidebar_bg: branding.sidebarBg || 'linear-gradient(180deg, #0a2540 0%, #0f172a 100%)',
        sidebar_text_color: branding.sidebarTextColor || '#e2e8f0',
        slide_bg: branding.slideBg || 'linear-gradient(135deg, #0a2540 0%, #0f172a 50%, #1e293b 100%)',
        header_bg: branding.headerBg || '#0f172a',
        font_family: branding.fontFamily || 'Inter',
        site_title: branding.siteTitle || 'PrysmCS',
        favicon_url: branding.faviconUrl || null,
        og_image_url: branding.ogImageUrl || null,
        updated_at: new Date().toISOString(),
      };

      if (existing) {
        const { error } = await supabase
          .from('platform_branding')
          .update(row)
          .eq('id', existing.id);
        if (error) {
          console.error('[customizationClient] Error updating global branding:', error);
          return { success: false, error: error.message };
        }
      } else {
        const { error } = await supabase
          .from('platform_branding')
          .insert(row);
        if (error) {
          console.error('[customizationClient] Error inserting global branding:', error);
          return { success: false, error: error.message };
        }
      }

      return { success: true };
    } catch (err) {
      console.error('[customizationClient] Unexpected error saving global branding:', err);
      return { success: false, error: err.message };
    }
  },
};

// ============================================================
// DAL Exports / Unified Interface
// ============================================================

const dal = {
  // Client interfaces
  auth: authClient,
  monthlyData: monthlyDataClient,
  audit: auditClient,
  customization: customizationClient,
  
  // Configuration
  config: DAL_CONFIG,
  storage: storageAdapter,
  
  // Feature flags (direct access for convenience)
  flags: {
    USE_BACKEND_AUTH,
    USE_BACKEND_MONTHLY_DATA,
    USE_BACKEND_AUDIT,
    USE_OFFLINE_SUPPORT,
    USE_OPTIMISTIC_UPDATES,
  },
  
  // Utility methods
  isOnline: () => typeof navigator !== 'undefined' ? navigator.onLine : true,
  getStorageKeys: () => STORAGE_KEYS,
  
  // Helper to check if any backend feature is enabled
  isBackendEnabled: () => USE_BACKEND_AUTH || USE_BACKEND_MONTHLY_DATA || USE_BACKEND_AUDIT,
};

// Make DAL available globally for debugging (remove in production)
if (typeof window !== 'undefined') {
  window.__DAL__ = dal;
}

// ============================================================
// FORM SCHEMA SYSTEM
// ============================================================
// Defines the structure of the Monthly Data entry form
// Fully configurable: add/remove/reorder sections and fields
// Supports custom metrics beyond the base registry

const FIELD_TYPES = {
  NUMBER: 'number',
  CURRENCY: 'currency',
  PERCENT: 'percent',
  TEXT: 'text',
  TEXTAREA: 'textarea',
  DATE: 'date',
  SELECT: 'select',
  TOGGLE: 'toggle',
};

const VALIDATION_RULES = {
  REQUIRED: 'required',
  MIN: 'min',
  MAX: 'max',
  MIN_LENGTH: 'minLength',
  MAX_LENGTH: 'maxLength',
  PATTERN: 'pattern',
};

// Helper function to format date values
const formatDateValue = (value) => {
  if (!value) return '';

  try {
    // Handle various date formats
    let date;

    // If it's already a Date object
    if (value instanceof Date) {
      date = value;
    }
    // If it's a string or number
    else if (typeof value === 'string' || typeof value === 'number') {
      date = new Date(value);
    }
    else {
      return '';
    }

    // Check if date is valid
    if (isNaN(date.getTime())) {
      return '';
    }

    // Format date as MM/DD/YYYY
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  } catch (error) {
    console.warn('Error formatting date:', error);
    return '';
  }
};

// Field Definition Schema
const createFieldDef = (id, options = {}) => {
  const fieldType = options.fieldType || FIELD_TYPES.NUMBER;
  // Determine default for showOnDashboard based on field type
  const defaultShowOnDashboard = [FIELD_TYPES.NUMBER, FIELD_TYPES.CURRENCY, FIELD_TYPES.PERCENT].includes(fieldType);

  const defaultWidthUnits = defaultShowOnDashboard ? 3 : 12;

  return {
    id,
    metricId: options.metricId || id,  // References metrics registry if exists
    label: options.label || id,
    shortLabel: options.shortLabel || options.label || id,
    placeholder: options.placeholder || '',
    helperText: options.helperText || '',
    fieldType,
    prefix: options.prefix || '',      // e.g., '$' for currency
    suffix: options.suffix || '',      // e.g., '%' for percent
    defaultValue: options.defaultValue ?? (fieldType === FIELD_TYPES.TEXT ? '' : 0),
    validation: options.validation || [],
    required: options.required ?? false,
    editable: options.editable ?? true,   // Can admin edit this field's label?
    removable: options.removable ?? true, // Can admin remove this field?
    order: options.order || 0,
    // For SELECT fields
    options: options.options || [],
    // Dashboard visibility
    showOnDashboard: options.showOnDashboard ?? defaultShowOnDashboard,
    // Grid layout width (1-12 columns, default 3 for KPI metrics, 12 for text)
    widthUnits: options.widthUnits ?? defaultWidthUnits,
    // Visibility
    internalOnly: options.internalOnly ?? false,
    visibleTo: options.visibleTo || ['admin', 'csm', 'client'],
  };
};

// Section Definition Schema
const createFormSection = (id, options = {}) => ({
  id,
  title: options.title || 'Section',
  subtitle: options.subtitle || '',
  icon: options.icon || 'FileText',
  iconColor: options.iconColor || 'brand',
  enabled: options.enabled ?? true,
  collapsed: options.collapsed ?? false,
  collapsedByDefault: options.collapsedByDefault ?? true,
  collapsible: options.collapsible ?? true,
  order: options.order || 0,
  linkedTabId: options.linkedTabId || null,
  fields: options.fields || [],
  // Section Type
  sectionType: options.sectionType || 'standard',
  summaryMode: options.summaryMode || 'manual',
  layoutStyle: options.layoutStyle || 'grid',
  maxItems: options.maxItems || 4,
  // Admin capabilities
  titleEditable: options.titleEditable ?? true,
  subtitleEditable: options.subtitleEditable ?? true,
  removable: options.removable ?? true,
  fieldsReorderable: options.fieldsReorderable ?? true,
  canAddFields: options.canAddFields ?? true,
  // Visibility
  internalOnly: options.internalOnly ?? false,
  visibleTo: options.visibleTo || ['admin', 'csm'],
});

// Default Form Schema - defines the Monthly Data entry form structure
const SECTION_TO_TAB_MAP = {
  coreMetrics: 'overview',
  contextNotes: 'overview',
  enrollmentFunnel: 'enrollment',
  patientOutcomes: 'outcomes',
  smsCampaign: 'enrollment',
  emailCampaign: 'enrollment',
  mailerCampaign: 'enrollment',
};

const DEFAULT_FORM_SCHEMA = {
  formTitle: 'Monthly Data Entry',
  formSubtitle: 'Enter metrics for the selected month',
  allowCustomSections: true,
  allowCustomFields: true,
  sections: [
    createFormSection('coreMetrics', {
      title: 'Core Metrics',
      subtitle: 'Primary KPIs shown on the dashboard overview',
      icon: 'LayoutDashboard',
      iconColor: 'brand',
      order: 0,
      linkedTabId: 'overview',
      collapsedByDefault: true,
      fields: [
        createFieldDef('enrolledThisMonth', {
          metricId: 'enrolledThisMonth',
          label: 'Participants Enrolled This Month',
          placeholder: 'e.g., 42',
          fieldType: FIELD_TYPES.NUMBER,
          order: 0,
        }),
        createFieldDef('activePatients', {
          metricId: 'activePatients',
          label: 'Total Active Participants',
          placeholder: 'e.g., 178',
          fieldType: FIELD_TYPES.NUMBER,
          order: 1,
        }),
        createFieldDef('servicesDelivered', {
          metricId: 'servicesDelivered',
          label: 'Services Delivered',
          placeholder: 'e.g., 320',
          fieldType: FIELD_TYPES.NUMBER,
          order: 2,
        }),
      ],
    }),
    createFormSection('overview-page-summary', {
      title: 'Page Summary',
      subtitle: 'Key metrics and highlights',
      icon: 'LayoutDashboard',
      iconColor: 'brand',
      order: 0.75,
      linkedTabId: 'overview',
      sectionType: 'page_summary',
      summaryMode: 'manual',
      layoutStyle: 'grid',
      maxItems: 4,
      enabled: true,
      fields: [],
    }),
    createFormSection('enrollmentFunnel', {
      title: 'Customer Funnel',
      subtitle: 'Track conversion from contact to customer',
      icon: 'Users',
      iconColor: 'blue',
      order: 1,
      linkedTabId: 'enrollment',
      collapsedByDefault: true,
      fields: [
        createFieldDef('contacted', {
          metricId: 'contacted',
          label: 'Patients Contacted',
          placeholder: 'e.g., 124',
          fieldType: FIELD_TYPES.NUMBER,
          order: 0,
        }),
        createFieldDef('enrolled', {
          metricId: 'enrolled',
          label: 'Successfully Enrolled',
          placeholder: 'e.g., 42',
          fieldType: FIELD_TYPES.NUMBER,
          order: 1,
        }),
      ],
    }),
    createFormSection('smsCampaign', {
      title: 'SMS Campaign',
      subtitle: 'Text message outreach metrics',
      icon: 'MessageSquare',
      iconColor: 'blue',
      order: 2,
      linkedTabId: 'enrollment',
      collapsedByDefault: true,
      fields: [
        createFieldDef('smsSent', {
          metricId: 'smsSent',
          label: 'SMS Messages Sent',
          placeholder: 'e.g., 450',
          fieldType: FIELD_TYPES.NUMBER,
          order: 0,
        }),
        createFieldDef('smsConsented', {
          metricId: 'smsConsented',
          label: 'SMS Responses/Consents',
          placeholder: 'e.g., 28',
          fieldType: FIELD_TYPES.NUMBER,
          order: 1,
        }),
      ],
    }),
    createFormSection('emailCampaign', {
      title: 'Email Campaign',
      subtitle: 'Email outreach metrics',
      icon: 'Mail',
      iconColor: 'amber',
      order: 3,
      linkedTabId: 'enrollment',
      collapsedByDefault: true,
      fields: [
        createFieldDef('emailSent', {
          metricId: 'emailSent',
          label: 'Emails Sent',
          placeholder: 'e.g., 380',
          fieldType: FIELD_TYPES.NUMBER,
          order: 0,
        }),
        createFieldDef('emailConsented', {
          metricId: 'emailConsented',
          label: 'Email Responses/Consents',
          placeholder: 'e.g., 22',
          fieldType: FIELD_TYPES.NUMBER,
          order: 1,
        }),
      ],
    }),
    createFormSection('mailerCampaign', {
      title: 'Mailer Campaign',
      subtitle: 'Physical mail outreach metrics',
      icon: 'FileText',
      iconColor: 'rose',
      order: 4,
      linkedTabId: 'enrollment',
      collapsedByDefault: true,
      fields: [
        createFieldDef('mailersSent', {
          metricId: 'mailersSent',
          label: 'Physical Mailers Sent',
          placeholder: 'e.g., 200',
          fieldType: FIELD_TYPES.NUMBER,
          order: 0,
        }),
        createFieldDef('mailersConsented', {
          metricId: 'mailersConsented',
          label: 'Mailer Responses/Consents',
          placeholder: 'e.g., 12',
          fieldType: FIELD_TYPES.NUMBER,
          order: 1,
        }),
        createFieldDef('currentlyInOutreach', {
          metricId: 'currentlyInOutreach',
          label: 'Currently In Outreach',
          placeholder: 'e.g., 22',
          fieldType: FIELD_TYPES.NUMBER,
          helperText: 'Number of contacts currently in active outreach',
          order: 2,
        }),
        createFieldDef('campaignStartDate', {
          label: 'Campaign Start Date',
          fieldType: FIELD_TYPES.DATE,
          helperText: 'When did this campaign begin?',
          order: 3,
        }),
      ],
    }),
    createFormSection('patientOutcomes', {
      title: 'Patient Outcomes',
      subtitle: 'Health improvements and program effectiveness',
      icon: 'Heart',
      iconColor: 'rose',
      order: 5,
      linkedTabId: 'outcomes',
      collapsedByDefault: true,
      fields: [
        createFieldDef('bpImproved', {
          metricId: 'bpImproved',
          label: 'Health Metric Improved',
          placeholder: 'e.g., 67',
          fieldType: FIELD_TYPES.PERCENT,
          suffix: '%',
          helperText: 'Percentage of participants with improved health metrics',
          order: 0,
        }),
        createFieldDef('adherenceRate', {
          metricId: 'adherenceRate',
          label: 'Program Adherence Rate',
          placeholder: 'e.g., 84',
          fieldType: FIELD_TYPES.PERCENT,
          suffix: '%',
          order: 1,
        }),
        createFieldDef('readmissionReduction', {
          metricId: 'readmissionReduction',
          label: 'Churn/Attrition Reduction',
          placeholder: 'e.g., 23',
          fieldType: FIELD_TYPES.PERCENT,
          suffix: '%',
          order: 2,
        }),
        createFieldDef('avgResponseHours', {
          metricId: 'avgResponseHours',
          label: 'Avg Response Time (hours)',
          placeholder: 'e.g., 4',
          fieldType: FIELD_TYPES.NUMBER,
          order: 3,
        }),
      ],
    }),
    createFormSection('financialMetrics', {
      title: 'Financial Metrics',
      subtitle: 'Revenue, costs, and financial performance',
      icon: 'DollarSign',
      iconColor: 'amber',
      order: 1.5,
      linkedTabId: 'financial',
      collapsedByDefault: true,
      fields: [
        createFieldDef('revenue', {
          metricId: 'revenue',
          label: 'Revenue This Month',
          placeholder: 'e.g., 12560',
          fieldType: FIELD_TYPES.CURRENCY,
          prefix: '$',
          order: 0,
        }),
        createFieldDef('costs', {
          label: 'Costs This Month',
          placeholder: 'e.g., 8500',
          fieldType: FIELD_TYPES.CURRENCY,
          prefix: '$',
          order: 1,
        }),
        createFieldDef('profitMargin', {
          label: 'Profit Margin',
          placeholder: 'e.g., 32',
          fieldType: FIELD_TYPES.PERCENT,
          suffix: '%',
          order: 2,
        }),
        createFieldDef('financialNotes', {
          label: 'Financial Notes',
          placeholder: 'Additional context about financial performance...',
          fieldType: FIELD_TYPES.TEXTAREA,
          order: 3,
        }),
      ],
    }),
    createFormSection('storiesMetadata', {
      title: 'Success Stories Metadata',
      subtitle: 'Configuration for success stories display',
      icon: 'MessageSquare',
      iconColor: 'blue',
      order: 6,
      linkedTabId: 'stories',
      collapsedByDefault: true,
      fields: [
        createFieldDef('storiesIntro', {
          label: 'Stories Section Introduction',
          placeholder: 'Brief introduction text for the success stories section...',
          fieldType: FIELD_TYPES.TEXTAREA,
          order: 0,
        }),
        createFieldDef('featuredStoryId', {
          label: 'Featured Story ID',
          placeholder: 'ID of the story to feature',
          fieldType: FIELD_TYPES.TEXT,
          order: 1,
        }),
      ],
    }),
    createFormSection('strategicPriorities', {
      title: 'Strategic Priorities',
      subtitle: 'Monthly initiatives and focus areas',
      icon: 'Lightbulb',
      iconColor: 'amber',
      order: 7,
      linkedTabId: 'initiatives',
      collapsedByDefault: true,
      fields: [
        createFieldDef('initiativesOverview', {
          label: 'Initiatives Overview',
          placeholder: 'Overview of strategic priorities for this period...',
          fieldType: FIELD_TYPES.TEXTAREA,
          order: 0,
        }),
        createFieldDef('priorityGoals', {
          label: 'Priority Goals',
          placeholder: 'Top 3-5 priority goals...',
          fieldType: FIELD_TYPES.TEXTAREA,
          order: 1,
        }),
      ],
    }),
    createFormSection('opportunitiesMetadata', {
      title: 'Opportunities Configuration',
      subtitle: 'Settings for opportunities and next steps',
      icon: 'TrendingUp',
      iconColor: 'green',
      order: 8,
      linkedTabId: 'opportunities',
      collapsedByDefault: true,
      fields: [
        createFieldDef('opportunitiesIntro', {
          label: 'Opportunities Introduction',
          placeholder: 'Introduction text for the opportunities section...',
          fieldType: FIELD_TYPES.TEXTAREA,
          order: 0,
        }),
        createFieldDef('nextStepsTimeline', {
          label: 'Next Steps Timeline',
          placeholder: 'Timeline for implementing opportunities...',
          fieldType: FIELD_TYPES.TEXT,
          order: 1,
        }),
      ],
    }),
    // Built-in chart sections - these are non-removable display sections
    createFormSection('overview-customer-growth-chart', {
      title: 'Customer Growth Chart',
      subtitle: 'Monthly customer growth over time',
      icon: 'TrendingUp',
      iconColor: 'brand',
      order: 0.5,
      linkedTabId: 'overview',
      sectionType: 'builtin_chart',
      enabled: true,
      removable: false,
      fields: [],
    }),
    createFormSection('overview-active-participants-chart', {
      title: 'Active Participants Chart',
      subtitle: 'Total active participants over time',
      icon: 'Users',
      iconColor: 'emerald',
      order: 0.6,
      linkedTabId: 'overview',
      sectionType: 'builtin_chart',
      enabled: true,
      removable: false,
      fields: [],
    }),
    createFormSection('overview-monthly-progress-summary', {
      title: 'Monthly Progress Summary',
      subtitle: 'Key metrics comparison with previous month',
      icon: 'BarChart3',
      iconColor: 'blue',
      order: 0.7,
      linkedTabId: 'overview',
      sectionType: 'builtin_chart',
      enabled: true,
      removable: false,
      fields: [],
    }),
    createFormSection('financial-revenue-summary', {
      title: 'Revenue Summary Cards',
      subtitle: 'Current month and YTD revenue metrics',
      icon: 'DollarSign',
      iconColor: 'brand',
      order: 0.5,
      linkedTabId: 'financial',
      sectionType: 'builtin_chart',
      enabled: true,
      removable: false,
      fields: [],
    }),
    createFormSection('financial-revenue-trend-chart', {
      title: 'Revenue Trend Chart',
      subtitle: 'Month-over-month revenue performance',
      icon: 'TrendingUp',
      iconColor: 'emerald',
      order: 0.6,
      linkedTabId: 'financial',
      sectionType: 'builtin_chart',
      enabled: true,
      removable: false,
      fields: [],
    }),
  ],
  // Custom metrics registry - for client-defined metrics not in base registry
  customMetrics: {},
};

const DEMO_CLIENT_IDS = ['apex-solutions', 'cascade-enterprises', 'summit-partners-group'];

const isDemoClient = (clientId) => {
  return DEMO_CLIENT_IDS.includes(clientId);
};

const isNewClient = (clientId) => {
  return clientId && clientId.startsWith('new-client-');
};

const NEW_CLIENT_FORM_SCHEMA = {
  formTitle: 'Monthly Data Entry',
  formSubtitle: 'Enter metrics for the selected month',
  allowCustomSections: true,
  allowCustomFields: true,
  sections: [
    createFormSection('coreMetrics', {
      title: 'Core Metrics',
      subtitle: 'Primary KPIs shown on the dashboard overview',
      icon: 'LayoutDashboard',
      iconColor: 'brand',
      order: 0,
      enabled: true,
      linkedTabId: 'overview',
      collapsedByDefault: true,
      fields: [
        createFieldDef('keyMetric1', {
          metricId: 'keyMetric1',
          label: 'Key Metric 1',
          placeholder: 'Enter value',
          fieldType: FIELD_TYPES.NUMBER,
          order: 0,
        }),
        createFieldDef('keyMetric2', {
          metricId: 'keyMetric2',
          label: 'Key Metric 2',
          placeholder: 'Enter value',
          fieldType: FIELD_TYPES.NUMBER,
          order: 1,
        }),
        createFieldDef('keyMetric3', {
          metricId: 'keyMetric3',
          label: 'Key Metric 3',
          placeholder: 'Enter value',
          fieldType: FIELD_TYPES.NUMBER,
          order: 2,
        }),
        createFieldDef('keyMetric4', {
          metricId: 'keyMetric4',
          label: 'Key Metric 4',
          placeholder: 'Enter value',
          fieldType: FIELD_TYPES.NUMBER,
          order: 3,
        }),
      ],
    }),
  ],
  customMetrics: {},
};

// Helper functions for form schema manipulation
const getFormSectionById = (schema, sectionId) => {
  return schema.sections.find(s => s.id === sectionId);
};

const getFieldById = (schema, sectionId, fieldId) => {
  const section = getFormSectionById(schema, sectionId);
  return section?.fields.find(f => f.id === fieldId);
};

const addFormSection = (schema, section) => {
  const newOrder = Math.max(...schema.sections.map(s => s.order), -1) + 1;
  return {
    ...schema,
    sections: [...schema.sections, { ...section, order: section.order ?? newOrder }],
  };
};

const removeFormSection = (schema, sectionId) => {
  return {
    ...schema,
    sections: schema.sections.filter(s => s.id !== sectionId),
  };
};

const updateFormSection = (schema, sectionId, updates) => {
  return {
    ...schema,
    sections: schema.sections.map(s => 
      s.id === sectionId ? { ...s, ...updates } : s
    ),
  };
};

const reorderFormSections = (schema, newOrder) => {
  // newOrder is an array of section IDs in the desired order
  return {
    ...schema,
    sections: newOrder.map((id, idx) => {
      const section = schema.sections.find(s => s.id === id);
      return { ...section, order: idx };
    }),
  };
};

const addFieldToSection = (schema, sectionId, field) => {
  return {
    ...schema,
    sections: schema.sections.map(s => {
      if (s.id !== sectionId) return s;
      const newOrder = Math.max(...s.fields.map(f => f.order), -1) + 1;
      return {
        ...s,
        fields: [...s.fields, { ...field, order: field.order ?? newOrder }],
      };
    }),
  };
};

const removeFieldFromSection = (schema, sectionId, fieldId) => {
  return {
    ...schema,
    sections: schema.sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        fields: s.fields.filter(f => f.id !== fieldId),
      };
    }),
  };
};

const updateField = (schema, sectionId, fieldId, updates) => {
  return {
    ...schema,
    sections: schema.sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        fields: s.fields.map(f => 
          f.id === fieldId ? { ...f, ...updates } : f
        ),
      };
    }),
  };
};

const reorderFieldsInSection = (schema, sectionId, newOrder) => {
  return {
    ...schema,
    sections: schema.sections.map(s => {
      if (s.id !== sectionId) return s;
      return {
        ...s,
        fields: newOrder.map((id, idx) => {
          const field = s.fields.find(f => f.id === id);
          return { ...field, order: idx };
        }),
      };
    }),
  };
};

// Add a custom metric (not in base registry)
const addCustomMetric = (schema, metric) => {
  return {
    ...schema,
    customMetrics: {
      ...schema.customMetrics,
      [metric.id]: metric,
    },
  };
};

const removeCustomMetric = (schema, metricId) => {
  const { [metricId]: removed, ...rest } = schema.customMetrics;
  return {
    ...schema,
    customMetrics: rest,
  };
};

// Generate empty form data from schema
const generateEmptyFormData = (schema) => {
  const data = {};
  schema.sections.forEach(section => {
    section.fields.forEach(field => {
      data[field.id] = field.defaultValue;
    });
  });
  // Add custom metrics
  Object.values(schema.customMetrics || {}).forEach(metric => {
    data[metric.id] = metric.defaultValue ?? 0;
  });
  return data;
};

// Validate form data against schema
const validateFormData = (schema, data) => {
  const errors = {};
  schema.sections.forEach(section => {
    section.fields.forEach(field => {
      const value = data[field.id];
      field.validation?.forEach(rule => {
        if (rule.type === VALIDATION_RULES.REQUIRED && (value === undefined || value === '' || value === null)) {
          errors[field.id] = rule.message || `${field.label} is required`;
        }
        if (rule.type === VALIDATION_RULES.MIN && value < rule.value) {
          errors[field.id] = rule.message || `${field.label} must be at least ${rule.value}`;
        }
        if (rule.type === VALIDATION_RULES.MAX && value > rule.value) {
          errors[field.id] = rule.message || `${field.label} must be at most ${rule.value}`;
        }
      });
    });
  });
  return errors;
};

// WHITELABEL CUSTOMIZATION SYSTEM
// ============================================================

const defaultCustomization = {
  // Platform-wide terminology (industry-agnostic)
  terminology: {
    client: 'Client',
    clients: 'Clients', 
    participant: 'Patient',
    participants: 'Patients',
    enrollment: 'Enrollment',
    enrolled: 'Enrolled',
    service: 'Service',
    services: 'Services',
    outcome: 'Outcome',
    outcomes: 'Outcomes',
    story: 'Success Story',
    stories: 'Success Stories',
    opportunity: 'Opportunity',
    opportunities: 'Opportunities',
    initiative: 'Initiative',
    initiatives: 'Initiatives',
  },
  // Dynamic metric definitions - fully configurable per client
  metrics: {
    // Core Metrics
    enrolledThisMonth: {
      id: 'enrolledThisMonth',
      label: 'Enrolled This Month',
      shortLabel: 'New Enrolled',
      fieldLabel: 'Participants Enrolled This Month',
      category: 'core',
      type: 'number',
      format: 'number',
      icon: 'Users',
      color: 'brand',
      description: 'New participants enrolled during this period',
      showOnDashboard: true,
      showDelta: true,
      trackable: true, // Can be used for alerts
      // Alert properties
      isAlertable: true,
      isComparable: true, // Can compute % change MoM
      comparisonMethod: 'percent', // percent, absolute, target
      directionality: 'up-is-good', // up-is-good, down-is-good, neutral
      order: 0,
    },
    activePatients: {
      id: 'activePatients',
      label: 'Active Participants',
      shortLabel: 'Active',
      fieldLabel: 'Total Active Participants',
      category: 'core',
      type: 'number',
      format: 'number',
      icon: 'Users',
      color: 'emerald',
      description: 'Total active participants in the program',
      showOnDashboard: true,
      showDelta: true,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 1,
    },
    servicesDelivered: {
      id: 'servicesDelivered',
      label: 'Services Delivered',
      shortLabel: 'Services',
      fieldLabel: 'Services Delivered This Month',
      category: 'core',
      type: 'number',
      format: 'number',
      icon: 'Activity',
      color: 'blue',
      description: 'Total services or interactions delivered',
      showOnDashboard: true,
      showDelta: true,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 2,
    },
    revenue: {
      id: 'revenue',
      label: 'Revenue',
      shortLabel: 'Revenue',
      fieldLabel: 'Revenue This Month',
      category: 'core',
      type: 'currency',
      format: 'currency',
      icon: 'DollarSign',
      color: 'amber',
      description: 'Total revenue generated this period',
      showOnDashboard: true,
      showDelta: true,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 3,
    },
    // Funnel Metrics
    contacted: {
      id: 'contacted',
      label: 'Contacted',
      shortLabel: 'Contacted',
      fieldLabel: 'Total Contacted',
      category: 'funnel',
      type: 'number',
      format: 'number',
      icon: 'Phone',
      color: 'slate',
      description: 'Total contacts attempted',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 10,
    },
    enrolled: {
      id: 'enrolled',
      label: 'Enrolled',
      shortLabel: 'Enrolled',
      fieldLabel: 'Successfully Enrolled',
      category: 'funnel',
      type: 'number',
      format: 'number',
      icon: 'UserCheck',
      color: 'emerald',
      description: 'Successfully enrolled from contacts',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 11,
    },
    // Campaign Metrics - SMS
    smsSent: {
      id: 'smsSent',
      label: 'SMS Sent',
      shortLabel: 'SMS Sent',
      fieldLabel: 'SMS Messages Sent',
      category: 'campaign',
      subcategory: 'sms',
      type: 'number',
      format: 'number',
      icon: 'MessageSquare',
      color: 'blue',
      description: 'SMS messages sent',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 20,
    },
    smsConsented: {
      id: 'smsConsented',
      label: 'SMS Consented',
      shortLabel: 'SMS Consented',
      fieldLabel: 'SMS Responses/Consents',
      category: 'campaign',
      subcategory: 'sms',
      type: 'number',
      format: 'number',
      icon: 'CheckCircle',
      color: 'emerald',
      description: 'Consented via SMS',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 21,
    },
    // Campaign Metrics - Email
    emailSent: {
      id: 'emailSent',
      label: 'Emails Sent',
      shortLabel: 'Emails Sent',
      fieldLabel: 'Emails Sent',
      category: 'campaign',
      subcategory: 'email',
      type: 'number',
      format: 'number',
      icon: 'Mail',
      color: 'blue',
      description: 'Emails sent',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 22,
    },
    emailConsented: {
      id: 'emailConsented',
      label: 'Email Consented',
      shortLabel: 'Email Consented',
      fieldLabel: 'Email Responses/Consents',
      category: 'campaign',
      subcategory: 'email',
      type: 'number',
      format: 'number',
      icon: 'CheckCircle',
      color: 'emerald',
      description: 'Consented via email',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 23,
    },
    // Campaign Metrics - Mailer
    mailersSent: {
      id: 'mailersSent',
      label: 'Mailers Sent',
      shortLabel: 'Mailers Sent',
      fieldLabel: 'Physical Mailers Sent',
      category: 'campaign',
      subcategory: 'mailer',
      type: 'number',
      format: 'number',
      icon: 'FileText',
      color: 'blue',
      description: 'Physical mailers sent',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 24,
    },
    mailersConsented: {
      id: 'mailersConsented',
      label: 'Mailer Consented',
      shortLabel: 'Mailer Consented',
      fieldLabel: 'Mailer Responses/Consents',
      category: 'campaign',
      subcategory: 'mailer',
      type: 'number',
      format: 'number',
      icon: 'CheckCircle',
      color: 'emerald',
      description: 'Consented via mailer',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'up-is-good',
      order: 25,
    },
    currentlyInOutreach: {
      id: 'currentlyInOutreach',
      label: 'Currently In Outreach',
      shortLabel: 'In Outreach',
      fieldLabel: 'Currently In Outreach Pipeline',
      category: 'campaign',
      type: 'number',
      format: 'number',
      icon: 'Clock',
      color: 'amber',
      description: 'Contacts currently in outreach pipeline',
      showOnDashboard: false,
      trackable: true,
      isAlertable: false, // Not meaningful to compare MoM - it's a snapshot
      isComparable: false,
      order: 26,
    },
    campaignStartDate: {
      id: 'campaignStartDate',
      label: 'Campaign Start Date',
      shortLabel: 'Start Date',
      fieldLabel: 'Campaign Start Date',
      category: 'campaign',
      type: 'date',
      format: 'date',
      icon: 'Calendar',
      color: 'slate',
      description: 'Date the campaign started',
      showOnDashboard: false,
      trackable: false,
      isAlertable: false, // Dates are not alertable
      isComparable: false,
      order: 27,
    },
    // Outcome Metrics
    bpImproved: {
      id: 'bpImproved',
      label: 'Health Metric Improved',
      shortLabel: 'Health ↑',
      fieldLabel: 'Health Improvement Rate (%)',
      category: 'outcome',
      type: 'number',
      format: 'percentage',
      icon: 'Heart',
      color: 'rose',
      description: 'Participants with improved health metrics',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'absolute', // For percentages, use absolute change
      directionality: 'up-is-good',
      order: 30,
    },
    adherenceRate: {
      id: 'adherenceRate',
      label: 'Adherence Rate',
      shortLabel: 'Adherence',
      fieldLabel: 'Program Adherence Rate (%)',
      category: 'outcome',
      type: 'number',
      format: 'percentage',
      icon: 'CheckCircle',
      color: 'emerald',
      description: 'Program adherence rate',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'absolute',
      directionality: 'up-is-good',
      order: 31,
    },
    readmissionReduction: {
      id: 'readmissionReduction',
      label: 'Churn Reduction',
      shortLabel: 'Churn ↓',
      fieldLabel: 'Churn/Attrition Reduction (%)',
      category: 'outcome',
      type: 'number',
      format: 'percentage',
      icon: 'TrendingDown',
      color: 'teal',
      description: 'Reduction in churn or attrition',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'absolute',
      directionality: 'up-is-good', // Higher reduction is better
      order: 32,
    },
    avgResponseHours: {
      id: 'avgResponseHours',
      label: 'Avg Response Time',
      shortLabel: 'Response Time',
      fieldLabel: 'Avg Response Time (hours)',
      category: 'outcome',
      type: 'number',
      format: 'hours',
      icon: 'Clock',
      color: 'blue',
      description: 'Average response time in hours',
      showOnDashboard: false,
      trackable: true,
      isAlertable: true,
      isComparable: true,
      comparisonMethod: 'percent',
      directionality: 'down-is-good', // Lower response time is better
      order: 33,
    },
  },
  // Section definitions with editable subtitles and widget configurations
  sections: {
    coreMetrics: {
      id: 'coreMetrics',
      title: 'Core Metrics',
      subtitle: 'Primary KPIs shown on the dashboard overview',
      icon: 'LayoutDashboard',
      enabled: true,
      order: 0,
      widgets: ['enrolledThisMonth', 'activePatients', 'servicesDelivered', 'revenue'],
      widgetStyle: 'kpi-card', // kpi-card, compact-card, large-card
      showChart: true,
      chartType: 'area', // line, bar, area
      chartMetrics: ['enrolledThisMonth', 'activePatients'],
    },
    enrollmentFunnel: {
      id: 'enrollmentFunnel',
      title: 'Customer Funnel',
      subtitle: 'Track conversion from contact to customer',
      icon: 'TrendingUp',
      enabled: true,
      order: 1,
      widgets: ['contacted', 'enrolled'],
      widgetStyle: 'funnel',
      showChart: false,
    },
    campaignPerformance: {
      id: 'campaignPerformance',
      title: 'Campaign Performance',
      subtitle: 'Outreach campaign metrics and results',
      icon: 'Target',
      enabled: true,
      order: 2,
      subsections: {
        sms: { title: 'SMS Campaign', subtitle: 'Text message outreach', enabled: true, metrics: ['smsSent', 'smsConsented'] },
        email: { title: 'Email Campaign', subtitle: 'Email outreach', enabled: true, metrics: ['emailSent', 'emailConsented'] },
        mailer: { title: 'Mailer Campaign', subtitle: 'Physical mail outreach', enabled: true, metrics: ['mailersSent', 'mailersConsented'] },
      },
    },
    outcomes: {
      id: 'outcomes',
      title: 'Outcomes',
      subtitle: 'Key performance and outcome indicators',
      icon: 'Heart',
      enabled: true,
      order: 3,
      widgets: ['bpImproved', 'adherenceRate', 'readmissionReduction', 'avgResponseHours'],
      widgetStyle: 'outcome-card',
    },
    stories: {
      id: 'stories',
      title: 'Success Stories',
      subtitle: 'Testimonials and positive feedback',
      icon: 'MessageSquare',
      enabled: true,
      order: 4,
      widgetStyle: 'story-card',
    },
    opportunities: {
      id: 'opportunities',
      title: 'Opportunities & Next Steps',
      subtitle: 'Action items and improvement opportunities',
      icon: 'Lightbulb',
      enabled: true,
      order: 5,
      widgetStyle: 'priority-list',
    },
  },
  branding: {
    platformName: 'PrysmCS',
    platformTagline: 'Chronic Care Management',
    logoUrl: null,
    logoText: 'PrysmCS',
    logoMode: 'default',
    primaryColor: '#06b6d4',
    secondaryColor: '#0f172a',
    accentColor: '#14b8a6',
    sidebarBg: 'linear-gradient(180deg, #0a2540 0%, #0f172a 100%)',
    sidebarTextColor: '#e2e8f0',
    slideBg: 'linear-gradient(135deg, #0a2540 0%, #0f172a 50%, #1e293b 100%)',
    headerBg: '#0f172a',
    fontFamily: 'Inter',
    siteTitle: 'PrysmCS',
    faviconUrl: null,
    ogImageUrl: null,
  },
  navigation: {
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', enabled: true, order: 0 },
      { id: 'enrollment', label: 'Customers', icon: 'Users', enabled: true, order: 1 },
      { id: 'financial', label: 'Financial', icon: 'DollarSign', enabled: true, order: 2 },
      { id: 'outcomes', label: 'Outcomes', icon: 'Heart', enabled: true, order: 3 },
      { id: 'stories', label: 'Success Stories', icon: 'MessageSquare', enabled: true, order: 4 },
      { id: 'initiatives', label: 'Strategic Priorities', icon: 'Lightbulb', enabled: true, order: 5 },
      { id: 'opportunities', label: 'Opportunities', icon: 'TrendingUp', enabled: true, order: 6 },
      { id: 'metrics', label: 'Metrics', icon: 'BarChart2', enabled: true, order: 7 },
    ],
  },
  widgets: {
    overview: [
      { id: 'kpi-cards', label: 'KPI Cards', enabled: true, order: 0 },
      { id: 'enrollment-chart', label: 'Customer Growth Chart', enabled: true, order: 1 },
      { id: 'revenue-chart', label: 'Revenue Chart', enabled: true, order: 2 },
    ],
    enrollment: [
      { id: 'funnel', label: 'Customer Funnel', enabled: true, order: 0 },
      { id: 'outreach', label: 'Outreach Stats', enabled: true, order: 1 },
      { id: 'campaign-info', label: 'Campaign Information', enabled: true, order: 2 },
    ],
    financial: [
      { id: 'revenue-summary', label: 'Revenue Summary', enabled: true, order: 0 },
      { id: 'billing-breakdown', label: 'Billing Breakdown', enabled: true, order: 1 },
    ],
    outcomes: [
      { id: 'outcome-metrics', label: 'Outcome Metrics', enabled: true, order: 0 },
      { id: 'outcome-chart', label: 'Outcomes Chart', enabled: true, order: 1 },
    ],
    stories: [
      { id: 'stories-list', label: 'Success Stories List', enabled: true, order: 0 },
    ],
    initiatives: [
      { id: 'initiatives-list', label: 'Initiatives List', enabled: true, order: 0 },
    ],
    opportunities: [
      { id: 'opportunities-list', label: 'Opportunities List', enabled: true, order: 0 },
    ],
  },
  notifications: {
    adminReminders: {
      clientMeetings: { enabled: true, inApp: true, email: true, advanceHours: 24, isCustom: false, label: 'Client Meetings', description: 'Get reminded before scheduled client meetings' },
      csmOneOnOnes: { enabled: true, inApp: true, email: true, advanceHours: 24, isCustom: false, label: '1:1s with CSMs', description: 'Reminders for one-on-one meetings with team members' },
      actionItems: { enabled: true, inApp: true, email: false, advanceHours: 48, isCustom: false, label: 'Action Items Due', description: 'Alerts when action items are approaching their deadline' },
      weeklyDigest: { enabled: true, inApp: false, email: true, dayOfWeek: 'monday', isCustom: false, label: 'Weekly Team Digest', description: 'Weekly summary of team performance and upcoming tasks' },
      teamPerformanceAlerts: { enabled: true, inApp: true, email: true, isCustom: false, label: 'Team Performance Alerts', description: 'Notifications when team metrics need attention' },
    },
    csmReminders: {
      clientMeetings: { enabled: true, inApp: true, email: true, advanceHours: 24, isCustom: false, label: 'Client Meetings', description: 'Get reminded before scheduled client meetings' },
      meetingPrep: { enabled: true, inApp: true, email: false, advanceHours: 48, isCustom: false, label: 'Meeting Preparation', description: 'Reminder to prepare materials before client meetings' },
      actionItems: { enabled: true, inApp: true, email: false, advanceHours: 24, isCustom: false, label: 'Action Items Due', description: 'Alerts when your action items are approaching deadline' },
      managerOneOnOnes: { enabled: true, inApp: true, email: true, advanceHours: 24, isCustom: false, label: '1:1s with Manager', description: 'Reminders for one-on-one meetings with your manager' },
      followUpReminders: { enabled: true, inApp: true, email: false, advanceHours: 72, isCustom: false, label: 'Client Follow-ups', description: 'Reminders to follow up with clients after meetings' },
      monthlyReviewPrep: { enabled: true, inApp: true, email: true, advanceDays: 3, isCustom: false, label: 'Monthly Review Prep', description: 'Reminder to prepare for monthly client reviews' },
    },
    alerts: {
      metricDips: { 
        enabled: true, 
        inApp: true, 
        email: true, 
        threshold: 10, 
        isCustom: false, 
        label: 'Metric Dips', 
        description: 'Alert when selected metrics drop below threshold',
        // Configurable: which metrics to monitor
        monitoredMetrics: ['enrolledThisMonth', 'activePatients', 'revenue'],
        comparisonType: 'previous-month', // previous-month, previous-quarter, target
      },
      crossSellOpportunities: { enabled: true, inApp: true, email: false, isCustom: false, label: 'Cross-sell Opportunities', description: 'Notify when cross-sell opportunities are identified' },
      upsellOpportunities: { enabled: true, inApp: true, email: false, isCustom: false, label: 'Upsell Opportunities', description: 'Notify when upsell opportunities are identified' },
      campaignLaunched: { enabled: true, inApp: true, email: true, isCustom: false, label: 'Campaign Launched', description: 'Alert when a new campaign goes live' },
      clientInactivity: { enabled: true, inApp: true, email: true, daysThreshold: 30, isCustom: false, label: 'Client Inactivity', description: "Alert when a client hasn't logged in" },
      milestones: { 
        enabled: true, 
        inApp: true, 
        email: false, 
        isCustom: false, 
        label: 'Milestone Reached', 
        description: 'Celebrate when targets are reached',
        // Configurable milestones
        milestoneMetrics: ['enrolledThisMonth', 'revenue'],
        milestoneTargets: { enrolledThisMonth: 50, revenue: 10000 },
      },
      metricGrowth: { 
        enabled: true, 
        inApp: true, 
        email: true, 
        threshold: 15, 
        isCustom: false, 
        label: 'Significant Growth', 
        description: 'Alert on major metric increases',
        monitoredMetrics: ['revenue', 'activePatients'],
      },
      outcomeAlerts: { 
        enabled: true, 
        inApp: true, 
        email: false, 
        isCustom: false, 
        label: 'Outcome Changes', 
        description: 'Notify when outcomes show significant change',
        monitoredMetrics: ['bpImproved', 'adherenceRate'],
        threshold: 10,
      },
    },
    automatedWorkflows: {
      monthlyReportToClients: { 
        enabled: true, 
        sendEmail: true, 
        advanceDays: 3, 
        reportType: 'monthly',
        includeKPIs: true,
        includeOutcomes: true,
        includeFinancial: false,
        customMessage: 'Please find attached your monthly performance report ahead of our upcoming review meeting.'
      },
      quarterlyReportToClients: { 
        enabled: true, 
        sendEmail: true, 
        advanceDays: 5, 
        reportType: 'quarterly',
        includeKPIs: true,
        includeOutcomes: true,
        includeFinancial: true,
        customMessage: 'Attached is your quarterly business review report. We look forward to discussing the results.'
      },
      weeklyInternalReport: { 
        enabled: false, 
        sendEmail: true, 
        dayOfWeek: 'friday',
        recipients: 'team',
        includeAllClients: true,
      },
      clientMeetingReminder: {
        enabled: true,
        sendEmail: true,
        advanceDays: 3,
        includeAgenda: true,
        includeReportPreview: true,
        customMessage: 'This is a reminder about your upcoming review meeting. Please find the agenda and preliminary report attached.'
      },
    },
  },
  activeAlerts: [],
  // Section visibility controls for Stories and Opportunities sections
  sectionVisibility: {
    stories: true,
    opportunities: true,
  },
  // Form Schema - defines the Monthly Data entry form structure
  formSchema: DEFAULT_FORM_SCHEMA,
};

const CustomizationContext = createContext(null);

function CustomizationProvider({ children }) {
  const [isSaving, setIsSaving] = useState(false);
  const [customization, setCustomization] = useState(() => {
    const saved = localStorage.getItem('medkick_customization');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        // Migration: Update old tab labels to new ones
        if (parsed.navigation && parsed.navigation.tabs) {
          parsed.navigation.tabs = parsed.navigation.tabs.map(tab => {
            if (tab.id === 'stories' && tab.label === 'Patient Stories') {
              return { ...tab, label: 'Success Stories' };
            }
            if (tab.id === 'initiatives' && tab.label === 'Monthly Initiatives') {
              return { ...tab, label: 'Strategic Priorities' };
            }
            if (tab.id === 'enrollment' && tab.label === 'Enrollment') {
              return { ...tab, label: 'Customers' };
            }
            return tab;
          });

          // Migration: Remove Success Planning from tabs if it exists (it's now below the divider)
          parsed.navigation.tabs = parsed.navigation.tabs.filter(tab => tab.id !== 'successPlanning');
          // Reorder remaining tabs
          parsed.navigation.tabs = parsed.navigation.tabs.map((tab, index) => ({
            ...tab,
            order: index
          }));
        }

        // Migration: Add linkedTabId to form sections that don't have it
        if (parsed.formSchema && parsed.formSchema.sections) {
          parsed.formSchema.sections = parsed.formSchema.sections.map(section => {
            const defaultSection = DEFAULT_FORM_SCHEMA.sections.find(s => s.id === section.id);
            if (defaultSection?.linkedTabId && !section.linkedTabId) {
              return { ...section, linkedTabId: defaultSection.linkedTabId };
            }
            return section;
          });
        }

        // Migration: Sync showOnDashboard from metrics registry (one-time migration)
        // Only run if the migration hasn't been applied yet
        if (!parsed._showOnDashboardMigrated && parsed.formSchema && parsed.formSchema.sections) {
          parsed.formSchema.sections = parsed.formSchema.sections.map(section => {
            return {
              ...section,
              fields: section.fields.map(field => {
                // If field references a metric, inherit its showOnDashboard property
                if (field.metricId && defaultCustomization.metrics[field.metricId]) {
                  const metric = defaultCustomization.metrics[field.metricId];
                  if (metric.showOnDashboard !== undefined) {
                    return { ...field, showOnDashboard: metric.showOnDashboard };
                  }
                }
                return field;
              }),
            };
          });
          parsed._showOnDashboardMigrated = true;
        }

        // Migration: Rename 'Test1' or 'pagesummaryoverview' section to 'overview-page-summary'
        if (parsed.formSchema && parsed.formSchema.sections) {
          parsed.formSchema.sections = parsed.formSchema.sections.map(section => {
            if ((section.id === 'Test1' || section.id === 'pagesummaryoverview') && section.sectionType === 'page_summary') {
              return { ...section, id: 'overview-page-summary' };
            }
            return section;
          });
        }

        // Migration: Enable overview-page-summary section if it exists
        if (parsed.formSchema && parsed.formSchema.sections && !parsed._overviewPageSummaryEnabled) {
          parsed.formSchema.sections = parsed.formSchema.sections.map(section => {
            if (section.id === 'overview-page-summary' && section.sectionType === 'page_summary') {
              return { ...section, enabled: true };
            }
            return section;
          });
          parsed._overviewPageSummaryEnabled = true;
        }

        // Migration: Add new default sections that don't exist in saved schema
        // But respect sections that were explicitly deleted by the user
        if (parsed.formSchema && parsed.formSchema.sections) {
          const deletedSections = parsed.deletedSectionIds || [];
          const existingSectionIds = new Set(parsed.formSchema.sections.map(s => s.id));
          const newSections = DEFAULT_FORM_SCHEMA.sections.filter(
            defaultSection =>
              !existingSectionIds.has(defaultSection.id) &&
              !deletedSections.includes(defaultSection.id)
          );
          if (newSections.length > 0) {
            parsed.formSchema.sections = [...parsed.formSchema.sections, ...newSections];
          }
        }

        // Migration: Update "Enrollment" to "Customers" in widget labels
        if (parsed.widgets) {
          Object.keys(parsed.widgets).forEach(tabKey => {
            if (Array.isArray(parsed.widgets[tabKey])) {
              parsed.widgets[tabKey] = parsed.widgets[tabKey].map(widget => {
                let updatedWidget = { ...widget };
                if (widget.label) {
                  updatedWidget.label = widget.label
                    .replace(/Enrollment Trend Chart/g, 'Customer Growth Chart')
                    .replace(/Enrollment Funnel/g, 'Customer Funnel');
                }
                return updatedWidget;
              });
            }
          });
        }

        // Migration: Update "Enrollment" to "Customers" in form section titles and subtitles
        if (parsed.formSchema && parsed.formSchema.sections) {
          parsed.formSchema.sections = parsed.formSchema.sections.map(section => {
            let updatedSection = { ...section };
            if (section.title) {
              updatedSection.title = section.title
                .replace(/Enrollment Funnel/g, 'Customer Funnel')
                .replace(/Enrollment/g, 'Customer');
            }
            if (section.subtitle) {
              updatedSection.subtitle = section.subtitle
                .replace(/enrollment/g, 'customer');
            }
            return updatedSection;
          });
        }

        // Deep merge with defaults to ensure new properties are included
        // For widgets: preserve saved state exactly, only add defaults for tabs that don't have widgets defined yet
        const mergedWidgets = (() => {
          const savedWidgets = parsed.widgets || {};
          const result = { ...savedWidgets };

          // Only add default widgets for tabs that exist but don't have any widgets saved
          const tabs = parsed.navigation?.tabs || defaultCustomization.navigation.tabs;
          tabs.forEach(tab => {
            if (result[tab.id] === undefined && defaultCustomization.widgets[tab.id]) {
              result[tab.id] = defaultCustomization.widgets[tab.id];
            }
          });

          return result;
        })();

        return {
          ...defaultCustomization,
          ...parsed,
          branding: {
            ...defaultCustomization.branding,
            ...(parsed.branding || {}),
          },
          navigation: {
            ...defaultCustomization.navigation,
            ...(parsed.navigation || {}),
            tabs: parsed.navigation?.tabs || defaultCustomization.navigation.tabs,
          },
          widgets: mergedWidgets,
          notifications: {
            ...defaultCustomization.notifications,
            ...(parsed.notifications || {}),
            adminReminders: {
              ...defaultCustomization.notifications.adminReminders,
              ...(parsed.notifications?.adminReminders || {}),
            },
            csmReminders: {
              ...defaultCustomization.notifications.csmReminders,
              ...(parsed.notifications?.csmReminders || {}),
            },
            alerts: {
              ...defaultCustomization.notifications.alerts,
              ...(parsed.notifications?.alerts || {}),
            },
            automatedWorkflows: {
              ...defaultCustomization.notifications.automatedWorkflows,
              ...(parsed.notifications?.automatedWorkflows || {}),
            },
          },
        };
      } catch (e) {
        return defaultCustomization;
      }
    }
    return defaultCustomization;
  });

  const [isSavingBranding, setIsSavingBranding] = useState(false);
  const [brandingSaveStatus, setBrandingSaveStatus] = useState('idle');
  const brandingDebounceRef = useRef(null);
  const customizationRef = useRef(customization);

  useEffect(() => {
    customizationRef.current = customization;
  }, [customization]);

  useEffect(() => {
    const loadBranding = async () => {
      const result = await customizationClient.loadGlobalBranding();
      if (result.success && result.data) {
        setCustomization(prev => ({
          ...prev,
          branding: { ...prev.branding, ...result.data },
        }));
      }
    };
    loadBranding();
  }, []);

  useEffect(() => {
    localStorage.setItem('medkick_customization', JSON.stringify(customization));

    const root = document.documentElement;
    const branding = customization.branding;
    root.style.setProperty('--brand-primary', branding.primaryColor);
    root.style.setProperty('--brand-secondary', branding.secondaryColor);
    root.style.setProperty('--brand-accent', branding.accentColor);
    root.style.setProperty('--brand-primary-light', branding.accentColor);
    root.style.setProperty('--brand-primary-dark', branding.secondaryColor);
    root.style.setProperty('--brand-font', branding.fontFamily || 'DM Sans');
    invalidateBrandingPaletteCache();
    document.body.style.fontFamily = `'${branding.fontFamily || 'DM Sans'}', -apple-system, sans-serif`;

    if (branding.siteTitle) {
      document.title = branding.siteTitle;
    }
    if (branding.faviconUrl) {
      let link = document.querySelector('link[rel="icon"]');
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.head.appendChild(link);
      }
      link.href = branding.faviconUrl;
      link.type = '';
    }
    const ogImg = branding.ogImageUrl || '';
    let ogMeta = document.querySelector('meta[property="og:image"]');
    if (ogMeta) ogMeta.setAttribute('content', ogImg);
    let twMeta = document.querySelector('meta[name="twitter:image"]');
    if (twMeta) twMeta.setAttribute('content', ogImg);
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle && branding.siteTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    if (ogTitle && branding.siteTitle) ogTitle.setAttribute('content', branding.siteTitle);
  }, [customization]);

  // Memoize all functions to prevent infinite re-renders
  const updateBranding = useCallback((updates) => {
    setCustomization(prev => ({
      ...prev,
      branding: { ...prev.branding, ...updates }
    }));
  }, []);

  const updateTab = useCallback((tabId, updates) => {
    setCustomization(prev => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        tabs: prev.navigation.tabs.map(tab =>
          tab.id === tabId ? { ...tab, ...updates } : tab
        )
      }
    }));
  }, []);

  const reorderTabs = useCallback((newOrder) => {
    setCustomization(prev => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        tabs: newOrder.map((tab, index) => ({ ...tab, order: index }))
      }
    }));
  }, []);

  const addTab = useCallback((tabData) => {
    setCustomization(prev => {
      const sanitizedId = tabData.id || tabData.label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

      let uniqueId = sanitizedId;
      let counter = 1;
      while (prev.navigation.tabs.some(tab => tab.id === uniqueId)) {
        uniqueId = `${sanitizedId}-${counter}`;
        counter++;
      }

      const maxOrder = Math.max(...prev.navigation.tabs.map(t => t.order), -1);

      const newTab = {
        id: uniqueId,
        label: tabData.label,
        icon: tabData.icon || 'LayoutDashboard',
        enabled: tabData.enabled ?? true,
        order: maxOrder + 1,
        isCustom: true,
      };

      console.log('[addTab] Creating new custom tab:', newTab);

      return {
        ...prev,
        navigation: {
          ...prev.navigation,
          tabs: [...prev.navigation.tabs, newTab]
        },
        widgets: {
          ...prev.widgets,
          [uniqueId]: []
        }
      };
    });
  }, []);

  const removeTab = useCallback((tabId) => {
    setCustomization(prev => {
      const formSchema = prev.formSchema || DEFAULT_FORM_SCHEMA;

      return {
        ...prev,
        navigation: {
          ...prev.navigation,
          tabs: prev.navigation.tabs.filter(tab => tab.id !== tabId)
        },
        formSchema: {
          ...formSchema,
          sections: formSchema.sections.filter(section => section.linkedTabId !== tabId)
        },
        widgets: {
          ...prev.widgets,
          [tabId]: undefined
        }
      };
    });
  }, []);

  const getTabSectionCount = useCallback((tabId) => {
    const formSchema = customization.formSchema || DEFAULT_FORM_SCHEMA;
    const sections = formSchema.sections.filter(section => section.linkedTabId === tabId);
    const widgets = customization.widgets[tabId] || [];
    return {
      sections: sections.length,
      widgets: widgets.length,
      total: sections.length + widgets.length
    };
  }, [customization.formSchema, customization.widgets]);

  const updateWidget = useCallback((pageId, widgetId, updates) => {
    setCustomization(prev => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [pageId]: prev.widgets[pageId].map(widget =>
          widget.id === widgetId ? { ...widget, ...updates } : widget
        )
      }
    }));
  }, []);

  const reorderWidgets = useCallback((pageId, newOrder) => {
    setCustomization(prev => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [pageId]: newOrder.map((widget, index) => ({ ...widget, order: index }))
      }
    }));
  }, []);

  const resetToDefaults = useCallback(() => {
    localStorage.removeItem('medkick_customization');
    setCustomization(JSON.parse(JSON.stringify(defaultCustomization)));
  }, []);

  const getEnabledTabs = useCallback(() => {
    return [...customization.navigation.tabs]
      .filter(tab => tab.enabled && tab.id !== 'metrics')
      .sort((a, b) => a.order - b.order);
  }, [customization.navigation.tabs]);

  const getEnabledWidgets = useCallback((pageId) => {
    const widgets = customization.widgets[pageId] || [];
    return [...widgets]
      .filter(w => w.enabled)
      .sort((a, b) => a.order - b.order);
  }, [customization.widgets]);

  const updateNotification = useCallback((category, itemKey, updates) => {
    setCustomization(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [category]: {
          ...prev.notifications[category],
          [itemKey]: {
            ...prev.notifications[category][itemKey],
            ...updates
          }
        }
      }
    }));
  }, []);

  const updateWorkflow = useCallback((workflowKey, updates) => {
    setCustomization(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        automatedWorkflows: {
          ...prev.notifications.automatedWorkflows,
          [workflowKey]: {
            ...prev.notifications.automatedWorkflows[workflowKey],
            ...updates
          }
        }
      }
    }));
  }, []);

  const addAlert = useCallback((alert) => {
    setCustomization(prev => ({
      ...prev,
      activeAlerts: [...(prev.activeAlerts || []), { ...alert, id: Date.now(), status: 'active', createdAt: new Date().toISOString() }]
    }));
  }, []);

  const dismissAlert = useCallback((alertId) => {
    setCustomization(prev => ({
      ...prev,
      activeAlerts: (prev.activeAlerts || []).map(a =>
        a.id === alertId ? { ...a, status: 'dismissed', dismissedAt: new Date().toISOString() } : a
      )
    }));
  }, []);

  const snoozeAlert = useCallback((alertId, snoozeDuration) => {
    const snoozeUntil = new Date(Date.now() + snoozeDuration * 60 * 60 * 1000).toISOString();
    setCustomization(prev => ({
      ...prev,
      activeAlerts: (prev.activeAlerts || []).map(a =>
        a.id === alertId ? { ...a, status: 'snoozed', snoozeUntil } : a
      )
    }));
  }, []);

  const getActiveAlerts = useCallback(() => {
    const now = new Date();
    return (customization.activeAlerts || []).filter(a => {
      if (a.status === 'dismissed') return false;
      if (a.status === 'snoozed' && new Date(a.snoozeUntil) > now) return false;
      return true;
    });
  }, [customization.activeAlerts]);

  const getNotifications = useCallback(() => {
    return customization.notifications || defaultCustomization.notifications;
  }, [customization.notifications]);

  const addReminder = useCallback((category, reminder) => {
    const id = `custom_${Date.now()}`;
    setCustomization(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        [category]: {
          ...prev.notifications[category],
          [id]: {
            ...reminder,
            isCustom: true,
            enabled: true,
            inApp: true,
            email: false,
            advanceHours: 24
          }
        }
      }
    }));
    return id;
  }, []);

  const deleteReminder = useCallback((category, itemKey) => {
    setCustomization(prev => {
      const newCategory = { ...prev.notifications[category] };
      delete newCategory[itemKey];
      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          [category]: newCategory
        }
      };
    });
  }, []);

  const addSmartAlert = useCallback((alert) => {
    const id = `custom_${Date.now()}`;
    setCustomization(prev => ({
      ...prev,
      notifications: {
        ...prev.notifications,
        alerts: {
          ...prev.notifications.alerts,
          [id]: {
            ...alert,
            isCustom: true,
            enabled: true,
            inApp: true,
            email: false
          }
        }
      }
    }));
    return id;
  }, []);

  const deleteSmartAlert = useCallback((alertKey) => {
    setCustomization(prev => {
      const newAlerts = { ...prev.notifications.alerts };
      delete newAlerts[alertKey];
      return {
        ...prev,
        notifications: {
          ...prev.notifications,
          alerts: newAlerts
        }
      };
    });
  }, []);

  // Form schema functions
  const getFormSchema = useCallback((clientId = null) => {
    // Always check customization.formSchema first (this contains data from Supabase)
    // This ensures that saved changes from the database are used
    const schema = customization.formSchema || DEFAULT_FORM_SCHEMA;

    // For new clients without any saved schema, use the minimal schema
    if (clientId && isNewClient(clientId) && !isDemoClient(clientId)) {
      // Only use NEW_CLIENT_FORM_SCHEMA if we don't have customization data
      // and there's no localStorage cache
      if (!customization.formSchema) {
        const clientSchemaKey = `client_form_schema_${clientId}`;
        const savedClientSchema = localStorage.getItem(clientSchemaKey);
        if (savedClientSchema) {
          try {
            return JSON.parse(savedClientSchema);
          } catch (e) {
            console.error('Failed to parse client schema:', e);
          }
        }
        // Return the minimal new client schema only if no saved data exists
        return NEW_CLIENT_FORM_SCHEMA;
      }
    }

    // Ensure sections have linkedTabId from DEFAULT_FORM_SCHEMA
    const sectionsWithLinks = schema.sections.map(section => {
      const defaultSection = DEFAULT_FORM_SCHEMA.sections.find(s => s.id === section.id);
      if (defaultSection?.linkedTabId && !section.linkedTabId) {
        return { ...section, linkedTabId: defaultSection.linkedTabId };
      }
      return section;
    });

    // Only add new default sections if the schema hasn't been customized
    const deletedSections = customization.deletedSectionIds || [];
    const existingSectionIds = new Set(sectionsWithLinks.map(s => s.id));

    const newSections = DEFAULT_FORM_SCHEMA.sections.filter(
      defaultSection =>
        !existingSectionIds.has(defaultSection.id) &&
        !deletedSections.includes(defaultSection.id)
    );

    const allSections = [...sectionsWithLinks, ...newSections];
    return { ...schema, sections: allSections };
  }, [customization.formSchema, customization.deletedSectionIds]);

  const updateFormSchema = useCallback((updates) => {
    setCustomization(prev => ({
      ...prev,
      formSchema: { ...(prev.formSchema || DEFAULT_FORM_SCHEMA), ...updates },
    }));
  }, []);

  const addFormSection = useCallback((section) => {
    setCustomization(prev => {
      const deletedSectionIds = prev.deletedSectionIds || [];
      return {
        ...prev,
        formSchema: addFormSection(prev.formSchema || DEFAULT_FORM_SCHEMA, section),
        deletedSectionIds: deletedSectionIds.filter(id => id !== section.id),
      };
    });
  }, []);

  const removeFormSection = useCallback((sectionId) => {
    setCustomization(prev => {
      const deletedSectionIds = prev.deletedSectionIds || [];
      const updatedDeletedIds = deletedSectionIds.includes(sectionId)
        ? deletedSectionIds
        : [...deletedSectionIds, sectionId];
      return {
        ...prev,
        formSchema: removeFormSection(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId),
        deletedSectionIds: updatedDeletedIds,
      };
    });
  }, []);

  const updateFormSection = useCallback((sectionId, updates) => {
    setCustomization(prev => ({
      ...prev,
      formSchema: updateFormSection(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId, updates),
    }));
  }, []);

  const reorderFormSections = useCallback((newOrder) => {
    setCustomization(prev => ({
      ...prev,
      formSchema: reorderFormSections(prev.formSchema || DEFAULT_FORM_SCHEMA, newOrder),
    }));
  }, []);

  const addFieldToSection = useCallback((sectionId, field) => {
    setCustomization(prev => ({
      ...prev,
      formSchema: addFieldToSection(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId, field),
    }));
  }, []);

  const removeFieldFromSection = useCallback((sectionId, fieldId) => {
    setCustomization(prev => ({
      ...prev,
      formSchema: removeFieldFromSection(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId, fieldId),
    }));
  }, []);

  const updateFormField = useCallback((sectionId, fieldId, updates) => {
    setCustomization(prev => ({
      ...prev,
      formSchema: updateField(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId, fieldId, updates),
    }));
  }, []);

  const reorderFieldsInSection = useCallback((sectionId, newOrder) => {
    setCustomization(prev => ({
      ...prev,
      formSchema: reorderFieldsInSection(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId, newOrder),
    }));
  }, []);

  const addCustomMetric = useCallback((metric) => {
    setCustomization(prev => ({
      ...prev,
      formSchema: addCustomMetric(prev.formSchema || DEFAULT_FORM_SCHEMA, metric),
    }));
  }, []);

  const removeCustomMetric = useCallback((metricId) => {
    setCustomization(prev => ({
      ...prev,
      formSchema: removeCustomMetric(prev.formSchema || DEFAULT_FORM_SCHEMA, metricId),
    }));
  }, []);

  const updateDeletedSectionIds = useCallback((deletedIds) => {
    setCustomization(prev => ({
      ...prev,
      deletedSectionIds: deletedIds,
    }));
  }, []);

  const saveToDatabase = useCallback(async (clientId, customizationOverride = null) => {
    if (!clientId) {
      console.warn('[CustomizationProvider] No clientId provided for saveToDatabase');
      return { success: false, error: 'No client ID provided' };
    }

    setIsSaving(true);

    try {
      const dataToSave = customizationOverride || customizationRef.current;
      const result = await customizationClient.saveToSupabase(clientId, dataToSave);

      setTimeout(() => setIsSaving(false), 500);

      return result;
    } catch (err) {
      setIsSaving(false);
      return { success: false, error: err.message };
    }
  }, []);

  const loadFromDatabase = useCallback(async (clientId) => {
    if (!clientId) {
      console.warn('[CustomizationProvider] No clientId provided for loadFromDatabase');
      return { success: false, error: 'No client ID provided' };
    }
    const result = await customizationClient.loadFromSupabase(clientId);
    if (result.success && result.data) {
      setCustomization(prev => ({
        ...defaultCustomization,
        ...result.data,
        branding: prev.branding,
        navigation: {
          ...defaultCustomization.navigation,
          ...(result.data.navigation || {}),
          tabs: result.data.navigation?.tabs || defaultCustomization.navigation.tabs,
        },
        sectionVisibility: result.data.sectionVisibility || defaultCustomization.sectionVisibility,
        formSchema: result.data.formSchema || DEFAULT_FORM_SCHEMA,
      }));
    } else if (result.success && !result.data) {
      setCustomization(prev => ({
        ...defaultCustomization,
        branding: prev.branding,
        formSchema: DEFAULT_FORM_SCHEMA,
      }));
    }
    return result;
  }, []);

  const saveGlobalBranding = useCallback(async (brandingOverride = null) => {
    setIsSavingBranding(true);
    setBrandingSaveStatus('saving');
    try {
      const branding = brandingOverride || customizationRef.current.branding;
      const result = await customizationClient.saveGlobalBranding(branding);
      setBrandingSaveStatus(result.success ? 'saved' : 'error');
      setTimeout(() => setBrandingSaveStatus('idle'), 2000);
      return result;
    } catch (err) {
      setBrandingSaveStatus('error');
      setTimeout(() => setBrandingSaveStatus('idle'), 2000);
      return { success: false, error: err.message };
    } finally {
      setIsSavingBranding(false);
    }
  }, []);

  const contextValue = useMemo(() => ({
    customization,
    updateBranding,
    updateTab,
    reorderTabs,
    addTab,
    removeTab,
    getTabSectionCount,
    updateWidget,
    reorderWidgets,
    resetToDefaults,
    getEnabledTabs,
    getEnabledWidgets,
    updateNotification,
    updateWorkflow,
    getNotifications,
    addAlert,
    dismissAlert,
    snoozeAlert,
    getActiveAlerts,
    addReminder,
    deleteReminder,
    addSmartAlert,
    deleteSmartAlert,
    getFormSchema,
    updateFormSchema,
    addFormSection,
    removeFormSection,
    updateFormSection,
    reorderFormSections,
    addFieldToSection,
    removeFieldFromSection,
    updateFormField,
    reorderFieldsInSection,
    addCustomMetric,
    removeCustomMetric,
    updateDeletedSectionIds,
    saveToDatabase,
    isSaving,
    loadFromDatabase,
    saveGlobalBranding,
    isSavingBranding,
    brandingSaveStatus,
    FIELD_TYPES,
    VALIDATION_RULES,
    createFieldDef,
    createFormSection,
  }), [
    customization,
    updateBranding,
    updateTab,
    reorderTabs,
    addTab,
    removeTab,
    getTabSectionCount,
    updateWidget,
    reorderWidgets,
    resetToDefaults,
    getEnabledTabs,
    getEnabledWidgets,
    updateNotification,
    updateWorkflow,
    getNotifications,
    addAlert,
    dismissAlert,
    snoozeAlert,
    getActiveAlerts,
    addReminder,
    deleteReminder,
    addSmartAlert,
    deleteSmartAlert,
    getFormSchema,
    updateFormSchema,
    addFormSection,
    removeFormSection,
    updateFormSection,
    reorderFormSections,
    addFieldToSection,
    removeFieldFromSection,
    updateFormField,
    reorderFieldsInSection,
    addCustomMetric,
    removeCustomMetric,
    updateDeletedSectionIds,
    saveToDatabase,
    isSaving,
    loadFromDatabase,
    saveGlobalBranding,
    isSavingBranding,
    brandingSaveStatus,
  ]);

  return (
    <CustomizationContext.Provider value={contextValue}>
      {children}
    </CustomizationContext.Provider>
  );
}

function useCustomization() {
  const context = useContext(CustomizationContext);
  if (!context) {
    throw new Error('useCustomization must be used within a CustomizationProvider');
  }
  return context;
}

const usersDatabase = {
  'admin@prysmcs.com': {
    id: 'user-001',
    email: 'admin@prysmcs.com',
    password: 'Admin123!',
    name: 'Admin',
    role: 'admin',
    phone: '',
    department: 'Operations',
    assignedClients: ['all'],
    lastLogin: null,
    mfaEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  'dataentry@prysmcs.com': {
    id: 'user-002',
    email: 'dataentry@prysmcs.com',
    password: 'DataEntry123!',
    name: 'Data Entry',
    role: 'csm',
    phone: '',
    department: 'Customer Success',
    assignedClients: ['all'],
    lastLogin: null,
    mfaEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString()
  },
  'viewer@prysmcs.com': {
    id: 'user-003',
    email: 'viewer@prysmcs.com',
    password: 'Viewer123!',
    name: 'Viewer',
    role: 'client',
    phone: '',
    department: '',
    assignedClients: ['all'],
    lastLogin: null,
    mfaEnabled: false,
    status: 'active',
    createdAt: new Date().toISOString()
  },
};

// Session configuration (HIPAA recommends 15-30 min timeout)
const SESSION_CONFIG = {
  timeoutMinutes: 15,
  warningMinutes: 2,
  maxFailedAttempts: 5,
  lockoutMinutes: 30
};

// ============================================================
// AUDIT TRAIL SYSTEM
// ============================================================

const AUDIT_ACTIONS = {
  LOGIN: 'LOGIN',
  LOGOUT: 'LOGOUT',
  LOGIN_FAILED: 'LOGIN_FAILED',
  VIEW_PHI: 'VIEW_PHI',
  EDIT_PHI: 'EDIT_PHI',
  EXPORT_DATA: 'EXPORT_DATA',
  CREATE_RECORD: 'CREATE_RECORD',
  DELETE_RECORD: 'DELETE_RECORD',
  ACCESS_DENIED: 'ACCESS_DENIED',
  SESSION_TIMEOUT: 'SESSION_TIMEOUT',
  USER_CREATED: 'USER_CREATED',
  USER_MODIFIED: 'USER_MODIFIED',
  PASSWORD_CHANGED: 'PASSWORD_CHANGED',
  CLIENT_SWITCHED: 'CLIENT_SWITCHED',
  SETTINGS_CHANGE: 'SETTINGS_CHANGE',
  CLIENT_DELETED: 'CLIENT_DELETED',
  CLIENT_RESTORED: 'CLIENT_RESTORED',
  CLIENT_PURGED: 'CLIENT_PURGED'
};

// Audit log storage (now using Supabase database)
async function getAuditLog() {
  try {
    // Try to fetch from Supabase
    const { data, error } = await supabase
      .from('audit_log')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(10000);

    if (error) {
      console.error('[Audit] Error fetching from database:', error);
      // Fallback to localStorage
      return JSON.parse(localStorage.getItem('prysmcs_audit_log') || '[]');
    }

    // Transform to match expected format
    return (data || []).map(entry => ({
      id: entry.id,
      timestamp: entry.timestamp,
      action: entry.action,
      userId: entry.user_id,
      userName: entry.user_name,
      userRole: entry.user_role,
      userEmail: entry.user_email,
      resource: entry.resource,
      clientId: entry.client_id,
      clientName: entry.client_name,
      ipAddress: entry.ip_address,
      userAgent: entry.user_agent,
      details: entry.details
    }));
  } catch (err) {
    console.error('[Audit] Exception fetching audit log:', err);
    // Fallback to localStorage
    try {
      return JSON.parse(localStorage.getItem('prysmcs_audit_log') || '[]');
    } catch {
      return [];
    }
  }
}

function saveAuditLog(log) {
  localStorage.setItem('prysmcs_audit_log', JSON.stringify(log));
}

async function createAuditEntry(action, details, user = null) {
  const entry = {
    timestamp: new Date().toISOString(),
    action,
    user_id: user?.id || 'system',
    user_name: user?.name || 'System',
    user_role: user?.role || 'system',
    user_email: user?.email || 'system',
    resource: details.resource || 'system',
    client_id: details.clientId || null,
    client_name: details.clientName || null,
    ip_address: '192.168.1.xxx', // In production: actual IP
    user_agent: navigator.userAgent,
    details: {
      ...details,
      // Mask sensitive data in logs
      ...(details.patientId && { patientId: `***${details.patientId.slice(-4)}` })
    }
  };

  try {
    // Insert into Supabase database
    const { data, error } = await supabase
      .from('audit_log')
      .insert([entry])
      .select()
      .single();

    if (error) {
      console.error('[Audit] Error saving to database:', error);
      // Fallback to localStorage
      const localEntry = {
        id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        ...entry
      };
      const log = JSON.parse(localStorage.getItem('prysmcs_audit_log') || '[]');
      log.unshift(localEntry);
      if (log.length > 10000) log.length = 10000;
      saveAuditLog(log);
      return localEntry;
    }

    return data;
  } catch (err) {
    console.error('[Audit] Exception creating audit entry:', err);
    // Fallback to localStorage
    const localEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...entry
    };
    const log = JSON.parse(localStorage.getItem('prysmcs_audit_log') || '[]');
    log.unshift(localEntry);
    if (log.length > 10000) log.length = 10000;
    saveAuditLog(log);
    return localEntry;
  }
}

// ============================================================
// AUTHENTICATION CONTEXT
// ============================================================

const AuthContext = createContext(null);

function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

function AuthProvider({ children }) {
  console.log('[PrysmCS] AuthProvider mounting');
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);
  const [failedAttempts, setFailedAttempts] = useState({});

  // Check for existing session on mount - uses DAL authClient
  useEffect(() => {
    const loadSession = async () => {
      try {
        // Use DAL to get session (supports future remote auth)
        const session = await authClient.getSession();
        if (session && new Date(session.expiry) > new Date()) {
          setCurrentUser(session.user);
          setIsAuthenticated(true);
          setSessionExpiry(new Date(session.expiry));
        } else if (session) {
          // Session expired
          handleSessionTimeout();
        }
      } catch (e) {
        console.warn('[Auth] Failed to load session:', e);
        await authClient.logout();
      }
    };
    loadSession();
  }, []);
  
  // Session timeout checker
  useEffect(() => {
    if (!isAuthenticated || !sessionExpiry) return;
    
    const checkSession = setInterval(() => {
      const now = new Date();
      const timeLeft = sessionExpiry - now;
      const warningThreshold = SESSION_CONFIG.warningMinutes * 60 * 1000;
      
      if (timeLeft <= 0) {
        handleSessionTimeout();
      } else if (timeLeft <= warningThreshold && !showTimeoutWarning) {
        setShowTimeoutWarning(true);
      }
    }, 1000);
    
    return () => clearInterval(checkSession);
  }, [isAuthenticated, sessionExpiry, showTimeoutWarning]);
  
  // Activity listener to extend session
  useEffect(() => {
    if (!isAuthenticated) return;
    
    const resetTimer = () => {
      if (isAuthenticated) {
        extendSession();
        setShowTimeoutWarning(false);
      }
    };
    
    window.addEventListener('mousedown', resetTimer);
    window.addEventListener('keydown', resetTimer);
    
    return () => {
      window.removeEventListener('mousedown', resetTimer);
      window.removeEventListener('keydown', resetTimer);
    };
  }, [isAuthenticated]);
  
  const extendSession = async () => {
    const newExpiry = new Date(Date.now() + SESSION_CONFIG.timeoutMinutes * 60 * 1000);
    setSessionExpiry(newExpiry);
    
    if (currentUser) {
      // Use DAL to persist session
      await authClient.saveSession({
        user: currentUser,
        expiry: newExpiry.toISOString()
      });
    }
  };
  
  const handleSessionTimeout = () => {
    createAuditEntry(AUDIT_ACTIONS.SESSION_TIMEOUT, {
      reason: 'Inactivity timeout'
    }, currentUser);
    
    logout();
  };
  
  const login = async (email, password) => {
    const lowerEmail = email.toLowerCase().trim();
    
    // Check for account lockout
    const attempts = failedAttempts[lowerEmail] || { count: 0, lockUntil: null };
    if (attempts.lockUntil && new Date(attempts.lockUntil) > new Date()) {
      const minutesLeft = Math.ceil((new Date(attempts.lockUntil) - new Date()) / 60000);
      createAuditEntry(AUDIT_ACTIONS.LOGIN_FAILED, {
        email: lowerEmail,
        reason: 'Account locked',
        minutesLeft
      });
      return { 
        success: false, 
        error: `Account locked. Try again in ${minutesLeft} minutes.` 
      };
    }
    
    // Check if we should use remote auth via DAL
    if (DAL_CONFIG.features.useRemoteAuth) {
      try {
        const result = await authClient.login({ email: lowerEmail, password });
        if (result.success && result.user) {
          setCurrentUser(result.user);
          setSessionExpiry(new Date(result.expiry));
          setShowTimeoutWarning(false);
          setIsAuthenticated(true);
          return { success: true };
        }
        return result;
      } catch (e) {
        console.warn('[Auth] Remote login failed:', e);
        // Fall through to local auth if offline support is enabled
        if (!DAL_CONFIG.features.offlineSupport) {
          return { success: false, error: 'Authentication service unavailable' };
        }
      }
    }
    
    // Local authentication (current behavior)
    const user = usersDatabase[lowerEmail];
    
    if (!user || user.password !== password) {
      // Track failed attempt
      const newCount = (attempts.count || 0) + 1;
      const newAttempts = { ...failedAttempts };
      
      if (newCount >= SESSION_CONFIG.maxFailedAttempts) {
        newAttempts[lowerEmail] = {
          count: newCount,
          lockUntil: new Date(Date.now() + SESSION_CONFIG.lockoutMinutes * 60 * 1000).toISOString()
        };
      } else {
        newAttempts[lowerEmail] = { count: newCount, lockUntil: null };
      }
      
      setFailedAttempts(newAttempts);
      
      createAuditEntry(AUDIT_ACTIONS.LOGIN_FAILED, {
        email: lowerEmail,
        reason: 'Invalid credentials',
        attemptNumber: newCount
      });
      
      return { 
        success: false, 
        error: `Invalid email or password. ${SESSION_CONFIG.maxFailedAttempts - newCount} attempts remaining.`
      };
    }
    
    if (user.status !== 'active') {
      createAuditEntry(AUDIT_ACTIONS.LOGIN_FAILED, {
        email: lowerEmail,
        reason: 'Account inactive'
      });
      return { success: false, error: 'Account is inactive. Contact administrator.' };
    }
    
    // Successful login
    const sessionUser = { ...user };
    delete sessionUser.password; // Never store password in session
    
    const expiry = new Date(Date.now() + SESSION_CONFIG.timeoutMinutes * 60 * 1000);
    
    // Clear failed attempts
    const newAttempts = { ...failedAttempts };
    delete newAttempts[lowerEmail];
    setFailedAttempts(newAttempts);
    
    // Save session via DAL
    await authClient.saveSession({
      user: sessionUser,
      expiry: expiry.toISOString()
    });
    
    // Update last login
    usersDatabase[lowerEmail].lastLogin = new Date().toISOString();
    
    createAuditEntry(AUDIT_ACTIONS.LOGIN, {
      email: lowerEmail,
      role: user.role
    }, sessionUser);
    
    // Update state last to trigger re-render
    setCurrentUser(sessionUser);
    setSessionExpiry(expiry);
    setShowTimeoutWarning(false);
    setIsAuthenticated(true);
    
    return { success: true };
  };
  
  const logout = async () => {
    if (currentUser) {
      createAuditEntry(AUDIT_ACTIONS.LOGOUT, {}, currentUser);
    }
    
    setCurrentUser(null);
    setIsAuthenticated(false);
    setSessionExpiry(null);
    setShowTimeoutWarning(false);
    
    // Use DAL to clear session
    await authClient.logout();
  };
  
  const hasPermission = (permission) => {
    if (!currentUser) return false;
    const role = ROLES[currentUser.role];
    return role?.permissions.includes(permission) || false;
  };
  
  const canAccessClient = (clientId) => {
    if (!currentUser) return false;
    if (currentUser.assignedClients.includes('all')) return true;
    return currentUser.assignedClients.includes(clientId);
  };
  
  const logPHIAccess = (action, details) => {
    createAuditEntry(action, details, currentUser);
  };
  
  return (
    <AuthContext.Provider value={{
      currentUser,
      isAuthenticated,
      sessionExpiry,
      showTimeoutWarning,
      login,
      logout,
      hasPermission,
      canAccessClient,
      extendSession,
      logPHIAccess,
      ROLES
    }}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// LOGIN COMPONENT
// ============================================================

function LoginPage({ onLogin }) {
  console.log('[PrysmCS] LoginPage rendering');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { customization } = useCustomization();
  const branding = customization.branding;

  const handleSubmit = async (email, password) => {
    setError('');
    setIsLoading(true);
    try {
      const result = await login(email, password);
      setIsLoading(false);
      if (!result.success) {
        setError(result.error);
      }
    } catch (err) {
      setIsLoading(false);
      setError('An error occurred. Please try again.');
    }
  };

  const handleQuickLogin = async (demoEmail, demoPassword) => {
    setError('');
    setIsLoading(true);
    setTimeout(async () => {
      try {
        const result = await login(demoEmail, demoPassword);
        setIsLoading(false);
        if (!result.success) {
          setError(result.error);
        }
      } catch (err) {
        setIsLoading(false);
        setError('An error occurred. Please try again.');
      }
    }, 300);
  };

  return (
    <SignInCard
      branding={branding}
      onSubmit={handleSubmit}
      onQuickLogin={handleQuickLogin}
      isLoading={isLoading}
      error={error}
    />
  );
}

// ============================================================
// SESSION TIMEOUT WARNING
// ============================================================

function SessionTimeoutWarning() {
  const { showTimeoutWarning, extendSession, logout, sessionExpiry } = useAuth();
  const { customization } = useCustomization();
  const [timeLeft, setTimeLeft] = useState(0);

  useEffect(() => {
    if (!showTimeoutWarning || !sessionExpiry) return;

    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((sessionExpiry - new Date()) / 1000));
      setTimeLeft(remaining);
    }, 1000);

    return () => clearInterval(timer);
  }, [showTimeoutWarning, sessionExpiry]);

  if (!showTimeoutWarning) return null;

  const brandColor = customization.branding.primaryColor;
  const accentColor = customization.branding.accentColor || '#f59e0b';

  return (
    <div className="session-timeout-overlay">
      <div className="session-timeout-modal">
        <AlertTriangle size={48} className="timeout-icon" style={{ color: accentColor }} />
        <h2>Session Expiring</h2>
        <p>Your session will expire in <strong>{timeLeft}</strong> seconds due to inactivity.</p>
        <p className="timeout-reason">For security, sessions timeout after {SESSION_CONFIG.timeoutMinutes} minutes of inactivity.</p>
        <div className="timeout-actions">
          <button type="button" onClick={extendSession} className="timeout-continue" style={{ background: brandColor }}>
            Continue Working
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// AUDIT LOG VIEWER (Admin Only)
// ============================================================

function AuditLogPage() {
  const { hasPermission, currentUser, logPHIAccess } = useAuth();
  const [auditLog, setAuditLog] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState({ action: '', user: '', dateFrom: '', dateTo: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;

  useEffect(() => {
    const loadAuditLog = async () => {
      if (hasPermission('view_audit_log')) {
        try {
          setIsLoading(true);
          const log = await getAuditLog();
          setAuditLog(log);
          logPHIAccess(AUDIT_ACTIONS.VIEW_PHI, {
            resource: 'audit_log',
            action: 'viewed_audit_log'
          });
        } catch (error) {
          console.error('Error loading audit log:', error);
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadAuditLog();
  }, []);

  if (!hasPermission('view_audit_log')) {
    return (
      <div className="access-denied">
        <Lock size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to view the audit log.</p>
      </div>
    );
  }

  const filteredLog = auditLog.filter(entry => {
    if (filter.action && entry.action !== filter.action) return false;
    if (filter.user && !entry.userName.toLowerCase().includes(filter.user.toLowerCase())) return false;
    if (filter.dateFrom && new Date(entry.timestamp) < new Date(filter.dateFrom)) return false;
    if (filter.dateTo && new Date(entry.timestamp) > new Date(filter.dateTo + 'T23:59:59')) return false;
    return true;
  });

  const totalPages = Math.ceil(filteredLog.length / itemsPerPage);
  const paginatedLog = filteredLog.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const getActionColor = (action) => {
    if (action === 'CLIENT_DELETED') return '#dc2626';
    if (action === 'CLIENT_RESTORED') return '#16a34a';
    if (action === 'CLIENT_PURGED') return '#991b1b';
    if (action.includes('FAILED') || action.includes('DENIED')) return '#ef4444';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return '#3b82f6';
    if (action.includes('EDIT') || action.includes('CREATE') || action.includes('DELETE')) return '#f59e0b';
    if (action.includes('VIEW') || action.includes('EXPORT')) return '#10b981';
    return '#6b7280';
  };

  const formatDetails = (action, details) => {
    if (!details) return '-';

    if (action === 'CLIENT_DELETED') {
      return details.deletion_reason || 'No reason provided';
    }
    if (action === 'CLIENT_RESTORED') {
      const parts = [];
      if (details.restoration_reason) parts.push(`Restored: ${details.restoration_reason}`);
      if (details.original_deletion_reason) parts.push(`Originally deleted: ${details.original_deletion_reason}`);
      if (details.days_in_deleted_state) parts.push(`(${details.days_in_deleted_state} days deleted)`);
      return parts.join(' | ') || 'No reason provided';
    }
    if (action === 'CLIENT_PURGED') {
      const parts = [];
      parts.push(`Type: ${details.purge_type || 'unknown'}`);
      if (details.purge_reason) parts.push(`Reason: ${details.purge_reason}`);
      if (details.record_counts) {
        const total = Object.values(details.record_counts).reduce((sum, count) => sum + count, 0);
        parts.push(`(${total} records deleted)`);
      }
      return parts.join(' | ');
    }

    const str = JSON.stringify(details);
    return str.length > 100 ? str.substring(0, 100) + '...' : str;
  };

  const exportToCSV = () => {
    const headers = ['Timestamp', 'Action', 'User', 'Role', 'Client', 'Details'];
    const rows = filteredLog.map(entry => [
      new Date(entry.timestamp).toLocaleString(),
      entry.action.replace(/_/g, ' '),
      entry.userName,
      entry.userRole,
      entry.clientName || '-',
      formatDetails(entry.action, entry.details).replace(/"/g, '""')
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-trail-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="audit-log-page">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1 className="page-title">
            <ClipboardList size={28} />
            Audit Trail
          </h1>
          <p className="page-subtitle">HIPAA-compliant activity logging • {filteredLog.length} entries</p>
        </div>
        <button
          onClick={exportToCSV}
          disabled={filteredLog.length === 0}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 16px',
            background: '#3b82f6',
            color: 'white',
            border: 'none',
            borderRadius: '6px',
            cursor: filteredLog.length === 0 ? 'not-allowed' : 'pointer',
            opacity: filteredLog.length === 0 ? 0.5 : 1,
            fontSize: '14px',
            fontWeight: '500'
          }}
          title="Export to CSV"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <div className="audit-filters">
        <div className="audit-filter">
          <label>Action Type</label>
          <select value={filter.action} onChange={(e) => setFilter({...filter, action: e.target.value})}>
            <option value="">All Actions</option>
            {Object.values(AUDIT_ACTIONS).map(action => (
              <option key={action} value={action}>{action.replace(/_/g, ' ')}</option>
            ))}
          </select>
        </div>
        <div className="audit-filter">
          <label>User</label>
          <input
            type="text"
            placeholder="Search by name..."
            value={filter.user}
            onChange={(e) => setFilter({...filter, user: e.target.value})}
          />
        </div>
        <div className="audit-filter">
          <label>From Date</label>
          <input
            type="date"
            value={filter.dateFrom}
            onChange={(e) => setFilter({...filter, dateFrom: e.target.value})}
          />
        </div>
        <div className="audit-filter">
          <label>To Date</label>
          <input
            type="date"
            value={filter.dateTo}
            onChange={(e) => setFilter({...filter, dateTo: e.target.value})}
          />
        </div>
        <button
          className="audit-clear-filters"
          onClick={() => setFilter({ action: '', user: '', dateFrom: '', dateTo: '' })}
        >
          Clear Filters
        </button>
      </div>

      {isLoading ? (
        <div style={{ textAlign: 'center', padding: '40px' }}>
          <div style={{ display: 'inline-block', width: '32px', height: '32px', border: '3px solid #e5e7eb', borderTop: '3px solid #3b82f6', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
          <p style={{ marginTop: '16px', color: '#6b7280' }}>Loading audit trail...</p>
        </div>
      ) : (
        <>
          <div className="audit-table-container">
            <table className="audit-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>Client</th>
                  <th>User</th>
                  <th>Role</th>
                  <th>Details</th>
                </tr>
              </thead>
              <tbody>
                {paginatedLog.map(entry => (
                  <tr key={entry.id}>
                    <td className="audit-timestamp">
                      {new Date(entry.timestamp).toLocaleString()}
                    </td>
                    <td>
                      <span
                        className="audit-action-badge"
                        style={{ backgroundColor: getActionColor(entry.action) }}
                      >
                        {entry.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td>{entry.clientName || '-'}</td>
                    <td>{entry.userName}</td>
                    <td className="audit-role">{entry.userRole}</td>
                    <td className="audit-details">
                      {formatDetails(entry.action, entry.details)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="audit-pagination">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
              >
                Previous
              </button>
              <span>Page {currentPage} of {totalPages}</span>
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ============================================================
// USER MANAGEMENT (Admin Only)
// ============================================================

function UserManagementPage({ setActivePage }) {
  const { hasPermission, currentUser, logPHIAccess } = useAuth();
  const [users, setUsers] = useState(Object.values(usersDatabase).map(u => ({ ...u, password: '••••••••' })));
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createForm, setCreateForm] = useState({
    name: '',
    email: '',
    phone: '',
    department: '',
    role: 'client',
    status: 'active',
    assignedClients: [],
    password: '',
    confirmPassword: ''
  });
  const [createError, setCreateError] = useState('');
  
  // Delete confirmation state
  const [deleteConfirmUser, setDeleteConfirmUser] = useState(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteError, setDeleteError] = useState('');
  
  // Check if current user is admin (has full permissions) or CSM (limited)
  const isAdmin = currentUser?.role === 'admin';
  
  useEffect(() => {
    if (hasPermission('manage_users')) {
      logPHIAccess(AUDIT_ACTIONS.VIEW_PHI, { 
        resource: 'user_management',
        action: 'viewed_users_list'
      });
    }
  }, []);
  
  // Check if current user can edit a specific user
  const canEditUser = (targetUser) => {
    // Admins can edit anyone
    if (isAdmin) return true;
    // CSMs cannot edit admins
    if (targetUser.role === 'admin') return false;
    // CSMs can edit other users (clients, other CSMs)
    return true;
  };
  
  // Check if this is the current user's own account
  const isOwnAccount = (user) => user.email === currentUser?.email;
  
  const handleEditClick = (user) => {
    // If it's their own account, go to profile page
    if (isOwnAccount(user)) {
      setActivePage('profile');
      return;
    }
    // Otherwise open inline edit
    setEditingUser(user.id);
    setEditForm({
      name: user.name,
      email: user.email,
      phone: user.phone || '',
      department: user.department || '',
      role: user.role,
      status: user.status,
      assignedClients: user.assignedClients,
    });
  };
  
  const handleSaveEdit = (userId) => {
    setUsers(prev => prev.map(u => 
      u.id === userId ? { ...u, ...editForm } : u
    ));
    setEditingUser(null);
    logPHIAccess(AUDIT_ACTIONS.USER_MODIFIED, {
      resource: 'user_management',
      action: 'updated_user',
      targetUserId: userId
    });
  };
  
  const handleCancelEdit = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleCreateUser = () => {
    setCreateError('');
    
    // Validation
    if (!createForm.name.trim()) {
      setCreateError('Name is required');
      return;
    }
    if (!createForm.email.trim()) {
      setCreateError('Email is required');
      return;
    }
    if (!createForm.email.includes('@')) {
      setCreateError('Please enter a valid email address');
      return;
    }
    if (users.some(u => u.email.toLowerCase() === createForm.email.toLowerCase())) {
      setCreateError('A user with this email already exists');
      return;
    }
    if (!createForm.password || createForm.password.length < 6) {
      setCreateError('Password must be at least 6 characters');
      return;
    }
    if (createForm.password !== createForm.confirmPassword) {
      setCreateError('Passwords do not match');
      return;
    }
    
    // CSMs cannot create admin accounts
    if (!isAdmin && createForm.role === 'admin') {
      setCreateError('You do not have permission to create admin accounts');
      return;
    }
    
    // Create new user
    const newUser = {
      id: `user-${Date.now()}`,
      name: createForm.name.trim(),
      email: createForm.email.trim().toLowerCase(),
      phone: createForm.phone.trim(),
      department: createForm.department.trim(),
      role: createForm.role,
      status: createForm.status,
      assignedClients: createForm.assignedClients,
      password: '••••••••',
      mfaEnabled: false,
      createdAt: new Date().toISOString()
    };
    
    setUsers(prev => [...prev, newUser]);
    setShowCreateModal(false);
    setCreateForm({
      name: '',
      email: '',
      phone: '',
      department: '',
      role: 'client',
      status: 'active',
      assignedClients: [],
      password: '',
      confirmPassword: ''
    });
    
    logPHIAccess(AUDIT_ACTIONS.USER_CREATED, {
      resource: 'user_management',
      action: 'created_user',
      newUserEmail: newUser.email,
      newUserRole: newUser.role
    });
  };
  
  const handleDeleteUser = (user) => {
    // Check if user is admin or CSM - require "DELETE" confirmation
    if (user.role === 'admin' || user.role === 'csm') {
      if (deleteConfirmText !== 'DELETE') {
        setDeleteError('Please type DELETE to confirm');
        return;
      }
    }
    
    // Cannot delete yourself
    if (isOwnAccount(user)) {
      setDeleteError('You cannot delete your own account');
      return;
    }
    
    // CSMs cannot delete admins
    if (!isAdmin && user.role === 'admin') {
      setDeleteError('You do not have permission to delete admin accounts');
      return;
    }
    
    // Delete the user
    setUsers(prev => prev.filter(u => u.id !== user.id));
    setDeleteConfirmUser(null);
    setDeleteConfirmText('');
    setDeleteError('');
    
    logPHIAccess(AUDIT_ACTIONS.DELETE_RECORD, {
      resource: 'user_management',
      action: 'deleted_user',
      deletedUserId: user.id,
      deletedUserEmail: user.email,
      deletedUserRole: user.role
    });
  };
  
  const openDeleteConfirm = (user) => {
    setDeleteConfirmUser(user);
    setDeleteConfirmText('');
    setDeleteError('');
  };
  
  if (!hasPermission('manage_users')) {
    return (
      <div className="access-denied">
        <Lock size={48} />
        <h2>Access Denied</h2>
        <p>You do not have permission to manage users.</p>
      </div>
    );
  }
  
  return (
    <div className="user-management-page">
      {/* Create User Modal */}
      {showCreateModal && (
        <div className="modal-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3><Plus size={20} /> Create New Account</h3>
              <button className="modal-close" onClick={() => setShowCreateModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div className="create-user-form">
              {createError && (
                <div className="form-error" style={{
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '10px 14px',
                  borderRadius: '8px',
                  marginBottom: '16px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  {createError}
                </div>
              )}
              
              <div className="form-row">
                <div className="form-group">
                  <label>Full Name *</label>
                  <input 
                    type="text" 
                    value={createForm.name}
                    onChange={(e) => setCreateForm({...createForm, name: e.target.value})}
                    placeholder="John Smith"
                  />
                </div>
                <div className="form-group">
                  <label>Email Address *</label>
                  <input 
                    type="email" 
                    value={createForm.email}
                    onChange={(e) => setCreateForm({...createForm, email: e.target.value})}
                    placeholder="john@example.com"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Phone Number</label>
                  <input 
                    type="tel" 
                    value={createForm.phone}
                    onChange={(e) => setCreateForm({...createForm, phone: e.target.value})}
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div className="form-group">
                  <label>Department</label>
                  <input 
                    type="text" 
                    value={createForm.department}
                    onChange={(e) => setCreateForm({...createForm, department: e.target.value})}
                    placeholder="Customer Success"
                  />
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Role *</label>
                  <select 
                    value={createForm.role}
                    onChange={(e) => setCreateForm({...createForm, role: e.target.value})}
                  >
                    {isAdmin && <option value="admin">Administrator</option>}
                    <option value="csm">CSM (Customer Success Manager)</option>
                    <option value="client">Client</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select 
                    value={createForm.status}
                    onChange={(e) => setCreateForm({...createForm, status: e.target.value})}
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="pending">Pending</option>
                  </select>
                </div>
              </div>
              
              <div className="form-row">
                <div className="form-group">
                  <label>Password *</label>
                  <input 
                    type="password" 
                    value={createForm.password}
                    onChange={(e) => setCreateForm({...createForm, password: e.target.value})}
                    placeholder="Minimum 6 characters"
                  />
                </div>
                <div className="form-group">
                  <label>Confirm Password *</label>
                  <input 
                    type="password" 
                    value={createForm.confirmPassword}
                    onChange={(e) => setCreateForm({...createForm, confirmPassword: e.target.value})}
                    placeholder="Re-enter password"
                  />
                </div>
              </div>
              
              {(createForm.role === 'client' || createForm.role === 'csm') && (
                <div className="form-group" style={{ marginTop: '8px' }}>
                  <label>Assigned Clients</label>
                  <div className="client-checkboxes" style={{ 
                    display: 'flex', 
                    flexWrap: 'wrap', 
                    gap: '12px',
                    marginTop: '8px'
                  }}>
                    {clientsList.map(client => (
                      <label key={client.id} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '6px',
                        fontSize: '13px',
                        cursor: 'pointer'
                      }}>
                        <input
                          type="checkbox"
                          checked={createForm.assignedClients.includes(client.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setCreateForm({...createForm, assignedClients: [...createForm.assignedClients, client.id]});
                            } else {
                              setCreateForm({...createForm, assignedClients: createForm.assignedClients.filter(id => id !== client.id)});
                            }
                          }}
                        />
                        {client.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowCreateModal(false)}>
                Cancel
              </button>
              <button className="btn-primary" onClick={handleCreateUser}>
                <Plus size={16} />
                Create Account
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Delete Confirmation Modal */}
      {deleteConfirmUser && (
        <div className="modal-overlay" onClick={() => setDeleteConfirmUser(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#dc2626' }}><Trash2 size={20} /> Delete User Account</h3>
              <button className="modal-close" onClick={() => setDeleteConfirmUser(null)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '20px 0' }}>
              <p style={{ marginBottom: '16px', color: '#64748b' }}>
                You are about to delete the account for:
              </p>
              <div style={{ 
                background: '#fef2f2', 
                border: '1px solid #fecaca', 
                borderRadius: '8px', 
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
                  {deleteConfirmUser.name}
                </div>
                <div style={{ fontSize: '14px', color: '#64748b' }}>
                  {deleteConfirmUser.email}
                </div>
                <div style={{ 
                  display: 'inline-block',
                  marginTop: '8px',
                  padding: '4px 8px', 
                  borderRadius: '4px',
                  fontSize: '12px',
                  fontWeight: '600',
                  background: deleteConfirmUser.role === 'admin' ? '#fee2e2' : 
                              deleteConfirmUser.role === 'csm' ? '#fef3c7' : '#e0f2fe',
                  color: deleteConfirmUser.role === 'admin' ? '#dc2626' : 
                         deleteConfirmUser.role === 'csm' ? '#d97706' : '#0284c7'
                }}>
                  {deleteConfirmUser.role.toUpperCase()}
                </div>
              </div>
              
              {(deleteConfirmUser.role === 'admin' || deleteConfirmUser.role === 'csm') ? (
                <>
                  <p style={{ marginBottom: '12px', fontWeight: '500', color: '#dc2626' }}>
                    ⚠️ This is an {deleteConfirmUser.role === 'admin' ? 'Administrator' : 'CSM'} account. 
                    Type <strong>DELETE</strong> to confirm:
                  </p>
                  <input 
                    type="text"
                    value={deleteConfirmText}
                    onChange={(e) => setDeleteConfirmText(e.target.value)}
                    placeholder="Type DELETE to confirm"
                    style={{
                      width: '100%',
                      padding: '12px',
                      border: '2px solid #fecaca',
                      borderRadius: '8px',
                      fontSize: '14px',
                      fontWeight: '600',
                      textTransform: 'uppercase',
                      letterSpacing: '2px'
                    }}
                  />
                </>
              ) : (
                <p style={{ color: '#64748b' }}>
                  This action cannot be undone. The user will lose access to the system immediately.
                </p>
              )}
              
              {deleteError && (
                <div style={{
                  marginTop: '12px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  color: '#dc2626',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  {deleteError}
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setDeleteConfirmUser(null)}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                style={{ background: '#dc2626' }}
                onClick={() => handleDeleteUser(deleteConfirmUser)}
              >
                <Trash2 size={16} />
                Delete Account
              </button>
            </div>
          </div>
        </div>
      )}
      
      <div className="page-header">
        <h1 className="page-title">
          <UserCheck size={28} />
          User Management
        </h1>
        <p className="page-subtitle">Manage user accounts and access permissions</p>
      </div>
      
      {!isAdmin && (
        <div className="csm-notice" style={{
          background: '#fef3c7',
          border: '1px solid #fcd34d',
          borderRadius: '8px',
          padding: '12px 16px',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px',
          color: '#92400e'
        }}>
          <AlertTriangle size={18} />
          <span>As a CSM, you can manage client and team member accounts, but cannot modify administrator accounts.</span>
        </div>
      )}
      
      <div style={{ marginBottom: '20px' }}>
        <button 
          className="add-item-btn"
          style={{ padding: '10px 20px', fontSize: '14px' }}
          onClick={() => setShowCreateModal(true)}
        >
          <Plus size={16} style={{ marginRight: '6px' }} />
          Create New Account
        </button>
      </div>
      
      <div className="users-grid">
        {users.map(user => {
          const canEdit = canEditUser(user);
          const isEditing = editingUser === user.id;
          const isSelf = isOwnAccount(user);
          
          return (
          <div key={user.id} className={`user-card ${!canEdit ? 'restricted' : ''} ${isSelf ? 'own-account' : ''}`} style={!canEdit ? { opacity: 0.7 } : {}}>
            {isSelf && (
              <div className="own-account-badge">Your Account</div>
            )}
            <div className="user-card-header">
              <div className="user-avatar">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="user-info">
                <h3>{user.name}</h3>
                <p>{user.email}</p>
              </div>
              <span className={`user-status ${user.status}`}>
                {user.status}
              </span>
            </div>
            
            {isEditing ? (
              <div className="user-card-edit-form">
                <div className="edit-form-grid">
                  <div className="form-group">
                    <label className="form-label">Name</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.name}
                      onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Email</label>
                    <input 
                      type="email" 
                      className="form-input" 
                      value={editForm.email}
                      onChange={(e) => setEditForm({...editForm, email: e.target.value})}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Phone</label>
                    <input 
                      type="tel" 
                      className="form-input" 
                      value={editForm.phone}
                      onChange={(e) => setEditForm({...editForm, phone: e.target.value})}
                      placeholder="(555) 555-5555"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Department</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      value={editForm.department}
                      onChange={(e) => setEditForm({...editForm, department: e.target.value})}
                      placeholder="e.g., Customer Success"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Role</label>
                    <select 
                      className="form-input"
                      value={editForm.role}
                      onChange={(e) => setEditForm({...editForm, role: e.target.value})}
                      disabled={!isAdmin}
                    >
                      {Object.keys(ROLES).map(role => (
                        <option key={role} value={role}>{ROLES[role].name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Status</label>
                    <select 
                      className="form-input"
                      value={editForm.status}
                      onChange={(e) => setEditForm({...editForm, status: e.target.value})}
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
                <div className="edit-form-actions">
                  <button className="user-action-btn cancel" onClick={handleCancelEdit}>Cancel</button>
                  <button className="user-action-btn save" onClick={() => handleSaveEdit(user.id)}>Save</button>
                </div>
              </div>
            ) : (
              <>
                <div className="user-card-body">
                  <div className="user-detail">
                    <span className="detail-label">Role:</span>
                    <span className={`role-badge role-${user.role}`}>
                      {ROLES[user.role]?.name}
                    </span>
                  </div>
                  <div className="user-detail">
                    <span className="detail-label">Phone:</span>
                    <span>{user.phone || 'Not set'}</span>
                  </div>
                  <div className="user-detail">
                    <span className="detail-label">Department:</span>
                    <span>{user.department || 'Not set'}</span>
                  </div>
                  <div className="user-detail">
                    <span className="detail-label">MFA:</span>
                    <span>{user.mfaEnabled ? '✓ Enabled' : '✗ Disabled'}</span>
                  </div>
                  <div className="user-detail">
                    <span className="detail-label">Assigned Clients:</span>
                    <span>{user.assignedClients.includes('all') ? 'All Clients' : user.assignedClients.length}</span>
                  </div>
                  <div className="user-detail">
                    <span className="detail-label">Last Login:</span>
                    <span>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</span>
                  </div>
                </div>
                <div className="user-card-actions">
                  {canEdit || isSelf ? (
                    <>
                      <button 
                        className="user-action-btn edit" 
                        onClick={() => handleEditClick(user)}
                      >
                        {isSelf ? 'Edit My Profile' : 'Edit'}
                      </button>
                      {!isSelf && (
                        <>
                          <button className="user-action-btn reset">Reset Password</button>
                          {user.status === 'active' ? (
                            <button className="user-action-btn deactivate">Deactivate</button>
                          ) : (
                            <button className="user-action-btn activate">Activate</button>
                          )}
                          <button 
                            className="user-action-btn delete"
                            onClick={() => openDeleteConfirm(user)}
                          >
                            Delete
                          </button>
                        </>
                      )}
                    </>
                  ) : (
                    <span style={{ fontSize: '12px', color: '#94a3b8', fontStyle: 'italic' }}>
                      Admin accounts can only be managed by other admins
                    </span>
                  )}
                </div>
              </>
            )}
            </div>
        );})}
      </div>
      
      <div className="role-permissions-section">
        <h2>Role Permissions Matrix</h2>
        <table className="permissions-table">
          <thead>
            <tr>
              <th>Permission</th>
              {Object.keys(ROLES).map(role => (
                <th key={role}>{ROLES[role].name}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...new Set(Object.values(ROLES).flatMap(r => r.permissions))].sort().map(perm => (
              <tr key={perm}>
                <td>{perm.replace(/_/g, ' ')}</td>
                {Object.keys(ROLES).map(role => (
                  <td key={role} className="perm-cell">
                    {ROLES[role].permissions.includes(perm) ? '✓' : '–'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================================
// PROFILE PAGE
// ============================================================

function ProfilePage() {
  const { currentUser, logPHIAccess } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [formData, setFormData] = useState({
    name: currentUser?.name || '',
    email: currentUser?.email || '',
    phone: currentUser?.phone || '',
    department: currentUser?.department || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordError, setPasswordError] = useState('');
  
  useEffect(() => {
    logPHIAccess(AUDIT_ACTIONS.VIEW_PHI, { 
      resource: 'profile',
      action: 'viewed_own_profile'
    });
  }, []);
  
  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (field.includes('Password')) {
      setPasswordError('');
    }
  };
  
  const handleSave = () => {
    // Validate password change if attempted
    if (formData.newPassword) {
      if (formData.newPassword !== formData.confirmPassword) {
        setPasswordError('New passwords do not match');
        return;
      }
      if (formData.newPassword.length < 8) {
        setPasswordError('Password must be at least 8 characters');
        return;
      }
      if (!formData.currentPassword) {
        setPasswordError('Please enter your current password');
        return;
      }
    }
    
    // In production, this would call an API
    // For demo, just show success
    logPHIAccess(AUDIT_ACTIONS.USER_MODIFIED, {
      resource: 'profile',
      action: 'updated_own_profile',
      fieldsChanged: Object.keys(formData).filter(k => !k.includes('Password'))
    });
    
    setIsEditing(false);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
    
    // Clear password fields
    setFormData(prev => ({
      ...prev,
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    }));
  };
  
  if (!currentUser) return null;
  
  return (
    <div className="profile-page">
      <div className="page-header">
        <h1 className="page-title">
          <UserCheck size={28} />
          My Profile
        </h1>
        <p className="page-subtitle">View and edit your account information</p>
      </div>
      
      <div className="profile-content">
        <div className="profile-card">
          <div className="profile-header">
            <div className="profile-avatar">
              {currentUser.name.split(' ').map(n => n[0]).join('')}
            </div>
            <div className="profile-header-info">
              <h2>{currentUser.name}</h2>
              <span className={`role-badge role-${currentUser.role}`}>
                {ROLES[currentUser.role]?.name}
              </span>
            </div>
            {!isEditing && (
              <button className="profile-edit-btn" onClick={() => setIsEditing(true)}>
                Edit Profile
              </button>
            )}
          </div>
          
          <div className="profile-body">
            {isEditing ? (
              <div className="profile-form">
                <div className="profile-section">
                  <h3>Personal Information</h3>
                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label className="form-label">Full Name</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={formData.name}
                        onChange={(e) => handleChange('name', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Email Address</label>
                      <input 
                        type="email" 
                        className="form-input" 
                        value={formData.email}
                        onChange={(e) => handleChange('email', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input 
                        type="tel" 
                        className="form-input" 
                        value={formData.phone}
                        onChange={(e) => handleChange('phone', e.target.value)}
                        placeholder="(555) 555-5555"
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Department</label>
                      <input 
                        type="text" 
                        className="form-input" 
                        value={formData.department}
                        onChange={(e) => handleChange('department', e.target.value)}
                        placeholder="e.g., Customer Success"
                      />
                    </div>
                  </div>
                </div>
                
                <div className="profile-section">
                  <h3>Change Password</h3>
                  <p className="profile-section-hint">Leave blank to keep your current password</p>
                  {passwordError && (
                    <div className="profile-error">
                      <AlertTriangle size={16} />
                      {passwordError}
                    </div>
                  )}
                  <div className="profile-form-grid">
                    <div className="form-group">
                      <label className="form-label">Current Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={formData.currentPassword}
                        onChange={(e) => handleChange('currentPassword', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={formData.newPassword}
                        onChange={(e) => handleChange('newPassword', e.target.value)}
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm New Password</label>
                      <input 
                        type="password" 
                        className="form-input" 
                        value={formData.confirmPassword}
                        onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
                
                <div className="profile-actions">
                  <button className="profile-cancel-btn" onClick={() => {
                    setIsEditing(false);
                    setFormData({
                      name: currentUser.name,
                      email: currentUser.email,
                      phone: currentUser.phone || '',
                      currentPassword: '',
                      newPassword: '',
                      confirmPassword: '',
                    });
                    setPasswordError('');
                  }}>
                    Cancel
                  </button>
                  <button className="profile-save-btn" onClick={handleSave}>
                    Save Changes
                  </button>
                </div>
              </div>
            ) : (
              <div className="profile-details">
                <div className="profile-detail-row">
                  <span className="profile-label">Email</span>
                  <span className="profile-value">{currentUser.email}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-label">Phone</span>
                  <span className="profile-value">{currentUser.phone || 'Not set'}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-label">Department</span>
                  <span className="profile-value">{currentUser.department || 'Not set'}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-label">Role</span>
                  <span className="profile-value">{ROLES[currentUser.role]?.name}</span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-label">MFA Status</span>
                  <span className="profile-value">
                    {currentUser.mfaEnabled ? (
                      <span style={{ color: '#059669' }}>✓ Enabled</span>
                    ) : (
                      <span style={{ color: '#dc2626' }}>✗ Not Enabled</span>
                    )}
                  </span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-label">Assigned Clients</span>
                  <span className="profile-value">
                    {currentUser.assignedClients.includes('all') 
                      ? 'All Clients' 
                      : `${currentUser.assignedClients.length} client(s)`}
                  </span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-label">Account Created</span>
                  <span className="profile-value">
                    {currentUser.createdAt 
                      ? new Date(currentUser.createdAt).toLocaleDateString() 
                      : 'Unknown'}
                  </span>
                </div>
                <div className="profile-detail-row">
                  <span className="profile-label">Last Login</span>
                  <span className="profile-value">
                    {currentUser.lastLogin 
                      ? new Date(currentUser.lastLogin).toLocaleString() 
                      : 'This session'}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="profile-security-card">
          <h3>Security Settings</h3>
          <div className="security-item">
            <div className="security-info">
              <h4>Two-Factor Authentication</h4>
              <p>Add an extra layer of security to your account</p>
            </div>
            <button className="security-btn">
              {currentUser.mfaEnabled ? 'Manage' : 'Enable'}
            </button>
          </div>
          <div className="security-item">
            <div className="security-info">
              <h4>Active Sessions</h4>
              <p>Manage devices where you're logged in</p>
            </div>
            <button className="security-btn">View</button>
          </div>
        </div>
      </div>
      
      {showToast && (
        <div className="data-saved-toast">
          Profile updated successfully
        </div>
      )}
    </div>
  );
}

// ============================================================
// ACCESS CONTROL WRAPPER
// ============================================================

function ProtectedContent({ permission, children, fallback = null }) {
  const { hasPermission } = useAuth();
  
  if (!hasPermission(permission)) {
    return fallback || (
      <div className="access-denied-inline">
        <Lock size={16} />
        <span>Access restricted</span>
      </div>
    );
  }
  
  return children;
}

// ============================================================
// PORTFOLIO ANALYTICS PAGE (Admin Only)
// ============================================================

const csmTeamData = [];

// Generate AI insights based on team data
function generateAIInsights(teamData) {
  if (!teamData || teamData.length === 0) {
    return {
      teamSummary: { title: "Team Performance Summary", insights: ["No team data available yet. Add CSM team members to see performance insights."], trend: 'needs-attention' },
      topPerformerAnalysis: { title: "Star Performer", insights: ["No data available."], recommendation: "" },
      coachingOpportunities: { title: "Coaching & Development Opportunities", insights: [] },
      strategicRecommendations: { title: "Strategic Recommendations", insights: [] },
    };
  }
  const avgEngagement = teamData.reduce((sum, csm) => sum + csm.metrics.avgEngagementRate, 0) / teamData.length;
  const avgSatisfaction = teamData.reduce((sum, csm) => sum + csm.metrics.clientSatisfaction, 0) / teamData.length;
  const totalEnrolled = teamData.reduce((sum, csm) => sum + csm.metrics.enrolledThisMonth, 0);
  const totalRevenue = teamData.reduce((sum, csm) => sum + csm.metrics.revenueManaged, 0);
  
  // Find top and bottom performers
  const sortedByEngagement = [...teamData].sort((a, b) => b.metrics.avgEngagementRate - a.metrics.avgEngagementRate);
  const topPerformer = sortedByEngagement[0];
  const needsSupport = sortedByEngagement[sortedByEngagement.length - 1];
  
  return {
    teamSummary: {
      title: "Team Performance Summary",
      insights: [
        `The team achieved ${totalEnrolled} new enrollments this month, generating $${totalRevenue.toLocaleString()} in managed revenue.`,
        `Average client engagement rate is ${avgEngagement.toFixed(0)}%, ${avgEngagement >= 85 ? 'exceeding' : 'below'} the target of 85%.`,
        `Client satisfaction averages ${avgSatisfaction.toFixed(0)}%, indicating ${avgSatisfaction >= 90 ? 'excellent' : 'good'} service delivery.`,
      ],
      trend: avgEngagement >= 85 ? 'positive' : 'needs-attention',
    },
    topPerformerAnalysis: {
      title: `Star Performer: ${topPerformer.name}`,
      insights: [
        `${topPerformer.name} leads the team with ${topPerformer.metrics.avgEngagementRate}% engagement rate and ${topPerformer.metrics.clientSatisfaction}% client satisfaction.`,
        `Key success factors: ${topPerformer.strengths.join(', ')}.`,
        `Consider having ${topPerformer.name} mentor team members on client communication strategies.`,
      ],
      recommendation: `Leverage ${topPerformer.name.split(' ')[0]}'s expertise to establish best practices documentation for the team.`,
    },
    coachingOpportunities: {
      title: "Coaching & Development Opportunities",
      insights: [
        {
          csm: needsSupport.name,
          priority: 'high',
          areas: needsSupport.areasToImprove,
          suggestion: `${needsSupport.name} would benefit from focused coaching on ${needsSupport.areasToImprove[0].toLowerCase()}. Current response time of ${needsSupport.metrics.responseTime}hrs is above the 4hr target.`,
        },
        ...teamData.filter(csm => csm.id !== topPerformer.id && csm.id !== needsSupport.id).map(csm => ({
          csm: csm.name,
          priority: 'medium',
          areas: csm.areasToImprove,
          suggestion: `${csm.name} shows strong performance but could improve ${csm.areasToImprove[0].toLowerCase()} to reach top-tier status.`,
        })),
      ],
    },
    strategicRecommendations: {
      title: "Strategic Recommendations",
      insights: [
        {
          icon: '🎯',
          title: 'Implement Peer Learning Sessions',
          description: 'Weekly 30-minute sessions where top performers share specific techniques that drive their results.',
        },
        {
          icon: '📊',
          title: 'Response Time Dashboard',
          description: 'Create real-time visibility into response times to help CSMs self-monitor and improve.',
        },
        {
          icon: '🤝',
          title: 'Client Success Playbooks',
          description: 'Document successful engagement patterns from Sarah Kim to standardize best practices.',
        },
        {
          icon: '📈',
          title: 'Workload Rebalancing',
          description: 'Consider redistributing some accounts from Sarah (412 patients) to Marcus (289 patients) for better balance.',
        },
      ],
    },
  };
}

function PortfolioAnalyticsPage() {
  const { hasPermission, logPHIAccess } = useAuth();
  const { customization } = useCustomization();
  const brandColor = customization.branding.primaryColor;
  const [selectedCSM, setSelectedCSM] = useState(null);
  const [timeframe, setTimeframe] = useState('month');
  
  useEffect(() => {
    logPHIAccess(AUDIT_ACTIONS.VIEW_PHI, { 
      resource: 'portfolio_analytics',
      action: 'viewed_portfolio_analytics'
    });
  }, []);
  
  if (!hasPermission('view_portfolio_analytics')) {
    return (
      <div className="access-denied">
        <Lock size={48} />
        <h2>Access Denied</h2>
        <p>You don't have permission to view portfolio analytics.</p>
      </div>
    );
  }
  
  const aiInsights = generateAIInsights(csmTeamData);
  
  const teamLen = csmTeamData.length || 1;
  const companyMetrics = {
    totalPatients: csmTeamData.reduce((sum, csm) => sum + csm.metrics.totalPatients, 0),
    totalEnrolledThisMonth: csmTeamData.reduce((sum, csm) => sum + csm.metrics.enrolledThisMonth, 0),
    totalRevenue: csmTeamData.reduce((sum, csm) => sum + csm.metrics.revenueManaged, 0),
    avgEngagement: (csmTeamData.reduce((sum, csm) => sum + csm.metrics.avgEngagementRate, 0) / teamLen).toFixed(0),
    avgSatisfaction: (csmTeamData.reduce((sum, csm) => sum + csm.metrics.clientSatisfaction, 0) / teamLen).toFixed(0),
    avgResponseTime: (csmTeamData.reduce((sum, csm) => sum + csm.metrics.responseTime, 0) / teamLen).toFixed(1),
  };

  const companyTrend = csmTeamData.length > 0 && csmTeamData[0]?.trend
    ? csmTeamData[0].trend.map((t, idx) => ({
        month: t.month,
        enrolled: csmTeamData.reduce((sum, csm) => sum + (csm.trend[idx]?.enrolled || 0), 0),
        engagement: Math.round(csmTeamData.reduce((sum, csm) => sum + (csm.trend[idx]?.engagement || 0), 0) / teamLen),
      }))
    : [];
  
  return (
    <div className="portfolio-page">
      <div className="page-header">
        <h1 className="page-title">
          <TrendingUp size={28} />
          Portfolio Analytics
        </h1>
        <div className="page-header-actions">
          <select 
            className="timeframe-select"
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
          >
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="quarter">This Quarter</option>
            <option value="year">This Year</option>
          </select>
        </div>
      </div>
      
      {/* Company Overview Cards */}
      <div className="portfolio-overview">
        <div className="portfolio-metric-card highlight">
          <div className="portfolio-metric-icon">
            <Users size={24} />
          </div>
          <div className="portfolio-metric-content">
            <span className="portfolio-metric-value">{companyMetrics.totalPatients.toLocaleString()}</span>
            <span className="portfolio-metric-label">Total Patients</span>
          </div>
        </div>
        <div className="portfolio-metric-card">
          <div className="portfolio-metric-icon green">
            <TrendingUp size={24} />
          </div>
          <div className="portfolio-metric-content">
            <span className="portfolio-metric-value">+{companyMetrics.totalEnrolledThisMonth}</span>
            <span className="portfolio-metric-label">Enrolled This Month</span>
          </div>
        </div>
        <div className="portfolio-metric-card">
          <div className="portfolio-metric-icon blue">
            <DollarSign size={24} />
          </div>
          <div className="portfolio-metric-content">
            <span className="portfolio-metric-value">${(companyMetrics.totalRevenue / 1000).toFixed(0)}k</span>
            <span className="portfolio-metric-label">Monthly Revenue</span>
          </div>
        </div>
        <div className="portfolio-metric-card">
          <div className="portfolio-metric-icon purple">
            <Activity size={24} />
          </div>
          <div className="portfolio-metric-content">
            <span className="portfolio-metric-value">{companyMetrics.avgEngagement}%</span>
            <span className="portfolio-metric-label">Avg Engagement</span>
          </div>
        </div>
        <div className="portfolio-metric-card">
          <div className="portfolio-metric-icon orange">
            <Heart size={24} />
          </div>
          <div className="portfolio-metric-content">
            <span className="portfolio-metric-value">{companyMetrics.avgSatisfaction}%</span>
            <span className="portfolio-metric-label">Client Satisfaction</span>
          </div>
        </div>
        <div className="portfolio-metric-card">
          <div className="portfolio-metric-icon cyan">
            <Clock size={24} />
          </div>
          <div className="portfolio-metric-content">
            <span className="portfolio-metric-value">{companyMetrics.avgResponseTime}h</span>
            <span className="portfolio-metric-label">Avg Response Time</span>
          </div>
        </div>
      </div>
      
      {/* Charts Row */}
      <div className="portfolio-charts-row">
        <div className="portfolio-chart-card">
          <h3>Company Enrollment Trend</h3>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={companyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="month" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Area type="monotone" dataKey="enrolled" stroke={brandColor} fill={`${brandColor}33`} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="portfolio-chart-card">
          <h3>Team Engagement Comparison</h3>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={csmTeamData.map(csm => ({ name: csm.name.split(' ')[0], engagement: csm.metrics.avgEngagementRate, satisfaction: csm.metrics.clientSatisfaction }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[0, 100]} />
              <Tooltip />
              <Bar dataKey="engagement" fill={brandColor} radius={[4, 4, 0, 0]} name="Engagement %" />
              <Bar dataKey="satisfaction" fill="#6366f1" radius={[4, 4, 0, 0]} name="Satisfaction %" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* AI Insights Section */}
      <div className="ai-insights-section">
        <div className="ai-insights-header">
          <div className="ai-badge">
            <span className="ai-icon">✨</span>
            AI-Powered Insights
          </div>
          <span className="ai-updated">Updated just now</span>
        </div>
        
        {/* Team Summary */}
        <div className="ai-insight-card summary">
          <h3>{aiInsights.teamSummary.title}</h3>
          <ul className="ai-insight-list">
            {aiInsights.teamSummary.insights.map((insight, i) => (
              <li key={i}>{insight}</li>
            ))}
          </ul>
        </div>
        
        {/* Top Performer */}
        <div className="ai-insight-card highlight-green">
          <div className="ai-insight-icon">⭐</div>
          <div className="ai-insight-content">
            <h3>{aiInsights.topPerformerAnalysis.title}</h3>
            <ul className="ai-insight-list">
              {aiInsights.topPerformerAnalysis.insights.map((insight, i) => (
                <li key={i}>{insight}</li>
              ))}
            </ul>
            <div className="ai-recommendation">
              <strong>Recommendation:</strong> {aiInsights.topPerformerAnalysis.recommendation}
            </div>
          </div>
        </div>
        
        {/* Coaching Opportunities */}
        <div className="ai-insight-card coaching">
          <h3>
            <AlertTriangle size={18} style={{ marginRight: 8, color: '#f59e0b' }} />
            {aiInsights.coachingOpportunities.title}
          </h3>
          <div className="coaching-cards">
            {aiInsights.coachingOpportunities.insights.map((item, i) => (
              <div key={i} className={`coaching-card priority-${item.priority}`}>
                <div className="coaching-card-header">
                  <span className="coaching-csm-name">{item.csm}</span>
                  <span className={`priority-badge ${item.priority}`}>
                    {item.priority === 'high' ? '🔴 High Priority' : '🟡 Medium Priority'}
                  </span>
                </div>
                <p className="coaching-suggestion">{item.suggestion}</p>
                <div className="coaching-areas">
                  <span className="coaching-areas-label">Focus areas:</span>
                  {item.areas.map((area, j) => (
                    <span key={j} className="coaching-area-tag">{area}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        
        {/* Strategic Recommendations */}
        <div className="ai-insight-card strategic">
          <h3>📋 {aiInsights.strategicRecommendations.title}</h3>
          <div className="strategic-grid">
            {aiInsights.strategicRecommendations.insights.map((rec, i) => (
              <div key={i} className="strategic-item">
                <span className="strategic-icon">{rec.icon}</span>
                <div className="strategic-content">
                  <h4>{rec.title}</h4>
                  <p>{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* CSM Individual Performance */}
      <div className="csm-performance-section">
        <h2>Individual CSM Performance</h2>
        <div className="csm-cards-grid">
          {csmTeamData.map(csm => (
            <div 
              key={csm.id} 
              className={`csm-performance-card ${selectedCSM === csm.id ? 'expanded' : ''}`}
              onClick={() => setSelectedCSM(selectedCSM === csm.id ? null : csm.id)}
            >
              <div className="csm-card-header">
                <div className="csm-avatar">{csm.avatar}</div>
                <div className="csm-info">
                  <h4>{csm.name}</h4>
                  <span className="csm-clients-count">{csm.clients.length} clients</span>
                </div>
                <div className="csm-score">
                  <span className="score-value">{csm.metrics.avgEngagementRate}%</span>
                  <span className="score-label">Engagement</span>
                </div>
              </div>
              
              <div className="csm-metrics-row">
                <div className="csm-metric">
                  <span className="csm-metric-value">{csm.metrics.totalPatients}</span>
                  <span className="csm-metric-label">Patients</span>
                </div>
                <div className="csm-metric">
                  <span className="csm-metric-value">+{csm.metrics.enrolledThisMonth}</span>
                  <span className="csm-metric-label">This Month</span>
                </div>
                <div className="csm-metric">
                  <span className="csm-metric-value">${(csm.metrics.revenueManaged / 1000).toFixed(0)}k</span>
                  <span className="csm-metric-label">Revenue</span>
                </div>
                <div className="csm-metric">
                  <span className="csm-metric-value">{csm.metrics.responseTime}h</span>
                  <span className="csm-metric-label">Response</span>
                </div>
              </div>
              
              {selectedCSM === csm.id && (
                <div className="csm-expanded-content">
                  <div className="csm-trend-chart">
                    <h5>5-Month Trend</h5>
                    <ResponsiveContainer width="100%" height={120}>
                      <LineChart data={csm.trend}>
                        <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip />
                        <Line type="monotone" dataKey="enrolled" stroke={brandColor} strokeWidth={2} dot={{ r: 3 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="csm-details-grid">
                    <div className="csm-detail-section">
                      <h5>💪 Strengths</h5>
                      <div className="strength-tags">
                        {csm.strengths.map((s, i) => (
                          <span key={i} className="strength-tag">{s}</span>
                        ))}
                      </div>
                    </div>
                    <div className="csm-detail-section">
                      <h5>🎯 Areas to Develop</h5>
                      <div className="improve-tags">
                        {csm.areasToImprove.map((a, i) => (
                          <span key={i} className="improve-tag">{a}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="csm-card-footer">
                <span className="expand-hint">
                  {selectedCSM === csm.id ? 'Click to collapse' : 'Click for details'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// CUSTOMIZATION / WHITELABEL PAGE (Admin Only)
// ============================================================

function CustomizationPage({ onNavigate }) {
  const { hasPermission, logPHIAccess } = useAuth();
  const {
    customization,
    updateBranding,
    updateTab,
    reorderTabs,
    addTab,
    removeTab,
    getTabSectionCount,
    updateWidget,
    reorderWidgets,
    resetToDefaults,
    getEnabledTabs,
    getEnabledWidgets,
    saveGlobalBranding,
    brandingSaveStatus,
  } = useCustomization();

  const brandingAutoSaveRef = useRef(null);
  const handleBrandingUpdate = useCallback((updates) => {
    updateBranding(updates);
    if (brandingAutoSaveRef.current) {
      clearTimeout(brandingAutoSaveRef.current);
    }
    brandingAutoSaveRef.current = setTimeout(() => {
      saveGlobalBranding();
    }, 1500);
  }, [updateBranding, saveGlobalBranding]);

  useEffect(() => {
    return () => {
      if (brandingAutoSaveRef.current) {
        clearTimeout(brandingAutoSaveRef.current);
      }
    };
  }, []);

  const [activeSection, setActiveSection] = useState('branding');
  const [draggedTab, setDraggedTab] = useState(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [logoPreview, setLogoPreview] = useState(customization.branding.logoUrl);
  const [showAddTabModal, setShowAddTabModal] = useState(false);
  const [newTabData, setNewTabData] = useState({ label: '', icon: 'LayoutDashboard' });
  const [showDeleteTabModal, setShowDeleteTabModal] = useState(false);
  const [tabToDelete, setTabToDelete] = useState(null);

  // Custom gradient state (sidebar)
  const [customGradientStart, setCustomGradientStart] = useState('#115e59');
  const [customGradientEnd, setCustomGradientEnd] = useState('#134e4a');
  const [gradientDirection, setGradientDirection] = useState('180deg');

  const applyCustomGradient = () => {
    const gradient = `linear-gradient(${gradientDirection}, ${customGradientStart} 0%, ${customGradientEnd} 100%)`;
    handleBrandingUpdate({ sidebarBg: gradient });
  };

  // Custom gradient builder for presentation slides
  const [showGradientBuilder, setShowGradientBuilder] = useState(false);
  const [customGradient, setCustomGradient] = useState({
    type: 'linear',
    startColor: '#0f172a',
    middleColor: '#1e293b',
    endColor: '#334155',
    angle: 135
  });

  const generateGradientCSS = (gradient) => {
    const { type, startColor, middleColor, endColor, angle } = gradient;
    if (type === 'linear') {
      return `linear-gradient(${angle}deg, ${startColor} 0%, ${middleColor} 50%, ${endColor} 100%)`;
    } else if (type === 'radial') {
      return `radial-gradient(circle, ${startColor} 0%, ${middleColor} 50%, ${endColor} 100%)`;
    } else if (type === 'conic') {
      return `conic-gradient(from ${angle}deg, ${startColor} 0%, ${middleColor} 50%, ${endColor} 100%)`;
    }
    return `linear-gradient(${angle}deg, ${startColor} 0%, ${middleColor} 50%, ${endColor} 100%)`;
  };
  
  useEffect(() => {
    logPHIAccess(AUDIT_ACTIONS.SETTINGS_CHANGE, { 
      resource: 'customization_page',
      action: 'viewed_customization_settings'
    });
  }, []);
  
  if (!hasPermission('manage_customization')) {
    return (
      <div className="access-denied">
        <Lock size={48} />
        <h2>Access Denied</h2>
        <p>You don't have permission to manage platform customization.</p>
      </div>
    );
  }

  const iconMap = {
    LayoutDashboard, Users, MessageSquare, Mail, FileText,
    Heart, DollarSign, Activity, Target, TrendingUp,
    Calendar, Clock, CheckCircle, Star, Lightbulb,
    Settings, BarChart2, PieChart, Bell, Shield,
    Award, Briefcase, Pill, Smartphone, HeartPulse,
    Stethoscope, Sparkles, Zap, Layers, AlertCircle, Send
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        handleBrandingUpdate({ logoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    handleBrandingUpdate({ logoUrl: null, logoMode: 'default' });
  };

  const [faviconUploading, setFaviconUploading] = useState(false);
  const [ogImageUploading, setOgImageUploading] = useState(false);

  const uploadBrandAsset = async (file, assetName) => {
    const ext = file.name.split('.').pop().toLowerCase();
    const filePath = `${assetName}-${Date.now()}.${ext}`;
    const { error } = await supabase.storage
      .from('brand-assets')
      .upload(filePath, file, { upsert: true });
    if (error) {
      console.error('[BrandAsset] Upload error:', error);
      return null;
    }
    const { data: urlData } = supabase.storage
      .from('brand-assets')
      .getPublicUrl(filePath);
    return urlData?.publicUrl || null;
  };

  const handleFaviconUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFaviconUploading(true);
    const url = await uploadBrandAsset(file, 'favicon');
    setFaviconUploading(false);
    if (url) handleBrandingUpdate({ faviconUrl: url });
  };

  const handleOgImageUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setOgImageUploading(true);
    const url = await uploadBrandAsset(file, 'og-image');
    setOgImageUploading(false);
    if (url) handleBrandingUpdate({ ogImageUrl: url });
  };

  const removeFavicon = () => handleBrandingUpdate({ faviconUrl: null });
  const removeOgImage = () => handleBrandingUpdate({ ogImageUrl: null });

  const handleTabDragStart = (e, tab) => {
    setDraggedTab(tab);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleTabDragOver = (e, targetTab) => {
    e.preventDefault();
    if (!draggedTab || draggedTab.id === targetTab.id) return;
    
    const tabs = [...customization.navigation.tabs].sort((a, b) => a.order - b.order);
    const draggedIndex = tabs.findIndex(t => t.id === draggedTab.id);
    const targetIndex = tabs.findIndex(t => t.id === targetTab.id);
    
    const newTabs = [...tabs];
    newTabs.splice(draggedIndex, 1);
    newTabs.splice(targetIndex, 0, draggedTab);
    
    reorderTabs(newTabs);
  };

  const handleTabDragEnd = () => {
    setDraggedTab(null);
  };


  const moveTab = (tabId, direction) => {
    const tabs = [...customization.navigation.tabs].sort((a, b) => a.order - b.order);
    const index = tabs.findIndex(t => t.id === tabId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === tabs.length - 1)) return;

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newTabs = [...tabs];
    [newTabs[index], newTabs[newIndex]] = [newTabs[newIndex], newTabs[index]];
    reorderTabs(newTabs);
  };

  const handleAddTab = () => {
    if (!newTabData.label.trim()) return;

    addTab(newTabData);
    setNewTabData({ label: '', icon: 'LayoutDashboard' });
    setShowAddTabModal(false);
  };

  const handleDeleteTabClick = (tab) => {
    setTabToDelete(tab);
    setShowDeleteTabModal(true);
  };

  const handleConfirmDelete = () => {
    if (tabToDelete) {
      removeTab(tabToDelete.id);
      setTabToDelete(null);
      setShowDeleteTabModal(false);
    }
  };

  const handleGoToDashboardManagement = () => {
    setShowDeleteTabModal(false);
    onNavigate('admin');
  };

  const colorPresets = [
    { name: 'Teal (Default)', primary: '#14b8a6', secondary: '#0d9488', accent: '#5eead4' },
    { name: 'Blue', primary: '#3b82f6', secondary: '#2563eb', accent: '#93c5fd' },
    { name: 'Purple', primary: '#8b5cf6', secondary: '#7c3aed', accent: '#c4b5fd' },
    { name: 'Green', primary: '#22c55e', secondary: '#16a34a', accent: '#86efac' },
    { name: 'Orange', primary: '#f97316', secondary: '#ea580c', accent: '#fdba74' },
    { name: 'Pink', primary: '#ec4899', secondary: '#db2777', accent: '#f9a8d4' },
    { name: 'Indigo', primary: '#6366f1', secondary: '#4f46e5', accent: '#a5b4fc' },
    { name: 'Cyan', primary: '#06b6d4', secondary: '#0891b2', accent: '#67e8f9' },
  ];

  return (
    <div className="customization-page">
      <div className="page-header">
        <h1 className="page-title">
          <Palette size={28} />
          Platform Customization
        </h1>
        <div className="page-header-actions">
          <button 
            className="reset-btn"
            onClick={() => setShowResetConfirm(true)}
          >
            <RefreshCw size={16} />
            Reset to Defaults
          </button>
        </div>
      </div>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-content small" onClick={e => e.stopPropagation()}>
            <h3>Reset Customization?</h3>
            <p>This will restore all branding, navigation, and widget settings to their defaults. This action cannot be undone.</p>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="btn-danger" onClick={() => { resetToDefaults(); setShowResetConfirm(false); setLogoPreview(null); }}>
                Reset Everything
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Tab Modal */}
      {showAddTabModal && (
        <div className="modal-overlay" onClick={() => setShowAddTabModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3><Plus size={20} /> Add New Tab</h3>
              <button className="modal-close" onClick={() => setShowAddTabModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="form-group">
                <label className="form-label">Tab Label *</label>
                <input
                  type="text"
                  className="form-input"
                  value={newTabData.label}
                  onChange={(e) => setNewTabData(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Custom Metrics"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Icon</label>
                <select
                  className="form-input"
                  value={newTabData.icon}
                  onChange={(e) => setNewTabData(prev => ({ ...prev, icon: e.target.value }))}
                >
                  <option value="LayoutDashboard">Dashboard</option>
                  <option value="Users">Users</option>
                  <option value="DollarSign">Dollar Sign</option>
                  <option value="Heart">Heart</option>
                  <option value="MessageSquare">Message Square</option>
                  <option value="Lightbulb">Light Bulb</option>
                  <option value="TrendingUp">Trending Up</option>
                  <option value="Activity">Activity</option>
                  <option value="Calendar">Calendar</option>
                  <option value="Settings">Settings</option>
                  <option value="Target">Target</option>
                  <option value="BarChart2">Bar Chart</option>
                  <option value="PieChart">Pie Chart</option>
                  <option value="FileText">File Text</option>
                  <option value="Mail">Mail</option>
                  <option value="Bell">Bell</option>
                  <option value="Shield">Shield</option>
                  <option value="Star">Star</option>
                  <option value="Award">Award</option>
                  <option value="Briefcase">Briefcase</option>
                </select>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddTabModal(false)}>Cancel</button>
              <button
                className="btn-primary"
                onClick={handleAddTab}
                disabled={!newTabData.label.trim()}
              >
                <Plus size={16} /> Add Tab
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Tab Confirmation Modal */}
      {showDeleteTabModal && tabToDelete && (
        <div className="modal-overlay" onClick={() => setShowDeleteTabModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '600px' }}>
            <div className="modal-header">
              <h3><AlertTriangle size={20} style={{ color: '#ef4444' }} /> Delete Tab "{tabToDelete.label}"?</h3>
              <button className="modal-close" onClick={() => setShowDeleteTabModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              {(() => {
                const counts = getTabSectionCount(tabToDelete.id);
                return (
                  <>
                    <div style={{
                      padding: '16px',
                      background: '#fef2f2',
                      border: '1px solid #fecaca',
                      borderRadius: '8px',
                      marginBottom: '16px'
                    }}>
                      <p style={{ margin: '0 0 12px 0', fontWeight: '600', color: '#991b1b' }}>
                        This action will permanently delete:
                      </p>
                      <ul style={{ margin: 0, paddingLeft: '20px', color: '#7f1d1d' }}>
                        <li>{counts.sections} section{counts.sections !== 1 ? 's' : ''}</li>
                        <li>{counts.widgets} widget{counts.widgets !== 1 ? 's' : ''}</li>
                      </ul>
                      <p style={{ margin: '12px 0 0 0', fontSize: '14px', color: '#7f1d1d' }}>
                        This action cannot be undone.
                      </p>
                    </div>
                    {counts.total > 0 && (
                      <div style={{
                        padding: '16px',
                        background: '#fffbeb',
                        border: '1px solid #fcd34d',
                        borderRadius: '8px',
                        marginBottom: '16px'
                      }}>
                        <p style={{ margin: '0', fontSize: '14px', color: '#78350f' }}>
                          <strong>Want to keep your data?</strong> First move your sections/widgets to another tab in Dashboard Management, then come back to delete this tab.
                        </p>
                      </div>
                    )}
                  </>
                );
              })()}
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowDeleteTabModal(false)}>Cancel</button>
              {getTabSectionCount(tabToDelete.id).total > 0 && (
                <button
                  className="btn-primary"
                  onClick={handleGoToDashboardManagement}
                >
                  Go to Data Management
                </button>
              )}
              <button
                className="btn-danger"
                onClick={handleConfirmDelete}
              >
                <Trash2 size={16} /> Delete Tab and All Data
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="customization-layout">
        {/* Section Tabs */}
        <div className="customization-tabs">
          <button 
            className={`customization-tab ${activeSection === 'branding' ? 'active' : ''}`}
            onClick={() => setActiveSection('branding')}
          >
            <Palette size={18} />
            Branding
          </button>
          <button
            className={`customization-tab ${activeSection === 'navigation' ? 'active' : ''}`}
            onClick={() => setActiveSection('navigation')}
          >
            <LayoutDashboard size={18} />
            Navigation
          </button>
        </div>

        {/* Branding Section */}
        {activeSection === 'branding' && (
          <div className="customization-section">
            {brandingSaveStatus !== 'idle' && (
              <div style={{
                padding: '8px 16px',
                marginBottom: '12px',
                borderRadius: '8px',
                fontSize: '13px',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                background: brandingSaveStatus === 'saving' ? '#fef3c7' : brandingSaveStatus === 'saved' ? '#d1fae5' : '#fee2e2',
                color: brandingSaveStatus === 'saving' ? '#92400e' : brandingSaveStatus === 'saved' ? '#065f46' : '#991b1b',
                border: `1px solid ${brandingSaveStatus === 'saving' ? '#fcd34d' : brandingSaveStatus === 'saved' ? '#6ee7b7' : '#fca5a5'}`,
              }}>
                {brandingSaveStatus === 'saving' && <><RefreshCw size={14} className="animate-spin" /> Saving branding...</>}
                {brandingSaveStatus === 'saved' && <><CheckCircle size={14} /> Branding saved</>}
                {brandingSaveStatus === 'error' && <><AlertTriangle size={14} /> Failed to save branding</>}
              </div>
            )}
            <div className="section-card">
              <h3><Image size={18} /> Logo & Platform Name</h3>
              
              <div className="form-row">
                <label>Platform Name</label>
                <input
                  type="text"
                  value={customization.branding.platformName}
                  onChange={(e) => handleBrandingUpdate({ platformName: e.target.value, logoText: e.target.value })}
                  placeholder="Enter platform name"
                />
              </div>

              <div className="form-row">
                <label>Platform Tagline</label>
                <input
                  type="text"
                  value={customization.branding.platformTagline || ''}
                  onChange={(e) => handleBrandingUpdate({ platformTagline: e.target.value })}
                  placeholder="e.g., Chronic Care Management"
                />
                <p className="form-hint">Shown on reports and presentation headers</p>
              </div>

              <div className="form-row">
                <label>Logo Display Mode</label>
                <div className="logo-mode-options">
                  <label className={`logo-mode-option ${customization.branding.logoMode === 'default' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="logoMode" 
                      value="default"
                      checked={customization.branding.logoMode === 'default' || !customization.branding.logoMode}
                      onChange={() => handleBrandingUpdate({ logoMode: 'default' })}
                    />
                    <div className="logo-mode-preview">
                      <Shield size={20} style={{ color: customization.branding.primaryColor }} />
                      <span>Text</span>
                    </div>
                    <span className="logo-mode-label">Default Icon + Name</span>
                  </label>
                  
                  <label className={`logo-mode-option ${customization.branding.logoMode === 'icon-text' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="logoMode" 
                      value="icon-text"
                      checked={customization.branding.logoMode === 'icon-text'}
                      onChange={() => handleBrandingUpdate({ logoMode: 'icon-text' })}
                      disabled={!logoPreview}
                    />
                    <div className="logo-mode-preview">
                      {logoPreview ? (
                        <img src={logoPreview} alt="" style={{ width: 20, height: 20, objectFit: 'contain' }} />
                      ) : (
                        <Image size={20} style={{ opacity: 0.3 }} />
                      )}
                      <span>Text</span>
                    </div>
                    <span className="logo-mode-label">Custom Icon + Name</span>
                  </label>
                  
                  <label className={`logo-mode-option ${customization.branding.logoMode === 'full-image' ? 'selected' : ''}`}>
                    <input 
                      type="radio" 
                      name="logoMode" 
                      value="full-image"
                      checked={customization.branding.logoMode === 'full-image'}
                      onChange={() => handleBrandingUpdate({ logoMode: 'full-image' })}
                      disabled={!logoPreview}
                    />
                    <div className="logo-mode-preview" style={{ justifyContent: 'center' }}>
                      {logoPreview ? (
                        <img src={logoPreview} alt="" style={{ maxWidth: 60, maxHeight: 24, objectFit: 'contain' }} />
                      ) : (
                        <Image size={20} style={{ opacity: 0.3 }} />
                      )}
                    </div>
                    <span className="logo-mode-label">Full Logo Only</span>
                  </label>
                </div>
              </div>

              <div className="form-row">
                <label>Upload Image</label>
                <div className="logo-upload-area">
                  {logoPreview ? (
                    <div className="logo-preview">
                      <img src={logoPreview} alt="Logo preview" />
                      <button className="remove-logo-btn" onClick={removeLogo}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ) : (
                    <div className="logo-placeholder">
                      <Upload size={32} style={{ opacity: 0.4 }} />
                      <span>No image uploaded</span>
                    </div>
                  )}
                  <label className="upload-btn">
                    <Upload size={16} />
                    Upload Image
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={handleLogoUpload}
                      style={{ display: 'none' }}
                    />
                  </label>
                </div>
                <p className="form-hint">
                  {customization.branding.logoMode === 'full-image' 
                    ? 'Recommended: Wide logo image (e.g., 200x50px) with transparent background'
                    : 'Recommended: Square icon (e.g., 48x48px) with transparent background'
                  }
                </p>
              </div>
            </div>

            <div className="section-card">
              <h3><Globe size={18} /> Link Preview & SEO</h3>
              <p className="form-hint" style={{ marginTop: 0, marginBottom: 16 }}>
                Control how your workspace appears in browser tabs and when links are shared on social platforms.
              </p>

              <div className="form-row">
                <label>Site Title</label>
                <input
                  type="text"
                  value={customization.branding.siteTitle || ''}
                  onChange={(e) => handleBrandingUpdate({ siteTitle: e.target.value })}
                  placeholder="Enter site title (shown in browser tab)"
                />
                <p className="form-hint">Appears in the browser tab and as the title when your link is shared.</p>
              </div>

              <div className="form-row">
                <label>Favicon</label>
                <div className="logo-upload-area">
                  {customization.branding.faviconUrl ? (
                    <div className="logo-preview" style={{ width: 48, height: 48, minHeight: 48 }}>
                      <img src={customization.branding.faviconUrl} alt="Favicon preview" style={{ width: 32, height: 32, objectFit: 'contain' }} />
                      <button className="remove-logo-btn" onClick={removeFavicon} style={{ top: -6, right: -6, width: 20, height: 20 }}>
                        <Trash2 size={11} />
                      </button>
                    </div>
                  ) : (
                    <div className="logo-placeholder" style={{ width: 48, height: 48, minHeight: 48 }}>
                      <Image size={20} style={{ opacity: 0.4 }} />
                    </div>
                  )}
                  <label className="upload-btn">
                    {faviconUploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                    {faviconUploading ? 'Uploading...' : 'Upload Favicon'}
                    <input
                      type="file"
                      accept=".ico,.png,.svg,.webp,image/x-icon,image/png,image/svg+xml,image/webp"
                      onChange={handleFaviconUpload}
                      style={{ display: 'none' }}
                      disabled={faviconUploading}
                    />
                  </label>
                </div>
                <p className="form-hint">Recommended: 32x32px or 64x64px square image (.ico, .png, .svg)</p>
              </div>

              <div className="form-row">
                <label>Share Thumbnail (OG Image)</label>
                <div className="logo-upload-area" style={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                  {customization.branding.ogImageUrl ? (
                    <div style={{ position: 'relative', borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', marginBottom: 8, maxWidth: 320 }}>
                      <img src={customization.branding.ogImageUrl} alt="OG Image preview" style={{ width: '100%', maxHeight: 168, objectFit: 'cover', display: 'block' }} />
                      <button className="remove-logo-btn" onClick={removeOgImage} style={{ top: 6, right: 6, width: 24, height: 24 }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ) : (
                    <div className="logo-placeholder" style={{ width: '100%', maxWidth: 320, height: 120, minHeight: 120 }}>
                      <Image size={28} style={{ opacity: 0.4 }} />
                      <span>No thumbnail uploaded</span>
                    </div>
                  )}
                  <label className="upload-btn">
                    {ogImageUploading ? <RefreshCw size={16} className="animate-spin" /> : <Upload size={16} />}
                    {ogImageUploading ? 'Uploading...' : 'Upload Thumbnail'}
                    <input
                      type="file"
                      accept=".png,.jpg,.jpeg,.webp,image/png,image/jpeg,image/webp"
                      onChange={handleOgImageUpload}
                      style={{ display: 'none' }}
                      disabled={ogImageUploading}
                    />
                  </label>
                </div>
                <p className="form-hint">Recommended: 1200x630px for best results on social platforms (.png, .jpg, .webp)</p>
              </div>

              {(customization.branding.siteTitle || customization.branding.ogImageUrl) && (
                <div style={{
                  marginTop: 16,
                  padding: 0,
                  borderRadius: 10,
                  overflow: 'hidden',
                  border: '1px solid rgba(255,255,255,0.1)',
                  background: '#fff',
                  maxWidth: 360,
                }}>
                  {customization.branding.ogImageUrl && (
                    <img
                      src={customization.branding.ogImageUrl}
                      alt="Preview"
                      style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
                    />
                  )}
                  <div style={{ padding: '10px 14px' }}>
                    <div style={{ fontSize: 11, color: '#65676b', fontWeight: 400, marginBottom: 2, textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                      {window.location.hostname}
                    </div>
                    <div style={{ fontSize: 15, fontWeight: 600, color: '#1c1e21', lineHeight: 1.3, marginBottom: 2 }}>
                      {customization.branding.siteTitle || 'Your Site Title'}
                    </div>
                    <div style={{ fontSize: 12, color: '#65676b' }}>
                      {customization.branding.platformTagline || customization.branding.platformName || ''}
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="section-card">
              <h3><Palette size={18} /> Brand Colors</h3>
              
              <div className="color-presets">
                <label>Quick Presets</label>
                <div className="preset-buttons">
                  {colorPresets.map(preset => (
                    <button
                      key={preset.name}
                      className="color-preset-btn"
                      style={{ background: preset.primary }}
                      onClick={() => handleBrandingUpdate({ 
                        primaryColor: preset.primary, 
                        secondaryColor: preset.secondary,
                        accentColor: preset.accent
                      })}
                      title={preset.name}
                    />
                  ))}
                </div>
              </div>

              <div className="color-inputs">
                <div className="color-input-group">
                  <label>Primary Color</label>
                  <div className="color-input-row">
                    <input 
                      type="color"
                      value={customization.branding.primaryColor}
                      onChange={(e) => handleBrandingUpdate({ primaryColor: e.target.value })}
                    />
                    <input 
                      type="text"
                      value={customization.branding.primaryColor}
                      onChange={(e) => handleBrandingUpdate({ primaryColor: e.target.value })}
                      placeholder="#14b8a6"
                    />
                  </div>
                </div>

                <div className="color-input-group">
                  <label>Secondary Color</label>
                  <div className="color-input-row">
                    <input 
                      type="color"
                      value={customization.branding.secondaryColor}
                      onChange={(e) => handleBrandingUpdate({ secondaryColor: e.target.value })}
                    />
                    <input 
                      type="text"
                      value={customization.branding.secondaryColor}
                      onChange={(e) => handleBrandingUpdate({ secondaryColor: e.target.value })}
                      placeholder="#0d9488"
                    />
                  </div>
                </div>

                <div className="color-input-group">
                  <label>Accent Color</label>
                  <div className="color-input-row">
                    <input 
                      type="color"
                      value={customization.branding.accentColor}
                      onChange={(e) => handleBrandingUpdate({ accentColor: e.target.value })}
                    />
                    <input 
                      type="text"
                      value={customization.branding.accentColor}
                      onChange={(e) => handleBrandingUpdate({ accentColor: e.target.value })}
                      placeholder="#5eead4"
                    />
                  </div>
                </div>
              </div>

              <div className="color-preview">
                <label>Preview</label>
                <div className="preview-box" style={{ background: customization.branding.primaryColor }}>
                  <span style={{ color: 'white' }}>Primary Button</span>
                </div>
                <div className="preview-box" style={{ background: customization.branding.secondaryColor }}>
                  <span style={{ color: 'white' }}>Secondary Element</span>
                </div>
                <div className="preview-box" style={{ background: customization.branding.accentColor }}>
                  <span style={{ color: '#1e293b' }}>Accent Highlight</span>
                </div>
              </div>
            </div>

            <div className="section-card">
              <h3><LayoutDashboard size={18} /> Background Colors</h3>
              
              <div className="bg-color-section">
                <div className="bg-color-group">
                  <label>Sidebar Background</label>
                  <p className="form-hint">The navigation menu background color</p>
                  <div className="bg-presets">
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #115e59 0%, #134e4a 100%)' }}
                      onClick={() => handleBrandingUpdate({ sidebarBg: 'linear-gradient(180deg, #115e59 0%, #134e4a 100%)' })}
                      title="Teal (Default)"
                    />
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
                      onClick={() => handleBrandingUpdate({ sidebarBg: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' })}
                      title="Dark Slate"
                    />
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)' }}
                      onClick={() => handleBrandingUpdate({ sidebarBg: 'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)' })}
                      title="Navy"
                    />
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #4c1d95 0%, #2e1065 100%)' }}
                      onClick={() => handleBrandingUpdate({ sidebarBg: 'linear-gradient(180deg, #4c1d95 0%, #2e1065 100%)' })}
                      title="Purple"
                    />
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)' }}
                      onClick={() => handleBrandingUpdate({ sidebarBg: 'linear-gradient(180deg, #166534 0%, #14532d 100%)' })}
                      title="Forest"
                    />
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)' }}
                      onClick={() => handleBrandingUpdate({ sidebarBg: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)' })}
                      title="Blue"
                    />
                  </div>
                  
                  {/* Custom Gradient Builder */}
                  <div className="custom-gradient-builder" style={{ marginTop: '16px' }}>
                    <label style={{ fontSize: '13px', fontWeight: '600', marginBottom: '8px', display: 'block' }}>
                      Custom Gradient
                    </label>
                    <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>Start Color</span>
                        <input 
                          type="color" 
                          value={customGradientStart}
                          onChange={(e) => setCustomGradientStart(e.target.value)}
                          style={{ width: '50px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>End Color</span>
                        <input 
                          type="color" 
                          value={customGradientEnd}
                          onChange={(e) => setCustomGradientEnd(e.target.value)}
                          style={{ width: '50px', height: '36px', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                        />
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span style={{ fontSize: '11px', color: 'var(--slate-500)' }}>Direction</span>
                        <select 
                          value={gradientDirection}
                          onChange={(e) => setGradientDirection(e.target.value)}
                          style={{ padding: '8px 12px', border: '1px solid var(--slate-200)', borderRadius: '6px', fontSize: '13px' }}
                        >
                          <option value="180deg">Top to Bottom</option>
                          <option value="0deg">Bottom to Top</option>
                          <option value="90deg">Left to Right</option>
                          <option value="270deg">Right to Left</option>
                          <option value="135deg">Diagonal ↘</option>
                          <option value="45deg">Diagonal ↗</option>
                        </select>
                      </div>
                      <div 
                        style={{ 
                          width: '50px', 
                          height: '36px', 
                          borderRadius: '6px', 
                          background: `linear-gradient(${gradientDirection}, ${customGradientStart} 0%, ${customGradientEnd} 100%)`,
                          border: '1px solid var(--slate-200)'
                        }}
                        title="Preview"
                      />
                      <button 
                        onClick={applyCustomGradient}
                        style={{
                          padding: '8px 16px',
                          background: 'var(--brand-primary)',
                          color: 'white',
                          border: 'none',
                          borderRadius: '6px',
                          fontSize: '13px',
                          fontWeight: '500',
                          cursor: 'pointer'
                        }}
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                </div>

                <div className="bg-color-group">
                  <label>Sidebar Text Color</label>
                  <p className="form-hint">Text and icon color in the navigation menu</p>
                  <div className="text-color-presets">
                    <button 
                      className={`text-preset-btn ${customization.branding.sidebarTextColor === '#ffffff' ? 'selected' : ''}`}
                      style={{ background: '#ffffff', color: '#1e293b' }}
                      onClick={() => handleBrandingUpdate({ sidebarTextColor: '#ffffff' })}
                      title="White (Default)"
                    >Aa</button>
                    <button 
                      className={`text-preset-btn ${customization.branding.sidebarTextColor === '#f1f5f9' ? 'selected' : ''}`}
                      style={{ background: '#f1f5f9', color: '#1e293b' }}
                      onClick={() => handleBrandingUpdate({ sidebarTextColor: '#f1f5f9' })}
                      title="Light Gray"
                    >Aa</button>
                    <button 
                      className={`text-preset-btn ${customization.branding.sidebarTextColor === '#5eead4' ? 'selected' : ''}`}
                      style={{ background: '#5eead4', color: '#1e293b' }}
                      onClick={() => handleBrandingUpdate({ sidebarTextColor: '#5eead4' })}
                      title="Teal Light"
                    >Aa</button>
                    <button 
                      className={`text-preset-btn ${customization.branding.sidebarTextColor === '#fde68a' ? 'selected' : ''}`}
                      style={{ background: '#fde68a', color: '#1e293b' }}
                      onClick={() => handleBrandingUpdate({ sidebarTextColor: '#fde68a' })}
                      title="Yellow"
                    >Aa</button>
                    <button 
                      className={`text-preset-btn ${customization.branding.sidebarTextColor === '#1e293b' ? 'selected' : ''}`}
                      style={{ background: '#1e293b', color: '#ffffff' }}
                      onClick={() => handleBrandingUpdate({ sidebarTextColor: '#1e293b' })}
                      title="Dark"
                    >Aa</button>
                    <div className="custom-text-color">
                      <input 
                        type="color" 
                        value={customization.branding.sidebarTextColor || '#ffffff'}
                        onChange={(e) => handleBrandingUpdate({ sidebarTextColor: e.target.value })}
                        title="Custom color"
                      />
                    </div>
                  </div>
                </div>

                <div className="bg-color-group">
                  <label>Presentation Slide Background</label>
                  <p className="form-hint">Background for presentation mode slides</p>
                  <div className="bg-presets">
                    <button 
                      className="bg-preset-btn wide" 
                      style={{ background: 'linear-gradient(135deg, #0f3d3e 0%, #0d4f4f 50%, #115e59 100%)' }}
                      onClick={() => handleBrandingUpdate({ slideBg: 'linear-gradient(135deg, #0f3d3e 0%, #0d4f4f 50%, #115e59 100%)' })}
                      title="Teal (Default)"
                    />
                    <button 
                      className="bg-preset-btn wide" 
                      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}
                      onClick={() => handleBrandingUpdate({ slideBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' })}
                      title="Dark"
                    />
                    <button 
                      className="bg-preset-btn wide" 
                      style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3b82f6 100%)' }}
                      onClick={() => handleBrandingUpdate({ slideBg: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3b82f6 100%)' })}
                      title="Blue"
                    />
                    <button 
                      className="bg-preset-btn wide" 
                      style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #8b5cf6 100%)' }}
                      onClick={() => handleBrandingUpdate({ slideBg: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #8b5cf6 100%)' })}
                      title="Purple"
                    />
                    <button 
                      className="bg-preset-btn wide" 
                      style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #22c55e 100%)' }}
                      onClick={() => handleBrandingUpdate({ slideBg: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #22c55e 100%)' })}
                      title="Green"
                    />
                    <button
                      className="bg-preset-btn wide"
                      style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #ef4444 100%)' }}
                      onClick={() => handleBrandingUpdate({ slideBg: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #ef4444 100%)' })}
                      title="Red"
                    />
                  </div>

                  <div style={{ marginTop: '16px' }}>
                    <button
                      className="btn-secondary"
                      style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', padding: '8px 16px' }}
                      onClick={() => setShowGradientBuilder(!showGradientBuilder)}
                    >
                      <Palette size={16} />
                      {showGradientBuilder ? 'Hide' : 'Create'} Custom Gradient
                    </button>
                  </div>

                  {showGradientBuilder && (
                    <div style={{ marginTop: '16px', padding: '16px', background: 'var(--slate-50)', borderRadius: '8px', border: '1px solid var(--slate-200)' }}>
                      <div style={{ display: 'grid', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Gradient Type</label>
                          <select
                            value={customGradient.type}
                            onChange={(e) => setCustomGradient({ ...customGradient, type: e.target.value })}
                            style={{ width: '100%', padding: '8px', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '14px' }}
                          >
                            <option value="linear">Linear</option>
                            <option value="radial">Radial</option>
                            <option value="conic">Conic</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Start Color</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="color"
                              value={customGradient.startColor}
                              onChange={(e) => setCustomGradient({ ...customGradient, startColor: e.target.value })}
                              style={{ width: '50px', height: '36px', borderRadius: '6px', border: '1px solid var(--slate-300)', cursor: 'pointer' }}
                            />
                            <input
                              type="text"
                              value={customGradient.startColor}
                              onChange={(e) => setCustomGradient({ ...customGradient, startColor: e.target.value })}
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '14px', fontFamily: 'monospace' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>Middle Color</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="color"
                              value={customGradient.middleColor}
                              onChange={(e) => setCustomGradient({ ...customGradient, middleColor: e.target.value })}
                              style={{ width: '50px', height: '36px', borderRadius: '6px', border: '1px solid var(--slate-300)', cursor: 'pointer' }}
                            />
                            <input
                              type="text"
                              value={customGradient.middleColor}
                              onChange={(e) => setCustomGradient({ ...customGradient, middleColor: e.target.value })}
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '14px', fontFamily: 'monospace' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>End Color</label>
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                            <input
                              type="color"
                              value={customGradient.endColor}
                              onChange={(e) => setCustomGradient({ ...customGradient, endColor: e.target.value })}
                              style={{ width: '50px', height: '36px', borderRadius: '6px', border: '1px solid var(--slate-300)', cursor: 'pointer' }}
                            />
                            <input
                              type="text"
                              value={customGradient.endColor}
                              onChange={(e) => setCustomGradient({ ...customGradient, endColor: e.target.value })}
                              style={{ flex: 1, padding: '8px', borderRadius: '6px', border: '1px solid var(--slate-300)', fontSize: '14px', fontFamily: 'monospace' }}
                            />
                          </div>
                        </div>

                        {customGradient.type === 'linear' && (
                          <div>
                            <label style={{ fontSize: '13px', fontWeight: 500, marginBottom: '6px', display: 'block' }}>
                              Angle: {customGradient.angle}°
                            </label>
                            <input
                              type="range"
                              min="0"
                              max="360"
                              value={customGradient.angle}
                              onChange={(e) => setCustomGradient({ ...customGradient, angle: parseInt(e.target.value) })}
                              style={{ width: '100%' }}
                            />
                          </div>
                        )}

                        <div style={{ marginTop: '8px', padding: '40px', borderRadius: '8px', background: generateGradientCSS(customGradient), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 600, fontSize: '14px', textShadow: '0 2px 4px rgba(0,0,0,0.3)' }}>
                          Preview
                        </div>

                        <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                          <button
                            className="btn-primary"
                            onClick={() => {
                              const gradientCSS = generateGradientCSS(customGradient);
                              handleBrandingUpdate({ slideBg: gradientCSS });
                              setShowGradientBuilder(false);
                            }}
                            style={{ flex: 1 }}
                          >
                            Apply Gradient
                          </button>
                          <button
                            className="btn-secondary"
                            onClick={() => setShowGradientBuilder(false)}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div className="bg-color-group">
                  <label>Font Family</label>
                  <p className="form-hint">Choose a font style for the entire dashboard</p>
                  <div className="font-presets">
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'DM Sans' || !customization.branding.fontFamily ? 'selected' : ''}`}
                      onClick={() => handleBrandingUpdate({ fontFamily: 'DM Sans' })}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      DM Sans
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Inter' ? 'selected' : ''}`}
                      onClick={() => handleBrandingUpdate({ fontFamily: 'Inter' })}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Inter
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Roboto' ? 'selected' : ''}`}
                      onClick={() => handleBrandingUpdate({ fontFamily: 'Roboto' })}
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      Roboto
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Open Sans' ? 'selected' : ''}`}
                      onClick={() => handleBrandingUpdate({ fontFamily: 'Open Sans' })}
                      style={{ fontFamily: "'Open Sans', sans-serif" }}
                    >
                      Open Sans
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Lato' ? 'selected' : ''}`}
                      onClick={() => handleBrandingUpdate({ fontFamily: 'Lato' })}
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Lato
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Poppins' ? 'selected' : ''}`}
                      onClick={() => handleBrandingUpdate({ fontFamily: 'Poppins' })}
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      Poppins
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Source Sans Pro' ? 'selected' : ''}`}
                      onClick={() => handleBrandingUpdate({ fontFamily: 'Source Sans Pro' })}
                      style={{ fontFamily: "'Source Sans Pro', sans-serif" }}
                    >
                      Source Sans
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Nunito' ? 'selected' : ''}`}
                      onClick={() => handleBrandingUpdate({ fontFamily: 'Nunito' })}
                      style={{ fontFamily: "'Nunito', sans-serif" }}
                    >
                      Nunito
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation Section */}
        {activeSection === 'navigation' && (
          <div className="customization-section">
            <div className="section-card">
              <h3><LayoutDashboard size={18} /> Sidebar Tabs</h3>
              <p className="section-desc">Drag to reorder, toggle to show/hide, change icons, and rename tabs as needed.</p>
              
              <div className="tabs-list">
                {[...customization.navigation.tabs]
                  .filter(tab => tab.id !== 'metrics')
                  .sort((a, b) => a.order - b.order)
                  .map((tab, index) => {
                    const IconComponent = iconMap[tab.icon] || LayoutDashboard;
                    const availableIcons = [
                      { name: 'LayoutDashboard', icon: LayoutDashboard },
                      { name: 'Users', icon: Users },
                      { name: 'MessageSquare', icon: MessageSquare },
                      { name: 'Mail', icon: Mail },
                      { name: 'FileText', icon: FileText },
                      { name: 'Heart', icon: Heart },
                      { name: 'DollarSign', icon: DollarSign },
                      { name: 'Activity', icon: Activity },
                      { name: 'Target', icon: Target },
                      { name: 'TrendingUp', icon: TrendingUp },
                      { name: 'Calendar', icon: Calendar },
                      { name: 'Clock', icon: Clock },
                      { name: 'CheckCircle', icon: CheckCircle },
                      { name: 'Star', icon: Star },
                      { name: 'Lightbulb', icon: Lightbulb },
                      { name: 'Settings', icon: Settings },
                      { name: 'BarChart2', icon: BarChart2 },
                      { name: 'PieChart', icon: PieChart },
                      { name: 'Bell', icon: Bell },
                      { name: 'Shield', icon: Shield },
                      { name: 'Award', icon: Award },
                      { name: 'Briefcase', icon: Briefcase },
                      { name: 'Pill', icon: Pill },
                      { name: 'Smartphone', icon: Smartphone },
                      { name: 'HeartPulse', icon: HeartPulse },
                      { name: 'Stethoscope', icon: Stethoscope },
                      { name: 'Sparkles', icon: Sparkles },
                      { name: 'Zap', icon: Zap },
                      { name: 'Layers', icon: Layers },
                      { name: 'AlertCircle', icon: AlertCircle },
                      { name: 'Send', icon: Send },
                    ];
                    return (
                      <div 
                        key={tab.id}
                        className={`tab-item ${draggedTab?.id === tab.id ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleTabDragStart(e, tab)}
                        onDragOver={(e) => handleTabDragOver(e, tab)}
                        onDragEnd={handleTabDragEnd}
                      >
                        <div className="tab-drag-handle">
                          <GripVertical size={16} />
                        </div>
                        <div className="tab-icon-picker">
                          <div className="tab-icon-current">
                            <IconComponent size={18} />
                          </div>
                          <select 
                            className="tab-icon-select"
                            value={tab.icon}
                            onChange={(e) => updateTab(tab.id, { icon: e.target.value })}
                            title="Change icon"
                          >
                            {availableIcons.map(iconOpt => (
                              <option key={iconOpt.name} value={iconOpt.name}>{iconOpt.name.replace(/([A-Z])/g, ' $1').trim()}</option>
                            ))}
                          </select>
                        </div>
                        <input
                          type="text"
                          className="tab-label-input"
                          value={tab.label}
                          onChange={(e) => updateTab(tab.id, { label: e.target.value })}
                        />
                        {tab.isCustom && (
                          <span style={{
                            padding: '2px 8px',
                            background: '#f59e0b',
                            color: 'white',
                            borderRadius: '4px',
                            fontSize: '11px',
                            fontWeight: '600',
                            textTransform: 'uppercase',
                            letterSpacing: '0.5px'
                          }}>
                            Custom
                          </span>
                        )}
                        <div className="tab-actions">
                          <button
                            className="move-btn"
                            onClick={() => moveTab(tab.id, 'up')}
                            disabled={index === 0}
                          >
                            <ChevronUp size={16} />
                          </button>
                          <button
                            className="move-btn"
                            onClick={() => moveTab(tab.id, 'down')}
                            disabled={index === customization.navigation.tabs.length - 1}
                          >
                            <ChevronDown size={16} />
                          </button>
                          <button
                            className={`toggle-btn ${tab.enabled ? 'enabled' : 'disabled'}`}
                            onClick={() => updateTab(tab.id, { enabled: !tab.enabled })}
                          >
                            {tab.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                          </button>
                          {tab.isCustom && (
                            <button
                              className="delete-btn"
                              onClick={() => handleDeleteTabClick(tab)}
                              style={{
                                padding: '6px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '6px',
                                cursor: 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                transition: 'background 0.2s'
                              }}
                              title="Delete custom tab"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
              <button
                className="add-section-btn"
                onClick={() => setShowAddTabModal(true)}
                style={{ marginTop: '16px', width: '100%' }}
              >
                <Plus size={18} /> Add New Tab
              </button>
            </div>
          </div>
        )}

        {/* Live Preview */}
        <div className="customization-preview">
          <h3>Live Preview</h3>
          <div className="preview-container">
            <div className="preview-sidebar" style={{ background: customization.branding.sidebarBg }}>
              <div className="preview-logo">
                {customization.branding.logoMode === 'full-image' && logoPreview ? (
                  <img src={logoPreview} alt="Logo" style={{ maxHeight: 28, maxWidth: 120, objectFit: 'contain' }} />
                ) : customization.branding.logoMode === 'icon-text' && logoPreview ? (
                  <>
                    <img src={logoPreview} alt="" style={{ width: 16, height: 16, objectFit: 'contain', borderRadius: 3 }} />
                    <span style={{ color: customization.branding.sidebarTextColor || '#ffffff', fontSize: 11, fontWeight: 600, fontFamily: `'${customization.branding.fontFamily || 'DM Sans'}', sans-serif` }}>{customization.branding.platformName}</span>
                  </>
                ) : (
                  <>
                    <div className="preview-logo-icon" style={{ background: customization.branding.primaryColor }}>
                      <Shield size={10} color="white" />
                    </div>
                    <span style={{ color: customization.branding.sidebarTextColor || '#ffffff', fontSize: 11, fontWeight: 600, fontFamily: `'${customization.branding.fontFamily || 'DM Sans'}', sans-serif` }}>{customization.branding.platformName}</span>
                  </>
                )}
              </div>
              <div className="preview-nav">
                {getEnabledTabs().slice(0, 5).map((tab, i) => (
                <div 
                  key={tab.id} 
                  className={`preview-nav-item ${i === 0 ? 'active-preview' : ''}`}
                  style={{ 
                    background: i === 0 ? 'rgba(255,255,255,0.2)' : 'transparent',
                    borderLeft: i === 0 ? `2px solid white` : '2px solid transparent'
                  }}
                >
                  <span style={{ color: i === 0 ? '#ffffff' : `${customization.branding.sidebarTextColor || '#ffffff'}99`, fontSize: 10, fontWeight: i === 0 ? 600 : 400 }}>
                    {tab.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
          
          {/* Page Content Preview */}
          <div className="preview-content-area">
            <div className="preview-header" style={{ borderBottom: `2px solid ${customization.branding.primaryColor}` }}>
              <span style={{ fontSize: 10, fontWeight: 600, color: customization.branding.primaryColor, fontFamily: `'${customization.branding.fontFamily || 'DM Sans'}', sans-serif` }}>{customization.branding.platformName}</span>
            </div>
          </div>
        </div>
        
        {/* Slide Preview */}
        <div className="preview-slide-section">
          <h4>Presentation Slide</h4>
          <div className="preview-slide-mini" style={{ background: customization.branding.slideBg }}>
            <div className="preview-slide-content">
              <span style={{ color: 'white', fontSize: 10, fontWeight: 600, fontFamily: `'${customization.branding.fontFamily || 'DM Sans'}', sans-serif` }}>{customization.branding.platformName}</span>
              <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 8 }}>Performance Report</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    </div>
  );
}

// ============================================================
// NOTIFICATIONS & ALERTS PAGE
// ============================================================

// Label definitions for notifications (must be outside component)
const ADMIN_REMINDER_LABELS = {
  clientMeetings: { label: 'Client Meetings', description: 'Get reminded before scheduled client meetings' },
  csmOneOnOnes: { label: '1:1s with CSMs', description: 'Reminders for one-on-one meetings with team members' },
  actionItems: { label: 'Action Items Due', description: 'Alerts when action items are approaching their deadline' },
  weeklyDigest: { label: 'Weekly Team Digest', description: 'Weekly summary of team performance and upcoming tasks', hasDayOfWeek: true },
  teamPerformanceAlerts: { label: 'Team Performance Alerts', description: 'Notifications when team metrics need attention' },
};

const CSM_REMINDER_LABELS = {
  clientMeetings: { label: 'Client Meetings', description: 'Get reminded before scheduled client meetings' },
  meetingPrep: { label: 'Meeting Preparation', description: 'Reminder to prepare materials before client meetings' },
  actionItems: { label: 'Action Items Due', description: 'Alerts when your action items are approaching deadline' },
  managerOneOnOnes: { label: '1:1s with Manager', description: 'Reminders for one-on-one meetings with your manager' },
  followUpReminders: { label: 'Client Follow-ups', description: 'Reminders to follow up with clients after meetings' },
  monthlyReviewPrep: { label: 'Monthly Review Prep', description: 'Reminder to prepare for monthly client reviews' },
};

// Comparison type definitions for alerts
const COMPARISON_TYPES = {
  'previous-month': {
    id: 'previous-month',
    label: 'Previous Month',
    shortLabel: 'vs Last Month',
    description: 'Compare to the same metric from last month',
    icon: 'Calendar',
    requiresHistory: 1, // Months of history needed
  },
  'previous-quarter': {
    id: 'previous-quarter',
    label: 'Previous Quarter',
    shortLabel: 'vs Last Quarter',
    description: 'Compare to the average of the previous 3 months',
    icon: 'Calendar',
    requiresHistory: 3,
  },
  'vs-target': {
    id: 'vs-target',
    label: 'vs Target',
    shortLabel: 'vs Target',
    description: 'Compare against a defined target value',
    icon: 'Target',
    requiresTarget: true,
    requiresHistory: 0,
  },
  'rolling-average': {
    id: 'rolling-average',
    label: 'Rolling Average (3mo)',
    shortLabel: 'vs 3mo Avg',
    description: 'Compare to 3-month rolling average',
    icon: 'TrendingUp',
    requiresHistory: 3,
  },
  'rolling-average-6': {
    id: 'rolling-average-6',
    label: 'Rolling Average (6mo)',
    shortLabel: 'vs 6mo Avg',
    description: 'Compare to 6-month rolling average',
    icon: 'TrendingUp',
    requiresHistory: 6,
  },
  'seasonal-baseline': {
    id: 'seasonal-baseline',
    label: 'Seasonal Baseline',
    shortLabel: 'vs Same Month Last Year',
    description: 'Compare to the same month from the previous year (YoY)',
    icon: 'Repeat',
    requiresHistory: 12,
    enterpriseOnly: true,
  },
  'year-over-year': {
    id: 'year-over-year',
    label: 'Year over Year',
    shortLabel: 'YoY',
    description: 'Compare to same period last year',
    icon: 'Calendar',
    requiresHistory: 12,
    enterpriseOnly: true,
  },
};

const ALERT_LABELS = {
  metricDips: { 
    label: 'Metric Dips', 
    description: 'Alert when selected metrics drop below threshold', 
    hasThreshold: true, 
    thresholdLabel: 'Decrease %',
    hasMetricSelector: true,
    metricSelectorLabel: 'Monitor these metrics',
    hasComparisonType: true, // Enable comparison type selector
  },
  crossSellOpportunities: { label: 'Cross-sell Opportunities', description: 'Notify when cross-sell opportunities are identified' },
  upsellOpportunities: { label: 'Upsell Opportunities', description: 'Notify when upsell opportunities are identified' },
  campaignLaunched: { label: 'Campaign Launched', description: 'Alert when a new campaign goes live' },
  clientInactivity: { label: 'Client Inactivity', description: "Alert when a client hasn't logged in", hasThreshold: true, thresholdLabel: 'Days', thresholdKey: 'daysThreshold' },
  milestones: { 
    label: 'Milestone Reached', 
    description: 'Celebrate when targets are reached',
    hasMetricSelector: true,
    metricSelectorLabel: 'Milestone metrics',
    hasTargetInput: true, // Show target value input per metric
  },
  metricGrowth: { 
    label: 'Significant Growth', 
    description: 'Alert on major metric increases', 
    hasThreshold: true, 
    thresholdLabel: 'Growth %',
    hasMetricSelector: true,
    metricSelectorLabel: 'Monitor these metrics',
    hasComparisonType: true,
  },
  outcomeAlerts: { 
    label: 'Outcome Changes', 
    description: 'Notify when outcomes show significant change',
    hasThreshold: true,
    thresholdLabel: 'Change %',
    hasMetricSelector: true,
    metricSelectorLabel: 'Outcome metrics',
    hasComparisonType: true,
  },
};

const WORKFLOW_LABELS = {
  monthlyReportToClients: { label: 'Monthly Report to Clients', description: 'Auto-send monthly performance report before review calls', icon: FileText },
  quarterlyReportToClients: { label: 'Quarterly Report to Clients', description: 'Auto-send quarterly business review report', icon: FileText },
  weeklyInternalReport: { label: 'Weekly Internal Report', description: 'Send weekly summary to team members', icon: Users },
  clientMeetingReminder: { label: 'Client Meeting Reminder', description: 'Auto-send meeting reminder with agenda to clients', icon: Calendar },
};

// Standalone NotificationToggle component
function NotificationToggleItem({ category, itemKey, item, labels, onDelete, onUpdate, availableMetrics = {} }) {
  const [isEditing, setIsEditing] = useState(false);
  const [editLabel, setEditLabel] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  
  const defaultInfo = labels[itemKey] || {};
  const info = item.isCustom ? { 
    label: item.label || 'Custom Reminder', 
    description: item.description || '',
    hasThreshold: item.threshold !== undefined,
    thresholdLabel: 'Threshold',
    hasDayOfWeek: item.dayOfWeek !== undefined
  } : defaultInfo;
  
  useEffect(() => {
    setEditLabel(info.label || '');
    setEditDesc(info.description || '');
  }, [info.label, info.description]);
  
  if (!info.label) return null;
  
  const handleSaveEdit = () => {
    onUpdate(category, itemKey, { label: editLabel, description: editDesc });
    setIsEditing(false);
  };

  const handleMetricToggle = (metricId) => {
    const currentMetrics = item.monitoredMetrics || [];
    const newMetrics = currentMetrics.includes(metricId)
      ? currentMetrics.filter(m => m !== metricId)
      : [...currentMetrics, metricId];
    onUpdate(category, itemKey, { monitoredMetrics: newMetrics });
  };

  // Get metrics grouped by category for the selector - only include alertable metrics
  const getMetricsByCategory = () => {
    const groups = {};
    Object.entries(availableMetrics).forEach(([id, metric]) => {
      // Only include metrics that are alertable and comparable
      if (metric.isAlertable === false || metric.isComparable === false) return;
      
      const cat = metric.category || 'other';
      if (!groups[cat]) groups[cat] = [];
      groups[cat].push({ id, ...metric });
    });
    return groups;
  };
  
  // Get count of alertable metrics
  const alertableMetricsCount = Object.values(availableMetrics).filter(
    m => m.isAlertable !== false && m.isComparable !== false
  ).length;
  
  return (
    <div className={`notification-item ${item.isCustom ? 'custom-item' : ''}`}>
      <div className="notification-item-header">
        <div className="notification-item-info">
          {isEditing ? (
            <div className="notification-edit-form">
              <input 
                type="text" 
                value={editLabel} 
                onChange={(e) => setEditLabel(e.target.value)}
                placeholder="Reminder name"
                className="notification-edit-input"
              />
              <input 
                type="text" 
                value={editDesc} 
                onChange={(e) => setEditDesc(e.target.value)}
                placeholder="Description"
                className="notification-edit-input small"
              />
              <div className="notification-edit-actions">
                <button className="save-edit-btn" onClick={handleSaveEdit}><CheckCircle size={14} /> Save</button>
                <button className="cancel-edit-btn" onClick={() => setIsEditing(false)}><X size={14} /> Cancel</button>
              </div>
            </div>
          ) : (
            <>
              <h4>
                {info.label}
                {item.isCustom && (
                  <button className="edit-reminder-btn" onClick={() => setIsEditing(true)} title="Edit">
                    <Edit3 size={14} />
                  </button>
                )}
              </h4>
              <p>{info.description}</p>
            </>
          )}
        </div>
        <div className="notification-item-controls">
          {item.isCustom && onDelete && (
            <button 
              className="delete-reminder-btn"
              onClick={() => onDelete(category, itemKey)}
              title="Delete reminder"
            >
              <Trash2 size={16} />
            </button>
          )}
          <button 
            className={`master-toggle ${item.enabled ? 'enabled' : ''}`}
            onClick={() => onUpdate(category, itemKey, { enabled: !item.enabled })}
            type="button"
          >
            {item.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
          </button>
        </div>
      </div>
      
      {item.enabled && (
        <div className="notification-item-options">
          <div className="notification-channels">
            <label className="channel-toggle">
              <input 
                type="checkbox" 
                checked={item.inApp || false}
                onChange={(e) => onUpdate(category, itemKey, { inApp: e.target.checked })}
              />
              <Bell size={16} />
              <span>In-App</span>
            </label>
            <label className="channel-toggle">
              <input 
                type="checkbox" 
                checked={item.email || false}
                onChange={(e) => onUpdate(category, itemKey, { email: e.target.checked })}
              />
              <Mail size={16} />
              <span>Email</span>
            </label>
          </div>
          
          {item.advanceHours !== undefined && (
            <div className="notification-timing">
              <label>Remind me</label>
              <select 
                value={item.advanceHours}
                onChange={(e) => onUpdate(category, itemKey, { advanceHours: parseInt(e.target.value) })}
              >
                <option value={1}>1 hour before</option>
                <option value={2}>2 hours before</option>
                <option value={4}>4 hours before</option>
                <option value={12}>12 hours before</option>
                <option value={24}>24 hours before</option>
                <option value={48}>48 hours before</option>
                <option value={72}>72 hours before</option>
              </select>
            </div>
          )}
          
          {item.advanceDays !== undefined && (
            <div className="notification-timing">
              <label>Remind me</label>
              <select 
                value={item.advanceDays}
                onChange={(e) => onUpdate(category, itemKey, { advanceDays: parseInt(e.target.value) })}
              >
                <option value={1}>1 day before</option>
                <option value={2}>2 days before</option>
                <option value={3}>3 days before</option>
                <option value={5}>5 days before</option>
                <option value={7}>1 week before</option>
              </select>
            </div>
          )}

          {info.hasDayOfWeek && (
            <div className="notification-timing">
              <label>Send on</label>
              <select 
                value={item.dayOfWeek || 'monday'}
                onChange={(e) => onUpdate(category, itemKey, { dayOfWeek: e.target.value })}
              >
                <option value="monday">Monday</option>
                <option value="tuesday">Tuesday</option>
                <option value="wednesday">Wednesday</option>
                <option value="thursday">Thursday</option>
                <option value="friday">Friday</option>
              </select>
            </div>
          )}
          
          {info.hasThreshold && (
            <div className="notification-threshold">
              <label>{info.thresholdLabel}</label>
              <input 
                type="number" 
                value={item[info.thresholdKey || 'threshold'] || item.threshold || 10}
                onChange={(e) => onUpdate(category, itemKey, { [info.thresholdKey || 'threshold']: parseInt(e.target.value) })}
                min={1}
                max={info.thresholdKey === 'daysThreshold' ? 365 : 100}
              />
            </div>
          )}

          {/* Comparison Type Selector */}
          {info.hasComparisonType && (
            <div className="comparison-type-section">
              <label>Compare against</label>
              <select 
                className="comparison-type-select"
                value={item.comparisonType || 'previous-month'}
                onChange={(e) => onUpdate(category, itemKey, { comparisonType: e.target.value })}
              >
                {Object.entries(COMPARISON_TYPES).map(([key, type]) => (
                  <option 
                    key={key} 
                    value={key}
                    disabled={type.enterpriseOnly}
                  >
                    {type.label}{type.enterpriseOnly ? ' (Enterprise)' : ''}
                  </option>
                ))}
              </select>
              <span className="comparison-type-description">
                {COMPARISON_TYPES[item.comparisonType || 'previous-month']?.description}
              </span>
              {/* Show target input if comparison type requires it */}
              {item.comparisonType === 'vs-target' && (
                <div className="target-value-input">
                  <label>Target Value</label>
                  <input 
                    type="number"
                    value={item.targetValue || ''}
                    onChange={(e) => onUpdate(category, itemKey, { targetValue: parseFloat(e.target.value) || 0 })}
                    placeholder="Enter target value"
                  />
                </div>
              )}
            </div>
          )}

          {/* Metric Selector for alerts that monitor specific metrics */}
          {info.hasMetricSelector && alertableMetricsCount > 0 && (
            <div className="metric-selector-section">
              <div className="metric-selector-header" onClick={() => setShowMetricSelector(!showMetricSelector)}>
                <label>{info.metricSelectorLabel || 'Monitor these metrics'}</label>
                <div className="selected-metrics-preview">
                  {(item.monitoredMetrics || []).length > 0 ? (
                    <span className="metrics-count">{(item.monitoredMetrics || []).length} selected</span>
                  ) : (
                    <span className="no-metrics">None selected</span>
                  )}
                  {showMetricSelector ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                </div>
              </div>
              
              {showMetricSelector && (
                <div className="metric-selector-dropdown">
                  <p className="metric-selector-hint">Only metrics that can be compared over time are shown</p>
                  {Object.entries(getMetricsByCategory()).map(([category, metrics]) => (
                    <div key={category} className="metric-category-group">
                      <div className="metric-category-label">{category.charAt(0).toUpperCase() + category.slice(1)}</div>
                      {metrics.map(metric => (
                        <label key={metric.id} className="metric-checkbox">
                          <input
                            type="checkbox"
                            checked={(item.monitoredMetrics || []).includes(metric.id)}
                            onChange={() => handleMetricToggle(metric.id)}
                          />
                          <span className="metric-name">{metric.label}</span>
                          <span className="metric-format">
                            ({metric.format}{metric.directionality === 'down-is-good' ? ', ↓ is good' : ''})
                          </span>
                        </label>
                      ))}
                    </div>
                  ))}
                </div>
              )}

              {/* Show selected metrics as tags */}
              {(item.monitoredMetrics || []).length > 0 && !showMetricSelector && (
                <div className="selected-metrics-tags">
                  {(item.monitoredMetrics || []).map(metricId => {
                    const metric = availableMetrics[metricId];
                    return metric ? (
                      <span key={metricId} className="metric-tag">
                        {metric.shortLabel || metric.label}
                        <button onClick={() => handleMetricToggle(metricId)} className="remove-metric">
                          <X size={12} />
                        </button>
                      </span>
                    ) : null;
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Standalone WorkflowToggle component
function WorkflowToggleItem({ workflowKey, workflow, onUpdate }) {
  const info = WORKFLOW_LABELS[workflowKey];
  if (!info || !workflow) return null;
  const IconComponent = info.icon || FileText;
  
  return (
    <div className="workflow-item">
      <div className="workflow-item-header">
        <div className="workflow-icon">
          <IconComponent size={20} />
        </div>
        <div className="workflow-item-info">
          <h4>{info.label}</h4>
          <p>{info.description}</p>
        </div>
        <button 
          className={`master-toggle ${workflow.enabled ? 'enabled' : ''}`}
          onClick={() => onUpdate(workflowKey, { enabled: !workflow.enabled })}
          type="button"
        >
          {workflow.enabled ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
        </button>
      </div>
      
      {workflow.enabled && (
        <div className="workflow-item-options">
          <div className="workflow-option-row">
            <label className="channel-toggle">
              <input 
                type="checkbox" 
                checked={workflow.sendEmail || false}
                onChange={(e) => onUpdate(workflowKey, { sendEmail: e.target.checked })}
              />
              <Mail size={16} />
              <span>Send Email</span>
            </label>
            
            {workflow.advanceDays !== undefined && (
              <div className="notification-timing">
                <label>Send</label>
                <select 
                  value={workflow.advanceDays}
                  onChange={(e) => onUpdate(workflowKey, { advanceDays: parseInt(e.target.value) })}
                >
                  <option value={1}>1 day before</option>
                  <option value={2}>2 days before</option>
                  <option value={3}>3 days before</option>
                  <option value={5}>5 days before</option>
                  <option value={7}>1 week before</option>
                </select>
              </div>
            )}

            {workflow.dayOfWeek !== undefined && (
              <div className="notification-timing">
                <label>Send on</label>
                <select 
                  value={workflow.dayOfWeek}
                  onChange={(e) => onUpdate(workflowKey, { dayOfWeek: e.target.value })}
                >
                  <option value="monday">Monday</option>
                  <option value="tuesday">Tuesday</option>
                  <option value="wednesday">Wednesday</option>
                  <option value="thursday">Thursday</option>
                  <option value="friday">Friday</option>
                </select>
              </div>
            )}
          </div>

          {workflow.includeKPIs !== undefined && (
            <div className="workflow-checkboxes">
              <label className="workflow-checkbox">
                <input 
                  type="checkbox" 
                  checked={workflow.includeKPIs || false}
                  onChange={(e) => onUpdate(workflowKey, { includeKPIs: e.target.checked })}
                />
                <span>Include KPIs</span>
              </label>
              <label className="workflow-checkbox">
                <input 
                  type="checkbox" 
                  checked={workflow.includeOutcomes || false}
                  onChange={(e) => onUpdate(workflowKey, { includeOutcomes: e.target.checked })}
                />
                <span>Include Outcomes</span>
              </label>
              <label className="workflow-checkbox">
                <input 
                  type="checkbox" 
                  checked={workflow.includeFinancial || false}
                  onChange={(e) => onUpdate(workflowKey, { includeFinancial: e.target.checked })}
                />
                <span>Include Financial</span>
              </label>
            </div>
          )}

          {workflow.includeAgenda !== undefined && (
            <div className="workflow-checkboxes">
              <label className="workflow-checkbox">
                <input 
                  type="checkbox" 
                  checked={workflow.includeAgenda || false}
                  onChange={(e) => onUpdate(workflowKey, { includeAgenda: e.target.checked })}
                />
                <span>Include Agenda</span>
              </label>
              <label className="workflow-checkbox">
                <input 
                  type="checkbox" 
                  checked={workflow.includeReportPreview || false}
                  onChange={(e) => onUpdate(workflowKey, { includeReportPreview: e.target.checked })}
                />
                <span>Include Report Preview</span>
              </label>
            </div>
          )}

          {workflow.customMessage !== undefined && (
            <div className="workflow-message">
              <label>Custom Message</label>
              <textarea 
                value={workflow.customMessage}
                onChange={(e) => onUpdate(workflowKey, { customMessage: e.target.value })}
                placeholder="Enter a custom message to include..."
                rows={2}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Standalone AlertPreviewItem component
function AlertPreviewItem({ alert, onDismiss, onSnooze }) {
  const [showSnoozeMenu, setShowSnoozeMenu] = useState(false);
  
  const typeClasses = {
    opportunity: 'opportunity',
    warning: 'warning',
    info: 'info',
    inactive: 'inactive'
  };
  
  const typeIcons = {
    opportunity: Target,
    warning: AlertTriangle,
    info: Activity,
    inactive: Clock
  };
  
  const IconComponent = typeIcons[alert.type] || AlertCircle;
  
  return (
    <div className={`alert-preview-item ${typeClasses[alert.type] || ''}`}>
      <IconComponent size={18} />
      <div className="alert-preview-content">
        <strong>{alert.title}</strong>
        <p>{alert.message}</p>
        <span className="alert-time">{alert.time}</span>
      </div>
      <div className="alert-actions">
        <div className="snooze-dropdown">
          <button 
            className="alert-action-btn snooze"
            onClick={(e) => { e.stopPropagation(); setShowSnoozeMenu(!showSnoozeMenu); }}
            title="Snooze"
          >
            <Clock size={14} />
          </button>
          {showSnoozeMenu && (
            <div className="snooze-menu">
              <button onClick={() => { onSnooze(alert.id, 1); setShowSnoozeMenu(false); }}>1 hour</button>
              <button onClick={() => { onSnooze(alert.id, 4); setShowSnoozeMenu(false); }}>4 hours</button>
              <button onClick={() => { onSnooze(alert.id, 24); setShowSnoozeMenu(false); }}>1 day</button>
              <button onClick={() => { onSnooze(alert.id, 168); setShowSnoozeMenu(false); }}>1 week</button>
            </div>
          )}
        </div>
        <button 
          className="alert-action-btn dismiss"
          onClick={() => onDismiss(alert.id)}
          title="Dismiss"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}

function NotificationsPage() {
  const { currentUser, hasPermission, logPHIAccess } = useAuth();
  const { customization, updateNotification, updateWorkflow, getNotifications, dismissAlert, snoozeAlert, getActiveAlerts, addReminder, deleteReminder, addSmartAlert, deleteSmartAlert, addAlert } = useCustomization();
  
  // Notifications page is internal-only - clients should not access
  if (!hasPermission('edit_data')) {
    return (
      <div className="access-denied">
        <Lock size={48} />
        <h2>Access Denied</h2>
        <p>Notifications are for internal use only.</p>
      </div>
    );
  }
  
  const notifications = getNotifications();
  const isAdmin = currentUser?.role === 'admin';
  const [activeTab, setActiveTab] = useState('reminders');
  const [showAddReminderModal, setShowAddReminderModal] = useState(false);
  const [showAddAlertModal, setShowAddAlertModal] = useState(false);
  const [newReminder, setNewReminder] = useState({ label: '', description: '', advanceHours: 24 });
  const [newAlert, setNewAlert] = useState({ label: '', description: '', threshold: 10 });
  
  // Get alerts from context
  const allAlerts = customization.activeAlerts || [];
  const activeAlertsList = allAlerts.filter(a => a.status === 'active');
  const snoozedAlerts = allAlerts.filter(a => a.status === 'snoozed');
  
  useEffect(() => {
    logPHIAccess(AUDIT_ACTIONS.SETTINGS_CHANGE, { 
      resource: 'notifications_page',
      action: 'viewed_notification_settings'
    });
  }, []);

  const handleDismissAlert = (alertId) => {
    dismissAlert(alertId);
  };

  const handleSnoozeAlert = (alertId, hours) => {
    snoozeAlert(alertId, hours);
  };

  const handleTestAlert = () => {
    const testTypes = ['opportunity', 'warning', 'info', 'inactive'];
    const testMessages = [
      { type: 'opportunity', title: 'New Opportunity!', message: 'Client engagement is up 25% - great time for expansion discussion' },
      { type: 'warning', title: 'Attention Needed', message: 'Monthly metrics are below target for this client' },
      { type: 'info', title: 'Update Available', message: 'New report features have been released' },
      { type: 'inactive', title: 'Inactivity Alert', message: 'A client has not logged in recently' },
    ];
    const randomAlert = testMessages[Math.floor(Math.random() * testMessages.length)];
    addAlert({
      ...randomAlert,
      time: 'Just now'
    });
  };

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1 className="page-title">
          <Bell size={28} />
          Notifications & Alerts
        </h1>
      </div>

      <div className="notifications-tabs">
        <button 
          className={`notif-tab ${activeTab === 'reminders' ? 'active' : ''}`}
          onClick={() => setActiveTab('reminders')}
        >
          <BellRing size={18} />
          Reminders
        </button>
        <button 
          className={`notif-tab ${activeTab === 'alerts' ? 'active' : ''}`}
          onClick={() => setActiveTab('alerts')}
        >
          <Zap size={18} />
          Smart Alerts
        </button>
        <button 
          className={`notif-tab ${activeTab === 'workflows' ? 'active' : ''}`}
          onClick={() => setActiveTab('workflows')}
        >
          <RefreshCw size={18} />
          Automated Workflows
        </button>
      </div>

      <div className="notifications-layout">
        {/* Reminders Tab */}
        {activeTab === 'reminders' && (
          <>
            <div className="notifications-section">
              <div className="section-header">
                <BellRing size={20} />
                <h2>{isAdmin ? 'Admin Reminders' : 'Your Reminders'}</h2>
                <button 
                  className="add-reminder-btn"
                  onClick={() => setShowAddReminderModal(true)}
                >
                  <Plus size={16} />
                  Add Reminder
                </button>
              </div>
              <p className="section-desc">
                Configure automated reminders for meetings, tasks, and important events.
              </p>
              
              <div className="notifications-list">
                {isAdmin ? (
                  Object.entries(notifications.adminReminders || {}).map(([key, item]) => (
                    <NotificationToggleItem 
                      key={key} 
                      category="adminReminders" 
                      itemKey={key} 
                      item={item} 
                      labels={ADMIN_REMINDER_LABELS}
                      onDelete={deleteReminder}
                      onUpdate={updateNotification}
                    />
                  ))
                ) : (
                  Object.entries(notifications.csmReminders || {}).map(([key, item]) => (
                    <NotificationToggleItem 
                      key={key} 
                      category="csmReminders" 
                      itemKey={key} 
                      item={item} 
                      labels={CSM_REMINDER_LABELS}
                      onDelete={deleteReminder}
                      onUpdate={updateNotification}
                    />
                  ))
                )}
              </div>
            </div>

            {isAdmin && (
              <div className="notifications-section">
                <div className="section-header">
                  <UserCog size={20} />
                  <h2>CSM Default Reminders</h2>
                </div>
                <p className="section-desc">
                  Set default reminder preferences for your CSM team.
                </p>
                
                <div className="notifications-list">
                  {Object.entries(notifications.csmReminders || {}).map(([key, item]) => (
                    <NotificationToggleItem 
                      key={key} 
                      category="csmReminders" 
                      itemKey={key} 
                      item={item} 
                      labels={CSM_REMINDER_LABELS}
                      onUpdate={updateNotification}
                    />
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Alerts Tab */}
        {activeTab === 'alerts' && (
          <>
            <div className="notifications-section">
              <div className="section-header">
                <Zap size={20} />
                <h2>Smart Alerts Configuration</h2>
                <button 
                  className="add-reminder-btn"
                  onClick={() => setShowAddAlertModal(true)}
                >
                  <Plus size={16} />
                  Add Alert
                </button>
              </div>
              <p className="section-desc">
                Get notified about important changes, opportunities, and events.
              </p>
              
              <div className="notifications-list">
                {Object.entries(notifications.alerts || {}).map(([key, item]) => (
                  <NotificationToggleItem 
                    key={key} 
                    category="alerts" 
                    itemKey={key} 
                    item={item} 
                    labels={ALERT_LABELS}
                    onDelete={(cat, k) => deleteSmartAlert(k)}
                    onUpdate={updateNotification}
                    availableMetrics={customization.metrics || {}}
                  />
                ))}
              </div>
            </div>

            <div className="alerts-preview-section">
              <div className="alerts-preview-header">
                <div>
                  <h3>Active Alerts</h3>
                  <p className="section-desc">Snooze or dismiss alerts as needed</p>
                </div>
                <button className="test-alert-btn" onClick={handleTestAlert}>
                  <Zap size={14} />
                  Test Alert
                </button>
              </div>
              <div className="alerts-preview-list">
                {activeAlertsList.map(alert => (
                  <AlertPreviewItem 
                    key={alert.id} 
                    alert={alert} 
                    onDismiss={handleDismissAlert}
                    onSnooze={handleSnoozeAlert}
                  />
                ))}
                {activeAlertsList.length === 0 && (
                  <div className="no-alerts">
                    <CheckCircle size={24} />
                    <p>All caught up! No active alerts.</p>
                  </div>
                )}
              </div>
              
              {snoozedAlerts.length > 0 && (
                <>
                  <h4 className="snoozed-header">Snoozed ({snoozedAlerts.length})</h4>
                  <div className="snoozed-alerts">
                    {snoozedAlerts.map(alert => (
                      <div key={alert.id} className="snoozed-item">
                        <span>{alert.title}</span>
                        <span className="snoozed-time">Snoozed until later</span>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </>
        )}

        {/* Workflows Tab */}
        {activeTab === 'workflows' && (
          <div className="notifications-section full-width">
            <div className="section-header">
              <RefreshCw size={20} />
              <h2>Automated Report Generation & Workflows</h2>
            </div>
            <p className="section-desc">
              Set up automated reports and reminders to be sent to clients before scheduled meetings.
            </p>
            
            <div className="workflows-list">
              {Object.entries(notifications.automatedWorkflows || {}).map(([key, workflow]) => (
                <WorkflowToggleItem 
                  key={key} 
                  workflowKey={key} 
                  workflow={workflow}
                  onUpdate={updateWorkflow}
                />
              ))}
            </div>

            <div className="workflow-info-card">
              <div className="workflow-info-icon">
                <HelpCircle size={20} />
              </div>
              <div className="workflow-info-content">
                <h4>How Automated Workflows Work</h4>
                <ul>
                  <li>Reports are automatically generated using the latest data from your dashboard</li>
                  <li>Emails are sent to client contacts at the configured time before meetings</li>
                  <li>Reports include your custom branding, logo, and platform name</li>
                  <li>You can customize the message included with each report type</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Add Reminder Modal */}
      {showAddReminderModal && (
        <div className="modal-overlay" onClick={() => setShowAddReminderModal(false)}>
          <div className="modal add-notification-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><BellRing size={20} /> Add Custom Reminder</h2>
              <button className="modal-close" onClick={() => setShowAddReminderModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Reminder Name</label>
                <input 
                  type="text"
                  value={newReminder.label}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Weekly Check-in"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text"
                  value={newReminder.description}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Reminder to check in with clients weekly"
                />
              </div>
              <div className="form-group">
                <label>Advance Notice</label>
                <select 
                  value={newReminder.advanceHours}
                  onChange={(e) => setNewReminder(prev => ({ ...prev, advanceHours: parseInt(e.target.value) }))}
                >
                  <option value={1}>1 hour before</option>
                  <option value={2}>2 hours before</option>
                  <option value={4}>4 hours before</option>
                  <option value={12}>12 hours before</option>
                  <option value={24}>24 hours before</option>
                  <option value={48}>48 hours before</option>
                  <option value={72}>72 hours before</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddReminderModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  if (newReminder.label.trim()) {
                    addReminder(isAdmin ? 'adminReminders' : 'csmReminders', newReminder);
                    setNewReminder({ label: '', description: '', advanceHours: 24 });
                    setShowAddReminderModal(false);
                  }
                }}
                disabled={!newReminder.label.trim()}
              >
                <Plus size={16} /> Add Reminder
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Alert Modal */}
      {showAddAlertModal && (
        <div className="modal-overlay" onClick={() => setShowAddAlertModal(false)}>
          <div className="modal add-notification-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2><Zap size={20} /> Add Custom Alert</h2>
              <button className="modal-close" onClick={() => setShowAddAlertModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Alert Name</label>
                <input 
                  type="text"
                  value={newAlert.label}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, label: e.target.value }))}
                  placeholder="e.g., Low Engagement Alert"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <input 
                  type="text"
                  value={newAlert.description}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Alert when client engagement drops below threshold"
                />
              </div>
              <div className="form-group">
                <label>Threshold (%)</label>
                <input 
                  type="number"
                  value={newAlert.threshold}
                  onChange={(e) => setNewAlert(prev => ({ ...prev, threshold: parseInt(e.target.value) }))}
                  min={1}
                  max={100}
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddAlertModal(false)}>
                Cancel
              </button>
              <button 
                className="btn-primary"
                onClick={() => {
                  if (newAlert.label.trim()) {
                    addSmartAlert(newAlert);
                    setNewAlert({ label: '', description: '', threshold: 10 });
                    setShowAddAlertModal(false);
                  }
                }}
                disabled={!newAlert.label.trim()}
              >
                <Plus size={16} /> Add Alert
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// INITIAL DATA (simulates database)
// ============================================================

// ============================================================
// MULTI-CLIENT DATA STRUCTURE WITH MONTHLY HISTORY
// ============================================================

// Utility function to format month key (YYYY-MM) to readable format (e.g., "November 2025")
function formatMonthYear(monthKey) {
  if (!monthKey) {
    const currentMonthKey = getCurrentMonthKey();
    const [year, month] = currentMonthKey.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  }
  const [year, month] = monthKey.split('-');
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

// Available months for the dropdown - dynamically generated
const availableMonths = generateAvailableMonths(12);

// Default monthly data template
const emptyMonthData = {
  enrolledThisMonth: 0,
  activePatients: 0,
  servicesDelivered: 0,
  revenue: 0,
  contacted: 0,
  enrolled: 0,
  smsSent: 0,
  smsConsented: 0,
  emailSent: 0,
  emailConsented: 0,
  mailersSent: 0,
  mailersConsented: 0,
  currentlyInOutreach: 0,
  campaignStartDate: '',
  bpImproved: 0,
  adherenceRate: 0,
  readmissionReduction: 0,
  avgResponseHours: 0,
  // Editable section labels
  sectionLabels: {
    coreMetrics: 'Core Metrics',
    enrollmentFunnel: 'Enrollment Funnel',
    campaignPerformance: 'Campaign Performance',
    smsCampaign: 'SMS Campaign',
    emailCampaign: 'Email Campaign',
    mailerCampaign: 'Mailer Campaign',
    patientOutcomes: 'Patient Outcomes',
    stories: 'Stories & Feedback',
    opportunities: 'Opportunities & Next Steps',
  }
};

const initialClientsDatabase = {};

const clientsList = [];

// Helper to get previous month ID
function getPreviousMonthId(monthId) {
  const index = availableMonths.findIndex(m => m.id === monthId);
  if (index < availableMonths.length - 1) {
    return availableMonths[index + 1].id;
  }
  return null;
}

// LocalStorage persistence helpers
// These functions now delegate to the DAL but maintain the same interface
// for backward compatibility with existing code.
const STORAGE_KEY = 'prysmcs_accounts_data';

function loadFromStorage() {
  try {
    // Use DAL storage adapter for consistency
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      // Validate that the data has the expected structure
      // Merge with initial data to ensure all fields exist
      const merged = {};
      for (const clientId of Object.keys(initialClientsDatabase)) {
        if (parsed[clientId]) {
          // Deep merge monthlyData to preserve all entries
          const mergedMonthlyData = {};
          const initialMonthly = initialClientsDatabase[clientId].monthlyData || {};
          const savedMonthly = parsed[clientId].monthlyData || {};
          
          // Start with all initial months
          for (const month of Object.keys(initialMonthly)) {
            mergedMonthlyData[month] = {
              ...emptyMonthData,
              ...initialMonthly[month],
              ...(savedMonthly[month] || {})
            };
          }
          // Add any saved months that aren't in initial
          for (const month of Object.keys(savedMonthly)) {
            if (!mergedMonthlyData[month]) {
              mergedMonthlyData[month] = {
                ...emptyMonthData,
                ...savedMonthly[month]
              };
            }
          }
          
          // Deep merge stories
          const mergedStories = {
            ...initialClientsDatabase[clientId].stories,
            ...parsed[clientId].stories,
          };
          
          // Deep merge opportunities
          const mergedOpportunities = {
            ...initialClientsDatabase[clientId].opportunities,
            ...parsed[clientId].opportunities,
          };
          
          merged[clientId] = {
            ...initialClientsDatabase[clientId],
            ...parsed[clientId],
            clientInfo: {
              ...initialClientsDatabase[clientId].clientInfo,
              ...parsed[clientId].clientInfo,
            },
            monthlyData: mergedMonthlyData,
            stories: mergedStories,
            opportunities: mergedOpportunities,
          };
        } else {
          merged[clientId] = initialClientsDatabase[clientId];
        }
      }
      // Also include any new clients that were created
      for (const clientId of Object.keys(parsed)) {
        if (!merged[clientId]) {
          merged[clientId] = parsed[clientId];
        }
      }
      // Update DAL cache
      monthlyDataClient._cache = merged;
      monthlyDataClient._cacheTimestamp = Date.now();
      return merged;
    }
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
  }
  return null;
}

function saveToStorage(data) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    // Update DAL cache
    monthlyDataClient._cache = data;
    monthlyDataClient._cacheTimestamp = Date.now();
    // Log save event via DAL audit (fire and forget)
    if (DAL_CONFIG.features.useRemoteAudit) {
      auditClient.logEvent('DATA_SAVED', { clientCount: Object.keys(data).length });
    }
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

function clearStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
    // Clear DAL cache
    monthlyDataClient.invalidateCache();
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

const dailyEnrollmentTrend = [];

const revenueSeries = [];

// Helper function to calculate delta percentage
function calculateDelta(current, previous) {
  if (!previous || previous === 0) return null;
  const delta = ((current - previous) / previous) * 100;
  return delta >= 0 ? `+${Math.round(delta)}%` : `${Math.round(delta)}%`;
}

// Generate month-over-month trend data for charts
function generateTrendData(clientData, metrics = ['enrolledThisMonth', 'activePatients'], currentMonth) {
  if (!clientData?.monthlyData) return [];

  // Get sorted list of months
  const monthKeys = Object.keys(clientData.monthlyData).sort();

  // Filter out months after the selected month
  const filteredMonthKeys = monthKeys.filter(monthKey => monthKey <= currentMonth);

  // Take last 6 months of data (or all if less)
  const recentMonths = filteredMonthKeys.slice(-6);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return recentMonths.map(monthKey => {
    const data = clientData.monthlyData[monthKey] || {};
    const [year, month] = monthKey.split('-');
    const monthName = monthNames[parseInt(month) - 1];

    const point = {
      month: monthName,
      monthKey: monthKey,
    };

    // Add each metric to the data point
    metrics.forEach(metric => {
      point[metric] = data[metric] || 0;
    });

    return point;
  });
}

// Generate revenue trend data
function generateRevenueTrend(clientData, currentMonth) {
  if (!clientData?.monthlyData) return [];

  const monthKeys = Object.keys(clientData.monthlyData).sort();

  // Filter out months after the selected month
  const filteredMonthKeys = monthKeys.filter(monthKey => monthKey <= currentMonth);
  const recentMonths = filteredMonthKeys.slice(-6);

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return recentMonths.map(monthKey => {
    const data = clientData.monthlyData[monthKey] || {};
    const [year, month] = monthKey.split('-');
    const monthName = monthNames[parseInt(month) - 1];

    return {
      month: monthName,
      amount: data.revenue || 0,
    };
  });
}

// Generate comparative metric data for any metric
function generateMetricHistory(clientData, metricId, currentMonth) {
  if (!clientData?.monthlyData) return [];

  const monthKeys = Object.keys(clientData.monthlyData).sort();

  // Filter out months after the selected month
  const filteredMonthKeys = monthKeys.filter(monthKey => monthKey <= currentMonth);
  const recentMonths = filteredMonthKeys.slice(-12); // Last 12 months

  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  return recentMonths.map(monthKey => {
    const data = clientData.monthlyData[monthKey] || {};
    const [year, month] = monthKey.split('-');
    const monthName = monthNames[parseInt(month) - 1];

    return {
      month: monthName,
      year: year,
      value: data[metricId] || 0,
    };
  });
}

// Check if any metric alerts should fire
function checkMetricAlerts(clientData, currentMonthData, previousMonthData, alertConfig, metricsRegistry = {}, selectedMonth = null) {
  const alerts = [];
  
  if (!alertConfig?.metricDips?.enabled || !alertConfig.metricDips.monitoredMetrics) return alerts;
  
  const threshold = alertConfig.metricDips.threshold || 10;
  const monitoredMetrics = alertConfig.metricDips.monitoredMetrics;
  const comparisonType = alertConfig.metricDips.comparisonType || 'previous-month';
  const targetValue = alertConfig.metricDips.targetValue;
  
  // Helper to get historical data for a metric
  const getHistoricalValues = (metricId, monthsBack) => {
    if (!clientData?.monthlyData) return [];
    
    const monthKeys = Object.keys(clientData.monthlyData).sort();
    const currentIndex = selectedMonth ? monthKeys.indexOf(selectedMonth) : monthKeys.length - 1;
    const startIndex = Math.max(0, currentIndex - monthsBack);
    
    return monthKeys.slice(startIndex, currentIndex).map(key => 
      clientData.monthlyData[key]?.[metricId] || 0
    );
  };
  
  // Helper to get comparison value based on comparison type
  const getComparisonValue = (metricId) => {
    switch (comparisonType) {
      case 'previous-month':
        return previousMonthData?.[metricId] || 0;
        
      case 'previous-quarter': {
        const last3 = getHistoricalValues(metricId, 3);
        if (last3.length === 0) return 0;
        return last3.reduce((a, b) => a + b, 0) / last3.length;
      }
        
      case 'vs-target':
        return targetValue || 0;
        
      case 'rolling-average': {
        const last3 = getHistoricalValues(metricId, 3);
        if (last3.length === 0) return 0;
        return last3.reduce((a, b) => a + b, 0) / last3.length;
      }
        
      case 'rolling-average-6': {
        const last6 = getHistoricalValues(metricId, 6);
        if (last6.length === 0) return 0;
        return last6.reduce((a, b) => a + b, 0) / last6.length;
      }
        
      case 'seasonal-baseline':
      case 'year-over-year': {
        const last12 = getHistoricalValues(metricId, 12);
        // Get the value from 12 months ago (first in the array)
        return last12.length >= 12 ? last12[0] : 0;
      }
        
      default:
        return previousMonthData?.[metricId] || 0;
    }
  };
  
  // Get comparison type label for messages
  const getComparisonLabel = () => {
    const labels = {
      'previous-month': 'vs last month',
      'previous-quarter': 'vs last quarter avg',
      'vs-target': 'vs target',
      'rolling-average': 'vs 3-month avg',
      'rolling-average-6': 'vs 6-month avg',
      'seasonal-baseline': 'vs same month last year',
      'year-over-year': 'YoY',
    };
    return labels[comparisonType] || 'vs last month';
  };
  
  // Helper to format value based on metric type
  const formatMetricValue = (metricId, value) => {
    const metric = metricsRegistry[metricId];
    if (!metric) return value;
    
    switch (metric.format) {
      case 'currency':
        return `$${Number(value || 0).toLocaleString()}`;
      case 'percentage':
        return `${value || 0}%`;
      case 'hours':
        return `${value || 0}h`;
      default:
        return Number(value || 0).toLocaleString();
    }
  };
  
  // Helper to get metric label
  const getMetricLabel = (metricId) => {
    const metric = metricsRegistry[metricId];
    return metric?.label || metricId;
  };
  
  // Helper to determine if change is "bad" based on directionality
  const isNegativeChange = (metricId, changeValue) => {
    const metric = metricsRegistry[metricId];
    const directionality = metric?.directionality || 'up-is-good';
    
    if (directionality === 'up-is-good') {
      return changeValue < 0; // Decrease is bad
    } else if (directionality === 'down-is-good') {
      return changeValue > 0; // Increase is bad
    }
    return false; // Neutral - no alert
  };
  
  monitoredMetrics.forEach(metricId => {
    const metric = metricsRegistry[metricId];
    
    // Skip non-comparable metrics
    if (metric && metric.isComparable === false) return;
    
    const current = currentMonthData?.[metricId] || 0;
    const comparisonValue = getComparisonValue(metricId);
    
    // Skip if no valid comparison value
    if (comparisonValue === 0 && comparisonType !== 'vs-target') return;
    
    const comparisonMethod = metric?.comparisonMethod || 'percent';
    let changeValue, changeDisplay, triggerAlert;
    
    if (comparisonType === 'vs-target') {
      // For target comparison, check if below/above target based on directionality
      const directionality = metric?.directionality || 'up-is-good';
      if (directionality === 'up-is-good') {
        changeValue = ((current - comparisonValue) / comparisonValue) * 100;
        triggerAlert = current < comparisonValue * (1 - threshold / 100);
      } else {
        changeValue = ((current - comparisonValue) / comparisonValue) * 100;
        triggerAlert = current > comparisonValue * (1 + threshold / 100);
      }
      changeDisplay = `${Math.abs(Math.round(changeValue))}%`;
    } else if (comparisonMethod === 'absolute') {
      // For percentages/rates, use absolute point change
      changeValue = current - comparisonValue;
      changeDisplay = `${Math.abs(changeValue).toFixed(1)} points`;
      triggerAlert = Math.abs(changeValue) >= threshold && isNegativeChange(metricId, changeValue);
    } else {
      // Default: percent change
      changeValue = ((current - comparisonValue) / comparisonValue) * 100;
      changeDisplay = `${Math.abs(Math.round(changeValue))}%`;
      triggerAlert = Math.abs(changeValue) >= threshold && isNegativeChange(metricId, changeValue);
    }
    
    if (triggerAlert) {
      const label = getMetricLabel(metricId);
      const formattedCurrent = formatMetricValue(metricId, current);
      const formattedComparison = formatMetricValue(metricId, comparisonValue);
      const directionality = metric?.directionality || 'up-is-good';
      const comparisonLabel = getComparisonLabel();
      
      // Generate human-readable message
      let message;
      if (comparisonType === 'vs-target') {
        if (directionality === 'up-is-good') {
          message = `${label} is ${changeDisplay} below target (${formattedCurrent} vs target ${formattedComparison})`;
        } else {
          message = `${label} is ${changeDisplay} above target (${formattedCurrent} vs target ${formattedComparison})`;
        }
      } else if (directionality === 'down-is-good' && changeValue > 0) {
        message = `${label} increased by ${changeDisplay} ${comparisonLabel} (from ${formattedComparison} to ${formattedCurrent})`;
      } else {
        message = `${label} decreased by ${changeDisplay} ${comparisonLabel} (from ${formattedComparison} to ${formattedCurrent})`;
      }
      
      alerts.push({
        type: 'warning',
        metricId,
        metricLabel: label,
        current,
        comparisonValue,
        formattedCurrent,
        formattedComparison,
        changePercent: Math.round(changeValue),
        changeDisplay,
        comparisonType,
        comparisonLabel,
        message,
      });
    }
  });
  
  return alerts;
}

// Helper to build dashboard data from form data
function buildDashboardData(formData, prevData, clientData, selectedMonth) {
  // Calculate days into campaign
  const campaignStart = formData.campaignStartDate ? new Date(formData.campaignStartDate) : null;
  const today = new Date();
  const daysIntoCampaign = campaignStart ? Math.floor((today - campaignStart) / (1000 * 60 * 60 * 24)) : 0;

  // Generate dynamic chart data from historical months
  const enrollmentTrend = generateTrendData(clientData, ['enrolledThisMonth', 'activePatients'], selectedMonth);
  const revenueTrend = generateRevenueTrend(clientData, selectedMonth);

  return {
    // Include all raw form data so custom fields are accessible
    ...formData,
    overview: {
      // Include all form data in overview for custom fields
      ...formData,
      enrolledThisMonth: formData.enrolledThisMonth,
      activePatients: formData.activePatients,
      servicesDelivered: formData.servicesDelivered,
      revenueThisMonth: `$${(formData.revenue || 0).toLocaleString()}`,
      revenue: formData.revenue,
      deltaEnrollment: calculateDelta(formData.enrolledThisMonth, prevData.enrolledThisMonth),
      deltaActive: calculateDelta(formData.activePatients, prevData.activePatients),
      deltaServices: calculateDelta(formData.servicesDelivered, prevData.servicesDelivered),
      deltaRevenue: calculateDelta(formData.revenue, prevData.revenue),
    },
    previousMonth: {
      ...prevData,
      enrolledThisMonth: prevData.enrolledThisMonth,
      activePatients: prevData.activePatients,
      servicesDelivered: prevData.servicesDelivered,
      revenue: prevData.revenue,
    },
    funnel: {
      ...formData, // Include all for custom funnel fields
      contacted: formData.contacted,
      enrolled: formData.enrolled,
    },
    campaign: {
      ...formData, // Include all for custom campaign fields
      sms: { sent: formData.smsSent, consented: formData.smsConsented },
      email: { sent: formData.emailSent, consented: formData.emailConsented },
      mailers: { sent: formData.mailersSent, consented: formData.mailersConsented },
      totalConsented: (formData.smsConsented || 0) + (formData.emailConsented || 0) + (formData.mailersConsented || 0),
      currentlyInOutreach: formData.currentlyInOutreach,
      daysIntoCampaign: daysIntoCampaign,
      campaignStartDate: formData.campaignStartDate,
    },
    outcomes: {
      ...formData, // Include all for custom outcome fields
      bpImproved: formData.bpImproved,
      adherenceRate: formData.adherenceRate,
      readmissionReduction: formData.readmissionReduction,
      avgResponseHours: formData.avgResponseHours,
      avgResponse: `< ${formData.avgResponseHours || 0}hrs`,
    },
    // Dynamic chart data from actual historical months
    enrollmentTrend,
    revenueSeries: revenueTrend,
    // Keep for backwards compatibility but prefer above
    dailyEnrollmentTrend: enrollmentTrend.length > 0 ? enrollmentTrend : dailyEnrollmentTrend,
    // Raw form data for direct access to custom fields
    rawFormData: formData,
  };
}

// Old PDFReportModal removed - replaced by dynamic report module at src/components/report/

// ============================================================
// STYLES
// ============================================================
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,300;0,9..40,400;0,9..40,500;0,9..40,600;0,9..40,700&family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500;700&family=Open+Sans:wght@300;400;500;600;700&family=Lato:wght@300;400;700&family=Poppins:wght@300;400;500;600;700&family=Source+Sans+Pro:wght@300;400;600;700&family=Nunito:wght@300;400;500;600;700&display=swap');

  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  :root {
    --teal-50: #f0fdfa;
    --teal-100: #ccfbf1;
    --teal-200: #99f6e4;
    --teal-400: #2dd4bf;
    --teal-500: #14b8a6;
    --teal-600: #0d9488;
    --teal-700: #0f766e;
    --teal-800: #115e59;
    --teal-900: #134e4a;
    --slate-50: #f8fafc;
    --slate-100: #f1f5f9;
    --slate-200: #e2e8f0;
    --slate-300: #cbd5e1;
    --slate-400: #94a3b8;
    --slate-500: #64748b;
    --slate-600: #475569;
    --slate-700: #334155;
    --slate-800: #1e293b;
    --slate-900: #0f172a;
    --amber-500: #f59e0b;
    --amber-100: #fef3c7;
    --amber-600: #d97706;
    --emerald-500: #10b981;
    --blue-500: #3b82f6;
    --blue-100: #dbeafe;
    --blue-600: #2563eb;
    --rose-50: #fff1f2;
    --rose-100: #ffe4e6;
    --rose-200: #fecdd3;
    --rose-300: #fda4af;
    --rose-500: #f43f5e;
    --rose-600: #e11d48;
    --rose-700: #be123c;
    
    /* Brand colors - updated dynamically */
    --brand-primary: #14b8a6;
    --brand-secondary: #0d9488;
    --brand-accent: #5eead4;
    --brand-primary-light: #5eead4;
    --brand-primary-dark: #0d9488;
  }

  /* ============================================================
   * SCHEMA-DRIVEN FORM STYLES
   * ============================================================ */
  
  .schema-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }
  
  .schema-section {
    position: relative;
  }
  
  .schema-section.disabled {
    opacity: 0.6;
  }
  
  .form-section-actions {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .section-remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border: 1px solid var(--slate-200);
    background: white;
    border-radius: 6px;
    cursor: pointer;
    color: var(--slate-400);
    transition: all 0.2s;
  }
  
  .section-remove-btn:hover {
    background: #fef2f2;
    border-color: #fecaca;
    color: #dc2626;
  }
  
  .drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    cursor: grab;
    color: var(--slate-400);
    margin-right: 8px;
  }
  
  .drag-handle:hover {
    color: var(--slate-600);
  }

  .drag-handle:active {
    cursor: grabbing;
  }

  .schema-section.section-dragging {
    opacity: 0.4;
    border: 2px dashed var(--teal-400);
    background: var(--teal-50);
    transition: opacity 0.15s ease, border-color 0.15s ease;
  }

  .form-field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
  }
  
  .field-visibility-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: var(--slate-400);
    transition: all 0.2s;
    opacity: 0;
    margin-right: 4px;
  }

  .field-visibility-btn.visible {
    color: #10b981;
  }

  .field-visibility-btn.hidden {
    color: var(--slate-400);
  }

  .schema-field:hover .field-visibility-btn {
    opacity: 1;
  }

  .field-visibility-btn.visible:hover {
    background: #f0fdf4;
    color: #059669;
  }

  .field-visibility-btn.hidden:hover {
    background: #f8fafc;
    color: var(--slate-600);
  }

  .field-remove-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
    border: none;
    background: transparent;
    border-radius: 4px;
    cursor: pointer;
    color: var(--slate-400);
    transition: all 0.2s;
    opacity: 0;
  }

  .schema-field:hover .field-remove-btn {
    opacity: 1;
  }

  .field-remove-btn:hover {
    background: #fef2f2;
    color: #dc2626;
  }
  
  .form-helper-text {
    display: block;
    font-size: 12px;
    color: var(--slate-500);
    margin-top: 4px;
  }
  
  .add-field-container,
  .add-section-container {
    display: flex;
    justify-content: center;
    padding: 16px;
  }
  
  .add-field-btn,
  .add-section-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: 2px dashed var(--slate-300);
    background: transparent;
    border-radius: 8px;
    color: var(--slate-500);
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }
  
  .add-field-btn:hover,
  .add-section-btn:hover {
    border-color: var(--brand-primary);
    color: var(--brand-primary);
    background: color-mix(in srgb, var(--brand-primary) 5%, white);
  }
  
  .add-section-btn {
    padding: 16px 32px;
    font-size: 16px;
  }
  
  .inline-modal {
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    margin-top: 16px;
    padding: 20px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  }
  
  .inline-modal h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-800);
    margin-bottom: 16px;
  }
  
  .inline-modal .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--slate-200);
  }
  
  .modal-form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }
  
  .input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }
  
  .input-prefix,
  .input-suffix {
    position: absolute;
    color: var(--slate-500);
    font-weight: 500;
    pointer-events: none;
  }
  
  .input-prefix {
    left: 12px;
  }
  
  .input-suffix {
    right: 12px;
  }
  
  .form-input.with-prefix {
    padding-left: 28px;
  }
  
  .form-input.with-suffix {
    padding-right: 32px;
  }
  
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 48px;
    height: 26px;
  }
  
  .toggle-switch input {
    opacity: 0;
    width: 0;
    height: 0;
  }
  
  .toggle-slider {
    position: absolute;
    cursor: pointer;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background-color: var(--slate-300);
    transition: 0.3s;
    border-radius: 26px;
  }
  
  .toggle-slider:before {
    position: absolute;
    content: "";
    height: 20px;
    width: 20px;
    left: 3px;
    bottom: 3px;
    background-color: white;
    transition: 0.3s;
    border-radius: 50%;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  
  .toggle-switch input:checked + .toggle-slider {
    background-color: var(--brand-primary);
  }
  
  .toggle-switch input:checked + .toggle-slider:before {
    transform: translateX(22px);
  }
  
  .edit-icon {
    opacity: 0.3;
    margin-left: 4px;
    transition: opacity 0.2s;
  }
  
  .form-label.editable:hover .edit-icon {
    opacity: 0.8;
  }


  *, *::before, *::after {
    box-sizing: border-box;
  }

  html, body {
    margin: 0;
    padding: 0;
    width: 100%;
    overflow-x: hidden;
  }

  body {
    font-family: 'DM Sans', -apple-system, sans-serif;
    background: linear-gradient(135deg, var(--slate-100) 0%, var(--teal-50) 100%);
    min-height: 100vh;
    color: var(--slate-800);
  }

  .dashboard {
    display: flex;
    min-height: 100vh;
    width: 100%;
    overflow-x: hidden;
  }

  /* Sidebar */
  .sidebar {
    width: 260px;
    background: linear-gradient(180deg, var(--teal-900) 0%, var(--teal-800) 100%);
    padding: 24px 16px;
    display: flex;
    flex-direction: column;
    position: fixed;
    height: 100vh;
    box-shadow: 4px 0 24px rgba(0,0,0,0.1);
    z-index: 100;
    overflow: hidden;
  }

  .sidebar nav {
    display: flex;
    flex-direction: column;
    flex: 1;
    min-height: 0;
    overflow-y: auto;
    overflow-x: hidden;
  }

  .sidebar nav::-webkit-scrollbar {
    width: 6px;
  }

  .sidebar nav::-webkit-scrollbar-track {
    background: rgba(255,255,255,0.05);
    border-radius: 3px;
  }

  .sidebar nav::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 3px;
  }

  .sidebar nav::-webkit-scrollbar-thumb:hover {
    background: rgba(255,255,255,0.3);
  }

  .logo {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 0 12px 24px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
    margin-bottom: 24px;
  }

  .logo-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-accent));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  }

  .logo-text {
    font-family: var(--brand-font, 'DM Sans'), sans-serif;
    font-size: 22px;
    font-weight: 600;
    color: white;
    letter-spacing: -0.5px;
  }

  .logo-icon-img {
    width: 40px;
    height: 40px;
    object-fit: contain;
    border-radius: 10px;
  }

  .logo-image.full {
    max-height: 44px;
    max-width: 180px;
    object-fit: contain;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 16px;
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    color: rgba(255,255,255,0.7);
    font-size: 14px;
    font-weight: 500;
    margin-bottom: 4px;
  }

  .nav-item:hover {
    background: rgba(255,255,255,0.1);
    color: white;
  }

  .nav-item.active {
    background: rgba(255,255,255,0.15);
    color: var(--brand-secondary);
    box-shadow: inset 0 0 0 1px rgba(255,255,255,0.1);
  }

  .nav-item svg {
    width: 20px;
    height: 20px;
    opacity: 0.8;
  }

  .nav-item.active svg {
    opacity: 1;
    color: var(--brand-secondary);
  }

  /* Settings Section */
  .settings-section {
    margin-top: 4px;
  }

  .settings-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .settings-header .settings-chevron {
    margin-left: auto;
    transition: transform 0.2s;
    opacity: 0.6;
  }

  .settings-header .settings-chevron.rotated {
    transform: rotate(180deg);
  }

  .settings-submenu {
    margin-left: 12px;
    padding-left: 12px;
    border-left: 1px solid rgba(255, 255, 255, 0.15);
    margin-top: 4px;
  }

  .settings-submenu .nav-item.sub-item {
    padding: 10px 16px;
    font-size: 13px;
    margin-bottom: 2px;
    border-left: none;
    border-radius: 6px;
  }

  .settings-submenu .nav-item.sub-item svg {
    width: 16px;
    height: 16px;
  }

  /* Main Content */
  .main-content {
    flex: 1;
    margin-left: 260px;
    display: flex;
    flex-direction: column;
    min-width: 0;
    overflow-x: hidden;
    max-width: 100%;
  }

  .topbar {
    background: white;
    padding: 16px 32px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    border-bottom: 1px solid var(--slate-200);
    position: sticky;
    top: 0;
    z-index: 100;
    backdrop-filter: blur(12px);
    background: rgba(255,255,255,0.95);
  }

  .topbar-left {
    display: flex;
    align-items: center;
    gap: 16px;
  }

  .back-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--slate-200);
    background: white;
    border-radius: 8px;
    cursor: pointer;
    color: var(--slate-600);
    transition: all 0.2s;
  }

  .back-btn:hover {
    background: color-mix(in srgb, var(--brand-primary) 10%, white);
    border-color: var(--brand-accent);
    color: var(--brand-primary);
  }

  .mobile-menu-btn {
    display: none;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--slate-200);
    background: white;
    border-radius: 8px;
    cursor: pointer;
    color: var(--slate-600);
    transition: all 0.2s;
  }

  .mobile-menu-btn:hover {
    background: color-mix(in srgb, var(--brand-primary) 10%, white);
    border-color: var(--brand-accent);
    color: var(--brand-primary);
  }

  .sidebar-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    z-index: 999;
    display: none;
  }

  .add-client-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--slate-200);
    background: white;
    border-radius: 8px;
    cursor: pointer;
    color: var(--slate-600);
    transition: all 0.2s;
  }

  .add-client-btn:hover {
    background: var(--brand-primary);
    border-color: var(--brand-primary);
    color: white;
  }

  .delete-client-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    height: 36px;
    border: 1px solid var(--slate-200);
    background: white;
    border-radius: 8px;
    cursor: pointer;
    color: var(--slate-400);
    transition: all 0.2s;
  }

  .delete-client-btn:hover {
    background: #dc2626;
    border-color: #dc2626;
    color: white;
  }

  .select-wrapper {
    position: relative;
  }

  .select-wrapper select {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    appearance: none;
    background: var(--slate-50);
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    padding: 10px 36px 10px 14px;
    font-size: 14px;
    font-weight: 500;
    color: var(--slate-700);
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .select-wrapper select:hover {
    border-color: var(--brand-primary);
  }

  .select-wrapper::after {
    content: '▾';
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--slate-400);
    pointer-events: none;
    font-size: 12px;
  }

  .export-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    color: white;
    border: none;
    padding: 12px 20px;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--brand-primary) 25%, transparent);
    font-family: inherit;
  }

  .export-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px color-mix(in srgb, var(--brand-primary) 35%, transparent);
  }

  .topbar-right {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  /* Notification Bell Styles */
  .notification-bell-wrapper {
    position: relative;
  }

  .notification-bell-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    background: var(--slate-100);
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    color: var(--slate-600);
    position: relative;
  }

  .notification-bell-btn:hover {
    background: color-mix(in srgb, var(--brand-primary) 10%, white);
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .notification-bell-btn.has-alerts {
    color: var(--brand-primary);
  }

  .notification-badge {
    position: absolute;
    top: -4px;
    right: -4px;
    min-width: 18px;
    height: 18px;
    background: var(--rose-500);
    color: white;
    font-size: 10px;
    font-weight: 700;
    border-radius: 9px;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 0 4px;
    border: 2px solid white;
  }

  .notification-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    width: 360px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    z-index: 3000;
    overflow: hidden;
  }

  .notification-dropdown-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--slate-200);
    background: var(--slate-50);
  }

  .notification-dropdown-header h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0;
  }

  .notification-dropdown-header .alert-count {
    font-size: 12px;
    color: var(--brand-primary);
    font-weight: 500;
  }

  .notification-dropdown-body {
    max-height: 400px;
    overflow-y: auto;
  }

  .no-notifications {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: var(--slate-400);
  }

  .no-notifications svg {
    margin-bottom: 8px;
    opacity: 0.5;
  }

  .no-notifications p {
    font-size: 13px;
    margin: 0;
  }

  .notification-dropdown-item {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    padding: 14px 20px;
    border-bottom: 1px solid var(--slate-100);
    transition: background 0.15s;
  }

  .notification-dropdown-item:hover {
    background: var(--slate-50);
  }

  .notification-dropdown-item svg {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .notification-dropdown-item.opportunity svg { color: var(--emerald-500); }
  .notification-dropdown-item.warning svg { color: var(--amber-500); }
  .notification-dropdown-item.info svg { color: var(--blue-500); }
  .notification-dropdown-item.inactive svg { color: var(--slate-400); }

  .notification-item-content {
    flex: 1;
    min-width: 0;
  }

  .notification-item-content strong {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-800);
    margin-bottom: 2px;
  }

  .notification-item-content p {
    font-size: 12px;
    color: var(--slate-600);
    margin: 0 0 4px 0;
    line-height: 1.4;
  }

  .notification-time {
    font-size: 11px;
    color: var(--slate-400);
  }

  .notification-item-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
  }

  .notification-item-actions button {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.15s;
  }

  .notification-item-actions .snooze-btn {
    background: var(--slate-100);
    color: var(--slate-500);
  }

  .notification-item-actions .snooze-btn:hover {
    background: var(--amber-100);
    color: var(--amber-600);
  }

  .notification-item-actions .dismiss-btn {
    background: var(--slate-100);
    color: var(--slate-500);
  }

  .notification-item-actions .dismiss-btn:hover {
    background: var(--rose-100);
    color: var(--rose-600);
  }

  .notification-dropdown-footer {
    padding: 12px 20px;
    border-top: 1px solid var(--slate-200);
    background: var(--slate-50);
    text-align: center;
  }

  .notification-dropdown-footer span {
    font-size: 12px;
    color: var(--slate-500);
  }

  /* Popup Notifications */
  .notification-popups {
    position: fixed;
    top: 80px;
    right: 24px;
    z-index: 9999;
    display: flex;
    flex-direction: column;
    gap: 12px;
    pointer-events: none;
  }

  .notification-popup {
    display: flex;
    align-items: flex-start;
    gap: 12px;
    background: white;
    padding: 16px 20px;
    border-radius: 12px;
    box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
    min-width: 320px;
    max-width: 400px;
    pointer-events: auto;
    animation: popupSlideIn 0.3s ease-out;
    border-left: 4px solid var(--slate-400);
  }

  .notification-popup.opportunity { border-left-color: var(--emerald-500); }
  .notification-popup.warning { border-left-color: var(--amber-500); }
  .notification-popup.info { border-left-color: var(--blue-500); }
  .notification-popup.inactive { border-left-color: var(--slate-400); }

  .notification-popup svg {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .notification-popup.opportunity svg { color: var(--emerald-500); }
  .notification-popup.warning svg { color: var(--amber-500); }
  .notification-popup.info svg { color: var(--blue-500); }
  .notification-popup.inactive svg { color: var(--slate-400); }

  .popup-content {
    flex: 1;
  }

  .popup-content strong {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-800);
    margin-bottom: 4px;
  }

  .popup-content p {
    font-size: 13px;
    color: var(--slate-600);
    margin: 0;
    line-height: 1.4;
  }

  .popup-close {
    background: none;
    border: none;
    color: var(--slate-400);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.15s;
  }

  .popup-close:hover {
    background: var(--slate-100);
    color: var(--slate-600);
  }

  @keyframes popupSlideIn {
    from {
      opacity: 0;
      transform: translateX(100px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }

  .present-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    background: var(--slate-100);
    color: var(--brand-secondary);
    border: 1px solid var(--slate-200);
    padding: 10px 16px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .present-btn:hover {
    background: color-mix(in srgb, var(--brand-primary) 10%, white);
    border-color: var(--brand-accent);
    color: var(--brand-primary);
  }

  .present-icon {
    font-size: 10px;
  }

  .unsaved-indicator {
    color: var(--amber-500);
    font-size: 13px;
    font-weight: 500;
    animation: pulse 2s infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .data-saved-toast {
    position: fixed;
    top: 80px;
    right: 24px;
    background: #1e293b;
    color: #f8fafc;
    padding: 12px 20px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
    z-index: 10000;
    display: flex;
    align-items: center;
    gap: 8px;
    animation: toastSlideIn 0.2s ease-out, toastFadeOut 0.3s ease-in 2.5s forwards;
  }
  
  .data-saved-toast::before {
    content: '✓';
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    background: #22c55e;
    border-radius: 50%;
    font-size: 11px;
    font-weight: bold;
  }

  @keyframes toastSlideIn {
    from { transform: translateX(20px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }
  
  @keyframes toastFadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }

  .page-content {
    padding: 32px;
    flex: 1;
    overflow-x: auto;
    overflow-y: auto;
    max-width: 100%;
  }

  .page-header {
    margin-bottom: 32px;
  }

  .page-title {
    font-family: 'Fraunces', serif;
    font-size: 32px;
    font-weight: 600;
    color: var(--slate-900);
    margin-bottom: 8px;
  }

  .page-subtitle {
    color: var(--slate-500);
    font-size: 15px;
  }

  /* KPI Cards */
  .kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 16px;
    margin-bottom: 32px;
    width: 100%;
  }

  .kpi-card {
    background: white;
    border-radius: 16px;
    max-width: 100%;
    padding: 20px 18px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
    border: 1px solid var(--slate-100);
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;
  }

  .kpi-card::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 3px;
    background: linear-gradient(90deg, var(--brand-primary), var(--brand-accent));
    opacity: 0;
    transition: opacity 0.3s;
  }

  .kpi-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }

  .kpi-card:hover::before {
    opacity: 1;
  }

  .kpi-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 12px;
  }

  .kpi-icon.teal {
    background: color-mix(in srgb, var(--brand-primary) 15%, white);
    color: var(--brand-primary);
  }

  .kpi-icon.amber {
    background: #fef3c7;
    color: var(--amber-500);
  }

  .kpi-icon.emerald {
    background: #d1fae5;
    color: var(--emerald-500);
  }

  .kpi-icon.rose {
    background: #ffe4e6;
    color: var(--rose-500);
  }

  .kpi-label {
    font-size: 13px;
    color: var(--slate-500);
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .kpi-value {
    font-family: 'Fraunces', serif;
    font-size: 32px;
    font-weight: 600;
    color: var(--slate-900);
    line-height: 1;
  }

  .kpi-delta {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 13px;
    font-weight: 600;
    margin-top: 12px;
    padding: 4px 10px;
    border-radius: 20px;
  }

  .kpi-delta.positive {
    background: color-mix(in srgb, var(--brand-primary) 15%, white);
    color: var(--brand-primary);
  }

  .kpi-delta.negative {
    background: #ffe4e6;
    color: #e11d48;
  }

  /* Chart Cards */
  .chart-card {
    background: white;
    border-radius: 16px;
    padding: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
    border: 1px solid var(--slate-100);
    margin-bottom: 24px;
    max-width: 100%;
    overflow: hidden;
  }

  .chart-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
  }

  .chart-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--slate-800);
  }

  .chart-subtitle {
    font-size: 13px;
    color: var(--slate-500);
    margin-top: 4px;
  }

  /* Widget Cards */
  .widget-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
    border: 1px solid var(--slate-100);
    margin-bottom: 24px;
    transition: all 0.3s ease;
  }

  .widget-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(0,0,0,0.08);
  }

  .widget-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--slate-800);
    margin-bottom: 16px;
  }

  /* Funnel */
  .funnel-container {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .funnel-step {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px 20px;
    background: var(--slate-50);
    border-radius: 12px;
    transition: all 0.2s;
  }

  .funnel-step:hover {
    background: var(--teal-50);
  }

  .funnel-bar {
    height: 8px;
    background: linear-gradient(90deg, var(--brand-primary), var(--brand-accent));
    border-radius: 4px;
    transition: width 0.5s ease;
  }

  .funnel-label {
    width: 100px;
    font-weight: 500;
    color: var(--slate-700);
    font-size: 14px;
  }

  .funnel-value {
    font-family: 'Fraunces', serif;
    font-size: 24px;
    font-weight: 600;
    color: var(--slate-900);
    width: 80px;
    text-align: right;
  }

  .funnel-bar-container {
    flex: 1;
    background: var(--slate-200);
    border-radius: 4px;
    height: 8px;
  }

  .funnel-rate {
    font-size: 13px;
    color: var(--slate-500);
    width: 60px;
    text-align: right;
  }

  /* Grid layouts */
  .two-col-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-bottom: 24px;
    width: 100%;
  }

  /* Story Cards */
  .story-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid var(--slate-100);
    border-left: 4px solid var(--brand-primary);
  }

  .story-card h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-800);
    margin-bottom: 12px;
  }

  .story-card p {
    font-size: 15px;
    color: var(--slate-600);
    line-height: 1.6;
    font-style: italic;
  }

  .story-card .story-meta {
    margin-top: 16px;
    font-size: 13px;
    color: var(--slate-400);
    font-style: normal;
  }

  /* Opportunities */
  .opportunity-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .opportunity-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    background: var(--slate-50);
    border-radius: 12px;
    transition: all 0.2s;
  }

  .opportunity-item:hover {
    background: var(--teal-50);
  }

  .opportunity-number {
    width: 32px;
    height: 32px;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 600;
    font-size: 14px;
    flex-shrink: 0;
  }

  .opportunity-content h4 {
    font-size: 15px;
    font-weight: 600;
    color: var(--slate-800);
    margin-bottom: 4px;
  }

  .opportunity-content p {
    font-size: 14px;
    color: var(--slate-500);
    line-height: 1.5;
  }

  /* Strategic Priorities Grid */
  .initiatives-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 24px;
  }

  .initiative-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid var(--slate-100);
    border-left: 4px solid var(--program-color, var(--teal-500));
    transition: all 0.2s;
  }

  .initiative-card:hover {
    box-shadow: 0 4px 12px rgba(0,0,0,0.08);
    transform: translateY(-2px);
  }

  .initiative-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 12px;
  }

  .initiative-icon {
    font-size: 28px;
  }

  .initiative-name {
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0;
  }

  .initiative-description {
    font-size: 14px;
    color: var(--slate-600);
    line-height: 1.5;
    margin-bottom: 16px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--slate-100);
  }

  .initiative-topics h4 {
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
    margin: 0 0 10px 0;
  }

  .initiative-topics ul {
    margin: 0;
    padding-left: 20px;
  }

  .initiative-topics li {
    font-size: 13px;
    color: var(--slate-600);
    margin-bottom: 6px;
    line-height: 1.4;
  }

  .initiative-topics li::marker {
    color: var(--program-color, var(--teal-500));
  }

  .program-overview-content {
    padding: 8px 0;
  }

  .program-overview-content p {
    font-size: 14px;
    color: var(--slate-600);
    line-height: 1.6;
    margin: 0 0 20px 0;
  }

  .program-stats {
    display: flex;
    gap: 32px;
    padding-top: 16px;
    border-top: 1px solid var(--slate-100);
  }

  .program-stat {
    display: flex;
    flex-direction: column;
    align-items: center;
  }

  .program-stat .stat-number {
    font-family: 'Fraunces', serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--teal-600);
  }

  .program-stat .stat-label {
    font-size: 13px;
    color: var(--slate-500);
    margin-top: 4px;
  }

  /* Outcomes Grid */
  .outcomes-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
    width: 100%;
  }

  .outcome-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
    text-align: center;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04);
    border: 1px solid var(--slate-100);
  }

  .outcome-value {
    font-family: 'Fraunces', serif;
    font-size: 40px;
    font-weight: 600;
    background: linear-gradient(135deg, var(--brand-secondary), var(--brand-primary));
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .outcome-label {
    font-size: 14px;
    color: var(--slate-600);
    margin-top: 8px;
    font-weight: 500;
  }

  /* Notes section */
  .notes-card {
    background: linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 5%, white), white);
    border-radius: 16px;
    padding: 24px;
    border: 1px solid color-mix(in srgb, var(--brand-primary) 15%, white);
  }

  .notes-card h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--brand-secondary);
    margin-bottom: 12px;
  }

  .notes-card p {
    font-size: 14px;
    color: var(--slate-600);
    line-height: 1.6;
  }

  /* Summary Card */
  .summary-card {
    background: white;
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
    border: 1px solid var(--slate-100);
    margin-top: 8px;
    max-width: 100%;
    overflow: hidden;
  }

  .summary-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--slate-800);
    margin-bottom: 20px;
  }

  .summary-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .summary-item {
    padding: 16px;
    background: var(--slate-50);
    border-radius: 12px;
  }

  .summary-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-600);
    display: block;
    margin-bottom: 4px;
  }

  .summary-value {
    font-family: 'Fraunces', serif;
    font-size: 24px;
    font-weight: 600;
    display: block;
    margin-bottom: 8px;
  }

  .summary-value.positive {
    color: var(--brand-primary);
  }

  .summary-value.negative {
    color: #e11d48;
  }

  .summary-desc {
    font-size: 13px;
    color: var(--slate-500);
    line-height: 1.5;
  }

  /* Campaign Section */
  .campaign-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .campaign-card {
    background: var(--slate-50);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }

  .campaign-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 12px;
    font-size: 24px;
  }

  .campaign-icon.sms {
    background: #dbeafe;
  }

  .campaign-icon.email {
    background: #fce7f3;
  }

  .campaign-icon.mailer {
    background: #fef3c7;
  }

  .campaign-type {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
    margin-bottom: 12px;
  }

  .campaign-stat {
    display: flex;
    justify-content: space-between;
    font-size: 13px;
    color: var(--slate-600);
    margin-bottom: 6px;
  }

  .campaign-stat span:last-child {
    font-weight: 600;
    color: var(--slate-800);
  }

  .campaign-totals {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    padding: 20px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 5%, white), white);
    border-radius: 12px;
    border: 1px solid color-mix(in srgb, var(--brand-primary) 15%, white);
  }

  .campaign-total-item {
    text-align: center;
  }

  .campaign-total-value {
    font-family: 'Fraunces', serif;
    font-size: 28px;
    font-weight: 600;
    color: var(--brand-primary);
  }

  .campaign-total-label {
    font-size: 12px;
    color: var(--slate-500);
    margin-top: 4px;
  }

  /* Custom Tooltip */
  .custom-tooltip {
    background: var(--slate-800);
    padding: 12px 16px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .custom-tooltip .label {
    color: var(--slate-300);
    font-size: 12px;
    margin-bottom: 4px;
  }

  .custom-tooltip .value {
    color: white;
    font-weight: 600;
    font-size: 16px;
  }

  /* ============================================
     ADMIN FORM STYLES
     ============================================ */
  
  .admin-container {
    max-width: 900px;
  }

  .form-section {
    background: white;
    border-radius: 16px;
    padding: 28px;
    margin-bottom: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.04), 0 4px 12px rgba(0,0,0,0.03);
    border: 1px solid var(--slate-100);
  }

  .form-section-header {
    display: flex;
    align-items: center;
    gap: 12px;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--slate-100);
  }

  .form-section-header-content {
    flex: 1;
  }

  .section-toggle {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: #ecfdf5;
    color: #059669;
  }

  .section-toggle.hidden {
    background: #f1f5f9;
    color: #64748b;
  }

  .section-toggle:hover {
    transform: scale(1.02);
  }

  .section-disabled-notice {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 40px 20px;
    color: #94a3b8;
    font-size: 14px;
    font-style: italic;
  }
  
  .editable-section-title {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  
  .editable-section-title input {
    font-size: 18px;
    font-weight: 600;
    color: var(--slate-800);
    border: 1px dashed transparent;
    background: transparent;
    padding: 2px 8px;
    border-radius: 4px;
    width: auto;
    min-width: 150px;
  }
  
  .editable-section-title input:hover {
    border-color: var(--slate-300);
    background: var(--slate-50);
  }
  
  .editable-section-title input:focus {
    outline: none;
    border-color: var(--brand-primary);
    background: white;
  }
  
  .edit-label-btn {
    opacity: 0;
    padding: 4px;
    background: transparent;
    border: none;
    color: var(--slate-400);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }
  
  .form-section-header:hover .edit-label-btn {
    opacity: 1;
  }
  
  .edit-label-btn:hover {
    background: var(--slate-100);
    color: var(--slate-600);
  }
  
  .campaign-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px 10px;
    border-radius: 16px;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
    background: #ecfdf5;
    color: #059669;
  }
  
  .campaign-toggle.hidden {
    background: #f1f5f9;
    color: #94a3b8;
  }

  .form-section-icon {
    width: 40px;
    height: 40px;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .form-section-icon.teal { background: var(--teal-100); color: var(--teal-600); }
  .form-section-icon.blue { background: #dbeafe; color: #2563eb; }
  .form-section-icon.purple { background: #ede9fe; color: #7c3aed; }
  .form-section-icon.amber { background: #fef3c7; color: #d97706; }
  .form-section-icon.emerald { background: #d1fae5; color: #059669; }
  .form-section-icon.rose { background: #ffe4e6; color: #e11d48; }

  .form-section-title {
    font-size: 18px;
    font-weight: 600;
    color: var(--slate-800);
  }

  .form-section-subtitle {
    font-size: 13px;
    color: var(--slate-500);
    margin-top: 2px;
  }

  .form-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
  }

  .form-grid.three-col {
    grid-template-columns: repeat(3, 1fr);
  }

  .form-group {
    display: flex;
    flex-direction: column;
    min-width: 0;
  }

  .form-group.full-width {
    grid-column: 1 / -1;
  }

  .form-label {
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
    margin-bottom: 6px;
    display: flex;
    align-items: center;
    gap: 6px;
  }

  .form-label.editable {
    cursor: pointer;
    transition: color 0.15s;
  }

  .form-label.editable:hover {
    color: var(--brand-primary);
  }

  .form-label.editable svg {
    opacity: 0.3;
    transition: opacity 0.15s;
  }

  .form-label.editable:hover svg {
    opacity: 0.7;
  }

  .form-label-input {
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
    border: 1px solid var(--brand-primary);
    border-radius: 4px;
    padding: 4px 8px;
    margin-bottom: 6px;
    width: 100%;
    max-width: 250px;
    background: white;
  }

  .form-label-input:focus {
    outline: none;
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-primary) 20%, transparent);
  }

  .form-section-subtitle {
    display: flex;
    align-items: center;
    gap: 4px;
    cursor: pointer;
    transition: color 0.15s;
  }

  .form-section-subtitle:hover {
    color: var(--slate-600);
  }

  .form-section-subtitle svg {
    opacity: 0.3;
    transition: opacity 0.15s;
  }

  .form-section-subtitle:hover svg {
    opacity: 0.7;
  }

  .form-section-subtitle-input {
    font-size: 13px;
    color: var(--slate-500);
    border: 1px solid var(--brand-primary);
    border-radius: 4px;
    padding: 4px 8px;
    width: 100%;
    background: white;
  }

  .form-label .required {
    color: var(--rose-500);
  }

  .form-hint {
    font-size: 12px;
    color: var(--slate-400);
    margin-bottom: 8px;
    display: flex;
    align-items: flex-start;
    gap: 4px;
  }

  .form-hint svg {
    flex-shrink: 0;
    margin-top: 1px;
  }

  .form-input {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 12px 14px;
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    font-size: 15px;
    font-family: inherit;
    color: var(--slate-800);
    transition: all 0.2s;
    background: white;
  }

  .form-input:focus {
    outline: none;
    border-color: var(--teal-500);
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  .form-input::placeholder {
    color: var(--slate-400);
  }

  .form-input.with-prefix {
    padding-left: 32px;
  }

  .input-wrapper {
    position: relative;
  }

  .input-prefix {
    position: absolute;
    left: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--slate-400);
    font-size: 15px;
    font-weight: 500;
  }

  .input-suffix {
    position: absolute;
    right: 14px;
    top: 50%;
    transform: translateY(-50%);
    color: var(--slate-400);
    font-size: 13px;
  }

  .form-textarea {
    width: 100%;
    max-width: 100%;
    box-sizing: border-box;
    padding: 12px 14px;
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    font-size: 14px;
    font-family: inherit;
    color: var(--slate-800);
    resize: vertical;
    min-height: 80px;
    transition: all 0.2s;
  }

  .form-textarea:focus {
    outline: none;
    border-color: var(--teal-500);
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  /* Campaign subsection */
  .campaign-subsection {
    background: var(--slate-50);
    border-radius: 12px;
    padding: 20px;
  }

  .campaign-subsection-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
    margin-bottom: 16px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .campaign-subsection-title span {
    font-size: 18px;
  }

  /* Stories & Opportunities editable lists */
  .editable-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .editable-item {
    background: var(--slate-50);
    border-radius: 12px;
    padding: 20px;
    position: relative;
  }

  .editable-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .editable-item-number {
    width: 28px;
    height: 28px;
    background: var(--teal-500);
    color: white;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 13px;
    font-weight: 600;
  }

  .remove-btn {
    background: none;
    border: none;
    color: var(--slate-400);
    cursor: pointer;
    padding: 4px 8px;
    font-size: 13px;
    transition: color 0.2s;
  }

  .remove-btn:hover {
    color: var(--rose-500);
  }

  .add-item-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 14px;
    border: 2px dashed var(--slate-200);
    border-radius: 12px;
    background: transparent;
    color: var(--slate-500);
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .add-item-btn:hover {
    border-color: var(--brand-accent);
    color: var(--brand-primary);
    background: color-mix(in srgb, var(--brand-primary) 5%, white);
  }

  /* Save button area */
  .form-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 24px 0;
    position: sticky;
    bottom: 0;
    background: linear-gradient(to top, var(--slate-100) 60%, transparent);
    margin: 0 -32px -32px;
    padding: 24px 32px;
  }

  .save-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 14px 28px;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    color: white;
    border: none;
    border-radius: 12px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    box-shadow: 0 4px 12px color-mix(in srgb, var(--brand-primary) 30%, transparent);
    font-family: inherit;
  }

  .save-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 6px 20px color-mix(in srgb, var(--brand-primary) 40%, transparent);
  }

  .save-btn:active {
    transform: translateY(0);
  }

  .save-btn.success {
    background: linear-gradient(135deg, #059669, #047857);
  }

  .cancel-btn {
    padding: 14px 24px;
    background: white;
    color: var(--slate-600);
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    font-size: 15px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .cancel-btn:hover {
    background: var(--slate-50);
    border-color: var(--slate-300);
  }

  /* Info callout */
  .info-callout {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: #eff6ff;
    border: 1px solid #bfdbfe;
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .info-callout-icon {
    color: #2563eb;
    flex-shrink: 0;
  }

  .info-callout-text {
    font-size: 14px;
    color: #1e40af;
    line-height: 1.5;
  }

  /* Success toast */
  .toast {
    position: fixed;
    bottom: 32px;
    right: 32px;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 24px;
    background: #059669;
    color: white;
    border-radius: 12px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.15);
    animation: slideIn 0.3s ease;
    z-index: 1000;
  }

  @keyframes slideIn {
    from {
      transform: translateY(20px);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .toast-text {
    font-weight: 500;
  }

  /* Client Info Styles */
  .client-info-card {
    background: var(--slate-50);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .stakeholder-card {
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    padding: 16px;
    margin-bottom: 12px;
  }

  .stakeholder-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .stakeholder-badge {
    display: inline-block;
    padding: 4px 10px;
    background: var(--teal-100);
    color: var(--teal-700);
    border-radius: 20px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .stakeholder-badge.decision-maker {
    background: #fef3c7;
    color: #92400e;
  }

  .stakeholder-badge.primary-contact {
    background: #dbeafe;
    color: #1e40af;
  }

  .provider-row {
    display: grid;
    grid-template-columns: 1fr 140px 150px 100px auto;
    gap: 12px;
    align-items: center;
    padding: 12px;
    background: var(--slate-50);
    border-radius: 8px;
    margin-bottom: 8px;
  }

  .provider-row .form-input {
    margin: 0;
  }

  .verified-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    color: #059669;
  }

  .verified-badge.not-verified {
    color: var(--slate-400);
  }

  .team-member-card {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--slate-50);
    border-radius: 12px;
    margin-bottom: 12px;
  }

  .team-avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--teal-500), var(--teal-600));
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 600;
    font-size: 18px;
  }

  .team-info {
    flex: 1;
  }

  .team-name {
    font-weight: 600;
    color: var(--slate-800);
    font-size: 15px;
  }

  .team-role {
    font-size: 13px;
    color: var(--slate-500);
    margin-top: 2px;
  }

  .team-contact {
    font-size: 13px;
    color: var(--teal-600);
    margin-top: 4px;
  }

  .date-contract-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
  }

  .section-divider {
    height: 1px;
    background: var(--slate-200);
    margin: 24px 0;
  }

  .tab-nav {
    display: flex;
    flex-wrap: nowrap;
    gap: 3px;
    padding: 4px;
    background: var(--slate-100);
    border-radius: 12px;
    margin-bottom: 24px;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
    /* Hide scrollbar on desktop */
    scrollbar-width: none;
    -ms-overflow-style: none;
  }

  .tab-nav::-webkit-scrollbar {
    display: none;
  }

  .tab-btn {
    flex: 0 0 auto;
    min-width: fit-content;
    padding: 10px 10px;
    background: transparent;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 500;
    color: var(--slate-600);
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
    white-space: nowrap;
  }

  .tab-btn:hover {
    color: var(--slate-800);
  }

  .tab-btn.active {
    background: white;
    color: var(--brand-primary);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  /* Responsive tab navigation for medium screens */
  @media (max-width: 1200px) {
    .tab-nav {
      flex-wrap: wrap;
    }

    .tab-btn {
      flex: 1 1 auto;
      padding: 11px 12px;
      font-size: 12px;
    }

    .tab-btn svg {
      width: 15px;
      height: 15px;
    }
  }

  @media (max-width: 768px) {
    .tab-nav {
      flex-wrap: wrap;
      /* Show scrollbar on mobile */
      scrollbar-width: thin;
      scrollbar-color: rgba(0,0,0,0.2) transparent;
    }

    .tab-nav::-webkit-scrollbar {
      display: block;
      height: 4px;
    }

    .tab-nav::-webkit-scrollbar-track {
      background: transparent;
    }

    .tab-nav::-webkit-scrollbar-thumb {
      background: rgba(0,0,0,0.2);
      border-radius: 3px;
    }

    .tab-btn {
      flex: 1 1 auto;
      padding: 10px 12px;
      font-size: 12px;
    }

    .tab-btn svg {
      width: 14px;
      height: 14px;
    }

    .tab-btn span[style*="padding"] {
      padding: 1px 5px !important;
      font-size: 10px !important;
    }
  }

  @media (max-width: 640px) {
    .tab-nav {
      flex-wrap: wrap;
      gap: 3px;
      padding: 3px;
    }

    .tab-nav::-webkit-scrollbar {
      height: 3px;
    }

    .tab-btn {
      flex: 1 1 auto;
      padding: 8px 10px;
      font-size: 11px;
    }

    .tab-btn svg {
      width: 13px;
      height: 13px;
    }
  }

  /* Responsive form layouts */
  @media (max-width: 1024px) {
    .form-grid.three-col {
      grid-template-columns: repeat(2, 1fr);
    }
  }

  @media (max-width: 768px) {
    .form-grid,
    .form-grid.three-col {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .form-section {
      padding: 20px;
      margin-bottom: 20px;
    }

    .form-section-header {
      margin-bottom: 20px;
      padding-bottom: 12px;
    }

    .form-input,
    .form-textarea,
    select.form-input,
    .select-wrapper select {
      font-size: 14px;
      padding: 10px 12px;
    }

    .select-wrapper select {
      padding-right: 36px;
    }

    .form-label {
      font-size: 12px;
    }

    .form-hint {
      font-size: 11px;
    }

    .campaign-subsection {
      padding: 16px;
    }

    .editable-item {
      padding: 16px;
    }
  }

  @media (max-width: 640px) {
    .form-grid {
      gap: 14px;
    }

    .form-section {
      padding: 16px;
      margin-bottom: 16px;
      border-radius: 12px;
    }

    .form-section-header {
      margin-bottom: 16px;
      padding-bottom: 10px;
    }

    .form-input,
    .form-textarea,
    select.form-input,
    .select-wrapper select {
      font-size: 13px;
      padding: 9px 11px;
      border-radius: 8px;
    }

    .select-wrapper select {
      padding-right: 32px;
    }

    .input-prefix {
      left: 11px;
      font-size: 13px;
    }

    .input-suffix {
      right: 11px;
      font-size: 12px;
    }

    .form-input.with-prefix {
      padding-left: 28px;
    }

    .campaign-subsection {
      padding: 12px;
      border-radius: 8px;
    }

    .editable-item {
      padding: 12px;
      border-radius: 8px;
    }

    .form-label {
      font-size: 11px;
      margin-bottom: 5px;
    }

    .form-hint {
      font-size: 10px;
    }
  }

  .checkbox-wrapper {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .checkbox-wrapper input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: var(--teal-600);
  }

  /* Responsive floating buttons */
  @media (max-width: 768px) {
    .floating-save-btn,
    .floating-cancel-btn {
      padding: 14px 20px !important;
      font-size: 14px !important;
    }
  }

  @media (max-width: 640px) {
    .floating-save-btn,
    .floating-cancel-btn {
      padding: 12px 16px !important;
      font-size: 13px !important;
    }

    .floating-save-btn svg,
    .floating-cancel-btn svg {
      width: 16px;
      height: 16px;
    }
  }

  @media (max-width: 480px) {
    .floating-save-btn,
    .floating-cancel-btn {
      padding: 10px 14px !important;
      font-size: 12px !important;
    }

    .floating-save-btn svg,
    .floating-cancel-btn svg {
      width: 14px;
      height: 14px;
    }
  }

  /* PDF Report Modal Styles */
  .pdf-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: #f1f5f9;
    z-index: 1000;
    overflow-y: auto;
  }

  .pdf-modal-header {
    position: sticky;
    top: 0;
    background: white;
    border-bottom: 1px solid #e2e8f0;
    padding: 16px 24px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    z-index: 1001;
  }

  .pdf-modal-title h2 {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }

  .pdf-modal-title p {
    font-size: 13px;
    color: #64748b;
    margin: 4px 0 0 0;
  }

  .pdf-modal-actions {
    display: flex;
    gap: 12px;
  }

  .pdf-print-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    font-family: inherit;
  }

  .pdf-print-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  }

  .pdf-close-btn {
    padding: 10px 16px;
    background: #f1f5f9;
    color: #475569;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    font-family: inherit;
  }

  .pdf-close-btn:hover {
    background: #e2e8f0;
  }

  .pdf-report-container {
    padding: 32px;
    display: flex;
    justify-content: center;
  }

  .pdf-report {
    background: white;
    max-width: 800px;
    width: 100%;
    padding: 48px;
    box-shadow: 0 4px 24px rgba(0, 0, 0, 0.1);
    border-radius: 8px;
  }

  .pdf-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 32px;
    padding-bottom: 20px;
    border-bottom: 3px solid #14b8a6;
  }

  .pdf-logo-section h1 {
    font-family: 'Fraunces', serif;
    font-size: 28px;
    font-weight: 700;
    color: #14b8a6;
    margin: 0 0 4px 0;
  }

  .pdf-logo-section p {
    font-size: 11px;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 1.5px;
    margin: 0;
  }

  .pdf-meta {
    text-align: right;
  }

  .pdf-meta h2 {
    font-family: 'Fraunces', serif;
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 4px 0;
  }

  .pdf-meta p {
    font-size: 13px;
    color: #64748b;
    margin: 0;
  }

  .pdf-generated {
    font-size: 11px !important;
    margin-top: 4px !important;
  }

  .pdf-client-banner {
    background: linear-gradient(135deg, #f0fdfa 0%, #e0f2fe 100%);
    border-radius: 10px;
    padding: 20px 24px;
    margin-bottom: 28px;
  }

  .pdf-client-banner h3 {
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 4px 0;
  }

  .pdf-client-banner p {
    font-size: 13px;
    color: #475569;
    margin: 0;
  }

  .pdf-section {
    margin-bottom: 28px;
  }

  .pdf-section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  .pdf-section-icon {
    width: 32px;
    height: 32px;
    background: #14b8a6;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  }

  .pdf-section-icon.blue { background: #3b82f6; }
  .pdf-section-icon.amber { background: #f59e0b; }
  .pdf-section-icon.emerald { background: #10b981; }
  .pdf-section-icon.rose { background: #f43f5e; }

  .pdf-section-header h2 {
    font-family: 'Fraunces', serif;
    font-size: 17px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }

  .pdf-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .pdf-kpi-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 10px;
    padding: 16px 12px;
    text-align: center;
  }

  .pdf-kpi-value {
    font-family: 'Fraunces', serif;
    font-size: 26px;
    font-weight: 700;
    color: #0f172a;
  }

  .pdf-kpi-label {
    font-size: 11px;
    color: #64748b;
    margin: 4px 0 8px 0;
  }

  .pdf-kpi-delta {
    font-size: 11px;
    font-weight: 600;
    padding: 3px 8px;
    border-radius: 12px;
    display: inline-block;
  }

  .pdf-kpi-delta.positive {
    background: color-mix(in srgb, var(--brand-primary) 15%, white);
    color: var(--brand-primary);
  }

  .pdf-kpi-delta.negative {
    background: #fee2e2;
    color: #dc2626;
  }

  .pdf-two-col {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 20px;
  }

  .pdf-subsection-title {
    font-size: 13px;
    font-weight: 600;
    color: #475569;
    margin: 0 0 10px 0;
  }

  .pdf-table {
    width: 100%;
    border-collapse: collapse;
  }

  .pdf-table td {
    padding: 10px 0;
    border-bottom: 1px solid #e2e8f0;
    font-size: 13px;
  }

  .pdf-table td:last-child {
    text-align: right;
    font-weight: 600;
    color: #0f172a;
  }

  .pdf-table td.highlight {
    color: #14b8a6 !important;
  }

  .pdf-table tr:last-child td {
    border-bottom: none;
  }

  .pdf-campaign-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 14px;
  }

  .pdf-campaign-card {
    background: #f8fafc;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    padding: 14px;
    text-align: center;
  }

  .pdf-campaign-card h4 {
    font-size: 13px;
    font-weight: 600;
    color: #334155;
    margin: 0 0 10px 0;
  }

  .pdf-campaign-stat {
    display: flex;
    justify-content: space-between;
    font-size: 12px;
    padding: 3px 0;
  }

  .pdf-campaign-stat span:first-child {
    color: #64748b;
  }

  .pdf-campaign-stat span:last-child {
    font-weight: 600;
    color: #0f172a;
  }

  .pdf-outcomes-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 14px;
  }

  .pdf-outcome-card {
    background: linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 10%, white) 0%, color-mix(in srgb, var(--brand-primary) 20%, white) 100%);
    border-radius: 10px;
    padding: 18px 12px;
    text-align: center;
  }

  .pdf-outcome-value {
    font-family: 'Fraunces', serif;
    font-size: 28px;
    font-weight: 700;
    color: var(--brand-secondary);
  }

  .pdf-outcome-label {
    font-size: 11px;
    color: var(--brand-primary);
    margin-top: 4px;
  }

  .pdf-story-card {
    background: #fffbeb;
    border-left: 4px solid #f59e0b;
    border-radius: 0 8px 8px 0;
    padding: 14px 18px;
    margin-bottom: 10px;
  }

  .pdf-story-card h4 {
    font-size: 13px;
    font-weight: 600;
    color: #92400e;
    margin: 0 0 6px 0;
  }

  .pdf-story-card p {
    font-size: 13px;
    color: #78350f;
    font-style: italic;
    margin: 0;
  }

  .pdf-patient-type {
    font-size: 11px;
    color: #a16207;
    margin-top: 6px;
    font-style: normal;
  }

  .pdf-opportunity-item {
    display: flex;
    gap: 12px;
    padding: 10px 0;
    border-bottom: 1px solid #e2e8f0;
  }

  .pdf-opportunity-item:last-child {
    border-bottom: none;
  }

  .pdf-opportunity-number {
    width: 22px;
    height: 22px;
    background: #f43f5e;
    color: white;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 11px;
    font-weight: 600;
    flex-shrink: 0;
  }

  .pdf-opportunity-content h4 {
    font-size: 13px;
    font-weight: 600;
    color: #0f172a;
    margin: 0 0 2px 0;
  }

  .pdf-opportunity-content p {
    font-size: 12px;
    color: #64748b;
    margin: 0;
  }

  .pdf-csm-info {
    background: #f1f5f9;
    border-radius: 8px;
    padding: 16px;
    margin-top: 24px;
  }

  .pdf-csm-info h4 {
    font-size: 12px;
    font-weight: 600;
    color: #475569;
    margin: 0 0 8px 0;
  }

  .pdf-csm-info p {
    font-size: 13px;
    color: #0f172a;
    margin: 0;
  }

  .pdf-contact {
    color: #14b8a6 !important;
    margin-top: 4px !important;
  }

  .pdf-footer {
    margin-top: 32px;
    padding-top: 16px;
    border-top: 1px solid #e2e8f0;
    display: flex;
    justify-content: space-between;
    font-size: 11px;
    color: #64748b;
  }

  /* Print-specific styles */
  @media print {
    /* Hide everything in body except the PDF report */
    body.printing-pdf-report .dashboard,
    body.printing-pdf-report .sidebar,
    body.printing-pdf-report .topbar,
    body.printing-pdf-report .main-content,
    body.printing-pdf-report .page-content,
    body.printing-pdf-report .modal-overlay:not(.pdf-modal-overlay),
    body.printing-pdf-report .pres-editor-overlay {
      display: none !important;
      visibility: hidden !important;
    }
    
    /* Hide all no-print elements */
    .no-print,
    .pdf-modal-header {
      display: none !important;
    }
    
    /* Make PDF modal full page for printing */
    body.printing-pdf-report .pdf-modal-overlay,
    body.printing-pdf-report .pdf-printable {
      display: block !important;
      position: absolute !important;
      top: 0 !important;
      left: 0 !important;
      right: 0 !important;
      bottom: auto !important;
      width: 100% !important;
      height: auto !important;
      background: white !important;
      padding: 0 !important;
      margin: 0 !important;
      overflow: visible !important;
      z-index: 999999 !important;
    }

    .pdf-report-container {
      padding: 0 !important;
      overflow: visible !important;
      height: auto !important;
      max-height: none !important;
      background: white !important;
    }

    .pdf-report {
      box-shadow: none !important;
      padding: 0.25in !important;
      max-width: none !important;
      width: 100% !important;
      margin: 0 !important;
      background: white !important;
    }
    
    .pdf-section {
      page-break-inside: avoid;
      margin-bottom: 15px !important;
    }
    
    .pdf-header {
      page-break-after: avoid;
    }
    
    .pdf-stories-section,
    .pdf-opportunities-section {
      page-break-before: auto;
    }

    /* Ensure colors print */
    * {
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }
    
    /* Page setup */
    @page {
      size: letter;
      margin: 0.4in;
    }
    
    /* Fallback: also hide dashboard without body class */
    .dashboard {
      display: none !important;
    }
    
    .pdf-modal-overlay {
      display: block !important;
      position: static !important;
      background: white !important;
    }
  }

  /* ============================================================
     RESPONSIVE DESIGN - Media Queries
     ============================================================ */

  /* Large tablets and small laptops (1024px - 1366px) */
  @media (max-width: 1366px) {
    .sidebar {
      width: 220px;
      padding: 20px 12px;
    }

    .main-content {
      margin-left: 220px;
    }

    .topbar {
      padding: 14px 24px;
    }

    .page-header {
      padding: 24px 32px;
    }

    .page-content {
      padding: 0 32px 32px;
    }

    .logo-text {
      font-size: 18px;
    }

    .nav-item {
      padding: 12px 14px;
      font-size: 13px;
    }

    .nav-item svg {
      width: 18px;
      height: 18px;
    }
  }

  /* Standard tablets and smaller laptops (1025px - 1200px) */
  @media (max-width: 1200px) {
    .kpi-grid, .outcomes-grid {
      grid-template-columns: repeat(2, 1fr);
      gap: 14px;
    }

    .two-col-grid {
      grid-template-columns: 1fr;
    }

    .chart-container {
      min-height: 280px;
    }

    .pres-editor {
      max-width: 95%;
    }
  }

  /* Tablets portrait mode (768px - 1024px) */
  @media (max-width: 1024px) {
    .sidebar {
      width: 200px;
      padding: 16px 10px;
    }

    .main-content {
      margin-left: 200px;
    }

    .topbar {
      padding: 12px 20px;
      flex-wrap: wrap;
      gap: 12px;
    }

    .topbar-left, .topbar-right {
      gap: 12px;
    }

    .page-header {
      padding: 20px 24px;
    }

    .page-content {
      padding: 0 24px 24px;
    }

    .page-title {
      font-size: 26px;
    }

    .logo-text {
      font-size: 16px;
    }

    .nav-item {
      padding: 10px 12px;
      font-size: 12px;
      gap: 10px;
    }

    .nav-item svg {
      width: 16px;
      height: 16px;
    }

    .settings-submenu .nav-item.sub-item {
      padding: 8px 12px;
      font-size: 12px;
    }

    .btn {
      padding: 8px 16px;
      font-size: 13px;
    }

    .export-btn, .present-btn {
      padding: 8px 16px;
      font-size: 13px;
    }

    .kpi-card {
      padding: 18px;
    }

    .kpi-value {
      font-size: 28px;
    }

    .chart-container {
      min-height: 260px;
    }

    .select-wrapper select {
      padding: 8px 32px 8px 12px;
      font-size: 13px;
    }

    .sidebar-user-info {
      padding: 10px;
      gap: 10px;
    }

    .sidebar-user-avatar {
      width: 32px;
      height: 32px;
      font-size: 13px;
    }

    .sidebar-user-name {
      font-size: 13px;
    }

    .sidebar-user-role {
      font-size: 11px;
    }
  }

  /* Mobile and small tablets (max 768px) */
  @media (max-width: 768px) {
    .mobile-menu-btn {
      display: flex;
    }

    .sidebar-overlay {
      display: block;
    }

    .sidebar {
      width: 280px;
      max-width: 85vw;
      position: fixed;
      left: -100%;
      transition: left 0.3s ease;
      z-index: 1000;
      height: 100vh;
      overflow-y: auto;
    }

    .sidebar.open {
      left: 0;
      box-shadow: 4px 0 20px rgba(0, 0, 0, 0.15);
    }

    .main-content {
      margin-left: 0;
      width: 100%;
    }

    .notification-dropdown {
      width: calc(100vw - 32px);
      max-width: 360px;
      right: auto;
      left: 50%;
      transform: translateX(-50%);
    }

    .topbar {
      padding: 12px 16px;
      flex-wrap: wrap;
    }

    .topbar-left, .topbar-right {
      flex-wrap: wrap;
      gap: 8px;
    }

    .page-header {
      padding: 16px;
    }

    .page-content {
      padding: 0 16px 16px;
      max-width: 100vw;
      overflow-x: hidden;
    }

    .page-title {
      font-size: 22px;
    }

    .kpi-grid, .outcomes-grid {
      grid-template-columns: 1fr;
      gap: 16px;
      width: 100%;
    }

    .two-col-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .summary-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .summary-card {
      padding: 20px;
    }

    .chart-container {
      min-height: 240px;
    }

    .select-wrapper select {
      padding: 8px 28px 8px 10px;
      font-size: 13px;
      min-width: 120px;
    }

    .btn {
      padding: 8px 12px;
      font-size: 12px;
    }

    .export-btn, .present-btn {
      padding: 8px 12px;
      font-size: 12px;
      gap: 4px;
    }

    .export-btn span, .present-btn span {
      display: none;
    }

    .kpi-card {
      padding: 16px;
    }

    .kpi-label {
      font-size: 12px;
    }

    .kpi-value {
      font-size: 24px;
    }

    .kpi-delta {
      font-size: 12px;
    }

    table {
      font-size: 13px;
    }

    th, td {
      padding: 10px 12px;
    }

    .modal-content {
      width: 95%;
      max-width: 95%;
      padding: 20px;
    }

    .pres-editor {
      max-width: 100%;
      height: 95vh;
      margin: 0;
    }
  }

  /* Very small screens (max 480px) */
  @media (max-width: 480px) {
    .notification-popup {
      min-width: 280px;
      max-width: calc(100vw - 24px);
      margin: 0 12px;
    }

    .topbar {
      padding: 10px 12px;
    }

    .page-header {
      padding: 12px;
    }

    .page-content {
      padding: 0 12px 12px;
    }

    .page-title {
      font-size: 20px;
    }

    .select-wrapper select {
      font-size: 12px;
      padding: 6px 24px 6px 8px;
    }

    .btn {
      padding: 6px 10px;
      font-size: 12px;
    }

    .kpi-card {
      padding: 14px;
    }

    .kpi-value {
      font-size: 20px;
    }

    .chart-container {
      min-height: 200px;
    }
  }

  /* Ensure scrolling works properly on all screen sizes */
  @media (max-width: 1366px) {
    .page-content {
      overflow-x: auto;
      overflow-y: auto;
    }

    .dashboard-grid, .kpi-grid, .outcomes-grid {
      min-width: min-content;
    }

    table {
      display: block;
      overflow-x: auto;
      white-space: nowrap;
    }
  }

  /* ============================================================
     PRESENTATION MODE STYLES
     ============================================================ */
  
  /* Editor Overlay */
  .pres-editor-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(15, 23, 42, 0.9);
    z-index: 2000;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
  }

  .pres-editor {
    background: white;
    border-radius: 16px;
    width: 100%;
    max-width: 1400px;
    height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
  }

  .pres-editor-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--slate-200);
    background: var(--slate-50);
  }

  .pres-editor-header h2 {
    font-size: 20px;
    font-weight: 700;
    color: var(--slate-900);
    margin: 0;
  }

  .pres-editor-header p {
    font-size: 14px;
    color: var(--slate-500);
    margin: 4px 0 0 0;
  }

  .pres-editor-actions {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  .pres-anim-select {
    padding: 10px 14px;
    border: 1px solid var(--slate-200);
    border-radius: 8px;
    font-size: 14px;
    background: white;
    cursor: pointer;
  }

  .pres-start-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 24px;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 15px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pres-start-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 20px color-mix(in srgb, var(--brand-primary) 40%, transparent);
  }

  .pres-close-btn {
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: var(--slate-100);
    border: none;
    border-radius: 10px;
    font-size: 18px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pres-close-btn:hover {
    background: var(--slate-200);
  }

  .pres-editor-body {
    display: flex;
    flex: 1;
    overflow: hidden;
  }

  /* Slides List */
  .pres-slides-list {
    width: 320px;
    border-right: 1px solid var(--slate-200);
    display: flex;
    flex-direction: column;
    background: var(--slate-50);
  }

  .pres-slides-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px;
    border-bottom: 1px solid var(--slate-200);
  }

  .pres-slides-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
    margin: 0;
  }

  .pres-add-slide-btn {
    padding: 6px 12px;
    background: var(--brand-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pres-add-slide-btn:hover {
    background: var(--brand-secondary);
  }

  .pres-add-btns {
    display: flex;
    gap: 8px;
  }

  .pres-add-btn {
    padding: 6px 12px;
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pres-add-btn:hover {
    background: color-mix(in srgb, var(--brand-primary) 10%, white);
    border-color: var(--brand-accent);
    color: var(--brand-primary);
  }

  .pres-slides-scroll {
    flex: 1;
    overflow-y: auto;
    padding: 12px;
  }

  .pres-slide-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    margin-bottom: 8px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pres-slide-item:hover {
    border-color: var(--brand-accent);
    box-shadow: 0 2px 8px color-mix(in srgb, var(--brand-primary) 10%, transparent);
  }

  .pres-slide-item.disabled {
    opacity: 0.5;
  }

  .pres-slide-item.dragging {
    opacity: 0.5;
    border-style: dashed;
  }

  .pres-slide-drag {
    color: var(--slate-400);
    cursor: grab;
    font-size: 12px;
    letter-spacing: -2px;
  }

  .pres-slide-thumb {
    width: 48px;
    height: 36px;
    background: linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 20%, white), color-mix(in srgb, var(--brand-primary) 10%, white));
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
  }

  .pres-slide-info {
    flex: 1;
    min-width: 0;
  }

  .pres-slide-title {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-800);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .pres-slide-type {
    display: block;
    font-size: 11px;
    color: var(--slate-500);
    text-transform: capitalize;
  }

  .pres-slide-actions {
    display: flex;
    gap: 4px;
  }

  .pres-toggle-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 16px;
    color: var(--slate-300);
    transition: all 0.2s;
  }

  .pres-toggle-btn.active {
    color: var(--emerald-500);
  }

  .pres-delete-slide-btn {
    width: 22px;
    height: 22px;
    border: none;
    background: var(--rose-100);
    color: var(--rose-600);
    border-radius: 4px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    line-height: 1;
  }

  .pres-delete-slide-btn:hover {
    background: var(--rose-200);
    color: var(--rose-700);
  }

  .pres-delete-btn {
    width: 28px;
    height: 28px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    opacity: 0.5;
    transition: all 0.2s;
  }

  .pres-delete-btn:hover {
    opacity: 1;
  }

  /* Preview Panel */
  .pres-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    background: white;
    border-bottom: 1px solid var(--slate-200);
  }

  .pres-preview-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
    margin: 0;
  }

  .pres-edit-hint {
    font-size: 12px;
    color: var(--teal-600);
  }

  .pres-preview-content {
    flex: 1;
    padding: 24px;
    padding-bottom: 220px; /* Space for properties panel when expanded */
    display: flex;
    align-items: flex-start;
    justify-content: center;
    overflow: auto;
  }

  .pres-no-selection {
    color: var(--slate-400);
    font-size: 14px;
  }

  .pres-preview-slide {
    width: 100%;
    max-width: 900px;
    aspect-ratio: 16/9;
    background: linear-gradient(135deg, #0f3d3e 0%, #0d4f4f 50%, #115e59 100%);
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
    position: relative;
  }

  .pres-preview-slide .pres-slide-wrapper {
    transform: scale(0.55);
    transform-origin: top left;
    width: 181.8%;
    height: 181.8%;
  }

  /* Content wrapper in editor - handles layout positioning */
  .pres-preview-slide .pres-content-wrapper {
    overflow: hidden;
    border-radius: 8px;
  }

  /* The inner scaling wrapper */
  .pres-preview-slide .pres-content-wrapper > div {
    overflow: visible;
  }

  .pres-preview-slide .pres-content-wrapper .pres-slide-wrapper {
    transform: none !important;
    width: 100%;
    height: 100%;
  }

  /* Slide Editor */
  .pres-slide-editor {
    width: 100%;
  }

  .pres-edit-field {
    margin-bottom: 16px;
  }

  .pres-edit-field label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--slate-600);
    margin-bottom: 6px;
  }

  .pres-edit-field input,
  .pres-edit-field textarea {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--slate-200);
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s;
  }

  .pres-edit-field input:focus,
  .pres-edit-field textarea:focus {
    outline: none;
    border-color: var(--teal-400);
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  .pres-edit-field textarea {
    resize: vertical;
    min-height: 120px;
  }

  /* Presentation Viewer (Fullscreen) */
  .pres-viewer {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    z-index: 3000;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .pres-slide {
    position: relative;
    width: 90%;
    max-width: 1200px;
    aspect-ratio: 16/9;
  }

  .pres-content-positioned {
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
  }

  .pres-content-positioned > * {
    width: 100%;
    height: 100%;
  }

  /* Slide Animations */
  .pres-anim-fade {
    animation: presFadeIn 0.5s ease-out;
  }

  @keyframes presFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .pres-anim-slide {
    animation: presSlideIn 0.5s ease-out;
  }

  @keyframes presSlideIn {
    from { transform: translateX(100px); opacity: 0; }
    to { transform: translateX(0); opacity: 1; }
  }

  .pres-anim-zoom {
    animation: presZoomIn 0.5s ease-out;
  }

  @keyframes presZoomIn {
    from { transform: scale(0.8); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
  }

  .pres-anim-flip {
    animation: presFlipIn 0.6s ease-out;
  }

  @keyframes presFlipIn {
    from { transform: perspective(1000px) rotateY(-90deg); opacity: 0; }
    to { transform: perspective(1000px) rotateY(0); opacity: 1; }
  }

  /* Presentation Controls */
  .pres-controls {
    position: fixed;
    bottom: 40px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    padding: 12px 24px;
    border-radius: 50px;
    border: 1px solid rgba(255, 255, 255, 0.2);
    z-index: 3001;
  }

  .pres-nav-btn {
    width: 44px;
    height: 44px;
    border: none;
    background: rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 50%;
    font-size: 16px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .pres-nav-btn:hover:not(:disabled) {
    background: rgba(255, 255, 255, 0.3);
    transform: scale(1.1);
  }

  .pres-nav-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .pres-progress {
    color: white;
    font-size: 14px;
    font-weight: 500;
    min-width: 60px;
    text-align: center;
  }

  .pres-exit-btn {
    position: fixed;
    top: 20px;
    right: 20px;
    padding: 10px 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
    z-index: 3001;
  }

  .pres-exit-btn:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .pres-progress-bar {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: 4px;
    background: rgba(255, 255, 255, 0.1);
  }

  .pres-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--brand-primary), var(--brand-accent));
    transition: width 0.3s ease-out;
  }

  /* Slide Layouts */
  .pres-slide > div,
  .pres-slide .pres-content-positioned > div,
  .pres-preview-slide .pres-content-wrapper .pres-slide-wrapper > div,
  .pres-preview-slide .pres-slide-wrapper > div {
    width: 100%;
    height: 100%;
    padding: 60px;
    display: flex;
    flex-direction: column;
    color: white;
  }

  /* Title Slide */
  .pres-slide-title-layout {
    justify-content: center;
    align-items: center;
    text-align: center;
    position: relative;
  }

  .pres-title-content {
    z-index: 1;
  }

  .pres-main-title {
    font-family: 'Fraunces', serif;
    font-size: 64px;
    font-weight: 700;
    margin: 0 0 16px 0;
  }

  .pres-main-subtitle {
    font-size: 32px;
    font-weight: 400;
    margin: 0 0 24px 0;
    color: rgba(255, 255, 255, 0.9);
  }

  .pres-main-meta {
    font-size: 18px;
    color: rgba(255, 255, 255, 0.6);
    margin: 0;
  }

  .pres-title-decoration {
    position: absolute;
    width: 400px;
    height: 400px;
    border-radius: 50%;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
  }

  /* Section Title */
  .pres-section-title {
    font-family: 'Fraunces', serif;
    font-size: 42px;
    font-weight: 600;
    margin: 0 0 40px 0;
    text-align: center;
    color: white;
  }

  /* KPIs Slide */
  .pres-slide-kpis-layout {
    justify-content: center;
  }

  .pres-kpi-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .pres-kpi-card {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 16px;
    padding: 32px 24px;
    text-align: center;
  }

  .pres-kpi-card.teal { border-top: 4px solid var(--brand-primary); }
  .pres-kpi-card.emerald { border-top: 4px solid #10b981; }
  .pres-kpi-card.amber { border-top: 4px solid #f59e0b; }
  .pres-kpi-card.rose { border-top: 4px solid #f43f5e; }

  .pres-kpi-value {
    font-family: 'Fraunces', serif;
    font-size: 48px;
    font-weight: 700;
    margin-bottom: 8px;
  }

  .pres-kpi-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-bottom: 12px;
  }

  .pres-kpi-delta {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 20px;
    font-size: 13px;
    font-weight: 600;
  }

  .pres-kpi-delta.positive {
    background: color-mix(in srgb, var(--brand-primary) 20%, transparent);
    color: var(--brand-accent);
  }

  /* Enrollment Slide */
  .pres-slide-enrollment-layout {
    justify-content: center;
  }

  .pres-enrollment-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 40px;
  }

  .pres-funnel-section h3,
  .pres-campaign-section h3 {
    font-size: 20px;
    font-weight: 600;
    margin: 0 0 24px 0;
    color: rgba(255, 255, 255, 0.9);
  }

  .pres-funnel {
    display: flex;
    align-items: center;
    gap: 20px;
    flex-wrap: wrap;
  }

  .pres-funnel-step {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 24px 32px;
    text-align: center;
  }

  .pres-funnel-value {
    display: block;
    font-family: 'Fraunces', serif;
    font-size: 36px;
    font-weight: 700;
  }

  .pres-funnel-label {
    display: block;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin-top: 4px;
  }

  .pres-funnel-arrow {
    font-size: 24px;
    color: rgba(255, 255, 255, 0.5);
  }

  .pres-funnel-rate {
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    padding: 8px 16px;
    border-radius: 20px;
    font-size: 14px;
    font-weight: 600;
  }

  .pres-campaign-cards {
    display: flex;
    gap: 16px;
  }

  .pres-campaign-card {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 12px;
    padding: 20px;
    text-align: center;
  }

  .pres-camp-icon {
    font-size: 28px;
    display: block;
    margin-bottom: 8px;
  }

  .pres-camp-name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 4px;
  }

  .pres-camp-stat {
    display: block;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.7);
  }

  /* Outcomes Slide */
  .pres-slide-outcomes-layout {
    justify-content: center;
  }

  .pres-outcomes-grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 24px;
  }

  .pres-outcome-card {
    background: linear-gradient(135deg, color-mix(in srgb, var(--brand-primary) 20%, transparent) 0%, color-mix(in srgb, var(--brand-primary) 10%, transparent) 100%);
    border: 1px solid color-mix(in srgb, var(--brand-primary) 30%, transparent);
    border-radius: 16px;
    padding: 32px;
    text-align: center;
    position: relative;
  }

  .pres-outcome-value {
    font-family: 'Fraunces', serif;
    font-size: 48px;
    font-weight: 700;
    color: var(--brand-accent);
  }

  .pres-outcome-label {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.8);
    margin-top: 8px;
  }

  .pres-outcome-icon {
    position: absolute;
    top: 16px;
    right: 16px;
    font-size: 24px;
    opacity: 0.5;
  }

  /* Stories Slide */
  .pres-slide-stories-layout {
    justify-content: center;
  }

  .pres-stories-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 24px;
  }

  .pres-story-card {
    background: rgba(255, 255, 255, 0.1);
    border-left: 4px solid var(--brand-primary);
    border-radius: 0 12px 12px 0;
    padding: 24px;
  }

  .pres-story-quote {
    font-size: 16px;
    font-style: italic;
    line-height: 1.6;
    margin-bottom: 16px;
    color: rgba(255, 255, 255, 0.9);
  }

  .pres-story-meta {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .pres-story-title {
    font-size: 14px;
    font-weight: 600;
    color: var(--brand-accent);
  }

  .pres-story-patient {
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
  }

  /* Opportunities Slide */
  .pres-slide-opps-layout {
    justify-content: center;
  }

  .pres-opps-list {
    max-width: 800px;
    margin: 0 auto;
  }

  .pres-opp-item {
    display: flex;
    gap: 20px;
    padding: 20px 0;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  }

  .pres-opp-item:last-child {
    border-bottom: none;
  }

  .pres-opp-number {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 18px;
    font-weight: 700;
    flex-shrink: 0;
  }

  .pres-opp-content h4 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 6px 0;
  }

  .pres-opp-content p {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
    margin: 0;
    line-height: 1.5;
  }

  /* Closing Slide */
  .pres-slide-closing-layout {
    justify-content: center;
    align-items: center;
    text-align: center;
  }

  .pres-closing-title {
    font-family: 'Fraunces', serif;
    font-size: 72px;
    font-weight: 700;
    margin: 0 0 16px 0;
  }

  .pres-closing-subtitle {
    font-size: 28px;
    font-weight: 400;
    color: rgba(255, 255, 255, 0.8);
    margin: 0 0 48px 0;
  }

  .pres-csm-card {
    display: flex;
    align-items: center;
    gap: 20px;
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    padding: 24px 32px;
    border-radius: 16px;
  }

  .pres-csm-avatar {
    width: 64px;
    height: 64px;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 24px;
    font-weight: 700;
  }

  .pres-csm-info {
    text-align: left;
  }

  .pres-csm-name {
    font-size: 20px;
    font-weight: 600;
  }

  .pres-csm-role {
    font-size: 14px;
    color: rgba(255, 255, 255, 0.7);
  }

  .pres-csm-contact {
    font-size: 14px;
    color: var(--brand-accent);
    margin-top: 4px;
  }

  /* Text Slide */
  .pres-slide-text-layout {
    justify-content: center;
    align-items: center;
  }

  .pres-text-content {
    font-size: 24px;
    line-height: 1.6;
    text-align: center;
    max-width: 800px;
    color: rgba(255, 255, 255, 0.9);
  }

  /* Image Slide */
  .pres-slide-image-layout {
    justify-content: center;
    align-items: center;
  }

  .pres-image {
    max-width: 100%;
    max-height: 70%;
    object-fit: contain;
    border-radius: 12px;
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);
  }

  .pres-image-placeholder {
    width: 400px;
    height: 300px;
    background: rgba(255, 255, 255, 0.1);
    border: 2px dashed rgba(255, 255, 255, 0.3);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
  }

  .pres-image-placeholder span {
    font-size: 48px;
    margin-bottom: 12px;
  }

  /* Custom Slide */
  .pres-slide-custom-layout {
    justify-content: flex-start;
    align-items: center;
    padding-top: 80px;
  }

  .pres-custom-hint {
    color: rgba(255, 255, 255, 0.4);
    font-size: 18px;
    font-style: italic;
    margin-top: 40px;
  }

  /* Selected slide item */
  .pres-slide-item.selected {
    border-color: var(--teal-500);
    background: var(--teal-50);
    box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.2);
  }

  /* Element add buttons */
  .pres-element-btns {
    display: flex;
    gap: 8px;
    align-items: center;
    flex-wrap: wrap;
  }
  
  .pres-editor-tip {
    font-size: 11px;
    color: var(--slate-500);
    margin-right: 8px;
  }

  .pres-add-elem-btn {
    padding: 6px 14px;
    background: color-mix(in srgb, var(--brand-primary) 10%, white);
    border: 1px solid color-mix(in srgb, var(--brand-primary) 30%, white);
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    color: var(--brand-secondary);
    cursor: pointer;
    transition: all 0.2s;
  }

  .pres-add-elem-btn:hover {
    background: color-mix(in srgb, var(--brand-primary) 20%, white);
    border-color: var(--brand-primary);
  }

  /* Background picker */
  .pres-bg-picker-wrapper {
    position: relative;
  }

  .pres-bg-picker-dropdown {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    box-shadow: 0 10px 40px rgba(0,0,0,0.15);
    padding: 16px;
    z-index: 1000;
    min-width: 280px;
  }

  .pres-bg-picker-title {
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
    margin-bottom: 12px;
  }

  .pres-bg-presets-grid {
    display: grid;
    grid-template-columns: repeat(5, 1fr);
    gap: 8px;
    margin-bottom: 16px;
  }

  .pres-bg-preset-btn {
    width: 44px;
    height: 32px;
    border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-size: 12px;
    font-weight: bold;
  }

  .pres-bg-preset-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
  }

  .pres-bg-preset-btn.active {
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 2px var(--brand-primary);
  }

  .pres-bg-custom {
    display: flex;
    align-items: center;
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--slate-200);
  }

  .pres-bg-custom label {
    font-size: 12px;
    color: var(--slate-600);
  }

  .pres-bg-custom input[type="color"] {
    width: 48px;
    height: 28px;
    border: none;
    border-radius: 4px;
    cursor: pointer;
  }

  /* Editor canvas */
  .pres-editor-canvas {
    position: relative;
    cursor: default;
    overflow: hidden;
  }

  /* Content wrapper - the main slide content that can be moved/resized */
  .pres-content-wrapper {
    position: absolute;
    overflow: hidden;
    border: 2px solid transparent;
    border-radius: 4px;
    transition: border-color 0.15s, box-shadow 0.15s;
  }

  .pres-content-wrapper:hover {
    border-color: color-mix(in srgb, var(--brand-primary) 30%, transparent);
    cursor: move;
  }

  .pres-content-wrapper.selected {
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-primary) 15%, transparent);
  }

  .pres-content-wrapper.dragging {
    cursor: grabbing;
    box-shadow: 0 4px 16px rgba(0,0,0,0.2);
  }

  .pres-content-handles {
    z-index: 50;
  }

  .pres-content-handles .pres-elem-handle {
    position: absolute;
  }

  .pres-content-handles .pres-elem-handle.nw { top: 0; left: 0; cursor: nwse-resize; }
  .pres-content-handles .pres-elem-handle.n { top: 0; left: 50%; margin-left: -6px; cursor: ns-resize; }
  .pres-content-handles .pres-elem-handle.ne { top: 0; right: 0; cursor: nesw-resize; }
  .pres-content-handles .pres-elem-handle.w { top: 50%; left: 0; margin-top: -6px; cursor: ew-resize; }
  .pres-content-handles .pres-elem-handle.e { top: 50%; right: 0; margin-top: -6px; cursor: ew-resize; }
  .pres-content-handles .pres-elem-handle.sw { bottom: 0; left: 0; cursor: nesw-resize; }
  .pres-content-handles .pres-elem-handle.s { bottom: 0; left: 50%; margin-left: -6px; cursor: ns-resize; }
  .pres-content-handles .pres-elem-handle.se { bottom: 0; right: 0; cursor: nwse-resize; }

  .pres-editor-overlays {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .pres-editor-elem {
    position: absolute;
    pointer-events: auto;
    padding: 4px;
    border: 2px solid transparent;
    border-radius: 4px;
    transition: border-color 0.15s, box-shadow 0.15s;
    user-select: none;
  }

  .pres-editor-elem:hover {
    border-color: rgba(20, 184, 166, 0.5);
    cursor: move;
  }

  .pres-editor-elem.selected {
    border-color: var(--teal-400);
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.25);
  }

  .pres-editor-elem.dragging {
    opacity: 0.9;
    cursor: grabbing;
    box-shadow: 0 8px 20px rgba(0,0,0,0.3);
    z-index: 1000;
  }
  
  .pres-editor-elem.resizing {
    box-shadow: 0 4px 16px rgba(0,0,0,0.25);
  }

  .pres-editor-elem.editing {
    cursor: text;
    z-index: 100;
  }

  .pres-editor-elem.editing textarea {
    cursor: text;
  }
  
  .pres-editor-elem-tooltip {
    position: absolute;
    bottom: 100%;
    left: 50%;
    transform: translateX(-50%);
    background: rgba(0,0,0,0.8);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    white-space: nowrap;
    margin-bottom: 4px;
    pointer-events: none;
    z-index: 1001;
  }

  .pres-elem-handles,
  .pres-resize-handles {
    position: absolute;
    pointer-events: none;
    border: 2px dashed var(--brand-primary);
    border-radius: 4px;
    background: color-mix(in srgb, var(--brand-primary) 5%, transparent);
  }

  .pres-elem-handle {
    position: absolute;
    width: 12px;
    height: 12px;
    background: var(--brand-primary);
    border: 2px solid white;
    border-radius: 3px;
    pointer-events: auto;
    z-index: 100;
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
    cursor: pointer;
    transition: transform 0.1s, background 0.1s;
  }

  .pres-elem-handle:hover {
    background: var(--brand-accent);
    transform: scale(1.15);
  }

  .pres-elem-handle:active {
    background: var(--brand-secondary);
  }

  .pres-resize-handles .pres-elem-handle.nw { top: -6px; left: -6px; cursor: nwse-resize; }
  .pres-resize-handles .pres-elem-handle.n { top: -6px; left: 50%; margin-left: -6px; cursor: ns-resize; }
  .pres-resize-handles .pres-elem-handle.ne { top: -6px; right: -6px; cursor: nesw-resize; }
  .pres-resize-handles .pres-elem-handle.w { top: 50%; left: -6px; margin-top: -6px; cursor: ew-resize; }
  .pres-resize-handles .pres-elem-handle.e { top: 50%; right: -6px; margin-top: -6px; cursor: ew-resize; }
  .pres-resize-handles .pres-elem-handle.sw { bottom: -6px; left: -6px; cursor: nesw-resize; }
  .pres-resize-handles .pres-elem-handle.s { bottom: -6px; left: 50%; margin-left: -6px; cursor: ns-resize; }
  .pres-resize-handles .pres-elem-handle.se { bottom: -6px; right: -6px; cursor: nwse-resize; }

  /* Slide wrapper for overlays */
  .pres-slide-wrapper {
    position: relative;
    width: 100%;
    height: 100%;
    color: white;
  }

  .pres-slide-wrapper > div {
    width: 100%;
    height: 100%;
    padding: 60px;
    display: flex;
    flex-direction: column;
    color: white;
  }

  .pres-overlays {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
  }

  .pres-overlay-elem {
    position: absolute;
    pointer-events: auto;
  }

  /* Properties Panel */
  .pres-props-panel {
    background: white;
    border-top: 1px solid var(--slate-200);
    display: flex;
    flex-direction: column;
    box-shadow: 0 -4px 20px rgba(0,0,0,0.15);
    transition: max-height 0.3s ease;
    pointer-events: auto;
  }

  .pres-props-panel.expanded {
    max-height: 400px;
  }

  .pres-props-panel.collapsed {
    max-height: 44px;
    overflow: hidden;
  }

  .pres-props-panel * {
    pointer-events: auto;
  }

  .pres-props-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--slate-50);
    border-bottom: 1px solid var(--slate-200);
    flex-shrink: 0;
  }

  .pres-props-toggle {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid var(--slate-300);
    border-radius: 4px;
    cursor: pointer;
    font-size: 10px;
    color: var(--slate-500);
    margin-right: 8px;
    transition: all 0.2s;
  }

  .pres-props-toggle:hover {
    background: var(--slate-100);
    color: var(--slate-700);
  }

  .pres-props-header h4 {
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0;
    flex: 1;
  }

  .pres-props-body {
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
    overflow-y: auto;
    max-height: 280px;
  }

  .pres-props-delete {
    padding: 6px 12px;
    background: var(--rose-50);
    border: 1px solid var(--rose-200);
    border-radius: 6px;
    font-size: 12px;
    color: var(--rose-600);
    cursor: pointer;
    transition: all 0.2s;
  }

  .pres-props-delete:hover {
    background: var(--rose-100);
    border-color: var(--rose-300);
  }

  .pres-props-row {
    display: flex;
    gap: 12px;
  }

  .pres-props-row .pres-props-field {
    flex: 1;
  }

  .pres-props-field {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .pres-props-field label {
    font-size: 11px;
    font-weight: 500;
    color: var(--slate-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .pres-props-field input,
  .pres-props-field select,
  .pres-props-field textarea {
    padding: 6px 10px;
    border: 1px solid var(--slate-200);
    border-radius: 4px;
    font-size: 13px;
    font-family: inherit;
  }

  .pres-props-field input[type="color"] {
    padding: 2px;
    width: 100%;
    height: 32px;
    cursor: pointer;
  }

  .pres-props-field input:focus,
  .pres-props-field select:focus,
  .pres-props-field textarea:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 2px color-mix(in srgb, var(--brand-primary) 15%, transparent);
  }

  .pres-props-field textarea {
    resize: vertical;
    min-height: 60px;
  }

  .pres-props-field input[type="number"] {
    width: 100%;
  }

  /* Preview panel with properties */
  .pres-preview {
    flex: 1;
    display: flex;
    flex-direction: column;
    background: var(--slate-100);
    position: relative;
  }

  .pres-props-container {
    position: absolute;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    pointer-events: auto;
  }

  /* ============================================================
     LOGIN PAGE STYLES
     ============================================================ */
  .login-page {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
    background: linear-gradient(135deg, #0f3d3e 0%, #115e59 50%, #14b8a6 100%);
    padding: 20px;
  }

  .login-container {
    width: 100%;
    max-width: 420px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
    overflow: hidden;
  }

  .login-header {
    text-align: center;
    padding: 40px 40px 30px;
    background: linear-gradient(135deg, #0f3d3e, #115e59);
    color: white;
  }

  .login-logo {
    width: 80px;
    height: 80px;
    background: rgba(255,255,255,0.15);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 16px;
  }

  .login-header h1 {
    font-size: 24px;
    font-weight: 700;
    margin: 0 0 8px;
  }

  .login-header p {
    font-size: 14px;
    opacity: 0.8;
    margin: 0;
  }

  .login-form {
    padding: 30px 40px;
  }

  .login-error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 20px;
    display: flex;
    align-items: center;
    gap: 10px;
  }

  .login-field {
    margin-bottom: 20px;
  }

  .login-field label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
    margin-bottom: 6px;
  }

  .login-input-wrapper {
    position: relative;
    display: flex;
    align-items: center;
  }

  .login-input-wrapper svg:first-child {
    position: absolute;
    left: 14px;
    color: var(--slate-400);
    pointer-events: none;
    z-index: 1;
  }

  .login-input-wrapper input {
    width: 100%;
    padding: 14px 14px 14px 44px;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    font-size: 15px;
    transition: all 0.2s;
  }

  /* Password field needs extra right padding for the toggle button */
  .login-input-wrapper.has-toggle input {
    padding-right: 48px;
  }

  .login-input-wrapper input:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px color-mix(in srgb, var(--brand-primary) 15%, transparent);
  }

  .login-password-toggle {
    position: absolute;
    right: 8px;
    top: 50%;
    transform: translateY(-50%);
    background: transparent;
    border: none;
    color: var(--slate-400);
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
    width: 32px;
    height: 32px;
  }

  .login-password-toggle svg {
    flex-shrink: 0;
  }

  .login-password-toggle:hover {
    color: var(--teal-600);
    background: var(--slate-100);
  }

  .login-password-toggle:active {
    background: var(--slate-200);
  }

  .login-submit {
    width: 100%;
    padding: 14px;
    background: linear-gradient(135deg, var(--teal-600), var(--teal-500));
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .login-submit:hover:not(:disabled) {
    background: linear-gradient(135deg, var(--teal-700), var(--teal-600));
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);
  }

  .login-submit:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  .login-footer {
    padding: 20px 40px;
    background: var(--slate-50);
    border-top: 1px solid var(--slate-200);
    text-align: center;
  }

  .login-hipaa-notice {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    background: #ecfdf5;
    color: #059669;
    padding: 6px 14px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: 600;
    margin-bottom: 12px;
  }

  .login-disclaimer {
    font-size: 11px;
    color: var(--slate-500);
    margin: 0;
    line-height: 1.5;
  }

  .login-demo-credentials {
    padding: 20px 40px 30px;
    background: #f3f4f6;
    border-top: 1px solid #e5e7eb;
  }

  .login-demo-credentials p {
    font-size: 12px;
    font-weight: 600;
    color: #4b5563;
    margin: 0 0 12px;
    text-align: center;
  }

  .demo-buttons {
    display: flex;
    gap: 10px;
    justify-content: center;
  }

  .demo-login-btn {
    flex: 1;
    max-width: 120px;
    padding: 12px 8px;
    border: 2px solid;
    border-radius: 10px;
    background: white;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }

  .demo-login-btn:hover:not(:disabled) {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .demo-login-btn:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .demo-login-btn.admin {
    border-color: #7c3aed;
    color: #7c3aed;
  }

  .demo-login-btn.admin:hover:not(:disabled) {
    background: #7c3aed;
    color: white;
  }

  .demo-login-btn.client {
    border-color: #0891b2;
    color: #0891b2;
  }

  .demo-login-btn.client:hover:not(:disabled) {
    background: #0891b2;
    color: white;
  }

  .demo-login-btn.csm {
    border-color: #16a34a;
    color: #16a34a;
  }

  .demo-login-btn.csm:hover:not(:disabled) {
    background: #16a34a;
    color: white;
  }

  .demo-btn-role {
    font-size: 14px;
    font-weight: 700;
  }

  .demo-btn-desc {
    font-size: 10px;
    opacity: 0.8;
  }

  /* ============================================================
     SESSION TIMEOUT WARNING
     ============================================================ */
  .session-timeout-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0,0,0,0.7);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  }

  .session-timeout-modal {
    background: white;
    border-radius: 16px;
    padding: 40px;
    text-align: center;
    max-width: 400px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.25);
  }

  .timeout-icon {
    color: var(--brand-accent);
    margin-bottom: 16px;
  }

  .session-timeout-modal h2 {
    font-size: 24px;
    color: var(--slate-900);
    margin: 0 0 12px;
  }

  .session-timeout-modal p {
    font-size: 15px;
    color: var(--slate-600);
    margin: 0 0 8px;
  }

  .timeout-reason {
    font-size: 13px !important;
    color: var(--slate-500) !important;
    margin-bottom: 24px !important;
  }

  .timeout-actions {
    display: flex;
    gap: 12px;
  }

  .timeout-continue {
    flex: 1;
    padding: 12px 20px;
    background: var(--brand-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .timeout-continue:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .timeout-logout {
    flex: 1;
    padding: 12px 20px;
    background: white;
    color: var(--slate-700);
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
  }

  /* ============================================================
     SIDEBAR USER INFO
     ============================================================ */
  .sidebar-user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px 20px;
    margin: 0 12px 16px;
    background: rgba(255,255,255,0.1);
    border-radius: 10px;
  }

  .sidebar-user-info.clickable {
    cursor: pointer;
    transition: all 0.2s ease;
  }

  .sidebar-user-info.clickable:hover {
    background: rgba(255,255,255,0.15);
    transform: translateX(2px);
  }

  .sidebar-user-info.clickable.active {
    background: rgba(20, 184, 166, 0.3);
    border: 1px solid rgba(20, 184, 166, 0.5);
  }

  .sidebar-user-chevron {
    margin-left: auto;
    opacity: 0.5;
    transition: opacity 0.2s;
  }

  .sidebar-user-info.clickable:hover .sidebar-user-chevron {
    opacity: 1;
  }

  .sidebar-user-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--teal-400), var(--teal-600));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 14px;
    color: white;
    flex-shrink: 0;
  }

  .sidebar-user-details {
    display: flex;
    flex-direction: column;
    overflow: hidden;
    flex: 1;
  }

  .sidebar-user-name {
    font-size: 14px;
    font-weight: 600;
    color: white;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .sidebar-user-role {
    font-size: 11px;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  /* ============================================================
     PROFILE PAGE STYLES
     ============================================================ */
  .profile-page {
    padding: 0;
  }

  .profile-content {
    display: grid;
    gap: 24px;
    max-width: 900px;
  }

  .profile-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .profile-header {
    display: flex;
    align-items: center;
    gap: 20px;
    padding: 24px;
    background: linear-gradient(135deg, var(--brand-secondary), var(--brand-primary));
    color: white;
  }

  .profile-avatar {
    width: 80px;
    height: 80px;
    background: rgba(255,255,255,0.2);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 28px;
    font-weight: 700;
    flex-shrink: 0;
    border: 3px solid rgba(255,255,255,0.3);
  }

  .profile-header-info {
    flex: 1;
  }

  .profile-header-info h2 {
    margin: 0 0 8px;
    font-size: 24px;
  }

  .profile-header-info .role-badge {
    font-size: 12px;
  }

  .profile-edit-btn {
    padding: 10px 20px;
    background: rgba(255,255,255,0.2);
    border: 1px solid rgba(255,255,255,0.3);
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .profile-edit-btn:hover {
    background: rgba(255,255,255,0.3);
  }

  .profile-body {
    padding: 24px;
  }

  .profile-details {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .profile-detail-row {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 0;
    border-bottom: 1px solid var(--slate-100);
  }

  .profile-detail-row:last-child {
    border-bottom: none;
  }

  .profile-label {
    font-size: 14px;
    color: var(--slate-500);
    font-weight: 500;
  }

  .profile-value {
    font-size: 14px;
    color: var(--slate-800);
    font-weight: 500;
  }

  .profile-form {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .profile-section h3 {
    font-size: 16px;
    font-weight: 600;
    margin: 0 0 16px;
    color: var(--slate-800);
  }

  .profile-section-hint {
    font-size: 13px;
    color: var(--slate-500);
    margin: -8px 0 16px;
  }

  .profile-form-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
  }

  .profile-error {
    display: flex;
    align-items: center;
    gap: 8px;
    background: #fef2f2;
    border: 1px solid #fecaca;
    color: #dc2626;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 14px;
    margin-bottom: 16px;
  }

  .profile-actions {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding-top: 16px;
    border-top: 1px solid var(--slate-200);
  }

  .profile-cancel-btn {
    padding: 10px 20px;
    background: white;
    border: 1px solid var(--slate-300);
    color: var(--slate-700);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .profile-cancel-btn:hover {
    background: var(--slate-50);
  }

  .profile-save-btn {
    padding: 10px 20px;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    border: none;
    color: white;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .profile-save-btn:hover {
    filter: brightness(1.1);
  }

  .profile-security-card {
    background: white;
    border-radius: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 24px;
  }

  .profile-security-card h3 {
    font-size: 18px;
    font-weight: 600;
    margin: 0 0 20px;
    color: var(--slate-800);
  }

  .security-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 16px 0;
    border-bottom: 1px solid var(--slate-100);
  }

  .security-item:last-child {
    border-bottom: none;
  }

  .security-info h4 {
    font-size: 14px;
    font-weight: 600;
    margin: 0 0 4px;
    color: var(--slate-800);
  }

  .security-info p {
    font-size: 13px;
    color: var(--slate-500);
    margin: 0;
  }

  .security-btn {
    padding: 8px 16px;
    background: var(--slate-100);
    border: none;
    color: var(--slate-700);
    border-radius: 6px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
  }

  .security-btn:hover {
    background: var(--slate-200);
  }

  .sidebar-logout {
    margin-top: auto;
    padding-top: 16px;
    border-top: 1px solid rgba(255,255,255,0.1);
  }

  .logout-btn {
    color: #fca5a5 !important;
  }

  .logout-btn:hover {
    background: rgba(239, 68, 68, 0.2) !important;
  }

  /* ============================================================
     ACCESS DENIED
     ============================================================ */
  .access-denied {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 80px 40px;
    text-align: center;
    color: var(--slate-400);
  }

  .access-denied svg {
    margin-bottom: 20px;
    color: var(--slate-300);
  }

  .access-denied h2 {
    font-size: 24px;
    color: var(--slate-700);
    margin: 0 0 8px;
  }

  .access-denied p {
    font-size: 15px;
    margin: 0;
  }

  .access-denied-inline {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 8px 16px;
    background: var(--slate-100);
    border-radius: 6px;
    color: var(--slate-500);
    font-size: 13px;
  }

  /* ============================================================
     AUDIT LOG PAGE
     ============================================================ */
  .audit-log-page {
    padding: 30px;
  }

  .audit-filters {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    margin-bottom: 24px;
    padding: 20px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
  }

  .audit-filter {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .audit-filter label {
    font-size: 12px;
    font-weight: 600;
    color: var(--slate-600);
  }

  .audit-filter input,
  .audit-filter select {
    padding: 8px 12px;
    border: 1px solid var(--slate-200);
    border-radius: 6px;
    font-size: 13px;
    min-width: 160px;
  }

  .audit-clear-filters {
    align-self: flex-end;
    padding: 8px 16px;
    background: var(--slate-100);
    border: 1px solid var(--slate-200);
    border-radius: 6px;
    color: var(--slate-600);
    font-size: 13px;
    cursor: pointer;
  }

  .audit-table-container {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: hidden;
  }

  .audit-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .audit-table th {
    text-align: left;
    padding: 14px 16px;
    background: var(--slate-50);
    font-weight: 600;
    color: var(--slate-600);
    border-bottom: 1px solid var(--slate-200);
  }

  .audit-table td {
    padding: 12px 16px;
    border-bottom: 1px solid var(--slate-100);
  }

  .audit-table tr:hover {
    background: var(--slate-50);
  }

  .audit-timestamp {
    font-family: monospace;
    font-size: 12px;
    color: var(--slate-500);
    white-space: nowrap;
  }

  .audit-action-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    color: white;
    text-transform: uppercase;
    letter-spacing: 0.3px;
  }

  .audit-role {
    text-transform: capitalize;
    color: var(--slate-500);
  }

  .audit-details {
    font-family: monospace;
    font-size: 11px;
    color: var(--slate-500);
    max-width: 300px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .audit-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    padding: 20px;
    background: white;
    border-top: 1px solid var(--slate-200);
  }

  .audit-pagination button {
    padding: 8px 16px;
    background: var(--teal-600);
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
  }

  .audit-pagination button:disabled {
    background: var(--slate-200);
    color: var(--slate-400);
    cursor: not-allowed;
  }

  /* ============================================================
     PORTFOLIO ANALYTICS PAGE
     ============================================================ */
  .portfolio-page {
    padding: 30px;
  }

  .portfolio-page .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .portfolio-page .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 700;
    color: var(--slate-800);
  }

  .timeframe-select {
    padding: 8px 16px;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    font-size: 14px;
    background: white;
    cursor: pointer;
  }

  .portfolio-overview {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 16px;
    margin-bottom: 24px;
  }

  .portfolio-metric-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .portfolio-metric-card:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);
  }

  .portfolio-metric-card.highlight {
    background: linear-gradient(135deg, var(--teal-500), var(--teal-600));
    color: white;
  }

  .portfolio-metric-card.highlight .portfolio-metric-label {
    color: rgba(255,255,255,0.85);
  }

  .portfolio-metric-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: var(--teal-50);
    color: var(--teal-600);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .portfolio-metric-card.highlight .portfolio-metric-icon {
    background: rgba(255,255,255,0.2);
    color: white;
  }

  .portfolio-metric-icon.green { background: #dcfce7; color: #16a34a; }
  .portfolio-metric-icon.blue { background: #dbeafe; color: #2563eb; }
  .portfolio-metric-icon.purple { background: #f3e8ff; color: #7c3aed; }
  .portfolio-metric-icon.orange { background: #ffedd5; color: #ea580c; }
  .portfolio-metric-icon.cyan { background: #cffafe; color: #0891b2; }

  .portfolio-metric-content {
    display: flex;
    flex-direction: column;
  }

  .portfolio-metric-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--slate-800);
  }

  .portfolio-metric-card.highlight .portfolio-metric-value {
    color: white;
  }

  .portfolio-metric-label {
    font-size: 12px;
    color: var(--slate-500);
    margin-top: 2px;
  }

  .portfolio-charts-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
    margin-bottom: 24px;
  }

  .portfolio-chart-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  .portfolio-chart-card h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-700);
    margin: 0 0 16px 0;
  }

  /* AI Insights Section */
  .ai-insights-section {
    margin-bottom: 32px;
  }

  .ai-insights-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 16px;
  }

  .ai-badge {
    display: flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #8b5cf6, #6366f1);
    color: white;
    padding: 8px 16px;
    border-radius: 20px;
    font-weight: 600;
    font-size: 14px;
  }

  .ai-icon {
    font-size: 16px;
  }

  .ai-updated {
    font-size: 12px;
    color: var(--slate-500);
  }

  .ai-insight-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  .ai-insight-card h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0 0 12px 0;
    display: flex;
    align-items: center;
  }

  .ai-insight-card.summary {
    border-left: 4px solid var(--teal-500);
  }

  .ai-insight-card.highlight-green {
    background: linear-gradient(135deg, #f0fdf4, #dcfce7);
    border-left: 4px solid #22c55e;
    display: flex;
    gap: 16px;
  }

  .ai-insight-card.highlight-green .ai-insight-icon {
    font-size: 32px;
    flex-shrink: 0;
  }

  .ai-insight-card.coaching {
    border-left: 4px solid #f59e0b;
  }

  .ai-insight-card.strategic {
    border-left: 4px solid #6366f1;
  }

  .ai-insight-list {
    margin: 0;
    padding-left: 20px;
    color: var(--slate-600);
    line-height: 1.7;
  }

  .ai-insight-list li {
    margin-bottom: 6px;
  }

  .ai-recommendation {
    margin-top: 12px;
    padding: 12px;
    background: rgba(34, 197, 94, 0.1);
    border-radius: 8px;
    font-size: 14px;
    color: var(--slate-700);
  }

  .coaching-cards {
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
  }

  .coaching-card {
    background: var(--slate-50);
    border-radius: 10px;
    padding: 16px;
    border: 1px solid var(--slate-200);
  }

  .coaching-card.priority-high {
    background: #fef2f2;
    border-color: #fecaca;
  }

  .coaching-card.priority-medium {
    background: #fffbeb;
    border-color: #fde68a;
  }

  .coaching-card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 8px;
  }

  .coaching-csm-name {
    font-weight: 600;
    color: var(--slate-800);
  }

  .priority-badge {
    font-size: 11px;
    padding: 4px 8px;
    border-radius: 12px;
  }

  .priority-badge.high {
    background: #fee2e2;
    color: #dc2626;
  }

  .priority-badge.medium {
    background: #fef3c7;
    color: #d97706;
  }

  .coaching-suggestion {
    font-size: 14px;
    color: var(--slate-600);
    margin: 0 0 10px 0;
    line-height: 1.5;
  }

  .coaching-areas {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 6px;
  }

  .coaching-areas-label {
    font-size: 12px;
    color: var(--slate-500);
  }

  .coaching-area-tag {
    font-size: 11px;
    background: white;
    border: 1px solid var(--slate-300);
    padding: 3px 8px;
    border-radius: 12px;
    color: var(--slate-600);
  }

  .strategic-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 16px;
    margin-top: 16px;
  }

  .strategic-item {
    display: flex;
    gap: 12px;
    padding: 16px;
    background: var(--slate-50);
    border-radius: 10px;
    border: 1px solid var(--slate-200);
    transition: background 0.2s;
  }

  .strategic-item:hover {
    background: var(--slate-100);
  }

  .strategic-icon {
    font-size: 24px;
    flex-shrink: 0;
  }

  .strategic-content h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0 0 4px 0;
  }

  .strategic-content p {
    font-size: 13px;
    color: var(--slate-600);
    margin: 0;
    line-height: 1.5;
  }

  /* CSM Performance Section */
  .csm-performance-section {
    margin-top: 32px;
  }

  .csm-performance-section h2 {
    font-size: 20px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0 0 20px 0;
  }

  .csm-cards-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 20px;
  }

  .csm-performance-card {
    background: white;
    border-radius: 12px;
    padding: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    cursor: pointer;
    transition: all 0.2s;
    border: 2px solid transparent;
  }

  .csm-performance-card:hover {
    border-color: var(--teal-200);
  }

  .csm-performance-card.expanded {
    border-color: var(--teal-400);
    box-shadow: 0 4px 12px rgba(20, 184, 166, 0.15);
  }

  .csm-card-header {
    display: flex;
    align-items: center;
    gap: 14px;
    margin-bottom: 16px;
  }

  .csm-avatar {
    width: 48px;
    height: 48px;
    border-radius: 50%;
    background: linear-gradient(135deg, var(--teal-400), var(--teal-600));
    color: white;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    font-size: 16px;
  }

  .csm-info {
    flex: 1;
  }

  .csm-info h4 {
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0 0 2px 0;
  }

  .csm-clients-count {
    font-size: 13px;
    color: var(--slate-500);
  }

  .csm-score {
    text-align: right;
  }

  .csm-score .score-value {
    font-size: 24px;
    font-weight: 700;
    color: var(--teal-600);
    display: block;
  }

  .csm-score .score-label {
    font-size: 11px;
    color: var(--slate-500);
    text-transform: uppercase;
  }

  .csm-metrics-row {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 12px;
    padding: 16px 0;
    border-top: 1px solid var(--slate-100);
    border-bottom: 1px solid var(--slate-100);
  }

  .csm-metric {
    text-align: center;
  }

  .csm-metric-value {
    font-size: 18px;
    font-weight: 600;
    color: var(--slate-800);
    display: block;
  }

  .csm-metric-label {
    font-size: 11px;
    color: var(--slate-500);
  }

  .csm-expanded-content {
    padding-top: 16px;
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .csm-trend-chart {
    margin-bottom: 16px;
  }

  .csm-trend-chart h5 {
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-600);
    margin: 0 0 8px 0;
  }

  .csm-details-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .csm-detail-section h5 {
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
    margin: 0 0 8px 0;
  }

  .strength-tags, .improve-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
  }

  .strength-tag {
    font-size: 11px;
    background: #dcfce7;
    color: #15803d;
    padding: 4px 10px;
    border-radius: 12px;
  }

  .improve-tag {
    font-size: 11px;
    background: #fef3c7;
    color: #b45309;
    padding: 4px 10px;
    border-radius: 12px;
  }

  .csm-card-footer {
    text-align: center;
    padding-top: 12px;
  }

  .expand-hint {
    font-size: 11px;
    color: var(--slate-400);
  }

  /* ============================================================
     CUSTOMIZATION PAGE
     ============================================================ */
  .customization-page {
    padding: 30px;
  }

  .customization-page .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  .customization-page .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 700;
    color: var(--slate-800);
    margin: 0;
  }

  .reset-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: white;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    color: var(--slate-600);
    font-size: 14px;
    cursor: pointer;
    transition: all 0.2s;
  }

  .reset-btn:hover {
    background: var(--slate-50);
    border-color: var(--slate-400);
  }

  .customization-layout {
    display: grid;
    grid-template-columns: 1fr 280px;
    gap: 24px;
  }

  .customization-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 20px;
    grid-column: 1 / -1;
  }

  .customization-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: white;
    border: 2px solid var(--slate-200);
    border-radius: 10px;
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-600);
    cursor: pointer;
    transition: all 0.2s;
  }

  .customization-tab:hover {
    border-color: var(--brand-accent);
    color: var(--brand-primary);
  }

  .customization-tab.active {
    background: color-mix(in srgb, var(--brand-primary) 10%, white);
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .customization-section {
    grid-column: 1;
  }

  .section-card {
    background: white;
    border-radius: 12px;
    padding: 24px;
    margin-bottom: 20px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
  }

  .section-card h3 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0 0 20px 0;
    padding-bottom: 12px;
    border-bottom: 1px solid var(--slate-100);
  }

  .section-desc {
    font-size: 13px;
    color: var(--slate-500);
    margin: -12px 0 16px 0;
  }

  .form-row {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
    margin-bottom: 16px;
  }

  .form-row label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
    margin-bottom: 6px;
  }

  .form-row input[type="text"],
  .form-row input[type="email"],
  .form-row input[type="tel"],
  .form-row input[type="password"],
  .form-row select {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    font-size: 14px;
    font-family: inherit;
    transition: all 0.2s;
  }

  .form-row input:focus,
  .form-row select:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.15);
  }

  .create-user-form {
    padding: 20px 0;
  }

  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 2000;
  }

  .modal-content {
    background: white;
    border-radius: 16px;
    padding: 24px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    overflow-y: auto;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  }

  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding-bottom: 16px;
    border-bottom: 1px solid var(--slate-200);
    margin-bottom: 16px;
  }

  .modal-header h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    margin: 0;
    font-size: 18px;
    color: var(--slate-800);
  }

  .modal-close {
    background: none;
    border: none;
    color: var(--slate-400);
    cursor: pointer;
    padding: 4px;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .modal-close:hover {
    background: var(--slate-100);
    color: var(--slate-600);
  }

  .form-hint {
    font-size: 12px;
    color: var(--slate-500);
    margin-top: 6px;
  }

  .logo-upload-area {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--slate-50);
    border: 2px dashed var(--slate-300);
    border-radius: 10px;
  }

  .logo-preview {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 140px;
    height: 60px;
    background: white;
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid var(--slate-200);
  }

  .logo-preview img {
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
  }

  .remove-logo-btn {
    position: absolute;
    top: -8px;
    right: -8px;
    width: 24px;
    height: 24px;
    border-radius: 50%;
    background: #ef4444;
    color: white;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .logo-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
    padding: 12px 24px;
    background: white;
    border-radius: 8px;
    color: var(--slate-500);
    border: 1px solid var(--slate-200);
  }

  .logo-placeholder span {
    font-size: 11px;
  }

  .logo-mode-options {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .logo-mode-option {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    background: white;
    border: 2px solid var(--slate-200);
    border-radius: 10px;
    cursor: pointer;
    transition: all 0.2s;
    min-width: 110px;
  }

  .logo-mode-option:hover {
    border-color: var(--brand-primary);
  }

  .logo-mode-option.selected {
    border-color: var(--brand-primary);
    background: color-mix(in srgb, var(--brand-primary) 5%, white);
  }

  .logo-mode-option input[type="radio"] {
    display: none;
  }

  .logo-mode-option input[type="radio"]:disabled + .logo-mode-preview {
    opacity: 0.4;
  }

  .logo-mode-preview {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: var(--slate-100);
    border-radius: 6px;
    min-height: 36px;
  }

  .logo-mode-preview span {
    font-size: 12px;
    font-weight: 600;
    color: var(--slate-600);
  }

  .logo-mode-label {
    font-size: 11px;
    color: var(--slate-600);
    text-align: center;
  }

  .upload-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    background: var(--brand-primary);
    color: white;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .upload-btn:hover {
    background: var(--brand-secondary);
  }

  .color-presets {
    margin-bottom: 20px;
  }

  .color-presets label {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
    margin-bottom: 10px;
  }

  .preset-buttons {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
  }

  .color-preset-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: 3px solid white;
    box-shadow: 0 2px 4px rgba(0,0,0,0.15);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .color-preset-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 8px rgba(0,0,0,0.2);
  }

  .color-inputs {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 16px;
    margin-bottom: 20px;
  }

  .color-input-group label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--slate-600);
    margin-bottom: 8px;
  }

  .color-input-row {
    display: flex;
    gap: 8px;
  }

  .color-input-row input[type="color"] {
    width: 44px;
    height: 38px;
    border: 1px solid var(--slate-300);
    border-radius: 6px;
    cursor: pointer;
    padding: 2px;
  }

  .color-input-row input[type="text"] {
    flex: 1;
    padding: 8px 10px;
    border: 1px solid var(--slate-300);
    border-radius: 6px;
    font-size: 13px;
    font-family: monospace;
  }

  .color-preview {
    margin-top: 16px;
  }

  .color-preview label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--slate-600);
    margin-bottom: 10px;
  }

  .preview-box {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 10px 20px;
    border-radius: 6px;
    margin-right: 10px;
    margin-bottom: 10px;
    font-size: 13px;
    font-weight: 500;
  }

  /* Tabs List */
  .tabs-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .tab-item, .widget-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: var(--slate-50);
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    transition: all 0.2s;
  }

  .tab-item:hover, .widget-item:hover {
    background: white;
    border-color: var(--slate-300);
  }

  .tab-item.dragging, .widget-item.dragging {
    opacity: 0.5;
    background: var(--teal-50);
    border-color: var(--teal-300);
  }

  .tab-drag-handle, .widget-drag-handle {
    cursor: grab;
    color: var(--slate-400);
  }

  .tab-drag-handle:active, .widget-drag-handle:active {
    cursor: grabbing;
  }

  .tab-icon {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 6px;
    color: var(--slate-600);
    border: 1px solid var(--slate-200);
  }

  .tab-icon-picker {
    position: relative;
    display: flex;
    align-items: center;
  }

  .tab-icon-current {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border-radius: 8px;
    color: var(--brand-primary);
    border: 2px solid var(--brand-primary);
    cursor: pointer;
  }

  .tab-icon-select {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    opacity: 0;
    cursor: pointer;
  }

  .tab-icon-picker:hover .tab-icon-current {
    background: color-mix(in srgb, var(--brand-primary) 10%, white);
  }

  .tab-label-input, .widget-label-input {
    flex: 1;
    padding: 8px 12px;
    border: 1px solid var(--slate-200);
    border-radius: 6px;
    font-size: 14px;
    background: white;
  }

  .tab-label-input:focus, .widget-label-input:focus {
    outline: none;
    border-color: var(--teal-500);
  }

  .tab-actions, .widget-actions {
    display: flex;
    align-items: center;
    gap: 4px;
  }

  .move-btn {
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    background: transparent;
    color: var(--slate-400);
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.2s;
  }

  .move-btn:hover:not(:disabled) {
    background: var(--slate-200);
    color: var(--slate-600);
  }

  .move-btn:disabled {
    opacity: 0.3;
    cursor: not-allowed;
  }

  .toggle-btn {
    background: none;
    border: none;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    transition: color 0.2s;
  }

  .toggle-btn.enabled {
    color: var(--teal-500);
  }

  .toggle-btn.disabled {
    color: var(--slate-300);
  }

  /* Widget Page Selector */
  .widget-page-selector {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-bottom: 16px;
  }

  .widget-page-btn {
    padding: 8px 14px;
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 6px;
    font-size: 13px;
    color: var(--slate-600);
    cursor: pointer;
    transition: all 0.2s;
  }

  .widget-page-btn:hover {
    border-color: var(--teal-300);
    color: var(--teal-600);
  }

  .widget-page-btn.active {
    background: var(--teal-500);
    border-color: var(--teal-500);
    color: white;
  }

  .widgets-list {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .no-widgets {
    padding: 40px;
    text-align: center;
    color: var(--slate-500);
    background: var(--slate-50);
    border-radius: 10px;
  }

  .widget-library-card {
    background: white;
    border: 2px solid #e2e8f0;
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.25s ease;
    cursor: pointer;
  }

  .widget-library-card:hover {
    border-color: #0d9488;
    box-shadow: 0 8px 24px rgba(13, 148, 136, 0.15);
    transform: translateY(-4px);
  }

  .widget-library-card:hover .widget-library-preview {
    background: linear-gradient(135deg, rgba(13, 148, 136, 0.15) 0%, rgba(13, 148, 136, 0.05) 100%) !important;
  }

  .widget-library-card:hover .widget-library-name {
    color: #0d9488;
  }

  .widget-library-preview {
    height: 80px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-bottom: 1px solid #f1f5f9;
    transition: background 0.25s ease;
  }

  .widget-library-info {
    padding: 12px;
  }

  .widget-library-name {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: #1e293b;
    margin-bottom: 4px;
    transition: color 0.25s ease;
  }

  .widget-library-desc {
    display: block;
    font-size: 12px;
    color: #64748b;
    line-height: 1.4;
  }

  /* Live Preview */
  .customization-preview {
    position: sticky;
    top: 24px;
    grid-column: 2;
    grid-row: 2 / 4;
  }

  .customization-preview h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
    margin: 0 0 12px 0;
  }

  /* Modal Styles */
  .modal-content.small {
    max-width: 400px;
  }

  .modal-content h3 {
    margin: 0 0 12px 0;
    font-size: 18px;
    color: var(--slate-800);
  }

  .modal-content p {
    margin: 0 0 20px 0;
    font-size: 14px;
    color: var(--slate-600);
    line-height: 1.5;
  }

  .modal-actions {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }

  .btn-secondary {
    padding: 10px 20px;
    background: white;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--slate-700);
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-secondary:hover {
    background: var(--slate-50);
  }

  .btn-danger {
    padding: 10px 20px;
    background: #ef4444;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-danger:hover {
    background: #dc2626;
  }

  .btn-primary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .btn-primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  /* Logo image in sidebar */
  .logo-image {
    max-height: 36px;
    max-width: 160px;
    object-fit: contain;
  }

  /* Background Color Presets */
  .bg-color-section {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .bg-color-group {
    margin-bottom: 8px;
  }

  .bg-color-group label {
    display: block;
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
    margin-bottom: 4px;
  }

  .bg-presets {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
    margin-top: 10px;
  }

  .bg-preset-btn {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    border: 3px solid white;
    box-shadow: 0 2px 6px rgba(0,0,0,0.2);
    cursor: pointer;
    transition: transform 0.2s, box-shadow 0.2s;
  }

  .bg-preset-btn:hover {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(0,0,0,0.25);
  }

  .bg-preset-btn.wide {
    width: 60px;
    height: 36px;
  }

  /* ============================================================
     NOTIFICATIONS & ALERTS PAGE
     ============================================================ */
  .notifications-page {
    padding: 30px;
  }

  .notifications-page .page-header {
    margin-bottom: 24px;
  }

  .notifications-page .page-title {
    display: flex;
    align-items: center;
    gap: 12px;
    font-size: 24px;
    font-weight: 700;
    color: var(--slate-800);
    margin: 0;
  }

  .notifications-layout {
    display: grid;
    grid-template-columns: 1fr 320px;
    gap: 24px;
  }

  .notifications-section {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    margin-bottom: 20px;
  }

  .section-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 8px;
  }

  .section-header h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0;
    flex: 1;
  }

  .section-header svg {
    color: var(--brand-primary);
  }

  .add-reminder-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    background: var(--brand-primary);
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .add-reminder-btn:hover {
    background: var(--brand-secondary);
  }

  .notification-item.custom-item {
    border-color: var(--brand-accent);
    background: color-mix(in srgb, var(--brand-primary) 3%, white);
  }

  .notification-item-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .delete-reminder-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: white;
    border: 1px solid #fecaca;
    border-radius: 6px;
    color: #dc2626;
    cursor: pointer;
    transition: all 0.2s;
  }

  .delete-reminder-btn:hover {
    background: #fef2f2;
    border-color: #dc2626;
  }

  .edit-reminder-btn {
    background: none;
    border: none;
    color: var(--slate-400);
    cursor: pointer;
    padding: 2px;
    margin-left: 6px;
    opacity: 0.6;
    transition: all 0.2s;
  }

  .edit-reminder-btn:hover {
    color: var(--brand-primary);
    opacity: 1;
  }

  .notification-edit-form {
    display: flex;
    flex-direction: column;
    gap: 8px;
    width: 100%;
  }

  .notification-edit-input {
    padding: 8px 12px;
    border: 1px solid var(--slate-300);
    border-radius: 6px;
    font-size: 14px;
    width: 100%;
  }

  .notification-edit-input.small {
    font-size: 12px;
    padding: 6px 10px;
  }

  .notification-edit-input:focus {
    outline: none;
    border-color: var(--brand-primary);
  }

  .notification-edit-actions {
    display: flex;
    gap: 8px;
    margin-top: 4px;
  }

  .save-edit-btn, .cancel-edit-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 6px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .save-edit-btn {
    background: var(--brand-primary);
    color: white;
  }

  .cancel-edit-btn {
    background: var(--slate-200);
    color: var(--slate-600);
  }

  .add-notification-modal {
    width: 100%;
    max-width: 480px;
    background: white;
    border-radius: 16px;
    box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    overflow: hidden;
  }

  .add-notification-modal .modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid var(--slate-200);
    background: var(--slate-50);
  }

  .add-notification-modal .modal-header h2 {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 18px;
    font-weight: 600;
    margin: 0;
    color: var(--slate-800);
  }

  .add-notification-modal .modal-header svg {
    color: var(--brand-primary);
  }

  .add-notification-modal .modal-close {
    background: none;
    border: none;
    color: var(--slate-400);
    cursor: pointer;
    padding: 4px;
  }

  .add-notification-modal .modal-close:hover {
    color: var(--slate-600);
  }

  .add-notification-modal .modal-body {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 16px;
    background: white;
  }

  .add-notification-modal .form-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .add-notification-modal .form-group label {
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-700);
  }

  .add-notification-modal .form-group input,
  .add-notification-modal .form-group select {
    padding: 10px 14px;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    font-size: 14px;
    background: white;
    color: var(--slate-800);
  }

  .add-notification-modal .form-group input:focus,
  .add-notification-modal .form-group select:focus {
    outline: none;
    border-color: var(--brand-primary);
  }

  .add-notification-modal .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 24px;
    border-top: 1px solid var(--slate-200);
    background: var(--slate-50);
  }

  .add-notification-modal .btn-secondary {
    padding: 10px 20px;
    background: white;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-600);
    cursor: pointer;
  }

  .add-notification-modal .btn-primary {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    background: var(--brand-primary);
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    cursor: pointer;
  }

  .add-notification-modal .btn-primary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .add-notification-modal .btn-primary:hover:not(:disabled) {
    background: var(--brand-secondary);
  }

  .notifications-section .section-desc {
    font-size: 13px;
    color: var(--slate-500);
    margin: 0 0 20px 0;
  }

  .notifications-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .notification-item {
    background: var(--slate-50);
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    padding: 16px;
    transition: all 0.2s;
  }

  .notification-item:hover {
    border-color: var(--slate-300);
  }

  .notification-item-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 16px;
  }

  .notification-item-info h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0 0 4px 0;
  }

  .notification-item-info p {
    font-size: 12px;
    color: var(--slate-500);
    margin: 0;
    line-height: 1.4;
  }

  .master-toggle {
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    color: var(--slate-300);
    transition: color 0.2s;
    flex-shrink: 0;
  }

  .master-toggle.enabled {
    color: var(--brand-primary);
  }

  .notification-item-options {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--slate-200);
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }

  .notification-channels {
    display: flex;
    gap: 12px;
  }

  .channel-toggle {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--slate-600);
    cursor: pointer;
  }

  .channel-toggle input {
    width: 18px;
    height: 18px;
    accent-color: var(--brand-primary);
    cursor: pointer;
  }

  .channel-toggle input:checked {
    accent-color: var(--brand-primary);
  }

  .channel-toggle svg {
    width: 16px;
    height: 16px;
    color: var(--slate-500);
  }

  .notification-timing,
  .notification-threshold {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .notification-timing label,
  .notification-threshold label {
    font-size: 12px;
    color: var(--slate-500);
    white-space: nowrap;
  }

  .notification-timing select,
  .notification-threshold input {
    padding: 6px 10px;
    border: 1px solid var(--slate-300);
    border-radius: 6px;
    font-size: 12px;
    background: white;
  }

  .notification-threshold input {
    width: 60px;
  }

  /* Metric Selector Styles */
  .metric-selector-section {
    margin-top: 12px;
    padding-top: 12px;
    border-top: 1px solid var(--slate-200);
  }

  .metric-selector-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    cursor: pointer;
    padding: 8px 12px;
    background: var(--slate-50);
    border-radius: 8px;
    transition: background 0.15s;
  }

  .metric-selector-header:hover {
    background: var(--slate-100);
  }

  .metric-selector-header label {
    font-size: 12px;
    font-weight: 600;
    color: var(--slate-700);
    cursor: pointer;
  }

  .selected-metrics-preview {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 12px;
    color: var(--slate-500);
  }

  .metrics-count {
    background: var(--brand-primary);
    color: white;
    padding: 2px 8px;
    border-radius: 10px;
    font-size: 11px;
    font-weight: 600;
  }

  .no-metrics {
    color: var(--slate-400);
    font-style: italic;
  }

  .metric-selector-dropdown {
    margin-top: 8px;
    padding: 12px;
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 10px;
    max-height: 250px;
    overflow-y: auto;
  }

  .metric-selector-hint {
    font-size: 11px;
    color: var(--slate-500);
    margin: 0 0 12px 0;
    padding: 8px 10px;
    background: var(--slate-50);
    border-radius: 6px;
    font-style: italic;
  }

  .comparison-type-section {
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 12px 0;
    border-bottom: 1px solid var(--slate-100);
  }

  .comparison-type-section label {
    font-size: 12px;
    font-weight: 600;
    color: var(--slate-600);
  }

  .comparison-type-select {
    padding: 8px 12px;
    border: 1px solid var(--slate-200);
    border-radius: 8px;
    font-size: 13px;
    color: var(--slate-700);
    background: white;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .comparison-type-select:hover {
    border-color: var(--slate-300);
  }

  .comparison-type-select:focus {
    outline: none;
    border-color: var(--brand-primary);
    box-shadow: 0 0 0 3px rgba(20, 184, 166, 0.1);
  }

  .comparison-type-select option:disabled {
    color: var(--slate-400);
    font-style: italic;
  }

  .comparison-type-description {
    font-size: 11px;
    color: var(--slate-500);
    font-style: italic;
  }

  .target-value-input {
    display: flex;
    flex-direction: column;
    gap: 4px;
    margin-top: 8px;
    padding: 10px;
    background: var(--slate-50);
    border-radius: 8px;
  }

  .target-value-input label {
    font-size: 11px;
    font-weight: 600;
    color: var(--slate-500);
  }

  .target-value-input input {
    padding: 8px 12px;
    border: 1px solid var(--slate-200);
    border-radius: 6px;
    font-size: 13px;
    width: 150px;
  }

  .metric-category-group {
    margin-bottom: 12px;
  }

  .metric-category-group:last-child {
    margin-bottom: 0;
  }

  .metric-category-label {
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    color: var(--slate-500);
    margin-bottom: 8px;
    padding-bottom: 4px;
    border-bottom: 1px solid var(--slate-100);
  }

  .metric-checkbox {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 8px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.15s;
  }

  .metric-checkbox:hover {
    background: var(--slate-50);
  }

  .metric-checkbox input {
    width: 16px;
    height: 16px;
    accent-color: var(--brand-primary);
    cursor: pointer;
  }

  .metric-name {
    font-size: 13px;
    font-weight: 500;
    color: var(--slate-700);
    flex: 1;
  }

  .metric-format {
    font-size: 11px;
    color: var(--slate-400);
  }

  .selected-metrics-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
    margin-top: 8px;
  }

  .metric-tag {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    background: var(--brand-primary);
    color: white;
    font-size: 11px;
    font-weight: 500;
    border-radius: 12px;
  }

  .metric-tag button {
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    color: rgba(255, 255, 255, 0.7);
    cursor: pointer;
    padding: 0;
    margin-left: 2px;
  }

  .metric-tag button:hover {
    color: white;
  }

  /* Alerts Preview Section */
  .alerts-preview-section {
    grid-column: 2;
    grid-row: 1 / 4;
    position: sticky;
    top: 24px;
    height: fit-content;
  }

  .alerts-preview-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    margin-bottom: 12px;
  }

  .alerts-preview-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
    margin: 0 0 4px 0;
  }

  .test-alert-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 12px;
    background: linear-gradient(135deg, var(--brand-secondary), var(--brand-primary));
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
  }

  .test-alert-btn:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
  }

  .alerts-preview-section h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
    margin: 0 0 12px 0;
  }

  .alerts-preview-list {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .alert-preview-item {
    display: flex;
    gap: 12px;
    padding: 14px;
    background: white;
    border-radius: 10px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
    border-left: 4px solid;
  }

  .alert-preview-item.opportunity {
    border-left-color: #22c55e;
  }

  .alert-preview-item.opportunity svg {
    color: #22c55e;
  }

  .alert-preview-item.warning {
    border-left-color: #f59e0b;
  }

  .alert-preview-item.warning svg {
    color: #f59e0b;
  }

  .alert-preview-item.info {
    border-left-color: #3b82f6;
  }

  .alert-preview-item.info svg {
    color: #3b82f6;
  }

  .alert-preview-item.inactive {
    border-left-color: #6b7280;
  }

  .alert-preview-item.inactive svg {
    color: #6b7280;
  }

  .alert-preview-item svg {
    flex-shrink: 0;
    margin-top: 2px;
  }

  .alert-preview-content {
    flex: 1;
    min-width: 0;
  }

  .alert-preview-content strong {
    display: block;
    font-size: 13px;
    font-weight: 600;
    color: var(--slate-800);
    margin-bottom: 4px;
  }

  .alert-preview-content p {
    font-size: 12px;
    color: var(--slate-600);
    margin: 0 0 6px 0;
    line-height: 1.4;
  }

  .alert-time {
    font-size: 11px;
    color: var(--slate-400);
  }

  /* Text Color Presets */
  .text-color-presets {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: 10px;
    align-items: center;
  }

  .text-preset-btn {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    border: 2px solid transparent;
    cursor: pointer;
    font-weight: 600;
    font-size: 12px;
    transition: all 0.2s;
  }

  .text-preset-btn:hover {
    transform: scale(1.05);
  }

  .text-preset-btn.selected {
    border-color: var(--teal-500);
    box-shadow: 0 0 0 2px rgba(20, 184, 166, 0.3);
  }

  .custom-text-color input[type="color"] {
    width: 36px;
    height: 36px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    padding: 0;
  }

  /* Font Presets */
  .font-presets {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    margin-top: 8px;
  }

  .font-preset-btn {
    padding: 10px 16px;
    border-radius: 8px;
    border: 2px solid var(--slate-200);
    background: white;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.2s;
    color: var(--slate-700);
  }

  .font-preset-btn:hover {
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .font-preset-btn.selected {
    border-color: var(--brand-primary);
    background: rgba(20, 184, 166, 0.1);
    color: var(--brand-primary);
  }

  /* Notification Tabs */
  .notifications-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
  }

  .notif-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border: 1px solid var(--slate-200);
    background: white;
    border-radius: 8px;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--slate-600);
    transition: all 0.2s;
  }

  .notif-tab:hover {
    border-color: var(--teal-300);
    color: var(--teal-600);
  }

  .notif-tab.active {
    background: var(--teal-50);
    border-color: var(--teal-500);
    color: var(--teal-700);
  }

  .notif-tab svg {
    width: 18px;
    height: 18px;
  }

  /* Workflow Items */
  .workflows-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .workflow-item {
    background: var(--slate-50);
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    padding: 20px;
    transition: all 0.2s;
  }

  .workflow-item:hover {
    border-color: var(--slate-300);
  }

  .workflow-item-header {
    display: flex;
    align-items: flex-start;
    gap: 14px;
  }

  .workflow-icon {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, var(--teal-500), var(--teal-600));
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    flex-shrink: 0;
  }

  .workflow-item-info {
    flex: 1;
  }

  .workflow-item-info h4 {
    font-size: 15px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0 0 4px 0;
  }

  .workflow-item-info p {
    font-size: 13px;
    color: var(--slate-500);
    margin: 0;
  }

  .workflow-item-options {
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid var(--slate-200);
    display: flex;
    flex-direction: column;
    gap: 14px;
  }

  .workflow-option-row {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
    align-items: center;
  }

  .workflow-checkboxes {
    display: flex;
    flex-wrap: wrap;
    gap: 16px;
  }

  .workflow-checkbox {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 13px;
    color: var(--slate-600);
    cursor: pointer;
  }

  .workflow-checkbox input {
    width: 16px;
    height: 16px;
    accent-color: var(--teal-500);
  }

  .workflow-message {
    width: 100%;
  }

  .workflow-message label {
    display: block;
    font-size: 12px;
    color: var(--slate-500);
    margin-bottom: 6px;
  }

  .workflow-message textarea {
    width: 100%;
    padding: 10px;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    font-size: 13px;
    resize: vertical;
    font-family: inherit;
  }

  .workflow-info-card {
    margin-top: 24px;
    background: linear-gradient(135deg, var(--teal-50), var(--cyan-50));
    border: 1px solid var(--teal-200);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    gap: 16px;
  }

  .workflow-info-icon {
    width: 40px;
    height: 40px;
    background: white;
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--teal-600);
    flex-shrink: 0;
  }

  .workflow-info-content h4 {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0 0 8px 0;
  }

  .workflow-info-content ul {
    margin: 0;
    padding-left: 20px;
  }

  .workflow-info-content li {
    font-size: 13px;
    color: var(--slate-600);
    margin-bottom: 4px;
  }

  .notifications-section.full-width {
    grid-column: 1 / -1;
  }

  /* Alert Actions */
  .alert-actions {
    display: flex;
    gap: 4px;
    flex-shrink: 0;
    margin-left: auto;
  }

  .alert-action-btn {
    width: 28px;
    height: 28px;
    border: none;
    border-radius: 6px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s;
  }

  .alert-action-btn.snooze {
    background: var(--slate-100);
    color: var(--slate-500);
  }

  .alert-action-btn.snooze:hover {
    background: var(--blue-100);
    color: var(--blue-600);
  }

  .alert-action-btn.dismiss {
    background: var(--slate-100);
    color: var(--slate-500);
  }

  .alert-action-btn.dismiss:hover {
    background: var(--rose-100);
    color: var(--rose-600);
  }

  .snooze-dropdown {
    position: relative;
  }

  .snooze-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 4px;
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 100;
    min-width: 100px;
    overflow: hidden;
  }

  .snooze-menu button {
    display: block;
    width: 100%;
    padding: 8px 12px;
    border: none;
    background: none;
    text-align: left;
    font-size: 12px;
    color: var(--slate-700);
    cursor: pointer;
  }

  .snooze-menu button:hover {
    background: var(--slate-50);
  }

  .no-alerts {
    padding: 24px;
    text-align: center;
    color: var(--slate-400);
  }

  .no-alerts svg {
    color: var(--green-400);
    margin-bottom: 8px;
  }

  .no-alerts p {
    margin: 0;
    font-size: 13px;
  }

  .snoozed-header {
    font-size: 12px;
    font-weight: 600;
    color: var(--slate-500);
    margin: 16px 0 8px 0;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .snoozed-alerts {
    background: var(--slate-50);
    border-radius: 8px;
    padding: 8px;
  }

  .snoozed-item {
    display: flex;
    justify-content: space-between;
    padding: 8px;
    font-size: 12px;
    color: var(--slate-500);
  }

  .snoozed-time {
    color: var(--slate-400);
    font-style: italic;
  }

  /* Enhanced Preview */
  .preview-container {
    display: flex;
    gap: 8px;
    margin-bottom: 16px;
    height: 280px;
  }

  .preview-sidebar {
    width: 140px;
    min-width: 140px;
    border-radius: 12px;
    padding: 12px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
  }

  .preview-logo {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.15);
  }

  .preview-logo-icon {
    width: 24px;
    height: 24px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .preview-nav {
    display: flex;
    flex-direction: column;
    gap: 3px;
  }

  .preview-nav-item {
    padding: 6px 8px;
    border-radius: 5px;
    transition: all 0.2s;
  }

  .preview-nav-item.active-preview {
    background: rgba(255,255,255,0.2) !important;
  }

  .preview-content-area {
    flex: 1;
    background: var(--slate-100);
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .preview-header {
    background: white;
    padding: 8px 12px;
    border-bottom: 2px solid var(--teal-500);
  }

  .preview-widgets {
    padding: 10px;
    flex: 1;
    overflow-y: auto;
  }

  .preview-widget-label {
    font-size: 9px;
    color: var(--slate-400);
    text-transform: uppercase;
    margin-bottom: 6px;
  }

  .preview-widget-item {
    background: white;
    padding: 6px 10px;
    margin-bottom: 4px;
    border-radius: 4px;
    font-size: 10px;
    color: var(--slate-600);
    border-left: 3px solid var(--teal-500);
  }

  .preview-no-widgets {
    font-size: 10px;
    color: var(--slate-400);
    font-style: italic;
    padding: 10px;
    text-align: center;
  }

  .preview-slide-section {
    margin-top: 12px;
  }

  .preview-slide-section h4 {
    font-size: 11px;
    color: var(--slate-500);
    margin: 0 0 8px 0;
  }

  .preview-slide-mini {
    width: 100%;
    height: 80px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    gap: 4px;
  }

  .preview-slide-content {
    text-align: center;
  }

  /* ============================================================
     USER MANAGEMENT PAGE
     ============================================================ */
  .user-management-page {
    padding: 30px;
  }

  .users-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
    gap: 20px;
    margin-bottom: 40px;
  }

  .user-card {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    overflow: visible;
  }

  .user-card-header {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 20px;
    border-bottom: 1px solid var(--slate-100);
  }

  .user-avatar {
    width: 48px;
    height: 48px;
    background: linear-gradient(135deg, var(--brand-primary), var(--brand-secondary));
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
    font-size: 16px;
  }

  .user-info {
    flex: 1;
  }

  .user-info h3 {
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-900);
    margin: 0 0 2px;
  }

  .user-info p {
    font-size: 13px;
    color: var(--slate-500);
    margin: 0;
  }

  .user-status {
    padding: 4px 10px;
    border-radius: 12px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
  }

  .user-status.active {
    background: #ecfdf5;
    color: #059669;
  }

  .user-status.inactive {
    background: #fef2f2;
    color: #dc2626;
  }

  .user-card-body {
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .user-detail {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 13px;
  }

  .detail-label {
    color: var(--slate-500);
    min-width: 120px;
  }

  .role-badge {
    display: inline-block;
    padding: 4px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .role-badge.role-admin {
    background: #fef3c7;
    color: #92400e;
  }

  .role-badge.role-provider {
    background: #dbeafe;
    color: #1e40af;
  }

  .role-badge.role-staff {
    background: #f3e8ff;
    color: #7c3aed;
  }

  .user-card-actions {
    display: flex;
    gap: 8px;
    padding: 16px 20px;
    background: var(--slate-50);
    border-top: 1px solid var(--slate-100);
  }

  .user-action-btn {
    flex: 1;
    padding: 8px 12px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    border: none;
  }

  .user-action-btn.edit {
    background: var(--brand-primary);
    color: white;
  }

  .user-action-btn.reset {
    background: white;
    border: 1px solid var(--slate-300);
    color: var(--slate-600);
  }

  .user-action-btn.deactivate {
    background: white;
    border: 1px solid #fecaca;
    color: #dc2626;
  }

  .user-action-btn.activate {
    background: #ecfdf5;
    color: #059669;
  }

  .user-action-btn.delete {
    background: #fef2f2;
    color: #dc2626;
  }

  .user-action-btn.delete:hover {
    background: #dc2626;
    color: white;
  }

  .user-action-btn.save {
    background: var(--brand-primary);
    color: white;
  }

  .user-action-btn.cancel {
    background: white;
    border: 1px solid var(--slate-300);
    color: var(--slate-600);
  }

  .user-card.own-account {
    border: 2px solid var(--brand-primary);
    position: relative;
  }

  .own-account-badge {
    position: absolute;
    top: -1px;
    right: 16px;
    background: var(--brand-secondary);
    color: white;
    font-size: 10px;
    font-weight: 700;
    padding: 4px 10px;
    border-radius: 0 0 6px 6px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .user-card-edit-form {
    padding: 16px 20px;
    background: var(--slate-50);
    overflow: hidden;
  }

  .edit-form-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 16px;
  }

  .edit-form-grid .form-group {
    margin-bottom: 0;
  }

  .edit-form-grid .form-input {
    width: 100%;
    box-sizing: border-box;
  }

  .edit-form-actions {
    display: flex;
    gap: 8px;
    justify-content: flex-end;
    padding-top: 12px;
    border-top: 1px solid var(--slate-200);
  }

  .edit-form-actions .user-action-btn {
    flex: 0;
    min-width: 80px;
  }

  .role-badge.role-client {
    background: #dbeafe;
    color: #1e40af;
  }

  .role-badge.role-csm {
    background: #f3e8ff;
    color: #7c3aed;
  }

  .role-permissions-section {
    background: white;
    border-radius: 12px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.1);
    padding: 24px;
  }

  .role-permissions-section h2 {
    font-size: 18px;
    font-weight: 600;
    color: var(--slate-900);
    margin: 0 0 20px;
  }

  .permissions-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .permissions-table th {
    text-align: left;
    padding: 12px 16px;
    background: var(--slate-50);
    font-weight: 600;
    color: var(--slate-600);
    border: 1px solid var(--slate-200);
  }

  .permissions-table td {
    padding: 10px 16px;
    border: 1px solid var(--slate-200);
    text-transform: capitalize;
  }

  .permissions-table .perm-cell {
    text-align: center;
    font-weight: 600;
  }

  .permissions-table .perm-cell:contains('✓') {
    color: #059669;
  }

  /* Page Layout Designer Styles */
  .page-layout-designer {
    height: calc(100vh - 280px);
    min-height: 500px;
    display: flex;
    flex-direction: column;
  }

  .layout-designer-header {
    margin-bottom: 16px;
  }

  .unsaved-banner {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 10px 16px;
    background: #fef3c7;
    border: 1px solid #fcd34d;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    color: #92400e;
  }

  .save-changes-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #f59e0b;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    margin-left: auto;
  }

  .layout-designer-content {
    flex: 1;
    display: grid;
    grid-template-columns: 200px 1fr 200px;
    gap: 20px;
    min-height: 0;
  }

  .layout-sidebar {
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    padding: 16px;
    overflow-y: auto;
  }

  .layout-sidebar h3 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
  }

  .layout-sidebar h4 {
    margin: 16px 0 8px 0;
    font-size: 12px;
    font-weight: 600;
    color: var(--slate-500);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .page-list {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .page-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: none;
    border-radius: 8px;
    background: none;
    font-size: 13px;
    font-weight: 500;
    color: var(--slate-600);
    cursor: pointer;
    text-align: left;
    transition: all 0.2s;
  }

  .page-item:hover {
    background: var(--slate-100);
  }

  .page-item.active {
    background: var(--brand-primary)10;
    color: var(--brand-primary);
  }

  .page-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .page-widget-count {
    font-size: 11px;
    padding: 2px 6px;
    background: var(--slate-200);
    border-radius: 4px;
    color: var(--slate-500);
  }

  .page-item.active .page-widget-count {
    background: var(--brand-primary)20;
    color: var(--brand-primary);
  }

  .layout-options {
    margin-top: 20px;
    padding-top: 16px;
    border-top: 1px solid var(--slate-200);
  }

  .density-options {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  .density-btn {
    padding: 8px 12px;
    border: 1px solid var(--slate-200);
    border-radius: 6px;
    background: white;
    font-size: 12px;
    font-weight: 500;
    color: var(--slate-600);
    cursor: pointer;
    transition: all 0.2s;
  }

  .density-btn:hover {
    border-color: var(--brand-primary);
  }

  .density-btn.active {
    border-color: var(--brand-primary);
    background: var(--brand-primary)08;
    color: var(--brand-primary);
  }

  .layout-grid-container {
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .layout-grid-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    border-bottom: 1px solid var(--slate-200);
  }

  .layout-grid-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
  }

  .grid-actions {
    display: flex;
    gap: 8px;
  }

  .layout-grid {
    flex: 1;
    overflow: auto;
    padding: 16px;
  }

  .grid-columns-indicator {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 4px;
    margin-bottom: 8px;
  }

  .col-indicator {
    text-align: center;
    font-size: 10px;
    font-weight: 600;
    color: var(--slate-400);
    padding: 4px;
    background: var(--slate-50);
    border-radius: 4px;
  }

  .grid-area {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 12px;
    min-height: 300px;
    background-image: linear-gradient(var(--slate-100) 1px, transparent 1px);
    background-size: 100% 60px;
  }

  .density-compact .grid-area {
    gap: 8px;
  }

  .density-spacious .grid-area {
    gap: 20px;
  }

  .grid-widget {
    background: white;
    border: 2px solid var(--slate-200);
    border-radius: 10px;
    padding: 12px;
    cursor: grab;
    position: relative;
    display: flex;
    flex-direction: column;
    transition: all 0.2s;
  }

  .grid-widget:hover {
    border-color: var(--brand-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .grid-widget.dragging {
    opacity: 0.5;
    cursor: grabbing;
  }

  .grid-widget.drop-target {
    border-color: #10b981;
    background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.2);
    transform: scale(1.02);
    transition: all 0.2s ease;
  }

  .grid-widget.invalid-drop {
    border-color: #ef4444;
    background: linear-gradient(135deg, #fef2f2 0%, #fee2e2 100%);
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
    transform: scale(1.02);
    transition: all 0.2s ease;
    cursor: not-allowed;
  }

  .grid-widget.disabled {
    opacity: 0.5;
    border-style: dashed;
  }

  .drop-preview {
    position: relative;
    border: 3px dashed #3b82f6;
    border-radius: 10px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(147, 197, 253, 0.15) 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    pointer-events: none;
    z-index: 100;
    animation: pulse-preview 1.5s ease-in-out infinite;
  }

  @keyframes pulse-preview {
    0%, 100% {
      opacity: 0.8;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.01);
    }
  }

  .drop-preview-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    color: #3b82f6;
    font-weight: 600;
  }

  .drop-preview-icon {
    font-size: 32px;
    line-height: 1;
  }

  .drop-preview-label {
    font-size: 14px;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .grid-widget.static {
    cursor: default;
    border-color: var(--slate-300);
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
  }

  .grid-widget.static:hover {
    border-color: var(--slate-400);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .grid-widget.dynamic {
    cursor: grab;
  }

  .widget-drag-handle {
    position: absolute;
    top: 8px;
    left: 8px;
    color: var(--slate-400);
    cursor: grab;
  }

  .widget-preview-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    gap: 8px;
    color: var(--brand-primary);
  }

  .widget-title {
    font-size: 12px;
    font-weight: 500;
    color: var(--slate-700);
  }

  .widget-static-indicator {
    position: absolute;
    top: 8px;
    left: 8px;
    color: var(--slate-400);
    background: var(--slate-100);
    padding: 4px;
    border-radius: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .element-badge {
    font-size: 9px;
    font-weight: 600;
    text-transform: uppercase;
    padding: 2px 6px;
    border-radius: 4px;
    letter-spacing: 0.5px;
    margin-top: 4px;
  }

  .element-badge.schema {
    background: #dbeafe;
    color: #1e40af;
  }

  .element-badge.static {
    background: #f1f5f9;
    color: #475569;
  }

  .element-badge.custom {
    background: #dcfce7;
    color: #166534;
  }

  .widget-controls {
    position: absolute;
    top: 8px;
    right: 8px;
    display: flex;
    gap: 4px;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .grid-widget:hover .widget-controls {
    opacity: 1;
  }

  .widget-ctrl-btn {
    width: 24px;
    height: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--slate-200);
    border-radius: 4px;
    background: white;
    color: var(--slate-500);
    cursor: pointer;
    transition: all 0.2s;
  }

  .widget-ctrl-btn:hover {
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .widget-resize-handle {
    position: absolute;
    bottom: 4px;
    right: 4px;
    width: 12px;
    height: 12px;
    cursor: se-resize;
    background: linear-gradient(135deg, transparent 50%, var(--slate-300) 50%);
    border-radius: 0 0 6px 0;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .grid-widget:hover .widget-resize-handle {
    opacity: 1;
  }

  .empty-grid-message {
    grid-column: 1 / -1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
    color: var(--slate-400);
  }

  .empty-grid-message svg {
    margin-bottom: 12px;
  }

  .empty-grid-message p {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 500;
    color: var(--slate-600);
  }

  .empty-grid-message span {
    font-size: 13px;
  }

  .available-widgets-sidebar {
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    padding: 16px;
    overflow-y: auto;
  }

  .available-widgets-sidebar h3 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
  }

  .sidebar-hint {
    font-size: 12px;
    color: var(--slate-500);
    margin: 0 0 16px 0;
  }

  .available-widgets-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .available-widget-item {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid var(--slate-200);
    border-radius: 8px;
    background: white;
    font-size: 12px;
    font-weight: 500;
    color: var(--slate-600);
    cursor: default;
    transition: all 0.2s;
  }

  .available-widget-item:hover {
    background: var(--slate-50);
  }

  .available-widget-item svg {
    color: var(--brand-primary);
  }

  .available-widget-item.disabled {
    opacity: 0.5;
    background: var(--slate-50);
  }

  .available-widget-item.disabled span {
    text-decoration: line-through;
  }

  .available-widget-item.static-element {
    background: linear-gradient(135deg, #ffffff 0%, #f8fafc 100%);
    border-color: var(--slate-300);
    cursor: default;
  }

  .element-group-header {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    color: var(--slate-500);
    margin-bottom: 8px;
    padding: 4px 0;
    letter-spacing: 0.5px;
  }

  .mini-badge {
    font-size: 8px;
    font-weight: 600;
    text-transform: uppercase;
    background: #dbeafe;
    color: #1e40af;
    padding: 2px 4px;
    border-radius: 3px;
    margin-left: auto;
  }

  /* Loading states */
  .widget-library-loading,
  .layout-designer-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--slate-500);
  }

  .widget-library-loading p,
  .layout-designer-loading p {
    margin-top: 12px;
    font-size: 14px;
  }

  @keyframes spin {
    to { transform: rotate(360deg); }
  }

  .spin {
    animation: spin 1s linear infinite;
  }

  /* Edit Dashboard Button for Dashboard Pages */
  .edit-dashboard-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: var(--brand-primary);
    color: white;
    border: none;
    border-radius: 10px;
    font-size: 14px;
    font-weight: 500;
    cursor: pointer;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    transition: all 0.2s;
    z-index: 100;
  }

  .edit-dashboard-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
  }

  .edit-dashboard-btn.discreet {
    padding: 10px;
    background: rgba(255, 255, 255, 0.9);
    color: var(--slate-600);
    border: 1px solid var(--slate-200);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  }

  .edit-dashboard-btn.discreet:hover {
    background: white;
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  /* Dashboard Edit Mode Styles */
  .dashboard-page {
    position: relative;
  }

  .dashboard-sections {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  .dashboard-sections > .grid-container {
    margin-bottom: 0;
  }

  .dashboard-sections > .chart-card {
    margin-bottom: 0;
  }

  .dashboard-sections > .summary-card {
    margin-top: 0;
  }

  .dashboard-page.edit-mode {
    background: linear-gradient(to bottom, rgba(14, 165, 233, 0.02), transparent);
  }

  .edit-mode-header {
    position: fixed;
    bottom: 24px;
    left: 50%;
    transform: translateX(-50%);
    z-index: 1000;
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    border: 2px solid var(--brand-primary);
    border-radius: 16px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 20px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
    max-width: calc(100vw - 48px);
  }

  .edit-mode-header h3 {
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-800);
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .edit-mode-header h3 svg {
    color: var(--brand-primary);
  }

  .edit-mode-actions {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .edit-mode-btn {
    padding: 8px 16px;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 6px;
    transition: all 0.2s;
    border: none;
  }

  .edit-mode-btn.primary {
    background: var(--brand-primary);
    color: white;
  }

  .edit-mode-btn.primary:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  .edit-mode-btn.primary:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }

  .edit-mode-btn.secondary {
    background: var(--slate-100);
    color: var(--slate-700);
    border: 1px solid var(--slate-200);
  }

  .edit-mode-btn.secondary:hover:not(:disabled) {
    background: var(--slate-200);
  }

  .edit-mode-btn.secondary:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .compact-layout-wrapper {
    position: relative;
  }

  .compact-tooltip {
    position: absolute;
    bottom: calc(100% + 12px);
    left: 50%;
    transform: translateX(-50%);
    background: var(--slate-900);
    color: white;
    padding: 12px 16px;
    border-radius: 8px;
    font-size: 13px;
    width: 280px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    pointer-events: none;
    z-index: 1001;
  }

  .compact-tooltip::after {
    content: '';
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%);
    border: 6px solid transparent;
    border-top-color: var(--slate-900);
  }

  .compact-tooltip strong {
    display: block;
    margin-bottom: 6px;
    font-size: 14px;
  }

  .compact-tooltip p {
    margin: 0;
    line-height: 1.5;
    opacity: 0.9;
  }

  .edit-mode-btn.danger {
    background: #fee2e2;
    color: #dc2626;
    border: 1px solid #fecaca;
  }

  .edit-mode-btn.danger:hover {
    background: #fecaca;
  }

  .edit-toggle-btn {
    position: fixed;
    bottom: 24px;
    right: 24px;
    z-index: 50;
    padding: 12px 20px;
    background: white;
    color: var(--slate-600);
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
    transition: all 0.2s;
  }

  .edit-toggle-btn:hover {
    background: var(--slate-50);
    border-color: var(--brand-primary);
    color: var(--brand-primary);
    transform: translateY(-2px);
    box-shadow: 0 6px 20px rgba(0, 0, 0, 0.15);
  }

  .edit-toggle-btn.active {
    background: var(--brand-primary);
    color: white;
    border-color: var(--brand-primary);
  }

  /* Editable Grid Container */
  .editable-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
    position: relative;
  }

  .edit-mode .editable-grid {
    background-image:
      linear-gradient(to right, rgba(14, 165, 233, 0.05) 1px, transparent 1px),
      linear-gradient(to bottom, rgba(14, 165, 233, 0.05) 1px, transparent 1px);
    background-size: calc(100% / 12) 60px;
    padding: 8px;
    border-radius: 12px;
    min-height: 200px;
  }

  /* Editable Widget */
  .editable-widget {
    position: relative;
    transition: opacity 0.2s ease;
  }

  .editable-widget.widget-animating {
    transition: transform 280ms cubic-bezier(0.2, 0, 0, 1), opacity 0.2s ease;
    will-change: transform;
  }

  .editable-widget.widget-drag-source {
    opacity: 0.4;
    pointer-events: none;
  }

  /* Drag Overlay - floating widget that follows cursor */
  .drag-overlay {
    position: fixed;
    pointer-events: none;
    z-index: 10000;
    transform: scale(1.03);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.25), 0 8px 16px rgba(0, 0, 0, 0.15);
    border-radius: 12px;
    opacity: 0.95;
  }

  .drag-overlay > * {
    pointer-events: none;
  }

  .editable-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
    position: relative;
    min-height: 200px;
  }

  .widget-content-wrapper {
    position: relative;
  }

  .widget-content-wrapper.edit-mode-active {
    cursor: grab;
    height: 100%;
  }

  .widget-content-wrapper.edit-mode-active:hover {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
    z-index: 10;
  }

  /* Make chart cards fill container height in edit mode */
  .widget-content-wrapper.edit-mode-active .chart-card {
    height: 100%;
    margin-bottom: 0;
    display: flex;
    flex-direction: column;
  }

  .widget-content-wrapper.edit-mode-active .chart-card > :last-child {
    flex: 1;
  }

  .editable-widget.widget-drag-source .widget-content-wrapper {
    opacity: 0.4;
  }

  .edit-mode-active.resizing {
    z-index: 50;
  }

  .widget-edit-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: transparent;
    z-index: 5;
    display: none;
  }

  .edit-mode-active .widget-edit-overlay {
    display: block;
  }

  .widget-drag-handle-corner {
    position: absolute;
    top: 8px;
    left: 8px;
    width: 28px;
    height: 28px;
    background: var(--brand-primary);
    border-radius: 6px;
    display: none;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: grab;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  }

  .edit-mode-active:hover .widget-drag-handle-corner {
    display: flex;
  }

  .widget-info-badge {
    position: absolute;
    top: 8px;
    right: 8px;
    background: rgba(0, 0, 0, 0.75);
    color: white;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
    display: none;
    z-index: 10;
    pointer-events: none;
  }

  .edit-mode-active:hover .widget-info-badge,
  .edit-mode-active.resizing .widget-info-badge {
    display: block;
  }

  .resize-handle {
    position: absolute;
    background: var(--brand-primary);
    z-index: 15;
    opacity: 0;
    transition: opacity 0.2s;
  }

  .edit-mode-active:hover .resize-handle,
  .edit-mode-active.resizing .resize-handle {
    opacity: 1;
  }

  .resize-handle-n, .resize-handle-s {
    left: 20%;
    right: 20%;
    height: 4px;
    cursor: ns-resize;
  }

  .resize-handle-n {
    top: 0;
  }

  .resize-handle-s {
    bottom: 0;
  }

  .resize-handle-e, .resize-handle-w {
    top: 20%;
    bottom: 20%;
    width: 4px;
    cursor: ew-resize;
  }

  .resize-handle-e {
    right: 0;
  }

  .resize-handle-w {
    left: 0;
  }

  .resize-handle-ne, .resize-handle-nw, .resize-handle-se, .resize-handle-sw {
    width: 10px;
    height: 10px;
    border-radius: 50%;
  }

  .resize-handle-ne {
    top: -5px;
    right: -5px;
    cursor: ne-resize;
  }

  .resize-handle-nw {
    top: -5px;
    left: -5px;
    cursor: nw-resize;
  }

  .resize-handle-se {
    bottom: -5px;
    right: -5px;
    cursor: se-resize;
  }

  .resize-handle-sw {
    bottom: -5px;
    left: -5px;
    cursor: sw-resize;
  }

  /* Drop Zone Indicators */
  .drop-zone-indicator {
    background: rgba(14, 165, 233, 0.15);
    border: 2px dashed var(--brand-primary);
    border-radius: 8px;
    pointer-events: none;
    z-index: 5;
    animation: pulse-drop-zone 1.5s ease-in-out infinite;
  }

  @keyframes pulse-drop-zone {
    0%, 100% {
      background: rgba(14, 165, 233, 0.15);
      border-color: var(--brand-primary);
    }
    50% {
      background: rgba(14, 165, 233, 0.25);
      border-color: rgba(14, 165, 233, 0.8);
    }
  }

  .drop-zone-indicator.active {
    opacity: 1;
  }

  /* Unsaved Changes Indicator */
  .unsaved-indicator {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    background: #fef3c7;
    color: #92400e;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
  }

  /* KPI Grid in edit mode */
  .edit-mode .kpi-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
  }

  .edit-mode .kpi-grid .kpi-card-wrapper {
    grid-column: span 3;
  }

  .edit-mode .two-col-grid {
    display: grid;
    grid-template-columns: repeat(12, 1fr);
    gap: 16px;
  }

  .edit-mode .two-col-grid > * {
    grid-column: span 6;
  }

  /* Tabbed Form Styles */
  .tabbed-form {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .form-tabs {
    display: flex;
    gap: 8px;
    padding: 16px 24px 0 24px;
    border-bottom: 2px solid var(--slate-200);
    overflow-x: auto;
    scrollbar-width: thin;
  }

  .form-tabs::-webkit-scrollbar {
    height: 4px;
  }

  .form-tabs::-webkit-scrollbar-thumb {
    background: var(--slate-300);
    border-radius: 2px;
  }

  .form-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: none;
    background: transparent;
    border-bottom: 3px solid transparent;
    cursor: pointer;
    font-size: 14px;
    font-weight: 500;
    color: var(--slate-600);
    transition: all 0.2s;
    white-space: nowrap;
  }

  .form-tab:hover {
    color: var(--brand-primary);
    background: var(--slate-50);
  }

  .form-tab.active {
    color: var(--brand-primary);
    border-bottom-color: var(--brand-primary);
  }

  .form-tab svg {
    flex-shrink: 0;
  }

  .form-tab.has-data {
    position: relative;
  }

  .form-tab.has-data::after {
    content: '';
    position: absolute;
    top: 8px;
    right: 8px;
    width: 6px;
    height: 6px;
    background: var(--teal-500);
    border-radius: 50%;
  }

  .form-tab-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .tab-content-header {
    display: flex;
    justify-content: flex-end;
    align-items: center;
    margin-bottom: 20px;
  }

  .tab-content-actions {
    display: flex;
    gap: 12px;
  }

  .btn-text {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border: none;
    background: transparent;
    color: var(--slate-600);
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    border-radius: 6px;
    transition: all 0.2s;
  }

  .btn-text:hover {
    background: var(--slate-100);
    color: var(--brand-primary);
  }

  .tab-sections {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  .empty-tab-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: var(--slate-400);
    text-align: center;
  }

  .empty-tab-message svg {
    margin-bottom: 12px;
    opacity: 0.4;
  }

  .empty-tab-message p {
    margin: 0;
    font-size: 14px;
  }

  /* Collapsible Section Styles */
  .collapsible-section {
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s;
  }

  .collapsible-section:hover {
    border-color: var(--slate-300);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  }

  .collapsible-section.disabled {
    opacity: 0.5;
  }

  .collapsible-section-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 20px;
    cursor: pointer;
    transition: all 0.2s;
    user-select: none;
  }

  .collapsible-section-header:hover {
    background: var(--slate-50);
  }

  .section-header-left {
    display: flex;
    align-items: center;
    gap: 14px;
    flex: 1;
  }

  .section-header-right {
    display: flex;
    align-items: center;
    gap: 12px;
    color: var(--slate-500);
  }

  .section-title {
    margin: 0 0 2px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-800);
  }

  .section-subtitle {
    margin: 0;
    font-size: 13px;
    color: var(--slate-500);
  }

  .field-count {
    font-size: 12px;
    font-weight: 500;
    color: var(--slate-500);
    padding: 4px 10px;
    background: var(--slate-100);
    border-radius: 12px;
  }

  .collapsible-section-content {
    padding: 0 20px 20px 20px;
    animation: slideDown 0.2s ease-out;
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
`;

// ============================================================
// COMPONENTS
// ============================================================

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="custom-tooltip">
        <p className="label">{label}</p>
        <p className="value">{payload[0].value}</p>
      </div>
    );
  }
  return null;
};

const generateBrandPalette = (brandColor) => {
  const hexToHSL = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return { h: 180, s: 70, l: 40 };
    let r = parseInt(result[1], 16) / 255;
    let g = parseInt(result[2], 16) / 255;
    let b = parseInt(result[3], 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: h * 360, s: s * 100, l: l * 100 };
  };

  const hslToHex = (h, s, l) => {
    s /= 100;
    l /= 100;
    const a = s * Math.min(l, 1 - l);
    const f = n => {
      const k = (n + h / 30) % 12;
      const color = l - a * Math.max(Math.min(k - 3, 9 - k, 1), -1);
      return Math.round(255 * color).toString(16).padStart(2, '0');
    };
    return `#${f(0)}${f(8)}${f(4)}`;
  };

  const { h, s, l } = hexToHSL(brandColor || '#0d9488');
  return [
    brandColor || '#0d9488',
    hslToHex((h + 30) % 360, s, l),
    hslToHex((h + 60) % 360, s, l),
    hslToHex((h + 180) % 360, s, l),
    hslToHex((h + 210) % 360, s, l),
    hslToHex((h + 270) % 360, s, l),
  ];
};


function KpiCard({ icon: Icon, label, value, delta, iconColor = "teal", brandColor }) {
  const isPositive = delta?.startsWith("+");
  const iconStyle = iconColor === 'brand' && brandColor ? { background: brandColor, color: 'white' } : {};

  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${iconColor === 'brand' ? '' : iconColor}`} style={iconStyle}>
        <Icon size={20} />
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={iconColor === 'brand' && brandColor ? { color: brandColor } : {}}>{value}</div>
      {delta && (
        <span className={`kpi-delta ${isPositive ? "positive" : "negative"}`}>
          <TrendingUp size={13} />
          {delta} vs last month
        </span>
      )}
    </div>
  );
}

function DashboardGrid({ children, className = '', style = {} }) {
  return (
    <div
      className={`grid-container ${className}`}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(12, 1fr)',
        gap: '20px',
        width: '100%',
        marginBottom: '32px',
        alignItems: 'start',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

function GridKpiCard({ icon, label, value, delta, iconColor, brandColor, widthUnits = 3 }) {
  return (
    <div
      className="grid-item"
      style={getGridItemStyle(widthUnits)}
      data-width={widthUnits}
    >
      <KpiCard
        icon={icon}
        label={label}
        value={value}
        delta={delta}
        iconColor={iconColor}
        brandColor={brandColor}
      />
    </div>
  );
}

function DashboardSection({ children, widthUnits = 12, className = '', title, subtitle }) {
  return (
    <div
      className={`grid-item dashboard-section ${className}`}
      style={{ ...getGridItemStyle(widthUnits), overflow: 'hidden' }}
      data-width={widthUnits}
    >
      {title && (
        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '20px', fontWeight: '600', color: '#0f172a', marginBottom: '4px' }}>
            {title}
          </h2>
          {subtitle && (
            <p style={{ fontSize: '14px', color: '#64748b' }}>{subtitle}</p>
          )}
        </div>
      )}
      <div
        className="grid-container"
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${Math.max(1, Math.min(12, widthUnits))}, 1fr)`,
          gap: '20px',
          width: '100%',
          minWidth: 0,
        }}
      >
        {children}
      </div>
    </div>
  );
}


function Sidebar({ activePage, setActivePage, isOpen = false }) {
  const { currentUser, hasPermission, logout } = useAuth();
  const { customization, getEnabledTabs } = useCustomization();
  const [settingsExpanded, setSettingsExpanded] = useState(false);
  
  // Get customized tabs or fall back to defaults
  const enabledTabs = getEnabledTabs();
  
  // Map custom tabs to nav items format
  const navItems = enabledTabs.map(tab => {
    const iconMap = {
      'LayoutDashboard': LayoutDashboard,
      'Users': Users,
      'MessageSquare': MessageSquare,
      'Mail': Mail,
      'FileText': FileText,
      'Heart': Heart,
      'DollarSign': DollarSign,
      'Activity': Activity,
      'Target': Target,
      'TrendingUp': TrendingUp,
      'Calendar': Calendar,
      'Clock': Clock,
      'CheckCircle': CheckCircle,
      'Star': Star,
      'Lightbulb': Lightbulb,
      'Settings': Settings,
      'BarChart2': BarChart2,
      'PieChart': PieChart,
      'Bell': Bell,
      'Shield': Shield,
      'Award': Award,
      'Briefcase': Briefcase,
      'Pill': Pill,
      'Smartphone': Smartphone,
      'HeartPulse': HeartPulse,
      'Stethoscope': Stethoscope,
      'Sparkles': Sparkles,
      'Zap': Zap,
      'Layers': Layers,
      'AlertCircle': AlertCircle,
      'Send': Send,
    };
    const permissionMap = {
      'overview': 'view_dashboard',
      'enrollment': 'view_patients',
      'financial': 'view_financial',
      'outcomes': 'view_outcomes',
      'stories': 'view_stories',
      'initiatives': 'view_initiatives',
      'opportunities': 'view_opportunities',
      'successPlanning': 'edit_client_info',
    };
    return {
      id: tab.id,
      label: tab.label,
      icon: iconMap[tab.icon] || LayoutDashboard,
      permission: permissionMap[tab.id] || 'view_dashboard'
    };
  });

  // Settings sub-items (inside collapsible Settings section)
  const settingsItems = [
    { id: "admin", label: "Data Management", icon: LayoutDashboard, permission: 'edit_data' },
    { id: "notifications", label: "Notifications & Alerts", icon: Bell, permission: 'edit_data' },
    { id: "customization", label: "Customization", icon: Palette, permission: 'manage_customization' },
    { id: "users", label: "User Management", icon: UserCheck, permission: 'manage_users' },
    { id: "deleted-accounts", label: "Deleted Accounts", icon: Trash2, permission: 'delete_data' },
    { id: "audit", label: "Audit Trail", icon: ClipboardList, permission: 'view_audit_log' },
  ];

  const visibleSettingsItems = settingsItems.filter(item => hasPermission(item.permission));
  const isSettingsActive = settingsItems.some(item => item.id === activePage);

  const branding = customization.branding;
  const textColor = branding.sidebarTextColor || '#ffffff';

  return (
    <aside className={`sidebar ${isOpen ? 'open' : ''}`} style={{ background: branding.sidebarBg, color: textColor }}>
      <div className="logo">
        {branding.logoMode === 'full-image' && branding.logoUrl ? (
          // Full image mode - just show the uploaded image
          <img src={branding.logoUrl} alt={branding.platformName} className="logo-image full" />
        ) : branding.logoMode === 'icon-text' && branding.logoUrl ? (
          // Icon + text mode - show uploaded icon with platform name
          <>
            <img src={branding.logoUrl} alt="" className="logo-icon-img" />
            <span className="logo-text" style={{ color: textColor, fontFamily: `'${branding.fontFamily || 'DM Sans'}', sans-serif` }}>{branding.logoText || branding.platformName}</span>
          </>
        ) : (
          // Default mode - show default icon with platform name
          <>
            <div className="logo-icon" style={{ background: branding.primaryColor }}>
              <Shield size={24} color="white" />
            </div>
            <span className="logo-text" style={{ color: textColor, fontFamily: `'${branding.fontFamily || 'DM Sans'}', sans-serif` }}>{branding.logoText || branding.platformName}</span>
          </>
        )}
      </div>
      
      {/* User info - clickable to go to profile */}
      {currentUser && (
        <div 
          className={`sidebar-user-info clickable ${activePage === 'profile' ? 'active' : ''}`}
          onClick={() => setActivePage('profile')}
          title="Edit your profile"
          style={{ 
            background: activePage === 'profile' ? `${branding.primaryColor}33` : undefined,
            borderColor: activePage === 'profile' ? branding.primaryColor : undefined
          }}
        >
          <div className="sidebar-user-avatar" style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
            {currentUser.name.split(' ').map(n => n[0]).join('')}
          </div>
          <div className="sidebar-user-details">
            <span className="sidebar-user-name" style={{ color: textColor }}>{currentUser.name}</span>
            <span className="sidebar-user-role" style={{ color: `${textColor}99` }}>{ROLES[currentUser.role]?.name}</span>
          </div>
          <ChevronRight size={16} className="sidebar-user-chevron" style={{ color: `${textColor}66` }} />
        </div>
      )}
      
      <nav>
        {navItems.filter(item => hasPermission(item.permission)).map((item) => (
          <div
            key={item.id}
            className={`nav-item ${activePage === item.id ? "active" : ""}`}
            onClick={() => setActivePage(item.id)}
            style={{ 
              background: activePage === item.id ? `${branding.primaryColor}33` : undefined,
              borderLeftColor: activePage === item.id ? branding.primaryColor : 'transparent',
              color: activePage === item.id ? branding.primaryColor : textColor
            }}
          >
            <item.icon />
            <span>{item.label}</span>
          </div>
        ))}
        
        {/* Divider */}
        <div style={{
          height: '1px',
          background: 'rgba(255,255,255,0.1)',
          margin: '16px 0'
        }} />

        {/* Success Planning - Internal tool */}
        {hasPermission('edit_client_info') && (
          <div
            className={`nav-item ${activePage === 'successPlanning' ? "active" : ""}`}
            onClick={() => setActivePage('successPlanning')}
            style={{
              background: activePage === 'successPlanning' ? `${branding.primaryColor}33` : undefined,
              borderLeftColor: activePage === 'successPlanning' ? branding.primaryColor : 'transparent',
              color: activePage === 'successPlanning' ? branding.primaryColor : undefined
            }}
          >
            <Target />
            <span>Success Planning</span>
          </div>
        )}

        {/* Portfolio Analytics - shown directly */}
        {hasPermission('view_portfolio_analytics') && (
          <div
            className={`nav-item ${activePage === 'portfolio' ? "active" : ""}`}
            onClick={() => setActivePage('portfolio')}
            style={{
              background: activePage === 'portfolio' ? `${branding.primaryColor}33` : undefined,
              borderLeftColor: activePage === 'portfolio' ? branding.primaryColor : 'transparent',
              color: activePage === 'portfolio' ? branding.primaryColor : undefined
            }}
          >
            <TrendingUp />
            <span>Portfolio Analytics</span>
          </div>
        )}

        {/* Settings Section - Collapsible */}
        {visibleSettingsItems.length > 0 && (
          <div className="settings-section">
            <div
              className={`nav-item settings-header ${isSettingsActive || settingsExpanded ? 'expanded' : ''}`}
              onClick={() => setSettingsExpanded(!settingsExpanded)}
              style={{
                background: isSettingsActive ? `${branding.primaryColor}22` : undefined,
                borderLeftColor: isSettingsActive ? branding.primaryColor : 'transparent',
              }}
            >
              <Settings />
              <span>Settings</span>
              <ChevronDown 
                size={16} 
                className={`settings-chevron ${settingsExpanded || isSettingsActive ? 'rotated' : ''}`}
              />
            </div>
            
            {(settingsExpanded || isSettingsActive) && (
              <div className="settings-submenu">
                {visibleSettingsItems.map((item) => (
                  <div
                    key={item.id}
                    className={`nav-item sub-item ${activePage === item.id ? "active" : ""}`}
                    onClick={() => setActivePage(item.id)}
                    style={{ 
                      background: activePage === item.id ? `${branding.primaryColor}33` : undefined,
                      color: activePage === item.id ? branding.primaryColor : undefined
                    }}
                  >
                    <item.icon size={16} />
                    <span>{item.label}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
        
        {/* Logout button */}
        <div className="sidebar-logout">
          <div className="nav-item logout-btn" onClick={logout}>
            <LogOut />
            <span>Sign Out</span>
          </div>
        </div>
      </nav>
    </aside>
  );
}

// ============================================================
// NOTIFICATION BELL COMPONENT
// ============================================================

function NotificationBell({ onNavigateToAction }) {
  const { alerts, alertCount, dismissAlert: dismissDbAlert, snoozeAlert: snoozeDbAlert } = useNotificationAlerts();
  const { hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [popupAlerts, setPopupAlerts] = useState([]);
  const bellRef = useRef(null);
  const lastAlertCountRef = useRef(0);

  // Notifications are internal-only - clients should not see them
  if (!hasPermission('edit_data')) {
    return null;
  }

  const activeAlerts = alerts;
  const totalAlertCount = alertCount;
  
  // Show popup when new alerts come in
  useEffect(() => {
    if (totalAlertCount > lastAlertCountRef.current && lastAlertCountRef.current > 0) {
      // New alert added - show popup for the newest one
      const newestAlert = activeAlerts[0];
      if (newestAlert && !popupAlerts.find(p => p.id === newestAlert.id)) {
        setPopupAlerts(prev => [...prev, newestAlert]);
        // Auto-dismiss popup after 5 seconds
        setTimeout(() => {
          setPopupAlerts(prev => prev.filter(p => p.id !== newestAlert.id));
        }, 5000);
      }
    }
    lastAlertCountRef.current = totalAlertCount;
  }, [totalAlertCount, activeAlerts, popupAlerts]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (bellRef.current && !bellRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const typeIcons = {
    opportunity: Target,
    risk: AlertTriangle,
    overdue: Clock
  };

  const handleDismissPopup = (alertId) => {
    setPopupAlerts(prev => prev.filter(p => p.id !== alertId));
    dismissDbAlert(alertId);
  };

  const handleAlertClick = (alert) => {
    if (onNavigateToAction) {
      onNavigateToAction(alert.client_id, alert.action_id);
      dismissDbAlert(alert.id);
      setIsOpen(false);
    }
  };
  
  return (
    <>
      {/* Popup Notifications */}
      <div className="notification-popups">
        {popupAlerts.map(alert => {
          const IconComponent = typeIcons[alert.alert_type] || AlertCircle;
          return (
            <div key={alert.id} className={`notification-popup ${alert.alert_type}`}>
              <IconComponent size={20} />
              <div className="popup-content">
                <strong>{alert.title}</strong>
                <p>{alert.message}</p>
              </div>
              <button onClick={() => handleDismissPopup(alert.id)} className="popup-close">
                <X size={16} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Bell Icon with Dropdown */}
      <div className="notification-bell-wrapper" ref={bellRef}>
        <button
          className={`notification-bell-btn ${totalAlertCount > 0 ? 'has-alerts' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title="Notifications"
        >
          <Bell size={20} />
          {totalAlertCount > 0 && (
            <span className="notification-badge">{totalAlertCount > 9 ? '9+' : totalAlertCount}</span>
          )}
        </button>
        
        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-dropdown-header">
              <h4>Notifications</h4>
              {totalAlertCount > 0 && <span className="alert-count">{totalAlertCount} active</span>}
            </div>
            <div className="notification-dropdown-body">
              {activeAlerts.length === 0 ? (
                <div className="no-notifications">
                  <Bell size={24} />
                  <p>No active notifications</p>
                </div>
              ) : (
                activeAlerts.slice(0, 5).map(alert => {
                  const IconComponent = typeIcons[alert.alert_type] || AlertCircle;
                  const timeAgo = new Date(alert.created_at).toLocaleDateString();
                  return (
                    <div
                      key={alert.id}
                      className={`notification-dropdown-item ${alert.alert_type}`}
                      onClick={() => handleAlertClick(alert)}
                      style={{ cursor: 'pointer' }}
                    >
                      <IconComponent size={16} />
                      <div className="notification-item-content">
                        <strong>{alert.title}</strong>
                        <p>{alert.message}</p>
                        <span className="notification-time">{timeAgo}</span>
                      </div>
                      <div className="notification-item-actions">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            snoozeDbAlert(alert.id, 1);
                          }}
                          title="Snooze 1 hour"
                          className="snooze-btn"
                        >
                          <Clock size={14} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            dismissDbAlert(alert.id);
                          }}
                          title="Dismiss"
                          className="dismiss-btn"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            {totalAlertCount > 5 && (
              <div className="notification-dropdown-footer">
                <span>+{totalAlertCount - 5} more notifications</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Topbar({ onExport, onPresent, selectedClientId, onClientChange, selectedMonth, onMonthChange, hasUnsavedChanges, canGoBack, onGoBack, onAddClient, onDeleteClient, clients, onNavigateToAction, onToggleMobileMenu, availableMonths }) {
  const { currentUser, hasPermission, canAccessClient } = useAuth();

  // Filter clients based on user's access
  const accessibleClients = (clients || clientsList).filter(client => canAccessClient(client.id));

  return (
    <header className="topbar">
      <div className="topbar-left">
        {onToggleMobileMenu && (
          <button className="mobile-menu-btn" onClick={onToggleMobileMenu} title="Toggle menu">
            <Menu size={20} />
          </button>
        )}
        {canGoBack && (
          <button className="back-btn" onClick={onGoBack} title="Go back">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="select-wrapper">
          <select
            value={selectedClientId}
            onChange={(e) => onClientChange(e.target.value)}
          >
            {accessibleClients.map(client => (
              <option key={client.id} value={client.id}>{client.name}</option>
            ))}
          </select>
        </div>
        {hasPermission('edit_data') && (
          <>
            <button
              className="add-client-btn"
              onClick={onAddClient}
              title="Add New Client"
            >
              <Plus size={16} />
            </button>
            <button
              className="delete-client-btn"
              onClick={onDeleteClient}
              title="Delete Current Client"
            >
              <Trash2 size={16} />
            </button>
          </>
        )}
        <div className="select-wrapper">
          <select
            value={selectedMonth}
            onChange={(e) => onMonthChange(e.target.value)}
          >
            {availableMonths.map(month => (
              <option key={month.id} value={month.id}>
                {month.label}{month.isCurrent ? ' (Current)' : ''}
              </option>
            ))}
          </select>
        </div>
        {hasUnsavedChanges && (
          <span className="unsaved-indicator">● Unsaved changes</span>
        )}
      </div>
      <div className="topbar-right">
        <NotificationBell onNavigateToAction={onNavigateToAction} />
        {/* Only show Present button if user has export_reports permission */}
        {hasPermission('export_reports') && (
          <button className="present-btn" onClick={onPresent}>
            <span className="present-icon">▶</span>
            Present
          </button>
        )}
        {hasPermission('export_reports') && (
          <button className="export-btn" onClick={onExport}>
            <Download size={18} />
            Export Report
          </button>
        )}
      </div>
    </header>
  );
}


// ============================================================
// PAGES
// ============================================================

function GenericSectionRenderer({ section, data, brandColor, clientId }) {
  const { customization, FIELD_TYPES } = useCustomization();

  const iconMap = {
    'LayoutDashboard': LayoutDashboard, 'Users': Users, 'MessageSquare': MessageSquare,
    'Mail': Mail, 'FileText': FileText, 'Heart': Heart, 'DollarSign': DollarSign,
    'Activity': Activity, 'Target': Target, 'TrendingUp': TrendingUp, 'Calendar': Calendar,
    'Clock': Clock, 'CheckCircle': CheckCircle, 'Star': Star, 'Lightbulb': Lightbulb,
    'Settings': Settings, 'BarChart2': BarChart2, 'PieChart': PieChart, 'Bell': Bell,
    'Shield': Shield, 'Award': Award, 'Briefcase': Briefcase, 'Pill': Pill,
    'Smartphone': Smartphone, 'HeartPulse': HeartPulse, 'Stethoscope': Stethoscope,
    'Sparkles': Sparkles, 'Zap': Zap, 'Layers': Layers, 'AlertCircle': AlertCircle, 'Send': Send,
  };

  const rawFormData = data?.rawFormData || data || {};

  const getFieldValue = (fieldId) => {
    if (rawFormData && rawFormData[fieldId] !== undefined) return rawFormData[fieldId];
    if (data?.overview && data.overview[fieldId] !== undefined) return data.overview[fieldId];
    return 0;
  };

  const formatValue = (field, value) => {
    if (!field) return value || '';
    switch (field.fieldType) {
      case FIELD_TYPES?.DATE:
        return value ? new Date(value).toLocaleDateString() : '';
      case FIELD_TYPES?.CURRENCY:
        return typeof value === 'string' && value.startsWith('$') ? value : `$${Number(value || 0).toLocaleString()}`;
      case FIELD_TYPES?.PERCENT:
        return `${value || 0}%`;
      case FIELD_TYPES?.TOGGLE:
        return value ? 'Yes' : 'No';
      case FIELD_TYPES?.TEXT:
      case FIELD_TYPES?.TEXTAREA:
      case FIELD_TYPES?.SELECT:
        return value || '';
      default:
        if (field.prefix === '$') return typeof value === 'string' && value.startsWith('$') ? value : `$${Number(value || 0).toLocaleString()}`;
        if (field.suffix === '%') return `${value || 0}%`;
        return typeof value === 'number' ? value.toLocaleString() : Number(value || 0).toLocaleString();
    }
  };

  const getIconForField = (field, index) => {
    if (field.icon && iconMap[field.icon]) return iconMap[field.icon];
    const metricDef = customization.metrics?.[field.metricId || field.id];
    if (metricDef?.icon && iconMap[metricDef.icon]) return iconMap[metricDef.icon];
    const defaultIcons = [Users, Activity, Calendar, DollarSign, Heart, TrendingUp, Target, Star];
    return defaultIcons[index % defaultIcons.length];
  };

  const getColorForField = (field, index) => {
    const metricDef = customization.metrics?.[field.metricId || field.id];
    if (metricDef?.color) return metricDef.color;
    const defaultColors = ['brand', 'emerald', 'amber', 'rose', 'blue', 'teal'];
    return defaultColors[index % defaultColors.length];
  };

  const sectionFields = section.fields
    ? [...section.fields]
        .filter(f => f.showOnDashboard !== false && f.fieldType !== FIELD_TYPES?.DATE)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  if (sectionFields.length === 0) return null;

  return (
    <DashboardGrid key={section.id} style={{ marginBottom: '32px' }}>
      <DashboardSection
        widthUnits={section.widthUnits || 12}
        title={section.title}
        subtitle={section.subtitle}
      >
        {sectionFields.map((field, index) => {
          const Icon = getIconForField(field, index);
          const value = getFieldValue(field.id);
          const formattedValue = formatValue(field, value);
          const color = getColorForField(field, index);
          return (
            <GridKpiCard
              key={field.id}
              icon={Icon}
              label={field.label}
              value={formattedValue}
              iconColor={color}
              brandColor={brandColor}
              widthUnits={field.widthUnits || 3}
            />
          );
        })}
      </DashboardSection>
    </DashboardGrid>
  );
}

function CustomTabPage({ tabId, tabLabel, data, sectionVisibility = {}, clientId = 'demo-client' }) {
  console.log('[CustomTabPage] Component called with:', { tabId, tabLabel });

  const { customization, getFormSchema, FIELD_TYPES } = useCustomization();

  if (!customization) {
    console.error('[CustomTabPage] No customization context available!');
    return <div style={{ padding: '20px' }}>Error: Customization context not available</div>;
  }

  const formSchema = getFormSchema();
  const brandColor = customization.branding?.primaryColor || '#14b8a6';

  console.log('[CustomTabPage] Rendering:', { tabId, tabLabel, formSchema, data });

  const iconMap = {
    'LayoutDashboard': LayoutDashboard,
    'Users': Users,
    'MessageSquare': MessageSquare,
    'Mail': Mail,
    'FileText': FileText,
    'Heart': Heart,
    'DollarSign': DollarSign,
    'Activity': Activity,
    'Target': Target,
    'TrendingUp': TrendingUp,
    'Calendar': Calendar,
    'Clock': Clock,
    'CheckCircle': CheckCircle,
    'Star': Star,
    'Lightbulb': Lightbulb,
    'Settings': Settings,
    'BarChart2': BarChart2,
    'PieChart': PieChart,
    'Bell': Bell,
    'Shield': Shield,
    'Award': Award,
    'Briefcase': Briefcase,
    'Pill': Pill,
    'Smartphone': Smartphone,
    'HeartPulse': HeartPulse,
    'Stethoscope': Stethoscope,
    'Sparkles': Sparkles,
    'Zap': Zap,
    'Layers': Layers,
    'AlertCircle': AlertCircle,
    'Send': Send,
  };

  // Get all sections linked to this custom tab
  const linkedSections = (formSchema?.sections || [])
    .filter(s => s.linkedTabId === tabId && s.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  console.log('[CustomTabPage] Linked sections:', linkedSections);

  const rawFormData = data?.rawFormData || data || {};

  const getFieldValue = (fieldId) => {
    if (rawFormData && rawFormData[fieldId] !== undefined) {
      return rawFormData[fieldId];
    }
    return '';
  };

  const formatValue = (field, value) => {
    if (!field) return value || '';

    switch (field.fieldType) {
      case FIELD_TYPES?.DATE:
        return value ? new Date(value).toLocaleDateString() : '';
      case FIELD_TYPES?.CURRENCY:
        return typeof value === 'string' && value.startsWith('$') ? value : `$${Number(value || 0).toLocaleString()}`;
      case FIELD_TYPES?.PERCENT:
        return `${value || 0}%`;
      case FIELD_TYPES?.TOGGLE:
        return value ? 'Yes' : 'No';
      case FIELD_TYPES?.TEXT:
      case FIELD_TYPES?.TEXTAREA:
      case FIELD_TYPES?.SELECT:
        return value || '';
      case FIELD_TYPES?.NUMBER:
      default:
        if (field.prefix === '$') {
          return typeof value === 'string' && value.startsWith('$') ? value : `$${Number(value || 0).toLocaleString()}`;
        }
        if (field.suffix === '%') {
          return `${value || 0}%`;
        }
        return typeof value === 'number' ? value.toLocaleString() : (value || '0');
    }
  };

  const getIconForField = (field, index) => {
    if (field.icon && iconMap[field.icon]) {
      return iconMap[field.icon];
    }
    const metricDef = customization.metrics?.[field.metricId || field.id];
    if (metricDef?.icon && iconMap[metricDef.icon]) {
      return iconMap[metricDef.icon];
    }
    const defaultIcons = [Users, Activity, Calendar, DollarSign, Heart, TrendingUp, Target, Star];
    return defaultIcons[index % defaultIcons.length];
  };

  const getColorForField = (field, index) => {
    const metricDef = customization.metrics?.[field.metricId || field.id];
    if (metricDef?.color) {
      return metricDef.color;
    }
    const defaultColors = ['brand', 'emerald', 'amber', 'rose', 'blue', 'teal'];
    return defaultColors[index % defaultColors.length];
  };

  console.log('[CustomTabPage] About to check linkedSections.length:', linkedSections.length);

  if (linkedSections.length === 0) {
    console.log('[CustomTabPage] No linked sections, showing empty state');
    return (
      <div className="dashboard-page" style={{ background: 'white', minHeight: '100vh' }}>
        <div className="page-header">
          <h1 style={{ color: '#0f172a' }}>{tabLabel}</h1>
        </div>
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          padding: '48px 24px',
          textAlign: 'center'
        }}>
          <div style={{
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '24px'
          }}>
            <LayoutDashboard size={48} color="#94a3b8" />
          </div>
          <h3 style={{
            fontSize: '24px',
            fontWeight: '600',
            color: '#0f172a',
            marginBottom: '12px'
          }}>
            Empty Dashboard Tab
          </h3>
          <p style={{
            fontSize: '16px',
            color: '#64748b',
            maxWidth: '500px',
            lineHeight: '1.6'
          }}>
            This tab is currently empty. Add sections and fields in the Admin page to customize this dashboard view.
            <br />
            <span style={{ fontSize: '14px', color: '#94a3b8', marginTop: '8px', display: 'block' }}>
              Use the Admin page to create sections and assign them to this tab.
            </span>
          </p>
        </div>
      </div>
    );
  }

  console.log('[CustomTabPage] Rendering sections view with', linkedSections.length, 'sections');

  return (
    <div className="dashboard-page" style={{ background: 'white', minHeight: '100vh' }}>
      <div className="page-header">
        <h1 className="page-title" style={{ color: '#0f172a' }}>{tabLabel}</h1>
        <p className="page-subtitle">Custom tab with {linkedSections.length} section(s)</p>
      </div>

      {linkedSections.map((section) => {
        const sectionFields = section.fields
          ? [...section.fields]
              .filter(f => f.showOnDashboard !== false)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
          : [];

        if (sectionFields.length === 0) return null;

        return (
          <DashboardGrid key={section.id} style={{ marginBottom: '32px' }}>
            <DashboardSection
              widthUnits={section.widthUnits || 12}
              title={section.title}
              subtitle={section.subtitle}
            >
              {sectionFields.map((field, index) => {
                const Icon = getIconForField(field, index);
                const value = getFieldValue(field.id);
                const formattedValue = formatValue(field, value);
                const color = getColorForField(field, index);

                return (
                  <GridKpiCard
                    key={field.id}
                    icon={Icon}
                    label={field.label}
                    value={formattedValue}
                    iconColor={color}
                    brandColor={brandColor}
                    widthUnits={field.widthUnits || 3}
                  />
                );
              })}
            </DashboardSection>
          </DashboardGrid>
        );
      })}
      <DashboardGraphGrid clientId={clientId} pageId={tabId} brandColor={customization.branding.primaryColor} />
    </div>
  );
}

function PageSummarySection({ section, clientId, pageId }) {
  const [summaryItems, setSummaryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadSummaryItems();
  }, [section.id, clientId, pageId]);

  const loadSummaryItems = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[PageSummarySection] Loading items:', {
        clientId,
        pageId,
        sectionId: section.id,
        sectionTitle: section.title,
        linkedTabId: section.linkedTabId
      });

      console.log('[PageSummarySection] Querying page_summaries with:', {
        client_id: clientId,
        page_id: pageId,
        section_id: section.id
      });

      const { data: summary, error: summaryError } = await supabase
        .from('page_summaries')
        .select('id')
        .eq('client_id', clientId)
        .eq('page_id', pageId)
        .eq('section_id', section.id)
        .maybeSingle();

      if (summaryError) throw summaryError;

      if (!summary) {
        console.log('[PageSummarySection] No summary found for section:', section.id);

        // Debug: Query all summaries for this client to see what exists
        const { data: allSummaries } = await supabase
          .from('page_summaries')
          .select('*')
          .eq('client_id', clientId);

        console.log('[PageSummarySection] All page_summaries for client:', allSummaries);
        console.log('[PageSummarySection] Expected: page_id =', pageId, ', section_id =', section.id);

        setSummaryItems([]);
        setLoading(false);
        return;
      }

      console.log('[PageSummarySection] Found summary:', summary);

      const { data: items, error: itemsError } = await supabase
        .from('page_summary_items')
        .select('*')
        .eq('summary_id', summary.id)
        .eq('is_visible', true)
        .order('item_order', { ascending: true });

      if (itemsError) throw itemsError;

      console.log('[PageSummarySection] Loaded items count:', items?.length);
      console.log('[PageSummarySection] Loaded items:', items);
      setSummaryItems(items || []);
    } catch (err) {
      console.error('[PageSummarySection] Error loading items:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="summary-card">
        <h3 className="summary-title">{section.title}</h3>
        {section.subtitle && <p className="summary-subtitle">{section.subtitle}</p>}
        <div className="summary-grid">
          {[...Array(section.maxItems || 4)].map((_, i) => (
            <div key={i} className="summary-item" style={{ opacity: 0.5 }}>
              <span className="summary-label">Loading...</span>
              <span className="summary-value">--</span>
              <p className="summary-desc">Loading data...</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="summary-card">
        <h3 className="summary-title">{section.title}</h3>
        <p style={{ color: 'var(--red-500)', fontSize: '14px' }}>
          Error loading summary: {error}
        </p>
      </div>
    );
  }

  if (summaryItems.length === 0) {
    return null;
  }

  return (
    <div className="summary-card">
      <h3 className="summary-title">{section.title}</h3>
      {section.subtitle && <p className="summary-subtitle">{section.subtitle}</p>}
      <div className={section.layoutStyle === 'list' ? 'summary-list' : 'summary-grid'}>
        {summaryItems.map((item) => (
          <div key={item.id} className="summary-item">
            <span className="summary-label">{item.label}</span>
            <span
              className={`summary-value ${
                item.trend_direction === 'positive' ? 'positive' :
                item.trend_direction === 'negative' ? 'negative' :
                ''
              }`}
            >
              {item.metric_value}
            </span>
            <p className="summary-desc">{item.description_text}</p>
            {item.is_ai_generated && (
              <span style={{
                fontSize: '11px',
                color: 'var(--slate-400)',
                fontStyle: 'italic',
                display: 'block',
                marginTop: '4px'
              }}>
                AI Generated
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function OverviewPage({ data, sectionVisibility = {}, brandColor: propBrandColor, clientId = 'demo-client', selectedMonth = getCurrentMonthKey() }) {
  const { customization, getFormSchema, FIELD_TYPES } = useCustomization();
  const brandColor = propBrandColor || customization.branding.primaryColor;
  const formSchema = getFormSchema(clientId);
  const formattedMonthYear = formatMonthYear(selectedMonth);
  const pageId = 'overview';

  const clientIsNew = isNewClient(clientId);
  const clientIsDemo = isDemoClient(clientId);

  const allSections = formSchema.sections
    .filter(s => s.linkedTabId === pageId && s.enabled !== false && s.sectionType !== 'builtin_chart')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const coreMetricsSection = formSchema.sections.find(s => s.id === 'coreMetrics');

  const iconMap = {
    'LayoutDashboard': LayoutDashboard,
    'Users': Users,
    'MessageSquare': MessageSquare,
    'Mail': Mail,
    'FileText': FileText,
    'Heart': Heart,
    'DollarSign': DollarSign,
    'Activity': Activity,
    'Target': Target,
    'TrendingUp': TrendingUp,
    'Calendar': Calendar,
    'Clock': Clock,
    'CheckCircle': CheckCircle,
    'Star': Star,
    'Lightbulb': Lightbulb,
    'Settings': Settings,
    'BarChart2': BarChart2,
    'PieChart': PieChart,
    'Bell': Bell,
    'Shield': Shield,
    'Award': Award,
    'Briefcase': Briefcase,
    'Pill': Pill,
    'Smartphone': Smartphone,
    'HeartPulse': HeartPulse,
    'Stethoscope': Stethoscope,
    'Sparkles': Sparkles,
    'Zap': Zap,
    'Layers': Layers,
    'AlertCircle': AlertCircle,
    'Send': Send,
  };

  const rawFormData = data.rawFormData || data;

  const getFieldValue = (fieldId) => {
    if (rawFormData && rawFormData[fieldId] !== undefined) {
      return rawFormData[fieldId];
    }
    if (data.overview && data.overview[fieldId] !== undefined) {
      return data.overview[fieldId];
    }
    if (fieldId === 'revenue' && data.overview?.revenueThisMonth) {
      return data.overview.revenueThisMonth;
    }
    return 0;
  };

  const getDelta = (fieldId) => {
    const deltaMap = {
      'enrolledThisMonth': data.overview?.deltaEnrollment,
      'activePatients': data.overview?.deltaActive,
      'servicesDelivered': data.overview?.deltaServices,
      'revenue': data.overview?.deltaRevenue,
    };
    return deltaMap[fieldId] || null;
  };

  const formatValue = (field, value) => {
    if (!field) return value || '';

    // Handle different field types
    switch (field.fieldType) {
      case FIELD_TYPES?.DATE:
        return formatDateValue(value);
      case FIELD_TYPES?.CURRENCY:
        return typeof value === 'string' && value.startsWith('$') ? value : `$${Number(value || 0).toLocaleString()}`;
      case FIELD_TYPES?.PERCENT:
        return `${value || 0}%`;
      case FIELD_TYPES?.TOGGLE:
        return value ? 'Yes' : 'No';
      case FIELD_TYPES?.TEXT:
      case FIELD_TYPES?.TEXTAREA:
      case FIELD_TYPES?.SELECT:
        return value || '';
      case FIELD_TYPES?.NUMBER:
      default:
        // Check for prefix/suffix overrides
        if (field.prefix === '$') {
          return typeof value === 'string' && value.startsWith('$') ? value : `$${Number(value || 0).toLocaleString()}`;
        }
        if (field.suffix === '%') {
          return `${value || 0}%`;
        }
        // Format numbers with commas
        return typeof value === 'number' ? value.toLocaleString() : Number(value || 0).toLocaleString();
    }
  };

  const getIconForField = (field, index) => {
    if (field.icon && iconMap[field.icon]) {
      return iconMap[field.icon];
    }
    const metricDef = customization.metrics?.[field.metricId || field.id];
    if (metricDef?.icon && iconMap[metricDef.icon]) {
      return iconMap[metricDef.icon];
    }
    const defaultIcons = [Users, Activity, Calendar, DollarSign, Heart, TrendingUp, Target, Star];
    return defaultIcons[index % defaultIcons.length];
  };

  const getColorForField = (field, index) => {
    const metricDef = customization.metrics?.[field.metricId || field.id];
    if (metricDef?.color) {
      return metricDef.color;
    }
    const defaultColors = ['brand', 'emerald', 'amber', 'rose', 'blue', 'teal'];
    return defaultColors[index % defaultColors.length];
  };

  if (allSections.length === 0) {
    return (
      <div className="dashboard-page">
        <div className="page-header">
          <h1 className="page-title">Monthly Impact Overview</h1>
          <p className="page-subtitle">Key metrics and performance indicators for {formattedMonthYear}</p>
        </div>
        <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <p>No sections configured for this view. Enable sections in Dashboard Management.</p>
        </div>
      </div>
    );
  }

  const coreFields = coreMetricsSection?.fields
    ? [...coreMetricsSection.fields]
        .filter(f => f.showOnDashboard !== false && f.fieldType !== FIELD_TYPES?.DATE)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  const { isEditing } = useEditLayout();

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">Monthly Impact Overview</h1>
        <p className="page-subtitle">Key metrics and performance indicators for {formattedMonthYear}</p>
      </div>

      <WidgetLayoutProvider clientId={clientId} pageId={pageId}>
        <OverviewPageWidgets
          allSections={allSections}
          coreMetricsSection={coreMetricsSection}
          coreFields={coreFields}
          getIconForField={getIconForField}
          getFieldValue={getFieldValue}
          formatValue={formatValue}
          getDelta={getDelta}
          getColorForField={getColorForField}
          brandColor={brandColor}
          clientIsNew={clientIsNew}
          data={data}
          clientId={clientId}
          pageId={pageId}
          isEditing={isEditing}
        />
      </WidgetLayoutProvider>
      <DashboardGraphGrid clientId={clientId} pageId={pageId} brandColor={brandColor} />
    </div>
  );
}

function OverviewPageWidgets({
  allSections,
  coreMetricsSection,
  coreFields,
  getIconForField,
  getFieldValue,
  formatValue,
  getDelta,
  getColorForField,
  brandColor,
  clientIsNew,
  data,
  clientId,
  pageId,
  isEditing,
}) {
  const { initializeLayout, widgets, updateWidgetSize, reorderWidgetsByIndex, getWidgetPosition, registerSaveCallback, hasPendingChanges, canUndo, commitChanges, discardChanges, undoLastChange } = useWidgetLayout();
  const { registerLayoutCallbacks, notifyChange } = useEditLayout();

  const hasPendingRef = React.useRef(hasPendingChanges);
  hasPendingRef.current = hasPendingChanges;
  const canUndoRef = React.useRef(canUndo);
  canUndoRef.current = canUndo;
  const commitRef = React.useRef(commitChanges);
  commitRef.current = commitChanges;
  const discardRef = React.useRef(discardChanges);
  discardRef.current = discardChanges;
  const undoRef = React.useRef(undoLastChange);
  undoRef.current = undoLastChange;

  React.useEffect(() => {
    registerSaveCallback(async (layout) => {
      await savePageLayout(clientId, pageId, layout);
    });
  }, [clientId, pageId, registerSaveCallback]);

  React.useEffect(() => {
    const callbacks = {
      commitChanges: () => commitRef.current(),
      discardChanges: () => discardRef.current(),
      hasPendingChanges: () => hasPendingRef.current,
      handleUndo: () => undoRef.current(),
      canUndo: () => canUndoRef.current,
    };
    return registerLayoutCallbacks(callbacks);
  }, [registerLayoutCallbacks]);

  React.useEffect(() => {
    notifyChange();
  }, [hasPendingChanges, canUndo, notifyChange]);

  const defaultKpiFields = [
    { id: 'enrolledThisMonth', label: 'Enrolled This Month' },
    { id: 'activePatients', label: 'Active Patients' },
    { id: 'servicesDelivered', label: 'Services Delivered' },
    { id: 'revenue', label: 'Client Revenue This Month' },
  ];

  const kpiFieldsForLayout = coreFields.length > 0 ? coreFields : defaultKpiFields;

  React.useEffect(() => {
    const kpiDefinitions = kpiFieldsForLayout.map((field, index) => ({
      widgetId: `kpi-${field.id}`,
      widgetType: 'kpi-card',
      defaultWidth: 3,
      defaultHeight: 120,
    }));

    const definitions = [
      ...kpiDefinitions,
      { widgetId: 'overview-growth-chart', widgetType: 'graph-card', defaultWidth: 6, defaultHeight: 380 },
      { widgetId: 'overview-active-chart', widgetType: 'graph-card', defaultWidth: 6, defaultHeight: 380 },
      { widgetId: 'overview-summary', widgetType: 'page-summary', defaultWidth: 12, defaultHeight: 250 },
    ];

    const loadLayout = async () => {
      let savedLayout = await fetchPageLayout(clientId, pageId);

      if (savedLayout?.widgets) {
        const hasLegacySection = savedLayout.widgets.some(w => w.widgetId === 'overview-kpi-section');
        if (hasLegacySection) {
          const migratedWidgets = savedLayout.widgets.filter(w => w.widgetId !== 'overview-kpi-section');
          kpiFieldsForLayout.forEach((field, index) => {
            migratedWidgets.unshift({
              widgetId: `kpi-${field.id}`,
              widgetType: 'kpi-card',
              row: 0,
              col: (index * 3) % 12,
              width: 3,
              height: 120,
            });
          });
          savedLayout = { ...savedLayout, widgets: migratedWidgets };
          savePageLayout(clientId, pageId, savedLayout);
        }
      }

      initializeLayout(definitions, savedLayout);
    };
    loadLayout();
  }, [clientId, pageId, initializeLayout, kpiFieldsForLayout.length]);

  const handleSizeChange = (widgetId, width, height) => {
    updateWidgetSize(widgetId, width, height);
  };

  const gridRef = React.useRef(null);
  const [dragInfo, setDragInfo] = React.useState(null);
  const [ghostPos, setGhostPos] = React.useState(null);
  const [insertIdx, setInsertIdx] = React.useState(null);
  const dragInfoRef = React.useRef(null);
  const insertIdxRef = React.useRef(null);
  const rafRef = React.useRef(null);
  const lastStablePositionRef = React.useRef({ x: 0, y: 0 });
  const STABILITY_THRESHOLD = 40;

  React.useEffect(() => {
    if (!isEditing) {
      setDragInfo(null);
      setGhostPos(null);
      setInsertIdx(null);
      dragInfoRef.current = null;
      insertIdxRef.current = null;
      lastStablePositionRef.current = { x: 0, y: 0 };
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    }
  }, [isEditing]);

  const handlePointerDown = (e, widgetId, cardWidth, cardHeight) => {
    if (!isEditing) return;
    const target = e.target;
    const handleBox = target.closest('.widget-drag-handle-box');
    if (!handleBox) {
      if (target.closest('button') || target.closest('select') || target.closest('input')) {
        return;
      }
    }
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const info = {
      widgetId,
      offsetX: e.clientX - rect.left,
      offsetY: e.clientY - rect.top,
      width: rect.width,
      height: rect.height,
    };

    setDragInfo(info);
    dragInfoRef.current = info;
    setGhostPos({ x: e.clientX - info.offsetX, y: e.clientY - info.offsetY });
    lastStablePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  React.useEffect(() => {
    if (!dragInfo) return;

    let lastPointerEvent = null;

    const calculateInsertIndex = (cursorX, cursorY, container, info) => {
      const widgetElements = Array.from(container.querySelectorAll('[data-widget-id]'))
        .filter(el => el.dataset.widgetId !== info.widgetId && el.dataset.widgetId !== '__placeholder__');

      if (widgetElements.length === 0) return 0;

      const containerRect = container.getBoundingClientRect();
      const relX = cursorX - containerRect.left;
      const relY = cursorY - containerRect.top + container.scrollTop;

      const widgetPositions = widgetElements.map((widget, visualIndex) => {
        const rect = widget.getBoundingClientRect();
        const widgetRelLeft = rect.left - containerRect.left;
        const widgetRelTop = rect.top - containerRect.top + container.scrollTop;
        return {
          id: widget.dataset.widgetId,
          left: widgetRelLeft,
          top: widgetRelTop,
          right: widgetRelLeft + rect.width,
          bottom: widgetRelTop + rect.height,
          centerX: widgetRelLeft + rect.width / 2,
          centerY: widgetRelTop + rect.height / 2,
          visualIndex,
        };
      });

      let bestIdx = widgetPositions.length;
      let bestScore = Infinity;

      widgetPositions.forEach((wp, idx) => {
        const rowMatch = relY >= wp.top - 20 && relY <= wp.bottom + 20;
        const yDist = Math.abs(relY - wp.centerY);
        const xDist = Math.abs(relX - wp.centerX);

        if (rowMatch) {
          if (relX < wp.centerX) {
            const score = xDist + yDist * 0.3;
            if (score < bestScore) {
              bestScore = score;
              bestIdx = idx;
            }
          } else {
            const score = xDist + yDist * 0.3;
            if (score < bestScore) {
              bestScore = score;
              bestIdx = idx + 1;
            }
          }
        } else {
          const dist = Math.sqrt(xDist * xDist + yDist * yDist);
          if (dist < bestScore) {
            bestScore = dist;
            bestIdx = relY < wp.centerY ? idx : idx + 1;
          }
        }
      });

      return Math.max(0, Math.min(bestIdx, widgetPositions.length));
    };

    const processPointerMove = () => {
      rafRef.current = null;
      const e = lastPointerEvent;
      if (!e) return;

      const info = dragInfoRef.current;
      if (!info) return;

      setGhostPos({ x: e.clientX - info.offsetX, y: e.clientY - info.offsetY });

      const container = gridRef.current;
      if (!container) return;

      const lastPos = lastStablePositionRef.current;
      const distFromLastStable = Math.sqrt(
        Math.pow(e.clientX - lastPos.x, 2) + Math.pow(e.clientY - lastPos.y, 2)
      );

      if (distFromLastStable < STABILITY_THRESHOLD && insertIdxRef.current !== null) {
        return;
      }

      const newIdx = calculateInsertIndex(e.clientX, e.clientY, container, info);

      if (newIdx !== insertIdxRef.current) {
        setInsertIdx(newIdx);
        insertIdxRef.current = newIdx;
        lastStablePositionRef.current = { x: e.clientX, y: e.clientY };
      }
    };

    const handlePointerMove = (e) => {
      lastPointerEvent = e;
      if (!rafRef.current) {
        rafRef.current = requestAnimationFrame(processPointerMove);
      }
    };

    const handlePointerUp = () => {
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }

      const info = dragInfoRef.current;
      const currentInsertIdx = insertIdxRef.current;
      if (info && currentInsertIdx !== null) {
        reorderWidgetsByIndex(info.widgetId, currentInsertIdx);
      }

      setDragInfo(null);
      dragInfoRef.current = null;
      insertIdxRef.current = null;
      lastStablePositionRef.current = { x: 0, y: 0 };
      setGhostPos(null);
      setInsertIdx(null);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);

    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      if (rafRef.current) {
        cancelAnimationFrame(rafRef.current);
        rafRef.current = null;
      }
    };
  }, [dragInfo, reorderWidgetsByIndex]);

  const defaultKpiWidgetIds = kpiFieldsForLayout.map(f => `kpi-${f.id}`);
  const sortedWidgetIds = widgets.length > 0
    ? widgets.filter(w => w.width > 0).map(w => w.widgetId)
    : [...defaultKpiWidgetIds, 'overview-growth-chart', 'overview-active-chart', 'overview-summary'];

  const [hoveredWidget, setHoveredWidget] = React.useState(null);

  const renderWidget = (widgetId) => {
    const position = getWidgetPosition(widgetId);
    const width = position?.width ?? (widgetId.startsWith('kpi-') ? 3 : widgetId.includes('chart') ? 6 : 12);
    const height = position?.height ?? (widgetId.startsWith('kpi-') ? 120 : widgetId === 'overview-summary' ? 250 : 380);
    const isHovered = hoveredWidget === widgetId;

    const widgetStyle = {
      gridColumn: `span ${width} / span ${width}`,
      minHeight: `${height}px`,
      position: 'relative',
      border: '1px solid transparent',
      borderRadius: '12px',
      transition: 'box-shadow 0.3s ease',
      boxShadow: isEditing
        ? isHovered
          ? `0 0 0 2px ${brandColor}, 0 0 24px ${brandColor}40, 0 2px 12px ${brandColor}20`
          : `0 0 0 2px ${brandColor}50, 0 0 12px ${brandColor}20`
        : 'none',
      background: 'white',
      overflow: 'hidden',
    };

    if (widgetId.startsWith('kpi-')) {
      const fieldId = widgetId.replace('kpi-', '');
      const fieldIndex = kpiFieldsForLayout.findIndex(f => f.id === fieldId);
      const field = kpiFieldsForLayout[fieldIndex];

      if (!field) return null;

      const Icon = coreFields.length > 0
        ? getIconForField(field, fieldIndex)
        : fieldId === 'enrolledThisMonth' ? Users
        : fieldId === 'activePatients' ? Activity
        : fieldId === 'servicesDelivered' ? Calendar
        : DollarSign;

      const value = coreFields.length > 0
        ? getFieldValue(fieldId)
        : fieldId === 'enrolledThisMonth' ? data.overview.enrolledThisMonth
        : fieldId === 'activePatients' ? data.overview.activePatients
        : fieldId === 'servicesDelivered' ? data.overview.servicesDelivered
        : data.overview.revenueThisMonth;

      const formattedValue = coreFields.length > 0 ? formatValue(field, value) : value;

      const delta = coreFields.length > 0
        ? getDelta(fieldId)
        : fieldId === 'enrolledThisMonth' ? data.overview.deltaEnrollment
        : fieldId === 'activePatients' ? data.overview.deltaActive
        : fieldId === 'servicesDelivered' ? data.overview.deltaServices
        : data.overview.deltaRevenue;

      const color = coreFields.length > 0
        ? getColorForField(field, fieldIndex)
        : fieldId === 'enrolledThisMonth' ? 'brand'
        : fieldId === 'activePatients' ? 'emerald'
        : fieldId === 'servicesDelivered' ? 'amber'
        : 'rose';

      const isDragSource = dragInfo?.widgetId === widgetId;
      const kpiWidgetStyle = {
        ...widgetStyle,
        minHeight: `${height}px`,
        cursor: isEditing ? 'grab' : 'default',
      };

      const widgetClasses = [
        isEditing ? 'editing' : '',
        isDragSource ? 'dragging-source' : '',
      ].filter(Boolean).join(' ');

      return (
        <div
          key={widgetId}
          data-widget-id={widgetId}
          className={widgetClasses}
          style={kpiWidgetStyle}
          onPointerDown={(e) => handlePointerDown(e, widgetId, width, height)}
          onMouseEnter={() => setHoveredWidget(widgetId)}
          onMouseLeave={() => setHoveredWidget(null)}
        >
          {isEditing && (
            <div className="widget-drag-handle-box">
              <GripVertical size={16} />
            </div>
          )}
          <div className="kpi-card" style={{ height: '100%', margin: 0, paddingTop: isEditing ? 24 : 16 }}>
            <div className={`kpi-icon ${color === 'brand' ? '' : color}`} style={color === 'brand' && brandColor ? { background: brandColor, color: 'white' } : {}}>
              <Icon size={20} />
            </div>
            <div className="kpi-label">{field.label}</div>
            <div className="kpi-value" style={color === 'brand' && brandColor ? { color: brandColor } : {}}>
              {formattedValue}
            </div>
            {delta && (
              <span className={`kpi-delta ${delta.startsWith('+') ? 'positive' : 'negative'}`}>
                <TrendingUp size={13} />
                {delta} vs last month
              </span>
            )}
          </div>
          {isEditing && (
            <WidgetSizeButton
              currentWidth={width}
              onWidthChange={(newWidth) => handleSizeChange(widgetId, newWidth, height)}
              brandColor={brandColor}
            />
          )}
        </div>
      );
    }

    if (widgetId === 'overview-growth-chart' && !clientIsNew) {
      const isDragSource = dragInfo?.widgetId === widgetId;
      const chartWidgetStyle = {
        ...widgetStyle,
        cursor: isEditing ? 'grab' : 'default',
      };

      const widgetClasses = [
        isEditing ? 'editing' : '',
        isDragSource ? 'dragging-source' : '',
      ].filter(Boolean).join(' ');

      return (
        <div
          key={widgetId}
          data-widget-id={widgetId}
          className={widgetClasses}
          style={chartWidgetStyle}
          onPointerDown={(e) => handlePointerDown(e, widgetId, width, height)}
          onMouseEnter={() => setHoveredWidget(widgetId)}
          onMouseLeave={() => setHoveredWidget(null)}
        >
          {isEditing && (
            <div className="widget-drag-handle-box">
              <GripVertical size={16} />
            </div>
          )}
          <div className="chart-card" style={{ height: '100%', margin: 0, border: 'none', boxShadow: 'none' }}>
            <div className="chart-header" style={{ paddingTop: 16 }}>
              <div>
                <h3 className="chart-title">Customer Growth</h3>
                <p className="chart-subtitle">Monthly customer growth over time</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={height - 100}>
              <AreaChart data={data.enrollmentTrend || data.dailyEnrollmentTrend}>
                <defs>
                  <linearGradient id="enrollGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={brandColor} stopOpacity={0.2} />
                    <stop offset="95%" stopColor={brandColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="enrolledThisMonth" name="New Enrollments" stroke={brandColor} strokeWidth={3} fill="url(#enrollGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {isEditing && (
            <WidgetSizeButton
              currentWidth={width}
              onWidthChange={(newWidth) => handleSizeChange(widgetId, newWidth, height)}
              brandColor={brandColor}
            />
          )}
        </div>
      );
    }

    if (widgetId === 'overview-active-chart' && !clientIsNew) {
      const isDragSource = dragInfo?.widgetId === widgetId;
      const activeChartStyle = {
        ...widgetStyle,
        cursor: isEditing ? 'grab' : 'default',
      };

      const widgetClasses = [
        isEditing ? 'editing' : '',
        isDragSource ? 'dragging-source' : '',
      ].filter(Boolean).join(' ');

      return (
        <div
          key={widgetId}
          data-widget-id={widgetId}
          className={widgetClasses}
          style={activeChartStyle}
          onPointerDown={(e) => handlePointerDown(e, widgetId, width, height)}
          onMouseEnter={() => setHoveredWidget(widgetId)}
          onMouseLeave={() => setHoveredWidget(null)}
        >
          {isEditing && (
            <div className="widget-drag-handle-box">
              <GripVertical size={16} />
            </div>
          )}
          <div className="chart-card" style={{ height: '100%', margin: 0, border: 'none', boxShadow: 'none' }}>
            <div className="chart-header" style={{ paddingTop: 16 }}>
              <div>
                <h3 className="chart-title">Active Participants</h3>
                <p className="chart-subtitle">Total active participants over time</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={height - 100}>
              <AreaChart data={data.enrollmentTrend || data.dailyEnrollmentTrend}>
                <defs>
                  <linearGradient id="activeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                <YAxis stroke="#94a3b8" fontSize={12} domain={['dataMin - 10', 'dataMax + 10']} />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="activePatients" name="Active Participants" stroke="#10b981" strokeWidth={3} fill="url(#activeGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          {isEditing && (
            <WidgetSizeButton
              currentWidth={width}
              onWidthChange={(newWidth) => handleSizeChange(widgetId, newWidth, height)}
              brandColor={brandColor}
            />
          )}
        </div>
      );
    }

    if (widgetId === 'overview-summary' && !clientIsNew) {
      const isDragSource = dragInfo?.widgetId === widgetId;
      const summaryWidgetStyle = {
        ...widgetStyle,
        cursor: isEditing ? 'grab' : 'default',
      };

      const widgetClasses = [
        isEditing ? 'editing' : '',
        isDragSource ? 'dragging-source' : '',
      ].filter(Boolean).join(' ');

      return (
        <div
          key={widgetId}
          data-widget-id={widgetId}
          className={widgetClasses}
          style={summaryWidgetStyle}
          onPointerDown={(e) => handlePointerDown(e, widgetId, width, height)}
          onMouseEnter={() => setHoveredWidget(widgetId)}
          onMouseLeave={() => setHoveredWidget(null)}
        >
          {isEditing && (
            <div className="widget-drag-handle-box">
              <GripVertical size={16} />
            </div>
          )}
          <div className="summary-card" style={{ height: '100%', margin: 0, border: 'none', boxShadow: 'none', paddingTop: 24 }}>
            <h3 className="summary-title">Monthly Progress Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Customer Growth</span>
                <span className={`summary-value ${data.overview.deltaEnrollment?.startsWith('+') ? 'positive' : 'negative'}`}>{data.overview.deltaEnrollment || 'N/A'}</span>
                <p className="summary-desc">{data.overview.enrolledThisMonth} new patients enrolled this month, up from {data.previousMonth.enrolledThisMonth} last month.</p>
              </div>
              <div className="summary-item">
                <span className="summary-label">Patient Retention</span>
                <span className={`summary-value ${data.overview.deltaActive?.startsWith('+') ? 'positive' : 'negative'}`}>{data.overview.deltaActive || 'N/A'}</span>
                <p className="summary-desc">Active patient base grew from {data.previousMonth.activePatients} to {data.overview.activePatients}.</p>
              </div>
              <div className="summary-item">
                <span className="summary-label">Service Volume</span>
                <span className={`summary-value ${data.overview.deltaServices?.startsWith('+') ? 'positive' : 'negative'}`}>{data.overview.deltaServices || 'N/A'}</span>
                <p className="summary-desc">{data.overview.servicesDelivered} services delivered, up from {data.previousMonth.servicesDelivered} last month.</p>
              </div>
              <div className="summary-item">
                <span className="summary-label">Revenue Performance</span>
                <span className={`summary-value ${data.overview.deltaRevenue?.startsWith('+') ? 'positive' : 'negative'}`}>{data.overview.deltaRevenue || 'N/A'}</span>
                <p className="summary-desc">Client revenue: {data.overview.revenueThisMonth}, compared to ${data.previousMonth.revenue.toLocaleString()} last month.</p>
              </div>
            </div>
          </div>
          {isEditing && (
            <WidgetSizeButton
              currentWidth={width}
              onWidthChange={(newWidth) => handleSizeChange(widgetId, newWidth, height)}
              brandColor={brandColor}
            />
          )}
        </div>
      );
    }

    return null;
  };

  const displayWidgetIds = React.useMemo(() => {
    if (!dragInfo || insertIdx === null) return sortedWidgetIds;
    const filtered = sortedWidgetIds.filter(id => id !== dragInfo.widgetId);
    const result = [...filtered];
    const clampedIdx = Math.min(insertIdx, result.length);
    result.splice(clampedIdx, 0, '__placeholder__');
    return result;
  }, [sortedWidgetIds, dragInfo, insertIdx]);

  const draggedWidgetData = React.useMemo(() => {
    if (!dragInfo) return null;
    const position = getWidgetPosition(dragInfo.widgetId);
    return { widgetId: dragInfo.widgetId, position };
  }, [dragInfo, getWidgetPosition]);

  return (
    <>
      <div ref={gridRef} className="dashboard-sections" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignItems: 'start' }}>
        {displayWidgetIds.map(widgetId => {
          if (widgetId === '__placeholder__') {
            const placeholderWidth = draggedWidgetData?.position?.width || 6;
            return (
              <DropPlaceholder
                key="__placeholder__"
                gridWidth={placeholderWidth}
                minHeight={draggedWidgetData?.position?.height || 120}
                brandColor={brandColor}
              />
            );
          }
          return renderWidget(widgetId);
        })}

      {allSections.filter(s => s.id !== 'coreMetrics').map(section => {
        if (section.sectionType === 'page_summary') {
          return (
            <div key={section.id} style={{ gridColumn: 'span 12 / span 12' }}>
              <PageSummarySection
                section={section}
                clientId={clientId}
                pageId={pageId}
              />
            </div>
          );
        }

        return (
          <div key={section.id} style={{ gridColumn: 'span 12 / span 12' }}>
            <GenericSectionRenderer
              section={section}
              data={data}
              brandColor={brandColor}
              clientId={clientId}
            />
          </div>
        );
      })}
      </div>

      {dragInfo && ghostPos && (
        <DragGhostOverlay dragInfo={dragInfo} ghostPos={ghostPos}>
          <div style={{ background: 'white', borderRadius: '12px', height: '100%', width: '100%', boxShadow: '0 8px 32px rgba(0,0,0,0.15)' }}>
            {renderWidget(dragInfo.widgetId)}
          </div>
        </DragGhostOverlay>
      )}
    </>
  );
}

function EnrollmentPage({ data, sectionVisibility = {}, brandColor: propBrandColor, clientId = 'demo-client' }) {
  const { customization, getFormSchema } = useCustomization();
  const brandColor = propBrandColor || customization.branding.primaryColor;
  const formSchema = getFormSchema(clientId);
  const pageId = 'enrollment';

  const clientIsNew = isNewClient(clientId);

  const funnel = data.funnel;
  const campaign = data.campaign;
  const rawFormData = data.rawFormData || data;

  const allSections = formSchema.sections
    .filter(s => s.linkedTabId === pageId && s.enabled !== false && s.sectionType !== 'builtin_chart')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const enrollmentFunnelSection = formSchema.sections.find(s => s.id === 'enrollmentFunnel');
  const smsCampaignSection = formSchema.sections.find(s => s.id === 'smsCampaign');
  const emailCampaignSection = formSchema.sections.find(s => s.id === 'emailCampaign');
  const mailerCampaignSection = formSchema.sections.find(s => s.id === 'mailerCampaign');
  const campaignSectionIds = new Set(['smsCampaign', 'emailCampaign', 'mailerCampaign']);
  
  // Build funnel steps from schema
  const funnelFields = enrollmentFunnelSection?.fields
    ? [...enrollmentFunnelSection.fields]
        .filter(f => f.showOnDashboard !== false && f.fieldType !== 'date')
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  // Get campaign fields from schema
  const smsFields = smsCampaignSection?.fields
    ? [...smsCampaignSection.fields]
        .filter(f => f.showOnDashboard !== false && f.fieldType !== 'date')
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const emailFields = emailCampaignSection?.fields
    ? [...emailCampaignSection.fields]
        .filter(f => f.showOnDashboard !== false && f.fieldType !== 'date')
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const mailerFields = mailerCampaignSection?.fields
    ? [...mailerCampaignSection.fields]
        .filter(f => f.showOnDashboard !== false && f.fieldType !== 'date')
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  
  // Helper to get value - check multiple sources
  const getFieldValue = (fieldId) => {
    if (rawFormData && rawFormData[fieldId] !== undefined) {
      return rawFormData[fieldId];
    }
    if (funnel && funnel[fieldId] !== undefined) {
      return funnel[fieldId];
    }
    return 0;
  };
  
  const steps = funnelFields.length > 0 
    ? funnelFields.map((field, index) => {
        const value = getFieldValue(field.id);
        const firstValue = getFieldValue(funnelFields[0].id) || 1;
        return {
          label: field.label,
          value,
          rate: index === 0 ? '100%' : (firstValue ? `${Math.round((value / firstValue) * 100)}%` : '0%'),
        };
      })
    : [
        { label: "Contacted", value: funnel.contacted, rate: "100%" },
        { label: "Enrolled", value: funnel.enrolled, rate: funnel.contacted ? `${Math.round((funnel.enrolled / funnel.contacted) * 100)}%` : '0%' },
      ];
  
  // Helper to render campaign card with dynamic fields
  const renderCampaignCard = (section, fields, icon, iconClass, fallbackStats) => {
    if (!fields || fields.length === 0) {
      // Fallback to hardcoded stats
      return (
        <>
          {fallbackStats.map((stat, i) => (
            <div key={i} className="campaign-stat">
              <span>{stat.label}</span>
              <span>{stat.value}</span>
            </div>
          ))}
        </>
      );
    }
    
    return fields.map(field => (
      <div key={field.id} className="campaign-stat">
        <span>{field.label}</span>
        <span>{getFieldValue(field.id)}</span>
      </div>
    ));
  };
  
  const smsCampaignSchemaEnabled = smsCampaignSection?.enabled === true;
  const emailCampaignSchemaEnabled = emailCampaignSection?.enabled === true;
  const mailerCampaignSchemaEnabled = mailerCampaignSection?.enabled === true;

  const hasCampaignSection = smsCampaignSchemaEnabled || emailCampaignSchemaEnabled || mailerCampaignSchemaEnabled;

  if (allSections.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Customers & Engagement</h1>
          <p className="page-subtitle">Customer acquisition funnel and conversion metrics</p>
        </div>
        <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Users size={48} style={{ color: '#94a3b8' }} />
          </div>
          <h3 style={{ color: '#64748b', marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>No Customer Sections Configured</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Add customer metrics and campaign tracking through Data Management to see your engagement data here.
          </p>
        </div>
      </div>
    );
  }

  const campaignRendered = { current: false };

  const renderCampaignBlock = () => {
    if (!hasCampaignSection) return null;
    return (
      <div className="chart-card" key="campaign-block">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Campaign Performance</h3>
            <p className="chart-subtitle">Customer acquisition campaign success by channel</p>
          </div>
        </div>
        <div className="campaign-grid">
          {smsCampaignSchemaEnabled && smsCampaignSection && (
            <div className="campaign-card">
              <div className="campaign-icon sms">📱</div>
              <div className="campaign-type">{smsCampaignSection?.title || 'SMS Campaign'}</div>
              {renderCampaignCard(smsCampaignSection, smsFields, '📱', 'sms', [
                { label: 'Sent', value: campaign.sms.sent },
                { label: 'Consented', value: campaign.sms.consented }
              ])}
            </div>
          )}
          {emailCampaignSchemaEnabled && emailCampaignSection && (
            <div className="campaign-card">
              <div className="campaign-icon email">📧</div>
              <div className="campaign-type">{emailCampaignSection?.title || 'Email Campaign'}</div>
              {renderCampaignCard(emailCampaignSection, emailFields, '📧', 'email', [
                { label: 'Sent', value: campaign.email.sent },
                { label: 'Consented', value: campaign.email.consented }
              ])}
            </div>
          )}
          {mailerCampaignSchemaEnabled && mailerCampaignSection && (
            <div className="campaign-card">
              <div className="campaign-icon mailer">✉️</div>
              <div className="campaign-type">{mailerCampaignSection?.title || 'Mailer Campaign'}</div>
              {renderCampaignCard(mailerCampaignSection, mailerFields, '✉️', 'mailer', [
                { label: 'Sent', value: campaign.mailers.sent },
                { label: 'Consented', value: campaign.mailers.consented }
              ])}
            </div>
          )}
        </div>
        <div className="campaign-totals">
          <div className="campaign-total-item">
            <div className="campaign-total-value">{campaign.totalConsented}</div>
            <div className="campaign-total-label">Total Consented via Campaign</div>
          </div>
          <div className="campaign-total-item">
            <div className="campaign-total-value">{campaign.daysIntoCampaign}</div>
            <div className="campaign-total-label">Days Into Campaign</div>
          </div>
          <div className="campaign-total-item">
            <div className="campaign-total-value">{campaign.currentlyInOutreach}</div>
            <div className="campaign-total-label">Currently in Outreach</div>
          </div>
        </div>
      </div>
    );
  };

  const { isEditing } = useEditLayout();

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Customers & Engagement</h1>
        <p className="page-subtitle">Customer acquisition funnel and conversion metrics</p>
      </div>

      <WidgetLayoutProvider clientId={clientId} pageId={pageId}>
        <EnrollmentPageWidgets
          allSections={allSections}
          enrollmentFunnelSection={enrollmentFunnelSection}
          steps={steps}
          hasCampaignSection={hasCampaignSection}
          campaignSectionIds={campaignSectionIds}
          renderCampaignBlock={renderCampaignBlock}
          brandColor={brandColor}
          clientId={clientId}
          pageId={pageId}
          isEditing={isEditing}
          data={data}
        />
      </WidgetLayoutProvider>
      <DashboardGraphGrid clientId={clientId} pageId={pageId} brandColor={brandColor} />
    </div>
  );
}

function EnrollmentPageWidgets({
  allSections,
  enrollmentFunnelSection,
  steps,
  hasCampaignSection,
  campaignSectionIds,
  renderCampaignBlock,
  brandColor,
  clientId,
  pageId,
  isEditing,
  data,
}) {
  const { initializeLayout, widgets, updateWidgetSize, reorderWidgets, getWidgetPosition, registerSaveCallback, hasPendingChanges, canUndo, commitChanges, discardChanges, undoLastChange } = useWidgetLayout();
  const { registerLayoutCallbacks, notifyChange } = useEditLayout();

  const hasPendingRef = React.useRef(hasPendingChanges);
  hasPendingRef.current = hasPendingChanges;
  const canUndoRef = React.useRef(canUndo);
  canUndoRef.current = canUndo;
  const commitRef = React.useRef(commitChanges);
  commitRef.current = commitChanges;
  const discardRef = React.useRef(discardChanges);
  discardRef.current = discardChanges;
  const undoRef = React.useRef(undoLastChange);
  undoRef.current = undoLastChange;

  React.useEffect(() => {
    registerSaveCallback(async (layout) => {
      await savePageLayout(clientId, pageId, layout);
    });
  }, [clientId, pageId, registerSaveCallback]);

  React.useEffect(() => {
    const callbacks = {
      commitChanges: () => commitRef.current(),
      discardChanges: () => discardRef.current(),
      hasPendingChanges: () => hasPendingRef.current,
      handleUndo: () => undoRef.current(),
      canUndo: () => canUndoRef.current,
    };
    return registerLayoutCallbacks(callbacks);
  }, [registerLayoutCallbacks]);

  React.useEffect(() => {
    notifyChange();
  }, [hasPendingChanges, canUndo, notifyChange]);

  React.useEffect(() => {
    const definitions = [
      { widgetId: 'enrollment-funnel', widgetType: 'funnel-chart', defaultWidth: 12, defaultHeight: 400 },
      { widgetId: 'enrollment-campaign', widgetType: 'campaign-section', defaultWidth: 12, defaultHeight: 400 },
    ];

    const loadLayout = async () => {
      const savedLayout = await fetchPageLayout(clientId, pageId);
      initializeLayout(definitions, savedLayout);
    };
    loadLayout();
  }, [clientId, pageId, initializeLayout]);

  const handleDragStart = (e, widgetId) => {
    e.dataTransfer.setData('widgetId', widgetId);
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.5';
    }
  };

  const handleDragEnd = (e) => {
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1';
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, targetId) => {
    e.preventDefault();
    const draggedId = e.dataTransfer.getData('widgetId');
    if (draggedId && draggedId !== targetId) {
      reorderWidgets(draggedId, targetId);
    }
  };

  const sortedWidgetIds = widgets.length > 0
    ? widgets.filter(w => w.width > 0).map(w => w.widgetId)
    : ['enrollment-funnel', 'enrollment-campaign'];

  const [hoveredWidget, setHoveredWidget] = React.useState(null);

  const renderWidget = (widgetId) => {
    const position = getWidgetPosition(widgetId);
    const width = position?.width ?? 6;
    const height = position?.height ?? 400;
    const isHovered = hoveredWidget === widgetId;

    const widgetStyle = {
      gridColumn: `span ${width} / span ${width}`,
      minHeight: `${height}px`,
      position: 'relative',
      border: '1px solid transparent',
      borderRadius: '12px',
      transition: 'box-shadow 0.3s ease',
      boxShadow: isEditing
        ? isHovered
          ? `0 0 0 2px ${brandColor}, 0 0 24px ${brandColor}40, 0 2px 12px ${brandColor}20`
          : `0 0 0 2px ${brandColor}50, 0 0 12px ${brandColor}20`
        : 'none',
      background: 'white',
      overflow: 'hidden',
    };

    if (widgetId === 'enrollment-funnel') {
      return (
        <div
          key={widgetId}
          className={isEditing ? 'editing' : ''}
          style={widgetStyle}
          draggable={isEditing}
          onDragStart={(e) => handleDragStart(e, widgetId)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, widgetId)}
          onMouseEnter={() => setHoveredWidget(widgetId)}
          onMouseLeave={() => setHoveredWidget(null)}
        >
          <div className="widget-drag-handle-box">
            <GripVertical size={16} />
          </div>
          <div className="chart-card" style={{ height: '100%', margin: 0, border: 'none', boxShadow: 'none' }}>
            <div className="chart-header" style={{ paddingTop: 16 }}>
              <div>
                <h3 className="chart-title">{enrollmentFunnelSection?.title || 'Customer Funnel'}</h3>
                <p className="chart-subtitle">{enrollmentFunnelSection?.subtitle || 'Conversion rates at each stage'}</p>
              </div>
            </div>
            <div className="funnel-container" style={{ overflow: 'auto', maxHeight: height - 100 }}>
              {steps.map((step, i) => (
                <div key={i} className="funnel-step">
                  <span className="funnel-label">{step.label}</span>
                  <div className="funnel-bar-container">
                    <div className="funnel-bar" style={{ width: `${(step.value / (steps[0]?.value || 1)) * 100}%` }} />
                  </div>
                  <span className="funnel-value">{step.value}</span>
                  <span className="funnel-rate">{step.rate}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (widgetId === 'enrollment-campaign' && hasCampaignSection) {
      return (
        <div
          key={widgetId}
          className={isEditing ? 'editing' : ''}
          style={widgetStyle}
          draggable={isEditing}
          onDragStart={(e) => handleDragStart(e, widgetId)}
          onDragEnd={handleDragEnd}
          onDragOver={handleDragOver}
          onDrop={(e) => handleDrop(e, widgetId)}
          onMouseEnter={() => setHoveredWidget(widgetId)}
          onMouseLeave={() => setHoveredWidget(null)}
        >
          <div className="widget-drag-handle-box">
            <GripVertical size={16} />
          </div>
          <div style={{ height: '100%', overflow: 'auto' }}>
            {renderCampaignBlock()}
          </div>
        </div>
      );
    }

    return null;
  };

  const campaignRendered = { current: false };

  return (
    <div className="dashboard-sections" style={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: '20px', alignItems: 'start' }}>
      {sortedWidgetIds.map(widgetId => renderWidget(widgetId))}

      {allSections.filter(s => s.id !== 'enrollmentFunnel' && !campaignSectionIds.has(s.id)).map(section => {
        if (section.sectionType === 'page_summary') {
          return (
            <div key={section.id} style={{ gridColumn: 'span 12 / span 12' }}>
              <PageSummarySection
                section={section}
                clientId={clientId}
                pageId={pageId}
              />
            </div>
          );
        }

        return (
          <div key={section.id} style={{ gridColumn: 'span 12 / span 12' }}>
            <GenericSectionRenderer
              section={section}
              data={data}
              brandColor={brandColor}
              clientId={clientId}
            />
          </div>
        );
      })}
    </div>
  );
}

function FinancialPage({ data, sectionVisibility = {}, brandColor: propBrandColor, clientId = 'demo-client' }) {
  const { customization, getFormSchema } = useCustomization();
  const brandColor = propBrandColor || customization.branding.primaryColor;
  const formSchema = getFormSchema(clientId);
  const pageId = 'financial';

  const allSections = formSchema.sections
    .filter(s => s.linkedTabId === pageId && s.enabled !== false && s.sectionType !== 'builtin_chart')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const financialSection = formSchema.sections.find(s => s.id === 'financialMetrics');
  const hasFinancialSection = financialSection?.enabled === true;

  if (allSections.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Financial & ROI</h1>
          <p className="page-subtitle">Revenue trends and financial performance</p>
        </div>
        <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <DollarSign size={48} style={{ color: '#94a3b8' }} />
          </div>
          <h3 style={{ color: '#64748b', marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>No Financial Sections Configured</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Add financial metrics and revenue tracking through Data Management to see your financial data here.
          </p>
        </div>
      </div>
    );
  }

  const ytdRevenue = data.revenueSeries?.reduce((sum, r) => sum + r.amount, 0) || 0;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Financial & ROI</h1>
        <p className="page-subtitle">Revenue trends and financial performance</p>
      </div>

      <div className="dashboard-sections">
      {allSections.map(section => {
        if (section.id === 'financialMetrics') {
          if (!hasFinancialSection) return null;
          return (
            <React.Fragment key={section.id}>
              <DashboardGrid>
                <GridKpiCard
                  icon={DollarSign}
                  label="Client Revenue This Month"
                  value={data.overview?.revenueThisMonth || '$0'}
                  delta={data.overview?.deltaRevenue}
                  iconColor="brand"
                  brandColor={brandColor}
                  widthUnits={6}
                />
                <GridKpiCard
                  icon={TrendingUp}
                  label="Year-to-Date Revenue"
                  value={`$${ytdRevenue.toLocaleString()}`}
                  iconColor="emerald"
                  widthUnits={6}
                />
              </DashboardGrid>
              <div className="chart-card">
                <div className="chart-header">
                  <div>
                    <h3 className="chart-title">Revenue Trend</h3>
                    <p className="chart-subtitle">Month-over-month revenue performance</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.revenueSeries || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
                    <Bar dataKey="amount" fill={brandColor} radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </React.Fragment>
          );
        }

        if (section.sectionType === 'page_summary') {
          return (
            <PageSummarySection
              key={section.id}
              section={section}
              clientId={clientId}
              pageId={pageId}
            />
          );
        }

        return (
          <GenericSectionRenderer
            key={section.id}
            section={section}
            data={data}
            brandColor={brandColor}
            clientId={clientId}
          />
        );
      })}
      </div>
      <DashboardGraphGrid clientId={clientId} pageId={pageId} brandColor={brandColor} />
    </div>
  );
}

function OutcomesPage({ data, sectionVisibility = {}, clientId = 'demo-client' }) {
  const { customization, getFormSchema, FIELD_TYPES } = useCustomization();
  const brandColor = customization.branding.primaryColor;
  const outcomes = data.outcomes;
  const formSchema = getFormSchema(clientId);
  const pageId = 'outcomes';

  const allSections = formSchema.sections
    .filter(s => s.linkedTabId === pageId && s.enabled !== false && s.sectionType !== 'builtin_chart')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const outcomesSection = formSchema.sections.find(s => s.id === 'patientOutcomes');

  const formatValue = (field, value) => {
    if (!field) return value || '';
    if (field.id === 'avgResponseHours') return `${value || 0}h`;
    switch (field.fieldType) {
      case FIELD_TYPES?.DATE:
        return formatDateValue(value);
      case FIELD_TYPES?.CURRENCY:
        return `$${Number(value || 0).toLocaleString()}`;
      case FIELD_TYPES?.PERCENT:
        return `${value || 0}%`;
      case FIELD_TYPES?.TOGGLE:
        return value ? 'Yes' : 'No';
      case FIELD_TYPES?.TEXT:
      case FIELD_TYPES?.TEXTAREA:
      case FIELD_TYPES?.SELECT:
        return value || '';
      case FIELD_TYPES?.NUMBER:
      default:
        if (field.prefix === '$') return `$${Number(value || 0).toLocaleString()}`;
        if (field.suffix === '%') return `${value || 0}%`;
        return typeof value === 'number' ? value.toLocaleString() : (value || 0);
    }
  };

  const rawFormData = data.rawFormData || data;

  const getFieldValue = (fieldId) => {
    if (rawFormData && rawFormData[fieldId] !== undefined) return rawFormData[fieldId];
    if (outcomes && outcomes[fieldId] !== undefined) return outcomes[fieldId];
    const legacyMap = { 'avgResponseHours': outcomes?.avgResponse };
    return legacyMap[fieldId] || 0;
  };

  if (allSections.length === 0) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Patient Outcomes</h1>
          <p className="page-subtitle">Clinical impact and health improvement metrics</p>
        </div>
        <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <Heart size={48} style={{ color: '#94a3b8' }} />
          </div>
          <h3 style={{ color: '#64748b', marginBottom: '8px', fontSize: '18px', fontWeight: '600' }}>No Outcomes Sections Configured</h3>
          <p style={{ color: '#94a3b8', fontSize: '14px', maxWidth: '400px', margin: '0 auto' }}>
            Add outcome metrics and health tracking through Data Management to see your outcomes data here.
          </p>
        </div>
      </div>
    );
  }

  const outcomesFields = outcomesSection?.fields
    ? [...outcomesSection.fields]
        .filter(f => f.showOnDashboard !== false && f.fieldType !== FIELD_TYPES?.DATE)
        .sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{outcomesSection?.title || 'Patient Outcomes'}</h1>
        <p className="page-subtitle">{outcomesSection?.subtitle || 'Clinical impact and health improvement metrics'}</p>
      </div>

      <div className="dashboard-sections">
      {allSections.map(section => {
        if (section.id === 'patientOutcomes' && outcomesSection) {
          return (
            <DashboardGrid key={section.id}>
              <DashboardSection widthUnits={outcomesSection?.widthUnits || 12}>
                {outcomesFields.length > 0 ? (
                  outcomesFields.map((field) => {
                    const value = getFieldValue(field.id);
                    const formattedValue = formatValue(field, value);
                    return (
                      <div
                        key={field.id}
                        className="grid-item outcome-card"
                        style={getGridItemStyle(field.widthUnits || 3)}
                        data-width={field.widthUnits || 3}
                      >
                        <div className="outcome-value" style={{ color: brandColor }}>{formattedValue}</div>
                        <div className="outcome-label">{field.label}</div>
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="grid-item outcome-card" style={getGridItemStyle(3)} data-width={3}>
                      <div className="outcome-value" style={{ color: brandColor }}>{outcomes.bpImproved}%</div>
                      <div className="outcome-label">BP Improved</div>
                    </div>
                    <div className="grid-item outcome-card" style={getGridItemStyle(3)} data-width={3}>
                      <div className="outcome-value" style={{ color: brandColor }}>{outcomes.adherenceRate}%</div>
                      <div className="outcome-label">Medication Adherence</div>
                    </div>
                    <div className="grid-item outcome-card" style={getGridItemStyle(3)} data-width={3}>
                      <div className="outcome-value" style={{ color: brandColor }}>{outcomes.readmissionReduction}%</div>
                      <div className="outcome-label">Readmission Reduction</div>
                    </div>
                    <div className="grid-item outcome-card" style={getGridItemStyle(3)} data-width={3}>
                      <div className="outcome-value" style={{ color: brandColor }}>{outcomes.avgResponse}</div>
                      <div className="outcome-label">Avg Response Time</div>
                    </div>
                  </>
                )}
              </DashboardSection>
            </DashboardGrid>
          );
        }

        if (section.sectionType === 'page_summary') {
          return (
            <PageSummarySection
              key={section.id}
              section={section}
              clientId={clientId}
              pageId={pageId}
            />
          );
        }

        return (
          <GenericSectionRenderer
            key={section.id}
            section={section}
            data={data}
            brandColor={brandColor}
            clientId={clientId}
          />
        );
      })}
      </div>
      <DashboardGraphGrid clientId={clientId} pageId={pageId} brandColor={brandColor} />
    </div>
  );
}

function StoriesPage({ stories, sectionVisibility = {}, healthData = null, clientId = 'demo-client' }) {
  const { customization, getFormSchema } = useCustomization();
  const brandColor = customization.branding.primaryColor;
  const formSchema = getFormSchema();
  const pageId = 'stories';

  const knownSectionIds = new Set(['storiesMetadata']);

  const pageSummarySections = formSchema.sections
    .filter(s => s.sectionType === 'page_summary' && s.linkedTabId === pageId && s.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const genericSections = formSchema.sections
    .filter(s => s.linkedTabId === pageId && s.enabled !== false && !knownSectionIds.has(s.id)
      && s.sectionType !== 'page_summary' && s.sectionType !== 'builtin_chart')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const storiesMetadataSection = formSchema.sections.find(s => s.id === 'storiesMetadata');
  const storiesSchemaEnabled = storiesMetadataSection?.enabled === true;

  const visibility = {
    stories: storiesSchemaEnabled,
  };

  if (!visibility.stories) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Stories & Feedback</h1>
          <p className="page-subtitle">Patient success stories and testimonials</p>
        </div>
        <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <p>No sections configured for this view. Enable sections in Dashboard Management.</p>
        </div>
      </div>
    );
  }

  console.log('[StoriesPage] Rendering with stories:', stories.length);

  const visibleStories = stories.filter(story => story.is_visible !== false);
  const hasWinsAndAchievements = healthData?.show_in_success_stories && healthData?.success_wins?.trim();
  const hasContent = visibleStories.length > 0 || hasWinsAndAchievements;

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Stories & Feedback</h1>
        <p className="page-subtitle">Patient success stories and testimonials</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {hasWinsAndAchievements && (
          <div className="chart-card">
            <h3 style={{ fontSize: '18px', fontWeight: 600, color: '#1e293b', marginBottom: '16px' }}>
              Wins & Achievements
            </h3>
            <div style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#475569',
              whiteSpace: 'pre-wrap'
            }}>
              {healthData.success_wins}
            </div>
          </div>
        )}

        {visibleStories.length > 0 ? visibleStories.map((story, i) => (
          <div key={story.id || i} style={{
            padding: '24px',
            background: 'white',
            borderRadius: '12px',
            borderLeft: '4px solid #06b6d4',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 600, color: '#0f172a', marginBottom: '12px' }}>
              {story.context || story.condition || 'Success Story'}
            </h3>
            <p style={{
              fontSize: '15px',
              lineHeight: '1.7',
              color: '#475569',
              fontStyle: 'italic',
              marginBottom: '12px'
            }}>
              "{story.quote || 'No quote provided'}"
            </p>
            <p style={{
              fontSize: '13px',
              color: '#94a3b8',
              fontWeight: 500
            }}>
              — {story.initials || story.patientInitials || story.patientType || 'Anonymous'}
            </p>
          </div>
        )) : !hasWinsAndAchievements ? (
          <div className="notes-card">
            <p>No visible stories yet. Mark stories as visible in Success Planning.</p>
          </div>
        ) : null}
      </div>

      {pageSummarySections.map(section => (
        <PageSummarySection
          key={section.id}
          section={section}
          clientId={clientId}
          pageId={pageId}
        />
      ))}

      {genericSections.map(section => (
        <GenericSectionRenderer
          key={section.id}
          section={section}
          data={{}}
          brandColor={brandColor}
          clientId={clientId}
        />
      ))}
      <DashboardGraphGrid clientId={clientId} pageId={pageId} brandColor={brandColor} />
    </div>
  );
}

function OpportunitiesPage({ opportunities, sectionVisibility = {}, clientId = 'demo-client' }) {
  const { customization, getFormSchema } = useCustomization();
  const brandColor = customization.branding.primaryColor;
  const formSchema = getFormSchema();
  const pageId = 'opportunities';

  const knownSectionIds = new Set(['opportunitiesMetadata']);

  const pageSummarySections = formSchema.sections
    .filter(s => s.sectionType === 'page_summary' && s.linkedTabId === pageId && s.enabled !== false)
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const genericSections = formSchema.sections
    .filter(s => s.linkedTabId === pageId && s.enabled !== false && !knownSectionIds.has(s.id)
      && s.sectionType !== 'page_summary' && s.sectionType !== 'builtin_chart')
    .sort((a, b) => (a.order || 0) - (b.order || 0));

  const opportunitiesMetadataSection = formSchema.sections.find(s => s.id === 'opportunitiesMetadata');
  const opportunitiesSchemaEnabled = opportunitiesMetadataSection?.enabled === true;

  const visibility = {
    opportunities: opportunitiesSchemaEnabled,
  };
  
  if (!visibility.opportunities) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Opportunities & Next Steps</h1>
          <p className="page-subtitle">Growth initiatives and improvement areas</p>
        </div>
        <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <p>No sections configured for this view. Enable sections in Dashboard Management.</p>
        </div>
      </div>
    );
  }
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Opportunities & Next Steps</h1>
        <p className="page-subtitle">Growth initiatives and improvement areas</p>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Priority Initiatives</h3>
            <p className="chart-subtitle">Recommended actions for next month</p>
          </div>
        </div>
        <div className="opportunity-list">
          {opportunities.length > 0 ? opportunities.map((opp, i) => (
            <div key={opp.id || i} className="opportunity-item">
              <div className="opportunity-number">{i + 1}</div>
              <div className="opportunity-content">
                <h4>{opp.title || 'Untitled'}</h4>
                <p>{opp.description || 'No description provided'}</p>
              </div>
            </div>
          )) : (
            <div className="notes-card" style={{ margin: 0 }}>
              <p>No opportunities added yet. Add opportunities in Dashboard Management.</p>
            </div>
          )}
        </div>
      </div>

      {pageSummarySections.map(section => (
        <PageSummarySection
          key={section.id}
          section={section}
          clientId={clientId}
          pageId={pageId}
        />
      ))}

      {genericSections.map(section => (
        <GenericSectionRenderer
          key={section.id}
          section={section}
          data={{}}
          brandColor={brandColor}
          clientId={clientId}
        />
      ))}
      <DashboardGraphGrid clientId={clientId} pageId={pageId} brandColor={brandColor} />
    </div>
  );
}

// ============================================================
// MONTHLY INITIATIVES PAGE (DATABASE-DRIVEN)
// ============================================================

function MonthlyInitiativesPage({ clientId }) {
  const { customization } = useCustomization();
  const strategicPrioritiesSync = useStrategicPrioritiesSync(clientId);

  // Filter to only show visible priorities
  const visiblePriorities = strategicPrioritiesSync.priorities.filter(p => p.is_visible);

  console.log('=== MONTHLY INITIATIVES PAGE DEBUG ===');
  console.log('[MonthlyInitiativesPage] Client ID:', clientId);
  console.log('[MonthlyInitiativesPage] Total priorities:', strategicPrioritiesSync.priorities.length);
  console.log('[MonthlyInitiativesPage] Visible priorities:', visiblePriorities.length);
  console.log('[MonthlyInitiativesPage] Priority details:', strategicPrioritiesSync.priorities.map(p => ({
    id: p.id,
    title: p.title,
    is_visible: p.is_visible
  })));

  const iconColors = {
    Lightbulb: '#f59e0b',
    Pill: '#ef4444',
    Smartphone: '#3b82f6',
    HeartPulse: '#ec4899',
    Stethoscope: '#06b6d4',
    Users: '#8b5cf6',
    Activity: '#10b981',
    Calendar: '#6366f1',
    ClipboardList: '#14b8a6',
    Target: '#f97316',
    TrendingUp: '#84cc16',
    Shield: '#6366f1',
    Zap: '#eab308',
    Sparkles: '#a855f7',
    House: '#ea580c',
  };

  if (strategicPrioritiesSync.isLoading) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Strategic Priorities</h1>
          <p className="page-subtitle">Key initiatives and strategic focus areas for this period</p>
        </div>
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          Loading strategic priorities...
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Strategic Priorities</h1>
        <p className="page-subtitle">Key initiatives and strategic focus areas for this period</p>
      </div>

      {visiblePriorities.length === 0 ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#64748b' }}>
          No strategic priorities are currently visible. Please check back later.
        </div>
      ) : (
        <div className="initiatives-grid">
          {visiblePriorities.map(priority => {
            const iconName = priority.icon || 'Lightbulb';
            const IconComponent = FORM_ICON_MAP[iconName] || Lightbulb;
            const iconColor = iconColors[iconName] || '#f59e0b';

            return (
              <div key={priority.id} className="initiative-card" style={{ '--program-color': iconColor }}>
                <div className="initiative-header">
                  <span className="initiative-icon">
                    <IconComponent size={28} style={{ color: iconColor }} />
                  </span>
                  <h3 className="initiative-name">{priority.title}</h3>
                </div>
                <p className="initiative-description">{priority.subtitle}</p>
                {priority.focus_areas && priority.focus_areas.length > 0 && (
                  <div className="initiative-topics">
                    <h4>This Month's Focus Areas:</h4>
                    <ul>
                      {priority.focus_areas.map((area, i) => (
                        <li key={i}>{area}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      <DashboardGraphGrid clientId={clientId} pageId="initiatives" brandColor={customization.branding.primaryColor} />
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================
// SCHEMA-DRIVEN FORM COMPONENTS
// ============================================================
// These components render the Monthly Data form from schema configuration

// Icon mapping for form sections
const FORM_ICON_MAP = {
  'LayoutDashboard': LayoutDashboard,
  'Users': Users,
  'MessageSquare': MessageSquare,
  'Mail': Mail,
  'FileText': FileText,
  'Heart': Heart,
  'DollarSign': DollarSign,
  'Activity': Activity,
  'Target': Target,
  'TrendingUp': TrendingUp,
  'TrendingDown': TrendingUp,
  'Calendar': Calendar,
  'Clock': Clock,
  'CheckCircle': CheckCircle,
  'Star': Star,
  'Lightbulb': Lightbulb,
  'Settings': Settings,
  'BarChart2': BarChart2,
  'LineChart': BarChart2,
  'PieChart': PieChart,
  'Bell': Bell,
  'Shield': Shield,
  'Award': Award,
  'Briefcase': Briefcase,
  'Pill': Pill,
  'Smartphone': Smartphone,
  'HeartPulse': HeartPulse,
  'Stethoscope': Stethoscope,
  'Sparkles': Sparkles,
  'Zap': Zap,
  'Percent': Activity,
  'Package': Briefcase,
  'Layers': Layers,
  'ArrowUpRight': TrendingUp,
  'ArrowDownRight': TrendingUp,
  'AlertCircle': AlertCircle,
};

// Single Field Renderer
const FIELD_WIDTH_OPTIONS = [
  { value: 3, label: 'Quarter', shortLabel: '1/4' },
  { value: 4, label: 'Third', shortLabel: '1/3' },
  { value: 6, label: 'Half', shortLabel: '1/2' },
  { value: 12, label: 'Full', shortLabel: 'Full' },
];

function FormFieldRenderer({
  field,
  value,
  onChange,
  onLabelEdit,
  isEditingLabel,
  onLabelChange,
  onLabelBlur,
  showEditControls = true,
  onRemove,
  canRemove = true,
  onFieldUpdate,
  sectionId,
  onIconEdit,
  sectionWidthUnits = 12,
}) {
  const { customization, FIELD_TYPES } = useCustomization();
  const [showIconPicker, setShowIconPicker] = useState(false);
  const [showWidthDropdown, setShowWidthDropdown] = useState(false);

  const handleWidthChange = (newWidth) => {
    if (onFieldUpdate && sectionId) {
      onFieldUpdate(sectionId, field.id, { widthUnits: newWidth });
    }
    setShowWidthDropdown(false);
  };
  
  const renderInput = () => {
    switch (field.fieldType) {
      case FIELD_TYPES.CURRENCY:
        return (
          <div className="input-wrapper">
            <span className="input-prefix">{field.prefix || '$'}</span>
            <input 
              type="number" 
              className="form-input with-prefix" 
              value={value || ''} 
              onChange={(e) => onChange(field.id, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} 
              placeholder={field.placeholder}
            />
          </div>
        );
      
      case FIELD_TYPES.PERCENT:
        return (
          <div className="input-wrapper">
            <input 
              type="number" 
              className="form-input with-suffix" 
              value={value || ''} 
              onChange={(e) => onChange(field.id, e.target.value === '' ? 0 : parseFloat(e.target.value) || 0)} 
              placeholder={field.placeholder}
              min={0}
              max={100}
            />
            <span className="input-suffix">{field.suffix || '%'}</span>
          </div>
        );
      
      case FIELD_TYPES.DATE:
        return (
          <input 
            type="date" 
            className="form-input" 
            value={value || ''} 
            onChange={(e) => onChange(field.id, e.target.value)} 
          />
        );
      
      case FIELD_TYPES.TEXT:
        return (
          <input 
            type="text" 
            className="form-input" 
            value={value || ''} 
            onChange={(e) => onChange(field.id, e.target.value)} 
            placeholder={field.placeholder}
          />
        );
      
      case FIELD_TYPES.TEXTAREA:
        return (
          <textarea 
            className="form-input form-textarea" 
            value={value || ''} 
            onChange={(e) => onChange(field.id, e.target.value)} 
            placeholder={field.placeholder}
            rows={3}
          />
        );
      
      case FIELD_TYPES.SELECT:
        return (
          <select 
            className="form-input" 
            value={value || ''} 
            onChange={(e) => onChange(field.id, e.target.value)}
          >
            <option value="">Select...</option>
            {field.options?.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
        );
      
      case FIELD_TYPES.TOGGLE:
        return (
          <label className="toggle-switch">
            <input 
              type="checkbox" 
              checked={!!value} 
              onChange={(e) => onChange(field.id, e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
        );
      
      case FIELD_TYPES.NUMBER:
      default:
        return (
          <input 
            type="number" 
            className="form-input" 
            value={value || ''} 
            onChange={(e) => onChange(field.id, e.target.value === '' ? 0 : parseInt(e.target.value) || 0)} 
            placeholder={field.placeholder}
          />
        );
    }
  };
  
  const handleToggleDashboardVisibility = () => {
    if (onFieldUpdate && sectionId) {
      onFieldUpdate(sectionId, field.id, { showOnDashboard: !field.showOnDashboard });
    }
  };

  const handleIconSelect = (iconName) => {
    if (onIconEdit && sectionId) {
      onIconEdit(sectionId, field.id, iconName);
    }
  };

  const getFieldIcon = () => {
    // Enhanced debugging for icon resolution
    const fieldIcon = field.icon;
    const metricId = field.metricId || field.id;
    const metricDef = customization.metrics?.[metricId];
    const metricIcon = metricDef?.icon;
    const fallbackIcon = 'FileText';

    if (metricId === 'keyMetric2') {
      console.log('[FormFieldRenderer] Icon resolution for keyMetric2:', {
        field_icon: fieldIcon || 'NOT SET',
        metric_id: metricId,
        metric_def_exists: !!metricDef,
        metric_def_icon: metricIcon || 'NOT SET',
        will_use: fieldIcon || metricIcon || fallbackIcon,
        full_field_data: field
      });
    }

    if (fieldIcon) return fieldIcon;
    if (metricIcon) return metricIcon;
    return fallbackIcon;
  };

  const currentIcon = getFieldIcon();
  const metricDef = customization.metrics?.[field.metricId || field.id];
  const defaultIcon = metricDef?.icon || 'FileText';
  const IconComponent = FORM_ICON_MAP[currentIcon] || FileText;

  return (
    <div className="form-group schema-field">
      <div className="form-field-header">
        {isEditingLabel ? (
          <input
            type="text"
            className="form-label-input"
            value={field.label}
            onChange={(e) => onLabelChange(field.id, e.target.value)}
            onBlur={() => onLabelBlur()}
            onKeyDown={(e) => e.key === 'Enter' && onLabelBlur()}
            autoFocus
          />
        ) : (
          <label className={`form-label ${showEditControls && field.editable !== false ? 'editable' : ''}`} onClick={() => showEditControls && field.editable !== false && onLabelEdit(field.id)}>
            {field.label}
            {showEditControls && field.editable !== false && <Edit3 size={11} className="edit-icon" />}
          </label>
        )}
        {showEditControls && onIconEdit && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              className="field-icon-btn"
              onClick={() => setShowIconPicker(!showIconPicker)}
              title="Change field icon"
              aria-label="Change field icon"
              style={{
                padding: '6px 8px',
                background: showIconPicker ? '#f0f9ff' : 'transparent',
                border: showIconPicker ? '1px solid #0ea5e9' : '1px solid #e2e8f0',
                borderRadius: '6px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                marginRight: '4px'
              }}
            >
              <IconComponent size={14} style={{ color: '#64748b' }} />
            </button>
            {showIconPicker && (
              <IconPickerDropdown
                currentIcon={currentIcon}
                onSelectIcon={handleIconSelect}
                onClose={() => setShowIconPicker(false)}
                position="left"
                allowReset={true}
                defaultIcon={defaultIcon}
              />
            )}
          </div>
        )}
        {showEditControls && (
          <button
            type="button"
            className={`field-visibility-btn ${field.showOnDashboard ? 'visible' : 'hidden'}`}
            onClick={handleToggleDashboardVisibility}
            title={field.showOnDashboard ? "Hide from dashboard" : "Show on dashboard"}
            aria-label={field.showOnDashboard ? "Hide from dashboard" : "Show on dashboard"}
          >
            {field.showOnDashboard ? <Eye size={14} /> : <EyeOff size={14} />}
          </button>
        )}
        {showEditControls && field.showOnDashboard && (
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowWidthDropdown(!showWidthDropdown)}
              title="Set card width on dashboard"
              style={{
                padding: '4px 8px',
                background: showWidthDropdown ? 'var(--blue-50)' : 'transparent',
                border: showWidthDropdown ? '1px solid var(--blue-300)' : '1px solid var(--slate-200)',
                borderRadius: '4px',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                fontSize: '11px',
                fontWeight: 500,
                color: 'var(--slate-600)',
                transition: 'all 0.15s',
              }}
            >
              <Columns size={12} />
              {FIELD_WIDTH_OPTIONS.find(o => o.value === (field.widthUnits || 3))?.shortLabel || '1/4'}
            </button>
            {showWidthDropdown && (
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  right: 0,
                  marginTop: '4px',
                  background: 'white',
                  border: '1px solid var(--slate-200)',
                  borderRadius: '8px',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                  zIndex: 100,
                  minWidth: '140px',
                  overflow: 'hidden',
                }}
              >
                <div style={{ padding: '8px', borderBottom: '1px solid var(--slate-100)' }}>
                  <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--slate-500)', textTransform: 'uppercase' }}>
                    Card Width
                  </span>
                </div>
                {FIELD_WIDTH_OPTIONS.map(option => {
                  const isActive = (field.widthUnits || 3) === option.value;
                  const spansFullSection = option.value >= sectionWidthUnits;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => handleWidthChange(option.value)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        width: '100%',
                        padding: '8px 12px',
                        background: isActive ? 'var(--blue-50)' : 'transparent',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '13px',
                        color: isActive ? 'var(--blue-700)' : 'var(--slate-700)',
                        fontWeight: isActive ? 600 : 400,
                        textAlign: 'left',
                      }}
                    >
                      <span>{option.label}</span>
                      <span style={{ fontSize: '11px', color: spansFullSection ? 'var(--amber-500, #f59e0b)' : 'var(--slate-400)' }}>
                        {spansFullSection && sectionWidthUnits < 12
                          ? `${option.value}/${sectionWidthUnits} (full section)`
                          : `${option.value}/12`}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
        {showEditControls && canRemove && field.removable !== false && (
          <button
            type="button"
            className="field-remove-btn"
            onClick={() => onRemove(field.id)}
            title="Remove field"
          >
            <X size={14} />
          </button>
        )}
      </div>
      {renderInput()}
      {field.helperText && <span className="form-helper-text">{field.helperText}</span>}
    </div>
  );
}

// Section Renderer with drag handle and controls
function FormSectionRenderer({
  section,
  formData,
  onChange,
  onSectionUpdate,
  onFieldUpdate,
  onFieldRemove,
  onFieldAdd,
  onSectionRemove,
  onSectionToggle,
  isEditing,
  editingFieldLabel,
  setEditingFieldLabel,
  showEditControls = true,
  dragHandleProps = {},
  isDragging = false,
  onSectionDragOver,
  clientId = 'demo-client',
  pageId = 'overview',
  selectedMonth = null,
}) {
  const { customization, FIELD_TYPES, createFieldDef } = useCustomization();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldData, setNewFieldData] = useState({ id: '', label: '', fieldType: FIELD_TYPES.NUMBER, placeholder: '', showOnDashboard: true });

  const linkedTab = section.linkedTabId
    ? customization.navigation?.tabs?.find(tab => tab.id === section.linkedTabId)
    : null;

  const displayTitle = section.title;
  const displayIcon = section.icon;

  const IconComponent = FORM_ICON_MAP[displayIcon] || FileText;
  const sortedFields = [...section.fields].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Filter fields based on showOnDashboard property when not in edit mode
  const visibleFields = showEditControls
    ? sortedFields
    : sortedFields.filter(field => field.showOnDashboard !== false);

  const handleAddField = () => {
    if (!newFieldData.id || !newFieldData.label) return;

    const newField = createFieldDef(newFieldData.id, {
      label: newFieldData.label,
      fieldType: newFieldData.fieldType,
      placeholder: newFieldData.placeholder,
      showOnDashboard: newFieldData.showOnDashboard,
    });
    onFieldAdd(section.id, newField);
    setNewFieldData({ id: '', label: '', fieldType: FIELD_TYPES.NUMBER, placeholder: '', showOnDashboard: true });
    setShowAddFieldModal(false);
  };

  return (
    <div
      className={`form-section schema-section ${!section.enabled ? 'disabled' : ''} ${isDragging ? 'section-dragging' : ''}`}
      onDragOver={onSectionDragOver}
    >
      <div className="form-section-header">
        {showEditControls && (
          <div className="drag-handle" {...dragHandleProps}>
            <GripVertical size={16} />
          </div>
        )}
        <div className={`form-section-icon ${section.iconColor || 'brand'}`}>
          <IconComponent size={20} />
        </div>
        <div className="form-section-header-content">
          {isEditingTitle ? (
            <input
              type="text"
              value={section.title}
              onChange={(e) => onSectionUpdate(section.id, { title: e.target.value })}
              onBlur={() => setIsEditingTitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingTitle(false)}
              autoFocus
              style={{ fontSize: 18, fontWeight: 600, border: '1px solid var(--brand-primary)', borderRadius: 4, padding: '2px 8px' }}
            />
          ) : (
            <div
              className="form-section-title"
              onClick={() => showEditControls && section.titleEditable !== false && !linkedTab && setIsEditingTitle(true)}
              style={{ cursor: showEditControls && section.titleEditable !== false && !linkedTab ? 'pointer' : 'default' }}
            >
              {displayTitle}
              {showEditControls && section.titleEditable !== false && !linkedTab && <Edit3 size={14} style={{ opacity: 0.4, marginLeft: 4 }} />}
            </div>
          )}
          {isEditingSubtitle ? (
            <input 
              type="text"
              className="form-section-subtitle-input"
              value={section.subtitle || ''}
              onChange={(e) => onSectionUpdate(section.id, { subtitle: e.target.value })}
              onBlur={() => setIsEditingSubtitle(false)}
              onKeyDown={(e) => e.key === 'Enter' && setIsEditingSubtitle(false)}
              autoFocus
              style={{ fontSize: 13, color: 'var(--slate-500)', border: '1px solid var(--brand-primary)', borderRadius: 4, padding: '2px 8px', width: '100%' }}
            />
          ) : (
            <div 
              className="form-section-subtitle" 
              onClick={() => showEditControls && section.subtitleEditable !== false && setIsEditingSubtitle(true)}
              style={{ cursor: showEditControls && section.subtitleEditable !== false ? 'pointer' : 'default' }}
            >
              {section.subtitle || 'No description'}
              {showEditControls && section.subtitleEditable !== false && <Edit3 size={12} style={{ opacity: 0.3, marginLeft: 4 }} />}
            </div>
          )}
        </div>
        <div className="form-section-actions">
          <button
            type="button"
            className={`section-toggle ${section.enabled !== false ? '' : 'hidden'}`}
            onClick={() => onSectionToggle(section.id)}
          >
            {section.enabled !== false ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
          </button>
          {showEditControls && section.removable !== false && (
            <button
              type="button"
              className="section-remove-btn"
              onClick={() => onSectionRemove(section.id)}
              title="Remove section"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      {section.enabled ? (
        <>
          {section.sectionType === 'page_summary' ? (
              <PageSummaryManager
                section={section}
                clientId={clientId}
                pageId={pageId}
                showEditControls={showEditControls}
              />
          ) : section.sectionType === 'builtin_chart' ? (
            <div style={{
              padding: '16px',
              background: 'var(--slate-50)',
              borderRadius: '8px',
              color: 'var(--slate-600)',
              fontSize: '14px',
              textAlign: 'center'
            }}>
              This is a built-in chart section. Use the visibility toggle above to show or hide it in client dashboards.
            </div>
          ) : (
            <>
              <div className="form-grid">
                {visibleFields.map(field => (
                  <FormFieldRenderer
                    key={field.id}
                    field={field}
                    value={formData[field.id]}
                    onChange={onChange}
                    onLabelEdit={(fieldId) => setEditingFieldLabel(fieldId)}
                    isEditingLabel={editingFieldLabel === field.id}
                    onLabelChange={(fieldId, newLabel) => onFieldUpdate(section.id, fieldId, { label: newLabel })}
                    onLabelBlur={() => setEditingFieldLabel(null)}
                    showEditControls={showEditControls}
                    onRemove={(fieldId) => onFieldRemove(section.id, fieldId)}
                    canRemove={section.canAddFields !== false}
                    onFieldUpdate={onFieldUpdate}
                    sectionId={section.id}
                    onIconEdit={(sectionId, fieldId, iconName) => onFieldUpdate(sectionId, fieldId, { icon: iconName })}
                    sectionWidthUnits={12}
                  />
                ))}
              </div>
            </>
          )}

          {showEditControls && section.canAddFields !== false && section.sectionType !== 'page_summary' && (
            <div className="add-field-container">
              <button
                type="button"
                className="add-field-btn"
                onClick={() => setShowAddFieldModal(true)}
              >
                <Plus size={16} /> Add Field
              </button>
            </div>
          )}
          
          {/* Add Field Modal */}
          {showAddFieldModal && (
            <div className="inline-modal">
              <div className="inline-modal-content">
                <h4>Add New Field</h4>
                <div className="modal-form-grid">
                  <div className="form-group">
                    <label className="form-label">Field ID (unique)</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newFieldData.id}
                      onChange={(e) => setNewFieldData(prev => ({ ...prev, id: e.target.value.replace(/\s/g, '') }))}
                      placeholder="e.g., customMetric1"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Label</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newFieldData.label}
                      onChange={(e) => setNewFieldData(prev => ({ ...prev, label: e.target.value }))}
                      placeholder="e.g., Custom Metric"
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Type</label>
                    <select
                      className="form-input"
                      value={newFieldData.fieldType}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const numericTypes = [FIELD_TYPES.NUMBER, FIELD_TYPES.CURRENCY, FIELD_TYPES.PERCENT];
                        setNewFieldData(prev => ({
                          ...prev,
                          fieldType: newType,
                          showOnDashboard: numericTypes.includes(newType)
                        }));
                      }}
                    >
                      <option value={FIELD_TYPES.NUMBER}>Number</option>
                      <option value={FIELD_TYPES.CURRENCY}>Currency</option>
                      <option value={FIELD_TYPES.PERCENT}>Percent</option>
                      <option value={FIELD_TYPES.TEXT}>Text</option>
                      <option value={FIELD_TYPES.DATE}>Date</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">Placeholder</label>
                    <input
                      type="text"
                      className="form-input"
                      value={newFieldData.placeholder}
                      onChange={(e) => setNewFieldData(prev => ({ ...prev, placeholder: e.target.value }))}
                      placeholder="e.g., Enter value..."
                    />
                  </div>
                  <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                    <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input
                        type="checkbox"
                        checked={newFieldData.showOnDashboard}
                        onChange={(e) => setNewFieldData(prev => ({ ...prev, showOnDashboard: e.target.checked }))}
                        style={{ cursor: 'pointer' }}
                      />
                      Display on Dashboard
                    </label>
                    <p style={{ fontSize: '12px', color: '#6b7280', marginTop: '4px', marginLeft: '24px' }}>
                      Show this field as a KPI card on dashboard pages
                    </p>
                  </div>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn-secondary" onClick={() => setShowAddFieldModal(false)}>Cancel</button>
                  <button type="button" className="btn-primary" onClick={handleAddField} disabled={!newFieldData.id || !newFieldData.label}>
                    <Plus size={16} /> Add Field
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="section-disabled-notice"><EyeOff size={16} /> This section is hidden from reports</div>
      )}
    </div>
  );
}

// Tabbed Form Renderer with Navigation
function TabbedFormRenderer({
  formData,
  onChange,
  showEditControls = true,
  onSchemaChange,
  clientId,
}) {
  const { customization, getFormSchema } = useCustomization();
  const [activeTab, setActiveTab] = useState('overview');
  const [collapsedSections, setCollapsedSections] = useState({});

  const formSchema = getFormSchema();
  const tabs = customization.navigation?.tabs || [];
  const enabledTabs = tabs.filter(tab => tab.enabled && tab.id !== 'metrics').sort((a, b) => (a.order || 0) - (b.order || 0));

  // Group sections by tab
  const sectionsByTab = useMemo(() => {
    const grouped = {};
    enabledTabs.forEach(tab => {
      grouped[tab.id] = formSchema.sections
        .filter(section => section.linkedTabId === tab.id)
        .sort((a, b) => (a.order || 0) - (b.order || 0));
    });
    return grouped;
  }, [formSchema.sections, enabledTabs]);

  // Initialize collapsed state from section preferences
  useEffect(() => {
    const initialCollapsed = {};
    formSchema.sections.forEach(section => {
      initialCollapsed[section.id] = section.collapsedByDefault ?? false;
    });
    setCollapsedSections(initialCollapsed);
  }, [formSchema.sections]);

  const currentSections = sectionsByTab[activeTab] || [];

  const toggleSection = (sectionId) => {
    setCollapsedSections(prev => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  };

  const expandAll = () => {
    const allExpanded = {};
    currentSections.forEach(section => {
      allExpanded[section.id] = false;
    });
    setCollapsedSections(prev => ({ ...prev, ...allExpanded }));
  };

  const collapseAll = () => {
    const allCollapsed = {};
    currentSections.forEach(section => {
      allCollapsed[section.id] = true;
    });
    setCollapsedSections(prev => ({ ...prev, ...allCollapsed }));
  };

  // Get tab icon
  const getTabIcon = (iconName) => {
    const icons = {
      LayoutDashboard,
      Users,
      DollarSign,
      Heart,
      MessageSquare,
      Lightbulb,
      TrendingUp,
    };
    return icons[iconName] || FileText;
  };

  return (
    <div className="tabbed-form">
      {/* Tab Navigation */}
      <div className="form-tabs">
        {enabledTabs.map(tab => {
          const IconComponent = getTabIcon(tab.icon);
          const tabSections = sectionsByTab[tab.id] || [];
          const hasData = tabSections.some(section =>
            section.fields.some(field => formData[field.id])
          );

          return (
            <button
              key={tab.id}
              type="button"
              className={`form-tab ${activeTab === tab.id ? 'active' : ''} ${hasData ? 'has-data' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <IconComponent size={18} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="form-tab-content">
        <div className="tab-content-header">
          <div className="tab-content-actions">
            <button type="button" className="btn-text" onClick={expandAll}>
              <ChevronsDown size={14} /> Expand All
            </button>
            <button type="button" className="btn-text" onClick={collapseAll}>
              <ChevronsUp size={14} /> Collapse All
            </button>
          </div>
        </div>

        {currentSections.length > 0 ? (
          <div className="tab-sections">
            {currentSections.map(section => (
              <CollapsibleFormSection
                key={section.id}
                section={section}
                formData={formData}
                onChange={onChange}
                showEditControls={showEditControls}
                isCollapsed={collapsedSections[section.id]}
                onToggle={() => toggleSection(section.id)}
              />
            ))}
          </div>
        ) : (
          <div className="empty-tab-message">
            <FileText size={32} />
            <p>No sections configured for this tab</p>
          </div>
        )}
      </div>
    </div>
  );
}

// Collapsible Form Section Component
function CollapsibleFormSection({
  section,
  formData,
  onChange,
  showEditControls,
  isCollapsed,
  onToggle,
}) {
  const {
    updateFormSection,
    updateFormField,
    removeFieldFromSection,
    addFieldToSection,
    removeFormSection,
  } = useCustomization();

  const [editingFieldLabel, setEditingFieldLabel] = useState(null);

  const IconComponent = FORM_ICON_MAP[section.icon] || FileText;
  const sortedFields = [...section.fields].sort((a, b) => (a.order || 0) - (b.order || 0));

  // Filter fields based on showOnDashboard property when not in edit mode
  const visibleFields = showEditControls
    ? sortedFields
    : sortedFields.filter(field => field.showOnDashboard !== false);

  const filledFieldsCount = visibleFields.filter(field => formData[field.id]).length;
  const totalFieldsCount = visibleFields.length;

  return (
    <div className={`collapsible-section ${!section.enabled ? 'disabled' : ''}`}>
      <div className="collapsible-section-header" onClick={onToggle}>
        <div className="section-header-left">
          <div className={`form-section-icon ${section.iconColor || 'brand'}`}>
            <IconComponent size={20} />
          </div>
          <div>
            <h3 className="section-title">{section.title}</h3>
            <p className="section-subtitle">{section.subtitle}</p>
          </div>
        </div>
        <div className="section-header-right">
          <span className="field-count">{filledFieldsCount} / {totalFieldsCount} completed</span>
          {isCollapsed ? <ChevronDown size={20} /> : <ChevronUp size={20} />}
        </div>
      </div>

      {!isCollapsed && section.enabled && (
        <div className="collapsible-section-content">
          <div className="form-grid">
            {visibleFields.map(field => (
              <FormFieldRenderer
                key={field.id}
                field={field}
                value={formData[field.id]}
                onChange={onChange}
                onLabelEdit={(fieldId) => setEditingFieldLabel(fieldId)}
                isEditingLabel={editingFieldLabel === field.id}
                onLabelChange={(fieldId, newLabel) => updateFormField(section.id, fieldId, { label: newLabel })}
                onLabelBlur={() => setEditingFieldLabel(null)}
                showEditControls={showEditControls}
                onRemove={(fieldId) => removeFieldFromSection(section.id, fieldId)}
                canRemove={section.canAddFields !== false}
                onFieldUpdate={updateFormField}
                sectionId={section.id}
                sectionWidthUnits={12}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Main Schema Form Renderer
function SchemaFormRenderer({
  formData,
  onChange,
  showEditControls = true,
  onSchemaChange,
  filterByTab = null,
  localFormSchema = null,
  localHandlers = null,
  clientId = 'demo-client',
  pageId = null,
  selectedMonth = null,
}) {
  const {
    customization,
    getFormSchema,
    updateFormSection: globalUpdateFormSection,
    updateFormField: globalUpdateFormField,
    removeFieldFromSection: globalRemoveFieldFromSection,
    addFieldToSection: globalAddFieldToSection,
    removeFormSection: globalRemoveFormSection,
    reorderFormSections: globalReorderFormSections,
    FIELD_TYPES,
  } = useCustomization();

  // Use local handlers if provided, otherwise use global handlers
  const updateFormSection = localHandlers?.updateFormSection || globalUpdateFormSection;
  const updateFormField = localHandlers?.updateFormField || globalUpdateFormField;
  const removeFieldFromSection = localHandlers?.removeFieldFromSection || globalRemoveFieldFromSection;
  const addFieldToSection = localHandlers?.addFieldToSection || globalAddFieldToSection;
  const removeFormSection = localHandlers?.removeFormSection || globalRemoveFormSection;
  const reorderFormSections = localHandlers?.reorderFormSections || globalReorderFormSections;

  const [draggedSection, setDraggedSection] = useState(null);

  const handleSectionDragStart = (e, section) => {
    setDraggedSection(section);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleSectionDragOver = (e, targetSection) => {
    e.preventDefault();
    if (!draggedSection || draggedSection.id === targetSection.id) return;

    const tabSections = [...sortedSections];
    const draggedIndex = tabSections.findIndex(s => s.id === draggedSection.id);
    const targetIndex = tabSections.findIndex(s => s.id === targetSection.id);
    if (draggedIndex === -1 || targetIndex === -1) return;

    tabSections.splice(draggedIndex, 1);
    tabSections.splice(targetIndex, 0, draggedSection);

    const reorderedTabSections = tabSections.map((s, idx) => ({ ...s, order: idx }));
    const otherSections = formSchema.sections.filter(
      s => !reorderedTabSections.some(rs => rs.id === s.id)
    );

    reorderFormSections([...otherSections, ...reorderedTabSections]);
  };

  const handleSectionDragEnd = () => {
    setDraggedSection(null);
  };

  const [editingFieldLabel, setEditingFieldLabel] = useState(null);

  // Use local schema if provided, otherwise get from global state
  const formSchema = localFormSchema || getFormSchema();
  const allSortedSections = [...formSchema.sections].sort((a, b) => (a.order || 0) - (b.order || 0));
  const sortedSections = filterByTab
    ? allSortedSections.filter(section => section.linkedTabId === filterByTab)
    : allSortedSections;

  const handleSectionToggle = (sectionId) => {
    const section = formSchema.sections.find(s => s.id === sectionId);
    // Treat undefined as visible (true), so toggle should set to false
    // If currently enabled (true or undefined), set to false
    // If currently disabled (false), set to true
    updateFormSection(sectionId, { enabled: section?.enabled === false ? true : false });
  };

  return (
    <div className="schema-form">
      {sortedSections.map(section => (
        <FormSectionRenderer
          key={section.id}
          section={section}
          formData={formData}
          onChange={onChange}
          onSectionUpdate={updateFormSection}
          onFieldUpdate={updateFormField}
          onFieldRemove={removeFieldFromSection}
          onFieldAdd={addFieldToSection}
          onSectionRemove={removeFormSection}
          onSectionToggle={handleSectionToggle}
          editingFieldLabel={editingFieldLabel}
          setEditingFieldLabel={setEditingFieldLabel}
          showEditControls={showEditControls}
          isDragging={draggedSection?.id === section.id}
          onSectionDragOver={(e) => handleSectionDragOver(e, section)}
          dragHandleProps={showEditControls ? {
            draggable: true,
            onDragStart: (e) => handleSectionDragStart(e, section),
            onDragEnd: handleSectionDragEnd,
          } : {}}
          clientId={clientId}
          pageId={pageId || section.linkedTabId || 'overview'}
          selectedMonth={selectedMonth}
        />
      ))}
    </div>
  );
}

// ============================================================
// SUCCESS PLANNING PAGE
// ============================================================

function SuccessPlanningPage({ clientInfo, setClientInfo, onSave }) {
  const { hasPermission } = useAuth();
  const { customization } = useCustomization();
  const canEditSensitiveData = hasPermission('edit_sensitive_data');

  const [localClientInfo, setLocalClientInfo] = useState(clientInfo);

  // Track if there are unsaved changes
  const hasUnsavedChanges = useMemo(() => {
    return JSON.stringify(localClientInfo) !== JSON.stringify(clientInfo);
  }, [localClientInfo, clientInfo]);

  useEffect(() => {
    setLocalClientInfo(clientInfo);
  }, [clientInfo]);

  const handleClientChange = (field, value) => {
    setLocalClientInfo(prev => ({ ...prev, [field]: value }));
  };

  const handleStakeholderChange = (id, field, value) => {
    setLocalClientInfo(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleEnrollmentSpecialistChange = (id, field, value) => {
    setLocalClientInfo(prev => ({
      ...prev,
      enrollmentSpecialists: prev.enrollmentSpecialists.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const addStakeholder = () => {
    const newId = Math.max(...localClientInfo.stakeholders.map(s => s.id), 0) + 1;
    setLocalClientInfo(prev => ({
      ...prev,
      stakeholders: [...prev.stakeholders, { id: newId, name: '', title: '', role: '', email: '', phone: '', reportsTo: null }]
    }));
  };

  const removeStakeholder = (id) => {
    setLocalClientInfo(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.filter(s => s.id !== id)
    }));
  };

  const addEnrollmentSpecialist = () => {
    const newId = Math.max(...localClientInfo.enrollmentSpecialists.map(e => e.id), 0) + 1;
    setLocalClientInfo(prev => ({
      ...prev,
      enrollmentSpecialists: [...prev.enrollmentSpecialists, { id: newId, name: '', email: '', phone: '', role: '' }]
    }));
  };

  const removeEnrollmentSpecialist = (id) => {
    setLocalClientInfo(prev => ({
      ...prev,
      enrollmentSpecialists: prev.enrollmentSpecialists.filter(e => e.id !== id)
    }));
  };

  const handleSave = () => {
    setClientInfo(localClientInfo);
    onSave(null, null, null, localClientInfo);
  };

  const handleCancel = () => {
    setLocalClientInfo(clientInfo);
  };

  return (
    <div className="admin-container">
      <div className="page-header">
        <h1 className="page-title">Success Planning</h1>
        <p className="page-subtitle">Manage client information, stakeholders, and success metrics for {localClientInfo.clientName}</p>
      </div>

      {/* GENERAL INFO */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon teal"><Building2 size={20} /></div>
          <div>
            <div className="form-section-title">General Information</div>
            <div className="form-section-subtitle">Basic client details and contact information</div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Client Name</label>
            <input type="text" className="form-input" value={localClientInfo.clientName || ''} onChange={(e) => handleClientChange('clientName', e.target.value)} placeholder="Enter client name..." />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="text" className="form-input" value={localClientInfo.phone || ''} onChange={(e) => handleClientChange('phone', e.target.value)} placeholder="(555) 555-5555" />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Address</label>
            <input type="text" className="form-input" value={localClientInfo.address || ''} onChange={(e) => handleClientChange('address', e.target.value)} placeholder="Street address, City, State ZIP" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={localClientInfo.email || ''} onChange={(e) => handleClientChange('email', e.target.value)} placeholder="contact@example.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Website</label>
            <input type="text" className="form-input" value={localClientInfo.website || ''} onChange={(e) => handleClientChange('website', e.target.value)} placeholder="www.example.com" />
          </div>
        </div>
      </div>

      {/* KEY STAKEHOLDERS */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon blue"><Users size={20} /></div>
          <div>
            <div className="form-section-title">Key Stakeholders</div>
            <div className="form-section-subtitle">Decision makers and primary contacts at the practice</div>
          </div>
        </div>

        <div className="editable-list">
          {localClientInfo.stakeholders.map((person, index) => (
            <div key={person.id} className="stakeholder-card">
              <div className="stakeholder-header">
                <span className={`stakeholder-badge ${person.role === 'Decision Maker' ? 'decision-maker' : person.role === 'Primary Contact' ? 'primary-contact' : ''}`}>
                  {person.role || 'Team Member'}
                </span>
                <button className="remove-btn" onClick={() => removeStakeholder(person.id)}>Remove</button>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-input" value={person.name} onChange={(e) => handleStakeholderChange(person.id, 'name', e.target.value)} placeholder="Full name" />
                </div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input type="text" className="form-input" value={person.title} onChange={(e) => handleStakeholderChange(person.id, 'title', e.target.value)} placeholder="e.g., Medical Director" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role in Program</label>
                  <select className="form-input" value={person.role} onChange={(e) => handleStakeholderChange(person.id, 'role', e.target.value)}>
                    <option value="">Select role...</option>
                    <option value="Decision Maker">Decision Maker</option>
                    <option value="Primary Contact">Primary Contact</option>
                    <option value="Operations Lead">Operations Lead</option>
                    <option value="Clinical Champion">Clinical Champion</option>
                    <option value="Billing Contact">Billing Contact</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Reports To</label>
                  <select className="form-input" value={person.reportsTo || ''} onChange={(e) => handleStakeholderChange(person.id, 'reportsTo', e.target.value ? parseInt(e.target.value) : null)}>
                    <option value="">None (Top level)</option>
                    {localClientInfo.stakeholders.filter(s => s.id !== person.id).map(s => (
                      <option key={s.id} value={s.id}>{s.name || 'Unnamed'}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={person.email} onChange={(e) => handleStakeholderChange(person.id, 'email', e.target.value)} placeholder="email@practice.com" />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={person.phone} onChange={(e) => handleStakeholderChange(person.id, 'phone', e.target.value)} placeholder="(555) 555-5555" />
                </div>
              </div>
            </div>
          ))}
          <button className="add-item-btn" onClick={addStakeholder}>+ Add Stakeholder</button>
        </div>
      </div>

      {/* MEETING CADENCE & SYSTEMS */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon purple"><Calendar size={20} /></div>
          <div>
            <div className="form-section-title">Meeting Cadence & Systems</div>
            <div className="form-section-subtitle">Regular meeting schedule and EMR information</div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Weekly/Monthly Cadence</label>
            <div className="form-hint"><HelpCircle size={12} /> When do you meet with this client?</div>
            <input type="text" className="form-input" value={localClientInfo.weeklyMeetingSchedule || ''} onChange={(e) => handleClientChange('weeklyMeetingSchedule', e.target.value)} placeholder="e.g., Second Wednesday of each month at 3:00 PM EST" />
          </div>
          <div className="form-group">
            <label className="form-label">Primary Software/Platform</label>
            <div className="form-hint"><HelpCircle size={12} /> Software or platform system used by client</div>
            <input type="text" className="form-input" value={localClientInfo.emrName || ''} onChange={(e) => handleClientChange('emrName', e.target.value)} placeholder="e.g., Salesforce, HubSpot, Custom Platform" />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Hours of Operation</label>
            <input type="text" className="form-input" value={localClientInfo.hoursOfOperation || ''} onChange={(e) => handleClientChange('hoursOfOperation', e.target.value)} placeholder="e.g., Monday - Friday: 8:00 AM - 5:00 PM EST" />
          </div>
        </div>
      </div>

      {/* INTERNAL TEAM */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon emerald"><Users size={20} /></div>
          <div>
            <div className="form-section-title">Internal Team</div>
            <div className="form-section-subtitle">Team members working with this client</div>
          </div>
        </div>

        {/* CSM */}
        <div className="team-member-card">
          <div className="team-avatar">{localClientInfo.csmAssigned?.name?.charAt(0) || 'C'}</div>
          <div className="team-info" style={{ flex: 1 }}>
            <div className="team-role">Customer Success Manager</div>
          </div>
        </div>
        <div className="form-grid" style={{ marginBottom: 24 }}>
          <div className="form-group">
            <label className="form-label">CSM Name</label>
            <input type="text" className="form-input" value={localClientInfo.csmAssigned?.name || ''} onChange={(e) => handleClientChange('csmAssigned', { ...localClientInfo.csmAssigned, name: e.target.value })} placeholder="CSM name" />
          </div>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={localClientInfo.csmAssigned?.email || ''} onChange={(e) => handleClientChange('csmAssigned', { ...localClientInfo.csmAssigned, email: e.target.value })} placeholder="csm@company.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Phone</label>
            <input type="text" className="form-input" value={localClientInfo.csmAssigned?.phone || ''} onChange={(e) => handleClientChange('csmAssigned', { ...localClientInfo.csmAssigned, phone: e.target.value })} placeholder="(555) 555-5555" />
          </div>
        </div>

        {/* Additional Team Members */}
        <h4 style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Additional Team Members</h4>
        <div className="editable-list">
          {localClientInfo.enrollmentSpecialists.map((specialist, index) => (
            <div key={specialist.id} className="client-info-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <div style={{ flex: 1 }}>
                  <input
                    type="text"
                    value={specialist.role || ''}
                    onChange={(e) => handleEnrollmentSpecialistChange(specialist.id, 'role', e.target.value)}
                    placeholder="Click to enter role"
                    list={`team-roles-${specialist.id}`}
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      color: '#64748b',
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      outline: 'none',
                      width: '100%',
                      cursor: 'text',
                      fontFamily: 'inherit'
                    }}
                  />
                  <datalist id={`team-roles-${specialist.id}`}>
                    <option value="Customer Success Operations" />
                    <option value="Support Specialist" />
                    <option value="Account Executive" />
                    <option value="Sales Engineer" />
                    <option value="Implementation Specialist" />
                    <option value="Technical Account Manager" />
                    <option value="Solutions Architect" />
                    <option value="Product Specialist" />
                    <option value="Onboarding Specialist" />
                    <option value="Client Services" />
                  </datalist>
                </div>
                <button className="remove-btn" onClick={() => removeEnrollmentSpecialist(specialist.id)}>Remove</button>
              </div>
              <div className="form-grid three-col">
                <div className="form-group">
                  <label className="form-label">Name</label>
                  <input type="text" className="form-input" value={specialist.name} onChange={(e) => handleEnrollmentSpecialistChange(specialist.id, 'name', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input type="email" className="form-input" value={specialist.email} onChange={(e) => handleEnrollmentSpecialistChange(specialist.id, 'email', e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input type="text" className="form-input" value={specialist.phone} onChange={(e) => handleEnrollmentSpecialistChange(specialist.id, 'phone', e.target.value)} />
                </div>
              </div>
            </div>
          ))}
          <button className="add-item-btn" onClick={addEnrollmentSpecialist}>+ Add Team Member</button>
        </div>
      </div>

      {/* CONTRACT & BILLING */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon rose"><DollarSign size={20} /></div>
          <div>
            <div className="form-section-title">Contract & Billing</div>
            <div className="form-section-subtitle">Contract dates and billing information</div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label className="form-label">Contract Signed Date</label>
            <input type="date" className="form-input" value={localClientInfo.contractSignedDate || ''} onChange={(e) => handleClientChange('contractSignedDate', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Enrollment Start Date</label>
            <input type="date" className="form-input" value={localClientInfo.enrollmentStartDate || ''} onChange={(e) => handleClientChange('enrollmentStartDate', e.target.value)} />
          </div>
          {canEditSensitiveData && (
            <div className="form-group">
              <label className="form-label">Business Tax ID (EIN)</label>
              <input type="text" className="form-input" value={localClientInfo.businessTaxId || ''} onChange={(e) => handleClientChange('businessTaxId', e.target.value)} placeholder="XX-XXXXXXX" />
            </div>
          )}
          <div className="form-group">
            <label className="form-label">Billing Contact Email</label>
            <input type="email" className="form-input" value={localClientInfo.billingContact || ''} onChange={(e) => handleClientChange('billingContact', e.target.value)} placeholder="accounts@practice.com" />
          </div>
          <div className="form-group">
            <label className="form-label">Billing Notes</label>
            <input type="text" className="form-input" value={localClientInfo.billingNotes || ''} onChange={(e) => handleClientChange('billingNotes', e.target.value)} placeholder="e.g., Net 30 terms" />
          </div>
        </div>
      </div>

      {/* GOALS & VALUE METRICS */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon teal"><TrendingUp size={20} /></div>
          <div>
            <div className="form-section-title">Goals & Value Metrics</div>
            <div className="form-section-subtitle">Client objectives and success criteria</div>
          </div>
        </div>

        <div className="form-grid">
          <div className="form-group full-width">
            <label className="form-label">Client Goals</label>
            <div className="form-hint"><HelpCircle size={12} /> What does this client want to achieve with Med-Kick?</div>
            <textarea className="form-textarea" value={localClientInfo.clientGoals || ''} onChange={(e) => handleClientChange('clientGoals', e.target.value)} placeholder="e.g., Enroll 200 patients in CCM/RPM programs by end of Q4..." style={{ minHeight: 100 }} />
          </div>
          <div className="form-group full-width">
            <label className="form-label">Value Metrics</label>
            <div className="form-hint"><HelpCircle size={12} /> How do we measure success for this client?</div>
            <textarea className="form-textarea" value={localClientInfo.valueMetrics || ''} onChange={(e) => handleClientChange('valueMetrics', e.target.value)} placeholder="e.g., Focus on BP control improvement, medication adherence..." style={{ minHeight: 100 }} />
          </div>
        </div>
      </div>

      {/* NOTES */}
      <div className="form-section">
        <div className="form-section-header">
          <div className="form-section-icon purple"><FileText size={20} /></div>
          <div>
            <div className="form-section-title">Notes</div>
            <div className="form-section-subtitle">Additional information and reminders about this client</div>
          </div>
        </div>

        <div className="form-group">
          <textarea className="form-textarea" value={localClientInfo.notes || ''} onChange={(e) => handleClientChange('notes', e.target.value)} placeholder="Any important notes about working with this client..." style={{ minHeight: 150 }} />
        </div>
      </div>

      {hasUnsavedChanges && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '12px',
            zIndex: 1000,
            animation: 'slideInUp 0.3s ease-out'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            background: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
            fontSize: '13px',
            fontWeight: '500',
            color: '#92400e',
          }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
            You have unsaved changes
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="floating-cancel-btn"
              onClick={handleCancel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 24px',
                background: 'white',
                color: 'var(--slate-600)',
                border: '2px solid var(--slate-300)',
                borderRadius: '50px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
                e.target.style.borderColor = 'var(--slate-400)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                e.target.style.borderColor = 'var(--slate-300)';
              }}
            >
              <X size={18} />
              Cancel
            </button>
            <button
              className="floating-save-btn"
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 24px',
                background: `linear-gradient(135deg, ${customization.branding.primaryColor} 0%, ${customization.branding.accentColor} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: `0 10px 25px ${customization.branding.primaryColor}66, 0 4px 8px rgba(0, 0, 0, 0.15)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 14px 30px ${customization.branding.primaryColor}80, 0 6px 12px rgba(0, 0, 0, 0.2)`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 10px 25px ${customization.branding.primaryColor}66, 0 4px 8px rgba(0, 0, 0, 0.15)`;
              }}
            >
              <Save size={18} />
              Save Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN PAGE (Original - now uses SchemaFormRenderer for Monthly Data tab)
// ============================================================

function AdminPage({ formData, setFormData, stories, setStories, opportunities, setOpportunities, clientInfo, setClientInfo, onSave, onClientNameChange, isNewClient, onNewClientHandled, selectedClientId, selectedMonth, legacyStoriesData, onNavigateToStories, onNavigateToPriorities, onUnsavedChangesUpdate, onSaveRef }) {
  const { hasPermission } = useAuth();
  const customizationContext = useCustomization();
  const { customization, getFormSchema, updateFormSchema, updateDeletedSectionIds, saveToDatabase, loadFromDatabase, isSaving } = customizationContext;
  const canEditSensitiveData = hasPermission('edit_sensitive_data');

  const storiesSync = useStoriesSync(
    clientInfo?.clientId || selectedClientId,
    null,
    legacyStoriesData
  );

  const strategicPrioritiesSync = useStrategicPrioritiesSync(
    clientInfo?.clientId || selectedClientId
  );

  // Get enabled tabs from navigation configuration
  const enabledNavTabs = useMemo(() => {
    return customization.navigation.tabs
      .filter(tab => tab.enabled)
      .sort((a, b) => a.order - b.order);
  }, [customization.navigation.tabs]);

  // Start on the first enabled tab
  const [activeTab, setActiveTab] = useState(() => {
    return enabledNavTabs.length > 0 ? enabledNavTabs[0].id : 'overview';
  });
  const [localForm, setLocalForm] = useState(formData);
  const [localStories, setLocalStories] = useState(stories);
  const [localOpportunities, setLocalOpportunities] = useState(opportunities);
  const [localClientInfo, setLocalClientInfo] = useState(clientInfo);
  const [localFormSchema, setLocalFormSchema] = useState(() => getFormSchema(clientInfo?.clientId || selectedClientId));
  const [localDeletedSectionIds, setLocalDeletedSectionIds] = useState(() => customization.deletedSectionIds || []);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [errorNotification, setErrorNotification] = useState(null);
  const [sectionVisibility, setSectionVisibility] = useState(
    customization.sectionVisibility || { stories: true, opportunities: true }
  );

  const isLoadingFromDbRef = useRef(false);
  const previousClientIdRef = useRef(null);
  const hasInitializedRef = useRef(false);
  const baselineSchemaRef = useRef(null);
  const baselineSectionVisibilityRef = useRef(null);
  const hasLocalChangesRef = useRef(false);

  const hasUnsavedChanges = useMemo(() => {
    if (!hasInitializedRef.current || isInitialLoading) {
      return false;
    }

    const formChanged = JSON.stringify(localForm) !== JSON.stringify(formData);
    const storiesChanged = JSON.stringify(localStories) !== JSON.stringify(stories);
    const opportunitiesChanged = JSON.stringify(localOpportunities) !== JSON.stringify(opportunities);
    const clientInfoChanged = JSON.stringify(localClientInfo) !== JSON.stringify(clientInfo);

    const baselineSchema = baselineSchemaRef.current;
    const schemaChanged = baselineSchema
      ? JSON.stringify(localFormSchema) !== JSON.stringify(baselineSchema)
      : false;
    const deletedSectionsChanged = JSON.stringify(localDeletedSectionIds) !== JSON.stringify(customization.deletedSectionIds || []);

    const baselineVisibility = baselineSectionVisibilityRef.current || { stories: true, opportunities: true };
    const visibilityChanged = JSON.stringify(sectionVisibility) !== JSON.stringify(baselineVisibility);

    const hasChanges = formChanged || storiesChanged || opportunitiesChanged || clientInfoChanged || schemaChanged || deletedSectionsChanged || visibilityChanged;

    hasLocalChangesRef.current = hasChanges;
    return hasChanges;
  }, [localForm, formData, localStories, stories, localOpportunities, opportunities, localClientInfo, clientInfo, localFormSchema, localDeletedSectionIds, customization.deletedSectionIds, isInitialLoading, sectionVisibility]);

  useEffect(() => {
    if (onUnsavedChangesUpdate) {
      onUnsavedChangesUpdate(hasUnsavedChanges);
    }
  }, [hasUnsavedChanges]);

  useEffect(() => {
    if (onSaveRef) {
      onSaveRef.current = handleSave;
    }
  });

  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  useEffect(() => {
    const activeTabStillEnabled = enabledNavTabs.some(tab => tab.id === activeTab);
    if (!activeTabStillEnabled && enabledNavTabs.length > 0) {
      setActiveTab(enabledNavTabs[0].id);
    }
  }, [enabledNavTabs, activeTab]);

  // Sync local state when props change (e.g., new client created)
  useEffect(() => {
    setLocalForm(formData);
  }, [formData]);

  useEffect(() => {
    setLocalStories(storiesSync.stories);
    setStories(storiesSync.stories);
  }, [storiesSync.stories]);
  
  useEffect(() => {
    setLocalOpportunities(opportunities);
  }, [opportunities]);
  
  useEffect(() => {
    setLocalClientInfo(clientInfo);
  }, [clientInfo]);

  // Only reset localFormSchema when the client ID actually changes (not on every formSchema change)
  useEffect(() => {
    const currentClientId = clientInfo?.clientId || selectedClientId;
    const previousClientId = previousClientIdRef.current;

    if (currentClientId && currentClientId !== previousClientId) {
      previousClientIdRef.current = currentClientId;
      setIsInitialLoading(true);

      if (!isLoadingFromDbRef.current) {
        isLoadingFromDbRef.current = true;
        console.log('[AdminPage] Client changed, loading schema from database for:', currentClientId);

        loadFromDatabase(currentClientId).then((result) => {
          if (result.success && result.data) {
            const loadedSchema = result.data.formSchema || DEFAULT_FORM_SCHEMA;
            const loadedDeletedIds = result.data.deletedSectionIds || [];

            console.log('[AdminPage] Schema loaded from database:', {
              sectionCount: loadedSchema.sections?.length,
              sectionIds: loadedSchema.sections?.map(s => s.id),
              deletedSectionIds: loadedDeletedIds
            });

            setLocalFormSchema(loadedSchema);
            setLocalDeletedSectionIds(loadedDeletedIds);
            baselineSchemaRef.current = loadedSchema;
            const loadedVisibility = result.data.sectionVisibility || { stories: true, opportunities: true };
            setSectionVisibility(loadedVisibility);
            baselineSectionVisibilityRef.current = loadedVisibility;
          } else {
            console.log('[AdminPage] No saved schema in database, using default');
            const defaultSchema = getFormSchema(currentClientId);
            setLocalFormSchema(defaultSchema);
            setLocalDeletedSectionIds([]);
            baselineSchemaRef.current = defaultSchema;
            const defaultVisibility = { stories: true, opportunities: true };
            setSectionVisibility(defaultVisibility);
            baselineSectionVisibilityRef.current = defaultVisibility;
          }
          hasInitializedRef.current = true;
          hasLocalChangesRef.current = false;
        }).finally(() => {
          setIsInitialLoading(false);
          setTimeout(() => {
            isLoadingFromDbRef.current = false;
          }, 100);
        });
      }
    }
  }, [selectedClientId, clientInfo?.clientId, loadFromDatabase, getFormSchema]);

  // Defensive sync: Update localFormSchema when customization.formSchema changes (after initial load)
  useEffect(() => {
    if (!hasInitializedRef.current || isInitialLoading) {
      return;
    }

    if (hasLocalChangesRef.current) {
      console.log('[AdminPage] Skipping sync - user has local unsaved changes');
      return;
    }

    const currentClientId = clientInfo?.clientId || selectedClientId;
    const contextSchema = customization.formSchema;
    if (contextSchema && JSON.stringify(contextSchema) !== JSON.stringify(baselineSchemaRef.current)) {
      console.log('[AdminPage] Syncing localFormSchema with updated context schema');
      setLocalFormSchema(contextSchema);
      baselineSchemaRef.current = contextSchema;
    }
  }, [customization.formSchema, clientInfo?.clientId, selectedClientId, isInitialLoading]);

  useEffect(() => {
    if (customization.sectionVisibility && !hasLocalChangesRef.current) {
      setSectionVisibility(customization.sectionVisibility);
      baselineSectionVisibilityRef.current = customization.sectionVisibility;
    }
  }, [customization.sectionVisibility]);

  // Editable section labels
  const [sectionLabels, setSectionLabels] = useState(
    formData.sectionLabels || {
      coreMetrics: 'Core Metrics',
      enrollmentFunnel: 'Enrollment Funnel',
      campaignPerformance: 'Campaign Performance',
      smsCampaign: 'SMS Campaign',
      emailCampaign: 'Email Campaign',
      mailerCampaign: 'Mailer Campaign',
      patientOutcomes: 'Patient Outcomes',
      stories: 'Stories & Feedback',
      opportunities: 'Opportunities & Next Steps',
    }
  );
  
  // Editable section subtitles/descriptions
  const [sectionSubtitles, setSectionSubtitles] = useState(
    formData.sectionSubtitles || {
      coreMetrics: 'Primary KPIs shown on the dashboard overview',
      enrollmentFunnel: 'Track conversion from contact to enrollment',
      campaignPerformance: 'Results from SMS, email, and mailer outreach campaigns',
      smsCampaign: 'Text message outreach metrics',
      emailCampaign: 'Email outreach metrics',
      mailerCampaign: 'Physical mail outreach metrics',
      patientOutcomes: 'Health improvements and program effectiveness',
      stories: 'Testimonials and success stories from participants',
      opportunities: 'Action items and growth opportunities',
    }
  );

  // Editable field/metric labels
  const [fieldLabels, setFieldLabels] = useState(
    formData.fieldLabels || {
      enrolledThisMonth: 'Participants Enrolled This Month',
      activePatients: 'Total Active Participants',
      servicesDelivered: 'Services Delivered',
      revenue: 'Revenue This Month',
      contacted: 'Total Contacted',
      enrolled: 'Successfully Enrolled',
      smsSent: 'SMS Messages Sent',
      smsConsented: 'SMS Responses/Consents',
      emailSent: 'Emails Sent',
      emailConsented: 'Email Responses/Consents',
      mailersSent: 'Physical Mailers Sent',
      mailersConsented: 'Mailer Responses/Consents',
      currentlyInOutreach: 'Currently In Outreach',
      bpImproved: 'Health Metric Improved (%)',
      adherenceRate: 'Program Adherence Rate (%)',
      readmissionReduction: 'Churn/Attrition Reduction (%)',
      avgResponseHours: 'Avg Response Time (hours)',
    }
  );
  
  const [editingLabel, setEditingLabel] = useState(null);
  const [editingSubtitle, setEditingSubtitle] = useState(null);
  const [editingFieldLabel, setEditingFieldLabel] = useState(null);
  
  // Notify parent that new client mode has been handled (after a small delay to let render complete)
  useEffect(() => {
    if (isNewClient && onNewClientHandled) {
      const timer = setTimeout(() => {
        onNewClientHandled();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [isNewClient]);
  
  // Sync labels, subtitles, and field labels with localForm
  useEffect(() => {
    setLocalForm(prev => ({ ...prev, sectionLabels, sectionSubtitles, fieldLabels }));
  }, [sectionLabels, sectionSubtitles, fieldLabels]);
  
  const toggleSection = (section) => {
    const newValue = sectionVisibility[section] === false ? true : false;
    setSectionVisibility(prev => ({
      ...prev,
      [section]: newValue
    }));
  };
  
  const updateSectionLabel = (section, newLabel) => {
    setSectionLabels(prev => ({ ...prev, [section]: newLabel }));
    setEditingLabel(null);
  };

  const handleChange = (field, value) => {
    const numValue = value === '' ? 0 : parseInt(value) || 0;
    setLocalForm(prev => ({ ...prev, [field]: numValue }));
  };

  const handleClientChange = (field, value) => {
    setLocalClientInfo(prev => ({ ...prev, [field]: value }));
    // If name field changes, also update the clients list
    if (field === 'clientName' && onClientNameChange) {
      onClientNameChange(value);
    }
  };

  const handleStoryChange = async (id, field, value) => {
    setLocalStories(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));

    if (typeof id === 'string' && id.includes('-')) {
      await storiesSync.updateStory(id, { [field]: value });
    }
  };

  const handleOpportunityChange = (id, field, value) => {
    setLocalOpportunities(prev => prev.map(o => o.id === id ? { ...o, [field]: value } : o));
  };

  const handleStakeholderChange = (id, field, value) => {
    setLocalClientInfo(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.map(s => s.id === id ? { ...s, [field]: value } : s)
    }));
  };

  const handleProviderChange = (id, field, value) => {
    setLocalClientInfo(prev => ({
      ...prev,
      providers: prev.providers.map(p => p.id === id ? { ...p, [field]: value } : p)
    }));
  };

  const handleEnrollmentSpecialistChange = (id, field, value) => {
    setLocalClientInfo(prev => ({
      ...prev,
      enrollmentSpecialists: prev.enrollmentSpecialists.map(e => e.id === id ? { ...e, [field]: value } : e)
    }));
  };

  const addStory = async () => {
    const tempId = `temp-${Date.now()}`;
    const newStory = { id: tempId, title: '', quote: '', patientInitials: '', condition: '' };
    setLocalStories(prev => [...prev, newStory]);

    const id = await storiesSync.addStory(newStory);
    if (id) {
      await storiesSync.refreshStories();
    }
  };

  const removeStory = async (id) => {
    setLocalStories(prev => prev.filter(s => s.id !== id));

    if (typeof id === 'string' && id.includes('-')) {
      await storiesSync.deleteStory(id);
    }
  };

  const addOpportunity = () => {
    const newId = Math.max(...localOpportunities.map(o => o.id), 0) + 1;
    setLocalOpportunities(prev => [...prev, { id: newId, title: '', description: '', priority: localOpportunities.length + 1 }]);
  };

  const removeOpportunity = (id) => {
    setLocalOpportunities(prev => prev.filter(o => o.id !== id));
  };

  const addStakeholder = () => {
    const newId = Math.max(...localClientInfo.stakeholders.map(s => s.id), 0) + 1;
    setLocalClientInfo(prev => ({
      ...prev,
      stakeholders: [...prev.stakeholders, { id: newId, name: '', title: '', role: '', email: '', phone: '', reportsTo: null }]
    }));
  };

  const removeStakeholder = (id) => {
    setLocalClientInfo(prev => ({
      ...prev,
      stakeholders: prev.stakeholders.filter(s => s.id !== id)
    }));
  };

  const addProvider = () => {
    const newId = Math.max(...localClientInfo.providers.map(p => p.id), 0) + 1;
    setLocalClientInfo(prev => ({
      ...prev,
      providers: [...prev.providers, { id: newId, name: '', npi: '', phone: '', callerIdVerified: false }]
    }));
  };

  const removeProvider = (id) => {
    setLocalClientInfo(prev => ({
      ...prev,
      providers: prev.providers.filter(p => p.id !== id)
    }));
  };

  const addEnrollmentSpecialist = () => {
    const newId = Math.max(...localClientInfo.enrollmentSpecialists.map(e => e.id), 0) + 1;
    setLocalClientInfo(prev => ({
      ...prev,
      enrollmentSpecialists: [...prev.enrollmentSpecialists, { id: newId, name: '', email: '', phone: '', role: '' }]
    }));
  };

  const removeEnrollmentSpecialist = (id) => {
    setLocalClientInfo(prev => ({
      ...prev,
      enrollmentSpecialists: prev.enrollmentSpecialists.filter(e => e.id !== id)
    }));
  };

  // Local schema modification handlers (non-destructive until save)
  const localRemoveFieldFromSection = (sectionId, fieldId) => {
    setLocalFormSchema(prev => removeFieldFromSection(prev, sectionId, fieldId));
  };

  const localUpdateFormField = (sectionId, fieldId, updates) => {
    const updatedSchema = updateField(localFormSchema, sectionId, fieldId, updates);
    setLocalFormSchema(updatedSchema);
  };

  const localUpdateFormSection = (sectionId, updates) => {
    const updatedSchema = {
      ...localFormSchema,
      sections: localFormSchema.sections.map(s =>
        s.id === sectionId ? { ...s, ...updates } : s
      ),
    };
    setLocalFormSchema(updatedSchema);
  };

  const localAddFieldToSection = (sectionId, field) => {
    setLocalFormSchema(prev => ({
      ...prev,
      sections: prev.sections.map(s =>
        s.id === sectionId
          ? { ...s, fields: [...s.fields, field] }
          : s
      ),
    }));
  };

  const localRemoveFormSection = (sectionId) => {
    console.log('[AdminPage] localRemoveFormSection called for:', sectionId);

    setLocalFormSchema(prev => {
      const sectionExists = prev.sections.some(s => s.id === sectionId);
      const newSections = prev.sections.filter(s => s.id !== sectionId);
      console.log('[AdminPage] Removing section from localFormSchema:', {
        sectionId,
        sectionExisted: sectionExists,
        previousCount: prev.sections.length,
        newCount: newSections.length,
        remainingSectionIds: newSections.map(s => s.id)
      });
      return { ...prev, sections: newSections };
    });

    setLocalDeletedSectionIds(prev => {
      const alreadyDeleted = prev.includes(sectionId);
      const newList = alreadyDeleted ? prev : [...prev, sectionId];
      console.log('[AdminPage] Updating localDeletedSectionIds:', {
        sectionId,
        wasAlreadyDeleted: alreadyDeleted,
        previousList: prev,
        newList
      });
      return newList;
    });
  };

  const localReorderFormSections = (newOrder) => {
    setLocalFormSchema(prev => ({
      ...prev,
      sections: newOrder,
    }));
  };

  const handleSave = async () => {
    const currentClientId = clientInfo?.clientId || selectedClientId;

    const updatedCustomization = {
      ...customization,
      formSchema: localFormSchema,
      deletedSectionIds: localDeletedSectionIds,
      sectionVisibility,
    };

    updateFormSchema(localFormSchema);

    if (JSON.stringify(localDeletedSectionIds) !== JSON.stringify(customization.deletedSectionIds || [])) {
      updateDeletedSectionIds(localDeletedSectionIds);
    }

    const clientId = clientInfo?.clientId || selectedClientId;
    if (clientId) {
      const result = await saveToDatabase(clientId, updatedCustomization);
      if (result.success) {
        setLocalDeletedSectionIds([]);
        updateDeletedSectionIds([]);
        baselineSchemaRef.current = localFormSchema;
        baselineSectionVisibilityRef.current = sectionVisibility;
        hasLocalChangesRef.current = false;
      } else {
        console.error('[AdminPage] Save failed:', result.error);
        setErrorNotification('Failed to save changes. Please try again.');
        setTimeout(() => setErrorNotification(null), 5000);
      }
    }

    onSave(localForm, localStories, localOpportunities, localClientInfo);
  };

  const handleCancel = () => {
    const currentClientId = clientInfo?.clientId || selectedClientId;
    setLocalForm(formData);
    setLocalStories(stories);
    setLocalOpportunities(opportunities);
    setLocalClientInfo(clientInfo);
    setLocalFormSchema(baselineSchemaRef.current || getFormSchema(currentClientId));
    setLocalDeletedSectionIds(customization.deletedSectionIds || []);
    setSectionVisibility(baselineSectionVisibilityRef.current || { stories: true, opportunities: true });
  };

  return (
    <div className="admin-container">
      {errorNotification && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: '#ef4444',
          color: 'white',
          padding: '12px 20px',
          borderRadius: '8px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          zIndex: 9999,
          maxWidth: '400px',
          fontSize: '14px',
          fontWeight: '500'
        }}>
          {errorNotification}
        </div>
      )}
      <div className="page-header">
        <h1 className="page-title">Data Management</h1>
        <p className="page-subtitle">Configure dashboards, widgets, and data for {localClientInfo.clientName}</p>
      </div>

      {/* Tab Navigation - Dynamic from customization.navigation.tabs */}
      {enabledNavTabs.length > 0 ? (
        <div className="tab-nav">
          {enabledNavTabs.map(tab => {
            const TabIcon = FORM_ICON_MAP[tab.icon] || LayoutDashboard;

            return (
              <button
                key={tab.id}
                className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.id)}
                style={{ display: 'flex', alignItems: 'center', gap: '5px' }}
              >
                <TabIcon size={15} /> {tab.label}
              </button>
            );
          })}
        </div>
      ) : (
        <div style={{
          padding: '40px 20px',
          textAlign: 'center',
          background: '#fef3c7',
          border: '1px solid #fbbf24',
          borderRadius: '12px',
          color: '#92400e',
          marginBottom: '24px'
        }}>
          <AlertCircle size={24} style={{ marginBottom: '12px' }} />
          <div style={{ fontSize: '16px', fontWeight: '600', marginBottom: '8px' }}>No Tabs Enabled</div>
          <div style={{ fontSize: '14px' }}>Please enable at least one tab in Settings → Navigation to manage monthly data.</div>
        </div>
      )}

      {/* Tab Content - Render schema-driven sections for all tabs */}
      {enabledNavTabs.length > 0 && (
        <>
          {isInitialLoading ? (
            <div style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '60px 20px',
              gap: '16px'
            }}>
              <div style={{
                width: '40px',
                height: '40px',
                border: '3px solid var(--slate-200)',
                borderTopColor: 'var(--brand-primary)',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              <div style={{ color: 'var(--slate-500)', fontSize: '14px' }}>Loading client data...</div>
            </div>
          ) : (
          <SchemaFormRenderer
            formData={localForm}
            onChange={handleChange}
            showEditControls={canEditSensitiveData}
            filterByTab={activeTab}
            localFormSchema={localFormSchema}
            localHandlers={{
              updateFormSection: localUpdateFormSection,
              updateFormField: localUpdateFormField,
              removeFieldFromSection: localRemoveFieldFromSection,
              addFieldToSection: localAddFieldToSection,
              removeFormSection: localRemoveFormSection,
              reorderFormSections: localReorderFormSections,
            }}
            clientId={clientInfo?.clientId || selectedClientId}
            selectedMonth={selectedMonth}
          />
          )}

      {activeTab === 'stories' && (
        <>

          {/* Stories Section - kept separate as it has unique structure */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon amber">
                {(() => {
                  const storiesTab = customization.navigation?.tabs?.find(tab => tab.id === 'stories');
                  const StoriesIcon = storiesTab ? FORM_ICON_MAP[storiesTab.icon] || MessageSquare : MessageSquare;
                  return <StoriesIcon size={20} />;
                })()}
              </div>
              <div className="form-section-header-content">
                <div className="form-section-title">
                  {customization.navigation?.tabs?.find(tab => tab.id === 'stories')?.label || 'Success Stories & Feedback'}
                </div>
                <div className="form-section-subtitle">
                  Testimonials and positive feedback from participants
                </div>
              </div>
              <button
                className={`section-toggle ${sectionVisibility.stories !== false ? '' : 'hidden'}`}
                onClick={() => toggleSection('stories')}
              >
                {sectionVisibility.stories !== false ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
              </button>
            </div>

            {storiesSync.isMigrating && (
              <div style={{
                padding: '12px 16px',
                background: '#fef3c7',
                border: '1px solid #fbbf24',
                borderRadius: '8px',
                color: '#92400e',
                fontSize: '14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Migrating stories to database...
              </div>
            )}

            {storiesSync.isLoading && !storiesSync.isMigrating && (
              <div style={{
                padding: '12px 16px',
                background: '#e0f2fe',
                border: '1px solid #0ea5e9',
                borderRadius: '8px',
                color: '#075985',
                fontSize: '14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Loading stories...
              </div>
            )}

            {sectionVisibility.stories !== false ? (
              <div className="items-list">
                <div style={{
                  padding: '12px 16px',
                  background: '#f0f9ff',
                  border: '1px solid #0ea5e9',
                  borderRadius: '8px',
                  color: '#075985',
                  fontSize: '13px',
                  marginBottom: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertCircle size={16} />
                  <span>Stories are managed in <strong>Success Planning → Health Score</strong> tab. This section shows a read-only view.</span>
                </div>
                {localStories.filter(story => story.is_visible !== false).map((story) => (
                  <div key={story.id} style={{
                    padding: '20px',
                    background: '#f8fafc',
                    borderRadius: '12px',
                    borderLeft: '4px solid #06b6d4',
                    marginBottom: '12px',
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      display: 'flex',
                      gap: '8px',
                      alignItems: 'center'
                    }}>
                      <span style={{
                        padding: '4px 10px',
                        background: story.is_visible ? '#dcfce7' : '#f1f5f9',
                        color: story.is_visible ? '#166534' : '#64748b',
                        borderRadius: '6px',
                        fontSize: '12px',
                        fontWeight: 600,
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px'
                      }}>
                        {story.is_visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        {story.is_visible ? 'Visible' : 'Hidden'}
                      </span>
                    </div>
                    <div style={{ marginBottom: '12px', paddingRight: '80px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 600, color: '#64748b', marginBottom: '8px' }}>Quote/Testimonial</div>
                      <div style={{
                        fontSize: '15px',
                        lineHeight: '1.7',
                        color: '#475569',
                        fontStyle: 'italic'
                      }}>
                        "{story.quote || 'No quote provided'}"
                      </div>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Initials</div>
                        <div style={{ fontSize: '14px', color: '#0f172a' }}>{story.initials || story.patientInitials || 'Anonymous'}</div>
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: 600, color: '#64748b', marginBottom: '4px' }}>Context</div>
                        <div style={{ fontSize: '14px', color: '#0f172a' }}>{story.context || story.condition || 'N/A'}</div>
                      </div>
                    </div>
                  </div>
                ))}
                {localStories.filter(story => story.is_visible !== false).length === 0 && (
                  <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748b', fontSize: '14px', background: '#f8fafc', borderRadius: '8px' }}>
                    <MessageSquare size={32} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
                    <div style={{ fontWeight: 600, marginBottom: '4px' }}>No visible stories yet</div>
                    <div>Add and manage stories in Success Planning → Health Score tab</div>
                  </div>
                )}
                <button className="add-item-btn" onClick={onNavigateToStories} style={{ background: '#14b8a6', color: 'white', border: 'none' }}>
                  <MessageSquare size={16} />
                  Manage Stories in Success Planning
                </button>
              </div>
            ) : (
              <div className="section-disabled-notice"><EyeOff size={16} /> This section is hidden from reports</div>
            )}
          </div>

        </>
      )}

      {activeTab === 'initiatives' && (
        <>
          {/* Strategic Priorities Section - kept separate as it has unique structure */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon amber">
                {(() => {
                  const initiativesTab = customization.navigation?.tabs?.find(tab => tab.id === 'initiatives');
                  const InitiativesIcon = initiativesTab ? FORM_ICON_MAP[initiativesTab.icon] || Lightbulb : Lightbulb;
                  return <InitiativesIcon size={20} />;
                })()}
              </div>
              <div className="form-section-header-content">
                <div className="form-section-title">
                  {customization.navigation?.tabs?.find(tab => tab.id === 'initiatives')?.label || 'Strategic Priorities'}
                </div>
                <div className="form-section-subtitle">
                  Monthly initiatives and focus areas for this client
                </div>
              </div>
            </div>

            {strategicPrioritiesSync.isLoading && (
              <div style={{
                padding: '12px 16px',
                background: '#e0f2fe',
                border: '1px solid #0ea5e9',
                borderRadius: '8px',
                color: '#075985',
                fontSize: '14px',
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <RefreshCw size={16} style={{ animation: 'spin 1s linear infinite' }} />
                Loading strategic priorities...
              </div>
            )}

            <div>
              {(() => {
                const visiblePriorities = strategicPrioritiesSync.priorities.filter(p => p.is_visible);
                console.log('=== CLIENT-FACING VIEW DEBUG v2024-01-13 ===');
                console.log('[AdminPage] All priorities:', strategicPrioritiesSync.priorities.length);
                console.log('[AdminPage] Visible priorities:', visiblePriorities.length);
                console.log('[AdminPage] Priority details:', strategicPrioritiesSync.priorities.map(p => ({ id: p.id, title: p.title, is_visible: p.is_visible })));
                console.log('[AdminPage] Will render', visiblePriorities.length, 'cards');

                return visiblePriorities.length === 0 ? (
                  <div style={{ padding: '20px', textAlign: 'center', color: '#64748b', fontSize: '14px' }}>
                    No visible strategic priorities yet. Add priorities in Success Planning.
                  </div>
                ) : (
                  <div style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))',
                    gap: '24px',
                    marginBottom: '20px'
                  }}>
                    {visiblePriorities.map((priority) => {
                      const iconName = priority.icon || 'Lightbulb';
                      const IconComponent = FORM_ICON_MAP[iconName] || Lightbulb;
                      const iconColors = {
                        Lightbulb: '#f59e0b',
                        Pill: '#ef4444',
                        Smartphone: '#3b82f6',
                        HeartPulse: '#ec4899',
                        Stethoscope: '#06b6d4',
                        Users: '#8b5cf6',
                        Activity: '#10b981',
                        Calendar: '#6366f1',
                        ClipboardList: '#14b8a6',
                        Target: '#f97316',
                        TrendingUp: '#84cc16',
                        Shield: '#6366f1',
                        Zap: '#eab308',
                        Sparkles: '#a855f7',
                      };
                      const iconColor = iconColors[iconName] || '#f59e0b';

                      return (
                        <div
                          key={priority.id}
                          style={{
                            background: 'white',
                            borderRadius: '12px',
                            padding: '24px',
                            border: '2px solid #e2e8f0',
                            borderLeft: `4px solid #14b8a6`,
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'start', marginBottom: '16px' }}>
                            <div style={{
                              width: '48px',
                              height: '48px',
                              borderRadius: '12px',
                              background: `linear-gradient(135deg, ${iconColor} 0%, ${iconColor}dd 100%)`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              marginRight: '16px',
                              flexShrink: 0
                            }}>
                              <IconComponent size={24} color="white" />
                            </div>
                            <div style={{ flex: 1 }}>
                              <h3 style={{
                                fontSize: '18px',
                                fontWeight: 700,
                                color: '#0f172a',
                                margin: '0 0 8px 0',
                                lineHeight: '1.3'
                              }}>
                                {priority.title}
                              </h3>
                              <p style={{
                                fontSize: '14px',
                                color: '#64748b',
                                margin: 0,
                                lineHeight: '1.5'
                              }}>
                                {priority.subtitle}
                              </p>
                            </div>
                          </div>

                          {priority.focus_areas && priority.focus_areas.length > 0 && (
                            <>
                              <div style={{
                                height: '1px',
                                background: '#e2e8f0',
                                margin: '16px 0'
                              }} />

                              <div style={{ marginTop: '16px' }}>
                                <div style={{
                                  fontSize: '14px',
                                  fontWeight: 700,
                                  color: '#0f172a',
                                  marginBottom: '12px'
                                }}>
                                  This Month's Focus Areas:
                                </div>
                                <ul style={{
                                  margin: 0,
                                  paddingLeft: '20px',
                                  fontSize: '14px',
                                  color: '#475569',
                                  lineHeight: '1.8'
                                }}>
                                  {priority.focus_areas.map((area, index) => (
                                    <li key={index} style={{ marginBottom: '6px' }}>
                                      {area}
                                    </li>
                                  ))}
                                </ul>
                              </div>
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
              <button
                className="add-item-btn"
                onClick={onNavigateToPriorities}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Edit3 size={16} />
                Edit Strategic Priorities
              </button>
            </div>
          </div>

        </>
      )}

      {activeTab === 'opportunities' && (
        <>
          {/* Opportunities Section - kept separate as it has unique structure */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon emerald">
                {(() => {
                  const opportunitiesTab = customization.navigation?.tabs?.find(tab => tab.id === 'opportunities');
                  const OpportunitiesIcon = opportunitiesTab ? FORM_ICON_MAP[opportunitiesTab.icon] || Lightbulb : Lightbulb;
                  return <OpportunitiesIcon size={20} />;
                })()}
              </div>
              <div className="form-section-header-content">
                <div className="form-section-title">
                  {customization.navigation?.tabs?.find(tab => tab.id === 'opportunities')?.label || 'Opportunities & Next Steps'}
                </div>
                <div className="form-section-subtitle">
                  Action items and growth opportunities
                </div>
              </div>
              <button
                className={`section-toggle ${sectionVisibility.opportunities !== false ? '' : 'hidden'}`}
                onClick={() => toggleSection('opportunities')}
              >
                {sectionVisibility.opportunities !== false ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
              </button>
            </div>

            {sectionVisibility.opportunities !== false ? (
              <div className="items-list">
                {localOpportunities.map((opp) => (
                  <div key={opp.id} className="item-card">
                    <button className="remove-item-btn" onClick={() => removeOpportunity(opp.id)} title="Remove opportunity"><X size={14} /></button>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Opportunity Title</label>
                        <input type="text" className="form-input" value={opp.title || ''} onChange={(e) => handleOpportunityChange(opp.id, 'title', e.target.value)} placeholder="e.g., RPM Expansion" />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Priority</label>
                        <select className="form-input" value={opp.priority || 'medium'} onChange={(e) => handleOpportunityChange(opp.id, 'priority', e.target.value)}>
                          <option value="high">High Priority</option>
                          <option value="medium">Medium Priority</option>
                          <option value="low">Low Priority</option>
                        </select>
                      </div>
                    </div>
                    <div className="form-group">
                      <label className="form-label">Description</label>
                      <textarea className="form-textarea" rows={2} value={opp.description || ''} onChange={(e) => handleOpportunityChange(opp.id, 'description', e.target.value)} placeholder="Describe the opportunity and next steps..." />
                    </div>
                  </div>
                ))}
                <button className="add-item-btn" onClick={addOpportunity}>+ Add Another Opportunity</button>
              </div>
            ) : (
              <div className="section-disabled-notice"><EyeOff size={16} /> This section is hidden from reports</div>
            )}
          </div>
        </>
      )}

      {activeTab === 'metrics' && !isInitialLoading && (
        <MetricsManager clientId={clientInfo?.clientId || selectedClientId} />
      )}
        </>
      )}

      {hasUnsavedChanges && (
        <div
          style={{
            position: 'fixed',
            bottom: '32px',
            right: '32px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: '12px',
            zIndex: 1000,
            animation: 'slideInUp 0.3s ease-out'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            background: '#fffbeb',
            border: '1px solid #f59e0b',
            borderRadius: '10px',
            boxShadow: '0 4px 12px rgba(245, 158, 11, 0.2)',
            fontSize: '13px',
            fontWeight: '500',
            color: '#92400e',
          }}>
            <AlertTriangle size={16} style={{ color: '#f59e0b', flexShrink: 0 }} />
            You have unsaved changes
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              className="floating-cancel-btn"
              onClick={handleCancel}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 24px',
                background: 'white',
                color: 'var(--slate-600)',
                border: '2px solid var(--slate-300)',
                borderRadius: '50px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 16px rgba(0, 0, 0, 0.15)';
                e.target.style.borderColor = 'var(--slate-400)';
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
                e.target.style.borderColor = 'var(--slate-300)';
              }}
            >
              <X size={18} />
              Cancel
            </button>
            <button
              className="floating-save-btn"
              onClick={handleSave}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '16px 24px',
                background: `linear-gradient(135deg, ${customization.branding.primaryColor} 0%, ${customization.branding.accentColor} 100%)`,
                color: 'white',
                border: 'none',
                borderRadius: '50px',
                fontSize: '15px',
                fontWeight: '600',
                cursor: 'pointer',
                boxShadow: `0 10px 25px ${customization.branding.primaryColor}66, 0 4px 8px rgba(0, 0, 0, 0.15)`,
                transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `0 14px 30px ${customization.branding.primaryColor}80, 0 6px 12px rgba(0, 0, 0, 0.2)`;
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = 'translateY(0)';
                e.target.style.boxShadow = `0 10px 25px ${customization.branding.primaryColor}66, 0 4px 8px rgba(0, 0, 0, 0.15)`;
              }}
            >
              <Save size={18} />
              Save All Changes
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

export default function PrysmCSDashboard() {
  console.log('[PrysmCS] Dashboard component rendering');
  return (
    <AuthProvider>
      <CustomizationProvider>
        <EditLayoutProvider>
          <PrysmCSDashboardContent />
        </EditLayoutProvider>
      </CustomizationProvider>
    </AuthProvider>
  );
}

function PrysmCSDashboardContent() {
  const { isAuthenticated, currentUser, canAccessClient, logPHIAccess, hasPermission } = useAuth();
  const { customization, loadFromDatabase, isSaving, getEnabledTabs, getFormSchema, FIELD_TYPES } = useCustomization();
  const editLayout = useEditLayout();
  const [isLoadingCustomization, setIsLoadingCustomization] = useState(false);

  const [clientsData, setClientsData] = useState(() => {
    const DATA_VERSION = '2';
    const storedVersion = localStorage.getItem('prysmcs_data_version');
    if (storedVersion !== DATA_VERSION) {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem('medkick_customization');
      localStorage.setItem('prysmcs_data_version', DATA_VERSION);
      return {};
    }
    const saved = loadFromStorage();
    return saved || {};
  });

  // Selection state
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthKey());
  
  // UI state
  const [activePage, setActivePageRaw] = useState("overview");
  const [pageHistory, setPageHistory] = useState([]);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showPresentationMode, setShowPresentationMode] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [successPlanningTab, setSuccessPlanningTab] = useState('overview');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  
  // Client management state
  const [clientsList, setClientsList] = useState([]);

  // Delete client state
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [deleteClientConfirmText, setDeleteClientConfirmText] = useState('');
  const [deleteClientReason, setDeleteClientReason] = useState('');
  const [newClientMode, setNewClientMode] = useState(false);

  const [notification, setNotification] = useState(null);
  const [adminHasUnsavedChanges, setAdminHasUnsavedChanges] = useState(false);
  const adminSaveRef = useRef(null);
  const [unsavedNavTarget, setUnsavedNavTarget] = useState(null);

  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 5000);
  };

  useEffect(() => {
    if (!(editLayout.isEditing && editLayout.hasPendingChanges)) return;
    const handler = (e) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [editLayout.isEditing, editLayout.hasPendingChanges]);

  const dashboardTabIds = useMemo(
    () => getEnabledTabs().map(tab => tab.id),
    [getEnabledTabs]
  );

  // Fetch active clients from database
  const fetchActiveClients = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('success_planning_overview')
        .select('client_id, company_name')
        .is('deleted_at', null)
        .order('company_name');

      if (error) throw error;

      if (data && data.length > 0) {
        const formattedClients = data.map(client => ({
          id: client.client_id,
          name: client.company_name
        }));
        setClientsList(formattedClients);

        // If current selected client is not in the list, select the first one
        const clientIds = formattedClients.map(c => c.id);
        if (!clientIds.includes(selectedClientId)) {
          setSelectedClientId(formattedClients[0].id);
        }
      }
    } catch (err) {
      console.error('Error fetching active clients:', err);
    }
  }, [selectedClientId]);

  // Load active clients on mount
  useEffect(() => {
    fetchActiveClients();
  }, []);

  // Wrap setActivePage to track history
  const doNavigate = (newPage) => {
    setPageHistory(prev => [...prev.slice(-9), activePage]);
    setActivePageRaw(newPage);
    if (activePage === 'successPlanning' && newPage !== 'successPlanning') {
      setSuccessPlanningTab('overview');
    }
  };

  const setActivePage = (newPage) => {
    if (newPage !== activePage) {
      if (activePage === 'admin' && adminHasUnsavedChanges) {
        setUnsavedNavTarget({ type: 'page', value: newPage, source: 'admin' });
        return;
      }
      if (editLayout.isEditing) {
        setUnsavedNavTarget({ type: 'page', value: newPage, source: 'editLayout' });
        return;
      }
      doNavigate(newPage);
    }
  };

  // Navigate back
  const goBack = () => {
    if (pageHistory.length > 0) {
      const prevPage = pageHistory[pageHistory.length - 1];
      setPageHistory(prev => prev.slice(0, -1));
      setActivePageRaw(prevPage);
    }
  };

  const canGoBack = pageHistory.length > 0;

  // Set initial client based on user's access
  useEffect(() => {
    if (currentUser && !canAccessClient(selectedClientId)) {
      // Find first accessible client
      const accessibleClient = clientsList.find(c => canAccessClient(c.id));
      if (accessibleClient) {
        setSelectedClientId(accessibleClient.id);
      }
    }
  }, [currentUser, clientsList]);

  // Reset to overview page when user logs in
  useEffect(() => {
    if (currentUser) {
      setActivePage("overview");
    }
  }, [currentUser]);

  // Load customization from database when client changes
  useEffect(() => {
    const loadCustomization = async () => {
      if (!selectedClientId) return;

      // Don't reload if we're currently saving - prevents overwriting unsaved changes
      if (isSaving) {
        console.log('[PrysmCSDashboard] Skipping customization reload - save in progress');
        return;
      }

      setIsLoadingCustomization(true);
      try {
        const result = await loadFromDatabase(selectedClientId);
        if (result.success) {
          if (result.data) {
            console.log('[PrysmCSDashboard] Loaded customization from database for client:', selectedClientId);
          } else {
            console.log('[PrysmCSDashboard] No customization found in database for client:', selectedClientId, '- using defaults');
          }
        } else {
          console.warn('[PrysmCSDashboard] Failed to load customization from database:', result.error);
        }
      } catch (err) {
        console.error('[PrysmCSDashboard] Error loading customization:', err);
      } finally {
        setIsLoadingCustomization(false);
      }
    };

    loadCustomization();
  }, [selectedClientId, loadFromDatabase]);

  // Get current data helpers with null safety
  const getCurrentClient = () => {
    const client = clientsData[selectedClientId];
    if (!client) {
      // Return a default structure if client doesn't exist
      return {
        clientInfo: { clientName: '', address: '', phone: '', email: '', website: '', stakeholders: [], csmAssigned: { name: '', email: '', phone: '' }, careManagementCoordinator: { name: '', email: '', phone: '' }, enrollmentSpecialists: [], providers: [] },
        monthlyData: { [selectedMonth]: { ...emptyMonthData } },
        stories: { [selectedMonth]: [] },
        opportunities: { [selectedMonth]: [] }
      };
    }
    return client;
  };
  const getCurrentMonthData = () => {
    const client = getCurrentClient();
    return client?.monthlyData?.[selectedMonth] || { ...emptyMonthData };
  };
  const getPreviousMonthData = () => {
    const client = getCurrentClient();
    const prevMonthId = getPreviousMonthId(selectedMonth);
    return prevMonthId ? (client?.monthlyData?.[prevMonthId] || emptyMonthData) : emptyMonthData;
  };
  const getCurrentStories = () => {
    const client = getCurrentClient();
    return client?.stories?.[selectedMonth] || [];
  };
  const getCurrentOpportunities = () => {
    const client = getCurrentClient();
    return client?.opportunities?.[selectedMonth] || [];
  };

  // Derived state
  const [formData, setFormData] = useState(() => ({ ...getCurrentMonthData() }));
  const [stories, setStories] = useState(() => [...getCurrentStories()]);
  const [opportunities, setOpportunities] = useState(() => [...getCurrentOpportunities()]);
  const [clientInfo, setClientInfo] = useState(() => ({ ...getCurrentClient().clientInfo }));
  const [healthData, setHealthData] = useState(null);

  const availableMonths = useMemo(() => {
    const currentClient = clientsData[selectedClientId];
    return getAvailableMonthsForClient(currentClient);
  }, [selectedClientId, clientsData]);

  // Load health data from Supabase for wins & achievements
  useEffect(() => {
    const loadHealthData = async () => {
      if (!selectedClientId) return;

      try {
        const { data, error } = await supabase
          .from('success_planning_health')
          .select('success_wins, show_in_success_stories')
          .eq('client_id', selectedClientId)
          .maybeSingle();

        if (error) {
          console.error('[Client Dashboard] Error loading health data:', error);
          return;
        }

        setHealthData(data);
      } catch (error) {
        console.error('[Client Dashboard] Error loading health data:', error);
      }
    };

    loadHealthData();

    const channel = supabase
      .channel(`client-health-${selectedClientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'success_planning_health',
          filter: `client_id=eq.${selectedClientId}`,
        },
        (payload) => {
          console.log('[Client Dashboard] Health change detected:', payload);
          loadHealthData();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClientId]);

  // Load stories from Supabase for client-facing dashboard
  useEffect(() => {
    const loadClientStories = async () => {
      if (!selectedClientId) return;

      try {
        const { data, error } = await supabase
          .from('success_stories')
          .select('*')
          .eq('client_id', selectedClientId)
          .eq('show_in_main_tab', true)
          .eq('is_visible', true)
          .order('display_order', { ascending: true });

        if (error) {
          console.error('[Client Dashboard] Error loading stories:', error);
          return;
        }

        console.log('[Client Dashboard] Loaded stories from Supabase:', data?.length || 0);

        const mappedStories = (data || []).map(s => ({
          id: s.id,
          quote: s.quote,
          title: s.context || 'Untitled Story',
          patientType: s.initials || 'Anonymous',
          patientInitials: s.initials,
          condition: s.context,
          is_visible: s.is_visible,
        }));
        setStories(mappedStories);
      } catch (error) {
        console.error('[Client Dashboard] Error loading stories:', error);
      }
    };

    loadClientStories();

    const channel = supabase
      .channel(`client-stories-${selectedClientId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'success_stories',
          filter: `client_id=eq.${selectedClientId}`,
        },
        (payload) => {
          console.log('[Client Dashboard] Story change detected:', payload);
          loadClientStories();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedClientId]);

  // Compute dashboard data with dynamic charts from historical data
  const dashboardData = buildDashboardData(formData, getPreviousMonthData(), getCurrentClient(), selectedMonth);

  // Track unsaved changes
  useEffect(() => {
    const originalData = JSON.stringify(getCurrentMonthData());
    const currentData = JSON.stringify(formData);
    setHasUnsavedChanges(originalData !== currentData);
  }, [formData, selectedClientId, selectedMonth]);

  // Save data to localStorage whenever clientsData changes
  const saveAllData = (newFormData, newStories, newOpportunities, newClientInfo) => {
    // Use passed data if available, otherwise fall back to state
    const dataToSave = newFormData || formData;
    const storiesToSave = newStories || stories;
    const opportunitiesToSave = newOpportunities || opportunities;
    const clientInfoToSave = newClientInfo || clientInfo;
    
    // Update local state with the saved data
    if (newFormData) setFormData(newFormData);
    if (newStories) setStories(newStories);
    if (newOpportunities) setOpportunities(newOpportunities);
    if (newClientInfo) setClientInfo(newClientInfo);
    
    // Update current selections into clientsData
    const updatedClientsData = {
      ...clientsData,
      [selectedClientId]: {
        ...clientsData[selectedClientId],
        clientInfo: clientInfoToSave,
        monthlyData: {
          ...clientsData[selectedClientId].monthlyData,
          [selectedMonth]: dataToSave,
        },
        stories: {
          ...clientsData[selectedClientId].stories,
          [selectedMonth]: storiesToSave,
        },
        opportunities: {
          ...clientsData[selectedClientId].opportunities,
          [selectedMonth]: opportunitiesToSave,
        },
      },
    };
    
    setClientsData(updatedClientsData);
    saveToStorage(updatedClientsData);
    setHasUnsavedChanges(false);
    
    // Audit log the data change
    logPHIAccess(AUDIT_ACTIONS.EDIT_PHI, {
      resource: 'client_data',
      clientId: selectedClientId,
      month: selectedMonth,
      action: 'saved_monthly_data'
    });
    
    // Show toast
    setShowSaveToast(true);
    setTimeout(() => setShowSaveToast(false), 3000);
  };

  // Handle client switching
  const handleClientChange = (newClientId) => {
    if (!canAccessClient(newClientId)) {
      logPHIAccess(AUDIT_ACTIONS.ACCESS_DENIED, {
        resource: 'client_data',
        clientId: newClientId,
        reason: 'unauthorized_client_access'
      });
      showNotification('You do not have access to this client.', 'error');
      return;
    }

    if (activePage === 'admin' && adminHasUnsavedChanges) {
      setUnsavedNavTarget({ type: 'client', value: newClientId, source: 'admin' });
      return;
    }

    if (editLayout.isEditing) {
      setUnsavedNavTarget({ type: 'client', value: newClientId, source: 'editLayout' });
      return;
    }

    doClientSwitch(newClientId);
  };

  const doClientSwitch = (newClientId) => {
    const updatedClientsData = {
      ...clientsData,
      [selectedClientId]: {
        ...clientsData[selectedClientId],
        clientInfo: clientInfo,
        monthlyData: {
          ...clientsData[selectedClientId].monthlyData,
          [selectedMonth]: formData,
        },
        stories: {
          ...clientsData[selectedClientId].stories,
          [selectedMonth]: stories,
        },
        opportunities: {
          ...clientsData[selectedClientId].opportunities,
          [selectedMonth]: opportunities,
        },
      },
    };
    setClientsData(updatedClientsData);
    saveToStorage(updatedClientsData);
    
    // Audit log the client switch
    logPHIAccess(AUDIT_ACTIONS.CLIENT_SWITCHED, {
      fromClient: selectedClientId,
      toClient: newClientId
    });
    
    // Load new client data
    const newClient = updatedClientsData[newClientId];

    // Check if the current month exists for the new client, if not, switch to current month
    const availableMonthsForNewClient = getAvailableMonthsForClient(newClient);
    const monthExists = availableMonthsForNewClient.some(m => m.id === selectedMonth);
    const monthToUse = monthExists ? selectedMonth : getCurrentMonthKey();

    setSelectedClientId(newClientId);
    setSelectedMonth(monthToUse);
    setFormData({ ...(newClient.monthlyData[monthToUse] || emptyMonthData) });
    setStories([...(newClient.stories[monthToUse] || [])]);
    setOpportunities([...(newClient.opportunities[monthToUse] || [])]);
    setClientInfo({ ...newClient.clientInfo });

    doNavigate("overview");
    setHasUnsavedChanges(false);
    setAdminHasUnsavedChanges(false);
  };

  // Handle month switching
  const handleMonthChange = (newMonth) => {
    // Save current month data first
    const updatedClientsData = {
      ...clientsData,
      [selectedClientId]: {
        ...clientsData[selectedClientId],
        monthlyData: {
          ...clientsData[selectedClientId].monthlyData,
          [selectedMonth]: formData,
        },
        stories: {
          ...clientsData[selectedClientId].stories,
          [selectedMonth]: stories,
        },
        opportunities: {
          ...clientsData[selectedClientId].opportunities,
          [selectedMonth]: opportunities,
        },
      },
    };
    setClientsData(updatedClientsData);
    saveToStorage(updatedClientsData);
    
    // Load new month data
    const client = updatedClientsData[selectedClientId];
    setSelectedMonth(newMonth);
    setFormData({ ...(client.monthlyData[newMonth] || emptyMonthData) });
    setStories([...(client.stories[newMonth] || [])]);
    setOpportunities([...(client.opportunities[newMonth] || [])]);
    
    setHasUnsavedChanges(false);
  };

  const handleExport = () => {
    setShowPDFModal(true);
  };

  const handlePresent = () => {
    setShowPresentationMode(true);
  };

  const handleCreateClient = () => {
    // Generate unique client ID
    const timestamp = Date.now();
    const clientId = `new-client-${timestamp}`;

    // New clients always start at the current month
    const currentMonth = getCurrentMonthKey();

    // Add to clients list with placeholder name
    setClientsList(prev => [...prev, { id: clientId, name: 'New Client' }]);

    // Create initial data structure with completely blank fields
    const blankClientInfo = {
      clientName: '',
      address: '',
      phone: '',
      email: '',
      website: '',
      stakeholders: [],
      weeklyMeetingSchedule: '',
      emrName: '',
      careManagementCoordinator: { name: '', email: '', phone: '' },
      enrollmentSpecialists: [],
      csmAssigned: { name: '', email: '', phone: '' },
      providers: [],
      notes: ''
    };

    const blankMonthData = { ...emptyMonthData };

    setClientsData(prev => ({
      ...prev,
      [clientId]: {
        clientInfo: blankClientInfo,
        monthlyData: {
          [currentMonth]: blankMonthData
        },
        stories: {
          [currentMonth]: []
        },
        opportunities: {
          [currentMonth]: []
        }
      }
    }));

    // Select the new client and update all state
    setSelectedClientId(clientId);
    setSelectedMonth(currentMonth);
    setClientInfo({ ...blankClientInfo });
    setFormData({ ...blankMonthData });
    setStories([]);
    setOpportunities([]);

    // Set flag to indicate new client
    setNewClientMode(true);

    // Navigate to Success Planning page to set up client information
    setActivePage('successPlanning');

    logPHIAccess(AUDIT_ACTIONS.CREATE_RECORD, {
      resource: 'client',
      action: 'created_client',
      clientId: clientId
    });
  };

  const handleDeleteClient = async () => {
    // Only proceed if DELETE is typed (confirmation required for all clients)
    if (deleteClientConfirmText !== 'DELETE') {
      return;
    }

    const clientToDelete = clientsList.find(c => c.id === selectedClientId);
    if (!clientToDelete) return;

    // Cannot delete if only one client remains
    if (clientsList.length <= 1) {
      showNotification('Cannot delete the last remaining client.', 'error');
      return;
    }

    try {
      // Call soft_delete_client database function
      const { data, error } = await supabase.rpc('soft_delete_client', {
        p_client_id: selectedClientId,
        p_deleted_by: currentUser?.email || 'Unknown',
        p_deletion_reason: deleteClientReason.trim() || null
      });

      if (error) throw error;

      if (data && data.success) {
        // Create notifications for team members
        await supabase.rpc('create_deletion_notifications', {
          p_client_id: selectedClientId,
          p_company_name: clientToDelete.name,
          p_deleted_by: currentUser?.email || 'Unknown',
          p_purge_date: data.purge_at
        });

        // Remove client from list
        setClientsList(prev => prev.filter(c => c.id !== selectedClientId));

        // Remove client data
        setClientsData(prev => {
          const newData = { ...prev };
          delete newData[selectedClientId];
          return newData;
        });

        // Select next available client and load its data
        const remainingClients = clientsList.filter(c => c.id !== selectedClientId);
        if (remainingClients.length > 0) {
          const newClientId = remainingClients[0].id;
          const newClientsData = { ...clientsData };
          delete newClientsData[selectedClientId];

          const newClient = newClientsData[newClientId];
          setSelectedClientId(newClientId);
          setFormData({ ...(newClient?.monthlyData?.[selectedMonth] || emptyMonthData) });
          setStories([...(newClient?.stories?.[selectedMonth] || [])]);
          setOpportunities([...(newClient?.opportunities?.[selectedMonth] || [])]);
          setClientInfo({ ...newClient?.clientInfo });
        }

        // Log the deletion
        logPHIAccess(AUDIT_ACTIONS.DELETE_RECORD, {
          resource: 'client',
          action: 'soft_deleted_client',
          clientId: selectedClientId,
          clientName: clientToDelete.name,
          purgeDate: data.purge_at
        });

        showNotification(`Client "${clientToDelete.name}" has been deleted. It will be permanently purged in 90 days unless restored by an administrator.`, 'success');

        // Refresh the clients list after deletion
        await fetchActiveClients();
      } else {
        throw new Error('Failed to delete client');
      }
    } catch (error) {
      console.error('Error deleting client:', error);
      showNotification('Failed to delete client: ' + error.message, 'error');
    }

    // Reset and close modal
    setDeleteClientConfirmText('');
    setDeleteClientReason('');
    setShowDeleteClientModal(false);
  };

  // Get current month label for PDF
  const currentMonthLabel = availableMonths.find(m => m.id === selectedMonth)?.label || selectedMonth;

  // Access denied component
  const AccessDeniedMessage = ({ permission }) => (
    <div className="access-denied">
      <Lock size={48} />
      <h2>Access Denied</h2>
      <p>You do not have permission to view this page.</p>
    </div>
  );

  // Handle navigation from notification alert to action item
  const handleNavigateToAction = (clientId, actionId) => {
    // Change to the client
    if (clientId !== selectedClientId) {
      setSelectedClientId(clientId);
    }
    // Navigate to Success Planning page with Actions tab
    setActivePage('successPlanning');
    setSuccessPlanningTab('actions');
    // Store action ID for highlighting (can be accessed via URL params or state)
    window.sessionStorage.setItem('highlightActionId', actionId);
  };

  const renderPage = () => {
    const sectionVisibility = customization.sectionVisibility || { stories: true, opportunities: true };

    const noClientPages = ['users', 'deleted-accounts', 'audit', 'portfolio', 'customization', 'notifications', 'profile'];
    if (clientsList.length === 0 && !noClientPages.includes(activePage)) {
      const bc = customization.branding.primaryColor || '#06b6d4';
      return (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', textAlign: 'center', padding: '48px 24px' }}>
          <div style={{ width: 64, height: 64, borderRadius: 16, background: `${bc}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
            <Users size={28} style={{ color: bc }} />
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 600, color: '#1e293b', marginBottom: 8 }}>No Clients Yet</h2>
          <p style={{ fontSize: 14, color: '#64748b', maxWidth: 400, lineHeight: 1.6, marginBottom: 24 }}>
            Get started by adding your first client account. Once created, you can begin tracking metrics, managing data, and generating reports.
          </p>
          {hasPermission('edit_data') && (
            <button
              onClick={() => { handleCreateClient(); }}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 24px', borderRadius: 8, border: 'none', background: bc, color: '#fff', fontSize: 14, fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={16} />
              Add First Client
            </button>
          )}
        </div>
      );
    }

    const currentTab = customization.navigation.tabs.find(tab => tab.id === activePage);

    if (currentTab?.isCustom) {
      return <CustomTabPage tabId={currentTab.id} tabLabel={currentTab.label} data={dashboardData} sectionVisibility={sectionVisibility} clientId={selectedClientId} />;
    }

    switch (activePage) {
      case "overview":
        return hasPermission('view_dashboard') ? <OverviewPage data={dashboardData} sectionVisibility={sectionVisibility} brandColor={customization.branding.primaryColor} clientId={selectedClientId} selectedMonth={selectedMonth} /> : <AccessDeniedMessage />;
      case "enrollment":
        return hasPermission('view_patients') ? <EnrollmentPage data={dashboardData} sectionVisibility={sectionVisibility} brandColor={customization.branding.primaryColor} clientId={selectedClientId} /> : <AccessDeniedMessage />;
      case "financial":
        return hasPermission('view_financial') ? <FinancialPage data={dashboardData} sectionVisibility={sectionVisibility} brandColor={customization.branding.primaryColor} clientId={selectedClientId} /> : <AccessDeniedMessage />;
      case "outcomes":
        return hasPermission('view_outcomes') ? <OutcomesPage data={dashboardData} sectionVisibility={sectionVisibility} clientId={selectedClientId} /> : <AccessDeniedMessage />;
      case "stories":
        return hasPermission('view_stories') ? <StoriesPage stories={stories} sectionVisibility={sectionVisibility} healthData={healthData} clientId={selectedClientId} /> : <AccessDeniedMessage />;
      case "opportunities":
        return hasPermission('view_opportunities') ? <OpportunitiesPage opportunities={opportunities} sectionVisibility={sectionVisibility} clientId={selectedClientId} /> : <AccessDeniedMessage />;
      case "initiatives":
        return hasPermission('view_initiatives') ? <MonthlyInitiativesPage clientId={selectedClientId} /> : <AccessDeniedMessage />;
      case "successPlanning":
        return hasPermission('edit_client_info') ? (
          <SuccessPlanning
            clientId={selectedClientId}
            clientName={clientInfo.clientName || 'Client'}
            currentUserName={currentUser?.username || 'User'}
            clientInfo={clientInfo}
            setClientInfo={setClientInfo}
            onSave={saveAllData}
            onClientNameChange={(newName) => {
              setClientsList(prev => prev.map(c =>
                c.id === selectedClientId ? { ...c, name: newName } : c
              ));
            }}
            defaultTab={successPlanningTab}
          />
        ) : <AccessDeniedMessage />;
      case "admin":
        return hasPermission('edit_data') ? (
          <AdminPage
            key={`${selectedClientId}-${newClientMode ? 'new' : 'existing'}`}
            formData={formData}
            setFormData={setFormData}
            stories={stories}
            setStories={setStories}
            opportunities={opportunities}
            setOpportunities={setOpportunities}
            clientInfo={clientInfo}
            setClientInfo={setClientInfo}
            onSave={saveAllData}
            onClientNameChange={(newName) => {
              setClientsList(prev => prev.map(c =>
                c.id === selectedClientId ? { ...c, name: newName } : c
              ));
            }}
            isNewClient={newClientMode}
            onNewClientHandled={() => setNewClientMode(false)}
            selectedClientId={selectedClientId}
            selectedMonth={selectedMonth}
            legacyStoriesData={getCurrentClient()?.stories}
            onNavigateToStories={() => {
              setSuccessPlanningTab('health');
              setActivePage('successPlanning');
            }}
            onNavigateToPriorities={() => {
              setSuccessPlanningTab('plan');
              setTimeout(() => setActivePage('successPlanning'), 0);
            }}
            onUnsavedChangesUpdate={setAdminHasUnsavedChanges}
            onSaveRef={adminSaveRef}
          />
        ) : <AccessDeniedMessage />;
      case "users": return <UserManagementPage setActivePage={setActivePage} />;
      case "deleted-accounts":
        return hasPermission('delete_data') ? (
          <DeletedAccountsPanel
            currentUserEmail={currentUser?.email || 'Unknown'}
            hasRestorePermission={hasPermission('delete_data')}
            hasPurgePermission={hasPermission('delete_data')}
            onClientRestored={fetchActiveClients}
          />
        ) : <AccessDeniedMessage />;
      case "audit": return <AuditLogPage />;
      case "portfolio": return hasPermission('view_portfolio_analytics') ? <PortfolioAnalyticsPage /> : <AccessDeniedMessage />;
      case "customization": return hasPermission('manage_customization') ? <CustomizationPage onNavigate={setActivePage} /> : <AccessDeniedMessage />;
      case "notifications": return <NotificationsPage />;
      case "profile": return <ProfilePage />;
      default: return <OverviewPage data={dashboardData} sectionVisibility={sectionVisibility} clientId={selectedClientId} selectedMonth={selectedMonth} />;
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <style>{styles}</style>
        <LoginPage />
      </>
    );
  }

  return (
    <>
      <style>{styles}</style>
      <SessionTimeoutWarning />

      {/* In-App Notification System */}
      {notification && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 10000,
            maxWidth: '500px',
            padding: '16px 20px',
            borderRadius: '8px',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            alignItems: 'start',
            gap: '12px',
            backgroundColor: notification.type === 'error' ? '#fef2f2' : '#f0fdf4',
            border: `1px solid ${notification.type === 'error' ? '#fecaca' : '#bbf7d0'}`,
            animation: 'slideIn 0.3s ease-out'
          }}
        >
          <div style={{ flex: 1 }}>
            <p style={{
              margin: 0,
              color: notification.type === 'error' ? '#991b1b' : '#166534',
              fontSize: '14px',
              lineHeight: '1.5'
            }}>
              {notification.message}
            </p>
          </div>
          <button
            onClick={() => setNotification(null)}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: notification.type === 'error' ? '#991b1b' : '#166534',
              fontSize: '20px',
              lineHeight: '1',
              fontWeight: 'bold'
            }}
          >
            ×
          </button>
        </div>
      )}

      <div className="dashboard">
        {isMobileSidebarOpen && (
          <div
            className="sidebar-overlay"
            onClick={() => setIsMobileSidebarOpen(false)}
          />
        )}
        <Sidebar
          activePage={activePage}
          setActivePage={(page) => {
            setActivePage(page);
            setIsMobileSidebarOpen(false);
          }}
          isOpen={isMobileSidebarOpen}
        />
        <main className="main-content">
          <Topbar
            onExport={handleExport}
            onPresent={handlePresent}
            selectedClientId={selectedClientId}
            onClientChange={handleClientChange}
            selectedMonth={selectedMonth}
            onMonthChange={handleMonthChange}
            hasUnsavedChanges={hasUnsavedChanges}
            canGoBack={canGoBack}
            onGoBack={goBack}
            onAddClient={handleCreateClient}
            onDeleteClient={() => setShowDeleteClientModal(true)}
            clients={clientsList}
            onNavigateToAction={handleNavigateToAction}
            onToggleMobileMenu={() => setIsMobileSidebarOpen(!isMobileSidebarOpen)}
            availableMonths={availableMonths}
          />
          <div className="page-content">
            {renderPage()}
          </div>
          <EditLayoutButton activePage={activePage} dashboardTabIds={dashboardTabIds} brandColor={customization.branding?.primaryColor || '#06b6d4'} />
        </main>
      </div>
      
      {/* PDF Report Modal */}
      <DynamicPDFReportModal
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        clientId={selectedClientId}
        selectedMonth={selectedMonth}
        dashboardData={dashboardData}
        clientInfo={clientInfo}
        stories={stories}
        opportunities={opportunities}
        monthLabel={currentMonthLabel}
        customization={customization}
        getFormSchema={getFormSchema}
        FIELD_TYPES={FIELD_TYPES}
      />
      
      {/* Presentation Mode */}
      <DynamicPresentationMode
        isOpen={showPresentationMode}
        onClose={() => setShowPresentationMode(false)}
        clientId={selectedClientId}
        selectedMonth={selectedMonth}
        dashboardData={dashboardData}
        clientInfo={clientInfo}
        monthLabel={currentMonthLabel}
        customization={customization}
        getFormSchema={getFormSchema}
        FIELD_TYPES={FIELD_TYPES}
      />
      
      {/* Delete Client Modal */}
      {showDeleteClientModal && (
        <div className="modal-overlay" onClick={() => setShowDeleteClientModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
            <div className="modal-header">
              <h3 style={{ color: '#dc2626' }}><Trash2 size={20} /> Delete Client Account</h3>
              <button className="modal-close" onClick={() => setShowDeleteClientModal(false)}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ padding: '20px 0' }}>
              <p style={{ marginBottom: '16px', color: '#64748b' }}>
                You are about to delete the following client account:
              </p>
              <div style={{
                background: '#fef2f2',
                border: '1px solid #fecaca',
                borderRadius: '8px',
                padding: '16px',
                marginBottom: '20px'
              }}>
                <div style={{ fontWeight: '600', color: '#0f172a', marginBottom: '4px', fontSize: '18px' }}>
                  {clientsList.find(c => c.id === selectedClientId)?.name || 'Unknown Client'}
                </div>
                <div style={{ fontSize: '13px', color: '#64748b' }}>
                  This client will be retained for 90 days and can be restored by an administrator during this period. After 90 days, all data will be permanently deleted.
                </div>
              </div>

              <div style={{ marginBottom: '16px' }}>
                <label style={{ display: 'block', marginBottom: '8px', fontWeight: '500', color: '#334155' }}>
                  Deletion Reason (Optional)
                </label>
                <textarea
                  value={deleteClientReason}
                  onChange={(e) => setDeleteClientReason(e.target.value)}
                  placeholder="Why is this client being deleted?"
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '12px',
                    border: '1px solid #cbd5e1',
                    borderRadius: '8px',
                    fontSize: '14px',
                    fontFamily: 'inherit',
                    resize: 'vertical'
                  }}
                />
              </div>

              <p style={{ marginBottom: '12px', fontWeight: '500', color: '#dc2626' }}>
                Type <strong>DELETE</strong> to confirm:
              </p>
              <input
                type="text"
                value={deleteClientConfirmText}
                onChange={(e) => setDeleteClientConfirmText(e.target.value.toUpperCase())}
                placeholder="Type DELETE to confirm"
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '2px solid #fecaca',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '2px'
                }}
              />
              
              {clientsList.length <= 1 && (
                <div style={{
                  marginTop: '12px',
                  background: '#fef3c7',
                  border: '1px solid #fcd34d',
                  color: '#92400e',
                  padding: '10px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px'
                }}>
                  <AlertTriangle size={16} />
                  Cannot delete the last remaining client.
                </div>
              )}
            </div>
            
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => {
                setShowDeleteClientModal(false);
                setDeleteClientConfirmText('');
                setDeleteClientReason('');
              }}>
                Cancel
              </button>
              <button 
                className="btn-primary" 
                style={{ 
                  background: deleteClientConfirmText === 'DELETE' && clientsList.length > 1 ? '#dc2626' : '#94a3b8',
                  cursor: deleteClientConfirmText === 'DELETE' && clientsList.length > 1 ? 'pointer' : 'not-allowed'
                }}
                onClick={handleDeleteClient}
                disabled={deleteClientConfirmText !== 'DELETE' || clientsList.length <= 1}
              >
                <Trash2 size={16} />
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}
      
      {unsavedNavTarget && (
        <div className="modal-overlay" style={{ zIndex: 9999 }} onClick={() => setUnsavedNavTarget(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
            <div style={{ padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  background: '#fffbeb',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}>
                  <AlertTriangle size={20} style={{ color: '#f59e0b' }} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600', color: '#0f172a' }}>Unsaved Changes</h3>
                  <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
                    {unsavedNavTarget.source === 'editLayout'
                      ? 'You have unsaved layout changes.'
                      : 'You have unsaved changes in Data Management.'}
                  </p>
                </div>
              </div>
              <p style={{ fontSize: '14px', color: '#475569', marginBottom: '24px', lineHeight: '1.5' }}>
                Would you like to save your changes before continuing, or discard them?
              </p>
              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
                <button
                  onClick={() => setUnsavedNavTarget(null)}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    background: 'white',
                    color: '#475569',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Stay
                </button>
                <button
                  onClick={() => {
                    const target = unsavedNavTarget;
                    setUnsavedNavTarget(null);
                    if (target.source === 'editLayout') {
                      editLayout.cancelEditing();
                    } else {
                      setAdminHasUnsavedChanges(false);
                    }
                    if (target.type === 'page') {
                      doNavigate(target.value);
                    } else if (target.type === 'client') {
                      doClientSwitch(target.value);
                    }
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: '1px solid #fca5a5',
                    background: '#fef2f2',
                    color: '#dc2626',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Discard
                </button>
                <button
                  onClick={async () => {
                    const target = unsavedNavTarget;
                    setUnsavedNavTarget(null);
                    if (target.source === 'editLayout') {
                      await editLayout.saveEditing();
                    } else {
                      if (adminSaveRef.current) {
                        await adminSaveRef.current();
                      }
                      setAdminHasUnsavedChanges(false);
                    }
                    if (target.type === 'page') {
                      doNavigate(target.value);
                    } else if (target.type === 'client') {
                      doClientSwitch(target.value);
                    }
                  }}
                  style={{
                    padding: '10px 18px',
                    borderRadius: '8px',
                    border: 'none',
                    background: customization.branding?.primaryColor || '#0ea5e9',
                    color: 'white',
                    fontSize: '14px',
                    fontWeight: '600',
                    cursor: 'pointer'
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Save size={15} />
                    Save & Continue
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showSaveToast && (
        <div className="data-saved-toast">
          Data saved successfully
        </div>
      )}
    </>
  );
}
