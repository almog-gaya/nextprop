'use client';

import React, { createContext, useContext, useState, useReducer, useEffect } from 'react';

// Define types
type ViewMode = 'grid' | 'list';

interface AppState {
  viewMode: ViewMode;
  searchTerm: string;
  lastFetchTime: Record<string, number>;
  selectedItems: string[];
  filters: {
    [key: string]: any;
  };
  userPreferences: {
    cardFields: string[];
    columnOrder: string[];
    savedFilters: Array<{id: string; name: string; filter: any}>;
  };
}

// Action types
type Action = 
  | { type: 'SET_VIEW_MODE', payload: ViewMode }
  | { type: 'SET_SEARCH_TERM', payload: string }
  | { type: 'SET_LAST_FETCH', payload: { key: string, time: number } }
  | { type: 'SELECT_ITEM', payload: string }
  | { type: 'DESELECT_ITEM', payload: string }
  | { type: 'CLEAR_SELECTED_ITEMS' }
  | { type: 'SET_FILTER', payload: { key: string, value: any } }
  | { type: 'CLEAR_FILTERS' }
  | { type: 'SET_CARD_FIELDS', payload: string[] }
  | { type: 'SET_COLUMN_ORDER', payload: string[] }
  | { type: 'SAVE_FILTER', payload: { id: string, name: string, filter: any } }
  | { type: 'DELETE_SAVED_FILTER', payload: string };

// Initial state
const initialState: AppState = {
  viewMode: 'grid',
  searchTerm: '',
  lastFetchTime: {},
  selectedItems: [],
  filters: {},
  userPreferences: {
    cardFields: ['name', 'value', 'businessName', 'source'],
    columnOrder: ['name', 'businessName', 'value', 'stage', 'lastActivity', 'actions'],
    savedFilters: [],
  }
};

// Reducer function
function appReducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'SET_VIEW_MODE':
      return { ...state, viewMode: action.payload };
    case 'SET_SEARCH_TERM':
      return { ...state, searchTerm: action.payload };
    case 'SET_LAST_FETCH':
      return { 
        ...state, 
        lastFetchTime: { 
          ...state.lastFetchTime, 
          [action.payload.key]: action.payload.time 
        } 
      };
    case 'SELECT_ITEM':
      return { 
        ...state, 
        selectedItems: [...state.selectedItems, action.payload] 
      };
    case 'DESELECT_ITEM':
      return { 
        ...state, 
        selectedItems: state.selectedItems.filter(id => id !== action.payload) 
      };
    case 'CLEAR_SELECTED_ITEMS':
      return { ...state, selectedItems: [] };
    case 'SET_FILTER':
      return { 
        ...state, 
        filters: { 
          ...state.filters, 
          [action.payload.key]: action.payload.value 
        } 
      };
    case 'CLEAR_FILTERS':
      return { ...state, filters: {} };
    case 'SET_CARD_FIELDS':
      return { 
        ...state, 
        userPreferences: { 
          ...state.userPreferences, 
          cardFields: action.payload 
        } 
      };
    case 'SET_COLUMN_ORDER':
      return { 
        ...state, 
        userPreferences: { 
          ...state.userPreferences, 
          columnOrder: action.payload 
        } 
      };
    case 'SAVE_FILTER':
      // Remove any existing filter with the same ID
      const existingFilters = state.userPreferences.savedFilters.filter(
        filter => filter.id !== action.payload.id
      );
      return { 
        ...state, 
        userPreferences: { 
          ...state.userPreferences, 
          savedFilters: [...existingFilters, action.payload] 
        } 
      };
    case 'DELETE_SAVED_FILTER':
      return { 
        ...state, 
        userPreferences: { 
          ...state.userPreferences, 
          savedFilters: state.userPreferences.savedFilters.filter(
            filter => filter.id !== action.payload
          ) 
        } 
      };
    default:
      return state;
  }
}

// Create context
const AppStateContext = createContext<{
  state: AppState;
  dispatch: React.Dispatch<Action>;
} | undefined>(undefined);

// Provider component
export function AppStateProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, initialState);

  // Load preferences from localStorage on mount
  useEffect(() => {
    try {
      const savedPreferences = localStorage.getItem('nextprop_user_preferences');
      if (savedPreferences) {
        const preferences = JSON.parse(savedPreferences);
        if (preferences.cardFields) {
          dispatch({ type: 'SET_CARD_FIELDS', payload: preferences.cardFields });
        }
        if (preferences.columnOrder) {
          dispatch({ type: 'SET_COLUMN_ORDER', payload: preferences.columnOrder });
        }
        if (preferences.savedFilters) {
          preferences.savedFilters.forEach((filter: any) => {
            dispatch({ type: 'SAVE_FILTER', payload: filter });
          });
        }
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
    }
  }, []);

  // Save preferences to localStorage when they change
  useEffect(() => {
    try {
      localStorage.setItem('nextprop_user_preferences', JSON.stringify(state.userPreferences));
    } catch (error) {
      console.error('Failed to save preferences:', error);
    }
  }, [state.userPreferences]);

  return (
    <AppStateContext.Provider value={{ state, dispatch }}>
      {children}
    </AppStateContext.Provider>
  );
}

// Custom hook for using the context
export function useAppState() {
  const context = useContext(AppStateContext);
  if (context === undefined) {
    throw new Error('useAppState must be used within an AppStateProvider');
  }
  return context;
} 