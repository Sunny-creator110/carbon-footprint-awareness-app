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

  test('should render the landing page by default', () => {
    render(<App />);
    expect(screen.getByText(/Trace Your Footprint/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Start Your Green Journey/i })).toBeInTheDocument();
  });

  test('should display registration screen when clicking Start Your Green Journey', async () => {
    render(<App />);
    
    const ctaBtn = screen.getByRole('button', { name: /Start Your Green Journey/i });
    fireEvent.click(ctaBtn);

    // Should now show register fields like "Full Name"
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });

  test('should display login screen when clicking Login navigation button', () => {
    render(<App />);
    
    // Toggle to login from header nav
    const loginBtns = screen.getAllByRole('button', { name: /Login/i });
    fireEvent.click(loginBtns[0]); // Header nav button

    expect(screen.queryByLabelText(/Full Name/i)).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Log In/i })).toBeInTheDocument();
  });

  test('should go back to landing page when clicking Back on auth card', () => {
    render(<App />);
    
    // Switch to login card
    const loginBtns = screen.getAllByRole('button', { name: /Login/i });
    fireEvent.click(loginBtns[0]);

    // Click Back
    const backBtn = screen.getByRole('button', { name: /Back/i });
    fireEvent.click(backBtn);

    // Should be back on the landing page
    expect(screen.getByText(/Trace Your Footprint/i)).toBeInTheDocument();
  });
});
