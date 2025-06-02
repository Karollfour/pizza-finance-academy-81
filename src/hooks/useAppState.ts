
import { usePersistedState } from './usePersistedState';

interface AppState {
  currentScreen: string;
  selectedTeam: string;
  teamId?: string;
  lastRoute: string;
  preferences: {
    autoRefresh: boolean;
    showNotifications: boolean;
    theme: 'light' | 'dark';
  };
}

const defaultAppState: AppState = {
  currentScreen: 'login',
  selectedTeam: '',
  teamId: '',
  lastRoute: '/',
  preferences: {
    autoRefresh: true,
    showNotifications: true,
    theme: 'light'
  }
};

export const useAppState = () => {
  const [appState, setAppState] = usePersistedState<AppState>('app-state', defaultAppState);

  const updateCurrentScreen = (screen: string) => {
    setAppState(prev => ({
      ...prev,
      currentScreen: screen,
      lastRoute: window.location.pathname
    }));
  };

  const updateSelectedTeam = (teamName: string, teamId?: string) => {
    setAppState(prev => ({
      ...prev,
      selectedTeam: teamName,
      teamId: teamId || '',
      currentScreen: 'equipe'
    }));
  };

  const updatePreferences = (preferences: Partial<AppState['preferences']>) => {
    setAppState(prev => ({
      ...prev,
      preferences: {
        ...prev.preferences,
        ...preferences
      }
    }));
  };

  const resetAppState = () => {
    setAppState(defaultAppState);
  };

  const goBackToLastScreen = () => {
    if (appState.lastRoute && appState.lastRoute !== '/') {
      window.history.pushState(null, '', appState.lastRoute);
    }
  };

  return {
    appState,
    updateCurrentScreen,
    updateSelectedTeam,
    updatePreferences,
    resetAppState,
    goBackToLastScreen,
    setAppState
  };
};
