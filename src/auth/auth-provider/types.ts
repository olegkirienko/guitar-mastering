export type Profile = { firstName: string | null; lastName: string | null; avatarId: string | null };
export type Preferences = { audioEnabled: boolean; prefersStatic: boolean };
export type AccountUser = { id: string; username: string; profile: Profile; preferences: Preferences };
export type Credentials = { username: string; password: string };

export type AuthState = 'loading' | 'guest' | 'authenticated' | 'unavailable';
export type AuthContextValue = {
  state: AuthState;
  user: AccountUser | null;
  preferences: Preferences;
  refresh(): Promise<void>;
  register(credentials: Credentials): Promise<void>;
  login(credentials: Credentials): Promise<void>;
  logout(): Promise<void>;
  updateProfile(profile: Partial<Profile>): Promise<void>;
  // Applies the change at once and reverts it when the server rejects it; never rejects.
  updatePreferences(preferences: Partial<Preferences>): Promise<void>;
  deleteAccount(password: string): Promise<void>;
};
