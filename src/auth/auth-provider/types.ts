export type Profile = { firstName: string | null; lastName: string | null; avatarId: string | null };
export type AccountUser = { id: string; username: string; profile: Profile };
export type Credentials = { username: string; password: string };

export type AuthState = 'loading' | 'guest' | 'authenticated' | 'unavailable';
export type AuthContextValue = {
  state: AuthState;
  user: AccountUser | null;
  refresh(): Promise<void>;
  register(credentials: Credentials): Promise<void>;
  login(credentials: Credentials): Promise<void>;
  logout(): Promise<void>;
  updateProfile(profile: Partial<Profile>): Promise<void>;
  deleteAccount(password: string): Promise<void>;
};
