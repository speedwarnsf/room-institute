/**
 * Tests for ColorPalette component
 */
import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPalette } from '../../components/ColorPalette';

vi.mock('../../services/colorExtractor', () => ({
  extractColors: vi.fn().mockResolvedValue([
    { hex: '#FF5733', name: 'Warm Red', percentage: 30 },
    { hex: '#33FF57', name: 'Fresh Green', percentage: 25 },
    { hex: '#3357FF', name: 'Royal Blue', percentage: 20 },
  ]),
}));

describe('ColorPalette', () => {
  const fakeImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUg==';

  it('renders extract button', () => {
    render(<ColorPalette imageBase64={fakeImage} />);
    expect(screen.getByText(/extract/i)).toBeInTheDocument();
  });

  it('extracts and displays colors on click', async () => {
    const user = userEvent.setup();
    render(<ColorPalette imageBase64={fakeImage} />);
    await user.click(screen.getByText(/extract/i));
    await waitFor(() => {
      expect(screen.getByText('#FF5733')).toBeInTheDocument();
      expect(screen.getByText('#33FF57')).toBeInTheDocument();
      expect(screen.getByText('#3357FF')).toBeInTheDocument();
    });
  });

  it('applies custom className', () => {
    const { container } = render(<ColorPalette imageBase64={fakeImage} className="my-custom" />);
    expect(container.firstChild).toHaveClass('my-custom');
  });
});
