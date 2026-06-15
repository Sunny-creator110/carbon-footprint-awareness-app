import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import Dashboard from '../components/Dashboard';
import axios from 'axios';

// Mock axios
vi.mock('axios');

describe('Dashboard Component Accessibility & Functionality Tests', () => {
  const mockToken = 'mock-token-xyz';

  beforeEach(() => {
    vi.resetAllMocks();

    // Default mock responses for mounts
    axios.get.mockImplementation((url) => {
      if (url === '/api/footprint') {
        return Promise.resolve({
          data: {
            success: true,
            data: []
          }
        });
      }
      if (url === '/api/footprint/analytics') {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              totalEmissions: 0,
              breakdown: { utility: 0, transportation: 0, consumption: 0 }
            }
          }
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });
  });

  test('Ensure form validation errors are announced properly and have accessibility attributes', async () => {
    render(<Dashboard token={mockToken} onLogout={() => {}} />);

    // Wait for load
    await waitFor(() => {
      expect(screen.getByText('Daily Activity Log')).toBeInTheDocument();
    });

    // Make sure we select 'utility' category
    const selectEl = screen.getByLabelText('Activity Category');
    fireEvent.change(selectEl, { target: { value: 'utility' } });

    // Submit form with empty values
    const submitBtn = screen.getByRole('button', { name: /Save Activity Entry/i });
    fireEvent.click(submitBtn);

    // Assert validation error displays
    await waitFor(() => {
      const errorDiv = screen.getByRole('alert');
      expect(errorDiv).toBeInTheDocument();
      expect(errorDiv).toHaveTextContent(/Please specify at least one utility parameter/i);
    });
  });

  test('Mock successful submission and check update to metrics and aria-live region announcement', async () => {
    // 1. Setup mock returns for the submission & subsequent data reload
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        data: {
          _id: '12345',
          activityType: 'utility',
          parameters: { kwh: 200, gasTherms: 0 },
          carbonEmissionsKg: 77, // 200 * 0.385
          date: '2026-06-15'
        }
      }
    });

    // Setup the GET mocks to return updated details on the reload
    axios.get.mockImplementation((url) => {
      if (url === '/api/footprint') {
        return Promise.resolve({
          data: {
            success: true,
            data: [
              {
                _id: '12345',
                activityType: 'utility',
                parameters: { kwh: 200, gasTherms: 0 },
                carbonEmissionsKg: 77,
                date: '2026-06-15'
              }
            ]
          }
        });
      }
      if (url === '/api/footprint/analytics') {
        return Promise.resolve({
          data: {
            success: true,
            data: {
              totalEmissions: 77,
              breakdown: { utility: 77, transportation: 0, consumption: 0 }
            }
          }
        });
      }
      return Promise.reject(new Error('Unknown URL'));
    });

    render(<Dashboard token={mockToken} onLogout={() => {}} />);

    // 2. Locate and enter values in utility form
    await waitFor(() => {
      expect(screen.getByLabelText('Electricity Usage (kWh)')).toBeInTheDocument();
    });

    const kwhInput = screen.getByLabelText('Electricity Usage (kWh)');
    fireEvent.change(kwhInput, { target: { value: '200' } });

    // Submit
    const submitBtn = screen.getByRole('button', { name: /Save Activity Entry/i });
    fireEvent.click(submitBtn);

    // 3. Verify success message and check aria-live text
    await waitFor(() => {
      expect(screen.getByText(/Successfully logged activity. Added 77 kg/i)).toBeInTheDocument();
    });

    // Check that total emissions on screen updated to 77
    const totalEmissionsVal = screen.getByTestId('total-emissions');
    expect(totalEmissionsVal).toHaveTextContent('77');

    // Assert dynamic aria-live announcement region has updated text
    const liveRegion = screen.getByRole('status');
    expect(liveRegion).toHaveAttribute('aria-live', 'polite');
    expect(liveRegion.textContent).toContain('Your total carbon footprint is 77 kilograms');
    expect(liveRegion.textContent).toContain('Utility accounts for 77 kg');
  });
});
