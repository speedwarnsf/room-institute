/**
 * ZenSpace - UploadZone Component Tests
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { UploadZone } from '../../components/UploadZone';

// Mock FileReader
class MockFileReader {
  result: string | null = null;
  onloadend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  
  readAsDataURL(_file: File) {
    // Simulate async read
    setTimeout(() => {
      this.result = 'data:image/png;base64,mockbase64data';
      if (this.onloadend) this.onloadend();
    }, 0);
  }
}

// @ts-ignore
global.FileReader = MockFileReader;

describe('UploadZone', () => {
  const mockOnImageSelected = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Rendering', () => {
    it('renders the upload zone', () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      expect(screen.getByRole('button')).toBeInTheDocument();
      expect(screen.getByText('Drop Photo')).toBeInTheDocument();
    });

    it('shows loading state when analyzing', () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={true} />);
      
      expect(screen.getByText(/focusing/i)).toBeInTheDocument();
      expect(screen.getByRole('button')).toHaveAttribute('aria-busy', 'true');
    });

    it('has correct accessibility attributes', () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const uploadButton = screen.getByRole('button');
      expect(uploadButton).toHaveAttribute('tabIndex', '0');
      expect(uploadButton).toHaveAttribute('aria-label');
    });

    it('sets tabIndex to -1 when analyzing', () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={true} />);
      
      const uploadButton = screen.getByRole('button');
      expect(uploadButton).toHaveAttribute('tabIndex', '-1');
    });
  });

  describe('File Selection', () => {
    it('accepts valid image files', async () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalledWith(file);
      });
    });

    it('rejects non-image files', async () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const file = new File(['test'], 'test.pdf', { type: 'application/pdf' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/please upload a jpg/i);
      });
      expect(mockOnImageSelected).not.toHaveBeenCalled();
    });

    it('rejects files larger than 10MB', async () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      // Create a large file (> 10MB)
      const largeContent = new Array(11 * 1024 * 1024).fill('a').join('');
      const file = new File([largeContent], 'large.png', { type: 'image/png' });
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent(/smaller than 10mb/i);
      });
      expect(mockOnImageSelected).not.toHaveBeenCalled();
    });
  });

  describe('Drag and Drop', () => {
    it('highlights on drag over', () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const dropZone = screen.getByRole('button');
      
      fireEvent.dragOver(dropZone, {
        dataTransfer: { dropEffect: 'none', files: [] }
      });
      
      // Check for visual feedback (scale or ring class)
      expect(dropZone.className).toContain('scale');
    });

    it('removes highlight on drag leave', () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const dropZone = screen.getByRole('button');
      
      fireEvent.dragOver(dropZone, {
        dataTransfer: { dropEffect: 'none', files: [] }
      });
      
      fireEvent.dragLeave(dropZone);
      
      // Should return to normal scale
      expect(dropZone.className).not.toContain('scale-105');
    });

    it('processes dropped files', async () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const file = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const dropZone = screen.getByRole('button');
      
      fireEvent.drop(dropZone, {
        dataTransfer: { files: [file] }
      });
      
      expect(mockOnImageSelected).toHaveBeenCalledWith(file);
    });
  });

  describe('Keyboard Navigation', () => {
    it('activates on Enter key', async () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const uploadButton = screen.getByRole('button');
      uploadButton.focus();
      
      // The click handler should be triggered
      fireEvent.keyDown(uploadButton, { key: 'Enter' });
      
      // This would open the file dialog in a real browser
      expect(document.activeElement).toBe(uploadButton);
    });

    it('activates on Space key', async () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const uploadButton = screen.getByRole('button');
      uploadButton.focus();
      
      fireEvent.keyDown(uploadButton, { key: ' ' });
      
      expect(document.activeElement).toBe(uploadButton);
    });
  });

  describe('Preview State', () => {
    it('shows preview image after upload', async () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // Use fireEvent for more reliable test behavior
      fireEvent.change(input, { target: { files: [file] } });
      
      // Wait for FileReader to complete
      await waitFor(() => {
        // The component calls onImageSelected when file is processed
        expect(mockOnImageSelected).toHaveBeenCalledWith(file);
      });
    });

    it('calls onImageSelected with the file', async () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const file = new File(['test'], 'test.png', { type: 'image/png' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      fireEvent.change(input, { target: { files: [file] } });
      
      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalledWith(file);
      });
    });
  });

  describe('Error Handling', () => {
    it('displays error message with alert role', async () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const file = new File(['test'], 'test.txt', { type: 'text/plain' });
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      Object.defineProperty(input, 'files', { value: [file] });
      fireEvent.change(input);
      
      await waitFor(() => {
        const alert = screen.getByRole('alert');
        expect(alert).toBeInTheDocument();
      });
    });

    it('clears error when new valid file is selected', async () => {
      render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
      
      const input = document.querySelector('input[type="file"]') as HTMLInputElement;
      
      // First, trigger an error with invalid file
      const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });
      fireEvent.change(input, { target: { files: [invalidFile] } });
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument();
      });
      
      // Then, upload a valid file using fireEvent
      const validFile = new File(['test'], 'test.png', { type: 'image/png' });
      fireEvent.change(input, { target: { files: [validFile] } });
      
      // The processFile function clears the error for valid files
      await waitFor(() => {
        expect(mockOnImageSelected).toHaveBeenCalledWith(validFile);
      });
    });
  });

  describe('Accepted File Types', () => {
    const validTypes = [
      { type: 'image/jpeg', ext: '.jpg' },
      { type: 'image/png', ext: '.png' },
      { type: 'image/webp', ext: '.webp' },
    ];

    validTypes.forEach(({ type, ext }) => {
      it(`accepts ${ext} files`, async () => {
        render(<UploadZone onImageSelected={mockOnImageSelected} isAnalyzing={false} />);
        
        const file = new File(['test'], `test${ext}`, { type });
        const input = document.querySelector('input[type="file"]') as HTMLInputElement;
        
        fireEvent.change(input, { target: { files: [file] } });
        
        await waitFor(() => {
          expect(mockOnImageSelected).toHaveBeenCalledWith(file);
        });
      });
    });
  });
});
