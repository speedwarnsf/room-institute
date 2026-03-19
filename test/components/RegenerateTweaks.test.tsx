import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RegenerateTweaks } from '../../components/RegenerateTweaks';

describe('RegenerateTweaks', () => {
  it('renders all tweak options', () => {
    render(
      <RegenerateTweaks onTweak={vi.fn()} designName="Test Design" />
    );
    expect(screen.getByText('Lighter')).toBeDefined();
    expect(screen.getByText('Darker')).toBeDefined();
    expect(screen.getByText('More Minimal')).toBeDefined();
    expect(screen.getByText('More Layered')).toBeDefined();
    expect(screen.getByText('Warmer Tones')).toBeDefined();
    expect(screen.getByText('Cooler Tones')).toBeDefined();
  });

  it('shows design name in description', () => {
    render(
      <RegenerateTweaks onTweak={vi.fn()} designName="Nordic Calm" />
    );
    expect(screen.getByText(/Nordic Calm/)).toBeDefined();
  });

  it('calls onTweak when a tweak button is clicked', async () => {
    const onTweak = vi.fn().mockResolvedValue(undefined);
    render(
      <RegenerateTweaks onTweak={onTweak} designName="Test" />
    );
    fireEvent.click(screen.getByText('Lighter'));
    expect(onTweak).toHaveBeenCalledWith(expect.stringContaining('lighter'));
  });

  it('has a custom tweak input', () => {
    render(
      <RegenerateTweaks onTweak={vi.fn()} designName="Test" />
    );
    expect(screen.getByPlaceholderText(/describe your own tweak/i)).toBeDefined();
  });
});
