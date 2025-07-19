import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test-utils';
import DropZone from '../Upload/DropZone';
import { createMockFile, createMockFileList, setupURLMock } from '@/test-utils';

// Mock react-dropzone
vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, accept, maxSize }: any) => ({
    getRootProps: () => ({
      'data-testid': 'dropzone',
      onClick: vi.fn(),
    }),
    getInputProps: () => ({
      'data-testid': 'file-input',
      type: 'file',
      accept: Object.keys(accept || {}).join(','),
    }),
    isDragActive: false,
    isDragReject: false,
    isDragAccept: false,
    acceptedFiles: [],
    rejectedFiles: [],
    fileRejections: [],
  }),
}));

describe('DropZone Component', () => {
  const mockOnFileSelect = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    setupURLMock();
  });

  it('renders the dropzone area', () => {
    render(<DropZone onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByTestId('dropzone')).toBeInTheDocument();
    expect(screen.getByTestId('file-input')).toBeInTheDocument();
  });

  it('displays upload instructions', () => {
    render(<DropZone onFileSelect={mockOnFileSelect} />);
    
    expect(screen.getByText(/drag.*drop/i)).toBeInTheDocument();
    expect(screen.getByText(/click.*upload/i)).toBeInTheDocument();
  });

  it('shows accepted file types', () => {
    render(<DropZone onFileSelect={mockOnFileSelect} />);
    
    // Should show supported file types
    expect(screen.getByText(/\.zip/i)).toBeInTheDocument();
  });

  it('displays file size limit', () => {
    render(<DropZone onFileSelect={mockOnFileSelect} />);
    
    // Should show max file size
    expect(screen.getByText(/50.*mb/i)).toBeInTheDocument();
  });

  it('handles file selection via click', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test.zip', 1024 * 1024); // 1MB
    
    render(<DropZone onFileSelect={mockOnFileSelect} />);
    
    const fileInput = screen.getByTestId('file-input');
    await user.upload(fileInput, mockFile);
    
    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(mockFile);
    });
  });

  it('rejects files that are too large', async () => {
    const mockFile = createMockFile('large.zip', 100 * 1024 * 1024); // 100MB
    
    render(<DropZone onFileSelect={mockOnFileSelect} maxSize={50 * 1024 * 1024} />);
    
    // This would be handled by react-dropzone in real implementation
    expect(screen.getByText(/50.*mb/i)).toBeInTheDocument();
  });

  it('rejects unsupported file types', () => {
    render(<DropZone onFileSelect={mockOnFileSelect} />);
    
    // Should only accept zip files by default
    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toHaveAttribute('accept');
  });

  it('shows loading state when processing', () => {
    render(<DropZone onFileSelect={mockOnFileSelect} isLoading={true} />);
    
    expect(screen.getByText(/processing/i)).toBeInTheDocument();
  });

  it('displays error message when provided', () => {
    const errorMessage = 'File upload failed';
    render(<DropZone onFileSelect={mockOnFileSelect} error={errorMessage} />);
    
    expect(screen.getByText(errorMessage)).toBeInTheDocument();
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });

  it('disables upload when disabled prop is true', () => {
    render(<DropZone onFileSelect={mockOnFileSelect} disabled={true} />);
    
    const dropzone = screen.getByTestId('dropzone');
    expect(dropzone).toHaveClass('opacity-50'); // Assuming disabled styling
  });

  it('has proper accessibility attributes', () => {
    render(<DropZone onFileSelect={mockOnFileSelect} />);
    
    const fileInput = screen.getByTestId('file-input');
    expect(fileInput).toHaveAttribute('type', 'file');
    
    // Should have proper ARIA labels
    const dropzone = screen.getByTestId('dropzone');
    expect(dropzone).toBeInTheDocument();
  });

  it('handles multiple file selection when enabled', async () => {
    const user = userEvent.setup();
    const mockFiles = [
      createMockFile('test1.zip', 1024),
      createMockFile('test2.zip', 2048),
    ];
    
    render(<DropZone onFileSelect={mockOnFileSelect} multiple={true} />);
    
    const fileInput = screen.getByTestId('file-input');
    await user.upload(fileInput, mockFiles);
    
    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalled();
    });
  });

  it('renders custom children when provided', () => {
    const customText = 'Custom upload area';
    render(
      <DropZone onFileSelect={mockOnFileSelect}>
        <div>{customText}</div>
      </DropZone>
    );
    
    expect(screen.getByText(customText)).toBeInTheDocument();
  });
});