import React, { useState, useEffect, createContext, useContext, useRef, useCallback } from "react";
import ReactDOM from "react-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Area, AreaChart,
  PieChart as RechartsPieChart, Pie, Cell, Legend,
  RadialBarChart, RadialBar, ComposedChart, Scatter
} from "recharts";
import { LayoutDashboard, Users, DollarSign, Heart, MessageSquare, Lightbulb, ChevronRight, ChevronLeft, TrendingUp, Activity, Calendar, Download, Building2, Clock, Settings, Save, CheckCircle, HelpCircle, AlertCircle, Mail, Phone, FileText, Lock, LogOut, Shield, Eye, EyeOff, UserCheck, ClipboardList, AlertTriangle, Palette, Image, Type, GripVertical, ToggleLeft, ToggleRight, RefreshCw, Upload, Trash2, Plus, Minus, X, ChevronUp, ChevronDown, Bell, BellRing, Zap, Target, UserCog, ArrowLeft, CreditCard as Edit3, Star, Award, Briefcase, PieChart, BarChart2, Grid2x2 as Grid, LayoutGrid as Layout, Building, Layers, Copy, Move, Maximize2, Minimize2, CreditCard as Edit2, Pencil, RotateCcw } from "lucide-react";
import { supabase, supabaseAuth, supabaseData } from '../lib/supabaseAuth';
// Log initialization for debugging


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
// WIDGET CONFIGURATION DATABASE HELPERS
// ============================================================
// Functions to interact with the widget_configurations table in Supabase

const widgetConfigDB = {
  async getWidgetConfigs(clientId, pageId = null) {
    try {
      let query = supabase
        .from('widget_configurations')
        .select('*')
        .eq('client_id', clientId)
        .eq('enabled', true)
        .order('order', { ascending: true });

      if (pageId) {
        query = query.eq('page_id', pageId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching widget configs:', error);
      return [];
    }
  },

  async saveWidgetConfig(config) {
    try {
      const { data, error } = await supabase
        .from('widget_configurations')
        .upsert({
          ...config,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'client_id,page_id,widget_id'
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error saving widget config:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteWidgetConfig(id) {
    try {
      const { error } = await supabase
        .from('widget_configurations')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting widget config:', error);
      return { success: false, error: error.message };
    }
  },

  async updateWidgetConfig(id, updates) {
    try {
      const { data, error } = await supabase
        .from('widget_configurations')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error updating widget config:', error);
      return { success: false, error: error.message };
    }
  },

  async getAllWidgetConfigs(clientId) {
    try {
      const { data, error } = await supabase
        .from('widget_configurations')
        .select('*')
        .eq('client_id', clientId)
        .order('order', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching all widget configs:', error);
      return [];
    }
  },
};

// ============================================================
// WIDGET TYPE DEFINITIONS
// ============================================================
// Defines available widget types and their configuration schemas

const WIDGET_TYPES = {
  PIE_CHART: { id: 'pie-chart', name: 'Pie Chart', icon: 'PieChart', category: 'chart' },
  DONUT_CHART: { id: 'donut-chart', name: 'Donut Chart', icon: 'PieChart', category: 'chart' },
  BAR_CHART: { id: 'bar-chart', name: 'Bar Chart', icon: 'BarChart2', category: 'chart' },
  HORIZONTAL_BAR: { id: 'horizontal-bar', name: 'Horizontal Bar', icon: 'BarChart2', category: 'chart' },
  COMBO_CHART: { id: 'combo-chart', name: 'Combo Chart', icon: 'Activity', category: 'chart' },
  AREA_CHART: { id: 'area-chart', name: 'Area Chart', icon: 'TrendingUp', category: 'chart' },
  LINE_CHART: { id: 'line-chart', name: 'Line Chart', icon: 'TrendingUp', category: 'chart' },
  GAUGE_CHART: { id: 'gauge-chart', name: 'Gauge Chart', icon: 'Target', category: 'indicator' },
  PROGRESS_BAR: { id: 'progress-bar', name: 'Progress Bar', icon: 'Activity', category: 'indicator' },
  KPI_CARD: { id: 'kpi-card', name: 'KPI Card', icon: 'Star', category: 'indicator' },
  METRIC_COMPARISON: { id: 'metric-comparison', name: 'Metric Comparison', icon: 'BarChart2', category: 'indicator' },
  DATA_TABLE: { id: 'data-table', name: 'Data Table', icon: 'FileText', category: 'data' },
  FUNNEL_CHART: { id: 'funnel-chart', name: 'Funnel Chart', icon: 'TrendingUp', category: 'data' },
};

const WIDGET_CONFIG_FIELDS = {
  'pie-chart': [
    { id: 'title', label: 'Chart Title', type: 'text', required: true, placeholder: 'e.g., Patient Distribution', hint: 'Give your chart a descriptive title' },
    { id: 'segments', label: 'Data Segments', type: 'segments', required: true, hint: 'Add segments with names and values. Each segment represents a portion of the whole.' },
  ],
  'donut-chart': [
    { id: 'title', label: 'Chart Title', type: 'text', required: true, placeholder: 'e.g., Revenue Breakdown', hint: 'Give your chart a descriptive title' },
    { id: 'centerLabel', label: 'Center Label', type: 'text', placeholder: 'e.g., Total', hint: 'Optional label shown in the center' },
    { id: 'segments', label: 'Data Segments', type: 'segments', required: true, hint: 'Add segments with names and values' },
  ],
  'bar-chart': [
    { id: 'title', label: 'Chart Title', type: 'text', required: true, placeholder: 'e.g., Monthly Enrollments', hint: 'Give your chart a descriptive title' },
    { id: 'xAxisLabel', label: 'X-Axis Label', type: 'text', placeholder: 'e.g., Month', hint: 'Label for the horizontal axis' },
    { id: 'yAxisLabel', label: 'Y-Axis Label', type: 'text', placeholder: 'e.g., Patients', hint: 'Label for the vertical axis' },
    { id: 'dataPoints', label: 'Data Points', type: 'datapoints', required: true, hint: 'Add data points with labels and values' },
  ],
  'horizontal-bar': [
    { id: 'title', label: 'Chart Title', type: 'text', required: true, placeholder: 'e.g., Top Campaigns', hint: 'Give your chart a descriptive title' },
    { id: 'xAxisLabel', label: 'Value Label', type: 'text', placeholder: 'e.g., Conversions', hint: 'Label for the horizontal values' },
    { id: 'yAxisLabel', label: 'Category Label', type: 'text', placeholder: 'e.g., Campaign', hint: 'Label for the vertical categories' },
    { id: 'dataPoints', label: 'Data Points', type: 'datapoints', required: true, hint: 'Add data points with labels and values' },
  ],
  'line-chart': [
    { id: 'title', label: 'Chart Title', type: 'text', required: true, placeholder: 'e.g., Growth Trend', hint: 'Give your chart a descriptive title' },
    { id: 'xAxisLabel', label: 'X-Axis Label', type: 'text', placeholder: 'e.g., Month', hint: 'Label for the horizontal axis' },
    { id: 'yAxisLabel', label: 'Y-Axis Label', type: 'text', placeholder: 'e.g., Count', hint: 'Label for the vertical axis' },
    { id: 'dataPoints', label: 'Data Points', type: 'datapoints', required: true, hint: 'Add data points with labels and values (chronological order recommended)' },
  ],
  'area-chart': [
    { id: 'title', label: 'Chart Title', type: 'text', required: true, placeholder: 'e.g., Revenue Trend', hint: 'Give your chart a descriptive title' },
    { id: 'xAxisLabel', label: 'X-Axis Label', type: 'text', placeholder: 'e.g., Month', hint: 'Label for the horizontal axis' },
    { id: 'yAxisLabel', label: 'Y-Axis Label', type: 'text', placeholder: 'e.g., Revenue', hint: 'Label for the vertical axis' },
    { id: 'dataPoints', label: 'Data Points', type: 'datapoints', required: true, hint: 'Add data points with labels and values' },
  ],
  'combo-chart': [
    { id: 'title', label: 'Chart Title', type: 'text', required: true, placeholder: 'e.g., Sales & Conversions', hint: 'Give your chart a descriptive title' },
    { id: 'xAxisLabel', label: 'X-Axis Label', type: 'text', placeholder: 'e.g., Month', hint: 'Label for the horizontal axis' },
    { id: 'yAxisLabel', label: 'Y-Axis Label', type: 'text', placeholder: 'e.g., Value', hint: 'Label for the vertical axis' },
    { id: 'barDataPoints', label: 'Bar Data', type: 'datapoints', required: true, hint: 'Data for bars (e.g., volume metrics)' },
    { id: 'lineDataPoints', label: 'Line Data', type: 'datapoints', required: true, hint: 'Data for line (e.g., rates or trends)' },
  ],
  'gauge-chart': [
    { id: 'title', label: 'Metric Title', type: 'text', required: true, placeholder: 'e.g., Patient Satisfaction', hint: 'Name of the metric being measured' },
    { id: 'currentValue', label: 'Current Value', type: 'number', required: true, placeholder: 'e.g., 85', hint: 'Current measurement value' },
    { id: 'maxValue', label: 'Maximum Value', type: 'number', required: true, placeholder: 'e.g., 100', hint: 'Maximum possible value' },
    { id: 'targetValue', label: 'Target Value', type: 'number', placeholder: 'e.g., 90', hint: 'Optional target threshold' },
    { id: 'unit', label: 'Unit', type: 'text', placeholder: 'e.g., %, pts, score', hint: 'Unit of measurement' },
  ],
  'progress-bar': [
    { id: 'title', label: 'Metric Title', type: 'text', required: true, placeholder: 'e.g., Goal Progress', hint: 'Name of the metric being tracked' },
    { id: 'currentValue', label: 'Current Value', type: 'number', required: true, placeholder: 'e.g., 750', hint: 'Current progress value' },
    { id: 'maxValue', label: 'Target Value', type: 'number', required: true, placeholder: 'e.g., 1000', hint: 'Target or maximum value' },
    { id: 'unit', label: 'Unit', type: 'text', placeholder: 'e.g., patients, $, enrollments', hint: 'Unit of measurement' },
  ],
  'kpi-card': [
    { id: 'title', label: 'KPI Title', type: 'text', required: true, placeholder: 'e.g., Active Patients', hint: 'Name of the key metric' },
    { id: 'value', label: 'Current Value', type: 'number', required: true, placeholder: 'e.g., 1250', hint: 'Current value of the metric' },
    { id: 'previousValue', label: 'Previous Value', type: 'number', placeholder: 'e.g., 1100', hint: 'Previous period value for trend calculation' },
    { id: 'unit', label: 'Unit', type: 'text', placeholder: 'e.g., patients, $, %', hint: 'Unit of measurement' },
    { id: 'comparisonPeriod', label: 'Comparison Period', type: 'select', options: ['vs. Last Month', 'vs. Last Quarter', 'vs. Last Year', 'vs. Target'], hint: 'What period to compare against' },
  ],
  'metric-comparison': [
    { id: 'title', label: 'Comparison Title', type: 'text', required: true, placeholder: 'e.g., Key Metrics', hint: 'Title for the comparison section' },
    { id: 'metrics', label: 'Metrics', type: 'metrics', required: true, hint: 'Add up to 4 metrics to compare side-by-side' },
  ],
  'data-table': [
    { id: 'title', label: 'Table Title', type: 'text', required: true, placeholder: 'e.g., Patient Details', hint: 'Title for the data table' },
    { id: 'columns', label: 'Column Headers', type: 'array', required: true, placeholder: 'e.g., Name, Age, Status', hint: 'Comma-separated column names' },
    { id: 'rows', label: 'Table Data', type: 'table', required: true, hint: 'Enter data for each row' },
  ],
  'funnel-chart': [
    { id: 'title', label: 'Funnel Title', type: 'text', required: true, placeholder: 'e.g., Enrollment Funnel', hint: 'Title for the funnel chart' },
    { id: 'stages', label: 'Funnel Stages', type: 'datapoints', required: true, hint: 'Add stages in order from top to bottom with their values' },
  ],
};

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

// Field Definition Schema
const createFieldDef = (id, options = {}) => ({
  id,
  metricId: options.metricId || id,  // References METRIC_REGISTRY if exists
  label: options.label || id,
  shortLabel: options.shortLabel || options.label || id,
  placeholder: options.placeholder || '',
  helperText: options.helperText || '',
  fieldType: options.fieldType || FIELD_TYPES.NUMBER,
  prefix: options.prefix || '',      // e.g., '$' for currency
  suffix: options.suffix || '',      // e.g., '%' for percent
  defaultValue: options.defaultValue ?? (options.fieldType === FIELD_TYPES.TEXT ? '' : 0),
  validation: options.validation || [],
  required: options.required ?? false,
  editable: options.editable ?? true,   // Can admin edit this field's label?
  removable: options.removable ?? true, // Can admin remove this field?
  order: options.order || 0,
  // For SELECT fields
  options: options.options || [],
  // Visibility
  internalOnly: options.internalOnly ?? false,
  visibleTo: options.visibleTo || ['admin', 'csm', 'client'],
});

// Section Definition Schema
const createFormSection = (id, options = {}) => ({
  id,
  title: options.title || 'Section',
  subtitle: options.subtitle || '',
  icon: options.icon || 'FileText',
  iconColor: options.iconColor || 'brand',
  enabled: options.enabled ?? true,
  collapsed: options.collapsed ?? false,
  collapsible: options.collapsible ?? true,
  order: options.order || 0,
  fields: options.fields || [],
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
        createFieldDef('revenue', {
          metricId: 'revenue',
          label: 'Revenue This Month',
          placeholder: 'e.g., 12560',
          fieldType: FIELD_TYPES.CURRENCY,
          prefix: '$',
          order: 3,
        }),
      ],
    }),
    createFormSection('enrollmentFunnel', {
      title: 'Enrollment Funnel',
      subtitle: 'Track conversion from contact to enrollment',
      icon: 'Users',
      iconColor: 'blue',
      order: 1,
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
  ],
  // Custom metrics registry - for client-defined metrics not in base registry
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
      title: 'Enrollment Funnel',
      subtitle: 'Track conversion from contact to enrollment',
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
    logoUrl: null, // null = use default icon
    logoText: 'PrysmCS',
    logoMode: 'default', // 'default' = shield + text, 'icon-text' = uploaded icon + text, 'full-image' = just uploaded image
    primaryColor: '#06b6d4', // cyan-500 - bright teal accent
    secondaryColor: '#0f172a', // slate-900 - deep navy blue
    accentColor: '#14b8a6', // teal-500 - secondary accent
    sidebarBg: 'linear-gradient(180deg, #0a2540 0%, #0f172a 100%)', // deep navy gradient
    sidebarTextColor: '#e2e8f0', // slate-200 - light gray text
    slideBg: 'linear-gradient(135deg, #0a2540 0%, #0f172a 50%, #1e293b 100%)', // dark navy presentation
    headerBg: '#0f172a',
    fontFamily: 'Inter', // modern sans-serif font
  },
  navigation: {
    tabs: [
      { id: 'overview', label: 'Overview', icon: 'LayoutDashboard', enabled: true, order: 0 },
      { id: 'enrollment', label: 'Enrollment', icon: 'Users', enabled: true, order: 1 },
      { id: 'financial', label: 'Financial', icon: 'DollarSign', enabled: true, order: 2 },
      { id: 'outcomes', label: 'Outcomes', icon: 'Heart', enabled: true, order: 3 },
      { id: 'stories', label: 'Success Stories', icon: 'MessageSquare', enabled: true, order: 4 },
      { id: 'initiatives', label: 'Strategic Priorities', icon: 'Lightbulb', enabled: true, order: 5 },
      { id: 'opportunities', label: 'Opportunities', icon: 'TrendingUp', enabled: true, order: 6 },
    ],
  },
  widgets: {
    overview: [
      { id: 'kpi-cards', label: 'KPI Cards', enabled: true, order: 0 },
      { id: 'enrollment-chart', label: 'Enrollment Trend Chart', enabled: true, order: 1 },
      { id: 'revenue-chart', label: 'Revenue Chart', enabled: true, order: 2 },
    ],
    enrollment: [
      { id: 'funnel', label: 'Enrollment Funnel', enabled: true, order: 0 },
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
  activeAlerts: [
    { id: 1, type: 'opportunity', title: 'Upsell Opportunity', message: 'Apex Solutions showing 40% engagement increase - good time for expansion', time: '2 hours ago', status: 'active', createdAt: new Date().toISOString() },
    { id: 2, type: 'warning', title: 'Metric Alert', message: 'Cascade Enterprises enrollment down 12% this month', time: '5 hours ago', status: 'active', createdAt: new Date().toISOString() },
    { id: 3, type: 'info', title: 'Campaign Launched', message: 'Q4 Outreach campaign is now active for 3 clients', time: '1 day ago', status: 'active', createdAt: new Date().toISOString() },
    { id: 4, type: 'inactive', title: 'Client Inactivity', message: "Coastal Care hasn't logged in for 32 days", time: '2 days ago', status: 'active', createdAt: new Date().toISOString() },
  ],
  // Form Schema - defines the Monthly Data entry form structure
  formSchema: DEFAULT_FORM_SCHEMA,
};

const CustomizationContext = createContext(null);

function CustomizationProvider({ children }) {
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
            return tab;
          });
        }

        // Deep merge with defaults to ensure new properties are included
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
          },
          widgets: {
            ...defaultCustomization.widgets,
            ...(parsed.widgets || {}),
          },
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

  useEffect(() => {
    localStorage.setItem('medkick_customization', JSON.stringify(customization));
    
    // Apply CSS custom properties for colors
    const root = document.documentElement;
    root.style.setProperty('--brand-primary', customization.branding.primaryColor);
    root.style.setProperty('--brand-secondary', customization.branding.secondaryColor);
    root.style.setProperty('--brand-accent', customization.branding.accentColor);
  }, [customization]);

  const updateBranding = (updates) => {
    setCustomization(prev => ({
      ...prev,
      branding: { ...prev.branding, ...updates }
    }));
  };

  const updateTab = (tabId, updates) => {
    setCustomization(prev => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        tabs: prev.navigation.tabs.map(tab => 
          tab.id === tabId ? { ...tab, ...updates } : tab
        )
      }
    }));
  };

  const reorderTabs = (newOrder) => {
    setCustomization(prev => ({
      ...prev,
      navigation: {
        ...prev.navigation,
        tabs: newOrder.map((tab, index) => ({ ...tab, order: index }))
      }
    }));
  };

  const updateWidget = (pageId, widgetId, updates) => {
    setCustomization(prev => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [pageId]: prev.widgets[pageId].map(widget =>
          widget.id === widgetId ? { ...widget, ...updates } : widget
        )
      }
    }));
  };

  const reorderWidgets = (pageId, newOrder) => {
    setCustomization(prev => ({
      ...prev,
      widgets: {
        ...prev.widgets,
        [pageId]: newOrder.map((widget, index) => ({ ...widget, order: index }))
      }
    }));
  };

  const resetToDefaults = () => {
    // Clear saved customization and restore defaults
    localStorage.removeItem('medkick_customization');
    setCustomization(JSON.parse(JSON.stringify(defaultCustomization)));
  };

  const getEnabledTabs = () => {
    return [...customization.navigation.tabs]
      .filter(tab => tab.enabled)
      .sort((a, b) => a.order - b.order);
  };

  const getEnabledWidgets = (pageId) => {
    const widgets = customization.widgets[pageId] || [];
    return [...widgets]
      .filter(w => w.enabled)
      .sort((a, b) => a.order - b.order);
  };

  const updateNotification = (category, itemKey, updates) => {
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
  };

  const updateWorkflow = (workflowKey, updates) => {
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
  };

  const addAlert = (alert) => {
    setCustomization(prev => ({
      ...prev,
      activeAlerts: [...(prev.activeAlerts || []), { ...alert, id: Date.now(), status: 'active', createdAt: new Date().toISOString() }]
    }));
  };

  const dismissAlert = (alertId) => {
    setCustomization(prev => ({
      ...prev,
      activeAlerts: (prev.activeAlerts || []).map(a => 
        a.id === alertId ? { ...a, status: 'dismissed', dismissedAt: new Date().toISOString() } : a
      )
    }));
  };

  const snoozeAlert = (alertId, snoozeDuration) => {
    const snoozeUntil = new Date(Date.now() + snoozeDuration * 60 * 60 * 1000).toISOString();
    setCustomization(prev => ({
      ...prev,
      activeAlerts: (prev.activeAlerts || []).map(a => 
        a.id === alertId ? { ...a, status: 'snoozed', snoozeUntil } : a
      )
    }));
  };

  const getActiveAlerts = () => {
    const now = new Date();
    return (customization.activeAlerts || []).filter(a => {
      if (a.status === 'dismissed') return false;
      if (a.status === 'snoozed' && new Date(a.snoozeUntil) > now) return false;
      return true;
    });
  };

  const getNotifications = () => {
    return customization.notifications || defaultCustomization.notifications;
  };

  const addReminder = (category, reminder) => {
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
  };

  const deleteReminder = (category, itemKey) => {
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
  };

  const addSmartAlert = (alert) => {
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
  };

  const deleteSmartAlert = (alertKey) => {
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
  };

  return (
    <CustomizationContext.Provider value={{
      customization,
      updateBranding,
      updateTab,
      reorderTabs,
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
      // Form Schema helpers
      getFormSchema: () => customization.formSchema || DEFAULT_FORM_SCHEMA,
      updateFormSchema: (updates) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: { ...(prev.formSchema || DEFAULT_FORM_SCHEMA), ...updates },
        }));
      },
      addFormSection: (section) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: addFormSection(prev.formSchema || DEFAULT_FORM_SCHEMA, section),
        }));
      },
      removeFormSection: (sectionId) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: removeFormSection(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId),
        }));
      },
      updateFormSection: (sectionId, updates) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: updateFormSection(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId, updates),
        }));
      },
      reorderFormSections: (newOrder) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: reorderFormSections(prev.formSchema || DEFAULT_FORM_SCHEMA, newOrder),
        }));
      },
      addFieldToSection: (sectionId, field) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: addFieldToSection(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId, field),
        }));
      },
      removeFieldFromSection: (sectionId, fieldId) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: removeFieldFromSection(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId, fieldId),
        }));
      },
      updateFormField: (sectionId, fieldId, updates) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: updateField(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId, fieldId, updates),
        }));
      },
      reorderFieldsInSection: (sectionId, newOrder) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: reorderFieldsInSection(prev.formSchema || DEFAULT_FORM_SCHEMA, sectionId, newOrder),
        }));
      },
      addCustomMetric: (metric) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: addCustomMetric(prev.formSchema || DEFAULT_FORM_SCHEMA, metric),
        }));
      },
      removeCustomMetric: (metricId) => {
        setCustomization(prev => ({
          ...prev,
          formSchema: removeCustomMetric(prev.formSchema || DEFAULT_FORM_SCHEMA, metricId),
        }));
      },
      // Export schema helpers and constants
      FIELD_TYPES,
      VALIDATION_RULES,
      createFieldDef,
      createFormSection,
    }}>
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

const DashboardEditContext = createContext(null);

function DashboardEditProvider({ children, clientId }) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentPage, setCurrentPage] = useState(null);
  const [widgetPositions, setWidgetPositions] = useState({});
  const [savedPositions, setSavedPositions] = useState({});
  const [widgetOrder, setWidgetOrder] = useState({});
  const [previewPositions, setPreviewPositions] = useState({});
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [resizingWidget, setResizingWidget] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [dropTarget, setDropTarget] = useState(null);
  const [displacedWidgets, setDisplacedWidgets] = useState([]);
  const [insertionIndex, setInsertionIndex] = useState(null);
  const [dragOverlayPosition, setDragOverlayPosition] = useState(null);
  const [dragCommitted, setDragCommitted] = useState(false);
  const [needsPositionInit, setNeedsPositionInit] = useState(false);
  const [undoHistory, setUndoHistory] = useState({});
  const [currentHistoryIndex, setCurrentHistoryIndex] = useState({});

  const dragStartPositionRef = useRef(null);
  const widgetRectsRef = useRef({});
  const animatingWidgetsRef = useRef(new Set());
  const lastCrossedCenterRef = useRef(null);
  const loadedPagesRef = useRef(new Set());

  const DRAG_THRESHOLD = 8;
  const GRID_COLUMNS = 12;
  const WIDGET_GAP = 1;
  const MAX_HISTORY = 20;

  useEffect(() => {
    if (currentPage && clientId && !loadedPagesRef.current.has(currentPage)) {
      loadPageLayout(currentPage);
    }
  }, [currentPage, clientId]);

  const loadPageLayout = async (pageId) => {
    try {
      const { data, error } = await supabase
        .from('page_layouts')
        .select('*')
        .eq('client_id', clientId)
        .eq('page_id', pageId)
        .maybeSingle();

      if (data?.layout_config?.widgetPositions) {
        const positions = data.layout_config.widgetPositions;
        console.debug(`[PrysmCS] Loading ${Object.keys(positions).length} widget positions for page ${pageId} from database`);

        const { corrected, positions: finalPositions } = autoCorrectOverlaps(pageId, positions);

        setWidgetPositions(prev => ({
          ...prev,
          [pageId]: finalPositions
        }));
        setSavedPositions(prev => ({
          ...prev,
          [pageId]: JSON.parse(JSON.stringify(finalPositions))
        }));

        if (data?.layout_config?.widgetOrder) {
          setWidgetOrder(prev => ({
            ...prev,
            [pageId]: data.layout_config.widgetOrder
          }));
        }

        loadedPagesRef.current.add(pageId);
        return { success: true, positionsLoaded: true, corrected };
      }

      console.debug(`[PrysmCS] No saved layout found for page ${pageId}`);
      return { success: true, positionsLoaded: false, corrected: false };
    } catch (error) {
      console.error('[PrysmCS] Error loading page layout:', error);
      return { success: false, positionsLoaded: false, corrected: false, error };
    }
  };

  const savePageLayout = async (pageId, positions, order) => {
    setIsSaving(true);
    try {
      const layoutConfig = {
        widgetPositions: positions,
        widgetOrder: order || widgetOrder[pageId] || []
      };
      const { error } = await supabase
        .from('page_layouts')
        .upsert({
          client_id: clientId,
          page_id: pageId,
          layout_config: layoutConfig,
          updated_at: new Date().toISOString()
        }, { onConflict: 'client_id,page_id' });

      if (error) throw error;
      setSavedPositions(prev => ({
        ...prev,
        [pageId]: JSON.parse(JSON.stringify(positions))
      }));
      setHasUnsavedChanges(false);
      return { success: true };
    } catch (error) {
      console.error('Error saving layout:', error);
      return { success: false, error };
    } finally {
      setIsSaving(false);
    }
  };

  const getWidgetSizesMap = (pageId, allWidgetPositions = null) => {
    const positions = allWidgetPositions || widgetPositions[pageId] || {};
    const sizesMap = {};

    Object.entries(positions).forEach(([widgetId, pos]) => {
      sizesMap[widgetId] = {
        gridWidth: pos.gridWidth || 6,
        gridHeight: pos.gridHeight || 1
      };
    });

    return sizesMap;
  };

  const calculateReflowLayout = (orderedWidgetIds, widgetSizes, columnCount = 12) => {
    const positions = {};
    let currentRow = 1;
    let currentColumn = 1;
    let rowBottom = 1;

    orderedWidgetIds.forEach(widgetId => {
      const size = widgetSizes[widgetId] || { gridWidth: 6, gridHeight: 1 };
      const { gridWidth, gridHeight } = size;

      if (currentColumn + gridWidth - 1 > columnCount) {
        currentRow = rowBottom;
        currentColumn = 1;
      }

      positions[widgetId] = {
        gridColumn: currentColumn,
        gridRow: currentRow,
        gridWidth,
        gridHeight
      };

      currentColumn += gridWidth;
      rowBottom = Math.max(rowBottom, currentRow + gridHeight);
    });

    return positions;
  };

  const detectOverlaps = (positions) => {
    const widgetIds = Object.keys(positions);
    const overlapping = [];

    for (let i = 0; i < widgetIds.length; i++) {
      for (let j = i + 1; j < widgetIds.length; j++) {
        const widgetA = positions[widgetIds[i]];
        const widgetB = positions[widgetIds[j]];

        const aRowStart = widgetA.gridRow || 1;
        const aRowEnd = aRowStart + (widgetA.gridHeight || 1) - 1;
        const aColStart = widgetA.gridColumn || 1;
        const aColEnd = aColStart + (widgetA.gridWidth || 6) - 1;

        const bRowStart = widgetB.gridRow || 1;
        const bRowEnd = bRowStart + (widgetB.gridHeight || 1) - 1;
        const bColStart = widgetB.gridColumn || 1;
        const bColEnd = bColStart + (widgetB.gridWidth || 6) - 1;

        const rowOverlap = aRowStart <= bRowEnd && bRowStart <= aRowEnd;
        const colOverlap = aColStart <= bColEnd && bColStart <= aColEnd;

        if (rowOverlap && colOverlap) {
          overlapping.push({ widgetA: widgetIds[i], widgetB: widgetIds[j] });
        }
      }
    }

    return overlapping;
  };

  const autoCorrectOverlaps = (pageId, positions) => {
    const overlaps = detectOverlaps(positions);

    if (overlaps.length === 0) {
      return { corrected: false, positions };
    }

    console.debug(`[PrysmCS] Detected ${overlaps.length} overlapping widget(s) on page ${pageId}, auto-correcting...`);
    overlaps.forEach(({ widgetA, widgetB }) => {
      console.debug(`[PrysmCS] Overlap between ${widgetA} and ${widgetB}`);
    });

    const widgetIds = Object.keys(positions);
    const sortedWidgetIds = widgetIds.sort((a, b) => {
      const posA = positions[a];
      const posB = positions[b];
      const orderA = posA.order ?? 999;
      const orderB = posB.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      if (posA.gridRow !== posB.gridRow) return posA.gridRow - posB.gridRow;
      if (posA.gridColumn !== posB.gridColumn) return posA.gridColumn - posB.gridColumn;
      return a.localeCompare(b);
    });

    const widgetSizes = {};
    widgetIds.forEach(id => {
      widgetSizes[id] = {
        gridWidth: positions[id].gridWidth || 6,
        gridHeight: positions[id].gridHeight || 1
      };
    });

    const correctedPositions = calculateReflowLayout(sortedWidgetIds, widgetSizes, GRID_COLUMNS);

    widgetIds.forEach(id => {
      correctedPositions[id] = {
        ...correctedPositions[id],
        order: positions[id].order
      };
    });

    console.debug(`[PrysmCS] Overlap correction complete for page ${pageId}`);
    return { corrected: true, positions: correctedPositions };
  };

  const calculateInitialPositions = (pageId, defaultPositions) => {
    console.debug(`[PrysmCS] Calculating initial positions for page ${pageId} from ${Object.keys(defaultPositions).length} widget defaults`);

    const overlaps = detectOverlaps(defaultPositions);

    if (overlaps.length === 0) {
      console.debug(`[PrysmCS] No overlaps detected in defaults, using as-is`);
      return defaultPositions;
    }

    console.debug(`[PrysmCS] Detected ${overlaps.length} overlapping default position(s), recalculating layout`);

    const widgetIds = Object.keys(defaultPositions);
    const sortedWidgetIds = widgetIds.sort((a, b) => {
      const posA = defaultPositions[a];
      const posB = defaultPositions[b];
      const orderA = posA.order ?? 999;
      const orderB = posB.order ?? 999;
      if (orderA !== orderB) return orderA - orderB;
      if (posA.gridRow !== posB.gridRow) return posA.gridRow - posB.gridRow;
      if (posA.gridColumn !== posB.gridColumn) return posA.gridColumn - posB.gridColumn;
      return a.localeCompare(b);
    });

    const widgetSizes = {};
    widgetIds.forEach(id => {
      widgetSizes[id] = {
        gridWidth: defaultPositions[id].gridWidth || 6,
        gridHeight: defaultPositions[id].gridHeight || 1
      };
    });

    const calculatedPositions = calculateReflowLayout(sortedWidgetIds, widgetSizes, GRID_COLUMNS);

    widgetIds.forEach(id => {
      calculatedPositions[id] = {
        ...calculatedPositions[id],
        order: defaultPositions[id].order
      };
    });

    console.debug(`[PrysmCS] Initial positions calculated successfully for page ${pageId}`);
    return calculatedPositions;
  };

  const initializeWidgetOrder = (pageId, allWidgetPositions = null) => {
    if (widgetOrder[pageId]?.length > 0) {
      return widgetOrder[pageId];
    }

    const positions = allWidgetPositions || widgetPositions[pageId] || {};
    const widgets = Object.entries(positions).map(([id, pos]) => ({
      id,
      order: pos.order ?? 999,
      gridRow: pos.gridRow || 1,
      gridColumn: pos.gridColumn || 1
    }));

    widgets.sort((a, b) => {
      if (a.order !== b.order) return a.order - b.order;
      if (a.gridRow !== b.gridRow) return a.gridRow - b.gridRow;
      if (a.gridColumn !== b.gridColumn) return a.gridColumn - b.gridColumn;
      return a.id.localeCompare(b.id);
    });

    return widgets.map(w => w.id);
  };

  const detectInsertionIndex = (mouseX, mouseY, gridRect, currentOrder, allPositions, draggedWidgetId) => {
    if (!gridRect || !currentOrder || currentOrder.length === 0) {
      return { index: 0, targetWidgetId: null };
    }

    const columnWidth = gridRect.width / GRID_COLUMNS;
    const rowHeight = 80;

    let hoveredWidget = null;
    let closestWidget = null;
    let minDistance = Infinity;

    currentOrder.forEach(widgetId => {
      if (widgetId === draggedWidgetId) return;

      const pos = allPositions[widgetId];
      if (!pos) return;

      const widgetLeft = (pos.gridColumn - 1) * columnWidth;
      const widgetTop = (pos.gridRow - 1) * rowHeight;
      const widgetRight = widgetLeft + pos.gridWidth * columnWidth;
      const widgetBottom = widgetTop + pos.gridHeight * rowHeight;

      const isInsideX = mouseX >= widgetLeft && mouseX <= widgetRight;
      const isInsideY = mouseY >= widgetTop && mouseY <= widgetBottom;

      if (isInsideX && isInsideY) {
        hoveredWidget = { widgetId, pos, left: widgetLeft, top: widgetTop, right: widgetRight, bottom: widgetBottom };
      }

      const widgetCenterX = (widgetLeft + widgetRight) / 2;
      const widgetCenterY = (widgetTop + widgetBottom) / 2;

      const distance = Math.sqrt(
        Math.pow(mouseX - widgetCenterX, 2) +
        Math.pow(mouseY - widgetCenterY, 2)
      );

      if (distance < minDistance) {
        minDistance = distance;
        closestWidget = { widgetId, pos, centerX: widgetCenterX, centerY: widgetCenterY, left: widgetLeft, top: widgetTop, right: widgetRight, bottom: widgetBottom };
      }
    });

    const targetWidget = hoveredWidget || closestWidget;

    if (!targetWidget) {
      return { index: currentOrder.length, targetWidgetId: null };
    }

    const currentIndex = currentOrder.indexOf(draggedWidgetId);
    const targetIndex = currentOrder.indexOf(targetWidget.widgetId);

    const widgetMidX = (targetWidget.left + targetWidget.right) / 2;
    const widgetMidY = (targetWidget.top + targetWidget.bottom) / 2;

    let insertBefore;
    if (hoveredWidget) {
      const relativeX = (mouseX - targetWidget.left) / (targetWidget.right - targetWidget.left);
      const relativeY = (mouseY - targetWidget.top) / (targetWidget.bottom - targetWidget.top);

      if (relativeY < 0.3) {
        insertBefore = true;
      } else if (relativeY > 0.7) {
        insertBefore = false;
      } else {
        insertBefore = relativeX < 0.5;
      }
    } else {
      insertBefore = mouseY < widgetMidY || (mouseY >= widgetMidY && mouseX < widgetMidX);
    }

    let newIndex = insertBefore ? targetIndex : targetIndex + 1;

    if (currentIndex !== -1 && currentIndex < newIndex) {
      newIndex--;
    }

    return {
      index: Math.max(0, Math.min(newIndex, currentOrder.length)),
      targetWidgetId: targetWidget.widgetId
    };
  };


  const initializeWidgetPositionsFromDefaults = (pageId, defaultPositions) => {
    if (!widgetPositions[pageId] || Object.keys(widgetPositions[pageId]).length === 0) {
      const initialPositions = calculateInitialPositions(pageId, defaultPositions);

      setWidgetPositions(prev => ({
        ...prev,
        [pageId]: { ...initialPositions }
      }));
      setSavedPositions(prev => ({
        ...prev,
        [pageId]: JSON.parse(JSON.stringify(initialPositions))
      }));
    }
  };

  const enterEditMode = async (pageId) => {
    console.debug(`[PrysmCS] Entering edit mode for page ${pageId}`);
    setCurrentPage(pageId);

    if (widgetPositions[pageId] && Object.keys(widgetPositions[pageId]).length > 0) {
      console.debug(`[PrysmCS] Positions already loaded for page ${pageId}, entering edit mode directly`);
      setNeedsPositionInit(false);
      setIsEditMode(true);
      return;
    }

    const result = await loadPageLayout(pageId);

    if (result.positionsLoaded) {
      console.debug(`[PrysmCS] Positions loaded from database, enabling edit mode immediately`);
      setNeedsPositionInit(false);
      setIsEditMode(true);
    } else {
      console.debug(`[PrysmCS] No positions in database, waiting for initialization from defaults`);
      setNeedsPositionInit(true);
    }
  };

  const completeEditModeInitialization = () => {
    console.debug(`[PrysmCS] Position initialization complete, enabling edit mode`);
    setNeedsPositionInit(false);
    setIsEditMode(true);
  };

  const exitEditMode = () => {
    setIsEditMode(false);
    setNeedsPositionInit(false);
    setHasUnsavedChanges(false);
    setDropTarget(null);
    setPreviewPositions({});
  };

  const cancelEditMode = (pageId) => {
    if (savedPositions[pageId]) {
      setWidgetPositions(prev => ({
        ...prev,
        [pageId]: JSON.parse(JSON.stringify(savedPositions[pageId]))
      }));
    }
    exitEditMode();
  };

  const pushToHistory = (pageId) => {
    const currentPositions = widgetPositions[pageId];
    if (!currentPositions) return;

    setUndoHistory(prev => {
      const pageHistory = prev[pageId] || [];
      const currentIndex = currentHistoryIndex[pageId] ?? -1;

      const newHistory = [...pageHistory.slice(0, currentIndex + 1), JSON.parse(JSON.stringify(currentPositions))];

      if (newHistory.length > MAX_HISTORY) {
        newHistory.shift();
        return { ...prev, [pageId]: newHistory };
      }

      return { ...prev, [pageId]: newHistory };
    });

    setCurrentHistoryIndex(prev => {
      const pageHistory = (undoHistory[pageId] || []);
      const currentIndex = prev[pageId] ?? -1;
      const newIndex = Math.min(currentIndex + 1, MAX_HISTORY - 1);
      return { ...prev, [pageId]: newIndex };
    });
  };

  const undo = (pageId) => {
    const pageHistory = undoHistory[pageId];
    const currentIndex = currentHistoryIndex[pageId];

    if (!pageHistory || currentIndex === undefined || currentIndex <= 0) return false;

    const previousPositions = pageHistory[currentIndex - 1];

    setWidgetPositions(prev => ({
      ...prev,
      [pageId]: JSON.parse(JSON.stringify(previousPositions))
    }));

    setCurrentHistoryIndex(prev => ({
      ...prev,
      [pageId]: currentIndex - 1
    }));

    setHasUnsavedChanges(true);
    return true;
  };

  const redo = (pageId) => {
    const pageHistory = undoHistory[pageId];
    const currentIndex = currentHistoryIndex[pageId];

    if (!pageHistory || currentIndex === undefined || currentIndex >= pageHistory.length - 1) return false;

    const nextPositions = pageHistory[currentIndex + 1];

    setWidgetPositions(prev => ({
      ...prev,
      [pageId]: JSON.parse(JSON.stringify(nextPositions))
    }));

    setCurrentHistoryIndex(prev => ({
      ...prev,
      [pageId]: currentIndex + 1
    }));

    setHasUnsavedChanges(true);
    return true;
  };

  const canUndo = (pageId) => {
    const currentIndex = currentHistoryIndex[pageId];
    return currentIndex !== undefined && currentIndex > 0;
  };

  const canRedo = (pageId) => {
    const pageHistory = undoHistory[pageId];
    const currentIndex = currentHistoryIndex[pageId];
    return pageHistory && currentIndex !== undefined && currentIndex < pageHistory.length - 1;
  };

  const getAffectedWidgets = (pageId, movingWidgetId, newRow, direction) => {
    const positions = widgetPositions[pageId] || {};
    const movingWidget = positions[movingWidgetId];
    if (!movingWidget) return [];

    const movingColStart = movingWidget.gridColumn;
    const movingColEnd = movingWidget.gridColumn + movingWidget.gridWidth - 1;
    const movingHeight = movingWidget.gridHeight;

    const affected = [];

    Object.entries(positions).forEach(([widgetId, pos]) => {
      if (widgetId === movingWidgetId) return;

      const widgetColStart = pos.gridColumn;
      const widgetColEnd = pos.gridColumn + pos.gridWidth - 1;

      const hasColumnOverlap = !(widgetColEnd < movingColStart || widgetColStart > movingColEnd);

      if (!hasColumnOverlap) return;

      if (direction === 'down') {
        if (pos.gridRow >= newRow) {
          affected.push({ widgetId, currentRow: pos.gridRow, position: pos });
        }
      } else if (direction === 'up') {
        if (pos.gridRow >= newRow && pos.gridRow < movingWidget.gridRow) {
          affected.push({ widgetId, currentRow: pos.gridRow, position: pos });
        }
      }
    });

    return affected.sort((a, b) =>
      direction === 'down' ? a.currentRow - b.currentRow : b.currentRow - a.currentRow
    );
  };

  const updateWidgetPosition = (pageId, widgetId, position) => {
    setWidgetPositions(prev => ({
      ...prev,
      [pageId]: {
        ...(prev[pageId] || {}),
        [widgetId]: position
      }
    }));
    setHasUnsavedChanges(true);
  };

  const moveWidgetUp = (pageId, widgetId, increment = 1) => {
    const positions = widgetPositions[pageId] || {};
    const currentPos = positions[widgetId];

    if (!currentPos) return;

    pushToHistory(pageId);

    const newRow = Math.max(1, currentPos.gridRow - increment);

    const affectedWidgets = getAffectedWidgets(pageId, widgetId, newRow, 'up');

    const updatedPositions = { ...positions };

    affectedWidgets.forEach(({ widgetId: affectedId, position }) => {
      updatedPositions[affectedId] = {
        ...position,
        gridRow: position.gridRow - currentPos.gridHeight - WIDGET_GAP
      };
    });

    updatedPositions[widgetId] = {
      ...currentPos,
      gridRow: newRow
    };

    setWidgetPositions(prev => ({
      ...prev,
      [pageId]: updatedPositions
    }));
    setHasUnsavedChanges(true);
  };

  const moveWidgetDown = (pageId, widgetId, increment = 1) => {
    const positions = widgetPositions[pageId] || {};
    const currentPos = positions[widgetId];

    if (!currentPos) return;

    pushToHistory(pageId);

    const newRow = currentPos.gridRow + increment;

    const affectedWidgets = getAffectedWidgets(pageId, widgetId, newRow, 'down');

    const updatedPositions = { ...positions };

    affectedWidgets.forEach(({ widgetId: affectedId, position }) => {
      updatedPositions[affectedId] = {
        ...position,
        gridRow: position.gridRow + currentPos.gridHeight + WIDGET_GAP
      };
    });

    updatedPositions[widgetId] = {
      ...currentPos,
      gridRow: newRow
    };

    setWidgetPositions(prev => ({
      ...prev,
      [pageId]: updatedPositions
    }));
    setHasUnsavedChanges(true);
  };

  const compactLayout = (pageId) => {
    pushToHistory(pageId);

    const positions = widgetPositions[pageId] || {};
    const widgetIds = Object.keys(positions);

    const sortedWidgets = widgetIds
      .map(id => ({
        id,
        ...positions[id]
      }))
      .sort((a, b) => {
        if (a.gridRow !== b.gridRow) return a.gridRow - b.gridRow;
        if (a.gridColumn !== b.gridColumn) return a.gridColumn - b.gridColumn;
        return a.id.localeCompare(b.id);
      });

    let currentRow = 1;
    let currentColumn = 1;
    let rowMaxHeight = 1;
    const newPositions = {};

    sortedWidgets.forEach(widget => {
      if (currentColumn + widget.gridWidth - 1 > GRID_COLUMNS) {
        currentRow += rowMaxHeight + WIDGET_GAP;
        currentColumn = 1;
        rowMaxHeight = widget.gridHeight;
      } else {
        rowMaxHeight = Math.max(rowMaxHeight, widget.gridHeight);
      }

      newPositions[widget.id] = {
        gridColumn: currentColumn,
        gridRow: currentRow,
        gridWidth: widget.gridWidth,
        gridHeight: widget.gridHeight
      };

      currentColumn += widget.gridWidth;
    });

    setWidgetPositions(prev => ({
      ...prev,
      [pageId]: newPositions
    }));

    setHasUnsavedChanges(true);
  };

  const swapWidgets = (pageId, widgetId1, widgetId2) => {
    const positions = widgetPositions[pageId] || {};
    const pos1 = positions[widgetId1];
    const pos2 = positions[widgetId2];

    if (!pos1 || !pos2) return;

    const tempPos = { gridRow: pos1.gridRow, gridColumn: pos1.gridColumn };

    updateWidgetPosition(pageId, widgetId1, {
      ...pos1,
      gridRow: pos2.gridRow,
      gridColumn: pos2.gridColumn
    });

    updateWidgetPosition(pageId, widgetId2, {
      ...pos2,
      gridRow: tempPos.gridRow,
      gridColumn: tempPos.gridColumn
    });
  };

  const moveWidget = (pageId, widgetId, newOrder, allWidgetPositions = null) => {
    if (!newOrder) {
      console.warn(`[moveWidget] No order provided for widget ${widgetId}`);
      return;
    }

    const positions = allWidgetPositions || widgetPositions[pageId] || {};
    const draggedPos = positions[widgetId];

    if (!draggedPos) {
      const widgetSizes = getWidgetSizesMap(pageId, allWidgetPositions);
      const reflowedPositions = calculateReflowLayout(newOrder, widgetSizes, GRID_COLUMNS);

      setWidgetOrder(prev => ({
        ...prev,
        [pageId]: newOrder
      }));

      Object.entries(reflowedPositions).forEach(([wId, pos]) => {
        updateWidgetPosition(pageId, wId, pos);
      });
      return;
    }

    const currentRow = draggedPos.gridRow;
    const widgetsInSameRow = newOrder.filter(id => positions[id]?.gridRow === currentRow);
    const isSimpleRowReorder = widgetsInSameRow.length > 1 && widgetsInSameRow.includes(widgetId);

    if (isSimpleRowReorder) {
      let currentColumn = 1;
      widgetsInSameRow.forEach(id => {
        const widget = positions[id];
        updateWidgetPosition(pageId, id, {
          ...widget,
          gridColumn: currentColumn,
          gridRow: currentRow
        });
        currentColumn += widget.gridWidth;
      });

      setWidgetOrder(prev => ({
        ...prev,
        [pageId]: newOrder
      }));
    } else {
      const widgetSizes = getWidgetSizesMap(pageId, allWidgetPositions);
      const reflowedPositions = calculateReflowLayout(newOrder, widgetSizes, GRID_COLUMNS);

      setWidgetOrder(prev => ({
        ...prev,
        [pageId]: newOrder
      }));

      setWidgetPositions(prev => ({
        ...prev,
        [pageId]: reflowedPositions
      }));
    }

    setHasUnsavedChanges(true);
    setPreviewPositions({});
    setDisplacedWidgets([]);
    setInsertionIndex(null);
  };

  const resizeWidget = (pageId, widgetId, newWidth, newHeight) => {
    pushToHistory(pageId);

    if (newWidth > GRID_COLUMNS) {
      newWidth = GRID_COLUMNS;
    }

    setWidgetPositions(prev => {
      const newPagePositions = { ...(prev[pageId] || {}) };
      newPagePositions[widgetId] = {
        ...newPagePositions[widgetId],
        gridWidth: newWidth,
        gridHeight: newHeight
      };
      return {
        ...prev,
        [pageId]: newPagePositions
      };
    });

    const currentOrder = widgetOrder[pageId] || initializeWidgetOrder(pageId);
    const updatedSizes = getWidgetSizesMap(pageId);
    updatedSizes[widgetId] = { gridWidth: newWidth, gridHeight: newHeight };

    const reflowedPositions = calculateReflowLayout(currentOrder, updatedSizes, GRID_COLUMNS);

    setWidgetPositions(prev => ({
      ...prev,
      [pageId]: reflowedPositions
    }));

    setHasUnsavedChanges(true);
  };

  const getWidgetPosition = (pageId, widgetId, defaultPosition) => {
    return previewPositions[pageId]?.[widgetId] || widgetPositions[pageId]?.[widgetId] || defaultPosition;
  };

  const saveCurrentLayout = async () => {
    if (currentPage && widgetPositions[currentPage]) {
      return await savePageLayout(currentPage, widgetPositions[currentPage], widgetOrder[currentPage]);
    }
    return { success: false };
  };

  const resetLayout = (pageId) => {
    setWidgetPositions(prev => {
      const newPositions = { ...prev };
      delete newPositions[pageId];
      return newPositions;
    });
    setHasUnsavedChanges(true);
  };

  const startDrag = (widget, clientX, clientY, widgetRect) => {
    dragStartPositionRef.current = { x: clientX, y: clientY };
    setDraggedWidget(widget);
    setIsDragging(true);
    setDragCommitted(false);
    lastCrossedCenterRef.current = null;
    setDragOverlayPosition({
      x: widgetRect.left,
      y: widgetRect.top,
      width: widgetRect.width,
      height: widgetRect.height,
      offsetX: clientX - widgetRect.left,
      offsetY: clientY - widgetRect.top
    });
  };

  const updateDrag = (clientX, clientY) => {
    if (!dragOverlayPosition || !dragStartPositionRef.current) return false;

    const distance = Math.sqrt(
      Math.pow(clientX - dragStartPositionRef.current.x, 2) +
      Math.pow(clientY - dragStartPositionRef.current.y, 2)
    );

    const newCommitted = distance >= DRAG_THRESHOLD;
    if (newCommitted && !dragCommitted) {
      setDragCommitted(true);
    }

    setDragOverlayPosition(prev => ({
      ...prev,
      x: clientX - prev.offsetX,
      y: clientY - prev.offsetY
    }));

    return newCommitted || dragCommitted;
  };

  const endDrag = (cancelled = false) => {
    const wasCommitted = dragCommitted;
    setIsDragging(false);
    setDraggedWidget(null);
    setDragOverlayPosition(null);
    setDragCommitted(false);
    setPreviewPositions({});
    setDropTarget(null);
    setDisplacedWidgets([]);
    setInsertionIndex(null);
    dragStartPositionRef.current = null;
    lastCrossedCenterRef.current = null;
    return wasCommitted && !cancelled;
  };

  const captureWidgetRects = (widgetElements) => {
    const rects = {};
    widgetElements.forEach((el, id) => {
      if (el) {
        rects[id] = el.getBoundingClientRect();
      }
    });
    widgetRectsRef.current = rects;
    return rects;
  };

  const getWidgetRects = () => widgetRectsRef.current;

  return (
    <DashboardEditContext.Provider value={{
      isEditMode,
      currentPage,
      isDragging,
      draggedWidget,
      resizingWidget,
      dropTarget,
      hasUnsavedChanges,
      isSaving,
      displacedWidgets,
      insertionIndex,
      dragOverlayPosition,
      dragCommitted,
      needsPositionInit,
      enterEditMode,
      exitEditMode,
      cancelEditMode,
      completeEditModeInitialization,
      initializeWidgetPositionsFromDefaults,
      setIsDragging,
      setDraggedWidget,
      setResizingWidget,
      setDropTarget,
      setDisplacedWidgets,
      setInsertionIndex,
      updateWidgetPosition,
      getWidgetPosition,
      moveWidget,
      moveWidgetUp,
      moveWidgetDown,
      compactLayout,
      swapWidgets,
      resizeWidget,
      saveCurrentLayout,
      resetLayout,
      undo,
      redo,
      canUndo,
      canRedo,
      widgetPositions,
      widgetOrder,
      setWidgetOrder,
      previewPositions,
      setPreviewPositions,
      initializeWidgetOrder,
      calculateReflowLayout,
      getWidgetSizesMap,
      detectInsertionIndex,
      GRID_COLUMNS,
      WIDGET_GAP,
      startDrag,
      updateDrag,
      endDrag,
      captureWidgetRects,
      getWidgetRects,
      animatingWidgetsRef,
      lastCrossedCenterRef,
      DRAG_THRESHOLD
    }}>
      {children}
    </DashboardEditContext.Provider>
  );
}

function useDashboardEdit() {
  const context = useContext(DashboardEditContext);
  if (!context) {
    return {
      isEditMode: false,
      needsPositionInit: false,
      enterEditMode: () => {},
      exitEditMode: () => {},
      cancelEditMode: () => {},
      completeEditModeInitialization: () => {},
      initializeWidgetPositionsFromDefaults: () => {},
      updateWidgetPosition: () => {},
      getWidgetPosition: (_, __, defaultPos) => defaultPos,
      moveWidget: () => {},
      moveWidgetUp: () => {},
      moveWidgetDown: () => {},
      compactLayout: () => {},
      swapWidgets: () => {},
      resizeWidget: () => {},
      saveCurrentLayout: async () => ({ success: false }),
      undo: () => false,
      redo: () => false,
      canUndo: () => false,
      canRedo: () => false,
      setIsDragging: () => {},
      setDraggedWidget: () => {},
      setResizingWidget: () => {},
      setDropTarget: () => {},
      hasUnsavedChanges: false,
      isSaving: false,
      isDragging: false,
      draggedWidget: null,
      resizingWidget: null,
      dropTarget: null,
      dragOverlayPosition: null,
      dragCommitted: false,
      startDrag: () => {},
      updateDrag: () => false,
      endDrag: () => false,
      captureWidgetRects: () => ({}),
      getWidgetRects: () => ({}),
      animatingWidgetsRef: { current: new Set() },
      lastCrossedCenterRef: { current: null },
      DRAG_THRESHOLD: 8,
      WIDGET_GAP: 1,
      GRID_COLUMNS: 12
    };
  }
  return context;
}

// Demo users database (in production, this would be server-side with hashed passwords)
const usersDatabase = {
  'admin@prysmcs.com': {
    id: 'user-001',
    email: 'admin@prysmcs.com',
    password: 'Admin123!', // In production: hashed password
    name: 'Sarah Johnson',
    role: 'admin',
    phone: '(555) 123-4567',
    department: 'Operations',
    assignedClients: ['all'],
    lastLogin: null,
    mfaEnabled: true,
    status: 'active',
    createdAt: '2024-01-15T10:00:00Z'
  },
  'account@prysmcs.com': {
    id: 'user-002',
    email: 'account@prysmcs.com',
    password: 'Client123!',
    name: 'Dr. Michael Chen',
    role: 'client',
    phone: '(813) 555-0100',
    department: 'Internal Medicine',
    assignedClients: ['hybrid-medical'],
    lastLogin: null,
    mfaEnabled: false,
    status: 'active',
    createdAt: '2024-02-20T14:30:00Z'
  },
  'dataentry@prysmcs.com': {
    id: 'user-003',
    email: 'dataentry@prysmcs.com',
    password: 'Csm123!',
    name: 'Emily Rodriguez',
    role: 'csm',
    phone: '(555) 987-6543',
    department: 'Customer Success',
    assignedClients: ['hybrid-medical', 'spirazza-family'],
    lastLogin: null,
    mfaEnabled: false,
    status: 'active',
    createdAt: '2024-03-10T09:15:00Z'
  }
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
  SETTINGS_CHANGE: 'SETTINGS_CHANGE'
};

// Audit log storage (in production: secure server-side database)
// These functions now integrate with the DAL for future backend support
function getAuditLog() {
  try {
    return JSON.parse(localStorage.getItem('prysmcs_audit_log') || '[]');
  } catch {
    return [];
  }
}

function saveAuditLog(log) {
  localStorage.setItem('prysmcs_audit_log', JSON.stringify(log));
}

function createAuditEntry(action, details, user = null) {
  const entry = {
    id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    action,
    userId: user?.id || 'system',
    userName: user?.name || 'System',
    userRole: user?.role || 'system',
    userEmail: user?.email || 'system',
    ipAddress: '192.168.1.xxx', // In production: actual IP
    userAgent: navigator.userAgent,
    details: {
      ...details,
      // Mask sensitive data in logs
      ...(details.patientId && { patientId: `***${details.patientId.slice(-4)}` })
    }
  };
  
  // Use DAL audit client if remote audit is enabled
  if (DAL_CONFIG.features.useRemoteAudit) {
    auditClient.logEvent(action, entry.details, user);
  }
  
  // Always maintain local log for now (dual-write)
  const log = getAuditLog();
  log.unshift(entry); // Add to beginning
  
  // Keep last 10,000 entries (in production: unlimited with archival)
  if (log.length > 10000) {
    log.length = 10000;
  }
  
  saveAuditLog(log);
  return entry;
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
  const [isLoading, setIsLoading] = useState(true);
  const [sessionExpiry, setSessionExpiry] = useState(null);
  const [showTimeoutWarning, setShowTimeoutWarning] = useState(false);

  useEffect(() => {
    const loadSession = async () => {
      try {
        console.log('[Auth] Checking for existing session...');
        const user = await supabaseAuth.getCurrentUser();

        if (user && user.status === 'active') {
          console.log('[Auth] Found existing session for:', user.email);
          setCurrentUser(user);
          setIsAuthenticated(true);
          const expiry = new Date(Date.now() + SESSION_CONFIG.timeoutMinutes * 60 * 1000);
          setSessionExpiry(expiry);
        } else {
          console.log('[Auth] No active session found');
        }
      } catch (e) {
        console.warn('[Auth] Failed to load session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    loadSession();

    const { data: { subscription } } = supabaseAuth.onAuthStateChange(async (event, session) => {
      console.log('[Auth] Auth state changed:', event);

      if (event === 'SIGNED_OUT') {
        setCurrentUser(null);
        setIsAuthenticated(false);
        setSessionExpiry(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

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
  };

  const handleSessionTimeout = async () => {
    if (currentUser) {
      await supabaseData.logAudit(
        currentUser.tenantId,
        AUDIT_ACTIONS.SESSION_TIMEOUT,
        { reason: 'Inactivity timeout' },
        currentUser
      );
    }
    await logout();
  };

  const login = async (email, password) => {
    console.log('[Auth] Attempting login for:', email);

    try {
      const result = await supabaseAuth.signIn(email, password);

      if (!result.success) {
        console.log('[Auth] Login failed:', result.error);
        createAuditEntry(AUDIT_ACTIONS.LOGIN_FAILED, {
          email: email.toLowerCase(),
          reason: result.error
        });
        return { success: false, error: result.error };
      }

      console.log('[Auth] Login successful for:', result.user.email);

      if (result.user.status !== 'active') {
        await supabaseAuth.signOut();
        return { success: false, error: 'Account is inactive. Contact administrator.' };
      }

      await supabaseData.logAudit(
        result.user.tenantId,
        AUDIT_ACTIONS.LOGIN,
        { email: result.user.email, role: result.user.role },
        result.user
      );

      const expiry = new Date(Date.now() + SESSION_CONFIG.timeoutMinutes * 60 * 1000);

      setCurrentUser(result.user);
      setSessionExpiry(expiry);
      setShowTimeoutWarning(false);
      setIsAuthenticated(true);

      return { success: true };
    } catch (error) {
      console.error('[Auth] Login error:', error);
      return { success: false, error: 'An error occurred during login' };
    }
  };

  const logout = async () => {
    if (currentUser) {
      await supabaseData.logAudit(
        currentUser.tenantId,
        AUDIT_ACTIONS.LOGOUT,
        {},
        currentUser
      );
    }

    setCurrentUser(null);
    setIsAuthenticated(false);
    setSessionExpiry(null);
    setShowTimeoutWarning(false);

    await supabaseAuth.signOut();
  };

  const hasPermission = (permission) => {
    if (!currentUser) return false;
    const role = ROLES[currentUser.role];
    return role?.permissions.includes(permission) || false;
  };

  const canAccessClient = (clientId) => {
    if (!currentUser) return false;
    if (currentUser.canAccessAllClients) return true;
    if (currentUser.role === 'admin') return true;
    return currentUser.assignedClients?.includes(clientId) || false;
  };

  const logPHIAccess = async (action, details) => {
    if (currentUser) {
      await supabaseData.logAudit(
        currentUser.tenantId,
        action,
        details,
        currentUser
      );
    }
    createAuditEntry(action, details, currentUser);
  };

  const value = {
    currentUser,
    isAuthenticated,
    isLoading,
    sessionExpiry,
    showTimeoutWarning,
    login,
    logout,
    hasPermission,
    canAccessClient,
    extendSession,
    logPHIAccess,
    setShowTimeoutWarning,
    AUDIT_ACTIONS,
    SESSION_CONFIG
  };

  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        background: 'linear-gradient(135deg, #0d9488 0%, #14b8a6 50%, #2dd4bf 100%)'
      }}>
        <div style={{ textAlign: 'center', color: 'white' }}>
          <div style={{ fontSize: '24px', marginBottom: '16px' }}>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// ============================================================
// LOGIN COMPONENT
// ============================================================

function LoginPage({ onLogin }) {
  console.log('[PrysmCS] LoginPage rendering');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { login } = useAuth();
  const { customization } = useCustomization();
  const branding = customization.branding;
  console.log('[PrysmCS] LoginPage branding:', branding);
  
  // Determine the background - use sidebar bg, or create gradient from brand colors
  const pageBackground = branding.sidebarBg || 
    `linear-gradient(135deg, ${branding.secondaryColor || '#0d9488'} 0%, ${branding.primaryColor || '#14b8a6'} 50%, ${branding.accentColor || '#5eead4'} 100%)`;
  
  const headerBackground = branding.sidebarBg || 
    `linear-gradient(135deg, ${branding.secondaryColor || '#0d9488'}, ${branding.primaryColor || '#14b8a6'})`;
  
  const handleSubmit = async () => {
    if (isLoading || !email || !password) return;
    
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
  
  const quickLogin = async (demoEmail, demoPassword) => {
    setEmail(demoEmail);
    setPassword(demoPassword);
    setError('');
    setIsLoading(true);
    
    // Small delay to show the credentials being filled in
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
    <div className="login-page" style={{ background: pageBackground }}>
      <div className="login-container">
        <div className="login-header" style={{ background: headerBackground }}>
          {branding.logoMode === 'full-image' && branding.logoUrl ? (
            // Full image mode - just show the uploaded logo
            <img 
              src={branding.logoUrl} 
              alt={branding.platformName} 
              style={{ maxWidth: 200, maxHeight: 60, objectFit: 'contain', marginBottom: 16 }} 
            />
          ) : (
            // Icon + text modes (default or icon-text)
            <div className="login-logo" style={{ background: `linear-gradient(135deg, ${branding.primaryColor}, ${branding.secondaryColor})` }}>
              {branding.logoMode === 'icon-text' && branding.logoUrl ? (
                <img src={branding.logoUrl} alt="" style={{ maxWidth: 48, maxHeight: 48, objectFit: 'contain' }} />
              ) : (
                <Shield size={48} />
              )}
            </div>
          )}
          {branding.logoMode !== 'full-image' && (
            <h1 style={{ fontFamily: `'${branding.fontFamily || 'DM Sans'}', sans-serif` }}>{branding.platformName} Dashboard</h1>
          )}
          <p>Secure Healthcare Management Portal</p>
        </div>
        
        <form className="login-form" onSubmit={(e) => e.preventDefault()}>
          {error && (
            <div className="login-error">
              <AlertTriangle size={16} />
              {error}
            </div>
          )}
          
          <div className="login-field">
            <label>Email Address</label>
            <div className="login-input-wrapper">
              <Mail size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                autoComplete="email"
              />
            </div>
          </div>
          
          <div className="login-field">
            <label>Password</label>
            <div className="login-input-wrapper has-toggle">
              <Lock size={18} />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                autoComplete="current-password"
              />
              <button
                type="button"
                className="login-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                title={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>
          
          <button 
            type="button"
            className="login-submit"
            disabled={isLoading || !email || !password}
            onClick={handleSubmit}
            style={{
              width: '100%',
              padding: '14px',
              background: `linear-gradient(135deg, ${branding.secondaryColor}, ${branding.primaryColor})`,
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: (isLoading || !email || !password) ? 'not-allowed' : 'pointer',
              opacity: (isLoading || !email || !password) ? 0.7 : 1,
            }}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        
        <div className="login-footer">
          <div className="login-hipaa-notice">
            <Shield size={14} />
            <span>HIPAA-Compliant Secure Access</span>
          </div>
          <p className="login-disclaimer">
            This system contains Protected Health Information (PHI). 
            Unauthorized access is prohibited and monitored.
          </p>
        </div>
        
        <div className="login-demo-credentials">
          <p><strong>Quick Demo Login:</strong></p>
          <div className="demo-buttons">
            <button
              type="button"
              className="demo-login-btn admin"
              onClick={() => quickLogin('admin@prysmcs.com', 'Admin123!')}
              disabled={isLoading}
            >
              <span className="demo-btn-role">Admin</span>
              <span className="demo-btn-desc">Full access</span>
            </button>
            <button
              type="button"
              className="demo-login-btn client"
              onClick={() => quickLogin('account@prysmcs.com', 'Client123!')}
              disabled={isLoading}
            >
              <span className="demo-btn-role">View Only</span>
              <span className="demo-btn-desc">Read-only access</span>
            </button>
            <button
              type="button"
              className="demo-login-btn csm"
              onClick={() => quickLogin('dataentry@prysmcs.com', 'Csm123!')}
              disabled={isLoading}
            >
              <span className="demo-btn-role">Data Entry</span>
              <span className="demo-btn-desc">Data management</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SESSION TIMEOUT WARNING
// ============================================================

function SessionTimeoutWarning() {
  const { showTimeoutWarning, extendSession, logout, sessionExpiry } = useAuth();
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
  
  return (
    <div className="session-timeout-overlay">
      <div className="session-timeout-modal">
        <AlertTriangle size={48} className="timeout-icon" />
        <h2>Session Expiring</h2>
        <p>Your session will expire in <strong>{timeLeft}</strong> seconds due to inactivity.</p>
        <p className="timeout-reason">For security, sessions timeout after {SESSION_CONFIG.timeoutMinutes} minutes of inactivity.</p>
        <div className="timeout-actions">
          <button type="button" onClick={extendSession} className="timeout-continue">
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
  const [filter, setFilter] = useState({ action: '', user: '', dateFrom: '', dateTo: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 50;
  
  useEffect(() => {
    if (hasPermission('view_audit_log')) {
      setAuditLog(getAuditLog());
      logPHIAccess(AUDIT_ACTIONS.VIEW_PHI, { 
        resource: 'audit_log',
        action: 'viewed_audit_log'
      });
    }
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
    if (action.includes('FAILED') || action.includes('DENIED')) return '#ef4444';
    if (action.includes('LOGIN') || action.includes('LOGOUT')) return '#3b82f6';
    if (action.includes('EDIT') || action.includes('CREATE') || action.includes('DELETE')) return '#f59e0b';
    if (action.includes('VIEW') || action.includes('EXPORT')) return '#10b981';
    return '#6b7280';
  };
  
  return (
    <div className="audit-log-page">
      <div className="page-header">
        <h1 className="page-title">
          <ClipboardList size={28} />
          Audit Trail
        </h1>
        <p className="page-subtitle">HIPAA-compliant activity logging • {filteredLog.length} entries</p>
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
      
      <div className="audit-table-container">
        <table className="audit-table">
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Action</th>
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
                <td>{entry.userName}</td>
                <td className="audit-role">{entry.userRole}</td>
                <td className="audit-details">
                  {JSON.stringify(entry.details).substring(0, 100)}
                  {JSON.stringify(entry.details).length > 100 && '...'}
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

// Mock CSM team data
const csmTeamData = [
  {
    id: 'csm-001',
    name: 'Emily Rodriguez',
    email: 'emily@prysmcs.com',
    avatar: 'ER',
    clients: ['hybrid-medical', 'spirazza-family'],
    metrics: {
      totalPatients: 342,
      enrolledThisMonth: 47,
      avgEngagementRate: 87,
      avgOutcomeScore: 82,
      revenueManaged: 128500,
      responseTime: 3.2,
      clientSatisfaction: 94,
    },
    trend: [
      { month: 'Jul', enrolled: 32, engagement: 82 },
      { month: 'Aug', enrolled: 38, engagement: 84 },
      { month: 'Sep', enrolled: 41, engagement: 85 },
      { month: 'Oct', enrolled: 44, engagement: 86 },
      { month: 'Nov', enrolled: 47, engagement: 87 },
    ],
    strengths: ['Client communication', 'Patient engagement', 'Outcome tracking'],
    areasToImprove: ['Documentation timeliness', 'Cross-selling services'],
  },
  {
    id: 'csm-002',
    name: 'Marcus Thompson',
    email: 'marcus@prysmcs.com',
    avatar: 'MT',
    clients: ['wellness-first', 'coastal-care'],
    metrics: {
      totalPatients: 289,
      enrolledThisMonth: 38,
      avgEngagementRate: 79,
      avgOutcomeScore: 76,
      revenueManaged: 98200,
      responseTime: 4.8,
      clientSatisfaction: 86,
    },
    trend: [
      { month: 'Jul', enrolled: 28, engagement: 74 },
      { month: 'Aug', enrolled: 31, engagement: 75 },
      { month: 'Sep', enrolled: 33, engagement: 77 },
      { month: 'Oct', enrolled: 35, engagement: 78 },
      { month: 'Nov', enrolled: 38, engagement: 79 },
    ],
    strengths: ['Technical knowledge', 'Problem solving'],
    areasToImprove: ['Response time', 'Proactive outreach', 'Client check-ins'],
  },
  {
    id: 'csm-003',
    name: 'Sarah Kim',
    email: 'sarah@prysmcs.com',
    avatar: 'SK',
    clients: ['premier-health', 'sunrise-medical', 'valley-clinic'],
    metrics: {
      totalPatients: 412,
      enrolledThisMonth: 58,
      avgEngagementRate: 91,
      avgOutcomeScore: 88,
      revenueManaged: 156800,
      responseTime: 2.4,
      clientSatisfaction: 97,
    },
    trend: [
      { month: 'Jul', enrolled: 42, engagement: 86 },
      { month: 'Aug', enrolled: 48, engagement: 88 },
      { month: 'Sep', enrolled: 52, engagement: 89 },
      { month: 'Oct', enrolled: 55, engagement: 90 },
      { month: 'Nov', enrolled: 58, engagement: 91 },
    ],
    strengths: ['Client retention', 'Upselling', 'Process optimization', 'Team collaboration'],
    areasToImprove: ['Workload delegation'],
  },
];

// Generate AI insights based on team data
function generateAIInsights(teamData) {
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
  
  // Calculate company-wide metrics
  const companyMetrics = {
    totalPatients: csmTeamData.reduce((sum, csm) => sum + csm.metrics.totalPatients, 0),
    totalEnrolledThisMonth: csmTeamData.reduce((sum, csm) => sum + csm.metrics.enrolledThisMonth, 0),
    totalRevenue: csmTeamData.reduce((sum, csm) => sum + csm.metrics.revenueManaged, 0),
    avgEngagement: (csmTeamData.reduce((sum, csm) => sum + csm.metrics.avgEngagementRate, 0) / csmTeamData.length).toFixed(0),
    avgSatisfaction: (csmTeamData.reduce((sum, csm) => sum + csm.metrics.clientSatisfaction, 0) / csmTeamData.length).toFixed(0),
    avgResponseTime: (csmTeamData.reduce((sum, csm) => sum + csm.metrics.responseTime, 0) / csmTeamData.length).toFixed(1),
  };
  
  // Company trend data
  const companyTrend = ['Jul', 'Aug', 'Sep', 'Oct', 'Nov'].map((month, idx) => ({
    month,
    enrolled: csmTeamData.reduce((sum, csm) => sum + csm.trend[idx].enrolled, 0),
    engagement: Math.round(csmTeamData.reduce((sum, csm) => sum + csm.trend[idx].engagement, 0) / csmTeamData.length),
  }));
  
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

function CustomizationPage({ customWidgets, setCustomWidgets, onNavigate }) {
  const { hasPermission, logPHIAccess } = useAuth();
  const {
    customization,
    updateBranding,
    updateTab,
    reorderTabs,
    updateWidget,
    reorderWidgets,
    resetToDefaults,
    getEnabledTabs,
    getEnabledWidgets
  } = useCustomization();

  const [activeSection, setActiveSection] = useState('branding');
  const [draggedTab, setDraggedTab] = useState(null);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [selectedWidgetPage, setSelectedWidgetPage] = useState('overview');
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [logoPreview, setLogoPreview] = useState(customization.branding.logoUrl);

  // Widget modal state
  const [showWidgetModal, setShowWidgetModal] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState(null);
  const selectedClientId = 'demo-client-1';

  // Custom gradient state (sidebar)
  const [customGradientStart, setCustomGradientStart] = useState('#115e59');
  const [customGradientEnd, setCustomGradientEnd] = useState('#134e4a');
  const [gradientDirection, setGradientDirection] = useState('180deg');

  const applyCustomGradient = () => {
    const gradient = `linear-gradient(${gradientDirection}, ${customGradientStart} 0%, ${customGradientEnd} 100%)`;
    updateBranding({ sidebarBg: gradient });
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
    LayoutDashboard, Users, DollarSign, Heart, MessageSquare,
    Lightbulb, TrendingUp, Activity, Calendar, Settings,
    Target, BarChart2, PieChart, FileText, Mail, Bell, Shield, Star, Award, Briefcase
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result);
        updateBranding({ logoUrl: reader.result });
      };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = () => {
    setLogoPreview(null);
    updateBranding({ logoUrl: null, logoMode: 'default' });
  };

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

  const handleWidgetDragStart = (e, widget) => {
    setDraggedWidget(widget);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleWidgetDragOver = (e, targetWidget) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget.id === targetWidget.id) return;
    
    const widgets = [...customization.widgets[selectedWidgetPage]].sort((a, b) => a.order - b.order);
    const draggedIndex = widgets.findIndex(w => w.id === draggedWidget.id);
    const targetIndex = widgets.findIndex(w => w.id === targetWidget.id);
    
    const newWidgets = [...widgets];
    newWidgets.splice(draggedIndex, 1);
    newWidgets.splice(targetIndex, 0, draggedWidget);
    
    reorderWidgets(selectedWidgetPage, newWidgets);
  };

  const handleWidgetDragEnd = () => {
    setDraggedWidget(null);
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

  const moveWidget = (widgetId, direction) => {
    const widgets = [...customization.widgets[selectedWidgetPage]].sort((a, b) => a.order - b.order);
    const index = widgets.findIndex(w => w.id === widgetId);
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === widgets.length - 1)) return;
    
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newWidgets = [...widgets];
    [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];
    reorderWidgets(selectedWidgetPage, newWidgets);
  };

  const handleWidgetCardClick = (widgetType) => {
    setSelectedWidgetType(widgetType);
    setShowWidgetModal(true);
  };

  const handleWidgetSave = async (savedWidget) => {
    if (editingWidget) {
      // Update existing widget
      setCustomWidgets(prev => prev.map(w => w.id === savedWidget.id ? savedWidget : w));
      setEditingWidget(null);
    } else {
      // Add new widget
      setCustomWidgets(prev => [...prev, savedWidget]);
    }
  };

  const updateCustomWidget = async (widgetId, updates) => {
    try {
      const widget = customWidgets.find(w => w.id === widgetId);
      if (!widget) return;

      const updatedWidget = { ...widget, ...updates };
      await widgetConfigDB.saveWidgetConfig(updatedWidget);
      setCustomWidgets(prev => prev.map(w => w.id === widgetId ? updatedWidget : w));
    } catch (error) {
      console.error('Error updating custom widget:', error);
    }
  };

  const moveCustomWidget = async (widgetId, direction) => {
    console.log('[PrysmCS] moveCustomWidget called:', { widgetId, direction, selectedWidgetPage });

    const pageWidgets = [...customWidgets]
      .filter(w => w.page_id === selectedWidgetPage)
      .sort((a, b) => (a.order || 0) - (b.order || 0));

    console.log('[PrysmCS] pageWidgets:', pageWidgets);

    const index = pageWidgets.findIndex(w => w.id === widgetId);
    console.log('[PrysmCS] Current index:', index);

    if (index === -1) {
      console.log('[PrysmCS] Widget not found in page widgets');
      return;
    }
    if ((direction === 'up' && index === 0) || (direction === 'down' && index === pageWidgets.length - 1)) {
      console.log('[PrysmCS] Cannot move widget in this direction (at boundary)');
      return;
    }

    const newIndex = direction === 'up' ? index - 1 : index + 1;
    const newWidgets = [...pageWidgets];
    [newWidgets[index], newWidgets[newIndex]] = [newWidgets[newIndex], newWidgets[index]];

    console.log('[PrysmCS] Updating widget order...');

    // Update order for all widgets on this page
    for (let i = 0; i < newWidgets.length; i++) {
      await widgetConfigDB.saveWidgetConfig({ ...newWidgets[i], order: i });
    }

    // Reload widgets
    const allWidgets = await widgetConfigDB.getWidgetConfigs(selectedClientId);
    console.log('[PrysmCS] Reloaded widgets:', allWidgets);
    setCustomWidgets(allWidgets);
  };

  const handleEditCustomWidget = (widget) => {
    setSelectedWidgetType(widget.widget_type);
    setShowWidgetModal('edit');
    setEditingWidget(widget);
  };

  const [editingWidget, setEditingWidget] = useState(null);

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
            <div className="section-card">
              <h3><Image size={18} /> Logo & Platform Name</h3>
              
              <div className="form-row">
                <label>Platform Name</label>
                <input 
                  type="text"
                  value={customization.branding.platformName}
                  onChange={(e) => updateBranding({ platformName: e.target.value, logoText: e.target.value })}
                  placeholder="Enter platform name"
                />
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
                      onChange={() => updateBranding({ logoMode: 'default' })}
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
                      onChange={() => updateBranding({ logoMode: 'icon-text' })}
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
                      onChange={() => updateBranding({ logoMode: 'full-image' })}
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
              <h3><Palette size={18} /> Brand Colors</h3>
              
              <div className="color-presets">
                <label>Quick Presets</label>
                <div className="preset-buttons">
                  {colorPresets.map(preset => (
                    <button
                      key={preset.name}
                      className="color-preset-btn"
                      style={{ background: preset.primary }}
                      onClick={() => updateBranding({ 
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
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
                    />
                    <input 
                      type="text"
                      value={customization.branding.primaryColor}
                      onChange={(e) => updateBranding({ primaryColor: e.target.value })}
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
                      onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
                    />
                    <input 
                      type="text"
                      value={customization.branding.secondaryColor}
                      onChange={(e) => updateBranding({ secondaryColor: e.target.value })}
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
                      onChange={(e) => updateBranding({ accentColor: e.target.value })}
                    />
                    <input 
                      type="text"
                      value={customization.branding.accentColor}
                      onChange={(e) => updateBranding({ accentColor: e.target.value })}
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
                      onClick={() => updateBranding({ sidebarBg: 'linear-gradient(180deg, #115e59 0%, #134e4a 100%)' })}
                      title="Teal (Default)"
                    />
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' }}
                      onClick={() => updateBranding({ sidebarBg: 'linear-gradient(180deg, #0f172a 0%, #1e293b 100%)' })}
                      title="Dark Slate"
                    />
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)' }}
                      onClick={() => updateBranding({ sidebarBg: 'linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%)' })}
                      title="Navy"
                    />
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #4c1d95 0%, #2e1065 100%)' }}
                      onClick={() => updateBranding({ sidebarBg: 'linear-gradient(180deg, #4c1d95 0%, #2e1065 100%)' })}
                      title="Purple"
                    />
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #166534 0%, #14532d 100%)' }}
                      onClick={() => updateBranding({ sidebarBg: 'linear-gradient(180deg, #166534 0%, #14532d 100%)' })}
                      title="Forest"
                    />
                    <button 
                      className="bg-preset-btn" 
                      style={{ background: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)' }}
                      onClick={() => updateBranding({ sidebarBg: 'linear-gradient(180deg, #1e40af 0%, #1e3a8a 100%)' })}
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
                      onClick={() => updateBranding({ sidebarTextColor: '#ffffff' })}
                      title="White (Default)"
                    >Aa</button>
                    <button 
                      className={`text-preset-btn ${customization.branding.sidebarTextColor === '#f1f5f9' ? 'selected' : ''}`}
                      style={{ background: '#f1f5f9', color: '#1e293b' }}
                      onClick={() => updateBranding({ sidebarTextColor: '#f1f5f9' })}
                      title="Light Gray"
                    >Aa</button>
                    <button 
                      className={`text-preset-btn ${customization.branding.sidebarTextColor === '#5eead4' ? 'selected' : ''}`}
                      style={{ background: '#5eead4', color: '#1e293b' }}
                      onClick={() => updateBranding({ sidebarTextColor: '#5eead4' })}
                      title="Teal Light"
                    >Aa</button>
                    <button 
                      className={`text-preset-btn ${customization.branding.sidebarTextColor === '#fde68a' ? 'selected' : ''}`}
                      style={{ background: '#fde68a', color: '#1e293b' }}
                      onClick={() => updateBranding({ sidebarTextColor: '#fde68a' })}
                      title="Yellow"
                    >Aa</button>
                    <button 
                      className={`text-preset-btn ${customization.branding.sidebarTextColor === '#1e293b' ? 'selected' : ''}`}
                      style={{ background: '#1e293b', color: '#ffffff' }}
                      onClick={() => updateBranding({ sidebarTextColor: '#1e293b' })}
                      title="Dark"
                    >Aa</button>
                    <div className="custom-text-color">
                      <input 
                        type="color" 
                        value={customization.branding.sidebarTextColor || '#ffffff'}
                        onChange={(e) => updateBranding({ sidebarTextColor: e.target.value })}
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
                      onClick={() => updateBranding({ slideBg: 'linear-gradient(135deg, #0f3d3e 0%, #0d4f4f 50%, #115e59 100%)' })}
                      title="Teal (Default)"
                    />
                    <button 
                      className="bg-preset-btn wide" 
                      style={{ background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' }}
                      onClick={() => updateBranding({ slideBg: 'linear-gradient(135deg, #0f172a 0%, #1e293b 50%, #334155 100%)' })}
                      title="Dark"
                    />
                    <button 
                      className="bg-preset-btn wide" 
                      style={{ background: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3b82f6 100%)' }}
                      onClick={() => updateBranding({ slideBg: 'linear-gradient(135deg, #1e3a5f 0%, #1e40af 50%, #3b82f6 100%)' })}
                      title="Blue"
                    />
                    <button 
                      className="bg-preset-btn wide" 
                      style={{ background: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #8b5cf6 100%)' }}
                      onClick={() => updateBranding({ slideBg: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #8b5cf6 100%)' })}
                      title="Purple"
                    />
                    <button 
                      className="bg-preset-btn wide" 
                      style={{ background: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #22c55e 100%)' }}
                      onClick={() => updateBranding({ slideBg: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #22c55e 100%)' })}
                      title="Green"
                    />
                    <button
                      className="bg-preset-btn wide"
                      style={{ background: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #ef4444 100%)' }}
                      onClick={() => updateBranding({ slideBg: 'linear-gradient(135deg, #7f1d1d 0%, #b91c1c 50%, #ef4444 100%)' })}
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
                              updateBranding({ slideBg: gradientCSS });
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
                      onClick={() => updateBranding({ fontFamily: 'DM Sans' })}
                      style={{ fontFamily: "'DM Sans', sans-serif" }}
                    >
                      DM Sans
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Inter' ? 'selected' : ''}`}
                      onClick={() => updateBranding({ fontFamily: 'Inter' })}
                      style={{ fontFamily: "'Inter', sans-serif" }}
                    >
                      Inter
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Roboto' ? 'selected' : ''}`}
                      onClick={() => updateBranding({ fontFamily: 'Roboto' })}
                      style={{ fontFamily: "'Roboto', sans-serif" }}
                    >
                      Roboto
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Open Sans' ? 'selected' : ''}`}
                      onClick={() => updateBranding({ fontFamily: 'Open Sans' })}
                      style={{ fontFamily: "'Open Sans', sans-serif" }}
                    >
                      Open Sans
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Lato' ? 'selected' : ''}`}
                      onClick={() => updateBranding({ fontFamily: 'Lato' })}
                      style={{ fontFamily: "'Lato', sans-serif" }}
                    >
                      Lato
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Poppins' ? 'selected' : ''}`}
                      onClick={() => updateBranding({ fontFamily: 'Poppins' })}
                      style={{ fontFamily: "'Poppins', sans-serif" }}
                    >
                      Poppins
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Source Sans Pro' ? 'selected' : ''}`}
                      onClick={() => updateBranding({ fontFamily: 'Source Sans Pro' })}
                      style={{ fontFamily: "'Source Sans Pro', sans-serif" }}
                    >
                      Source Sans
                    </button>
                    <button 
                      className={`font-preset-btn ${customization.branding.fontFamily === 'Nunito' ? 'selected' : ''}`}
                      onClick={() => updateBranding({ fontFamily: 'Nunito' })}
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
                  .sort((a, b) => a.order - b.order)
                  .map((tab, index) => {
                    const IconComponent = iconMap[tab.icon] || LayoutDashboard;
                    const availableIcons = [
                      { name: 'LayoutDashboard', icon: LayoutDashboard },
                      { name: 'Users', icon: Users },
                      { name: 'DollarSign', icon: DollarSign },
                      { name: 'Heart', icon: Heart },
                      { name: 'MessageSquare', icon: MessageSquare },
                      { name: 'Lightbulb', icon: Lightbulb },
                      { name: 'TrendingUp', icon: TrendingUp },
                      { name: 'Activity', icon: Activity },
                      { name: 'Calendar', icon: Calendar },
                      { name: 'Settings', icon: Settings },
                      { name: 'Target', icon: Target },
                      { name: 'BarChart2', icon: BarChart2 },
                      { name: 'PieChart', icon: PieChart },
                      { name: 'FileText', icon: FileText },
                      { name: 'Mail', icon: Mail },
                      { name: 'Bell', icon: Bell },
                      { name: 'Shield', icon: Shield },
                      { name: 'Star', icon: Star },
                      { name: 'Award', icon: Award },
                      { name: 'Briefcase', icon: Briefcase },
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
                        </div>
                      </div>
                    );
                  })}
              </div>
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
            <div className="preview-widgets">
              <div className="preview-widget-label">Widgets ({selectedWidgetPage || 'overview'})</div>
              {customization.widgets[selectedWidgetPage || 'overview'] && 
               customization.widgets[selectedWidgetPage || 'overview']
                .filter(w => w.enabled)
                .sort((a, b) => a.order - b.order)
                .slice(0, 4)
                .map((widget) => (
                <div 
                  key={widget.id} 
                  className="preview-widget-item"
                  style={{ borderLeft: `3px solid ${customization.branding.primaryColor}` }}
                >
                  <span>{widget.label}</span>
                </div>
              ))}
              {(!customization.widgets[selectedWidgetPage || 'overview'] || 
                customization.widgets[selectedWidgetPage || 'overview'].filter(w => w.enabled).length === 0) && (
                <div className="preview-no-widgets">No widgets enabled</div>
              )}
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

    <WidgetConfigModal
      isOpen={showWidgetModal}
      onClose={() => {
        setShowWidgetModal(false);
        setEditingWidget(null);
      }}
      widgetType={selectedWidgetType}
      onSave={handleWidgetSave}
      customization={customization}
      selectedClientId={selectedClientId}
      editingWidget={editingWidget}
    />
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

// Available months for the dropdown
const availableMonths = [
  { id: '2025-11', label: 'November 2025' },
  { id: '2025-10', label: 'October 2025' },
  { id: '2025-09', label: 'September 2025' },
  { id: '2025-08', label: 'August 2025' },
  { id: '2025-07', label: 'July 2025' },
];

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
  // Section visibility settings
  sectionVisibility: {
    coreMetrics: true,
    enrollmentFunnel: true,
    campaignPerformance: true,
    smsCampaign: true,
    emailCampaign: true,
    mailerCampaign: true,
    patientOutcomes: true,
    stories: true,
    opportunities: true,
    enrollmentNotes: true,
  },
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

const initialClientsDatabase = {
  'hybrid-medical': {
    id: 'hybrid-medical',
    clientInfo: {
      clientName: "Apex Solutions Inc",
      address: "1234 Medical Center Dr, Suite 100, Tampa, FL 33601",
      phone: "(813) 555-0100",
      email: "info@hybridmedical.com",
      website: "www.hybridmedical.com",
      stakeholders: [
        { id: 1, name: "Dr. Sarah Mitchell", title: "Medical Director", role: "Decision Maker", email: "s.mitchell@hybridmedical.com", phone: "(813) 555-0101", reportsTo: null },
        { id: 2, name: "James Chen", title: "Practice Manager", role: "Primary Contact", email: "j.chen@hybridmedical.com", phone: "(813) 555-0102", reportsTo: 1 },
        { id: 3, name: "Maria Rodriguez", title: "Office Manager", role: "Operations Lead", email: "m.rodriguez@hybridmedical.com", phone: "(813) 555-0103", reportsTo: 2 },
      ],
      weeklyMeetingSchedule: "Second Wednesday of each month at 3:00 PM EST",
      emrName: "eClinicalWorks",
      careManagementCoordinator: { name: "Jennifer Adams", email: "j.adams@prysmcs.com", phone: "(555) 123-4567" },
      enrollmentSpecialists: [
        { id: 1, name: "David Park", email: "d.park@prysmcs.com", phone: "(555) 123-4568" },
        { id: 2, name: "Ashley Thompson", email: "a.thompson@prysmcs.com", phone: "(555) 123-4569" },
      ],
      csmAssigned: { name: "Michael Roberts", email: "m.roberts@prysmcs.com", phone: "(555) 123-4570" },
      providers: [
        { id: 1, name: "Dr. Sarah Mitchell", npi: "1234567890", phone: "(813) 555-0101", callerIdVerified: true },
        { id: 2, name: "Dr. Robert Kim", npi: "0987654321", phone: "(813) 555-0104", callerIdVerified: true },
        { id: 3, name: "Dr. Emily Watson", npi: "1122334455", phone: "(813) 555-0105", callerIdVerified: false },
      ],
      hoursOfOperation: "Monday - Friday: 8:00 AM - 5:00 PM EST",
      billingContact: "accounts@hybridmedical.com",
      billingNotes: "Net 30 terms. Invoice sent 1st of each month.",
      contractSignedDate: "2025-06-15",
      enrollmentStartDate: "2025-07-01",
      clientGoals: "Enroll 200 patients in CCM/RPM programs by end of Q4 2025. Achieve 80% patient retention rate. Generate $50,000+ monthly revenue from chronic care programs.",
      valueMetrics: "Focus on BP control improvement, medication adherence, and reduced ER visits. Track patient satisfaction scores monthly.",
      notes: "Client prefers communication via email. Dr. Mitchell is very data-driven - include charts and metrics in all presentations. Practice is expanding to a second location in Q1 2026.",
    },
    monthlyData: {
      '2025-11': {
        enrolledThisMonth: 42, activePatients: 178, servicesDelivered: 320, revenue: 12560,
        contacted: 124, enrolled: 42, smsSent: 450, smsConsented: 28, emailSent: 380,
        emailConsented: 22, mailersSent: 200, mailersConsented: 12, currentlyInOutreach: 22,
        campaignStartDate: '2025-11-01', bpImproved: 67, adherenceRate: 84, readmissionReduction: 23, avgResponseHours: 4,
      },
      '2025-10': {
        enrolledThisMonth: 36, activePatients: 165, servicesDelivered: 258, revenue: 10920,
        contacted: 98, enrolled: 36, smsSent: 380, smsConsented: 22, emailSent: 320,
        emailConsented: 18, mailersSent: 180, mailersConsented: 10, currentlyInOutreach: 18,
        campaignStartDate: '2025-10-01', bpImproved: 62, adherenceRate: 79, readmissionReduction: 19, avgResponseHours: 5,
      },
      '2025-09': {
        enrolledThisMonth: 29, activePatients: 148, servicesDelivered: 215, revenue: 8760,
        contacted: 82, enrolled: 29, smsSent: 320, smsConsented: 18, emailSent: 280,
        emailConsented: 15, mailersSent: 160, mailersConsented: 8, currentlyInOutreach: 14,
        campaignStartDate: '2025-09-01', bpImproved: 58, adherenceRate: 76, readmissionReduction: 17, avgResponseHours: 6,
      },
      '2025-08': {
        enrolledThisMonth: 24, activePatients: 132, servicesDelivered: 185, revenue: 7280,
        contacted: 72, enrolled: 24, smsSent: 280, smsConsented: 14, emailSent: 240,
        emailConsented: 12, mailersSent: 140, mailersConsented: 6, currentlyInOutreach: 12,
        campaignStartDate: '2025-08-01', bpImproved: 55, adherenceRate: 74, readmissionReduction: 15, avgResponseHours: 7,
      },
      '2025-07': {
        enrolledThisMonth: 18, activePatients: 118, servicesDelivered: 156, revenue: 5840,
        contacted: 58, enrolled: 18, smsSent: 220, smsConsented: 10, emailSent: 200,
        emailConsented: 9, mailersSent: 120, mailersConsented: 4, currentlyInOutreach: 10,
        campaignStartDate: '2025-07-01', bpImproved: 52, adherenceRate: 72, readmissionReduction: 12, avgResponseHours: 8,
      },
    },
    stories: {
      '2025-11': [
        { id: 1, title: "Proactive Care Success", quote: "One patient said this program is exactly what he needed three months ago. The regular check-ins helped him stay on track with his medication.", patientType: "CCM Patient, Week 3" },
        { id: 2, title: "Grateful Patient", quote: "Mrs. Johnson called specifically to thank our care team for catching her elevated blood pressure early. She felt genuinely cared for.", patientType: "RPM Patient, Month 2" },
      ],
      '2025-10': [
        { id: 1, title: "Medication Compliance Win", quote: "Patient reported feeling more confident about managing his diabetes after our team helped simplify his medication schedule.", patientType: "CCM Patient, Month 1" },
      ],
      '2025-09': [
        { id: 1, title: "Early Intervention", quote: "Caught a potential cardiac issue during routine monitoring. Patient was grateful for the quick response and follow-up care.", patientType: "RPM Patient, Week 4" },
      ],
    },
    opportunities: {
      '2025-11': [
        { id: 1, title: "Improve Answer Rates", description: "Resolve spam labeling issues with carrier registration. Expected 15-20% improvement in contact rates.", priority: 1 },
        { id: 2, title: "Provider Welcome Video", description: "Create personalized intro video from provider to increase trust and enrollment conversion.", priority: 2 },
        { id: 3, title: "Eligibility Filtering", description: "Optimize patient list filtering to reduce ineligible outreach and improve staff efficiency.", priority: 3 },
      ],
      '2025-10': [
        { id: 1, title: "Staff Training", description: "Schedule refresher training on new EMR integration features.", priority: 1 },
        { id: 2, title: "Patient Survey", description: "Launch satisfaction survey to gather feedback for Q4 planning.", priority: 2 },
      ],
    },
  },
  
  'spirazza-family': {
    id: 'spirazza-family',
    clientInfo: {
      clientName: "Cascade Enterprises",
      address: "567 Wellness Way, Orlando, FL 32801",
      phone: "(407) 555-0200",
      email: "contact@spirazzafamily.com",
      website: "www.spirazzafamilymedicine.com",
      stakeholders: [
        { id: 1, name: "Dr. Anthony Spirazza", title: "Owner/Physician", role: "Decision Maker", email: "a.spirazza@spirazzafamily.com", phone: "(407) 555-0201", reportsTo: null },
        { id: 2, name: "Linda Tran", title: "Office Manager", role: "Primary Contact", email: "l.tran@spirazzafamily.com", phone: "(407) 555-0202", reportsTo: 1 },
      ],
      weeklyMeetingSchedule: "First Monday of each month at 10:00 AM EST",
      emrName: "Athenahealth",
      careManagementCoordinator: { name: "Jennifer Adams", email: "j.adams@prysmcs.com", phone: "(555) 123-4567" },
      enrollmentSpecialists: [
        { id: 1, name: "Marcus Williams", email: "m.williams@prysmcs.com", phone: "(555) 123-4571" },
      ],
      csmAssigned: { name: "Sarah Chen", email: "s.chen@prysmcs.com", phone: "(555) 123-4572" },
      providers: [
        { id: 1, name: "Dr. Anthony Spirazza", npi: "5566778899", phone: "(407) 555-0201", callerIdVerified: true },
        { id: 2, name: "Dr. Rebecca Moore", npi: "9988776655", phone: "(407) 555-0203", callerIdVerified: true },
      ],
      hoursOfOperation: "Monday - Friday: 8:30 AM - 5:30 PM EST, Saturday: 9:00 AM - 1:00 PM",
      billingContact: "billing@spirazzafamily.com",
      billingNotes: "Net 15 terms. Auto-pay enabled.",
      contractSignedDate: "2025-04-01",
      enrollmentStartDate: "2025-05-01",
      clientGoals: "Reach 150 active CCM patients by end of year. Improve diabetic patient A1C outcomes. Generate $30,000+ monthly revenue.",
      valueMetrics: "Track A1C improvements, medication compliance, and patient satisfaction. Monthly NPS survey.",
      notes: "Dr. Spirazza prefers phone calls over email. Very hands-on and wants weekly updates during ramp-up phase. Expanding to include pediatric CCM in Q2 2026.",
    },
    monthlyData: {
      '2025-11': {
        enrolledThisMonth: 35, activePatients: 128, servicesDelivered: 245, revenue: 9520,
        contacted: 102, enrolled: 35, smsSent: 340, smsConsented: 24, emailSent: 280,
        emailConsented: 18, mailersSent: 175, mailersConsented: 10, currentlyInOutreach: 18,
        campaignStartDate: '2025-11-03', bpImproved: 63, adherenceRate: 81, readmissionReduction: 21, avgResponseHours: 5,
      },
      '2025-10': {
        enrolledThisMonth: 28, activePatients: 112, servicesDelivered: 198, revenue: 7840,
        contacted: 85, enrolled: 28, smsSent: 290, smsConsented: 18, emailSent: 240,
        emailConsented: 14, mailersSent: 150, mailersConsented: 8, currentlyInOutreach: 15,
        campaignStartDate: '2025-10-01', bpImproved: 58, adherenceRate: 76, readmissionReduction: 18, avgResponseHours: 6,
      },
      '2025-09': {
        enrolledThisMonth: 22, activePatients: 98, servicesDelivered: 168, revenue: 6420,
        contacted: 68, enrolled: 22, smsSent: 240, smsConsented: 14, emailSent: 200,
        emailConsented: 11, mailersSent: 130, mailersConsented: 6, currentlyInOutreach: 12,
        campaignStartDate: '2025-09-01', bpImproved: 54, adherenceRate: 73, readmissionReduction: 16, avgResponseHours: 7,
      },
      '2025-08': {
        enrolledThisMonth: 18, activePatients: 85, servicesDelivered: 142, revenue: 5280,
        contacted: 55, enrolled: 18, smsSent: 200, smsConsented: 11, emailSent: 170,
        emailConsented: 8, mailersSent: 110, mailersConsented: 5, currentlyInOutreach: 10,
        campaignStartDate: '2025-08-01', bpImproved: 50, adherenceRate: 70, readmissionReduction: 14, avgResponseHours: 8,
      },
      '2025-07': {
        enrolledThisMonth: 14, activePatients: 72, servicesDelivered: 118, revenue: 4120,
        contacted: 42, enrolled: 14, smsSent: 160, smsConsented: 8, emailSent: 140,
        emailConsented: 6, mailersSent: 90, mailersConsented: 3, currentlyInOutreach: 8,
        campaignStartDate: '2025-07-01', bpImproved: 48, adherenceRate: 68, readmissionReduction: 12, avgResponseHours: 9,
      },
    },
    stories: {
      '2025-11': [
        { id: 1, title: "Diabetes Turnaround", quote: "Mr. Garcia reduced his A1C from 9.2 to 7.1 in just 4 months. He credits the weekly check-ins for keeping him accountable.", patientType: "CCM Patient, Month 4" },
        { id: 2, title: "Preventive Care Win", quote: "We caught early signs of kidney issues in a diabetic patient during routine monitoring. Early intervention made all the difference.", patientType: "RPM Patient, Week 6" },
      ],
      '2025-10': [
        { id: 1, title: "Family Engagement", quote: "Patient's daughter joined our care calls and now helps manage her mother's medications. The whole family is more involved.", patientType: "CCM Patient, Month 2" },
      ],
    },
    opportunities: {
      '2025-11': [
        { id: 1, title: "Saturday Enrollment Calls", description: "Add Saturday morning enrollment shifts to reach working patients. Dr. Spirazza approved overtime budget.", priority: 1 },
        { id: 2, title: "Spanish Language Support", description: "30% of patient base is Spanish-speaking. Adding bilingual enrollment specialist would improve conversion.", priority: 2 },
      ],
      '2025-10': [
        { id: 1, title: "EMR Training", description: "Schedule Athenahealth integration training for new staff members.", priority: 1 },
      ],
    },
  },
  
  'burke-family': {
    id: 'burke-family',
    clientInfo: {
      clientName: "Summit Partners Group",
      address: "890 Healthcare Blvd, Jacksonville, FL 32256",
      phone: "(904) 555-0300",
      email: "info@burkefamilypractice.com",
      website: "www.burkefamilypractice.com",
      stakeholders: [
        { id: 1, name: "Dr. William Burke", title: "Senior Partner", role: "Decision Maker", email: "w.burke@burkefamily.com", phone: "(904) 555-0301", reportsTo: null },
        { id: 2, name: "Dr. Catherine Burke", title: "Partner", role: "Clinical Champion", email: "c.burke@burkefamily.com", phone: "(904) 555-0302", reportsTo: null },
        { id: 3, name: "Tom Henderson", title: "Practice Administrator", role: "Primary Contact", email: "t.henderson@burkefamily.com", phone: "(904) 555-0303", reportsTo: 1 },
        { id: 4, name: "Nancy White", title: "Billing Manager", role: "Billing Contact", email: "n.white@burkefamily.com", phone: "(904) 555-0304", reportsTo: 3 },
      ],
      weeklyMeetingSchedule: "Third Thursday of each month at 2:00 PM EST",
      emrName: "Epic",
      careManagementCoordinator: { name: "Robert Martinez", email: "r.martinez@prysmcs.com", phone: "(555) 123-4573" },
      enrollmentSpecialists: [
        { id: 1, name: "David Park", email: "d.park@prysmcs.com", phone: "(555) 123-4568" },
        { id: 2, name: "Kelly Johnson", email: "k.johnson@prysmcs.com", phone: "(555) 123-4574" },
        { id: 3, name: "Chris Lee", email: "c.lee@prysmcs.com", phone: "(555) 123-4575" },
      ],
      csmAssigned: { name: "Michael Roberts", email: "m.roberts@prysmcs.com", phone: "(555) 123-4570" },
      providers: [
        { id: 1, name: "Dr. William Burke", npi: "1111222233", phone: "(904) 555-0301", callerIdVerified: true },
        { id: 2, name: "Dr. Catherine Burke", npi: "4444555566", phone: "(904) 555-0302", callerIdVerified: true },
        { id: 3, name: "Dr. James Patterson", npi: "7777888899", phone: "(904) 555-0305", callerIdVerified: true },
        { id: 4, name: "NP Amanda Foster", npi: "1212121212", phone: "(904) 555-0306", callerIdVerified: false },
      ],
      hoursOfOperation: "Monday - Friday: 7:00 AM - 6:00 PM EST",
      billingContact: "n.white@burkefamily.com",
      billingNotes: "Net 45 terms. Requires itemized invoices. PO required for amounts over $5,000.",
      contractSignedDate: "2025-03-01",
      enrollmentStartDate: "2025-04-01",
      clientGoals: "Scale to 300 active patients across CCM and RPM. Achieve top-quartile outcomes in regional benchmarks. Target $75,000 monthly revenue by Q1 2026.",
      valueMetrics: "Comprehensive tracking: BP control, A1C, medication adherence, hospitalization rates, patient satisfaction, and staff efficiency metrics.",
      notes: "Large multi-physician practice with complex workflows. Dr. Catherine Burke is the internal champion - loop her in on clinical outcomes. They want detailed quarterly business reviews in addition to monthly reports. Considering adding BHI services in 2026.",
    },
    monthlyData: {
      '2025-11': {
        enrolledThisMonth: 58, activePatients: 268, servicesDelivered: 456, revenue: 21280,
        contacted: 172, enrolled: 58, smsSent: 580, smsConsented: 42, emailSent: 520,
        emailConsented: 36, mailersSent: 300, mailersConsented: 22, currentlyInOutreach: 32,
        campaignStartDate: '2025-10-28', bpImproved: 72, adherenceRate: 85, readmissionReduction: 28, avgResponseHours: 3,
      },
      '2025-10': {
        enrolledThisMonth: 52, activePatients: 245, servicesDelivered: 412, revenue: 18340,
        contacted: 156, enrolled: 52, smsSent: 520, smsConsented: 38, emailSent: 480,
        emailConsented: 32, mailersSent: 280, mailersConsented: 18, currentlyInOutreach: 28,
        campaignStartDate: '2025-10-01', bpImproved: 70, adherenceRate: 82, readmissionReduction: 26, avgResponseHours: 3,
      },
      '2025-09': {
        enrolledThisMonth: 48, activePatients: 225, servicesDelivered: 378, revenue: 16280,
        contacted: 142, enrolled: 48, smsSent: 480, smsConsented: 34, emailSent: 440,
        emailConsented: 28, mailersSent: 260, mailersConsented: 16, currentlyInOutreach: 25,
        campaignStartDate: '2025-09-01', bpImproved: 68, adherenceRate: 80, readmissionReduction: 24, avgResponseHours: 4,
      },
      '2025-08': {
        enrolledThisMonth: 42, activePatients: 198, servicesDelivered: 342, revenue: 14120,
        contacted: 128, enrolled: 42, smsSent: 420, smsConsented: 28, emailSent: 380,
        emailConsented: 24, mailersSent: 240, mailersConsented: 14, currentlyInOutreach: 22,
        campaignStartDate: '2025-08-01', bpImproved: 65, adherenceRate: 78, readmissionReduction: 22, avgResponseHours: 4,
      },
      '2025-07': {
        enrolledThisMonth: 38, activePatients: 175, servicesDelivered: 298, revenue: 12240,
        contacted: 112, enrolled: 38, smsSent: 360, smsConsented: 24, emailSent: 340,
        emailConsented: 20, mailersSent: 220, mailersConsented: 12, currentlyInOutreach: 18,
        campaignStartDate: '2025-07-01', bpImproved: 62, adherenceRate: 76, readmissionReduction: 20, avgResponseHours: 5,
      },
    },
    stories: {
      '2025-11': [
        { id: 1, title: "Heart Failure Prevention", quote: "Our care coordinator noticed weight gain trends in Mr. Thompson's daily readings. We adjusted his diuretics before it became an emergency.", patientType: "RPM Patient, Month 3" },
        { id: 2, title: "Caregiver Relief", quote: "Mrs. Davis's daughter called to say how much peace of mind the program gives her. Knowing someone checks on her mom daily lets her focus on work.", patientType: "CCM Patient, Month 5" },
        { id: 3, title: "Medication Sync Success", quote: "Identified that a patient was taking duplicate medications from two different pharmacies. Coordinated with both to resolve - potentially prevented serious interaction.", patientType: "CCM Patient, Week 8" },
      ],
      '2025-10': [
        { id: 1, title: "Post-Surgery Support", quote: "Patient recovering from knee replacement credits our daily check-ins with helping her stay on track with PT exercises.", patientType: "CCM Patient, Month 1" },
        { id: 2, title: "BP Control Achievement", quote: "After 3 months in the program, patient's BP went from 165/95 to 128/82. He's thrilled with the results.", patientType: "RPM Patient, Month 3" },
      ],
      '2025-09': [
        { id: 1, title: "Depression Screening Win", quote: "During routine CCM call, our nurse identified signs of depression. Patient is now getting proper mental health support.", patientType: "CCM Patient, Week 6" },
      ],
    },
    opportunities: {
      '2025-11': [
        { id: 1, title: "NP Protocol Expansion", description: "NP Amanda Foster can handle more complex CCM cases. Develop expanded protocols to increase her patient load.", priority: 1 },
        { id: 2, title: "Epic Integration", description: "Direct Epic integration would save 5+ hours/week of manual data entry. IT has approved the project for Q1.", priority: 2 },
        { id: 3, title: "BHI Pilot Program", description: "Dr. Catherine interested in adding Behavioral Health Integration. Prepare pilot proposal for 20 patients.", priority: 3 },
        { id: 4, title: "Referral Program", description: "Patient satisfaction is high - implement referral program for existing patients to recommend family members.", priority: 4 },
      ],
      '2025-10': [
        { id: 1, title: "Quarterly Business Review", description: "Prepare comprehensive QBR deck for Q3 results. Include benchmarking data.", priority: 1 },
        { id: 2, title: "NP Credentialing", description: "Complete caller ID verification for NP Amanda Foster.", priority: 2 },
      ],
    },
  },
};

// Helper to get client list for dropdown
const clientsList = [
  { id: 'hybrid-medical', name: 'Apex Solutions Inc' },
  { id: 'spirazza-family', name: 'Cascade Enterprises' },
  { id: 'burke-family', name: 'Summit Partners Group' },
];

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

const dailyEnrollmentTrend = [
  { date: "Nov 1", enrollments: 2, target: 3, activePatients: 140 },
  { date: "Nov 2", enrollments: 4, target: 3, activePatients: 144 },
  { date: "Nov 3", enrollments: 1, target: 3, activePatients: 145 },
  { date: "Nov 4", enrollments: 6, target: 3, activePatients: 151 },
  { date: "Nov 5", enrollments: 3, target: 3, activePatients: 154 },
  { date: "Nov 6", enrollments: 5, target: 3, activePatients: 159 },
  { date: "Nov 7", enrollments: 7, target: 3, activePatients: 166 },
  { date: "Nov 8", enrollments: 4, target: 3, activePatients: 170 },
  { date: "Nov 9", enrollments: 5, target: 3, activePatients: 175 },
  { date: "Nov 10", enrollments: 5, target: 3, activePatients: 178 },
];

const revenueSeries = [
  { month: "Jul", amount: 8500 },
  { month: "Aug", amount: 9200 },
  { month: "Sep", amount: 10300 },
  { month: "Oct", amount: 10920 },
  { month: "Nov", amount: 12560 },
];

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
  
  // Take last 6 months of data (or all if less)
  const recentMonths = monthKeys.slice(-6);
  
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
  const recentMonths = monthKeys.slice(-6);
  
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
function generateMetricHistory(clientData, metricId) {
  if (!clientData?.monthlyData) return [];
  
  const monthKeys = Object.keys(clientData.monthlyData).sort();
  const recentMonths = monthKeys.slice(-12); // Last 12 months
  
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

// PDF Report Component - Renders a printable report view
function PDFReportModal({ isOpen, onClose, dashboardData, clientInfo, stories, opportunities, monthLabel, sectionVisibility = {} }) {
  const { customization, getFormSchema, FIELD_TYPES } = useCustomization();
  const brandColor = customization.branding.primaryColor || '#14b8a6';
  const platformName = customization.branding.platformName || 'Med-Kick';
  const fontFamily = customization.branding.fontFamily || 'DM Sans';
  const formSchema = getFormSchema();
  
  if (!isOpen) return null;

  const monthYear = monthLabel || "November 2025";
  const generatedDate = new Date().toLocaleDateString('en-US', { 
    year: 'numeric', month: 'long', day: 'numeric' 
  });
  
  // Get schema sections
  const coreMetricsSection = formSchema.sections.find(s => s.id === 'coreMetrics');
  const enrollmentFunnelSection = formSchema.sections.find(s => s.id === 'enrollmentFunnel');
  const smsCampaignSection = formSchema.sections.find(s => s.id === 'smsCampaign');
  const emailCampaignSection = formSchema.sections.find(s => s.id === 'emailCampaign');
  const mailerCampaignSection = formSchema.sections.find(s => s.id === 'mailerCampaign');
  const outcomesSection = formSchema.sections.find(s => s.id === 'patientOutcomes');
  
  // Get raw form data
  const rawFormData = dashboardData.rawFormData || dashboardData;
  
  // Helper to get field value
  const getFieldValue = (fieldId) => {
    if (rawFormData && rawFormData[fieldId] !== undefined) {
      return rawFormData[fieldId];
    }
    return 0;
  };
  
  // Helper to format value
  const formatValue = (field, value) => {
    if (field.fieldType === FIELD_TYPES?.CURRENCY || field.prefix === '$') {
      return `$${Number(value || 0).toLocaleString()}`;
    }
    if (field.fieldType === FIELD_TYPES?.PERCENT || field.suffix === '%') {
      return `${value || 0}%`;
    }
    return value || 0;
  };
  
  // Get sorted fields for each section
  const coreFields = coreMetricsSection?.fields 
    ? [...coreMetricsSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const funnelFields = enrollmentFunnelSection?.fields 
    ? [...enrollmentFunnelSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const smsFields = smsCampaignSection?.fields 
    ? [...smsCampaignSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const emailFields = emailCampaignSection?.fields 
    ? [...emailCampaignSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const mailerFields = mailerCampaignSection?.fields 
    ? [...mailerCampaignSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const outcomesFields = outcomesSection?.fields 
    ? [...outcomesSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  
  // Default all sections to visible based on schema
  const visibility = {
    coreMetrics: coreMetricsSection?.enabled !== false,
    enrollmentFunnel: enrollmentFunnelSection?.enabled !== false,
    campaignPerformance: true,
    smsCampaign: smsCampaignSection?.enabled !== false,
    emailCampaign: emailCampaignSection?.enabled !== false,
    mailerCampaign: mailerCampaignSection?.enabled !== false,
    patientOutcomes: outcomesSection?.enabled !== false,
    stories: true,
    opportunities: true,
    ...sectionVisibility
  };
  
  // Calculate conversion rate from funnel fields
  const firstFunnelValue = funnelFields.length > 0 ? getFieldValue(funnelFields[0].id) : dashboardData.funnel.contacted;
  const lastFunnelValue = funnelFields.length > 1 ? getFieldValue(funnelFields[funnelFields.length - 1].id) : dashboardData.funnel.enrolled;
  const conversionRate = firstFunnelValue > 0 
    ? Math.round((lastFunnelValue / firstFunnelValue) * 100) 
    : 0;

  const handlePrint = () => {
    document.body.classList.add('printing-pdf-report');
    window.print();
    setTimeout(() => {
      document.body.classList.remove('printing-pdf-report');
    }, 1000);
  };

  return (
    <div className="pdf-modal-overlay pdf-printable">
      <div className="pdf-modal-header no-print">
        <div className="pdf-modal-title">
          <h2>Monthly Impact Report Preview</h2>
          <p>Review the report below, then click Print/Save PDF</p>
        </div>
        <div className="pdf-modal-actions">
          <button className="pdf-print-btn" onClick={handlePrint}>
            🖨️ Print / Save as PDF
          </button>
          <button className="pdf-close-btn" onClick={onClose}>
            ✕ Close
          </button>
        </div>
      </div>
      
      <div className="pdf-report-container">
        <div className="pdf-report" id="pdf-report-content">
          {/* Header */}
          <header className="pdf-header">
            <div className="pdf-logo-section">
              <h1 style={{ color: brandColor, fontFamily: `'${fontFamily}', sans-serif` }}>{platformName}</h1>
              <p>Chronic Care Management</p>
            </div>
            <div className="pdf-meta">
              <h2>Monthly Impact Report</h2>
              <p>{monthYear}</p>
              <p className="pdf-generated">Generated: {generatedDate}</p>
            </div>
          </header>
          
          {/* Client Banner */}
          <div className="pdf-client-banner">
            <h3>{clientInfo.clientName}</h3>
            <p>{clientInfo.address}</p>
          </div>
          
          {/* Executive Summary - Schema Driven */}
          {visibility.coreMetrics && (
            <div className="pdf-section">
              <div className="pdf-section-header">
                <span className="pdf-section-icon">📊</span>
                <h2>{coreMetricsSection?.title || 'Executive Summary'}</h2>
              </div>
              
              <div className="pdf-kpi-grid">
                {coreFields.length > 0 ? (
                  coreFields.map(field => {
                    const value = getFieldValue(field.id);
                    const deltaMap = {
                      'enrolledThisMonth': dashboardData.overview?.deltaEnrollment,
                      'activePatients': dashboardData.overview?.deltaActive,
                      'servicesDelivered': dashboardData.overview?.deltaServices,
                      'revenue': dashboardData.overview?.deltaRevenue,
                    };
                    const delta = deltaMap[field.id];
                    
                    return (
                      <div key={field.id} className="pdf-kpi-card">
                        <div className="pdf-kpi-value">{formatValue(field, value)}</div>
                        <div className="pdf-kpi-label">{field.label}</div>
                        {delta && (
                          <span className={`pdf-kpi-delta ${delta.startsWith('+') ? 'positive' : 'negative'}`}>
                            {delta} vs last month
                          </span>
                        )}
                      </div>
                    );
                  })
                ) : (
                  <>
                    <div className="pdf-kpi-card">
                      <div className="pdf-kpi-value">{dashboardData.overview.enrolledThisMonth}</div>
                      <div className="pdf-kpi-label">Enrolled This Month</div>
                    </div>
                    <div className="pdf-kpi-card">
                      <div className="pdf-kpi-value">{dashboardData.overview.activePatients}</div>
                      <div className="pdf-kpi-label">Active Patients</div>
                    </div>
                    <div className="pdf-kpi-card">
                      <div className="pdf-kpi-value">{dashboardData.overview.servicesDelivered}</div>
                      <div className="pdf-kpi-label">Services Delivered</div>
                    </div>
                    <div className="pdf-kpi-card">
                      <div className="pdf-kpi-value">{dashboardData.overview.revenueThisMonth}</div>
                      <div className="pdf-kpi-label">Revenue This Month</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Enrollment & Campaigns - Schema Driven */}
          {(visibility.enrollmentFunnel || visibility.campaignPerformance) && (
            <div className="pdf-section">
              <div className="pdf-section-header">
                <span className="pdf-section-icon blue">👥</span>
                <h2>Enrollment & Campaign Performance</h2>
              </div>
              
              <div className="pdf-two-col">
                {visibility.enrollmentFunnel && (
                  <div>
                    <h4 className="pdf-subsection-title">{enrollmentFunnelSection?.title || 'Enrollment Funnel'}</h4>
                    <table className="pdf-table">
                      <tbody>
                        {funnelFields.length > 0 ? (
                          <>
                            {funnelFields.map(field => (
                              <tr key={field.id}>
                                <td>{field.label}</td>
                                <td>{getFieldValue(field.id)}</td>
                              </tr>
                            ))}
                            <tr>
                              <td>Conversion Rate</td>
                              <td className="highlight">{conversionRate}%</td>
                            </tr>
                          </>
                        ) : (
                          <>
                            <tr>
                              <td>Patients Contacted</td>
                              <td>{dashboardData.funnel.contacted}</td>
                            </tr>
                            <tr>
                              <td>Successfully Enrolled</td>
                              <td>{dashboardData.funnel.enrolled}</td>
                            </tr>
                            <tr>
                              <td>Conversion Rate</td>
                              <td className="highlight">{conversionRate}%</td>
                            </tr>
                          </>
                        )}
                      </tbody>
                    </table>
                  </div>
                )}
                {visibility.campaignPerformance && (
                  <div>
                    <h4 className="pdf-subsection-title">Campaign Summary</h4>
                    <table className="pdf-table">
                      <tbody>
                        <tr>
                          <td>Total Consented via Campaigns</td>
                          <td>{dashboardData.campaign.totalConsented}</td>
                        </tr>
                        <tr>
                          <td>Days Into Campaign</td>
                          <td>{dashboardData.campaign.daysIntoCampaign}</td>
                        </tr>
                        <tr>
                          <td>Currently in Outreach</td>
                          <td>{dashboardData.campaign.currentlyInOutreach}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
              
              {visibility.campaignPerformance && (
                <div className="pdf-campaign-row">
                  {visibility.smsCampaign && (
                    <div className="pdf-campaign-card">
                      <h4>📱 {smsCampaignSection?.title || 'SMS'}</h4>
                      {smsFields.length > 0 ? (
                        smsFields.map(field => (
                          <div key={field.id} className="pdf-campaign-stat">
                            <span>{field.label}</span>
                            <span>{getFieldValue(field.id)}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="pdf-campaign-stat"><span>Sent</span><span>{dashboardData.campaign.sms.sent}</span></div>
                          <div className="pdf-campaign-stat"><span>Consented</span><span>{dashboardData.campaign.sms.consented}</span></div>
                        </>
                      )}
                    </div>
                  )}
                  {visibility.emailCampaign && (
                    <div className="pdf-campaign-card">
                      <h4>📧 {emailCampaignSection?.title || 'Email'}</h4>
                      {emailFields.length > 0 ? (
                        emailFields.map(field => (
                          <div key={field.id} className="pdf-campaign-stat">
                            <span>{field.label}</span>
                            <span>{getFieldValue(field.id)}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="pdf-campaign-stat"><span>Sent</span><span>{dashboardData.campaign.email.sent}</span></div>
                          <div className="pdf-campaign-stat"><span>Consented</span><span>{dashboardData.campaign.email.consented}</span></div>
                        </>
                      )}
                    </div>
                  )}
                  {visibility.mailerCampaign && (
                    <div className="pdf-campaign-card">
                      <h4>✉️ {mailerCampaignSection?.title || 'Mailer'}</h4>
                      {mailerFields.length > 0 ? (
                        mailerFields.map(field => (
                          <div key={field.id} className="pdf-campaign-stat">
                            <span>{field.label}</span>
                            <span>{getFieldValue(field.id)}</span>
                          </div>
                        ))
                      ) : (
                        <>
                          <div className="pdf-campaign-stat"><span>Sent</span><span>{dashboardData.campaign.mailers.sent}</span></div>
                          <div className="pdf-campaign-stat"><span>Consented</span><span>{dashboardData.campaign.mailers.consented}</span></div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
          {/* Clinical Outcomes - Schema Driven */}
          {visibility.patientOutcomes && (
            <div className="pdf-section">
              <div className="pdf-section-header">
                <span className="pdf-section-icon emerald">❤️</span>
                <h2>{outcomesSection?.title || 'Clinical Outcomes'}</h2>
              </div>
              
              <div className="pdf-outcomes-grid">
                {outcomesFields.length > 0 ? (
                  outcomesFields.map(field => (
                    <div key={field.id} className="pdf-outcome-card">
                      <div className="pdf-outcome-value">{formatValue(field, getFieldValue(field.id))}</div>
                      <div className="pdf-outcome-label">{field.label}</div>
                    </div>
                  ))
                ) : (
                  <>
                    <div className="pdf-outcome-card">
                      <div className="pdf-outcome-value">{dashboardData.outcomes.bpImproved}%</div>
                      <div className="pdf-outcome-label">BP Improved</div>
                    </div>
                    <div className="pdf-outcome-card">
                      <div className="pdf-outcome-value">{dashboardData.outcomes.adherenceRate}%</div>
                      <div className="pdf-outcome-label">Medication Adherence</div>
                    </div>
                    <div className="pdf-outcome-card">
                      <div className="pdf-outcome-value">{dashboardData.outcomes.readmissionReduction}%</div>
                      <div className="pdf-outcome-label">Readmission Reduction</div>
                    </div>
                    <div className="pdf-outcome-card">
                      <div className="pdf-outcome-value">{dashboardData.outcomes.avgResponse}</div>
                      <div className="pdf-outcome-label">Avg Response Time</div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
          
          {/* Success Stories - only show if stories section is visible AND has stories */}
          {visibility.stories && stories.length > 0 && (
            <div className="pdf-section">
              <div className="pdf-section-header">
                <span className="pdf-section-icon amber">💬</span>
                <h2>Patient Success Stories</h2>
              </div>
              
              {stories.map((story, i) => (
                <div key={i} className="pdf-story-card">
                  <h4>{story.title}</h4>
                  <p>"{story.quote}"</p>
                  <div className="pdf-patient-type">— {story.patientType}</div>
                </div>
              ))}
            </div>
          )}
          
          {/* Opportunities - only show if opportunities section is visible AND has opportunities */}
          {visibility.opportunities && opportunities.length > 0 && (
            <div className="pdf-section">
              <div className="pdf-section-header">
                <span className="pdf-section-icon rose">💡</span>
                <h2>Opportunities & Next Steps</h2>
              </div>
              
              {opportunities.map((opp, i) => (
                <div key={i} className="pdf-opportunity-item">
                  <div className="pdf-opportunity-number">{i + 1}</div>
                  <div className="pdf-opportunity-content">
                    <h4>{opp.title}</h4>
                    <p>{opp.description}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {/* CSM Contact */}
          <div className="pdf-csm-info">
            <h4>Your Med-Kick Team</h4>
            <p><strong>Customer Success Manager:</strong> {clientInfo.csmAssigned.name}</p>
            <p className="pdf-contact">{clientInfo.csmAssigned.email} · {clientInfo.csmAssigned.phone}</p>
          </div>
          
          {/* Footer */}
          <footer className="pdf-footer">
            <div><strong>Med-Kick</strong> · Chronic Care Management Solutions</div>
            <div>Confidential · Page 1 of 1</div>
          </footer>
        </div>
      </div>
    </div>
  );
}

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
  
  .form-field-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 4px;
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
    grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
    gap: 20px;
    margin-bottom: 32px;
    width: 100%;
  }

  .kpi-card {
    background: white;
    border-radius: 16px;
    padding: 24px;
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
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 16px;
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
    grid-template-columns: repeat(auto-fit, minmax(min(100%, 400px), 1fr));
    gap: 24px;
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
    gap: 4px;
    padding: 4px;
    background: var(--slate-100);
    border-radius: 12px;
    margin-bottom: 24px;
  }

  .tab-btn {
    flex: 1;
    padding: 12px 16px;
    background: transparent;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 500;
    color: var(--slate-600);
    cursor: pointer;
    transition: all 0.2s;
    font-family: inherit;
  }

  .tab-btn:hover {
    color: var(--slate-800);
  }

  .tab-btn.active {
    background: white;
    color: var(--brand-primary);
    box-shadow: 0 1px 3px rgba(0,0,0,0.08);
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
    .sidebar {
      width: 100%;
      position: fixed;
      left: -100%;
      transition: left 0.3s ease;
      z-index: 1000;
    }

    .sidebar.open {
      left: 0;
    }

    .main-content {
      margin-left: 0;
      width: 100%;
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
    }

    .page-title {
      font-size: 22px;
    }

    .kpi-grid, .outcomes-grid {
      grid-template-columns: 1fr;
      gap: 16px;
    }

    .two-col-grid {
      grid-template-columns: 1fr;
      gap: 16px;
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
    background: #fffbeb;
    border-top: 1px solid #fef3c7;
  }

  .login-demo-credentials p {
    font-size: 12px;
    font-weight: 600;
    color: #92400e;
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
    color: #f59e0b;
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
    background: var(--teal-600);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
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

  /* Widget Library Tab Styles */
  .widget-library-tab {
    padding: 0;
  }

  .widget-library-header {
    margin-bottom: 24px;
  }

  .widget-library-tabs {
    display: flex;
    gap: 8px;
    border-bottom: 2px solid var(--slate-200);
    padding-bottom: 0;
  }

  .wl-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: none;
    border: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--slate-500);
    cursor: pointer;
    position: relative;
    transition: all 0.2s;
  }

  .wl-tab:hover {
    color: var(--slate-700);
  }

  .wl-tab.active {
    color: var(--brand-primary);
  }

  .wl-tab.active::after {
    content: '';
    position: absolute;
    bottom: -2px;
    left: 0;
    right: 0;
    height: 2px;
    background: var(--brand-primary);
  }

  .widget-gallery {
    padding: 20px 0;
  }

  .gallery-controls {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
    gap: 16px;
    flex-wrap: wrap;
  }

  .gallery-search-input {
    padding: 10px 16px;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    font-size: 14px;
    min-width: 250px;
  }

  .gallery-filters {
    display: flex;
    gap: 8px;
  }

  .filter-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: 1px solid var(--slate-300);
    border-radius: 6px;
    background: white;
    font-size: 13px;
    font-weight: 500;
    color: var(--slate-600);
    cursor: pointer;
    transition: all 0.2s;
  }

  .filter-btn:hover {
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .filter-btn.active {
    background: var(--brand-primary);
    border-color: var(--brand-primary);
    color: white;
  }

  .widget-type-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 16px;
  }

  .widget-type-card {
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
  }

  .widget-type-card:hover {
    border-color: var(--brand-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
    transform: translateY(-2px);
  }

  .widget-type-preview {
    width: 64px;
    height: 64px;
    border-radius: 12px;
    background: linear-gradient(135deg, var(--brand-primary)15, var(--brand-primary)05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-primary);
    margin-bottom: 12px;
  }

  .widget-type-info h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-800);
  }

  .widget-type-category {
    font-size: 12px;
    color: var(--slate-500);
  }

  .widget-create-btn {
    margin-top: 12px;
    padding: 8px 16px;
    background: var(--brand-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    opacity: 0;
    transition: all 0.2s;
  }

  .widget-type-card:hover .widget-create-btn {
    opacity: 1;
  }

  /* My Widgets Section */
  .my-widgets-section {
    padding: 20px 0;
  }

  .empty-widgets {
    text-align: center;
    padding: 60px 20px;
    background: var(--slate-50);
    border-radius: 12px;
    color: var(--slate-500);
  }

  .empty-widgets svg {
    margin-bottom: 16px;
    opacity: 0.5;
  }

  .empty-widgets h3 {
    margin: 0 0 8px 0;
    font-size: 18px;
    color: var(--slate-700);
  }

  .empty-widgets p {
    margin: 0 0 20px 0;
    font-size: 14px;
  }

  .widgets-table {
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    overflow: hidden;
  }

  .widgets-table-header {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 100px 140px;
    background: var(--slate-50);
    padding: 12px 16px;
    font-size: 12px;
    font-weight: 600;
    color: var(--slate-600);
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .widgets-table-row {
    display: grid;
    grid-template-columns: 2fr 1fr 1fr 100px 140px;
    padding: 14px 16px;
    border-top: 1px solid var(--slate-100);
    align-items: center;
    transition: background 0.2s;
  }

  .widgets-table-row:hover {
    background: var(--slate-50);
  }

  .widgets-table-row.disabled {
    opacity: 0.6;
  }

  .wt-col {
    font-size: 14px;
    color: var(--slate-700);
  }

  .wt-name {
    display: flex;
    align-items: center;
    gap: 10px;
    font-weight: 500;
  }

  .wt-name svg {
    color: var(--brand-primary);
  }

  .page-badge {
    display: inline-block;
    padding: 4px 10px;
    background: var(--slate-100);
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
    text-transform: capitalize;
  }

  .status-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 4px;
    font-size: 12px;
    font-weight: 500;
  }

  .status-badge.active {
    background: #dcfce7;
    color: #059669;
  }

  .status-badge.inactive {
    background: var(--slate-100);
    color: var(--slate-500);
  }

  .wt-actions {
    display: flex;
    gap: 4px;
  }

  .icon-btn {
    width: 32px;
    height: 32px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: 1px solid var(--slate-200);
    border-radius: 6px;
    background: white;
    color: var(--slate-500);
    cursor: pointer;
    transition: all 0.2s;
  }

  .icon-btn:hover {
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .icon-btn.danger:hover {
    border-color: #ef4444;
    color: #ef4444;
    background: #fef2f2;
  }

  /* Templates Section */
  .templates-section {
    padding: 20px 0;
  }

  .templates-group {
    margin-bottom: 32px;
  }

  .templates-group h3 {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-800);
    margin: 0 0 8px 0;
  }

  .templates-desc {
    font-size: 14px;
    color: var(--slate-500);
    margin: 0 0 16px 0;
  }

  .templates-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 16px;
  }

  .template-card {
    background: white;
    border: 1px solid var(--slate-200);
    border-radius: 12px;
    padding: 20px;
    display: flex;
    gap: 16px;
    transition: all 0.2s;
  }

  .template-card:hover {
    border-color: var(--brand-primary);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .template-icon {
    width: 48px;
    height: 48px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--brand-primary)15, var(--brand-primary)05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-primary);
    flex-shrink: 0;
  }

  .template-info {
    flex: 1;
    min-width: 0;
  }

  .template-info h4 {
    margin: 0 0 4px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-800);
  }

  .template-info p {
    margin: 0 0 8px 0;
    font-size: 13px;
    color: var(--slate-500);
    line-height: 1.4;
  }

  .template-category {
    display: inline-block;
    padding: 2px 8px;
    background: var(--slate-100);
    border-radius: 4px;
    font-size: 11px;
    font-weight: 500;
    color: var(--slate-600);
    text-transform: capitalize;
  }

  .template-meta {
    font-size: 11px;
    color: var(--slate-400);
  }

  .template-actions {
    display: flex;
    gap: 8px;
    align-items: flex-start;
  }

  .use-template-btn {
    padding: 8px 14px;
    background: var(--brand-primary);
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 4px;
    white-space: nowrap;
    transition: all 0.2s;
  }

  .use-template-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
  }

  /* Widget Creation Wizard Modal */
  .widget-wizard-modal {
    background: white;
    border-radius: 16px;
    width: 90%;
    max-width: 600px;
    max-height: 90vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }

  .wizard-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 24px;
    border-bottom: 1px solid var(--slate-200);
  }

  .wizard-header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: var(--slate-800);
  }

  .close-btn {
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 8px;
    background: var(--slate-100);
    color: var(--slate-500);
    cursor: pointer;
    transition: all 0.2s;
  }

  .close-btn:hover {
    background: var(--slate-200);
    color: var(--slate-700);
  }

  .wizard-progress {
    display: flex;
    justify-content: center;
    gap: 32px;
    padding: 20px 24px;
    background: var(--slate-50);
  }

  .progress-step {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 6px;
  }

  .step-number {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: var(--slate-200);
    color: var(--slate-500);
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 600;
    transition: all 0.2s;
  }

  .progress-step.active .step-number {
    background: var(--brand-primary);
    color: white;
  }

  .progress-step.current .step-number {
    box-shadow: 0 0 0 4px var(--brand-primary)20;
  }

  .step-label {
    font-size: 11px;
    font-weight: 500;
    color: var(--slate-500);
  }

  .progress-step.active .step-label {
    color: var(--brand-primary);
  }

  .wizard-content {
    flex: 1;
    overflow-y: auto;
    padding: 24px;
  }

  .wizard-step h3 {
    margin: 0 0 20px 0;
    font-size: 16px;
    font-weight: 600;
    color: var(--slate-800);
  }

  .selected-type-preview {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 16px;
    background: var(--slate-50);
    border-radius: 10px;
    margin-top: 20px;
  }

  .type-preview-icon {
    width: 56px;
    height: 56px;
    border-radius: 10px;
    background: linear-gradient(135deg, var(--brand-primary)15, var(--brand-primary)05);
    display: flex;
    align-items: center;
    justify-content: center;
    color: var(--brand-primary);
  }

  .type-preview-info strong {
    display: block;
    font-size: 15px;
    color: var(--slate-800);
  }

  .type-preview-info span {
    font-size: 13px;
    color: var(--slate-500);
  }

  .data-type-options {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .data-type-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 18px;
    border: 2px solid var(--slate-200);
    border-radius: 10px;
    background: white;
    font-size: 13px;
    font-weight: 500;
    color: var(--slate-600);
    cursor: pointer;
    transition: all 0.2s;
  }

  .data-type-btn:hover {
    border-color: var(--brand-primary);
    color: var(--brand-primary);
  }

  .data-type-btn.active {
    border-color: var(--brand-primary);
    background: var(--brand-primary)08;
    color: var(--brand-primary);
  }

  .metrics-selector {
    max-height: 200px;
    overflow-y: auto;
    border: 1px solid var(--slate-200);
    border-radius: 8px;
    padding: 8px;
  }

  .metric-checkbox {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: 6px;
    cursor: pointer;
    transition: background 0.2s;
  }

  .metric-checkbox:hover {
    background: var(--slate-50);
  }

  .metric-checkbox input {
    width: 16px;
    height: 16px;
  }

  .metric-checkbox span {
    flex: 1;
    font-size: 13px;
    color: var(--slate-700);
  }

  .metric-category {
    font-size: 11px;
    color: var(--slate-400);
    text-transform: capitalize;
  }

  .form-hint {
    font-size: 13px;
    color: var(--slate-500);
    font-style: italic;
  }

  .color-scheme-options {
    display: flex;
    gap: 10px;
    flex-wrap: wrap;
  }

  .color-btn {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border: 2px solid var(--slate-200);
    border-radius: 8px;
    background: white;
    font-size: 13px;
    font-weight: 500;
    color: var(--slate-600);
    cursor: pointer;
    transition: all 0.2s;
  }

  .color-btn:hover {
    border-color: var(--slate-300);
  }

  .color-btn.active {
    border-color: var(--scheme-color, var(--brand-primary));
  }

  .color-preview-swatch {
    width: 16px;
    height: 16px;
    border-radius: 4px;
    background: var(--scheme-color, var(--brand-primary));
  }

  .size-options {
    display: flex;
    gap: 12px;
    flex-wrap: wrap;
  }

  .size-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 14px 20px;
    border: 2px solid var(--slate-200);
    border-radius: 10px;
    background: white;
    font-size: 12px;
    font-weight: 500;
    color: var(--slate-600);
    cursor: pointer;
    transition: all 0.2s;
  }

  .size-btn:hover {
    border-color: var(--brand-primary);
  }

  .size-btn.active {
    border-color: var(--brand-primary);
    background: var(--brand-primary)08;
    color: var(--brand-primary);
  }

  .size-preview {
    background: var(--slate-200);
    border-radius: 3px;
  }

  .size-btn.active .size-preview {
    background: var(--brand-primary);
  }

  .checkbox-label {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 14px;
    color: var(--slate-700);
    cursor: pointer;
  }

  .checkbox-label input {
    width: 18px;
    height: 18px;
  }

  .form-select {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    font-size: 14px;
    color: var(--slate-700);
    background: white;
  }

  .placement-summary {
    margin-top: 24px;
    padding: 16px;
    background: var(--slate-50);
    border-radius: 10px;
  }

  .placement-summary h4 {
    margin: 0 0 12px 0;
    font-size: 14px;
    font-weight: 600;
    color: var(--slate-700);
  }

  .summary-item {
    font-size: 13px;
    color: var(--slate-600);
    margin-bottom: 6px;
  }

  .summary-item strong {
    color: var(--slate-700);
  }

  .wizard-footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 24px;
    border-top: 1px solid var(--slate-200);
    background: var(--slate-50);
  }

  .wizard-footer-right {
    display: flex;
    gap: 10px;
  }

  .secondary-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 18px;
    border: 1px solid var(--slate-300);
    border-radius: 8px;
    background: white;
    font-size: 14px;
    font-weight: 500;
    color: var(--slate-600);
    cursor: pointer;
    transition: all 0.2s;
  }

  .secondary-btn:hover {
    border-color: var(--slate-400);
    color: var(--slate-700);
  }

  .secondary-btn.sm {
    padding: 6px 12px;
    font-size: 12px;
  }

  .cancel-btn {
    padding: 10px 18px;
    border: none;
    border-radius: 8px;
    background: none;
    font-size: 14px;
    font-weight: 500;
    color: var(--slate-500);
    cursor: pointer;
    transition: all 0.2s;
  }

  .cancel-btn:hover {
    color: var(--slate-700);
  }

  .primary-btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 20px;
    border: none;
    border-radius: 8px;
    background: var(--brand-primary);
    font-size: 14px;
    font-weight: 500;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .primary-btn:hover {
    opacity: 0.9;
    transform: translateY(-1px);
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

  .grid-widget.disabled {
    opacity: 0.5;
    border-style: dashed;
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
  }

  .widget-content-wrapper.edit-mode-active:hover {
    outline: 2px solid var(--brand-primary);
    outline-offset: 2px;
    z-index: 10;
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

// ============================================================
// CUSTOM WIDGET RENDERER
// ============================================================

function CustomWidgetRenderer({ widget, brandColor }) {
  const data_source = widget.data_source || {};

  const renderWidget = () => {
    switch (widget.widget_type) {
      case 'pie-chart':
      case 'donut-chart': {
        const segments = data_source.segments || [];
        const chartData = segments.map(seg => ({
          name: seg.name,
          value: parseFloat(seg.value) || 0,
        }));

        const COLORS = generateBrandPalette(brandColor);

        return (
          <ResponsiveContainer width="100%" height={300}>
            <RechartsPieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={widget.widget_type === 'donut-chart' ? 100 : 120}
                innerRadius={widget.widget_type === 'donut-chart' ? 60 : 0}
                fill="#8884d8"
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </RechartsPieChart>
          </ResponsiveContainer>
        );
      }

      case 'bar-chart':
      case 'horizontal-bar': {
        const datapoints = data_source.datapoints || [];
        const chartData = datapoints.map(dp => ({
          name: dp.label,
          value: parseFloat(dp.value) || 0,
        }));

        const ChartComponent = widget.widget_type === 'horizontal-bar' ? BarChart : BarChart;
        const layout = widget.widget_type === 'horizontal-bar' ? 'horizontal' : 'vertical';

        return (
          <ResponsiveContainer width="100%" height={300}>
            <ChartComponent data={chartData} layout={layout}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              {layout === 'horizontal' ? (
                <>
                  <XAxis type="number" stroke="#94a3b8" fontSize={12} />
                  <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={12} />
                </>
              ) : (
                <>
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
                  <YAxis stroke="#94a3b8" fontSize={12} />
                </>
              )}
              <Tooltip />
              <Bar dataKey="value" fill={brandColor} />
            </ChartComponent>
          </ResponsiveContainer>
        );
      }

      case 'combo-chart': {
        const datapoints = data_source.datapoints || [];
        const chartData = datapoints.map(dp => ({
          name: dp.label,
          bar: parseFloat(dp.barValue) || 0,
          line: parseFloat(dp.lineValue) || 0,
        }));

        return (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} />
              <YAxis stroke="#94a3b8" fontSize={12} />
              <Tooltip />
              <Legend />
              <Bar dataKey="bar" fill={brandColor} name="Bar" />
              <Line type="monotone" dataKey="line" stroke="#ef4444" strokeWidth={2} name="Line" />
            </ComposedChart>
          </ResponsiveContainer>
        );
      }

      case 'gauge': {
        const value = parseFloat(data_source.value) || 0;
        const max = parseFloat(data_source.maxValue) || 100;
        const percentage = (value / max) * 100;

        const gaugeData = [
          { name: 'Value', value: value, fill: brandColor },
          { name: 'Remaining', value: max - value, fill: '#e5e7eb' },
        ];

        return (
          <ResponsiveContainer width="100%" height={300}>
            <RadialBarChart
              cx="50%"
              cy="50%"
              innerRadius="60%"
              outerRadius="90%"
              barSize={20}
              data={[gaugeData[0]]}
              startAngle={180}
              endAngle={0}
            >
              <RadialBar
                minAngle={15}
                background
                clockWise
                dataKey="value"
              />
              <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 32, fontWeight: 'bold', fill: brandColor }}>
                {value}
              </text>
              <text x="50%" y="60%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: 14, fill: '#94a3b8' }}>
                of {max}
              </text>
            </RadialBarChart>
          </ResponsiveContainer>
        );
      }

      case 'metric-card': {
        const metrics = data_source.metrics || [];

        return (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '16px', padding: '16px' }}>
            {metrics.map((metric, index) => (
              <div key={index} style={{
                padding: '16px',
                background: '#f8fafc',
                borderRadius: '8px',
                border: '1px solid #e5e7eb'
              }}>
                <div style={{ fontSize: '13px', color: '#64748b', marginBottom: '8px' }}>{metric.label}</div>
                <div style={{ fontSize: '28px', fontWeight: 'bold', color: brandColor }}>{metric.value}</div>
              </div>
            ))}
          </div>
        );
      }

      default:
        return <div style={{ padding: '20px', color: '#64748b' }}>Widget type not supported: {widget.widget_type}</div>;
    }
  };

  return (
    <div className="chart-card">
      <div className="chart-header">
        <div>
          <h3 className="chart-title">{widget.title}</h3>
          {widget.description && <p className="chart-subtitle">{widget.description}</p>}
        </div>
      </div>
      {renderWidget()}
    </div>
  );
}

// ============================================================
// WIDGET CONFIGURATION MODAL
// ============================================================

function WidgetConfigModal({ isOpen, onClose, widgetType, onSave, customization, selectedClientId, editingWidget }) {
  const [step, setStep] = useState(1);
  const [selectedSection, setSelectedSection] = useState('');
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setSelectedSection('');
      setFormData({});
      setErrors({});
    } else if (editingWidget) {
      // Populate form with existing widget data when editing
      setStep(2);
      setSelectedSection(editingWidget.page_id);
      setFormData(editingWidget.data_source || {});
    }
  }, [isOpen, editingWidget]);

  if (!isOpen || !widgetType) return null;

  const widgetTypeInfo = Object.values(WIDGET_TYPES).find(w => w.id === widgetType);
  const configFields = WIDGET_CONFIG_FIELDS[widgetType] || [];
  const availableSections = customization?.navigation?.tabs || [];

  const validateForm = () => {
    const newErrors = {};
    configFields.forEach(field => {
      if (field.required && !formData[field.id]) {
        newErrors[field.id] = 'This field is required';
      }
      if (field.type === 'segments' || field.type === 'datapoints' || field.type === 'metrics') {
        if (!formData[field.id] || formData[field.id].length === 0) {
          newErrors[field.id] = 'At least one item is required';
        }
      }
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) return;

    setLoading(true);
    const widgetConfig = editingWidget ? {
      ...editingWidget,
      title: formData.title || editingWidget.title,
      data_source: formData,
      page_id: selectedSection,
    } : {
      client_id: selectedClientId,
      page_id: selectedSection,
      widget_id: `custom-${widgetType}-${Date.now()}`,
      widget_type: widgetType,
      title: formData.title || widgetTypeInfo.name,
      description: '',
      data_source: formData,
      settings: {},
      enabled: true,
      order: 999,
    };

    const result = await widgetConfigDB.saveWidgetConfig(widgetConfig);
    setLoading(false);

    if (result.success) {
      onSave(result.data);
      onClose();
    } else {
      setErrors({ general: 'Failed to save widget configuration' });
    }
  };

  const updateFormData = (fieldId, value) => {
    setFormData(prev => ({ ...prev, [fieldId]: value }));
    if (errors[fieldId]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldId];
        return newErrors;
      });
    }
  };

  const addArrayItem = (fieldId, item) => {
    const currentArray = formData[fieldId] || [];
    updateFormData(fieldId, [...currentArray, item]);
  };

  const removeArrayItem = (fieldId, index) => {
    const currentArray = formData[fieldId] || [];
    updateFormData(fieldId, currentArray.filter((_, i) => i !== index));
  };

  const updateArrayItem = (fieldId, index, updatedItem) => {
    const currentArray = formData[fieldId] || [];
    updateFormData(fieldId, currentArray.map((item, i) => i === index ? updatedItem : item));
  };

  const renderFieldInput = (field) => {
    const value = formData[field.id] || '';
    const error = errors[field.id];

    switch (field.type) {
      case 'text':
        return (
          <div key={field.id} style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#0f172a' }}>
              {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {field.hint && (
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '4px' }}>
                <HelpCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{field.hint}</span>
              </div>
            )}
            <input
              type="text"
              value={value}
              onChange={(e) => updateFormData(field.id, e.target.value)}
              placeholder={field.placeholder}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: error ? '2px solid #ef4444' : '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
          </div>
        );

      case 'number':
        return (
          <div key={field.id} style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#0f172a' }}>
              {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {field.hint && (
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '4px' }}>
                <HelpCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{field.hint}</span>
              </div>
            )}
            <input
              type="number"
              value={value}
              onChange={(e) => updateFormData(field.id, parseFloat(e.target.value) || 0)}
              placeholder={field.placeholder}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: error ? '2px solid #ef4444' : '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
              }}
            />
            {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
          </div>
        );

      case 'select':
        return (
          <div key={field.id} style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#0f172a' }}>
              {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {field.hint && (
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '4px' }}>
                <HelpCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{field.hint}</span>
              </div>
            )}
            <select
              value={value}
              onChange={(e) => updateFormData(field.id, e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px',
                border: error ? '2px solid #ef4444' : '2px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                background: 'white',
              }}
            >
              <option value="">Select...</option>
              {(field.options || []).map(opt => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
          </div>
        );

      case 'segments':
      case 'datapoints':
        const items = formData[field.id] || [];
        return (
          <div key={field.id} style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#0f172a' }}>
              {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {field.hint && (
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '4px' }}>
                <HelpCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{field.hint}</span>
              </div>
            )}
            <div style={{ border: '2px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              {items.map((item, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={item.name || ''}
                    onChange={(e) => updateArrayItem(field.id, index, { ...item, name: e.target.value })}
                    placeholder="Label"
                    style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <input
                    type="number"
                    value={item.value || 0}
                    onChange={(e) => updateArrayItem(field.id, index, { ...item, value: parseFloat(e.target.value) || 0 })}
                    placeholder="Value"
                    style={{ width: '100px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <button
                    onClick={() => removeArrayItem(field.id, index)}
                    style={{ padding: '8px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              <button
                onClick={() => addArrayItem(field.id, { name: '', value: 0 })}
                style={{
                  width: '100%',
                  padding: '8px',
                  background: '#f1f5f9',
                  border: '2px dashed #cbd5e1',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '13px',
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Plus size={16} /> Add Item
              </button>
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
          </div>
        );

      case 'metrics':
        const metrics = formData[field.id] || [];
        return (
          <div key={field.id} style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '6px', color: '#0f172a' }}>
              {field.label} {field.required && <span style={{ color: '#ef4444' }}>*</span>}
            </label>
            {field.hint && (
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '8px', display: 'flex', alignItems: 'start', gap: '4px' }}>
                <HelpCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>{field.hint}</span>
              </div>
            )}
            <div style={{ border: '2px solid #e2e8f0', borderRadius: '8px', padding: '12px' }}>
              {metrics.map((metric, index) => (
                <div key={index} style={{ display: 'flex', gap: '8px', marginBottom: '8px', alignItems: 'center' }}>
                  <input
                    type="text"
                    value={metric.label || ''}
                    onChange={(e) => updateArrayItem(field.id, index, { ...metric, label: e.target.value })}
                    placeholder="Metric Label"
                    style={{ flex: 1, padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <input
                    type="number"
                    value={metric.value || 0}
                    onChange={(e) => updateArrayItem(field.id, index, { ...metric, value: parseFloat(e.target.value) || 0 })}
                    placeholder="Value"
                    style={{ width: '100px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <input
                    type="text"
                    value={metric.unit || ''}
                    onChange={(e) => updateArrayItem(field.id, index, { ...metric, unit: e.target.value })}
                    placeholder="Unit"
                    style={{ width: '80px', padding: '8px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '13px' }}
                  />
                  <button
                    onClick={() => removeArrayItem(field.id, index)}
                    style={{ padding: '8px', background: '#fee2e2', border: 'none', borderRadius: '6px', cursor: 'pointer', color: '#ef4444' }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              {metrics.length < 4 && (
                <button
                  onClick={() => addArrayItem(field.id, { label: '', value: 0, unit: '' })}
                  style={{
                    width: '100%',
                    padding: '8px',
                    background: '#f1f5f9',
                    border: '2px dashed #cbd5e1',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '13px',
                    color: '#475569',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                  }}
                >
                  <Plus size={16} /> Add Metric
                </button>
              )}
            </div>
            {error && <div style={{ color: '#ef4444', fontSize: '12px', marginTop: '4px' }}>{error}</div>}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.6)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 10000,
      padding: '20px',
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        width: '100%',
        maxWidth: '700px',
        maxHeight: '90vh',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.3)',
      }}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>
              Add {widgetTypeInfo?.name}
            </h2>
            <p style={{ margin: '4px 0 0', fontSize: '13px', color: '#64748b' }}>
              Step {step} of 2: {step === 1 ? 'Choose Section' : 'Configure Widget'}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '8px',
              borderRadius: '6px',
              color: '#64748b',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <X size={20} />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px' }}>
          {step === 1 ? (
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 500, marginBottom: '12px', color: '#0f172a' }}>
                Select Dashboard Section <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <div style={{ fontSize: '12px', color: '#64748b', marginBottom: '16px', display: 'flex', alignItems: 'start', gap: '4px' }}>
                <HelpCircle size={14} style={{ marginTop: '2px', flexShrink: 0 }} />
                <span>Choose which dashboard page this widget will appear on</span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '12px' }}>
                {availableSections.filter(tab => tab.enabled).map(section => (
                  <button
                    key={section.id}
                    onClick={() => setSelectedSection(section.id)}
                    style={{
                      padding: '16px',
                      border: selectedSection === section.id ? `2px solid ${customization.branding.primaryColor}` : '2px solid #e2e8f0',
                      borderRadius: '12px',
                      background: selectedSection === section.id ? `${customization.branding.primaryColor}10` : 'white',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                    }}
                  >
                    <div style={{ fontSize: '14px', fontWeight: 600, color: '#0f172a', marginBottom: '4px' }}>
                      {section.label}
                    </div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>
                      Add to this section
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              {configFields.map(field => renderFieldInput(field))}
              {errors.general && (
                <div style={{
                  padding: '12px',
                  background: '#fee2e2',
                  border: '1px solid #ef4444',
                  borderRadius: '8px',
                  color: '#ef4444',
                  fontSize: '13px',
                  marginTop: '16px',
                }}>
                  {errors.general}
                </div>
              )}
            </div>
          )}
        </div>

        <div style={{
          padding: '24px',
          borderTop: '1px solid #e2e8f0',
          display: 'flex',
          justifyContent: 'space-between',
          gap: '12px',
        }}>
          {step === 1 ? (
            <>
              <button
                onClick={onClose}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#475569',
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => setStep(2)}
                disabled={!selectedSection}
                style={{
                  padding: '10px 20px',
                  background: selectedSection ? customization.branding.primaryColor : '#cbd5e1',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: selectedSection ? 'pointer' : 'not-allowed',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Continue <ChevronRight size={16} />
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => setStep(1)}
                style={{
                  padding: '10px 20px',
                  background: 'white',
                  border: '2px solid #e2e8f0',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: '#475569',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <ChevronLeft size={16} /> Back
              </button>
              <button
                onClick={handleSave}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  background: loading ? '#cbd5e1' : customization.branding.primaryColor,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: '14px',
                  fontWeight: 500,
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                {loading ? 'Saving...' : <><CheckCircle size={16} /> Save Widget</>}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function KpiCard({ icon: Icon, label, value, delta, iconColor = "teal", brandColor }) {
  const isPositive = delta?.startsWith("+");
  const iconStyle = iconColor === 'brand' && brandColor ? { background: brandColor, color: 'white' } : {};

  return (
    <div className="kpi-card">
      <div className={`kpi-icon ${iconColor === 'brand' ? '' : iconColor}`} style={iconStyle}>
        <Icon size={22} />
      </div>
      <div className="kpi-label">{label}</div>
      <div className="kpi-value" style={iconColor === 'brand' && brandColor ? { color: brandColor } : {}}>{value}</div>
      {delta && (
        <span className={`kpi-delta ${isPositive ? "positive" : "negative"}`}>
          <TrendingUp size={14} />
          {delta} vs last month
        </span>
      )}
    </div>
  );
}

function PieChartWidget({ data, title, brandColor }) {
  const colors = generateBrandPalette(brandColor);
  return (
    <div className="widget-card">
      <h3 className="widget-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={100}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

function DonutChartWidget({ data, title, brandColor, centerLabel = '' }) {
  const colors = generateBrandPalette(brandColor);
  return (
    <div className="widget-card">
      <h3 className="widget-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <RechartsPieChart>
          <Pie
            data={data}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={100}
            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
          {centerLabel && (
            <text x="50%" y="50%" textAnchor="middle" dominantBaseline="middle" style={{ fontSize: '24px', fontWeight: 'bold' }}>
              {centerLabel}
            </text>
          )}
        </RechartsPieChart>
      </ResponsiveContainer>
    </div>
  );
}

function GaugeWidget({ value, max = 100, title, brandColor, target = null }) {
  const color = brandColor || '#0d9488';
  const percentage = (value / max) * 100;
  const data = [
    { name: 'Current', value: value, fill: color },
    { name: 'Remaining', value: Math.max(0, max - value), fill: '#e5e7eb' }
  ];

  return (
    <div className="widget-card">
      <h3 className="widget-title">{title}</h3>
      <div style={{ position: 'relative' }}>
        <ResponsiveContainer width="100%" height={200}>
          <RechartsPieChart>
            <Pie
              data={data}
              dataKey="value"
              startAngle={180}
              endAngle={0}
              cx="50%"
              cy="80%"
              innerRadius={60}
              outerRadius={100}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.fill} />
              ))}
            </Pie>
          </RechartsPieChart>
        </ResponsiveContainer>
        <div style={{
          position: 'absolute',
          bottom: '20px',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '32px', fontWeight: 'bold', color: color }}>{value}</div>
          <div style={{ fontSize: '14px', color: '#64748b' }}>
            {percentage.toFixed(1)}% of {max}
            {target && <div style={{ fontSize: '12px', marginTop: '4px' }}>Target: {target}</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

function HorizontalBarWidget({ data, title, brandColor, xAxisLabel = '', yAxisLabel = '' }) {
  const color = brandColor || '#0d9488';
  return (
    <div className="widget-card">
      <h3 className="widget-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data} layout="vertical">
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis type="number" label={{ value: xAxisLabel, position: 'insideBottom', offset: -5 }} />
          <YAxis type="category" dataKey="name" width={100} label={{ value: yAxisLabel, angle: -90, position: 'insideLeft' }} />
          <Tooltip />
          <Bar dataKey="value" fill={color} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function StackedBarWidget({ data, title, keys, brandColor }) {
  const colors = generateBrandPalette(brandColor);
  return (
    <div className="widget-card">
      <h3 className="widget-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          {keys.map((key, index) => (
            <Bar key={key} dataKey={key} stackId="a" fill={colors[index % colors.length]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function ComboChartWidget({ data, title, lineKey, barKey, brandColor }) {
  const colors = generateBrandPalette(brandColor);
  return (
    <div className="widget-card">
      <h3 className="widget-title">{title}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <ComposedChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.06)" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey={barKey} fill={colors[0]} />
          <Line type="monotone" dataKey={lineKey} stroke={colors[3]} strokeWidth={2} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
  );
}

function DataTableWidget({ data, title, columns, brandColor }) {
  const color = brandColor || '#0d9488';
  return (
    <div className="widget-card">
      <h3 className="widget-title">{title}</h3>
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${color}` }}>
              {columns.map((col, idx) => (
                <th key={idx} style={{ padding: '12px', textAlign: 'left', fontWeight: 600, color: color }}>
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.map((row, rowIdx) => (
              <tr key={rowIdx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                {columns.map((col, colIdx) => (
                  <td key={colIdx} style={{ padding: '12px', color: '#64748b' }}>
                    {col.format ? col.format(row[col.key]) : row[col.key]}
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

function MetricComparisonWidget({ metrics, title, brandColor }) {
  const colors = generateBrandPalette(brandColor);
  return (
    <div className="widget-card">
      <h3 className="widget-title">{title}</h3>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginTop: '16px' }}>
        {metrics.map((metric, idx) => (
          <div key={idx} style={{ padding: '16px', background: '#f8fafc', borderRadius: '8px', border: '1px solid #e5e7eb' }}>
            <div style={{ fontSize: '14px', color: '#64748b', marginBottom: '8px' }}>{metric.label}</div>
            <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors[idx % colors.length] }}>{metric.value}</div>
            {metric.change && (
              <div style={{ fontSize: '12px', color: metric.change.startsWith('+') ? '#10b981' : '#ef4444', marginTop: '4px' }}>
                {metric.change}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function ProgressBarWidget({ value, max = 100, title, label = '', brandColor, showPercentage = true }) {
  const color = brandColor || '#0d9488';
  const percentage = (value / max) * 100;

  return (
    <div className="widget-card">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
        <h3 className="widget-title" style={{ margin: 0 }}>{title}</h3>
        {showPercentage && <span style={{ fontSize: '14px', fontWeight: 600, color: color }}>{percentage.toFixed(1)}%</span>}
      </div>
      <div style={{ width: '100%', height: '24px', background: '#f1f5f9', borderRadius: '12px', overflow: 'hidden', position: 'relative' }}>
        <div style={{
          width: `${Math.min(percentage, 100)}%`,
          height: '100%',
          background: color,
          transition: 'width 0.3s ease',
          borderRadius: '12px'
        }} />
      </div>
      {label && (
        <div style={{ marginTop: '8px', fontSize: '14px', color: '#64748b', textAlign: 'center' }}>
          {label}
        </div>
      )}
    </div>
  );
}

function Sidebar({ activePage, setActivePage }) {
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
      'DollarSign': DollarSign,
      'Heart': Heart,
      'MessageSquare': MessageSquare,
      'Lightbulb': Lightbulb,
      'Calendar': Calendar,
      'TrendingUp': TrendingUp,
      'Activity': Activity,
      'Settings': Settings,
      'Target': Target,
      'BarChart2': BarChart2,
      'PieChart': PieChart,
      'FileText': FileText,
      'Mail': Mail,
      'Bell': Bell,
      'Shield': Shield,
      'Star': Star,
      'Award': Award,
      'Briefcase': Briefcase,
    };
    const permissionMap = {
      'overview': 'view_dashboard',
      'enrollment': 'view_patients',
      'financial': 'view_financial',
      'outcomes': 'view_outcomes',
      'stories': 'view_stories',
      'initiatives': 'view_initiatives',
      'opportunities': 'view_opportunities',
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
    { id: "admin", label: "Dashboard Management", icon: LayoutDashboard, permission: 'edit_data' },
    { id: "notifications", label: "Notifications & Alerts", icon: Bell, permission: 'edit_data' },
    { id: "customization", label: "Customization", icon: Palette, permission: 'manage_customization' },
    { id: "users", label: "User Management", icon: UserCheck, permission: 'manage_users' },
    { id: "audit", label: "Audit Trail", icon: ClipboardList, permission: 'view_audit_log' },
  ];

  const visibleSettingsItems = settingsItems.filter(item => hasPermission(item.permission));
  const isSettingsActive = settingsItems.some(item => item.id === activePage);

  const branding = customization.branding;
  const textColor = branding.sidebarTextColor || '#ffffff';

  return (
    <aside className="sidebar" style={{ background: branding.sidebarBg, color: textColor }}>
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

function NotificationBell() {
  const { customization, getActiveAlerts, dismissAlert, snoozeAlert } = useCustomization();
  const { hasPermission } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [popupAlerts, setPopupAlerts] = useState([]);
  const bellRef = useRef(null);
  const lastAlertCountRef = useRef(0);
  
  // Notifications are internal-only - clients should not see them
  if (!hasPermission('edit_data')) {
    return null;
  }
  
  const activeAlerts = getActiveAlerts();
  const alertCount = activeAlerts.length;
  
  // Show popup when new alerts come in
  useEffect(() => {
    if (alertCount > lastAlertCountRef.current && lastAlertCountRef.current > 0) {
      // New alert added - show popup for the newest one
      const newestAlert = activeAlerts[activeAlerts.length - 1];
      if (newestAlert && !popupAlerts.find(p => p.id === newestAlert.id)) {
        setPopupAlerts(prev => [...prev, newestAlert]);
        // Auto-dismiss popup after 5 seconds
        setTimeout(() => {
          setPopupAlerts(prev => prev.filter(p => p.id !== newestAlert.id));
        }, 5000);
      }
    }
    lastAlertCountRef.current = alertCount;
  }, [alertCount, activeAlerts]);
  
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
    warning: AlertTriangle,
    info: Activity,
    inactive: Clock
  };
  
  const handleDismissPopup = (alertId) => {
    setPopupAlerts(prev => prev.filter(p => p.id !== alertId));
    dismissAlert(alertId);
  };
  
  return (
    <>
      {/* Popup Notifications */}
      <div className="notification-popups">
        {popupAlerts.map(alert => {
          const IconComponent = typeIcons[alert.type] || AlertCircle;
          return (
            <div key={alert.id} className={`notification-popup ${alert.type}`}>
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
          className={`notification-bell-btn ${alertCount > 0 ? 'has-alerts' : ''}`}
          onClick={() => setIsOpen(!isOpen)}
          title="Notifications"
        >
          <Bell size={20} />
          {alertCount > 0 && (
            <span className="notification-badge">{alertCount > 9 ? '9+' : alertCount}</span>
          )}
        </button>
        
        {isOpen && (
          <div className="notification-dropdown">
            <div className="notification-dropdown-header">
              <h4>Notifications</h4>
              {alertCount > 0 && <span className="alert-count">{alertCount} active</span>}
            </div>
            <div className="notification-dropdown-body">
              {activeAlerts.length === 0 ? (
                <div className="no-notifications">
                  <Bell size={24} />
                  <p>No active notifications</p>
                </div>
              ) : (
                activeAlerts.slice(0, 5).map(alert => {
                  const IconComponent = typeIcons[alert.type] || AlertCircle;
                  return (
                    <div key={alert.id} className={`notification-dropdown-item ${alert.type}`}>
                      <IconComponent size={16} />
                      <div className="notification-item-content">
                        <strong>{alert.title}</strong>
                        <p>{alert.message}</p>
                        <span className="notification-time">{alert.time}</span>
                      </div>
                      <div className="notification-item-actions">
                        <button 
                          onClick={() => snoozeAlert(alert.id, 1)} 
                          title="Snooze 1 hour"
                          className="snooze-btn"
                        >
                          <Clock size={14} />
                        </button>
                        <button 
                          onClick={() => dismissAlert(alert.id)} 
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
            {alertCount > 5 && (
              <div className="notification-dropdown-footer">
                <span>+{alertCount - 5} more notifications</span>
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Topbar({ onExport, onPresent, selectedClientId, onClientChange, selectedMonth, onMonthChange, hasUnsavedChanges, canGoBack, onGoBack, onAddClient, onDeleteClient, clients }) {
  const { currentUser, hasPermission, canAccessClient } = useAuth();
  
  // Filter clients based on user's access
  const accessibleClients = (clients || clientsList).filter(client => canAccessClient(client.id));
  
  return (
    <header className="topbar">
      <div className="topbar-left">
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
              <option key={month.id} value={month.id}>{month.label}</option>
            ))}
          </select>
        </div>
        {hasUnsavedChanges && (
          <span className="unsaved-indicator">● Unsaved changes</span>
        )}
      </div>
      <div className="topbar-right">
        <NotificationBell />
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
// PRESENTATION MODE
// ============================================================

// Generate default slides from dashboard data
function generateDefaultSlides(dashboardData, clientInfo, stories, opportunities, monthLabel, branding = {}, sectionVisibility = {}) {
  // Default content layout - centered, full size
  const defaultLayout = { x: 0, y: 0, width: 100, height: 100 }; // percentages
  const platformName = branding.platformName || 'Med-Kick';
  
  // Default visibility - all true if not specified
  const visibility = {
    coreMetrics: true,
    enrollmentFunnel: true,
    campaignPerformance: true,
    patientOutcomes: true,
    stories: true,
    opportunities: true,
    ...sectionVisibility
  };
  
  const slides = [
    {
      id: 'title',
      type: 'title',
      title: `${platformName} Monthly Impact Report`,
      subtitle: clientInfo.clientName,
      meta: monthLabel,
      enabled: true,
      order: 0,
      contentLayout: { ...defaultLayout },
    },
  ];
  
  // Only add KPIs slide if core metrics is visible
  if (visibility.coreMetrics) {
    slides.push({
      id: 'kpis',
      type: 'kpis',
      title: 'Key Performance Indicators',
      data: dashboardData.overview,
      previousMonth: dashboardData.previousMonth,
      enabled: true,
      order: slides.length,
      contentLayout: { ...defaultLayout },
    });
  }
  
  // Only add enrollment slide if either funnel or campaign is visible
  if (visibility.enrollmentFunnel || visibility.campaignPerformance) {
    slides.push({
      id: 'enrollment',
      type: 'enrollment',
      title: 'Enrollment & Outreach',
      funnel: dashboardData.funnel,
      campaign: dashboardData.campaign,
      enabled: true,
      order: slides.length,
      contentLayout: { ...defaultLayout },
      showFunnel: visibility.enrollmentFunnel,
      showCampaign: visibility.campaignPerformance,
    });
  }
  
  // Only add outcomes slide if patient outcomes is visible
  if (visibility.patientOutcomes) {
    slides.push({
      id: 'outcomes',
      type: 'outcomes',
      title: 'Clinical Outcomes',
      data: dashboardData.outcomes,
      enabled: true,
      order: slides.length,
      contentLayout: { ...defaultLayout },
    });
  }

  // Only add stories slide if stories is visible AND there are stories
  if (visibility.stories && stories.length > 0) {
    slides.push({
      id: 'stories',
      type: 'stories',
      title: 'Patient Success Stories',
      stories: stories,
      enabled: true,
      order: slides.length,
      contentLayout: { ...defaultLayout },
    });
  }

  // Only add opportunities slide if opportunities is visible AND there are opportunities
  if (visibility.opportunities && opportunities.length > 0) {
    slides.push({
      id: 'opportunities',
      type: 'opportunities',
      title: 'Opportunities & Next Steps',
      opportunities: opportunities,
      enabled: true,
      order: slides.length,
      contentLayout: { ...defaultLayout },
    });
  }

  slides.push({
    id: 'closing',
    type: 'closing',
    title: 'Thank You',
    subtitle: 'Questions & Discussion',
    csm: clientInfo.csmAssigned,
    enabled: true,
    order: slides.length,
    contentLayout: { ...defaultLayout },
  });

  return slides;
}

function PresentationMode({ isOpen, onClose, dashboardData, clientInfo, stories, opportunities, monthLabel, formData }) {
  const { customization } = useCustomization();
  const [slides, setSlides] = useState([]);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isPresenting, setIsPresenting] = useState(false);
  const [animation, setAnimation] = useState('fade');
  const [editingSlide, setEditingSlide] = useState(null);
  const [draggedSlide, setDraggedSlide] = useState(null);
  const [selectedElement, setSelectedElement] = useState(null);
  const [showBgPicker, setShowBgPicker] = useState(false);
  const fileInputRef = React.useRef(null);
  
  const slideBg = customization.branding.slideBg || 'linear-gradient(135deg, #0f3d3e 0%, #0d4f4f 50%, #115e59 100%)';
  
  // Slide background presets
  const bgPresets = [
    { name: 'Default', value: slideBg },
    { name: 'Dark Teal', value: 'linear-gradient(135deg, #0f3d3e 0%, #0d4f4f 50%, #115e59 100%)' },
    { name: 'Ocean', value: 'linear-gradient(135deg, #0c4a6e 0%, #075985 50%, #0369a1 100%)' },
    { name: 'Purple', value: 'linear-gradient(135deg, #4c1d95 0%, #6d28d9 50%, #7c3aed 100%)' },
    { name: 'Sunset', value: 'linear-gradient(135deg, #9a3412 0%, #c2410c 50%, #ea580c 100%)' },
    { name: 'Forest', value: 'linear-gradient(135deg, #14532d 0%, #166534 50%, #15803d 100%)' },
    { name: 'Midnight', value: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #3730a3 100%)' },
    { name: 'Rose', value: 'linear-gradient(135deg, #881337 0%, #9f1239 50%, #be123c 100%)' },
    { name: 'Slate', value: 'linear-gradient(135deg, #1e293b 0%, #334155 50%, #475569 100%)' },
    { name: 'Brand', value: `linear-gradient(135deg, ${customization.branding.secondaryColor || '#0d9488'} 0%, ${customization.branding.primaryColor || '#14b8a6'} 100%)` },
  ];
  
  // Update slide background
  const updateSlideBackground = (slideId, background) => {
    setSlides(slides.map(s => s.id === slideId ? { ...s, background } : s));
  };
  
  // Use sidebar background for the presentation mode outer area, or derive from primary color
  const presViewerBg = customization.branding.sidebarBg || `linear-gradient(180deg, ${customization.branding.secondaryColor || '#0d9488'} 0%, ${customization.branding.primaryColor || '#14b8a6'}33 100%)`;

  const wasOpenRef = React.useRef(false);
  
  // Get section visibility from formData
  const sectionVisibility = formData?.sectionVisibility || {};
  
  // Track if we've initialized slides for this session
  const slidesInitializedRef = React.useRef(false);
  
  // Regenerate slides ONLY when modal opens (ensures fresh client data while preserving edits during session)
  useEffect(() => {
    if (isOpen && !wasOpenRef.current) {
      // Modal just opened - generate fresh slides with current data
      setSlides(generateDefaultSlides(dashboardData, clientInfo, stories, opportunities, monthLabel, customization.branding, sectionVisibility));
      setCurrentSlide(0);
      setIsPresenting(false);
      setEditingSlide(null);
      setSelectedElement(null);
      slidesInitializedRef.current = true;
    }
    if (!isOpen) {
      slidesInitializedRef.current = false;
    }
    wasOpenRef.current = isOpen;
  }, [isOpen, dashboardData, clientInfo, stories, opportunities, monthLabel, customization.branding, sectionVisibility]);
  
  const enabledSlides = slides.filter(s => s.enabled).sort((a, b) => a.order - b.order);
  
  // Keyboard navigation
  useEffect(() => {
    if (!isPresenting) return;
    
    const handleKeyDown = (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        setCurrentSlide(prev => Math.min(prev + 1, enabledSlides.length - 1));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlide(prev => Math.max(prev - 1, 0));
      } else if (e.key === 'Escape') {
        setIsPresenting(false);
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isPresenting, enabledSlides.length]);

  const nextSlide = () => {
    if (currentSlide < enabledSlides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlide > 0) {
      setCurrentSlide(currentSlide - 1);
    }
  };

  const toggleSlide = (slideId) => {
    setSlides(slides.map(s => s.id === slideId ? { ...s, enabled: !s.enabled } : s));
  };

  // Add text element to current slide
  const addTextElement = () => {
    if (!editingSlide) return;
    
    const newElement = {
      id: `elem-${Date.now()}`,
      type: 'text',
      content: 'Double-click to edit',
      x: 50,
      y: 50,
      width: 200,
      height: 60,
      fontSize: 18,
      color: '#ffffff',
      fontWeight: 'normal',
    };
    
    setSlides(slides.map(s => {
      if (s.id === editingSlide) {
        return { ...s, overlayElements: [...(s.overlayElements || []), newElement] };
      }
      return s;
    }));
    setSelectedElement(newElement.id);
  };

  // Add image element to current slide
  const addImageElement = () => {
    fileInputRef.current?.click();
  };

  // Add a new custom slide
  const addCustomSlide = () => {
    const slideId = `custom-${Date.now()}`;
    const newSlide = {
      id: slideId,
      type: 'custom',
      enabled: true,
      order: slides.length,
      isCustom: true,
      overlayElements: [
        {
          id: `elem-${Date.now()}-title`,
          type: 'text',
          content: 'New Slide',
          x: 60,
          y: 60,
          width: 600,
          fontSize: 42,
          color: '#ffffff',
          fontWeight: 'bold',
        },
        {
          id: `elem-${Date.now()}-subtitle`,
          type: 'text',
          content: 'Click to edit or add more elements',
          x: 60,
          y: 130,
          width: 500,
          fontSize: 20,
          color: 'rgba(255,255,255,0.7)',
          fontWeight: 'normal',
        },
      ],
    };
    setSlides([...slides, newSlide]);
    setEditingSlide(newSlide.id);
    setSelectedElement(null);
  };

  // Delete a custom slide
  const deleteSlide = (slideId) => {
    setSlides(slides.filter(s => s.id !== slideId));
    if (editingSlide === slideId) {
      setEditingSlide(null);
      setSelectedElement(null);
    }
  };

  const handleImageUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file || !editingSlide) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const newElement = {
        id: `elem-${Date.now()}`,
        type: 'image',
        src: event.target.result,
        x: 50,
        y: 50,
        width: 200,
        height: 150,
      };
      
      setSlides(slides.map(s => {
        if (s.id === editingSlide) {
          return { ...s, overlayElements: [...(s.overlayElements || []), newElement] };
        }
        return s;
      }));
      setSelectedElement(newElement.id);
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Update element within a slide
  const updateElement = (slideId, elementId, updates) => {
    setSlides(slides.map(s => {
      if (s.id === slideId) {
        return {
          ...s,
          overlayElements: (s.overlayElements || []).map(el =>
            el.id === elementId ? { ...el, ...updates } : el
          ),
        };
      }
      return s;
    }));
  };

  // Delete element from slide
  const deleteElement = (slideId, elementId) => {
    setSlides(slides.map(s => {
      if (s.id === slideId) {
        return {
          ...s,
          overlayElements: (s.overlayElements || []).filter(el => el.id !== elementId),
        };
      }
      return s;
    }));
    setSelectedElement(null);
  };

  const updateSlide = (slideId, updates) => {
    setSlides(slides.map(s => s.id === slideId ? { ...s, ...updates } : s));
  };

  // Update content layout (position/size of main slide content)
  const updateContentLayout = (slideId, layoutUpdates) => {
    setSlides(slides.map(s => {
      if (s.id === slideId) {
        return {
          ...s,
          contentLayout: { ...(s.contentLayout || { x: 0, y: 0, width: 100, height: 100 }), ...layoutUpdates },
        };
      }
      return s;
    }));
  };

  const handleDragStart = (e, slideId) => {
    setDraggedSlide(slideId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, targetId) => {
    e.preventDefault();
    if (draggedSlide === targetId) return;
    
    const draggedIndex = slides.findIndex(s => s.id === draggedSlide);
    const targetIndex = slides.findIndex(s => s.id === targetId);
    
    const newSlides = [...slides];
    const [removed] = newSlides.splice(draggedIndex, 1);
    newSlides.splice(targetIndex, 0, removed);
    
    // Update order values
    newSlides.forEach((s, i) => s.order = i);
    setSlides(newSlides);
  };

  const handleDragEnd = () => {
    setDraggedSlide(null);
  };

  if (!isOpen) return null;

  // Presentation Viewer (fullscreen)
  if (isPresenting) {
    const slide = enabledSlides[currentSlide];
    const layout = slide?.contentLayout || { x: 0, y: 0, width: 100, height: 100 };
    const currentSlideBg = slide?.background || slideBg;
    
    // Calculate scale factor for proportional scaling
    const scaleX = layout.width / 100;
    const scaleY = layout.height / 100;
    const scale = Math.min(scaleX, scaleY);
    
    return (
      <div className="pres-viewer" onClick={(e) => e.stopPropagation()} style={{ background: presViewerBg }}>
        <div className={`pres-slide pres-anim-${animation}`} key={currentSlide} style={{ background: currentSlideBg, borderRadius: '12px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)' }}>
          <div 
            className="pres-content-positioned"
            style={{
              position: 'absolute',
              left: `${layout.x}%`,
              top: `${layout.y}%`,
              width: `${layout.width}%`,
              height: `${layout.height}%`,
              overflow: 'hidden',
            }}
          >
            <div style={{
              transform: `scale(${scale})`,
              transformOrigin: 'top left',
              width: `${100 / scale}%`,
              height: `${100 / scale}%`,
            }}>
              <SlideContent slide={slide} />
            </div>
          </div>
        </div>
        
        <div className="pres-controls" onClick={(e) => e.stopPropagation()}>
          <button 
            onClick={(e) => { e.stopPropagation(); prevSlide(); }} 
            disabled={currentSlide === 0} 
            className="pres-nav-btn"
          >
            ◀
          </button>
          <span className="pres-progress">
            {currentSlide + 1} / {enabledSlides.length}
          </span>
          <button 
            onClick={(e) => { e.stopPropagation(); nextSlide(); }} 
            disabled={currentSlide === enabledSlides.length - 1} 
            className="pres-nav-btn"
          >
            ▶
          </button>
        </div>
        
        <button 
          className="pres-exit-btn" 
          onClick={(e) => { e.stopPropagation(); setIsPresenting(false); }}
        >
          ✕ Exit
        </button>
        
        <div className="pres-progress-bar">
          <div 
            className="pres-progress-fill" 
            style={{ width: `${((currentSlide + 1) / enabledSlides.length) * 100}%` }}
          />
        </div>
      </div>
    );
  }

  const currentEditingSlide = slides.find(s => s.id === editingSlide);

  // Presentation Editor
  return (
    <div className="pres-editor-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="pres-editor" onClick={(e) => e.stopPropagation()}>
        <div className="pres-editor-header">
          <div>
            <h2>Presentation Editor</h2>
            <p>Customize your slides, then click Present to start</p>
          </div>
          <div className="pres-editor-actions">
            <select 
              value={animation} 
              onChange={(e) => setAnimation(e.target.value)}
              onClick={(e) => e.stopPropagation()}
              className="pres-anim-select"
            >
              <option value="fade">Fade</option>
              <option value="slide">Slide</option>
              <option value="zoom">Zoom</option>
              <option value="flip">Flip</option>
            </select>
            <button 
              className="pres-start-btn" 
              onClick={(e) => { e.stopPropagation(); setCurrentSlide(0); setIsPresenting(true); }}
            >
              ▶ Present
            </button>
            <button 
              className="pres-close-btn" 
              onClick={(e) => { e.stopPropagation(); onClose(); }}
            >
              ✕
            </button>
          </div>
        </div>
        
        <div className="pres-editor-body">
          <div className="pres-slides-list" onClick={(e) => e.stopPropagation()}>
            <div className="pres-slides-header">
              <h3>Slides ({enabledSlides.length} active)</h3>
              <button 
                onClick={(e) => { e.stopPropagation(); addCustomSlide(); }} 
                className="pres-add-slide-btn"
              >
                + Slide
              </button>
            </div>
            
            <div className="pres-slides-scroll">
              {slides.sort((a, b) => a.order - b.order).map((slide, index) => {
                // Get display title - for custom slides, use first text element
                const displayTitle = slide.title || 
                  (slide.isCustom && slide.overlayElements?.find(el => el.type === 'text')?.content) || 
                  'Untitled Slide';
                return (
                <div
                  key={slide.id}
                  className={`pres-slide-item ${!slide.enabled ? 'disabled' : ''} ${draggedSlide === slide.id ? 'dragging' : ''} ${editingSlide === slide.id ? 'selected' : ''}`}
                  draggable
                  onDragStart={(e) => handleDragStart(e, slide.id)}
                  onDragOver={(e) => handleDragOver(e, slide.id)}
                  onDragEnd={handleDragEnd}
                  onClick={(e) => { e.stopPropagation(); setEditingSlide(slide.id); setSelectedElement(null); }}
                >
                  <div className="pres-slide-drag">⋮⋮</div>
                  <div className="pres-slide-thumb">
                    <SlideThumb slide={slide} />
                  </div>
                  <div className="pres-slide-info">
                    <span className="pres-slide-title">{displayTitle.substring(0, 30)}{displayTitle.length > 30 ? '...' : ''}</span>
                    <span className="pres-slide-type">{slide.type}</span>
                  </div>
                  <div className="pres-slide-actions">
                    <button 
                      className={`pres-toggle-btn ${slide.enabled ? 'active' : ''}`}
                      onClick={(e) => { e.stopPropagation(); toggleSlide(slide.id); }}
                    >
                      {slide.enabled ? '●' : '○'}
                    </button>
                    {slide.isCustom && (
                      <button 
                        className="pres-delete-slide-btn"
                        onClick={(e) => { e.stopPropagation(); deleteSlide(slide.id); }}
                        title="Delete slide"
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );})}
            </div>
          </div>
          
          <div className="pres-preview" onClick={(e) => e.stopPropagation()}>
            <div className="pres-preview-header">
              <h3>Preview {currentEditingSlide ? `- ${currentEditingSlide.title || 'Custom Slide'}` : ''}</h3>
              {editingSlide && (
                <div className="pres-element-btns">
                  <span className="pres-editor-tip">💡 Click slide content to move/resize it, or add overlay elements</span>
                  <button 
                    onClick={(e) => { e.stopPropagation(); addTextElement(); }} 
                    className="pres-add-elem-btn"
                  >
                    + Text
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); addImageElement(); }} 
                    className="pres-add-elem-btn"
                  >
                    + Image
                  </button>
                  <div className="pres-bg-picker-wrapper">
                    <button 
                      onClick={(e) => { e.stopPropagation(); setShowBgPicker(!showBgPicker); }} 
                      className="pres-add-elem-btn"
                      title="Change slide background"
                    >
                      🎨 Background
                    </button>
                    {showBgPicker && (
                      <div className="pres-bg-picker-dropdown" onClick={(e) => e.stopPropagation()}>
                        <div className="pres-bg-picker-title">Slide Background</div>
                        <div className="pres-bg-presets-grid">
                          {bgPresets.map((preset, idx) => (
                            <button
                              key={idx}
                              className={`pres-bg-preset-btn ${(currentEditingSlide?.background || slideBg) === preset.value ? 'active' : ''}`}
                              style={{ background: preset.value }}
                              onClick={() => {
                                updateSlideBackground(editingSlide, preset.value);
                                setShowBgPicker(false);
                              }}
                              title={preset.name}
                            >
                              {preset.name === 'Default' && <span>✓</span>}
                            </button>
                          ))}
                        </div>
                        <div className="pres-bg-custom">
                          <label>Custom Color:</label>
                          <input 
                            type="color" 
                            defaultValue="#0f3d3e"
                            onChange={(e) => {
                              const color = e.target.value;
                              updateSlideBackground(editingSlide, `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`);
                            }}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                  <button 
                    onClick={(e) => { e.stopPropagation(); updateContentLayout(editingSlide, { x: 0, y: 0, width: 100, height: 100 }); }} 
                    className="pres-add-elem-btn"
                    title="Reset content to full size"
                  >
                    ↺ Reset
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    accept="image/*" 
                    style={{ display: 'none' }} 
                  />
                </div>
              )}
            </div>
            <div className="pres-preview-content" onClick={(e) => e.stopPropagation()}>
              {editingSlide ? (
                <SlideEditorWithOverlays 
                  slide={currentEditingSlide}
                  slideBg={currentEditingSlide?.background || slideBg}
                  selectedElement={selectedElement}
                  onSelectElement={setSelectedElement}
                  onUpdateElement={(elemId, updates) => updateElement(editingSlide, elemId, updates)}
                  onDeleteElement={(elemId) => deleteElement(editingSlide, elemId)}
                  onUpdateContentLayout={(updates) => updateContentLayout(editingSlide, updates)}
                />
              ) : (
                <div className="pres-no-selection">
                  Select a slide to preview and edit
                </div>
              )}
            </div>
            
            {/* Element Properties Panel */}
            {selectedElement && currentEditingSlide && (
              <div 
                className="pres-props-container"
                onClick={(e) => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
                onMouseDown={(e) => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
                onPointerDown={(e) => { e.stopPropagation(); e.nativeEvent?.stopImmediatePropagation?.(); }}
              >
                <ElementPropertiesPanel
                  element={(currentEditingSlide.overlayElements || []).find(el => el.id === selectedElement)}
                  onUpdate={(updates) => updateElement(editingSlide, selectedElement, updates)}
                  onDelete={() => deleteElement(editingSlide, selectedElement)}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function SlideThumb({ slide }) {
  const typeIcons = {
    title: '🎯',
    kpis: '📊',
    enrollment: '👥',
    outcomes: '❤️',
    stories: '💬',
    opportunities: '💡',
    closing: '🙏',
    text: '📝',
    image: '🖼️',
    custom: '✨',
  };
  return <span className="slide-thumb-icon">{typeIcons[slide.type] || '📄'}</span>;
}

function SlideContent({ slide, showOverlays = true }) {
  const { customization, getFormSchema, FIELD_TYPES } = useCustomization();
  const brandColor = customization.branding.primaryColor || '#14b8a6';
  const accentColor = customization.branding.accentColor || '#5eead4';
  const formSchema = getFormSchema();
  
  // Get schema sections
  const coreMetricsSection = formSchema.sections.find(s => s.id === 'coreMetrics');
  const enrollmentFunnelSection = formSchema.sections.find(s => s.id === 'enrollmentFunnel');
  const outcomesSection = formSchema.sections.find(s => s.id === 'patientOutcomes');
  const smsCampaignSection = formSchema.sections.find(s => s.id === 'smsCampaign');
  const emailCampaignSection = formSchema.sections.find(s => s.id === 'emailCampaign');
  const mailerCampaignSection = formSchema.sections.find(s => s.id === 'mailerCampaign');
  
  // Get sorted fields
  const coreFields = coreMetricsSection?.fields 
    ? [...coreMetricsSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const funnelFields = enrollmentFunnelSection?.fields 
    ? [...enrollmentFunnelSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const outcomesFields = outcomesSection?.fields 
    ? [...outcomesSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  
  // Helper to format value
  const formatValue = (field, value) => {
    if (field?.fieldType === FIELD_TYPES?.CURRENCY || field?.prefix === '$') {
      return `$${Number(value || 0).toLocaleString()}`;
    }
    if (field?.fieldType === FIELD_TYPES?.PERCENT || field?.suffix === '%') {
      return `${value || 0}%`;
    }
    return value || 0;
  };
  
  // Color classes for KPI cards
  const colorClasses = ['brand', 'emerald', 'amber', 'rose', 'blue', 'teal'];
  
  const renderOverlays = () => {
    if (!showOverlays || !slide.overlayElements?.length) return null;
    return (
      <div className="pres-overlays">
        {slide.overlayElements.map(elem => (
          <div
            key={elem.id}
            className="pres-overlay-elem"
            style={{
              left: `${elem.x}px`,
              top: `${elem.y}px`,
              width: elem.type === 'text' ? `${elem.width}px` : 'auto',
            }}
          >
            {elem.type === 'text' ? (
              <span style={{ 
                fontSize: `${elem.fontSize}px`, 
                color: elem.color,
                fontWeight: elem.fontWeight,
              }}>
                {elem.content}
              </span>
            ) : (
              <img 
                src={elem.src} 
                alt="" 
                style={{ width: `${elem.width}px`, height: `${elem.height}px`, objectFit: 'cover', borderRadius: '8px' }}
              />
            )}
          </div>
        ))}
      </div>
    );
  };

  const wrapWithOverlays = (content) => (
    <div className="pres-slide-wrapper">
      {content}
      {renderOverlays()}
    </div>
  );

  switch (slide.type) {
    case 'title':
      return wrapWithOverlays(
        <div className="pres-slide-title-layout">
          <div className="pres-title-content">
            <h1 className="pres-main-title" style={{ 
              background: `linear-gradient(135deg, #ffffff 0%, ${brandColor} 100%)`,
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text'
            }}>{slide.title}</h1>
            <h2 className="pres-main-subtitle">{slide.subtitle}</h2>
            <p className="pres-main-meta">{slide.meta}</p>
          </div>
          <div className="pres-title-decoration" style={{
            background: `radial-gradient(circle, ${brandColor}4D 0%, transparent 70%)`
          }}></div>
        </div>
      );
      
    case 'kpis':
      return wrapWithOverlays(
        <div className="pres-slide-kpis-layout">
          <h2 className="pres-section-title">{slide.title}</h2>
          <div className="pres-kpi-grid">
            {coreFields.length > 0 ? (
              coreFields.slice(0, 4).map((field, index) => {
                const value = slide.data[field.id];
                const deltaMap = {
                  'enrolledThisMonth': slide.data.deltaEnrollment,
                  'activePatients': slide.data.deltaActive,
                  'servicesDelivered': slide.data.deltaServices,
                  'revenue': slide.data.deltaRevenue,
                };
                const delta = deltaMap[field.id];
                const colorClass = colorClasses[index % colorClasses.length];
                
                return (
                  <div key={field.id} className={`pres-kpi-card ${index === 0 ? '' : colorClass}`} 
                    style={index === 0 ? { background: `${brandColor}33`, borderColor: brandColor } : {}}>
                    <div className="pres-kpi-value" style={index === 0 ? { color: accentColor } : {}}>
                      {formatValue(field, value)}
                    </div>
                    <div className="pres-kpi-label">{field.label}</div>
                    {delta && <div className={`pres-kpi-delta ${delta?.startsWith?.('+') ? 'positive' : 'negative'}`}>{delta}</div>}
                  </div>
                );
              })
            ) : (
              <>
                <div className="pres-kpi-card" style={{ background: `${brandColor}33`, borderColor: brandColor }}>
                  <div className="pres-kpi-value" style={{ color: accentColor }}>{slide.data.enrolledThisMonth}</div>
                  <div className="pres-kpi-label">Enrolled This Month</div>
                  <div className="pres-kpi-delta positive">{slide.data.deltaEnrollment}</div>
                </div>
                <div className="pres-kpi-card emerald">
                  <div className="pres-kpi-value">{slide.data.activePatients}</div>
                  <div className="pres-kpi-label">Active Patients</div>
                  <div className="pres-kpi-delta positive">{slide.data.deltaActive}</div>
                </div>
                <div className="pres-kpi-card amber">
                  <div className="pres-kpi-value">{slide.data.servicesDelivered}</div>
                  <div className="pres-kpi-label">Services Delivered</div>
                  <div className="pres-kpi-delta positive">{slide.data.deltaServices}</div>
                </div>
                <div className="pres-kpi-card rose">
                  <div className="pres-kpi-value">{slide.data.revenueThisMonth}</div>
                  <div className="pres-kpi-label">Revenue This Month</div>
                  <div className="pres-kpi-delta positive">{slide.data.deltaRevenue}</div>
                </div>
              </>
            )}
          </div>
        </div>
      );
      
    case 'enrollment':
      // Build funnel steps from schema
      const funnelSteps = funnelFields.length > 0 
        ? funnelFields.map(field => ({
            label: field.label,
            value: slide.funnel[field.id] || 0,
          }))
        : [
            { label: 'Contacted', value: slide.funnel.contacted },
            { label: 'Enrolled', value: slide.funnel.enrolled },
          ];
      
      const firstVal = funnelSteps[0]?.value || 1;
      const lastVal = funnelSteps[funnelSteps.length - 1]?.value || 0;
      const convRate = firstVal > 0 ? Math.round((lastVal / firstVal) * 100) : 0;
      
      return wrapWithOverlays(
        <div className="pres-slide-enrollment-layout">
          <h2 className="pres-section-title">{slide.title}</h2>
          <div className="pres-enrollment-grid">
            <div className="pres-funnel-section">
              <h3>{enrollmentFunnelSection?.title || 'Enrollment Funnel'}</h3>
              <div className="pres-funnel">
                {funnelSteps.map((step, idx) => (
                  <React.Fragment key={idx}>
                    <div className="pres-funnel-step">
                      <span className="pres-funnel-value">{step.value}</span>
                      <span className="pres-funnel-label">{step.label}</span>
                    </div>
                    {idx < funnelSteps.length - 1 && <div className="pres-funnel-arrow">→</div>}
                  </React.Fragment>
                ))}
                <div className="pres-funnel-rate">{convRate}% conversion</div>
              </div>
            </div>
            <div className="pres-campaign-section">
              <h3>Campaign Performance</h3>
              <div className="pres-campaign-cards">
                <div className="pres-campaign-card">
                  <span className="pres-camp-icon">📱</span>
                  <span className="pres-camp-name">{smsCampaignSection?.title || 'SMS'}</span>
                  <span className="pres-camp-stat">{slide.campaign.smsConsented || slide.funnel.smsConsented || 0} consented</span>
                </div>
                <div className="pres-campaign-card">
                  <span className="pres-camp-icon">📧</span>
                  <span className="pres-camp-name">{emailCampaignSection?.title || 'Email'}</span>
                  <span className="pres-camp-stat">{slide.campaign.emailConsented || slide.funnel.emailConsented || 0} consented</span>
                </div>
                <div className="pres-campaign-card">
                  <span className="pres-camp-icon">✉️</span>
                  <span className="pres-camp-name">{mailerCampaignSection?.title || 'Mailer'}</span>
                  <span className="pres-camp-stat">{slide.campaign.mailersConsented || slide.funnel.mailersConsented || 0} consented</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'outcomes':
      return wrapWithOverlays(
        <div className="pres-slide-outcomes-layout">
          <h2 className="pres-section-title">{slide.title}</h2>
          <div className="pres-outcomes-grid">
            {outcomesFields.length > 0 ? (
              outcomesFields.slice(0, 4).map((field, index) => {
                const value = slide.data[field.id];
                const icons = ['❤️', '💊', '🏥', '⏱️'];
                
                return (
                  <div key={field.id} className="pres-outcome-card" style={{ 
                    background: `linear-gradient(135deg, ${brandColor}33 0%, ${brandColor}1a 100%)`,
                    border: `1px solid ${brandColor}4d`
                  }}>
                    <div className="pres-outcome-value" style={{ color: accentColor }}>
                      {formatValue(field, value)}
                    </div>
                    <div className="pres-outcome-label">{field.label}</div>
                    <div className="pres-outcome-icon">{icons[index % icons.length]}</div>
                  </div>
                );
              })
            ) : (
              <>
                <div className="pres-outcome-card" style={{ 
                  background: `linear-gradient(135deg, ${brandColor}33 0%, ${brandColor}1a 100%)`,
                  border: `1px solid ${brandColor}4d`
                }}>
                  <div className="pres-outcome-value" style={{ color: accentColor }}>{slide.data.bpImproved}%</div>
                  <div className="pres-outcome-label">BP Improved</div>
                  <div className="pres-outcome-icon">❤️</div>
                </div>
                <div className="pres-outcome-card" style={{ 
                  background: `linear-gradient(135deg, ${brandColor}33 0%, ${brandColor}1a 100%)`,
                  border: `1px solid ${brandColor}4d`
                }}>
                  <div className="pres-outcome-value" style={{ color: accentColor }}>{slide.data.adherenceRate}%</div>
                  <div className="pres-outcome-label">Medication Adherence</div>
                  <div className="pres-outcome-icon">💊</div>
                </div>
                <div className="pres-outcome-card" style={{ 
                  background: `linear-gradient(135deg, ${brandColor}33 0%, ${brandColor}1a 100%)`,
                  border: `1px solid ${brandColor}4d`
                }}>
                  <div className="pres-outcome-value" style={{ color: accentColor }}>{slide.data.readmissionReduction}%</div>
                  <div className="pres-outcome-label">Readmission Reduction</div>
                  <div className="pres-outcome-icon">🏥</div>
                </div>
                <div className="pres-outcome-card" style={{ 
                  background: `linear-gradient(135deg, ${brandColor}33 0%, ${brandColor}1a 100%)`,
                  border: `1px solid ${brandColor}4d`
                }}>
                  <div className="pres-outcome-value" style={{ color: accentColor }}>{slide.data.avgResponseHours}h</div>
                  <div className="pres-outcome-label">Avg Response Time</div>
                  <div className="pres-outcome-icon">⏱️</div>
                </div>
              </>
            )}
          </div>
        </div>
      );
      
    case 'stories':
      return wrapWithOverlays(
        <div className="pres-slide-stories-layout">
          <h2 className="pres-section-title">{slide.title}</h2>
          <div className="pres-stories-grid">
            {(slide.stories || []).map((story, i) => (
              <div key={i} className="pres-story-card" style={{ borderLeftColor: brandColor }}>
                <div className="pres-story-quote">"{story.quote}"</div>
                <div className="pres-story-meta">
                  <span className="pres-story-title" style={{ color: accentColor }}>{story.title}</span>
                  {story.patientType && <span className="pres-story-patient">{story.patientType}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      
    case 'opportunities':
      return wrapWithOverlays(
        <div className="pres-slide-opps-layout">
          <h2 className="pres-section-title">{slide.title}</h2>
          <div className="pres-opps-list">
            {(slide.opportunities || []).map((opp, i) => (
              <div key={i} className="pres-opp-item">
                <div className="pres-opp-number">{i + 1}</div>
                <div className="pres-opp-content">
                  <h4>{opp.title}</h4>
                  <p>{opp.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      );
      
    case 'closing':
      return wrapWithOverlays(
        <div className="pres-slide-closing-layout">
          <h1 className="pres-closing-title">{slide.title}</h1>
          <h2 className="pres-closing-subtitle">{slide.subtitle}</h2>
          {slide.csm && (
            <div className="pres-csm-card">
              <div className="pres-csm-avatar" style={{ background: `linear-gradient(135deg, ${brandColor}, ${customization.branding.secondaryColor || brandColor})` }}>{slide.csm.name.split(' ').map(n => n[0]).join('')}</div>
              <div className="pres-csm-info">
                <div className="pres-csm-name">{slide.csm.name}</div>
                <div className="pres-csm-role">Customer Success Manager</div>
                <div className="pres-csm-contact" style={{ color: accentColor }}>{slide.csm.email}</div>
              </div>
            </div>
          )}
        </div>
      );
      
    case 'custom':
      return wrapWithOverlays(
        <div className="pres-slide-custom-layout">
          {/* Custom slides only use overlay elements - no hardcoded content */}
        </div>
      );
      
    default:
      return wrapWithOverlays(<div className="pres-slide-default">Slide: {slide.title}</div>);
  }
}

// Slide editor with draggable and resizable overlay elements AND content layout
function SlideEditorWithOverlays({ slide, slideBg, selectedElement, onSelectElement, onUpdateElement, onDeleteElement, onUpdateContentLayout }) {
  const containerRef = React.useRef(null);
  const [dragging, setDragging] = useState(null);
  const [resizing, setResizing] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [editingText, setEditingText] = useState(null);
  
  // Content layout editing states
  const [draggingContent, setDraggingContent] = useState(false);
  const [resizingContent, setResizingContent] = useState(null);
  const [contentDragOffset, setContentDragOffset] = useState({ x: 0, y: 0 });
  const [contentResizeStart, setContentResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  const [contentSelected, setContentSelected] = useState(false);

  const scaleFactor = 0.55;
  const containerWidth = 960; // Full slide width at 100%
  const containerHeight = 540;

  // Content layout handlers
  const handleContentMouseDown = (e) => {
    e.stopPropagation();
    onSelectElement(null); // Deselect any overlay element
    setContentSelected(true);
    setDraggingContent(true);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const layout = slide.contentLayout || { x: 0, y: 0, width: 100, height: 100 };
      const mouseX = (e.clientX - rect.left) / scaleFactor;
      const mouseY = (e.clientY - rect.top) / scaleFactor;
      const contentX = (layout.x / 100) * containerWidth;
      const contentY = (layout.y / 100) * containerHeight;
      setContentDragOffset({
        x: mouseX - contentX,
        y: mouseY - contentY,
      });
    }
  };

  const handleContentResizeStart = (e, handle) => {
    e.stopPropagation();
    e.preventDefault();
    onSelectElement(null);
    setContentSelected(true);
    setResizingContent(handle);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const layout = slide.contentLayout || { x: 0, y: 0, width: 100, height: 100 };
      const mouseX = (e.clientX - rect.left) / scaleFactor;
      const mouseY = (e.clientY - rect.top) / scaleFactor;
      setContentResizeStart({
        mouseX,
        mouseY,
        x: layout.x,
        y: layout.y,
        width: layout.width,
        height: layout.height,
      });
    }
  };

  const handleMouseDown = (e, elemId) => {
    e.stopPropagation();
    
    // Don't start dragging if we're editing text
    if (editingText === elemId) {
      return;
    }
    
    setContentSelected(false);
    const elem = (slide.overlayElements || []).find(el => el.id === elemId);
    if (!elem) return;
    
    onSelectElement(elemId);
    setDragging(elemId);
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = (e.clientX - rect.left) / scaleFactor;
      const mouseY = (e.clientY - rect.top) / scaleFactor;
      setDragOffset({
        x: mouseX - elem.x,
        y: mouseY - elem.y,
      });
    }
  };

  const handleResizeStart = (e, elemId, handle) => {
    e.stopPropagation();
    e.preventDefault();
    const elem = (slide.overlayElements || []).find(el => el.id === elemId);
    if (!elem) return;
    
    onSelectElement(elemId);
    setResizing({ elemId, handle });
    
    const rect = containerRef.current?.getBoundingClientRect();
    if (rect) {
      const mouseX = (e.clientX - rect.left) / scaleFactor;
      const mouseY = (e.clientY - rect.top) / scaleFactor;
      setResizeStart({
        mouseX,
        mouseY,
        x: elem.x,
        y: elem.y,
        width: elem.width || 200,
        height: elem.height || (elem.type === 'text' ? elem.fontSize * 2 : 150),
      });
    }
  };

  const handleMouseMove = (e) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = (e.clientX - rect.left) / scaleFactor;
    const mouseY = (e.clientY - rect.top) / scaleFactor;
    
    if (dragging) {
      const x = Math.max(0, mouseX - dragOffset.x);
      const y = Math.max(0, mouseY - dragOffset.y);
      onUpdateElement(dragging, { x, y });
    } else if (resizing) {
      const { elemId, handle } = resizing;
      const elem = (slide.overlayElements || []).find(el => el.id === elemId);
      if (!elem) return;
      
      const deltaX = mouseX - resizeStart.mouseX;
      const deltaY = mouseY - resizeStart.mouseY;
      
      let updates = {};
      
      if (handle === 'se') {
        updates.width = Math.max(50, resizeStart.width + deltaX);
        updates.height = Math.max(30, resizeStart.height + deltaY);
      } else if (handle === 'sw') {
        const newWidth = Math.max(50, resizeStart.width - deltaX);
        updates.x = resizeStart.x + (resizeStart.width - newWidth);
        updates.width = newWidth;
        updates.height = Math.max(30, resizeStart.height + deltaY);
      } else if (handle === 'ne') {
        updates.width = Math.max(50, resizeStart.width + deltaX);
        const newHeight = Math.max(30, resizeStart.height - deltaY);
        updates.y = resizeStart.y + (resizeStart.height - newHeight);
        updates.height = newHeight;
      } else if (handle === 'nw') {
        const newWidth = Math.max(50, resizeStart.width - deltaX);
        updates.x = resizeStart.x + (resizeStart.width - newWidth);
        updates.width = newWidth;
        const newHeight = Math.max(30, resizeStart.height - deltaY);
        updates.y = resizeStart.y + (resizeStart.height - newHeight);
        updates.height = newHeight;
      } else if (handle === 'e') {
        updates.width = Math.max(50, resizeStart.width + deltaX);
      } else if (handle === 'w') {
        const newWidth = Math.max(50, resizeStart.width - deltaX);
        updates.x = resizeStart.x + (resizeStart.width - newWidth);
        updates.width = newWidth;
      } else if (handle === 's') {
        updates.height = Math.max(30, resizeStart.height + deltaY);
      } else if (handle === 'n') {
        const newHeight = Math.max(30, resizeStart.height - deltaY);
        updates.y = resizeStart.y + (resizeStart.height - newHeight);
        updates.height = newHeight;
      }
      
      onUpdateElement(elemId, updates);
    }
    
    // Handle content layout dragging
    if (draggingContent && onUpdateContentLayout) {
      const x = Math.max(0, Math.min(50, ((mouseX - contentDragOffset.x) / containerWidth) * 100));
      const y = Math.max(0, Math.min(50, ((mouseY - contentDragOffset.y) / containerHeight) * 100));
      onUpdateContentLayout({ x, y });
    }
    
    // Handle content layout resizing
    if (resizingContent && onUpdateContentLayout) {
      const deltaXPercent = ((mouseX - contentResizeStart.mouseX) / containerWidth) * 100;
      const deltaYPercent = ((mouseY - contentResizeStart.mouseY) / containerHeight) * 100;
      
      let updates = {};
      
      if (resizingContent === 'se') {
        updates.width = Math.max(30, Math.min(100, contentResizeStart.width + deltaXPercent));
        updates.height = Math.max(30, Math.min(100, contentResizeStart.height + deltaYPercent));
      } else if (resizingContent === 'sw') {
        const newWidth = Math.max(30, Math.min(100, contentResizeStart.width - deltaXPercent));
        updates.x = Math.max(0, contentResizeStart.x + (contentResizeStart.width - newWidth));
        updates.width = newWidth;
        updates.height = Math.max(30, Math.min(100, contentResizeStart.height + deltaYPercent));
      } else if (resizingContent === 'ne') {
        updates.width = Math.max(30, Math.min(100, contentResizeStart.width + deltaXPercent));
        const newHeight = Math.max(30, Math.min(100, contentResizeStart.height - deltaYPercent));
        updates.y = Math.max(0, contentResizeStart.y + (contentResizeStart.height - newHeight));
        updates.height = newHeight;
      } else if (resizingContent === 'nw') {
        const newWidth = Math.max(30, Math.min(100, contentResizeStart.width - deltaXPercent));
        updates.x = Math.max(0, contentResizeStart.x + (contentResizeStart.width - newWidth));
        updates.width = newWidth;
        const newHeight = Math.max(30, Math.min(100, contentResizeStart.height - deltaYPercent));
        updates.y = Math.max(0, contentResizeStart.y + (contentResizeStart.height - newHeight));
        updates.height = newHeight;
      } else if (resizingContent === 'e') {
        updates.width = Math.max(30, Math.min(100, contentResizeStart.width + deltaXPercent));
      } else if (resizingContent === 'w') {
        const newWidth = Math.max(30, Math.min(100, contentResizeStart.width - deltaXPercent));
        updates.x = Math.max(0, contentResizeStart.x + (contentResizeStart.width - newWidth));
        updates.width = newWidth;
      } else if (resizingContent === 's') {
        updates.height = Math.max(30, Math.min(100, contentResizeStart.height + deltaYPercent));
      } else if (resizingContent === 'n') {
        const newHeight = Math.max(30, Math.min(100, contentResizeStart.height - deltaYPercent));
        updates.y = Math.max(0, contentResizeStart.y + (contentResizeStart.height - newHeight));
        updates.height = newHeight;
      }
      
      onUpdateContentLayout(updates);
    }
  };

  const handleMouseUp = () => {
    setDragging(null);
    setResizing(null);
    setDraggingContent(false);
    setResizingContent(null);
  };

  const handleDoubleClick = (e, elemId) => {
    e.stopPropagation();
    const elem = (slide.overlayElements || []).find(el => el.id === elemId);
    if (elem?.type === 'text') {
      setEditingText(elemId);
    }
  };

  const handleTextBlur = (elemId, newContent) => {
    onUpdateElement(elemId, { content: newContent });
    setEditingText(null);
  };

  const handleContainerClick = () => {
    onSelectElement(null);
    setEditingText(null);
    setContentSelected(false);
  };

  if (!slide) return null;

  // Calculate content layout position/size
  const layout = slide.contentLayout || { x: 0, y: 0, width: 100, height: 100 };
  
  // Base scale for preview (content is designed for ~1200px, preview is ~500px)
  const basePreviewScale = 0.55;
  
  // Calculate additional scale factor from layout - content should scale proportionally
  const scaleX = layout.width / 100;
  const scaleY = layout.height / 100;
  const layoutScale = Math.min(scaleX, scaleY); // Use the smaller scale to maintain aspect ratio
  
  // Combined scale: base preview scale * layout scale
  const combinedScale = basePreviewScale * layoutScale;
  
  const contentStyle = {
    position: 'absolute',
    left: `${layout.x}%`,
    top: `${layout.y}%`,
    width: `${layout.width}%`,
    height: `${layout.height}%`,
    cursor: contentSelected ? 'move' : 'pointer',
    transition: draggingContent || resizingContent ? 'none' : 'all 0.1s',
  };
  
  // Inner content scale style - applies combined scaling
  const innerScaleStyle = {
    transform: `scale(${combinedScale})`,
    transformOrigin: 'top left',
    width: `${100 / combinedScale}%`,
    height: `${100 / combinedScale}%`,
  };

  return (
    <div 
      ref={containerRef}
      className="pres-preview-slide pres-editor-canvas"
      style={{ background: slideBg }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onClick={handleContainerClick}
    >
      {/* Main content - now draggable/resizable */}
      <div 
        className={`pres-content-wrapper ${contentSelected ? 'selected' : ''} ${draggingContent ? 'dragging' : ''}`}
        style={contentStyle}
        onMouseDown={handleContentMouseDown}
        onClick={(e) => { e.stopPropagation(); setContentSelected(true); onSelectElement(null); }}
      >
        <div style={innerScaleStyle}>
          <SlideContent slide={slide} showOverlays={false} />
        </div>
      </div>
      
      {/* Content resize handles */}
      {contentSelected && (
        <div 
          className="pres-content-handles"
          style={{
            position: 'absolute',
            left: `calc(${layout.x}% - 6px)`,
            top: `calc(${layout.y}% - 6px)`,
            width: `calc(${layout.width}% + 12px)`,
            height: `calc(${layout.height}% + 12px)`,
            pointerEvents: 'none',
            border: '2px dashed var(--teal-400)',
            borderRadius: '4px',
          }}
        >
          <div className="pres-elem-handle nw" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleContentResizeStart(e, 'nw')}></div>
          <div className="pres-elem-handle n" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleContentResizeStart(e, 'n')}></div>
          <div className="pres-elem-handle ne" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleContentResizeStart(e, 'ne')}></div>
          <div className="pres-elem-handle w" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleContentResizeStart(e, 'w')}></div>
          <div className="pres-elem-handle e" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleContentResizeStart(e, 'e')}></div>
          <div className="pres-elem-handle sw" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleContentResizeStart(e, 'sw')}></div>
          <div className="pres-elem-handle s" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleContentResizeStart(e, 's')}></div>
          <div className="pres-elem-handle se" style={{ pointerEvents: 'auto' }} onMouseDown={(e) => handleContentResizeStart(e, 'se')}></div>
        </div>
      )}
      
      {/* Editable overlay elements - scaled to match preview */}
      <div className="pres-editor-overlays">
        {(slide.overlayElements || []).map(elem => {
          const scaledX = elem.x * scaleFactor;
          const scaledY = elem.y * scaleFactor;
          const scaledWidth = (elem.width || 200) * scaleFactor;
          const scaledHeight = (elem.height || (elem.type === 'image' ? 150 : elem.fontSize * 3)) * scaleFactor;
          
          return (
          <React.Fragment key={elem.id}>
            {/* Element content (scaled) */}
            <div
              className={`pres-editor-elem ${selectedElement === elem.id ? 'selected' : ''} ${dragging === elem.id ? 'dragging' : ''} ${resizing?.elemId === elem.id ? 'resizing' : ''} ${editingText === elem.id ? 'editing' : ''}`}
              style={{
                left: `${scaledX}px`,
                top: `${scaledY}px`,
                transform: `scale(${scaleFactor})`,
                transformOrigin: 'top left',
              }}
              onMouseDown={(e) => {
                if (editingText !== elem.id) {
                  handleMouseDown(e, elem.id);
                }
              }}
              onDoubleClick={(e) => handleDoubleClick(e, elem.id)}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Position/Size tooltip during drag or resize */}
              {(dragging === elem.id || resizing?.elemId === elem.id) && (
                <div className="pres-editor-elem-tooltip">
                  {dragging === elem.id 
                    ? `X: ${Math.round(elem.x)} Y: ${Math.round(elem.y)}`
                    : `W: ${Math.round(elem.width || 200)} ${elem.type === 'image' ? `H: ${Math.round(elem.height || 150)}` : ''}`
                  }
                </div>
              )}
              {elem.type === 'text' ? (
                editingText === elem.id ? (
                  <textarea
                    autoFocus
                    defaultValue={elem.content}
                    onBlur={(e) => {
                      // Only blur if clicking outside the textarea
                      if (!e.currentTarget.contains(e.relatedTarget)) {
                        handleTextBlur(elem.id, e.target.value);
                      }
                    }}
                    onClick={(e) => { e.stopPropagation(); e.preventDefault(); }}
                    onMouseDown={(e) => { e.stopPropagation(); }}
                    onMouseUp={(e) => { e.stopPropagation(); }}
                    onDoubleClick={(e) => { e.stopPropagation(); }}
                    onFocus={(e) => { e.stopPropagation(); }}
                    onKeyDown={(e) => {
                      e.stopPropagation();
                      if (e.key === 'Escape') {
                        handleTextBlur(elem.id, e.target.value);
                      }
                    }}
                    onInput={(e) => { e.stopPropagation(); }}
                    onChange={(e) => { e.stopPropagation(); }}
                    style={{
                      fontSize: `${elem.fontSize}px`,
                      color: elem.color,
                      fontWeight: elem.fontWeight,
                      width: `${elem.width}px`,
                      height: `${elem.height || elem.fontSize * 3}px`,
                      minHeight: '40px',
                      background: 'rgba(0,0,0,0.3)',
                      border: '2px solid rgba(255,255,255,0.5)',
                      borderRadius: '4px',
                      padding: '8px',
                      resize: 'none',
                      outline: 'none',
                      fontFamily: 'inherit',
                      boxSizing: 'border-box',
                    }}
                  />
                ) : (
                  <span style={{ 
                    fontSize: `${elem.fontSize}px`, 
                    color: elem.color,
                    fontWeight: elem.fontWeight,
                    display: 'block',
                    cursor: 'move',
                    width: `${elem.width}px`,
                    minHeight: `${elem.height || elem.fontSize * 2}px`,
                  }}>
                    {elem.content}
                  </span>
                )
              ) : (
                <img 
                  src={elem.src} 
                  alt="" 
                  style={{ 
                    width: `${elem.width}px`, 
                    height: `${elem.height}px`, 
                    objectFit: 'cover', 
                    borderRadius: '8px',
                    cursor: 'move',
                  }}
                  draggable={false}
                />
              )}
            </div>
            
            {/* Resize handles (NOT scaled - positioned at element boundaries) */}
            {selectedElement === elem.id && (
              <div 
                className="pres-resize-handles"
                style={{
                  position: 'absolute',
                  left: `${scaledX - 8}px`,
                  top: `${scaledY - 8}px`,
                  width: `${scaledWidth + 16}px`,
                  height: `${scaledHeight + 16}px`,
                  pointerEvents: 'none',
                }}
              >
                <div className="pres-elem-handle nw" onMouseDown={(e) => handleResizeStart(e, elem.id, 'nw')}></div>
                <div className="pres-elem-handle n" onMouseDown={(e) => handleResizeStart(e, elem.id, 'n')}></div>
                <div className="pres-elem-handle ne" onMouseDown={(e) => handleResizeStart(e, elem.id, 'ne')}></div>
                <div className="pres-elem-handle w" onMouseDown={(e) => handleResizeStart(e, elem.id, 'w')}></div>
                <div className="pres-elem-handle e" onMouseDown={(e) => handleResizeStart(e, elem.id, 'e')}></div>
                <div className="pres-elem-handle sw" onMouseDown={(e) => handleResizeStart(e, elem.id, 'sw')}></div>
                <div className="pres-elem-handle s" onMouseDown={(e) => handleResizeStart(e, elem.id, 's')}></div>
                <div className="pres-elem-handle se" onMouseDown={(e) => handleResizeStart(e, elem.id, 'se')}></div>
              </div>
            )}
          </React.Fragment>
        );})}
      </div>
    </div>
  );
}

// Properties panel for selected element
function ElementPropertiesPanel({ element, onUpdate, onDelete }) {
  const [isExpanded, setIsExpanded] = useState(true);
  
  if (!element) return null;

  // Comprehensive event stopper to prevent any bubbling
  const stopAllEvents = (e) => {
    e.stopPropagation();
    e.nativeEvent?.stopImmediatePropagation?.();
  };

  return (
    <div 
      className={`pres-props-panel ${isExpanded ? 'expanded' : 'collapsed'}`}
      onClick={stopAllEvents}
      onMouseDown={stopAllEvents}
      onMouseUp={stopAllEvents}
      onPointerDown={stopAllEvents}
      onFocus={stopAllEvents}
      onKeyDown={stopAllEvents}
    >
      <div className="pres-props-header" onClick={stopAllEvents} onMouseDown={stopAllEvents}>
        <button 
          className="pres-props-toggle"
          onClick={(e) => { stopAllEvents(e); setIsExpanded(!isExpanded); }}
          onMouseDown={stopAllEvents}
          title={isExpanded ? 'Collapse panel' : 'Expand panel'}
        >
          {isExpanded ? '▼' : '▲'}
        </button>
        <h4>{element.type === 'text' ? 'Text Properties' : 'Image Properties'}</h4>
        <button 
          className="pres-props-delete" 
          onClick={(e) => { stopAllEvents(e); onDelete(); }}
          onMouseDown={stopAllEvents}
        >
          🗑 Delete
        </button>
      </div>
      
      {isExpanded && (
        <div className="pres-props-body" onClick={stopAllEvents} onMouseDown={stopAllEvents}>
          {element.type === 'text' && (
            <>
              <div className="pres-props-field">
                <label>Text</label>
                <textarea 
                  value={element.content} 
                  onChange={(e) => { stopAllEvents(e); onUpdate({ content: e.target.value }); }}
                  onClick={stopAllEvents}
                  onMouseDown={stopAllEvents}
                  onKeyDown={(e) => e.stopPropagation()}
                  onFocus={stopAllEvents}
                  rows={3}
                />
              </div>
              <div className="pres-props-row">
                <div className="pres-props-field">
                  <label>Font Size</label>
                  <input 
                    type="number" 
                    value={element.fontSize} 
                    onChange={(e) => { stopAllEvents(e); onUpdate({ fontSize: parseInt(e.target.value) || 16 }); }}
                    onClick={stopAllEvents}
                    onMouseDown={stopAllEvents}
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={stopAllEvents}
                    min={10}
                    max={72}
                  />
                </div>
                <div className="pres-props-field">
                  <label>Color</label>
                  <input 
                    type="color" 
                    value={element.color} 
                    onChange={(e) => { stopAllEvents(e); onUpdate({ color: e.target.value }); }}
                    onClick={stopAllEvents}
                    onMouseDown={stopAllEvents}
                    onFocus={stopAllEvents}
                  />
                </div>
              </div>
              <div className="pres-props-field">
                <label>Font Weight</label>
                <select 
                  value={element.fontWeight} 
                  onChange={(e) => { stopAllEvents(e); onUpdate({ fontWeight: e.target.value }); }}
                  onClick={stopAllEvents}
                  onMouseDown={stopAllEvents}
                  onFocus={stopAllEvents}
                >
                  <option value="normal">Normal</option>
                  <option value="bold">Bold</option>
                </select>
              </div>
              <div className="pres-props-row">
                <div className="pres-props-field">
                  <label>Width</label>
                  <input 
                    type="number" 
                    value={element.width} 
                    onChange={(e) => { stopAllEvents(e); onUpdate({ width: parseInt(e.target.value) || 200 }); }}
                    onClick={stopAllEvents}
                    onMouseDown={stopAllEvents}
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={stopAllEvents}
                    min={50}
                    max={800}
                  />
                </div>
                <div className="pres-props-field">
                  <label>Height</label>
                  <input 
                    type="number" 
                    value={element.height || 60} 
                    onChange={(e) => { stopAllEvents(e); onUpdate({ height: parseInt(e.target.value) || 60 }); }}
                    onClick={stopAllEvents}
                    onMouseDown={stopAllEvents}
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={stopAllEvents}
                    min={30}
                    max={600}
                  />
                </div>
              </div>
            </>
          )}
          
          {element.type === 'image' && (
            <>
              <div className="pres-props-row">
                <div className="pres-props-field">
                  <label>Width</label>
                  <input 
                    type="number" 
                    value={element.width} 
                    onChange={(e) => { stopAllEvents(e); onUpdate({ width: parseInt(e.target.value) || 200 }); }}
                    onClick={stopAllEvents}
                    onMouseDown={stopAllEvents}
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={stopAllEvents}
                    min={50}
                    max={800}
                  />
                </div>
                <div className="pres-props-field">
                  <label>Height</label>
                  <input 
                    type="number" 
                    value={element.height} 
                    onChange={(e) => { stopAllEvents(e); onUpdate({ height: parseInt(e.target.value) || 150 }); }}
                    onClick={stopAllEvents}
                    onMouseDown={stopAllEvents}
                    onKeyDown={(e) => e.stopPropagation()}
                    onFocus={stopAllEvents}
                    min={50}
                    max={600}
                  />
                </div>
              </div>
            </>
          )}
          
          <div className="pres-props-row">
            <div className="pres-props-field">
              <label>X Position</label>
              <input 
                type="number" 
                value={Math.round(element.x)} 
                onChange={(e) => { stopAllEvents(e); onUpdate({ x: parseInt(e.target.value) || 0 }); }}
                onClick={stopAllEvents}
                onMouseDown={stopAllEvents}
                onKeyDown={(e) => e.stopPropagation()}
                onFocus={stopAllEvents}
              />
            </div>
            <div className="pres-props-field">
              <label>Y Position</label>
              <input 
                type="number" 
                value={Math.round(element.y)} 
                onChange={(e) => { stopAllEvents(e); onUpdate({ y: parseInt(e.target.value) || 0 }); }}
                onClick={stopAllEvents}
                onMouseDown={stopAllEvents}
                onKeyDown={(e) => e.stopPropagation()}
                onFocus={stopAllEvents}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// PAGES
// ============================================================

function OverviewPage({ data, sectionVisibility = {}, customWidgets = [], brandColor: propBrandColor }) {
  const { customization, getFormSchema, FIELD_TYPES } = useCustomization();
  const { isEditMode, currentPage, updateWidgetPosition } = useDashboardEdit();
  const brandColor = propBrandColor || customization.branding.primaryColor;
  const formSchema = getFormSchema();
  const pageId = 'overview';
  const isCurrentPageEditMode = isEditMode && currentPage === pageId;

  const coreMetricsSection = formSchema.sections.find(s => s.id === 'coreMetrics');
  const coreMetricsEnabled = coreMetricsSection?.enabled !== false;

  const visibility = {
    coreMetrics: coreMetricsEnabled,
    ...sectionVisibility
  };

  const iconMap = {
    'Users': Users,
    'Activity': Activity,
    'Calendar': Calendar,
    'DollarSign': DollarSign,
    'Heart': Heart,
    'TrendingUp': TrendingUp,
    'Target': Target,
    'Star': Star,
    'CheckCircle': CheckCircle,
    'Clock': Clock,
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
    if (field.fieldType === FIELD_TYPES?.CURRENCY || field.prefix === '$') {
      return typeof value === 'string' && value.startsWith('$') ? value : `$${Number(value || 0).toLocaleString()}`;
    }
    if (field.fieldType === FIELD_TYPES?.PERCENT || field.suffix === '%') {
      return `${value || 0}%`;
    }
    return Number(value || 0).toLocaleString();
  };

  const getIconForField = (field, index) => {
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

  const handleWidgetReorder = (widgetId, newIndex) => {
    updateWidgetPosition(pageId, widgetId, { order: newIndex });
  };

  if (!visibility.coreMetrics) {
    return (
      <div className={`dashboard-page ${isCurrentPageEditMode ? 'edit-mode' : ''}`}>
        {isCurrentPageEditMode && <EditModeToolbar pageId={pageId} />}
        <div className="page-header">
          <h1 className="page-title">Monthly Impact Overview</h1>
          <p className="page-subtitle">Key metrics and performance indicators for November 2025</p>
        </div>
        <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <p>No sections configured for this view. Enable sections in Dashboard Management.</p>
        </div>
        <DashboardEditToggle pageId={pageId} />
      </div>
    );
  }

  const coreFields = coreMetricsSection?.fields
    ? [...coreMetricsSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];

  return (
    <div className={`dashboard-page ${isCurrentPageEditMode ? 'edit-mode' : ''}`}>
      {isCurrentPageEditMode && <EditModeToolbar pageId={pageId} />}

      <div className="page-header">
        <h1 className="page-title">Monthly Impact Overview</h1>
        <p className="page-subtitle">Key metrics and performance indicators for November 2025</p>
      </div>

      <EditableGrid pageId={pageId} onReorder={handleWidgetReorder}>
        {coreFields.length > 0 ? (
          coreFields.map((field, index) => {
            const Icon = getIconForField(field, index);
            const value = getFieldValue(field.id);
            const formattedValue = formatValue(field, value);
            const delta = getDelta(field.id);
            const color = getColorForField(field, index);

            return (
              <EditableWidget
                key={field.id}
                widgetId={`kpi-${field.id}`}
                pageId={pageId}
                defaultPosition={{ gridRow: 1, gridColumn: 1 + (index * 3), gridWidth: 3, gridHeight: 1, order: index }}
              >
                <KpiCard
                  icon={Icon}
                  label={field.label}
                  value={formattedValue}
                  delta={delta}
                  iconColor={color}
                  brandColor={brandColor}
                />
              </EditableWidget>
            );
          })
        ) : (
          <>
            <EditableWidget widgetId="kpi-enrolled" pageId={pageId} defaultPosition={{ gridRow: 1, gridColumn: 1, gridWidth: 3, gridHeight: 1, order: 0 }}>
              <KpiCard icon={Users} label="Enrolled This Month" value={data.overview.enrolledThisMonth} delta={data.overview.deltaEnrollment} iconColor="brand" brandColor={brandColor} />
            </EditableWidget>
            <EditableWidget widgetId="kpi-active" pageId={pageId} defaultPosition={{ gridRow: 1, gridColumn: 4, gridWidth: 3, gridHeight: 1, order: 1 }}>
              <KpiCard icon={Activity} label="Active Patients" value={data.overview.activePatients} delta={data.overview.deltaActive} iconColor="emerald" />
            </EditableWidget>
            <EditableWidget widgetId="kpi-services" pageId={pageId} defaultPosition={{ gridRow: 1, gridColumn: 7, gridWidth: 3, gridHeight: 1, order: 2 }}>
              <KpiCard icon={Calendar} label="Services Delivered" value={data.overview.servicesDelivered} delta={data.overview.deltaServices} iconColor="amber" />
            </EditableWidget>
            <EditableWidget widgetId="kpi-revenue" pageId={pageId} defaultPosition={{ gridRow: 1, gridColumn: 10, gridWidth: 3, gridHeight: 1, order: 3 }}>
              <KpiCard icon={DollarSign} label="Client Revenue This Month" value={data.overview.revenueThisMonth} delta={data.overview.deltaRevenue} iconColor="rose" />
            </EditableWidget>
          </>
        )}

        <EditableWidget widgetId="chart-enrollment" pageId={pageId} defaultPosition={{ gridRow: 2, gridColumn: 1, gridWidth: 6, gridHeight: 3, order: 10 }}>
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Enrollment Trend</h3>
                <p className="chart-subtitle">Monthly enrollments over time</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
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
        </EditableWidget>

        <EditableWidget widgetId="chart-active" pageId={pageId} defaultPosition={{ gridRow: 2, gridColumn: 7, gridWidth: 6, gridHeight: 3, order: 11 }}>
          <div className="chart-card">
            <div className="chart-header">
              <div>
                <h3 className="chart-title">Active Participants</h3>
                <p className="chart-subtitle">Total active participants over time</p>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={200}>
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
        </EditableWidget>

        <EditableWidget widgetId="summary-card" pageId={pageId} defaultPosition={{ gridRow: 6, gridColumn: 1, gridWidth: 12, gridHeight: 3, order: 20 }}>
          <div className="summary-card">
            <h3 className="summary-title">Monthly Progress Summary</h3>
            <div className="summary-grid">
              <div className="summary-item">
                <span className="summary-label">Enrollment Growth</span>
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
        </EditableWidget>

        <EditableWidget widgetId="chart-pie" pageId={pageId} defaultPosition={{ gridRow: 9, gridColumn: 1, gridWidth: 6, gridHeight: 3, order: 30 }}>
          <PieChartWidget
            title="Service Distribution"
            brandColor={brandColor}
            data={[
              { name: 'Primary Care', value: 450 },
              { name: 'Specialty Visits', value: 320 },
              { name: 'Preventive Care', value: 280 },
              { name: 'Emergency', value: 150 }
            ]}
          />
        </EditableWidget>
        <EditableWidget widgetId="chart-donut" pageId={pageId} defaultPosition={{ gridRow: 9, gridColumn: 7, gridWidth: 6, gridHeight: 3, order: 31 }}>
          <DonutChartWidget
            title="Patient Demographics"
            brandColor={brandColor}
            data={[
              { name: 'Age 18-35', value: 280 },
              { name: 'Age 36-50', value: 420 },
              { name: 'Age 51-65', value: 350 },
              { name: 'Age 65+', value: 250 }
            ]}
            centerLabel="1,300"
          />
        </EditableWidget>

        <EditableWidget widgetId="gauge-enrollment" pageId={pageId} defaultPosition={{ gridRow: 13, gridColumn: 1, gridWidth: 6, gridHeight: 3, order: 40 }}>
          <GaugeWidget
            title="Monthly Enrollment Target"
            value={data.overview.enrolledThisMonth || 42}
            max={100}
            target={80}
            brandColor={brandColor}
          />
        </EditableWidget>
        <EditableWidget widgetId="progress-revenue" pageId={pageId} defaultPosition={{ gridRow: 13, gridColumn: 7, gridWidth: 6, gridHeight: 3, order: 41 }}>
          <ProgressBarWidget
            title="Annual Revenue Goal"
            value={750000}
            max={1000000}
            label="$750K of $1M"
            brandColor={brandColor}
          />
        </EditableWidget>
      </EditableGrid>

      {customWidgets.filter(w => w.page_id === 'overview' && w.enabled).length > 0 && (
        <>
          <div style={{ marginTop: '32px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>Custom Widgets</h2>
          </div>
          <EditableGrid pageId={pageId} onReorder={handleWidgetReorder}>
            {customWidgets
              .filter(w => w.page_id === 'overview' && w.enabled)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((widget, index) => (
                <EditableWidget
                  key={widget.id}
                  widgetId={`custom-${widget.id}`}
                  pageId={pageId}
                  defaultPosition={{
                    gridRow: 6 + Math.floor(index / 2),
                    gridColumn: (index % 2) === 0 ? 1 : 7,
                    gridWidth: 6,
                    order: 50 + index
                  }}
                >
                  <CustomWidgetRenderer widget={widget} brandColor={brandColor} />
                </EditableWidget>
              ))}
          </EditableGrid>
        </>
      )}

      <DashboardEditToggle pageId={pageId} />
    </div>
  );
}

function EnrollmentPage({ data, sectionVisibility = {}, customWidgets = [], brandColor: propBrandColor }) {
  const { customization, getFormSchema } = useCustomization();
  const brandColor = propBrandColor || customization.branding.primaryColor;
  const formSchema = getFormSchema();
  
  const funnel = data.funnel;
  const campaign = data.campaign;
  const rawFormData = data.rawFormData || data;
  
  // Get sections from schema
  const enrollmentFunnelSection = formSchema.sections.find(s => s.id === 'enrollmentFunnel');
  const smsCampaignSection = formSchema.sections.find(s => s.id === 'smsCampaign');
  const emailCampaignSection = formSchema.sections.find(s => s.id === 'emailCampaign');
  const mailerCampaignSection = formSchema.sections.find(s => s.id === 'mailerCampaign');
  
  // Build funnel steps from schema
  const funnelFields = enrollmentFunnelSection?.fields 
    ? [...enrollmentFunnelSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  
  // Get campaign fields from schema
  const smsFields = smsCampaignSection?.fields 
    ? [...smsCampaignSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const emailFields = emailCampaignSection?.fields 
    ? [...emailCampaignSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  const mailerFields = mailerCampaignSection?.fields 
    ? [...mailerCampaignSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
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
  
  // Default visibility based on schema
  const visibility = {
    enrollmentFunnel: enrollmentFunnelSection?.enabled !== false,
    campaignPerformance: true,
    smsCampaign: smsCampaignSection?.enabled !== false,
    emailCampaign: emailCampaignSection?.enabled !== false,
    mailerCampaign: mailerCampaignSection?.enabled !== false,
    enrollmentNotes: true,
    ...sectionVisibility
  };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Enrollment & Engagement</h1>
        <p className="page-subtitle">Patient acquisition funnel and conversion metrics</p>
      </div>

      {visibility.enrollmentFunnel && (
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">{enrollmentFunnelSection?.title || 'Enrollment Funnel'}</h3>
              <p className="chart-subtitle">{enrollmentFunnelSection?.subtitle || 'Conversion rates at each stage'}</p>
            </div>
          </div>
          <div className="funnel-container">
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
      )}

      {visibility.campaignPerformance && (visibility.smsCampaign || visibility.emailCampaign || visibility.mailerCampaign) && (
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <h3 className="chart-title">Campaign Performance</h3>
              <p className="chart-subtitle">Enrollment campaign success by channel</p>
            </div>
          </div>
          
          <div className="campaign-grid">
            {visibility.smsCampaign && (
              <div className="campaign-card">
                <div className="campaign-icon sms">📱</div>
                <div className="campaign-type">{smsCampaignSection?.title || 'SMS Campaign'}</div>
                {renderCampaignCard(smsCampaignSection, smsFields, '📱', 'sms', [
                  { label: 'Sent', value: campaign.sms.sent },
                  { label: 'Consented', value: campaign.sms.consented }
                ])}
              </div>
            )}
            
            {visibility.emailCampaign && (
              <div className="campaign-card">
                <div className="campaign-icon email">📧</div>
                <div className="campaign-type">{emailCampaignSection?.title || 'Email Campaign'}</div>
                {renderCampaignCard(emailCampaignSection, emailFields, '📧', 'email', [
                  { label: 'Sent', value: campaign.email.sent },
                  { label: 'Consented', value: campaign.email.consented }
                ])}
              </div>
            )}
            
            {visibility.mailerCampaign && (
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
      )}

      {customWidgets.filter(w => w.page_id === 'enrollment' && w.enabled).length > 0 && (
        <>
          <div style={{ marginTop: '32px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>Custom Widgets</h2>
          </div>
          <div className="two-col-grid">
            {customWidgets
              .filter(w => w.page_id === 'enrollment' && w.enabled)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(widget => (
                <CustomWidgetRenderer key={widget.id} widget={widget} brandColor={brandColor} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function FinancialPage({ data, sectionVisibility = {}, customWidgets = [], brandColor: propBrandColor }) {
  const { customization } = useCustomization();
  const brandColor = propBrandColor || customization.branding.primaryColor;
  
  // Calculate YTD from revenue series
  const ytdRevenue = data.revenueSeries.reduce((sum, r) => sum + r.amount, 0);
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Financial & ROI</h1>
        <p className="page-subtitle">Revenue trends and financial performance</p>
      </div>

      <div className="two-col-grid">
        <div className="kpi-card">
          <div className="kpi-icon" style={{ background: brandColor, color: 'white' }}><DollarSign size={22} /></div>
          <div className="kpi-label">Client Revenue This Month</div>
          <div className="kpi-value" style={{ color: brandColor }}>{data.overview.revenueThisMonth}</div>
          <span className={`kpi-delta ${data.overview.deltaRevenue?.startsWith('+') ? 'positive' : 'negative'}`}>
            <TrendingUp size={14} />{data.overview.deltaRevenue || 'N/A'} vs last month
          </span>
        </div>
        <div className="kpi-card">
          <div className="kpi-icon emerald"><TrendingUp size={22} /></div>
          <div className="kpi-label">Year-to-Date Revenue</div>
          <div className="kpi-value">${ytdRevenue.toLocaleString()}</div>
        </div>
      </div>

      <div className="chart-card">
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Revenue Trend</h3>
            <p className="chart-subtitle">Month-over-month revenue performance</p>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data.revenueSeries}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
            <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
            <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, "Revenue"]} />
            <Bar dataKey="amount" fill={brandColor} radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {customWidgets.filter(w => w.page_id === 'financial' && w.enabled).length > 0 && (
        <>
          <div style={{ marginTop: '32px', marginBottom: '16px' }}>
            <h2 style={{ fontSize: '20px', fontWeight: 600, color: '#0f172a' }}>Custom Widgets</h2>
          </div>
          <div className="two-col-grid">
            {customWidgets
              .filter(w => w.page_id === 'financial' && w.enabled)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map(widget => (
                <CustomWidgetRenderer key={widget.id} widget={widget} brandColor={brandColor} />
              ))}
          </div>
        </>
      )}
    </div>
  );
}

function OutcomesPage({ data, sectionVisibility = {} }) {
  const { customization, getFormSchema, FIELD_TYPES } = useCustomization();
  const brandColor = customization.branding.primaryColor;
  const outcomes = data.outcomes;
  const formSchema = getFormSchema();
  
  // Get the Patient Outcomes section from form schema
  const outcomesSection = formSchema.sections.find(s => s.id === 'patientOutcomes');
  const outcomesEnabled = outcomesSection?.enabled !== false;
  
  // Default visibility
  const visibility = {
    patientOutcomes: outcomesEnabled,
    ...sectionVisibility
  };
  
  // Format value based on field type
  const formatValue = (field, value) => {
    if (field.fieldType === FIELD_TYPES?.PERCENT || field.suffix === '%') {
      return `${value || 0}%`;
    }
    if (field.fieldType === FIELD_TYPES?.CURRENCY || field.prefix === '$') {
      return `$${Number(value || 0).toLocaleString()}`;
    }
    if (field.id === 'avgResponseHours') {
      return `${value || 0}h`;
    }
    return value || 0;
  };
  
  // Get raw form data for custom fields
  const rawFormData = data.rawFormData || data;
  
  // Get field value with fallbacks
  const getFieldValue = (fieldId) => {
    // First check rawFormData (most reliable for custom fields)
    if (rawFormData && rawFormData[fieldId] !== undefined) {
      return rawFormData[fieldId];
    }
    // Check outcomes data
    if (outcomes && outcomes[fieldId] !== undefined) {
      return outcomes[fieldId];
    }
    // Handle legacy field names
    const legacyMap = {
      'avgResponseHours': outcomes?.avgResponse,
    };
    return legacyMap[fieldId] || 0;
  };
  
  if (!visibility.patientOutcomes) {
    return (
      <div>
        <div className="page-header">
          <h1 className="page-title">Patient Outcomes</h1>
          <p className="page-subtitle">Clinical impact and health improvement metrics</p>
        </div>
        <div className="chart-card" style={{ textAlign: 'center', padding: '60px 20px', color: '#94a3b8' }}>
          <p>No sections configured for this view. Enable sections in Dashboard Management.</p>
        </div>
      </div>
    );
  }
  
  // Get sorted fields from outcomes section
  const outcomesFields = outcomesSection?.fields 
    ? [...outcomesSection.fields].sort((a, b) => (a.order || 0) - (b.order || 0))
    : [];
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">{outcomesSection?.title || 'Patient Outcomes'}</h1>
        <p className="page-subtitle">{outcomesSection?.subtitle || 'Clinical impact and health improvement metrics'}</p>
      </div>

      <div className="outcomes-grid">
        {outcomesFields.length > 0 ? (
          outcomesFields.map((field) => {
            const value = getFieldValue(field.id);
            const formattedValue = formatValue(field, value);
            
            return (
              <div key={field.id} className="outcome-card">
                <div className="outcome-value" style={{ color: brandColor }}>{formattedValue}</div>
                <div className="outcome-label">{field.label}</div>
              </div>
            );
          })
        ) : (
          // Fallback to hardcoded if no schema
          <>
            <div className="outcome-card">
              <div className="outcome-value" style={{ color: brandColor }}>{outcomes.bpImproved}%</div>
              <div className="outcome-label">BP Improved</div>
            </div>
            <div className="outcome-card">
              <div className="outcome-value" style={{ color: brandColor }}>{outcomes.adherenceRate}%</div>
              <div className="outcome-label">Medication Adherence</div>
            </div>
            <div className="outcome-card">
              <div className="outcome-value" style={{ color: brandColor }}>{outcomes.readmissionReduction}%</div>
              <div className="outcome-label">Readmission Reduction</div>
            </div>
            <div className="outcome-card">
              <div className="outcome-value" style={{ color: brandColor }}>{outcomes.avgResponse}</div>
              <div className="outcome-label">Avg Response Time</div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function StoriesPage({ stories, sectionVisibility = {} }) {
  // Default visibility
  const visibility = {
    stories: true,
    ...sectionVisibility
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
  
  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Stories & Feedback</h1>
        <p className="page-subtitle">Patient success stories and testimonials</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {stories.length > 0 ? stories.map((story, i) => (
          <div key={story.id || i} className="story-card">
            <h4>{story.title || 'Untitled Story'}</h4>
            <p>"{story.quote || 'No quote provided'}"</p>
            <div className="story-meta">— {story.patientType || 'Patient'}</div>
          </div>
        )) : (
          <div className="notes-card">
            <p>No stories added yet. Add stories in Dashboard Management.</p>
          </div>
        )}
      </div>
    </div>
  );
}

function OpportunitiesPage({ opportunities, sectionVisibility = {} }) {
  // Default visibility
  const visibility = {
    opportunities: true,
    ...sectionVisibility
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
    </div>
  );
}

// ============================================================
// MONTHLY INITIATIVES PAGE
// ============================================================

function MonthlyInitiativesPage({ monthLabel }) {
  const programs = [
    {
      id: 'ccm',
      name: 'Chronic Care Management (CCM)',
      icon: '💊',
      color: '#0d9488',
      description: 'Ongoing support for patients with chronic conditions.',
      topics: [
        'Managing multiple medications safely',
        'Understanding your chronic conditions',
        'Setting health goals with your care team',
        'Nutrition tips for chronic disease management',
        'Exercise and activity recommendations',
      ],
    },
    {
      id: 'rtm',
      name: 'Remote Therapeutic Management (RTM)',
      icon: '📱',
      color: '#0891b2',
      description: 'Support for patients using therapeutic devices or monitoring tools at home.',
      topics: [
        'How to use your home monitoring device',
        'Understanding your readings and what they mean',
        'When to contact your care team about readings',
        'Troubleshooting common device issues',
        'Tracking your progress over time',
      ],
    },
    {
      id: 'pin',
      name: 'Principal Illness Navigation (PIN)',
      icon: '🧭',
      color: '#7c3aed',
      description: 'Guided assistance for patients managing a serious or high-risk condition.',
      topics: [
        'Coordinating care between multiple specialists',
        'Understanding your treatment plan',
        'Managing appointments and follow-ups',
        'Resources for emotional and mental support',
        'Advance care planning conversations',
      ],
    },
    {
      id: 'sdoh',
      name: 'Social Determinants of Health (SDOH)',
      icon: '🏠',
      color: '#ea580c',
      description: 'Assistance addressing social, financial, transportation, or environmental challenges that may affect your health.',
      topics: [
        'Community resources for food assistance',
        'Transportation options for medical appointments',
        'Housing stability and health connections',
        'Financial assistance programs available',
        'Social support and community connections',
      ],
    },
    {
      id: 'cpm',
      name: 'Chronic Pain Management (CPM)',
      icon: '🌟',
      color: '#dc2626',
      description: 'Extra support and coordinated care for patients experiencing ongoing or long-term pain.',
      topics: [
        'Non-medication approaches to pain management',
        'Safe use of pain medications',
        'Physical therapy and movement strategies',
        'Mind-body techniques for pain relief',
        'Sleep hygiene and pain management',
      ],
    },
  ];

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Strategic Priorities</h1>
        <p className="page-subtitle">Key initiatives and strategic focus areas for this period</p>
      </div>

      <div className="initiatives-grid">
        {programs.map(program => (
          <div key={program.id} className="initiative-card" style={{ '--program-color': program.color }}>
            <div className="initiative-header">
              <span className="initiative-icon">{program.icon}</span>
              <h3 className="initiative-name">{program.name}</h3>
            </div>
            <p className="initiative-description">{program.description}</p>
            <div className="initiative-topics">
              <h4>This Month's Focus Areas:</h4>
              <ul>
                {program.topics.map((topic, i) => (
                  <li key={i}>{topic}</li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      <div className="chart-card" style={{ marginTop: '24px' }}>
        <div className="chart-header">
          <div>
            <h3 className="chart-title">Program Overview</h3>
            <p className="chart-subtitle">Understanding our care management programs</p>
          </div>
        </div>
        <div className="program-overview-content">
          <p>
            Our comprehensive care management programs are designed to support patients across various health needs. 
            Each month, we develop targeted educational content for each program to help patients better understand 
            and manage their health conditions.
          </p>
          <div className="program-stats">
            <div className="program-stat">
              <span className="stat-number">5</span>
              <span className="stat-label">Active Programs</span>
            </div>
            <div className="program-stat">
              <span className="stat-number">25+</span>
              <span className="stat-label">Educational Topics</span>
            </div>
            <div className="program-stat">
              <span className="stat-number">Monthly</span>
              <span className="stat-label">Content Updates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// MAIN APP
// ============================================================

// ============================================================
// DASHBOARD MANAGEMENT PAGE
// ============================================================

// ============================================================
// WIDGET LIBRARY TAB COMPONENT
// ============================================================

const widgetTemplateDB = {
  async getTemplates(includeSystem = true) {
    try {
      let query = supabase.from('widget_templates').select('*');
      if (!includeSystem) {
        query = query.eq('is_system_template', false);
      }
      const { data, error } = await query.order('category').order('name');
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching templates:', error);
      return [];
    }
  },

  async saveTemplate(template) {
    try {
      const { data, error } = await supabase
        .from('widget_templates')
        .upsert({ ...template, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error saving template:', error);
      return { success: false, error: error.message };
    }
  },

  async deleteTemplate(id) {
    try {
      const { error } = await supabase.from('widget_templates').delete().eq('id', id);
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error deleting template:', error);
      return { success: false, error: error.message };
    }
  },

  async incrementUsage(id) {
    try {
      const { data, error } = await supabase.rpc('increment_template_usage', { template_id: id });
      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Error incrementing usage:', error);
      return { success: false };
    }
  }
};

const pageLayoutDB = {
  async getLayout(clientId, pageId) {
    try {
      const { data, error } = await supabase
        .from('page_layouts')
        .select('*')
        .eq('client_id', clientId)
        .eq('page_id', pageId)
        .maybeSingle();
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error fetching layout:', error);
      return null;
    }
  },

  async getAllLayouts(clientId) {
    try {
      const { data, error } = await supabase
        .from('page_layouts')
        .select('*')
        .eq('client_id', clientId);
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching layouts:', error);
      return [];
    }
  },

  async saveLayout(layout) {
    try {
      const { data, error } = await supabase
        .from('page_layouts')
        .upsert({ ...layout, updated_at: new Date().toISOString() }, { onConflict: 'client_id,page_id' })
        .select()
        .single();
      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Error saving layout:', error);
      return { success: false, error: error.message };
    }
  }
};

const WIDGET_CATEGORIES = {
  chart: { label: 'Charts', icon: BarChart2, description: 'Visualize data trends and comparisons' },
  indicator: { label: 'Indicators', icon: Target, description: 'Display key metrics and progress' },
  data: { label: 'Data Display', icon: Layers, description: 'Show detailed information' }
};

function WidgetLibraryTab({ clientId }) {
  const { customization } = useCustomization();
  const [activeSection, setActiveSection] = useState('gallery');
  const [templates, setTemplates] = useState([]);
  const [customWidgets, setCustomWidgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedWidgetType, setSelectedWidgetType] = useState(null);
  const [editingWidget, setEditingWidget] = useState(null);

  useEffect(() => {
    loadData();
  }, [clientId]);

  const loadData = async () => {
    setLoading(true);
    const [templatesData, widgetsData] = await Promise.all([
      widgetTemplateDB.getTemplates(true),
      widgetConfigDB.getWidgetConfigs(clientId)
    ]);
    setTemplates(templatesData);
    setCustomWidgets(widgetsData);
    setLoading(false);
  };

  const widgetTypes = Object.values(WIDGET_TYPES);
  const filteredWidgetTypes = widgetTypes.filter(w => {
    const matchesCategory = selectedCategory === 'all' || w.category === selectedCategory;
    const matchesSearch = !searchQuery || w.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const systemTemplates = templates.filter(t => t.is_system_template);
  const userTemplates = templates.filter(t => !t.is_system_template);

  const handleCreateWidget = (widgetType) => {
    setSelectedWidgetType(widgetType);
    setShowCreateModal(true);
  };

  const handleUseTemplate = async (template) => {
    const newWidget = {
      client_id: clientId,
      page_id: 'overview',
      widget_id: `widget_${Date.now()}`,
      widget_type: template.widget_type,
      title: template.name,
      description: template.description,
      data_source: template.configuration?.data_source || {},
      settings: template.configuration?.settings || {},
      enabled: true,
      order: customWidgets.length,
      template_id: template.id,
      grid_column: 1,
      grid_row: customWidgets.length + 1,
      grid_width: 6,
      grid_height: 4
    };
    const result = await widgetConfigDB.saveWidgetConfig(newWidget);
    if (result.success) {
      await widgetTemplateDB.incrementUsage(template.id);
      loadData();
    }
  };

  const handleDeleteWidget = async (widget) => {
    if (confirm('Are you sure you want to delete this widget?')) {
      await widgetConfigDB.deleteWidgetConfig(widget.id);
      loadData();
    }
  };

  const handleToggleWidget = async (widget) => {
    await widgetConfigDB.updateWidgetConfig(widget.id, { enabled: !widget.enabled });
    loadData();
  };

  const handleDuplicateWidget = async (widget) => {
    const newWidget = {
      ...widget,
      id: undefined,
      widget_id: `widget_${Date.now()}`,
      title: `${widget.title} (Copy)`,
      order: customWidgets.length
    };
    await widgetConfigDB.saveWidgetConfig(newWidget);
    loadData();
  };

  const getWidgetTypeIcon = (typeId) => {
    const iconMap = { 'pie-chart': PieChart, 'donut-chart': PieChart, 'bar-chart': BarChart2, 'horizontal-bar': BarChart2, 'area-chart': TrendingUp, 'line-chart': TrendingUp, 'gauge-chart': Target, 'kpi-card': Star, 'funnel-chart': TrendingUp, 'combo-chart': Activity };
    return iconMap[typeId] || BarChart2;
  };

  if (loading) {
    return (
      <div className="widget-library-loading">
        <RefreshCw size={24} className="spin" />
        <p>Loading widget library...</p>
      </div>
    );
  }

  return (
    <div className="widget-library-tab">
      <div className="widget-library-header">
        <div className="widget-library-tabs">
          <button className={`wl-tab ${activeSection === 'gallery' ? 'active' : ''}`} onClick={() => setActiveSection('gallery')}>
            <Grid size={16} /> Widget Gallery
          </button>
          <button className={`wl-tab ${activeSection === 'my-widgets' ? 'active' : ''}`} onClick={() => setActiveSection('my-widgets')}>
            <Layers size={16} /> My Widgets ({customWidgets.length})
          </button>
          <button className={`wl-tab ${activeSection === 'templates' ? 'active' : ''}`} onClick={() => setActiveSection('templates')}>
            <Copy size={16} /> Templates ({templates.length})
          </button>
        </div>
      </div>

      {activeSection === 'gallery' && (
        <div className="widget-gallery">
          <div className="gallery-controls">
            <div className="gallery-search">
              <input type="text" placeholder="Search widget types..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="gallery-search-input" />
            </div>
            <div className="gallery-filters">
              <button className={`filter-btn ${selectedCategory === 'all' ? 'active' : ''}`} onClick={() => setSelectedCategory('all')}>All</button>
              {Object.entries(WIDGET_CATEGORIES).map(([key, cat]) => (
                <button key={key} className={`filter-btn ${selectedCategory === key ? 'active' : ''}`} onClick={() => setSelectedCategory(key)}>
                  <cat.icon size={14} /> {cat.label}
                </button>
              ))}
            </div>
          </div>

          <div className="widget-type-grid">
            {filteredWidgetTypes.map((widgetType) => {
              const IconComponent = getWidgetTypeIcon(widgetType.id);
              return (
                <div key={widgetType.id} className="widget-type-card" onClick={() => handleCreateWidget(widgetType)}>
                  <div className="widget-type-preview">
                    <IconComponent size={32} />
                  </div>
                  <div className="widget-type-info">
                    <h4>{widgetType.name}</h4>
                    <span className="widget-type-category">{WIDGET_CATEGORIES[widgetType.category]?.label || widgetType.category}</span>
                  </div>
                  <button className="widget-create-btn"><Plus size={14} /> Create</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {activeSection === 'my-widgets' && (
        <div className="my-widgets-section">
          {customWidgets.length === 0 ? (
            <div className="empty-widgets">
              <Layers size={48} />
              <h3>No custom widgets yet</h3>
              <p>Create your first widget from the Widget Gallery or use a template to get started.</p>
              <button className="primary-btn" onClick={() => setActiveSection('gallery')}><Plus size={16} /> Create Widget</button>
            </div>
          ) : (
            <div className="widgets-table">
              <div className="widgets-table-header">
                <div className="wt-col wt-name">Widget Name</div>
                <div className="wt-col wt-type">Type</div>
                <div className="wt-col wt-page">Page</div>
                <div className="wt-col wt-status">Status</div>
                <div className="wt-col wt-actions">Actions</div>
              </div>
              {customWidgets.map((widget) => {
                const IconComponent = getWidgetTypeIcon(widget.widget_type);
                return (
                  <div key={widget.id} className={`widgets-table-row ${!widget.enabled ? 'disabled' : ''}`}>
                    <div className="wt-col wt-name">
                      <IconComponent size={16} />
                      <span>{widget.title || 'Untitled Widget'}</span>
                    </div>
                    <div className="wt-col wt-type">{WIDGET_TYPES[Object.keys(WIDGET_TYPES).find(k => WIDGET_TYPES[k].id === widget.widget_type)]?.name || widget.widget_type}</div>
                    <div className="wt-col wt-page"><span className="page-badge">{widget.page_id}</span></div>
                    <div className="wt-col wt-status">
                      <span className={`status-badge ${widget.enabled ? 'active' : 'inactive'}`}>{widget.enabled ? 'Active' : 'Inactive'}</span>
                    </div>
                    <div className="wt-col wt-actions">
                      <button className="icon-btn" onClick={() => setEditingWidget(widget)} title="Edit"><Edit2 size={14} /></button>
                      <button className="icon-btn" onClick={() => handleDuplicateWidget(widget)} title="Duplicate"><Copy size={14} /></button>
                      <button className="icon-btn" onClick={() => handleToggleWidget(widget)} title={widget.enabled ? 'Disable' : 'Enable'}>{widget.enabled ? <EyeOff size={14} /> : <Eye size={14} />}</button>
                      <button className="icon-btn danger" onClick={() => handleDeleteWidget(widget)} title="Delete"><Trash2 size={14} /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {activeSection === 'templates' && (
        <div className="templates-section">
          <div className="templates-group">
            <h3><Award size={18} /> System Templates</h3>
            <p className="templates-desc">Pre-built widget configurations for common use cases</p>
            <div className="templates-grid">
              {systemTemplates.map((template) => {
                const IconComponent = getWidgetTypeIcon(template.widget_type);
                return (
                  <div key={template.id} className="template-card">
                    <div className="template-icon"><IconComponent size={24} /></div>
                    <div className="template-info">
                      <h4>{template.name}</h4>
                      <p>{template.description}</p>
                      <span className="template-category">{template.category}</span>
                    </div>
                    <button className="use-template-btn" onClick={() => handleUseTemplate(template)}><Plus size={14} /> Use Template</button>
                  </div>
                );
              })}
            </div>
          </div>

          {userTemplates.length > 0 && (
            <div className="templates-group">
              <h3><Star size={18} /> My Templates</h3>
              <p className="templates-desc">Your saved widget configurations</p>
              <div className="templates-grid">
                {userTemplates.map((template) => {
                  const IconComponent = getWidgetTypeIcon(template.widget_type);
                  return (
                    <div key={template.id} className="template-card user-template">
                      <div className="template-icon"><IconComponent size={24} /></div>
                      <div className="template-info">
                        <h4>{template.name}</h4>
                        <p>{template.description}</p>
                        <span className="template-meta">Used {template.usage_count || 0} times</span>
                      </div>
                      <div className="template-actions">
                        <button className="use-template-btn" onClick={() => handleUseTemplate(template)}><Plus size={14} /> Use</button>
                        <button className="icon-btn danger" onClick={() => widgetTemplateDB.deleteTemplate(template.id).then(loadData)}><Trash2 size={14} /></button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {showCreateModal && (
        <WidgetCreationWizard
          widgetType={selectedWidgetType}
          clientId={clientId}
          onClose={() => { setShowCreateModal(false); setSelectedWidgetType(null); }}
          onSave={() => { setShowCreateModal(false); setSelectedWidgetType(null); loadData(); }}
          existingWidgetsCount={customWidgets.length}
        />
      )}

      {editingWidget && (
        <WidgetCreationWizard
          widgetType={WIDGET_TYPES[Object.keys(WIDGET_TYPES).find(k => WIDGET_TYPES[k].id === editingWidget.widget_type)]}
          clientId={clientId}
          existingWidget={editingWidget}
          onClose={() => setEditingWidget(null)}
          onSave={() => { setEditingWidget(null); loadData(); }}
          existingWidgetsCount={customWidgets.length}
        />
      )}
    </div>
  );
}

// ============================================================
// WIDGET CREATION WIZARD
// ============================================================

function WidgetCreationWizard({ widgetType, clientId, existingWidget, onClose, onSave, existingWidgetsCount }) {
  const { customization } = useCustomization();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: existingWidget?.title || widgetType?.name || '',
    description: existingWidget?.description || '',
    data_source: existingWidget?.data_source || { type: 'manual', metrics: [], data: [] },
    settings: existingWidget?.settings || { colorScheme: 'brand', showLegend: true },
    page_id: existingWidget?.page_id || 'overview',
    enabled: existingWidget?.enabled ?? true,
    grid_width: existingWidget?.grid_width || 6,
    grid_height: existingWidget?.grid_height || 4
  });

  const availablePages = customization.navigation.tabs.map(t => ({ id: t.id, label: t.label }));
  const availableMetrics = Object.entries(customization.metrics).map(([id, m]) => ({ id, label: m.label, category: m.category }));

  const handleSave = async () => {
    const widgetData = {
      id: existingWidget?.id,
      client_id: clientId,
      page_id: formData.page_id,
      widget_id: existingWidget?.widget_id || `widget_${Date.now()}`,
      widget_type: widgetType?.id || existingWidget?.widget_type,
      title: formData.title,
      description: formData.description,
      data_source: formData.data_source,
      settings: formData.settings,
      enabled: formData.enabled,
      order: existingWidget?.order ?? existingWidgetsCount,
      grid_column: existingWidget?.grid_column || 1,
      grid_row: existingWidget?.grid_row || (existingWidgetsCount + 1),
      grid_width: formData.grid_width,
      grid_height: formData.grid_height
    };

    const result = await widgetConfigDB.saveWidgetConfig(widgetData);
    if (result.success) {
      onSave();
    }
  };

  const updateFormData = (updates) => setFormData(prev => ({ ...prev, ...updates }));

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="widget-wizard-modal" onClick={(e) => e.stopPropagation()}>
        <div className="wizard-header">
          <h2>{existingWidget ? 'Edit Widget' : 'Create Widget'}</h2>
          <button className="close-btn" onClick={onClose}><X size={20} /></button>
        </div>

        <div className="wizard-progress">
          {[1, 2, 3, 4].map(s => (
            <div key={s} className={`progress-step ${step >= s ? 'active' : ''} ${step === s ? 'current' : ''}`}>
              <span className="step-number">{s}</span>
              <span className="step-label">{['Type', 'Data', 'Style', 'Place'][s - 1]}</span>
            </div>
          ))}
        </div>

        <div className="wizard-content">
          {step === 1 && (
            <div className="wizard-step">
              <h3>Widget Configuration</h3>
              <div className="form-group">
                <label>Widget Title</label>
                <input type="text" value={formData.title} onChange={(e) => updateFormData({ title: e.target.value })} placeholder="Enter widget title" className="form-input" />
              </div>
              <div className="form-group">
                <label>Description (optional)</label>
                <textarea value={formData.description} onChange={(e) => updateFormData({ description: e.target.value })} placeholder="Brief description of this widget" className="form-textarea" rows={2} />
              </div>
              <div className="selected-type-preview">
                <div className="type-preview-icon"><BarChart2 size={32} /></div>
                <div className="type-preview-info">
                  <strong>{widgetType?.name || 'Widget'}</strong>
                  <span>{WIDGET_CATEGORIES[widgetType?.category]?.label || 'Custom'}</span>
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="wizard-step">
              <h3>Data Source</h3>
              <div className="form-group">
                <label>Data Type</label>
                <div className="data-type-options">
                  {['manual', 'metrics', 'calculated'].map(type => (
                    <button key={type} className={`data-type-btn ${formData.data_source.type === type ? 'active' : ''}`} onClick={() => updateFormData({ data_source: { ...formData.data_source, type } })}>
                      {type === 'manual' && <><Edit2 size={16} /> Manual Entry</>}
                      {type === 'metrics' && <><BarChart2 size={16} /> Link to Metrics</>}
                      {type === 'calculated' && <><Target size={16} /> Calculated</>}
                    </button>
                  ))}
                </div>
              </div>

              {formData.data_source.type === 'metrics' && (
                <div className="form-group">
                  <label>Select Metrics</label>
                  <div className="metrics-selector">
                    {availableMetrics.map(metric => (
                      <label key={metric.id} className="metric-checkbox">
                        <input type="checkbox" checked={formData.data_source.metrics?.includes(metric.id) || false} onChange={(e) => {
                          const metrics = formData.data_source.metrics || [];
                          updateFormData({ data_source: { ...formData.data_source, metrics: e.target.checked ? [...metrics, metric.id] : metrics.filter(m => m !== metric.id) } });
                        }} />
                        <span>{metric.label}</span>
                        <span className="metric-category">{metric.category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {formData.data_source.type === 'manual' && (
                <div className="form-group">
                  <label>Data Points</label>
                  <p className="form-hint">Data will be entered directly in the widget settings after creation.</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="wizard-step">
              <h3>Appearance</h3>
              <div className="form-group">
                <label>Color Scheme</label>
                <div className="color-scheme-options">
                  {['brand', 'emerald', 'blue', 'amber', 'rose'].map(color => (
                    <button key={color} className={`color-btn ${formData.settings.colorScheme === color ? 'active' : ''}`} onClick={() => updateFormData({ settings: { ...formData.settings, colorScheme: color } })} style={{ '--scheme-color': color === 'brand' ? customization.branding.primaryColor : { emerald: '#10b981', blue: '#3b82f6', amber: '#f59e0b', rose: '#f43f5e' }[color] }}>
                      <span className="color-preview-swatch" />
                      {color.charAt(0).toUpperCase() + color.slice(1)}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label>Widget Size</label>
                <div className="size-options">
                  {[{ w: 4, h: 3, label: 'Small' }, { w: 6, h: 4, label: 'Medium' }, { w: 8, h: 4, label: 'Large' }, { w: 12, h: 4, label: 'Full Width' }].map(size => (
                    <button key={size.label} className={`size-btn ${formData.grid_width === size.w ? 'active' : ''}`} onClick={() => updateFormData({ grid_width: size.w, grid_height: size.h })}>
                      <div className="size-preview" style={{ width: size.w * 4, height: size.h * 4 }} />
                      {size.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={formData.settings.showLegend ?? true} onChange={(e) => updateFormData({ settings: { ...formData.settings, showLegend: e.target.checked } })} />
                  Show Legend
                </label>
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="wizard-step">
              <h3>Placement</h3>
              <div className="form-group">
                <label>Assign to Page</label>
                <select value={formData.page_id} onChange={(e) => updateFormData({ page_id: e.target.value })} className="form-select">
                  {availablePages.map(page => (
                    <option key={page.id} value={page.id}>{page.label}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="checkbox-label">
                  <input type="checkbox" checked={formData.enabled} onChange={(e) => updateFormData({ enabled: e.target.checked })} />
                  Enable widget immediately
                </label>
              </div>

              <div className="placement-summary">
                <h4>Widget Summary</h4>
                <div className="summary-item"><strong>Title:</strong> {formData.title}</div>
                <div className="summary-item"><strong>Type:</strong> {widgetType?.name}</div>
                <div className="summary-item"><strong>Page:</strong> {availablePages.find(p => p.id === formData.page_id)?.label}</div>
                <div className="summary-item"><strong>Size:</strong> {formData.grid_width} columns</div>
              </div>
            </div>
          )}
        </div>

        <div className="wizard-footer">
          {step > 1 && (
            <button className="secondary-btn" onClick={() => setStep(step - 1)}><ChevronLeft size={16} /> Back</button>
          )}
          <div className="wizard-footer-right">
            <button className="cancel-btn" onClick={onClose}>Cancel</button>
            {step < 4 ? (
              <button className="primary-btn" onClick={() => setStep(step + 1)}>Next <ChevronRight size={16} /></button>
            ) : (
              <button className="primary-btn" onClick={handleSave}><Save size={16} /> {existingWidget ? 'Update' : 'Create'} Widget</button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// PAGE ELEMENT REGISTRY
// ============================================================
// Maps all hardcoded page elements for visualization in layout designer

const PAGE_ELEMENTS_REGISTRY = {
  overview: [
    { id: 'kpi-grid', type: 'container', title: 'KPI Cards Container', isStatic: true, gridColumn: 1, gridRow: 1, gridWidth: 12, gridHeight: 2, description: 'Container for key performance indicator cards' },
    { id: 'kpi-enrolled', type: 'kpi-card', title: 'Participants Enrolled This Month', isStatic: true, isFromSchema: true, gridColumn: 1, gridRow: 1, gridWidth: 3, gridHeight: 2, category: 'core-metrics' },
    { id: 'kpi-active', type: 'kpi-card', title: 'Total Active Participants', isStatic: true, isFromSchema: true, gridColumn: 4, gridRow: 1, gridWidth: 3, gridHeight: 2, category: 'core-metrics' },
    { id: 'kpi-services', type: 'kpi-card', title: 'Services Delivered', isStatic: true, isFromSchema: true, gridColumn: 7, gridRow: 1, gridWidth: 3, gridHeight: 2, category: 'core-metrics' },
    { id: 'kpi-revenue', type: 'kpi-card', title: 'Revenue This Month', isStatic: true, isFromSchema: true, gridColumn: 10, gridRow: 1, gridWidth: 3, gridHeight: 2, category: 'core-metrics' },
    { id: 'enrollment-trend', type: 'area-chart', title: 'Enrollment Trend', isStatic: true, gridColumn: 1, gridRow: 3, gridWidth: 6, gridHeight: 4, description: 'Monthly enrollments over time' },
    { id: 'active-participants', type: 'area-chart', title: 'Active Participants', isStatic: true, gridColumn: 7, gridRow: 3, gridWidth: 6, gridHeight: 4, description: 'Total active participants over time' },
    { id: 'monthly-summary', type: 'summary-card', title: 'Monthly Progress Summary', isStatic: true, gridColumn: 1, gridRow: 7, gridWidth: 12, gridHeight: 3, description: 'Enrollment, retention, and revenue summary' },
  ],
  enrollment: [
    { id: 'enrollment-funnel', type: 'funnel-chart', title: 'Enrollment Funnel', isStatic: true, isFromSchema: true, gridColumn: 1, gridRow: 1, gridWidth: 12, gridHeight: 4, description: 'Conversion rates at each stage' },
    { id: 'campaign-performance', type: 'container', title: 'Campaign Performance', isStatic: true, gridColumn: 1, gridRow: 5, gridWidth: 12, gridHeight: 3, description: 'SMS, Email, and Mailer campaigns' },
    { id: 'sms-campaign', type: 'campaign-card', title: 'SMS Campaign', isStatic: true, isFromSchema: true, gridColumn: 1, gridRow: 5, gridWidth: 4, gridHeight: 3, category: 'campaigns' },
    { id: 'email-campaign', type: 'campaign-card', title: 'Email Campaign', isStatic: true, isFromSchema: true, gridColumn: 5, gridRow: 5, gridWidth: 4, gridHeight: 3, category: 'campaigns' },
    { id: 'mailer-campaign', type: 'campaign-card', title: 'Mailer Campaign', isStatic: true, isFromSchema: true, gridColumn: 9, gridRow: 5, gridWidth: 4, gridHeight: 3, category: 'campaigns' },
  ],
  financial: [
    { id: 'revenue-kpis', type: 'container', title: 'Revenue KPIs', isStatic: true, gridColumn: 1, gridRow: 1, gridWidth: 12, gridHeight: 2, description: 'Financial performance indicators' },
    { id: 'revenue-breakdown', type: 'bar-chart', title: 'Revenue Breakdown', isStatic: true, isFromSchema: true, gridColumn: 1, gridRow: 3, gridWidth: 6, gridHeight: 4 },
    { id: 'cost-analysis', type: 'pie-chart', title: 'Cost Analysis', isStatic: true, gridColumn: 7, gridRow: 3, gridWidth: 6, gridHeight: 4 },
  ],
  outcomes: [
    { id: 'health-metrics', type: 'container', title: 'Health Outcome Metrics', isStatic: true, gridColumn: 1, gridRow: 1, gridWidth: 12, gridHeight: 2 },
    { id: 'bp-improvement', type: 'gauge-chart', title: 'Blood Pressure Control', isStatic: true, isFromSchema: true, gridColumn: 1, gridRow: 3, gridWidth: 4, gridHeight: 3 },
    { id: 'a1c-improvement', type: 'gauge-chart', title: 'A1C Control', isStatic: true, isFromSchema: true, gridColumn: 5, gridRow: 3, gridWidth: 4, gridHeight: 3 },
    { id: 'weight-improvement', type: 'gauge-chart', title: 'Weight Management', isStatic: true, gridColumn: 9, gridRow: 3, gridWidth: 4, gridHeight: 3 },
  ],
  stories: [],
  opportunities: [],
  initiatives: [],
};

// ============================================================
// PAGE LAYOUT DESIGNER TAB COMPONENT
// ============================================================

function PageLayoutDesignerTab({ clientId }) {
  const { customization } = useCustomization();
  const [selectedPage, setSelectedPage] = useState('overview');
  const [allWidgets, setAllWidgets] = useState([]);
  const [pageLayouts, setPageLayouts] = useState({});
  const [loading, setLoading] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState(null);
  const [gridDensity, setGridDensity] = useState('normal');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const availablePages = customization.navigation.tabs;

  useEffect(() => {
    loadLayoutData();
    loadAllWidgets();
  }, [clientId]);

  const loadLayoutData = async () => {
    setLoading(true);
    const layouts = await pageLayoutDB.getAllLayouts(clientId);
    const layoutMap = {};
    layouts.forEach(l => { layoutMap[l.page_id] = l; });
    setPageLayouts(layoutMap);
    setLoading(false);
  };

  const loadAllWidgets = async () => {
    const allClientWidgets = await widgetConfigDB.getAllWidgetConfigs(clientId);
    setAllWidgets(allClientWidgets);
  };

  const dynamicWidgets = allWidgets.filter(w => w.page_id === selectedPage);
  const staticElementsBase = PAGE_ELEMENTS_REGISTRY[selectedPage] || [];

  // Merge static elements with saved positions from layout config
  const currentLayout = pageLayouts[selectedPage];
  const savedStaticPositions = currentLayout?.layout_config?.staticElements || {};

  const staticElements = staticElementsBase.map(el => {
    const savedPosition = savedStaticPositions[el.id];
    if (savedPosition) {
      return {
        ...el,
        gridColumn: savedPosition.gridColumn,
        gridRow: savedPosition.gridRow,
        gridWidth: savedPosition.gridWidth,
        gridHeight: savedPosition.gridHeight
      };
    }
    return el;
  });

  const allElements = [
    ...staticElements.map(el => ({ ...el, isDynamic: false })),
    ...dynamicWidgets.map(w => ({ ...w, isDynamic: true }))
  ];

  const refreshWidgets = () => {
    loadAllWidgets();
  };

  const handleDragStart = (widget) => {
    setIsDragging(true);
    setDraggedWidget(widget);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedWidget(null);
  };

  const handleDrop = async (targetRow, targetCol) => {
    if (!draggedWidget) return;

    if (draggedWidget.isDynamic) {
      // Handle dynamic widget
      await widgetConfigDB.updateWidgetConfig(draggedWidget.id, { grid_row: targetRow, grid_column: targetCol });
      refreshWidgets();
    } else {
      // Handle static element - save to layout config
      const updatedStaticPositions = {
        ...savedStaticPositions,
        [draggedWidget.id]: {
          gridColumn: targetCol,
          gridRow: targetRow,
          gridWidth: draggedWidget.gridWidth || draggedWidget.grid_width,
          gridHeight: draggedWidget.gridHeight || draggedWidget.grid_height
        }
      };
      const layoutConfig = { staticElements: updatedStaticPositions };
      await pageLayoutDB.saveLayout({
        client_id: clientId,
        page_id: selectedPage,
        layout_config: layoutConfig,
        grid_density: gridDensity
      });
      await loadLayoutData();
    }

    setHasUnsavedChanges(true);
    handleDragEnd();
  };

  const handleResizeWidget = async (widget, newWidth, newHeight) => {
    if (widget.isDynamic) {
      // Handle dynamic widget
      await widgetConfigDB.updateWidgetConfig(widget.id, { grid_width: newWidth, grid_height: newHeight });
      refreshWidgets();
    } else {
      // Handle static element - save to layout config
      const updatedStaticPositions = {
        ...savedStaticPositions,
        [widget.id]: {
          gridColumn: widget.gridColumn || widget.grid_column,
          gridRow: widget.gridRow || widget.grid_row,
          gridWidth: newWidth,
          gridHeight: newHeight
        }
      };
      const layoutConfig = { staticElements: updatedStaticPositions };
      await pageLayoutDB.saveLayout({
        client_id: clientId,
        page_id: selectedPage,
        layout_config: layoutConfig,
        grid_density: gridDensity
      });
      await loadLayoutData();
    }

    setHasUnsavedChanges(true);
  };

  const handleToggleWidget = async (widget) => {
    await widgetConfigDB.updateWidgetConfig(widget.id, { enabled: !widget.enabled });
    refreshWidgets();
  };

  const handleSaveLayout = async () => {
    const layoutConfig = { widgets: widgets.map(w => ({ id: w.id, grid_row: w.grid_row, grid_column: w.grid_column, grid_width: w.grid_width, grid_height: w.grid_height })) };
    await pageLayoutDB.saveLayout({ client_id: clientId, page_id: selectedPage, layout_config: layoutConfig, grid_density: gridDensity });
    setHasUnsavedChanges(false);
  };

  const getWidgetTypeIcon = (typeId) => {
    const iconMap = {
      'pie-chart': PieChart,
      'donut-chart': PieChart,
      'bar-chart': BarChart2,
      'horizontal-bar': BarChart2,
      'area-chart': TrendingUp,
      'line-chart': TrendingUp,
      'gauge-chart': Target,
      'kpi-card': Star,
      'funnel-chart': TrendingUp,
      'container': Grid,
      'summary-card': FileText,
      'campaign-card': MessageSquare
    };
    return iconMap[typeId] || BarChart2;
  };

  const gridRows = Math.max(8, ...allElements.map(el => (el.gridRow || el.grid_row || 1) + (el.gridHeight || el.grid_height || 4)));

  if (loading) {
    return (
      <div className="layout-designer-loading">
        <RefreshCw size={24} className="spin" />
        <p>Loading layout designer...</p>
      </div>
    );
  }

  return (
    <div className="page-layout-designer">
      <div className="layout-designer-header">
        {hasUnsavedChanges && (
          <div className="unsaved-banner">
            <AlertCircle size={16} /> Unsaved changes
            <button className="save-changes-btn" onClick={handleSaveLayout}><Save size={14} /> Save Layout</button>
          </div>
        )}
      </div>

      <div className="layout-designer-content">
        <div className="layout-sidebar">
          <h3>Pages</h3>
          <div className="page-list">
            {availablePages.map(page => {
              const pageDynamicWidgets = allWidgets.filter(w => w.page_id === page.id && w.enabled).length;
              const pageStaticElements = (PAGE_ELEMENTS_REGISTRY[page.id] || []).length;
              const totalElements = pageDynamicWidgets + pageStaticElements;
              const IconComponent = page.icon ? (typeof page.icon === 'string' ? { LayoutDashboard, Users, DollarSign, Heart, MessageSquare, Lightbulb, TrendingUp }[page.icon] : page.icon) : LayoutDashboard;
              return (
                <button key={page.id} className={`page-item ${selectedPage === page.id ? 'active' : ''}`} onClick={() => setSelectedPage(page.id)}>
                  {IconComponent && <IconComponent size={16} />}
                  <span className="page-name">{page.label}</span>
                  <span className="page-widget-count">{totalElements}</span>
                </button>
              );
            })}
          </div>

          <div className="layout-options">
            <h4>Grid Density</h4>
            <div className="density-options">
              {['compact', 'normal', 'spacious'].map(density => (
                <button key={density} className={`density-btn ${gridDensity === density ? 'active' : ''}`} onClick={() => setGridDensity(density)}>
                  {density.charAt(0).toUpperCase() + density.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="layout-grid-container">
          <div className="layout-grid-header">
            <h3>{availablePages.find(p => p.id === selectedPage)?.label || selectedPage} Layout</h3>
            <div className="grid-actions">
              <button className="secondary-btn sm" onClick={refreshWidgets}><RefreshCw size={14} /> Refresh</button>
            </div>
          </div>

          <div className={`layout-grid density-${gridDensity}`}>
            <div className="grid-columns-indicator">
              {[...Array(12)].map((_, i) => (
                <div key={i} className="col-indicator">{i + 1}</div>
              ))}
            </div>

            <div className="grid-area" style={{ gridTemplateRows: `repeat(${gridRows}, minmax(60px, auto))` }}>
              {allElements.map((element) => {
                const isStatic = !element.isDynamic;
                const IconComponent = getWidgetTypeIcon(element.widget_type || element.type);
                const gridColumn = element.gridColumn || element.grid_column || 1;
                const gridWidth = element.gridWidth || element.grid_width || 6;
                const gridRow = element.gridRow || element.grid_row || 1;
                const gridHeight = element.gridHeight || element.grid_height || 4;
                const title = element.title;
                const enabled = element.enabled !== false;

                return (
                  <div
                    key={element.id}
                    className={`grid-widget ${isStatic ? 'static' : 'dynamic'} ${!enabled ? 'disabled' : ''} ${draggedWidget?.id === element.id ? 'dragging' : ''}`}
                    style={{ gridColumn: `${gridColumn} / span ${gridWidth}`, gridRow: `${gridRow} / span ${gridHeight}` }}
                    draggable={true}
                    onDragStart={() => handleDragStart(element)}
                    onDragEnd={handleDragEnd}
                    title={element.description || title}
                  >
                    <div className="widget-drag-handle"><GripVertical size={14} /></div>
                    <div className="widget-preview-content">
                      <IconComponent size={20} />
                      <span className="widget-title">{title || 'Untitled'}</span>
                      {element.isFromSchema && <span className="element-badge schema">Schema</span>}
                      {isStatic && !element.isFromSchema && <span className="element-badge static">Static</span>}
                      {!isStatic && <span className="element-badge custom">Custom</span>}
                    </div>
                    <div className="widget-controls">
                      {!isStatic && (
                        <button className="widget-ctrl-btn" onClick={() => handleToggleWidget(element)} title={enabled ? 'Disable' : 'Enable'}>
                          {enabled ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                      )}
                      <button className="widget-ctrl-btn" onClick={() => handleResizeWidget(element, (element.gridWidth || element.grid_width) === 12 ? 6 : 12, element.gridHeight || element.grid_height)} title="Toggle Width">
                        {(element.gridWidth || element.grid_width) === 12 ? <Minimize2 size={12} /> : <Maximize2 size={12} />}
                      </button>
                    </div>
                    <div className="widget-resize-handle" />
                  </div>
                );
              })}

              {allElements.length === 0 && (
                <div className="empty-grid-message">
                  <Grid size={32} />
                  <p>No elements on this page yet</p>
                  <span>Add widgets from the Widget Library tab</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="available-widgets-sidebar">
          <h3>Page Elements</h3>
          <p className="sidebar-hint">{allElements.length} total element{allElements.length !== 1 ? 's' : ''} ({staticElements.length} static, {dynamicWidgets.length} custom)</p>

          <div className="available-widgets-list">
            {staticElements.length > 0 && (
              <>
                <div className="element-group-header">
                  <Layers size={14} />
                  <span>Static Elements</span>
                </div>
                {staticElements.map(element => {
                  const IconComponent = getWidgetTypeIcon(element.type);
                  return (
                    <div key={element.id} className="available-widget-item static-element" title={element.description || element.title}>
                      <IconComponent size={16} />
                      <span>{element.title}</span>
                      {element.isFromSchema && <span className="mini-badge">Schema</span>}
                    </div>
                  );
                })}
              </>
            )}

            {dynamicWidgets.length > 0 && (
              <>
                <div className="element-group-header" style={{ marginTop: staticElements.length > 0 ? '16px' : '0' }}>
                  <Grid size={14} />
                  <span>Custom Widgets</span>
                </div>
                {dynamicWidgets.map(widget => {
                  const IconComponent = getWidgetTypeIcon(widget.widget_type);
                  return (
                    <div key={widget.id} className={`available-widget-item ${!widget.enabled ? 'disabled' : ''}`} title={widget.enabled ? widget.title : `${widget.title} (disabled)`}>
                      <IconComponent size={16} />
                      <span>{widget.title || 'Untitled'}</span>
                      {!widget.enabled && <EyeOff size={12} style={{ marginLeft: 'auto', opacity: 0.5 }} />}
                    </div>
                  );
                })}
              </>
            )}

            {allElements.length === 0 && (
              <div style={{ padding: '20px 0', textAlign: 'center', color: 'var(--slate-400)', fontSize: '13px' }}>
                No elements on this page yet. Add widgets from the Widget Library tab.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// DASHBOARD EDIT MODE COMPONENTS
// ============================================================

function EditModeToolbar({ pageId }) {
  const { hasUnsavedChanges, isSaving, saveCurrentLayout, exitEditMode, cancelEditMode, resetLayout, compactLayout, undo, redo, canUndo, canRedo } = useDashboardEdit();
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showCompactTooltip, setShowCompactTooltip] = useState(false);

  const handleSave = async () => {
    const result = await saveCurrentLayout();
    if (result.success) {
      exitEditMode();
    }
  };

  const handleReset = () => {
    resetLayout(pageId);
    setShowResetConfirm(false);
  };

  const handleCompact = () => {
    compactLayout(pageId);
  };

  const handleCancel = () => {
    cancelEditMode(pageId);
  };

  const handleUndo = () => {
    undo(pageId);
  };

  const handleRedo = () => {
    redo(pageId);
  };

  return (
    <div className="edit-mode-header">
      <h3>
        <Settings size={18} />
        Editing Dashboard Layout
      </h3>
      <div className="edit-mode-actions">
        {hasUnsavedChanges && (
          <div className="unsaved-indicator">
            <AlertCircle size={14} />
            Unsaved changes
          </div>
        )}
        <button
          className="edit-mode-btn secondary"
          onClick={handleUndo}
          disabled={!canUndo(pageId)}
          title="Undo last change"
        >
          <RotateCcw size={14} />
          Undo
        </button>
        <button
          className="edit-mode-btn secondary"
          onClick={handleRedo}
          disabled={!canRedo(pageId)}
          title="Redo last undone change"
        >
          <RefreshCw size={14} />
          Redo
        </button>
        <div
          className="compact-layout-wrapper"
          onMouseEnter={() => setShowCompactTooltip(true)}
          onMouseLeave={() => setShowCompactTooltip(false)}
        >
          <button
            className="edit-mode-btn secondary"
            onClick={handleCompact}
          >
            <Layers size={14} />
            Compact Layout
            <HelpCircle size={12} style={{ marginLeft: '4px', opacity: 0.6 }} />
          </button>
          {showCompactTooltip && (
            <div className="compact-tooltip">
              <strong>Compact Layout</strong>
              <p>Automatically removes gaps and arranges all widgets in a tight, organized layout with consistent spacing.</p>
            </div>
          )}
        </div>
        <button
          className="edit-mode-btn secondary"
          onClick={() => setShowResetConfirm(true)}
          title="Reset to default layout"
        >
          <RotateCcw size={14} />
          Reset
        </button>
        <button
          className="edit-mode-btn secondary"
          onClick={handleCancel}
        >
          <X size={14} />
          Cancel
        </button>
        <button
          className="edit-mode-btn primary"
          onClick={handleSave}
          disabled={isSaving}
        >
          {isSaving ? <RefreshCw size={14} className="spin" /> : <Save size={14} />}
          {isSaving ? 'Saving...' : 'Save Layout'}
        </button>
      </div>
      {showResetConfirm && (
        <div className="modal-overlay" onClick={() => setShowResetConfirm(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>Reset Layout?</h3>
            <p>This will reset all widget positions to their defaults. This cannot be undone.</p>
            <div className="modal-actions">
              <button className="secondary-btn" onClick={() => setShowResetConfirm(false)}>Cancel</button>
              <button className="primary-btn danger" onClick={handleReset}>Reset Layout</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DragOverlay({ children, position }) {
  if (!position) return null;

  return ReactDOM.createPortal(
    <div
      className="drag-overlay"
      style={{
        left: position.x,
        top: position.y,
        width: position.width,
        height: position.height
      }}
    >
      {children}
    </div>,
    document.body
  );
}

function EditableWidget({ children, widgetId, pageId, defaultPosition, className = '', onRegisterRef }) {
  const {
    isEditMode,
    getWidgetPosition,
    draggedWidget,
    dragCommitted,
    resizingWidget,
    setResizingWidget,
    resizeWidget,
    startDrag,
    moveWidgetUp,
    moveWidgetDown
  } = useDashboardEdit();

  const widgetRef = useRef(null);
  const [resizeStart, setResizeStart] = useState(null);

  const position = getWidgetPosition(pageId, widgetId, defaultPosition);
  const isBeingDragged = draggedWidget?.id === widgetId;
  const isBeingResized = resizingWidget === widgetId;
  const showAsDragSource = isBeingDragged && dragCommitted;

  const gridColumn = position.gridColumn || defaultPosition.gridColumn || 1;
  const gridRow = position.gridRow || defaultPosition.gridRow || 1;
  const gridWidth = position.gridWidth || defaultPosition.gridWidth || 6;
  const gridHeight = position.gridHeight || defaultPosition.gridHeight || 1;

  useEffect(() => {
    if (onRegisterRef && widgetRef.current) {
      onRegisterRef(widgetId, widgetRef.current);
    }
  }, [widgetId, onRegisterRef]);

  const handlePointerDown = (e) => {
    if (!isEditMode || isBeingResized) return;
    if (e.target.closest('.resize-handle')) {
      return;
    }
    if (e.target.closest('.widget-move-btn')) {
      return;
    }
    if (e.button !== 0) return;

    e.preventDefault();
    const rect = widgetRef.current.getBoundingClientRect();

    startDrag(
      {
        id: widgetId,
        gridColumn,
        gridRow,
        gridWidth,
        gridHeight
      },
      e.clientX,
      e.clientY,
      rect
    );
  };

  const handleResizeStart = (e, direction) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingWidget(widgetId);
    setResizeStart({
      startX: e.clientX,
      startY: e.clientY,
      startWidth: gridWidth,
      startHeight: gridHeight,
      direction
    });
  };

  const handleResizeMove = (e) => {
    if (!resizeStart || !isBeingResized) return;

    const deltaX = e.clientX - resizeStart.startX;
    const deltaY = e.clientY - resizeStart.startY;

    const gridRect = widgetRef.current?.parentElement?.getBoundingClientRect();
    if (!gridRect) return;

    const columnWidth = gridRect.width / 12;
    const deltaColumns = Math.round(deltaX / columnWidth);
    const deltaRows = Math.round(deltaY / 80);

    let newWidth = resizeStart.startWidth;
    let newHeight = resizeStart.startHeight;

    if (resizeStart.direction.includes('e')) {
      newWidth = Math.max(2, Math.min(12 - gridColumn + 1, resizeStart.startWidth + deltaColumns));
    }
    if (resizeStart.direction.includes('s')) {
      newHeight = Math.max(1, resizeStart.startHeight + deltaRows);
    }
    if (resizeStart.direction.includes('w')) {
      newWidth = Math.max(2, resizeStart.startWidth - deltaColumns);
    }
    if (resizeStart.direction.includes('n')) {
      newHeight = Math.max(1, resizeStart.startHeight - deltaRows);
    }

    if (newWidth !== gridWidth || newHeight !== gridHeight) {
      resizeWidget(pageId, widgetId, newWidth, newHeight);
    }
  };

  const handleResizeEnd = () => {
    setResizingWidget(null);
    setResizeStart(null);
  };

  useEffect(() => {
    if (isBeingResized) {
      const handleMouseMove = (e) => handleResizeMove(e);
      const handleMouseUp = () => handleResizeEnd();

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isBeingResized, resizeStart]);

  const gridStyle = {
    gridColumn: `${gridColumn} / span ${gridWidth}`,
    gridRow: `${gridRow} / span ${gridHeight}`
  };

  if (!isEditMode) {
    return (
      <div className={`editable-widget ${className}`} style={gridStyle}>
        {children}
      </div>
    );
  }

  const widgetClasses = [
    'editable-widget',
    className,
    showAsDragSource ? 'widget-drag-source' : '',
    isBeingResized ? 'resizing' : ''
  ].filter(Boolean).join(' ');

  return (
    <div
      ref={widgetRef}
      className={widgetClasses}
      style={gridStyle}
      onPointerDown={handlePointerDown}
    >
      <div className="widget-drag-handle-corner">
        <GripVertical size={14} />
      </div>

      <div className="widget-movement-controls">
        <button
          className="widget-move-btn"
          onClick={(e) => {
            e.stopPropagation();
            moveWidgetUp(pageId, widgetId);
          }}
          title="Move widget up"
        >
          <ChevronUp size={14} />
        </button>
        <button
          className="widget-move-btn"
          onClick={(e) => {
            e.stopPropagation();
            moveWidgetDown(pageId, widgetId);
          }}
          title="Move widget down"
        >
          <ChevronDown size={14} />
        </button>
      </div>

      <div className="resize-handle resize-handle-n" onMouseDown={(e) => handleResizeStart(e, 'n')} />
      <div className="resize-handle resize-handle-s" onMouseDown={(e) => handleResizeStart(e, 's')} />
      <div className="resize-handle resize-handle-e" onMouseDown={(e) => handleResizeStart(e, 'e')} />
      <div className="resize-handle resize-handle-w" onMouseDown={(e) => handleResizeStart(e, 'w')} />
      <div className="resize-handle resize-handle-ne" onMouseDown={(e) => handleResizeStart(e, 'ne')} />
      <div className="resize-handle resize-handle-nw" onMouseDown={(e) => handleResizeStart(e, 'nw')} />
      <div className="resize-handle resize-handle-se" onMouseDown={(e) => handleResizeStart(e, 'se')} />
      <div className="resize-handle resize-handle-sw" onMouseDown={(e) => handleResizeStart(e, 'sw')} />

      <div className="widget-info-badge">
        {gridWidth} × {gridHeight}
      </div>

      <div className="widget-edit-overlay" />
      <div className="widget-content-wrapper edit-mode-active">
        {children}
      </div>
    </div>
  );
}

function EditableGrid({ children, pageId, onReorder }) {
  const {
    isEditMode,
    needsPositionInit,
    draggedWidget,
    dragCommitted,
    dragOverlayPosition,
    getWidgetPosition,
    moveWidget,
    setDropTarget,
    dropTarget,
    widgetPositions,
    widgetOrder,
    setWidgetOrder,
    setPreviewPositions,
    initializeWidgetOrder,
    calculateReflowLayout,
    getWidgetSizesMap,
    detectInsertionIndex,
    setDisplacedWidgets,
    setInsertionIndex,
    GRID_COLUMNS,
    updateDrag,
    endDrag,
    lastCrossedCenterRef,
    initializeWidgetPositionsFromDefaults,
    completeEditModeInitialization,
    currentPage
  } = useDashboardEdit();

  const gridRef = useRef(null);
  const widgetRefsMap = useRef(new Map());
  const previousRectsRef = useRef({});
  const [hoveredCell, setHoveredCell] = useState(null);
  const lastInsertionIndexRef = useRef(null);
  const rafIdRef = useRef(null);
  const [draggedContent, setDraggedContent] = useState(null);

  const registerWidgetRef = useCallback((widgetId, element) => {
    if (element) {
      widgetRefsMap.current.set(widgetId, element);
    } else {
      widgetRefsMap.current.delete(widgetId);
    }
  }, []);

  const collectAllEditableWidgets = useCallback((children) => {
    const widgets = [];

    const traverse = (child) => {
      if (!child) return;

      if (child.type === EditableWidget) {
        widgets.push(child);
      } else if (child.props && child.props.children) {
        React.Children.forEach(child.props.children, traverse);
      }
    };

    React.Children.forEach(children, traverse);
    return widgets;
  }, []);

  const allWidgetPositions = React.useMemo(() => {
    const positions = {};
    const allWidgets = collectAllEditableWidgets(children);

    allWidgets.forEach((child) => {
      const widgetId = child.props.widgetId;
      const defaultPos = child.props.defaultPosition || {};
      const currentPos = getWidgetPosition(pageId, widgetId, defaultPos);
      positions[widgetId] = {
        gridColumn: currentPos.gridColumn || defaultPos.gridColumn || 1,
        gridRow: currentPos.gridRow || defaultPos.gridRow || 1,
        gridWidth: currentPos.gridWidth || defaultPos.gridWidth || 6,
        gridHeight: currentPos.gridHeight || defaultPos.gridHeight || 1,
        order: defaultPos.order ?? 999
      };
    });
    return positions;
  }, [children, pageId, getWidgetPosition, collectAllEditableWidgets]);

  useEffect(() => {
    if (needsPositionInit && currentPage === pageId && allWidgetPositions) {
      console.debug(`[PrysmCS] EditableGrid initializing positions for page ${pageId}`);
      initializeWidgetPositionsFromDefaults(pageId, allWidgetPositions);
      completeEditModeInitialization();
    }
  }, [needsPositionInit, currentPage, pageId, allWidgetPositions, initializeWidgetPositionsFromDefaults, completeEditModeInitialization]);

  const captureCurrentRects = useCallback(() => {
    const rects = {};
    widgetRefsMap.current.forEach((el, id) => {
      if (el) {
        rects[id] = el.getBoundingClientRect();
      }
    });
    return rects;
  }, []);

  const animateFLIP = useCallback((oldRects, newRects, excludeWidgetId) => {
    widgetRefsMap.current.forEach((el, id) => {
      if (id === excludeWidgetId || !oldRects[id] || !newRects[id]) return;

      const oldRect = oldRects[id];
      const newRect = newRects[id];

      const deltaX = oldRect.left - newRect.left;
      const deltaY = oldRect.top - newRect.top;

      if (Math.abs(deltaX) < 1 && Math.abs(deltaY) < 1) return;

      el.classList.remove('widget-animating');
      el.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.classList.add('widget-animating');
          el.style.transform = 'translate(0, 0)';

          const handleTransitionEnd = () => {
            el.classList.remove('widget-animating');
            el.style.transform = '';
            el.removeEventListener('transitionend', handleTransitionEnd);
          };
          el.addEventListener('transitionend', handleTransitionEnd, { once: true });
        });
      });
    });
  }, []);

  const updateDragPreview = useCallback((mouseX, mouseY, gridRect) => {
    let currentOrder = widgetOrder[pageId];
    if (!currentOrder || currentOrder.length === 0) {
      currentOrder = initializeWidgetOrder(pageId, allWidgetPositions);
      setWidgetOrder(prev => ({ ...prev, [pageId]: currentOrder }));
    }

    const columnWidth = gridRect.width / GRID_COLUMNS;
    const rowHeight = 80;

    let targetWidget = null;
    let minDistance = Infinity;
    const HYSTERESIS = 20;

    currentOrder.forEach(widgetId => {
      if (widgetId === draggedWidget?.id) return;

      const pos = allWidgetPositions[widgetId];
      if (!pos) return;

      const widgetLeft = (pos.gridColumn - 1) * columnWidth;
      const widgetTop = (pos.gridRow - 1) * rowHeight;
      const widgetRight = widgetLeft + pos.gridWidth * columnWidth;
      const widgetBottom = widgetTop + pos.gridHeight * rowHeight;

      const isInsideX = mouseX >= widgetLeft && mouseX <= widgetRight;
      const isInsideY = mouseY >= widgetTop && mouseY <= widgetBottom;

      if (isInsideX && isInsideY) {
        const centerX = (widgetLeft + widgetRight) / 2;
        const centerY = (widgetTop + widgetBottom) / 2;
        const distance = Math.sqrt(Math.pow(mouseX - centerX, 2) + Math.pow(mouseY - centerY, 2));

        if (distance < minDistance) {
          minDistance = distance;
          targetWidget = {
            widgetId,
            pos,
            left: widgetLeft,
            right: widgetRight,
            top: widgetTop,
            bottom: widgetBottom,
            centerX,
            centerY
          };
        }
      }
    });

    if (!targetWidget) {
      return;
    }

    const lastCrossed = lastCrossedCenterRef.current;
    const crossedCenterX = mouseX > targetWidget.centerX;

    if (lastCrossed?.widgetId === targetWidget.widgetId) {
      const distanceFromCenter = Math.abs(mouseX - targetWidget.centerX);
      if (distanceFromCenter < HYSTERESIS && lastCrossed.direction === crossedCenterX) {
        return;
      }
    }

    lastCrossedCenterRef.current = { widgetId: targetWidget.widgetId, direction: crossedCenterX };

    const currentIndex = currentOrder.indexOf(draggedWidget.id);
    const targetIndex = currentOrder.indexOf(targetWidget.widgetId);

    let newInsertionIndex;
    if (crossedCenterX) {
      newInsertionIndex = targetIndex + 1;
    } else {
      newInsertionIndex = targetIndex;
    }

    if (currentIndex !== -1 && currentIndex < newInsertionIndex) {
      newInsertionIndex--;
    }

    newInsertionIndex = Math.max(0, Math.min(newInsertionIndex, currentOrder.length));

    if (lastInsertionIndexRef.current === newInsertionIndex) {
      return;
    }

    const oldRects = captureCurrentRects();

    lastInsertionIndexRef.current = newInsertionIndex;

    const newOrder = currentOrder.filter(id => id !== draggedWidget.id);
    newOrder.splice(newInsertionIndex, 0, draggedWidget.id);

    const draggedWidgetPos = allWidgetPositions[draggedWidget.id];
    const currentDraggedRow = draggedWidgetPos?.gridRow;

    const affectedWidgetsInSameRow = newOrder.filter(id => {
      const pos = allWidgetPositions[id];
      return pos && pos.gridRow === currentDraggedRow;
    });

    const isSameRowMove = affectedWidgetsInSameRow.includes(draggedWidget.id) &&
                          affectedWidgetsInSameRow.length > 1 &&
                          targetWidget &&
                          allWidgetPositions[targetWidget.widgetId]?.gridRow === currentDraggedRow;

    let reflowedPositions;

    if (isSameRowMove) {
      reflowedPositions = { ...allWidgetPositions };

      const rowWidgets = newOrder.filter(id => {
        const pos = allWidgetPositions[id];
        return pos && pos.gridRow === currentDraggedRow;
      });

      let currentColumn = 1;
      rowWidgets.forEach(widgetId => {
        const widgetSize = allWidgetPositions[widgetId];
        reflowedPositions[widgetId] = {
          ...widgetSize,
          gridColumn: currentColumn,
          gridRow: currentDraggedRow
        };
        currentColumn += widgetSize.gridWidth;
      });
    } else {
      const widgetSizes = getWidgetSizesMap(pageId, allWidgetPositions);
      const newPositions = calculateReflowLayout(newOrder, widgetSizes, GRID_COLUMNS);
      reflowedPositions = { ...allWidgetPositions, ...newPositions };
    }

    setPreviewPositions({
      [pageId]: reflowedPositions
    });

    const displaced = newOrder.filter(id => id !== draggedWidget.id);
    setDisplacedWidgets(displaced);
    setInsertionIndex(newInsertionIndex);

    const draggedPos = reflowedPositions[draggedWidget.id];
    if (draggedPos) {
      setHoveredCell({
        row: draggedPos.gridRow,
        column: draggedPos.gridColumn,
        width: draggedPos.gridWidth,
        height: draggedPos.gridHeight
      });
      setDropTarget({ row: draggedPos.gridRow, column: draggedPos.gridColumn });
    }

    requestAnimationFrame(() => {
      const newRects = captureCurrentRects();
      animateFLIP(oldRects, newRects, draggedWidget.id);
    });
  }, [pageId, widgetOrder, allWidgetPositions, draggedWidget, initializeWidgetOrder, setWidgetOrder, getWidgetSizesMap, calculateReflowLayout, GRID_COLUMNS, setPreviewPositions, setDisplacedWidgets, setInsertionIndex, setDropTarget, captureCurrentRects, animateFLIP, lastCrossedCenterRef]);

  useEffect(() => {
    if (!draggedWidget || !isEditMode) return;

    const draggedChild = React.Children.toArray(children).find(
      child => child && child.type === EditableWidget && child.props.widgetId === draggedWidget.id
    );
    if (draggedChild) {
      setDraggedContent(draggedChild.props.children);
    }

    return () => {
      setDraggedContent(null);
    };
  }, [draggedWidget, isEditMode, children]);

  useEffect(() => {
    if (!draggedWidget || !isEditMode) return;

    const handlePointerMove = (e) => {
      const isCommitted = updateDrag(e.clientX, e.clientY);

      if (isCommitted) {
        const gridRect = gridRef.current?.getBoundingClientRect();
        if (!gridRect) return;

        const mouseX = e.clientX - gridRect.left;
        const mouseY = e.clientY - gridRect.top;

        if (rafIdRef.current) {
          cancelAnimationFrame(rafIdRef.current);
        }

        rafIdRef.current = requestAnimationFrame(() => {
          updateDragPreview(mouseX, mouseY, gridRect);
        });
      }
    };

    const handlePointerUp = () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }

      const wasCommitted = endDrag();

      if (wasCommitted && lastInsertionIndexRef.current !== null) {
        const localAllWidgetPositions = {};
        const allWidgets = collectAllEditableWidgets(children);

        allWidgets.forEach((child) => {
          const widgetId = child.props.widgetId;
          const defaultPos = child.props.defaultPosition || {};
          const currentPos = getWidgetPosition(pageId, widgetId, defaultPos);
          localAllWidgetPositions[widgetId] = {
            gridColumn: currentPos.gridColumn || defaultPos.gridColumn || 1,
            gridRow: currentPos.gridRow || defaultPos.gridRow || 1,
            gridWidth: currentPos.gridWidth || defaultPos.gridWidth || 6,
            gridHeight: currentPos.gridHeight || defaultPos.gridHeight || 1,
            order: defaultPos.order ?? 999
          };
        });

        let currentOrder = widgetOrder[pageId];
        if (!currentOrder || currentOrder.length === 0) {
          currentOrder = initializeWidgetOrder(pageId, localAllWidgetPositions);
        }

        const newOrder = currentOrder.filter(id => id !== draggedWidget.id);
        const insertIndex = lastInsertionIndexRef.current ?? newOrder.length;
        newOrder.splice(insertIndex, 0, draggedWidget.id);

        moveWidget(pageId, draggedWidget.id, newOrder, localAllWidgetPositions);
      }

      setHoveredCell(null);
      lastInsertionIndexRef.current = null;
    };

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [draggedWidget, isEditMode, updateDrag, endDrag, updateDragPreview, moveWidget, pageId, widgetOrder, initializeWidgetOrder, getWidgetPosition, children, collectAllEditableWidgets]);

  useEffect(() => {
    return () => {
      if (rafIdRef.current) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, []);

  const enhancedChildren = React.useMemo(() => {
    return React.Children.map(children, (child) => {
      if (child && child.type === EditableWidget) {
        return React.cloneElement(child, {
          onRegisterRef: registerWidgetRef
        });
      }
      return child;
    });
  }, [children, registerWidgetRef]);

  return (
    <>
      <div
        ref={gridRef}
        className="editable-grid"
        style={{ touchAction: isEditMode && draggedWidget ? 'none' : 'auto' }}
      >
        {isEditMode && hoveredCell && (
          <div
            className="drop-zone-indicator active"
            style={{
              gridColumn: `${hoveredCell.column} / span ${hoveredCell.width}`,
              gridRow: `${hoveredCell.row} / span ${hoveredCell.height}`,
              pointerEvents: 'none'
            }}
          />
        )}
        {enhancedChildren}
      </div>
      {dragCommitted && dragOverlayPosition && draggedContent && (
        <DragOverlay position={dragOverlayPosition}>
          <div style={{ width: '100%', height: '100%', overflow: 'hidden', borderRadius: '12px' }}>
            {draggedContent}
          </div>
        </DragOverlay>
      )}
    </>
  );
}

function DashboardEditToggle({ pageId }) {
  const { hasPermission } = useAuth();
  const { isEditMode, enterEditMode, exitEditMode, currentPage } = useDashboardEdit();

  if (!hasPermission('manage_customization') && !hasPermission('edit_data')) {
    return null;
  }

  const isCurrentPageEditMode = isEditMode && currentPage === pageId;

  const handleToggle = () => {
    if (isCurrentPageEditMode) {
      exitEditMode();
    } else {
      enterEditMode(pageId);
    }
  };

  return (
    <button
      className={`edit-toggle-btn ${isCurrentPageEditMode ? 'active' : ''}`}
      onClick={handleToggle}
      title={isCurrentPageEditMode ? 'Exit edit mode' : 'Edit dashboard layout'}
    >
      {isCurrentPageEditMode ? (
        <>
          <X size={16} />
          Exit Edit Mode
        </>
      ) : (
        <>
          <Pencil size={16} />
          Edit Dashboard
        </>
      )}
    </button>
  );
}

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
  'Calendar': Calendar,
  'Clock': Clock,
  'CheckCircle': CheckCircle,
  'Star': Star,
  'Lightbulb': Lightbulb,
};

// Single Field Renderer
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
}) {
  const { customization, FIELD_TYPES } = useCustomization();
  
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
}) {
  const { customization, FIELD_TYPES, createFieldDef } = useCustomization();
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [isEditingSubtitle, setIsEditingSubtitle] = useState(false);
  const [showAddFieldModal, setShowAddFieldModal] = useState(false);
  const [newFieldData, setNewFieldData] = useState({ id: '', label: '', fieldType: FIELD_TYPES.NUMBER, placeholder: '' });
  
  const IconComponent = FORM_ICON_MAP[section.icon] || FileText;
  const sortedFields = [...section.fields].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const handleAddField = () => {
    if (!newFieldData.id || !newFieldData.label) return;
    
    const newField = createFieldDef(newFieldData.id, {
      label: newFieldData.label,
      fieldType: newFieldData.fieldType,
      placeholder: newFieldData.placeholder,
    });
    onFieldAdd(section.id, newField);
    setNewFieldData({ id: '', label: '', fieldType: FIELD_TYPES.NUMBER, placeholder: '' });
    setShowAddFieldModal(false);
  };
  
  return (
    <div className={`form-section schema-section ${!section.enabled ? 'disabled' : ''}`}>
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
              onClick={() => showEditControls && section.titleEditable !== false && setIsEditingTitle(true)} 
              style={{ cursor: showEditControls && section.titleEditable !== false ? 'pointer' : 'default' }}
            >
              {section.title}
              {showEditControls && section.titleEditable !== false && <Edit3 size={14} style={{ opacity: 0.4, marginLeft: 4 }} />}
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
            className={`section-toggle ${section.enabled ? '' : 'hidden'}`}
            onClick={() => onSectionToggle(section.id)}
          >
            {section.enabled ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
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
          <div className="form-grid">
            {sortedFields.map(field => (
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
              />
            ))}
          </div>
          
          {showEditControls && section.canAddFields !== false && (
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
                      onChange={(e) => setNewFieldData(prev => ({ ...prev, fieldType: e.target.value }))}
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

// Main Schema Form Renderer
function SchemaFormRenderer({
  formData,
  onChange,
  showEditControls = true,
  onSchemaChange,
}) {
  const { 
    getFormSchema, 
    updateFormSection, 
    updateFormField,
    removeFieldFromSection,
    addFieldToSection,
    removeFormSection,
    addFormSection,
    reorderFormSections,
    createFormSection,
    FIELD_TYPES,
  } = useCustomization();
  
  const [editingFieldLabel, setEditingFieldLabel] = useState(null);
  const [showAddSectionModal, setShowAddSectionModal] = useState(false);
  const [newSectionData, setNewSectionData] = useState({ id: '', title: '', subtitle: '', icon: 'FileText' });
  
  const formSchema = getFormSchema();
  const sortedSections = [...formSchema.sections].sort((a, b) => (a.order || 0) - (b.order || 0));
  
  const handleSectionToggle = (sectionId) => {
    const section = formSchema.sections.find(s => s.id === sectionId);
    updateFormSection(sectionId, { enabled: !section?.enabled });
  };
  
  const handleAddSection = () => {
    if (!newSectionData.id || !newSectionData.title) return;
    
    const newSection = createFormSection(newSectionData.id, {
      title: newSectionData.title,
      subtitle: newSectionData.subtitle,
      icon: newSectionData.icon,
      fields: [],
    });
    addFormSection(newSection);
    setNewSectionData({ id: '', title: '', subtitle: '', icon: 'FileText' });
    setShowAddSectionModal(false);
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
        />
      ))}
      
      {showEditControls && formSchema.allowCustomSections !== false && (
        <div className="add-section-container">
          <button 
            type="button"
            className="add-section-btn"
            onClick={() => setShowAddSectionModal(true)}
          >
            <Plus size={18} /> Add Section
          </button>
        </div>
      )}
      
      {/* Add Section Modal */}
      {showAddSectionModal && (
        <div className="modal-overlay" onClick={() => setShowAddSectionModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '500px' }}>
            <div className="modal-header">
              <h3><Plus size={20} /> Add New Section</h3>
              <button className="modal-close" onClick={() => setShowAddSectionModal(false)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div className="form-group">
                  <label className="form-label">Section ID (unique)</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newSectionData.id}
                    onChange={(e) => setNewSectionData(prev => ({ ...prev, id: e.target.value.replace(/\s/g, '') }))}
                    placeholder="e.g., customSection1"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Title</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newSectionData.title}
                    onChange={(e) => setNewSectionData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="e.g., Custom Metrics"
                  />
                </div>
                <div className="form-group" style={{ gridColumn: '1 / -1' }}>
                  <label className="form-label">Subtitle</label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={newSectionData.subtitle}
                    onChange={(e) => setNewSectionData(prev => ({ ...prev, subtitle: e.target.value }))}
                    placeholder="e.g., Additional tracking metrics"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Icon</label>
                  <select 
                    className="form-input"
                    value={newSectionData.icon}
                    onChange={(e) => setNewSectionData(prev => ({ ...prev, icon: e.target.value }))}
                  >
                    <option value="FileText">Document</option>
                    <option value="LayoutDashboard">Dashboard</option>
                    <option value="Users">Users</option>
                    <option value="Heart">Heart</option>
                    <option value="DollarSign">Dollar</option>
                    <option value="Activity">Activity</option>
                    <option value="Target">Target</option>
                    <option value="Star">Star</option>
                    <option value="TrendingUp">Trending</option>
                    <option value="Mail">Mail</option>
                    <option value="MessageSquare">Message</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button className="btn-secondary" onClick={() => setShowAddSectionModal(false)}>Cancel</button>
              <button className="btn-primary" onClick={handleAddSection} disabled={!newSectionData.id || !newSectionData.title}>
                <Plus size={16} /> Add Section
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// ADMIN PAGE (Original - now uses SchemaFormRenderer for Monthly Data tab)
// ============================================================

function AdminPage({ formData, setFormData, stories, setStories, opportunities, setOpportunities, clientInfo, setClientInfo, onSave, onClientNameChange, isNewClient, onNewClientHandled }) {
  const { hasPermission } = useAuth();
  const canEditSensitiveData = hasPermission('edit_sensitive_data');
  
  // Start on 'client' tab if isNewClient is true
  const [activeTab, setActiveTab] = useState(isNewClient ? 'client' : 'monthly');
  const [localForm, setLocalForm] = useState(formData);
  const [localStories, setLocalStories] = useState(stories);
  const [localOpportunities, setLocalOpportunities] = useState(opportunities);
  const [localClientInfo, setLocalClientInfo] = useState(clientInfo);
  
  // Sync local state when props change (e.g., new client created)
  useEffect(() => {
    setLocalForm(formData);
  }, [formData]);
  
  useEffect(() => {
    setLocalStories(stories);
  }, [stories]);
  
  useEffect(() => {
    setLocalOpportunities(opportunities);
  }, [opportunities]);
  
  useEffect(() => {
    setLocalClientInfo(clientInfo);
  }, [clientInfo]);
  
  // Section visibility state - default to all visible
  const [sectionVisibility, setSectionVisibility] = useState(
    formData.sectionVisibility || {
      coreMetrics: true,
      enrollmentFunnel: true,
      campaignPerformance: true,
      smsCampaign: true,
      emailCampaign: true,
      mailerCampaign: true,
      patientOutcomes: true,
      stories: true,
      opportunities: true,
      enrollmentNotes: true,
    }
  );
  
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
  
  // Sync visibility, labels, subtitles, and field labels with localForm
  useEffect(() => {
    setLocalForm(prev => ({ ...prev, sectionVisibility, sectionLabels, sectionSubtitles, fieldLabels }));
  }, [sectionVisibility, sectionLabels, sectionSubtitles, fieldLabels]);
  
  const toggleSection = (section) => {
    setSectionVisibility(prev => ({ ...prev, [section]: !prev[section] }));
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

  const handleStoryChange = (id, field, value) => {
    setLocalStories(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
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

  const addStory = () => {
    const newId = Math.max(...localStories.map(s => s.id), 0) + 1;
    setLocalStories(prev => [...prev, { id: newId, title: '', quote: '', patientType: '' }]);
  };

  const removeStory = (id) => {
    setLocalStories(prev => prev.filter(s => s.id !== id));
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
      enrollmentSpecialists: [...prev.enrollmentSpecialists, { id: newId, name: '', email: '', phone: '' }]
    }));
  };

  const removeEnrollmentSpecialist = (id) => {
    setLocalClientInfo(prev => ({
      ...prev,
      enrollmentSpecialists: prev.enrollmentSpecialists.filter(e => e.id !== id)
    }));
  };

  const handleSave = () => {
    // Pass the data directly to save function - it will update both localStorage and state
    onSave(localForm, localStories, localOpportunities, localClientInfo);
  };

  return (
    <div className="admin-container">
      <div className="page-header">
        <h1 className="page-title">Dashboard Management</h1>
        <p className="page-subtitle">Configure dashboards, widgets, and data for {localClientInfo.clientName}</p>
      </div>

      {/* Tab Navigation */}
      <div className="tab-nav">
        <button
          className={`tab-btn ${activeTab === 'monthly' ? 'active' : ''}`}
          onClick={() => setActiveTab('monthly')}
        >
          <BarChart2 size={16} /> Monthly Metrics
        </button>
        <button
          className={`tab-btn ${activeTab === 'widgets' ? 'active' : ''}`}
          onClick={() => setActiveTab('widgets')}
        >
          <Grid size={16} /> Widget Library
        </button>
        <button
          className={`tab-btn ${activeTab === 'client' ? 'active' : ''}`}
          onClick={() => setActiveTab('client')}
        >
          <Building size={16} /> Client Information
        </button>
      </div>

      {activeTab === 'monthly' && (
        <>
          <div className="info-callout">
            <AlertCircle size={20} className="info-callout-icon" />
            <div className="info-callout-text">
              <strong>Fully Customizable:</strong> Click any section title, subtitle, or field label to edit it. Use the + buttons to add custom sections and fields. Toggle sections on/off to control what appears in reports. All changes are saved per-client and persist across sessions.
            </div>
          </div>

          {/* Schema-driven form renderer */}
          <SchemaFormRenderer
            formData={localForm}
            onChange={handleChange}
            showEditControls={canEditSensitiveData}
          />

          {/* Stories Section - kept separate as it has unique structure */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon amber"><MessageSquare size={20} /></div>
              <div className="form-section-header-content">
                <div className="form-section-title">
                  Success Stories & Feedback
                </div>
                <div className="form-section-subtitle">
                  Testimonials and positive feedback from participants
                </div>
              </div>
              <button 
                className={`section-toggle ${sectionVisibility.stories ? '' : 'hidden'}`}
                onClick={() => toggleSection('stories')}
              >
                {sectionVisibility.stories ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
              </button>
            </div>

            {sectionVisibility.stories ? (
              <div className="items-list">
                {localStories.map((story) => (
                  <div key={story.id} className="item-card">
                    <button className="remove-item-btn" onClick={() => removeStory(story.id)} title="Remove story"><X size={14} /></button>
                    <div className="form-group">
                      <label className="form-label">Quote/Testimonial</label>
                      <textarea className="form-textarea" rows={3} value={story.quote || ''} onChange={(e) => handleStoryChange(story.id, 'quote', e.target.value)} placeholder="Patient success story or positive feedback..." />
                    </div>
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Initials (anonymous)</label>
                        <input type="text" className="form-input" value={story.patientInitials || ''} onChange={(e) => handleStoryChange(story.id, 'patientInitials', e.target.value)} placeholder="e.g., J.S." />
                      </div>
                      <div className="form-group">
                        <label className="form-label">Condition/Context</label>
                        <input type="text" className="form-input" value={story.condition || ''} onChange={(e) => handleStoryChange(story.id, 'condition', e.target.value)} placeholder="e.g., Hypertension Management" />
                      </div>
                    </div>
                  </div>
                ))}
                <button className="add-item-btn" onClick={addStory}>+ Add Another Story</button>
              </div>
            ) : (
              <div className="section-disabled-notice"><EyeOff size={16} /> This section is hidden from reports</div>
            )}
          </div>

          {/* Opportunities Section - kept separate as it has unique structure */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon emerald"><Lightbulb size={20} /></div>
              <div className="form-section-header-content">
                <div className="form-section-title">
                  Opportunities & Next Steps
                </div>
                <div className="form-section-subtitle">
                  Action items and growth opportunities
                </div>
              </div>
              <button 
                className={`section-toggle ${sectionVisibility.opportunities ? '' : 'hidden'}`}
                onClick={() => toggleSection('opportunities')}
              >
                {sectionVisibility.opportunities ? <><Eye size={14} /> Visible</> : <><EyeOff size={14} /> Hidden</>}
              </button>
            </div>

            {sectionVisibility.opportunities ? (
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

      {activeTab === 'widgets' && (
        <WidgetLibraryTab clientId={localClientInfo.clientId || 'default'} />
      )}

      {activeTab === 'client' && (
        <>
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
                <label className="form-label">EMR System</label>
                <div className="form-hint"><HelpCircle size={12} /> Electronic Medical Records system used</div>
                <input type="text" className="form-input" value={localClientInfo.emrName || ''} onChange={(e) => handleClientChange('emrName', e.target.value)} placeholder="e.g., eClinicalWorks, Epic, Athena" />
              </div>
              <div className="form-group full-width">
                <label className="form-label">Hours of Operation</label>
                <input type="text" className="form-input" value={localClientInfo.hoursOfOperation || ''} onChange={(e) => handleClientChange('hoursOfOperation', e.target.value)} placeholder="e.g., Monday - Friday: 8:00 AM - 5:00 PM EST" />
              </div>
            </div>
          </div>

          {/* MED-KICK TEAM */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon emerald"><Users size={20} /></div>
              <div>
                <div className="form-section-title">Med-Kick Team Assigned</div>
                <div className="form-section-subtitle">Internal team members working with this client</div>
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

            {/* Care Management Coordinator */}
            <div className="team-member-card">
              <div className="team-avatar" style={{ background: 'linear-gradient(135deg, #2563eb, #3b82f6)' }}>{localClientInfo.careManagementCoordinator?.name?.charAt(0) || 'C'}</div>
              <div className="team-info" style={{ flex: 1 }}>
                <div className="team-role">Care Management Coordinator</div>
              </div>
            </div>
            <div className="form-grid" style={{ marginBottom: 24 }}>
              <div className="form-group">
                <label className="form-label">Coordinator Name</label>
                <input type="text" className="form-input" value={localClientInfo.careManagementCoordinator?.name || ''} onChange={(e) => handleClientChange('careManagementCoordinator', { ...localClientInfo.careManagementCoordinator, name: e.target.value })} placeholder="Coordinator name" />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input type="email" className="form-input" value={localClientInfo.careManagementCoordinator?.email || ''} onChange={(e) => handleClientChange('careManagementCoordinator', { ...localClientInfo.careManagementCoordinator, email: e.target.value })} placeholder="coordinator@company.com" />
              </div>
              <div className="form-group">
                <label className="form-label">Phone</label>
                <input type="text" className="form-input" value={localClientInfo.careManagementCoordinator?.phone || ''} onChange={(e) => handleClientChange('careManagementCoordinator', { ...localClientInfo.careManagementCoordinator, phone: e.target.value })} placeholder="(555) 555-5555" />
              </div>
            </div>

            {/* Enrollment Specialists */}
            <h4 style={{ fontSize: 14, fontWeight: 600, color: '#475569', marginBottom: 12 }}>Enrollment Specialists</h4>
            <div className="editable-list">
              {localClientInfo.enrollmentSpecialists.map((specialist, index) => (
                <div key={specialist.id} className="client-info-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Specialist {index + 1}</span>
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
              <button className="add-item-btn" onClick={addEnrollmentSpecialist}>+ Add Enrollment Specialist</button>
            </div>
          </div>

          {/* MEDICAL PROVIDERS */}
          <div className="form-section">
            <div className="form-section-header">
              <div className="form-section-icon amber"><Heart size={20} /></div>
              <div>
                <div className="form-section-title">Medical Providers</div>
                <div className="form-section-subtitle">Providers at the practice with phone numbers and caller ID status</div>
              </div>
            </div>

            <div className="editable-list">
              {localClientInfo.providers.map((provider, index) => (
                <div key={provider.id} className="client-info-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: '#64748b' }}>Provider {index + 1}</span>
                    <button className="remove-btn" onClick={() => removeProvider(provider.id)}>Remove</button>
                  </div>
                  <div className="form-grid">
                    <div className="form-group">
                      <label className="form-label">Provider Name</label>
                      <input type="text" className="form-input" value={provider.name} onChange={(e) => handleProviderChange(provider.id, 'name', e.target.value)} placeholder="Dr. Name" />
                    </div>
                    {canEditSensitiveData && (
                      <div className="form-group">
                        <label className="form-label">NPI</label>
                        <input type="text" className="form-input" value={provider.npi} onChange={(e) => handleProviderChange(provider.id, 'npi', e.target.value)} placeholder="10-digit NPI" />
                      </div>
                    )}
                    <div className="form-group">
                      <label className="form-label">Phone Number</label>
                      <input type="text" className="form-input" value={provider.phone} onChange={(e) => handleProviderChange(provider.id, 'phone', e.target.value)} placeholder="(555) 555-5555" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Caller ID Verified</label>
                      <div className="checkbox-wrapper" style={{ marginTop: 8 }}>
                        <input 
                          type="checkbox" 
                          checked={provider.callerIdVerified} 
                          onChange={(e) => handleProviderChange(provider.id, 'callerIdVerified', e.target.checked)} 
                        />
                        <span className={`verified-badge ${provider.callerIdVerified ? '' : 'not-verified'}`}>
                          {provider.callerIdVerified ? '✓ Verified' : 'Not Verified'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <button className="add-item-btn" onClick={addProvider}>+ Add Provider</button>
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
        </>
      )}

      {/* SAVE ACTIONS */}
      <div className="form-actions">
        <button className="save-btn" onClick={handleSave}>
          <Save size={18} />
          Save All Changes
        </button>
      </div>
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
        <PrysmCSDashboardContent />
      </CustomizationProvider>
    </AuthProvider>
  );
}

function PrysmCSDashboardContent() {
  const { isAuthenticated, currentUser, canAccessClient, logPHIAccess, hasPermission } = useAuth();
  const { customization } = useCustomization();

  console.log('[PrysmCS] DashboardContent rendering, isAuthenticated:', isAuthenticated);

  // Apply brand colors and font as CSS custom properties
  useEffect(() => {
    const root = document.documentElement;
    const branding = customization.branding;
    
    // Set brand color CSS variables
    root.style.setProperty('--brand-primary', branding.primaryColor);
    root.style.setProperty('--brand-secondary', branding.secondaryColor);
    root.style.setProperty('--brand-accent', branding.accentColor);
    
    // Set derived colors for hover/focus states
    root.style.setProperty('--brand-primary-light', branding.accentColor);
    root.style.setProperty('--brand-primary-dark', branding.secondaryColor);
    
    // Set font family
    root.style.setProperty('--brand-font', branding.fontFamily || 'DM Sans');
    document.body.style.fontFamily = `'${branding.fontFamily || 'DM Sans'}', -apple-system, sans-serif`;
  }, [customization.branding]);
  
  // Load persisted data or use initial data
  const [clientsData, setClientsData] = useState(() => {
  const saved = loadFromStorage();
  return saved || JSON.parse(JSON.stringify(initialClientsDatabase));
});

// Supabase data state
const [supabaseClients, setSupabaseClients] = useState([]);
const [isLoadingData, setIsLoadingData] = useState(false);
const [dataSource, setDataSource] = useState('local'); // 'local' or 'supabase'

// Load data from Supabase when user logs in
useEffect(() => {
  const loadSupabaseData = async () => {
    if (currentUser && currentUser.tenantId) {
      setIsLoadingData(true);
      console.log('[Dashboard] Loading data from Supabase for tenant:', currentUser.tenantId);

      const result = await supabaseData.loadDashboardData(currentUser.tenantId);

      if (result.success && Object.keys(result.data).length > 0) {
        console.log('[Dashboard] Loaded Supabase data:', Object.keys(result.data));
        setClientsData(prevData => ({
          ...prevData,
          ...result.data,
        }));
        setSupabaseClients(result.clients || []);
        setDataSource('supabase');

        // Update clients list from Supabase
        if (result.clients && result.clients.length > 0) {
          setClientsList(result.clients.map(c => ({
            id: c.slug,
            dbId: c.id,
            name: c.name,
          })));
          // Set first client as selected if current selection doesn't exist
          if (!result.data[selectedClientId]) {
            setSelectedClientId(result.clients[0].slug);
          }
        }
      } else {
        console.log('[Dashboard] No Supabase data, using local data');
        setDataSource('local');
      }

      setIsLoadingData(false);
    }
  };

  loadSupabaseData();
}, [currentUser]);

  // Selection state
  const [selectedClientId, setSelectedClientId] = useState('hybrid-medical');
  const [selectedMonth, setSelectedMonth] = useState('2025-11');
  
  // UI state
  const [activePage, setActivePageRaw] = useState("overview");
  const [pageHistory, setPageHistory] = useState([]);
  const [showPDFModal, setShowPDFModal] = useState(false);
  const [showPresentationMode, setShowPresentationMode] = useState(false);
  const [showSaveToast, setShowSaveToast] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  
  // Client management state
  const [clientsList, setClientsList] = useState([
    { id: 'hybrid-medical', name: 'Apex Solutions Inc' },
    { id: 'spirazza-family', name: 'Cascade Enterprises' },
    { id: 'burke-family', name: 'Summit Partners Group' },
  ]);
  
  // Delete client state
  const [showDeleteClientModal, setShowDeleteClientModal] = useState(false);
  const [deleteClientConfirmText, setDeleteClientConfirmText] = useState('');
  const [newClientMode, setNewClientMode] = useState(false);

  // Custom widgets state
  const [customWidgets, setCustomWidgets] = useState([]);

  // Load custom widgets
  useEffect(() => {
    const loadCustomWidgets = async () => {
      const widgets = await widgetConfigDB.getWidgetConfigs('demo-client-1');
      setCustomWidgets(widgets);
    };
    loadCustomWidgets();
  }, []);

  // Wrap setActivePage to track history
  const setActivePage = (newPage) => {
    if (newPage !== activePage) {
      setPageHistory(prev => [...prev.slice(-9), activePage]); // Keep last 10 pages
      setActivePageRaw(newPage);
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

  // Compute dashboard data with dynamic charts from historical data
  const dashboardData = buildDashboardData(formData, getPreviousMonthData(), getCurrentClient(), selectedMonth);

  // Track unsaved changes
  useEffect(() => {
    const originalData = JSON.stringify(getCurrentMonthData());
    const currentData = JSON.stringify(formData);
    setHasUnsavedChanges(originalData !== currentData);
  }, [formData, selectedClientId, selectedMonth]);

  // Save data to localStorage whenever clientsData changes
  // Save data to localStorage and Supabase
const saveAllData = async (newFormData, newStories, newOpportunities, newClientInfo) => {
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
        ...(clientsData[selectedClientId]?.monthlyData || {}),
        [selectedMonth]: dataToSave,
      },
      stories: {
        ...(clientsData[selectedClientId]?.stories || {}),
        [selectedMonth]: storiesToSave,
      },
      opportunities: {
        ...(clientsData[selectedClientId]?.opportunities || {}),
        [selectedMonth]: opportunitiesToSave,
      },
    },
  };

  setClientsData(updatedClientsData);
  saveToStorage(updatedClientsData);

  // Save to Supabase if user is logged in
  if (currentUser && currentUser.tenantId) {
    const clientDbId = clientsData[selectedClientId]?.dbId;

    if (clientDbId) {
      console.log('[Dashboard] Saving to Supabase...');

      // Save monthly data
      const monthlyResult = await supabaseData.saveMonthlyDataToSupabase(
        currentUser.tenantId,
        clientDbId,
        selectedMonth,
        dataToSave
      );

      if (monthlyResult.success) {
        console.log('[Dashboard] Monthly data saved to Supabase');
      } else {
        console.error('[Dashboard] Failed to save monthly data:', monthlyResult.error);
      }

      // Save stories
      for (const story of storiesToSave) {
        await supabaseData.saveStoryToSupabase(
          currentUser.tenantId,
          clientDbId,
          selectedMonth,
          story
        );
      }

      // Save opportunities
      for (const opp of opportunitiesToSave) {
        await supabaseData.saveOpportunityToSupabase(
          currentUser.tenantId,
          clientDbId,
          selectedMonth,
          opp
        );
      }

      console.log('[Dashboard] All data saved to Supabase');
    }
  }

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
    // Check if user can access the client
    if (!canAccessClient(newClientId)) {
      logPHIAccess(AUDIT_ACTIONS.ACCESS_DENIED, {
        resource: 'client_data',
        clientId: newClientId,
        reason: 'unauthorized_client_access'
      });
      alert('You do not have access to this client.');
      return;
    }
    
    // Save current data first
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
    setSelectedClientId(newClientId);
    setFormData({ ...(newClient.monthlyData[selectedMonth] || emptyMonthData) });
    setStories([...(newClient.stories[selectedMonth] || [])]);
    setOpportunities([...(newClient.opportunities[selectedMonth] || [])]);
    setClientInfo({ ...newClient.clientInfo });
    
    setActivePage("overview");
    setHasUnsavedChanges(false);
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
          [selectedMonth]: blankMonthData
        },
        stories: {
          [selectedMonth]: []
        },
        opportunities: {
          [selectedMonth]: []
        }
      }
    }));
    
    // Select the new client and update all state
    setSelectedClientId(clientId);
    setClientInfo({ ...blankClientInfo });
    setFormData({ ...blankMonthData });
    setStories([]);
    setOpportunities([]);
    
    // Set flag FIRST to indicate new client (will start on client info tab)
    setNewClientMode(true);
    
    // Then navigate to Dashboard Management page - the AdminPage will detect new client and show client tab
    setActivePage('admin');
    
    logPHIAccess(AUDIT_ACTIONS.CREATE_RECORD, {
      resource: 'client',
      action: 'created_client',
      clientId: clientId
    });
  };

  const handleDeleteClient = () => {
    // Only proceed if DELETE is typed (confirmation required for all clients)
    if (deleteClientConfirmText !== 'DELETE') {
      return;
    }
    
    const clientToDelete = clientsList.find(c => c.id === selectedClientId);
    if (!clientToDelete) return;
    
    // Cannot delete if only one client remains
    if (clientsList.length <= 1) {
      alert('Cannot delete the last remaining client.');
      return;
    }
    
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
      // Need to get data from the updated clientsData (after deletion)
      // Since setClientsData is async, we calculate the new data inline
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
      action: 'deleted_client',
      clientId: selectedClientId,
      clientName: clientToDelete.name
    });
    
    // Reset and close modal
    setDeleteClientConfirmText('');
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

  const renderPage = () => {
    const sectionVisibility = formData.sectionVisibility || {};
    
    switch (activePage) {
      case "overview":
        return hasPermission('view_dashboard') ? <OverviewPage data={dashboardData} sectionVisibility={sectionVisibility} customWidgets={customWidgets} brandColor={customization.branding.primaryColor} /> : <AccessDeniedMessage />;
      case "enrollment":
        return hasPermission('view_patients') ? <EnrollmentPage data={dashboardData} sectionVisibility={sectionVisibility} customWidgets={customWidgets} brandColor={customization.branding.primaryColor} /> : <AccessDeniedMessage />;
      case "financial":
        return hasPermission('view_financial') ? <FinancialPage data={dashboardData} sectionVisibility={sectionVisibility} customWidgets={customWidgets} brandColor={customization.branding.primaryColor} /> : <AccessDeniedMessage />;
      case "outcomes": 
        return hasPermission('view_outcomes') ? <OutcomesPage data={dashboardData} sectionVisibility={sectionVisibility} /> : <AccessDeniedMessage />;
      case "stories": 
        return hasPermission('view_stories') ? <StoriesPage stories={stories} sectionVisibility={sectionVisibility} /> : <AccessDeniedMessage />;
      case "opportunities": 
        return hasPermission('view_opportunities') ? <OpportunitiesPage opportunities={opportunities} sectionVisibility={sectionVisibility} /> : <AccessDeniedMessage />;
      case "initiatives": 
        return hasPermission('view_initiatives') ? <MonthlyInitiativesPage monthLabel={currentMonthLabel} /> : <AccessDeniedMessage />;
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
          />
        ) : <AccessDeniedMessage />;
      case "users": return <UserManagementPage setActivePage={setActivePage} />;
      case "audit": return <AuditLogPage />;
      case "portfolio": return hasPermission('view_portfolio_analytics') ? <PortfolioAnalyticsPage /> : <AccessDeniedMessage />;
      case "customization": return hasPermission('manage_customization') ? <CustomizationPage customWidgets={customWidgets} setCustomWidgets={setCustomWidgets} onNavigate={setActivePage} /> : <AccessDeniedMessage />;
      case "notifications": return <NotificationsPage />;
      case "profile": return <ProfilePage />;
      default: return <OverviewPage data={dashboardData} sectionVisibility={sectionVisibility} />;
    }
  };

  // Show login page if not authenticated
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
      <DashboardEditProvider clientId={selectedClientId}>
        <div className="dashboard">
          <Sidebar activePage={activePage} setActivePage={setActivePage} />
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
            />
            <div className="page-content">
              {renderPage()}
            </div>
          </main>
        </div>
      </DashboardEditProvider>
      
      {/* PDF Report Modal */}
      <PDFReportModal 
        isOpen={showPDFModal}
        onClose={() => setShowPDFModal(false)}
        dashboardData={dashboardData}
        clientInfo={clientInfo}
        stories={stories}
        opportunities={opportunities}
        monthLabel={currentMonthLabel}
        sectionVisibility={formData.sectionVisibility}
      />
      
      {/* Presentation Mode */}
      <PresentationMode
        isOpen={showPresentationMode}
        onClose={() => setShowPresentationMode(false)}
        dashboardData={dashboardData}
        clientInfo={clientInfo}
        stories={stories}
        opportunities={opportunities}
        monthLabel={currentMonthLabel}
        formData={formData}
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
                You are about to permanently delete:
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
                  All data, stories, and opportunities for this client will be permanently deleted.
                </div>
              </div>
              
              <p style={{ marginBottom: '12px', fontWeight: '500', color: '#dc2626' }}>
                ⚠️ This action cannot be undone. Type <strong>DELETE</strong> to confirm:
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
      
      {/* Save Toast */}
      {showSaveToast && (
        <div className="data-saved-toast">
          Data saved successfully
        </div>
      )}
    </>
  );
}
