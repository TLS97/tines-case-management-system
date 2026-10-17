import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { App } from './App';

describe('App', () => {
  it('renders the app shell with the start page', async () => {
    render(<App />);

    expect(await screen.findByRole('banner')).toBeInTheDocument();
    expect(await screen.findByRole('heading', { level: 1, name: 'Cases' })).toBeInTheDocument();
  });
});
