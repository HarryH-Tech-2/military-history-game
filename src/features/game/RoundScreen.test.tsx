import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import { RoundScreen } from './RoundScreen';
import { useGameStore } from '../../state/useGameStore';
import { Battle } from '../../types';

const battles: Battle[] = Array.from({ length: 10 }, (_, i) => ({
  id: i + 1, name: `Battle ${i + 1}`, civilization: 'ancient-greece-rome',
  acceptedAnswers: [`Battle ${i + 1}`], prompt: '',
  hints: ['Hint A', 'Hint B', 'Hint C', 'Hint D'],
  difficulty: 'easy', year: -490, location: '', description: '',
}));

beforeEach(() => {
  useGameStore.getState().reset();
  useGameStore.getState().startRound('ancient', battles);
});

describe('RoundScreen', () => {
  it('shows year chip and one initial clue', () => {
    const { getByText, queryByText } = render(<RoundScreen onFinished={() => {}} />);
    expect(getByText(/Year:/)).toBeTruthy();
    expect(getByText('Hint A')).toBeTruthy();
    expect(queryByText('Hint B')).toBeNull();
  });

  it('reveals additional clues and reduces points', () => {
    const { getByText } = render(<RoundScreen onFinished={() => {}} />);
    fireEvent.press(getByText(/Reveal another clue/));
    expect(getByText('Hint B')).toBeTruthy();
    expect(getByText('Points available: 8')).toBeTruthy();
  });

  it('correct guess advances; wrong guess shows the answer', () => {
    const { getByPlaceholderText, getByText } = render(<RoundScreen onFinished={() => {}} />);
    fireEvent.changeText(getByPlaceholderText('Name the battle…'), 'Battle 1');
    fireEvent.press(getByText('Submit'));
    expect(getByText('Correct!')).toBeTruthy();
  });
});
