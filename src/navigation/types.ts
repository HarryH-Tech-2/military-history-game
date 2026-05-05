import { EraId } from '../data/eras';

export type RootStackParamList = {
  Onboarding: undefined;
  Auth: undefined;
  App: undefined;
  Round: { eraId: EraId };
  Summary: { eraId: EraId };
};

export type TabParamList = {
  Path: undefined;
  Leaderboard: undefined;
  Profile: undefined;
};
