import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, userEvent, waitFor } from '@/test-utils';
import UploadPage from '@/pages/UploadPage';
import { mockApiClient, createMockFile, setupURLMock } from '@/test-utils';

// Mock components for integration test
vi.mock('react-dropzone', () => ({
  useDropzone: ({ onDrop, accept, maxSize }: any) => {
    const handleFileDrop = (files: File[]) => {
      if (onDrop) {
        onDrop(files);
      }
    };

    return {
      getRootProps: () => ({
        'data-testid': 'dropzone',
        onClick: vi.fn(),
      }),
      getInputProps: () => ({
        'data-testid': 'file-input',
        type: 'file',
        accept: Object.keys(accept || {}).join(','),
        onChange: (e: any) => {
          if (e.target.files) {
            handleFileDrop(Array.from(e.target.files));
          }
        },
      }),
      isDragActive: false,
      isDragReject: false,
      isDragAccept: false,
      acceptedFiles: [],
      rejectedFiles: [],
      fileRejections: [],
    };
  },
}));

// Mock framer-motion
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
  AnimatePresence: ({ children }: any) => children,
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    loading: vi.fn(),
    dismiss: vi.fn(),
  },
}));

describe('Upload Flow Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setupURLMock();
  });

  it('completes full upload and processing flow', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test-project.zip', 2 * 1024 * 1024); // 2MB

    // Mock API responses for complete flow
    const uploadResponse = {
      jobId: 'job-123',
      uploadUrl: 'https://s3.example.com/upload',
    };

    const jobStatusResponse = {
      id: 'job-123',
      status: 'PROCESSING',
      progress: 50,
      originalCodeSize: 1000,
      cleanedCodeSize: 800,
    };

    const completedJobResponse = {
      id: 'job-123',
      status: 'COMPLETED',
      progress: 100,
      downloadUrl: 'https://s3.example.com/download',
      originalCodeSize: 1000,
      cleanedCodeSize: 800,
      improvementPercentage: 20,
    };

    // Setup API mocks
    mockApiClient.post
      .mockResolvedValueOnce({ data: uploadResponse }) // Create job
      .mockResolvedValueOnce({ data: { success: true } }); // S3 upload

    mockApiClient.get
      .mockResolvedValueOnce({ data: jobStatusResponse }) // First status check
      .mockResolvedValueOnce({ data: completedJobResponse }); // Completed status

    render(<UploadPage />);

    // Step 1: File selection
    const fileInput = screen.getByTestId('file-input');
    await user.upload(fileInput, mockFile);

    // Should show file preview
    await waitFor(() => {
      expect(screen.getByText('test-project.zip')).toBeInTheDocument();
    });

    // Step 2: Start upload
    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    // Should create job and start upload
    await waitFor(() => {
      expect(mockApiClient.post).toHaveBeenCalledWith('/jobs', expect.objectContaining({
        fileName: 'test-project.zip',
        fileSize: 2 * 1024 * 1024,
      }));
    });

    // Step 3: Show upload progress
    await waitFor(() => {
      expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    });

    // Step 4: Processing status
    await waitFor(() => {
      expect(screen.getByText(/processing/i)).toBeInTheDocument();
      expect(screen.getByText('50%')).toBeInTheDocument();
    });

    // Step 5: Completion
    await waitFor(() => {
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
      expect(screen.getByText('20%')).toBeInTheDocument(); // Improvement percentage
    });

    // Should show download button
    expect(screen.getByRole('button', { name: /download/i })).toBeInTheDocument();

    // Verify all API calls were made
    expect(mockApiClient.post).toHaveBeenCalledTimes(2); // Create job + S3 upload
    expect(mockApiClient.get).toHaveBeenCalledTimes(2); // Status checks
  });

  it('handles upload errors gracefully', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test-project.zip', 2 * 1024 * 1024);

    // Mock API failure
    mockApiClient.post.mockRejectedValueOnce(new Error('Upload failed'));

    render(<UploadPage />);

    // Upload file
    const fileInput = screen.getByTestId('file-input');
    await user.upload(fileInput, mockFile);

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    // Should show error message
    await waitFor(() => {
      expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
    });

    // Should allow retry
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('validates file size and type', async () => {
    const user = userEvent.setup();
    
    render(<UploadPage />);

    // Test oversized file
    const largeFile = createMockFile('large.zip', 100 * 1024 * 1024); // 100MB
    const fileInput = screen.getByTestId('file-input');
    
    await user.upload(fileInput, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/file too large/i)).toBeInTheDocument();
    });

    // Upload button should be disabled
    const uploadButton = screen.getByRole('button', { name: /upload/i });
    expect(uploadButton).toBeDisabled();
  });

  it('handles processing timeouts', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test-project.zip', 2 * 1024 * 1024);

    // Mock successful upload but processing timeout
    const uploadResponse = {
      jobId: 'job-123',
      uploadUrl: 'https://s3.example.com/upload',
    };

    const timeoutJobResponse = {
      id: 'job-123',
      status: 'FAILED',
      error: 'Processing timeout',
    };

    mockApiClient.post
      .mockResolvedValueOnce({ data: uploadResponse })
      .mockResolvedValueOnce({ data: { success: true } });

    mockApiClient.get.mockResolvedValueOnce({ data: timeoutJobResponse });

    render(<UploadPage />);

    const fileInput = screen.getByTestId('file-input');
    await user.upload(fileInput, mockFile);

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    // Should show timeout error
    await waitFor(() => {
      expect(screen.getByText(/processing timeout/i)).toBeInTheDocument();
    });

    // Should offer retry option
    expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
  });

  it('displays real-time progress updates', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test-project.zip', 2 * 1024 * 1024);

    const uploadResponse = {
      jobId: 'job-123',
      uploadUrl: 'https://s3.example.com/upload',
    };

    // Mock progressive status updates
    mockApiClient.post
      .mockResolvedValueOnce({ data: uploadResponse })
      .mockResolvedValueOnce({ data: { success: true } });

    mockApiClient.get
      .mockResolvedValueOnce({ 
        data: { id: 'job-123', status: 'PROCESSING', progress: 25 }
      })
      .mockResolvedValueOnce({ 
        data: { id: 'job-123', status: 'PROCESSING', progress: 75 }
      })
      .mockResolvedValueOnce({ 
        data: { id: 'job-123', status: 'COMPLETED', progress: 100 }
      });

    render(<UploadPage />);

    const fileInput = screen.getByTestId('file-input');
    await user.upload(fileInput, mockFile);

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    // Should show progressive updates
    await waitFor(() => {
      expect(screen.getByText('25%')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('75%')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('100%')).toBeInTheDocument();
    });
  });

  it('supports multiple upload profiles', async () => {
    const user = userEvent.setup();
    const mockFile = createMockFile('test-project.zip', 2 * 1024 * 1024);

    render(<UploadPage />);

    // Upload file
    const fileInput = screen.getByTestId('file-input');
    await user.upload(fileInput, mockFile);

    // Should show profile selector
    expect(screen.getByText(/cleaning profile/i)).toBeInTheDocument();
    
    // Select different profile
    const profileSelect = screen.getByRole('combobox', { name: /profile/i });
    await user.selectOptions(profileSelect, 'aggressive');

    // Profile selection should be reflected in upload
    const uploadButton = screen.getByRole('button', { name: /upload/i });
    expect(uploadButton).toBeEnabled();
  });

  it('handles concurrent uploads properly', async () => {
    const user = userEvent.setup();
    
    render(<UploadPage />);

    // Upload first file
    const mockFile1 = createMockFile('project1.zip', 1024 * 1024);
    const fileInput = screen.getByTestId('file-input');
    await user.upload(fileInput, mockFile1);

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    // Should prevent second upload while first is in progress
    await waitFor(() => {
      expect(screen.getByText(/upload in progress/i)).toBeInTheDocument();
    });

    // File input should be disabled
    expect(fileInput).toBeDisabled();
  });
});