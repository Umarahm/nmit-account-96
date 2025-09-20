'use client';

import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { useSession } from 'next-auth/react';

interface DashboardStats {
    totalRevenue: {
        value: number;
        formatted: string;
        trend: {
            value: number;
            direction: 'up' | 'down' | 'neutral';
        };
    };
    activeContacts: {
        value: number;
        formatted: string;
    };
    pendingInvoices: {
        value: number;
        formatted: string;
        amount: number;
        amountFormatted: string;
    };
    stockValue: {
        value: number;
        formatted: string;
        totalProducts: number;
        activeProducts: number;
    };
    monthlyPayments: {
        value: number;
        formatted: string;
        count: number;
    };
}

interface RecentActivity {
    id: string;
    type: 'invoice' | 'payment' | 'order';
    title: string;
    description: string;
    date: string;
    status: string;
    amount: string;
}

interface DataState {
    dashboardStats: DashboardStats | null;
    recentActivity: RecentActivity[];
    loading: boolean;
    error: string | null;
    lastUpdated: string | null;
    refreshTrigger: number;
}

type DataAction =
    | { type: 'SET_LOADING'; payload: boolean }
    | { type: 'SET_STATS'; payload: { stats: DashboardStats; activity: RecentActivity[]; lastUpdated: string } }
    | { type: 'SET_ERROR'; payload: string }
    | { type: 'TRIGGER_REFRESH' }
    | { type: 'CLEAR_ERROR' };

const initialState: DataState = {
    dashboardStats: null,
    recentActivity: [],
    loading: true,
    error: null,
    lastUpdated: null,
    refreshTrigger: 0,
};

function dataReducer(state: DataState, action: DataAction): DataState {
    switch (action.type) {
        case 'SET_LOADING':
            return { ...state, loading: action.payload };
        case 'SET_STATS':
            return {
                ...state,
                dashboardStats: action.payload.stats,
                recentActivity: action.payload.activity,
                lastUpdated: action.payload.lastUpdated,
                loading: false,
                error: null,
            };
        case 'SET_ERROR':
            return { ...state, error: action.payload, loading: false };
        case 'CLEAR_ERROR':
            return { ...state, error: null };
        case 'TRIGGER_REFRESH':
            return { ...state, refreshTrigger: state.refreshTrigger + 1 };
        default:
            return state;
    }
}

interface DataContextType {
    state: DataState;
    refreshData: () => Promise<void>;
    clearError: () => void;
    triggerRefresh: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: React.ReactNode }) {
    const [state, dispatch] = useReducer(dataReducer, initialState);
    const { data: session } = useSession();

    const fetchDashboardStats = useCallback(async () => {
        if (!session?.user) {
            return;
        }

        try {
            dispatch({ type: 'SET_LOADING', payload: true });
            
            const response = await fetch('/api/dashboard/stats');
            if (!response.ok) {
                throw new Error('Failed to fetch dashboard statistics');
            }

            const data = await response.json();
            
            dispatch({
                type: 'SET_STATS',
                payload: {
                    stats: data.statistics,
                    activity: data.recentActivity,
                    lastUpdated: data.lastUpdated,
                },
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
            dispatch({
                type: 'SET_ERROR',
                payload: error instanceof Error ? error.message : 'Failed to fetch data',
            });
        }
    }, [session]);

    const refreshData = useCallback(async () => {
        await fetchDashboardStats();
    }, [fetchDashboardStats]);

    const clearError = useCallback(() => {
        dispatch({ type: 'CLEAR_ERROR' });
    }, []);

    const triggerRefresh = useCallback(() => {
        dispatch({ type: 'TRIGGER_REFRESH' });
    }, []);

    // Initial data fetch
    useEffect(() => {
        if (session?.user) {
            fetchDashboardStats();
        }
    }, [session, fetchDashboardStats]);

    // Refresh on trigger
    useEffect(() => {
        if (state.refreshTrigger > 0 && session?.user) {
            fetchDashboardStats();
        }
    }, [state.refreshTrigger, session, fetchDashboardStats]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        if (!session?.user) return;

        const interval = setInterval(() => {
            fetchDashboardStats();
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(interval);
    }, [session, fetchDashboardStats]);

    const contextValue: DataContextType = {
        state,
        refreshData,
        clearError,
        triggerRefresh,
    };

    return (
        <DataContext.Provider value={contextValue}>
            {children}
        </DataContext.Provider>
    );
}

export function useData() {
    const context = useContext(DataContext);
    if (context === undefined) {
        throw new Error('useData must be used within a DataProvider');
    }
    return context;
}

// Hook for triggering refresh when data changes
export function useDataRefresh() {
    const { triggerRefresh } = useData();
    
    return useCallback(() => {
        // Small delay to ensure API calls complete
        setTimeout(() => {
            triggerRefresh();
        }, 1000);
    }, [triggerRefresh]);
}