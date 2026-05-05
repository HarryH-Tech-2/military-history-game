import React from 'react';
import { render } from '@testing-library/react-native';
import { PathScreen } from './PathScreen';
import { useProgressStore } from '../../state/useProgressStore';

beforeEach(() => useProgressStore.getState().reset());

describe('PathScreen', () => {
  it('renders all 8 eras with the first as current and rest as locked', () => {
    const { getAllByText } = render(<PathScreen onStartEra={() => {}} />);
    expect(getAllByText('Locked').length).toBe(7);
  });

  it('shows completed score when era was completed', () => {
    useProgressStore.getState().completeEra('ancient', { correct: 8, points: 64 });
    const { getByText } = render(<PathScreen onStartEra={() => {}} />);
    expect(getByText('8/10 · 64 pts')).toBeTruthy();
  });
});
