import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

test('renders start screen', () => {
  render(<App />);
  const hostButton = screen.getByText(/host game/i);
  expect(hostButton).toBeInTheDocument();
});
