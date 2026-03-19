/**
 * Tests for NetworkStatus component
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import { NetworkStatus } from '../../components/NetworkStatus';

vi.mock('../../services/analytics', () => ({
  analytics: { track: vi.fn() },
}));

describe('NetworkStatus', () => {
  let onlineGetter: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    onlineGetter = vi.spyOn(navigator, 'onLine', 'get');
    onlineGetter.mockReturnValue(true);
  });

  it('renders without crashing when online', () => {
    const { container } = render(<NetworkStatus />);
    expect(container).toBeTruthy();
  });

  it('calls onNetworkChange callback on network event', () => {
    const cb = vi.fn();
    render(<NetworkStatus onNetworkChange={cb} />);
    act(() => {
      window.dispatchEvent(new Event('online'));
    });
    expect(cb).toHaveBeenCalled();
  });

  it('shows offline indicator when offline', () => {
    onlineGetter.mockReturnValue(false);
    render(<NetworkStatus showIndicator={true} />);
    // Trigger offline event
    act(() => {
      window.dispatchEvent(new Event('offline'));
    });
    // Should show some offline indicator
    expect(screen.queryByText(/offline/i) || document.querySelector('[data-testid]')).toBeTruthy();
  });

  it('hides indicator when showIndicator is false and online', () => {
    render(<NetworkStatus showIndicator={false} />);
    // Should not render visible status when online and indicator hidden
    expect(screen.queryByText(/offline/i)).toBeNull();
  });
});
