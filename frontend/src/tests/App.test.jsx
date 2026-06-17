import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import App from '../App';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('App Component Root & Auth Tests', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    localStorage.clear();
  });

  test('should render skip to main content link for accessibility', () => {
    render(<App />);
    const skipLink = screen.getByText(/Skip to main content/i);
    expect(skipLink).toBeInTheDocument();
    expect(skipLink).toHaveAttribute('href', '#main-content');
  });

  test('should display registration screen when clicking Sign Up', async () => {
    render(<App />);
    
    // Default mode is login, check for Sign Up button
    const signUpToggle = screen.getByRole('button', { name: /Sign Up/i });
    fireEvent.click(signUpToggle);

    // Should now show register fields like "Full Name"
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  test('should toggle back to Sign In from registration screen', () => {
    render(<App />);
    
    // Toggle to register
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    
    // Toggle back to login
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
  });
});
