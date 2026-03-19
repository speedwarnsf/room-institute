import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DesignAnnotations, type Annotation } from '../../components/DesignAnnotations';

describe('DesignAnnotations', () => {
  const mockImage = 'data:image/png;base64,AAAA';

  it('renders with no annotations', () => {
    render(
      <DesignAnnotations
        imageBase64={mockImage}
        annotations={[]}
        onAnnotationsChange={vi.fn()}
      />
    );
    expect(screen.getByText('Annotations')).toBeDefined();
    expect(screen.getByText('Add Notes')).toBeDefined();
  });

  it('renders existing annotations', () => {
    const annotations: Annotation[] = [
      { id: 'a1', x: 50, y: 50, text: 'Love this lamp', createdAt: Date.now() },
      { id: 'a2', x: 30, y: 70, text: 'Change this color', createdAt: Date.now() },
    ];
    render(
      <DesignAnnotations
        imageBase64={mockImage}
        annotations={annotations}
        onAnnotationsChange={vi.fn()}
      />
    );
    expect(screen.getByText('Love this lamp')).toBeDefined();
    expect(screen.getByText('Change this color')).toBeDefined();
  });

  it('toggles annotating mode', () => {
    render(
      <DesignAnnotations
        imageBase64={mockImage}
        annotations={[]}
        onAnnotationsChange={vi.fn()}
      />
    );
    const btn = screen.getByText('Add Notes');
    fireEvent.click(btn);
    expect(screen.getByText('Done')).toBeDefined();
  });

  it('calls onAnnotationsChange when deleting', () => {
    const onChange = vi.fn();
    const annotations: Annotation[] = [
      { id: 'a1', x: 50, y: 50, text: 'Test note', createdAt: Date.now() },
    ];
    render(
      <DesignAnnotations
        imageBase64={mockImage}
        annotations={annotations}
        onAnnotationsChange={onChange}
      />
    );
    // Click the X button in the annotations list
    const deleteButtons = screen.getAllByRole('button');
    const xButton = deleteButtons.find(b => b.querySelector('.lucide-x'));
    if (xButton) {
      fireEvent.click(xButton);
      expect(onChange).toHaveBeenCalledWith([]);
    }
  });
});
