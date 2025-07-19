import React, { useState } from 'react';
import { useRouter } from 'next/router';
import Head from 'next/head';
import Link from 'next/link';
import { ArrowLeft, Info } from 'lucide-react';
import { {{pascalCase name}}Upload } from '@/components/{{pascalCase name}}Upload';
import { {{pascalCase name}}Status } from '@/components/{{pascalCase name}}Status';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';

export default function {{pascalCase name}}Page() {
  const router = useRouter();
  const { toast } = useToast();
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('upload');

  // Check for job ID in URL params
  React.useEffect(() => {
    const { jobId } = router.query;
    if (jobId && typeof jobId === 'string') {
      setCurrentJobId(jobId);
      setActiveTab('status');
    }
  }, [router.query]);

  const handleUploadSuccess = (jobId: string) => {
    setCurrentJobId(jobId);
    setActiveTab('status');
    
    // Update URL without navigation
    router.push(
      {
        pathname: router.pathname,
        query: { jobId },
      },
      undefined,
      { shallow: true }
    );

    toast({
      title: 'Upload successful!',
      description: 'Your file is being processed.',
    });
  };

  const handleUploadError = (error: Error) => {
    toast({
      title: 'Upload failed',
      description: error.message,
      variant: 'destructive',
    });
  };

  const handleJobComplete = (result: any) => {
    toast({
      title: 'Processing complete!',
      description: 'Your results are ready for download.',
    });
  };

  const handleRetry = () => {
    setCurrentJobId(null);
    setActiveTab('upload');
    router.push(router.pathname, undefined, { shallow: true });
  };

  return (
    <>
      <Head>
        <title>{{pageTitle}} | FinishThisIdea</title>
        <meta name="description" content="{{pageDescription}}" />
      </Head>

      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <header className="bg-white border-b">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/services">
                  <Button variant="ghost" size="sm">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Services
                  </Button>
                </Link>
                <h1 className="text-2xl font-bold">{{pageTitle}}</h1>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm text-gray-500">Price:</span>
                <span className="text-lg font-semibold">${{basePrice}}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Main content */}
        <main className="container mx-auto px-4 py-8">
          {/* Service description */}
          <Alert className="mb-8">
            <Info className="h-4 w-4" />
            <AlertDescription>
              {{serviceDescription}}
            </AlertDescription>
          </Alert>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full max-w-2xl mx-auto grid-cols-2 mb-8">
              <TabsTrigger value="upload">Upload</TabsTrigger>
              <TabsTrigger value="status" disabled={!currentJobId}>
                Status {currentJobId && '✓'}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upload">
              <{{pascalCase name}}Upload
                onSuccess={handleUploadSuccess}
                onError={handleUploadError}
              />
            </TabsContent>

            <TabsContent value="status">
              {currentJobId && (
                <{{pascalCase name}}Status
                  jobId={currentJobId}
                  onComplete={handleJobComplete}
                  onRetry={handleRetry}
                />
              )}
            </TabsContent>
          </Tabs>

          {/* Features */}
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">What's Included</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {{#each features}}
              <div className="flex space-x-3">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-green-100 text-green-600 flex items-center justify-center">
                  ✓
                </div>
                <div>
                  <h3 className="font-medium">{{this.title}}</h3>
                  <p className="text-sm text-gray-500">{{this.description}}</p>
                </div>
              </div>
              {{/each}}
            </div>
          </div>

          {/* FAQ */}
          {{#if hasFAQ}}
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Frequently Asked Questions</h2>
            <div className="space-y-4">
              {{#each faq}}
              <details className="bg-white rounded-lg p-4 border">
                <summary className="font-medium cursor-pointer">{{this.question}}</summary>
                <p className="mt-2 text-gray-600">{{this.answer}}</p>
              </details>
              {{/each}}
            </div>
          </div>
          {{/if}}

          {/* Examples */}
          {{#if hasExamples}}
          <div className="mt-12 max-w-4xl mx-auto">
            <h2 className="text-xl font-semibold mb-6">Examples</h2>
            <div className="grid md:grid-cols-2 gap-6">
              {{#each examples}}
              <div className="bg-white rounded-lg p-6 border">
                <h3 className="font-medium mb-2">{{this.title}}</h3>
                <div className="space-y-2">
                  <div>
                    <span className="text-sm text-gray-500">Before:</span>
                    <pre className="mt-1 p-2 bg-gray-50 rounded text-xs overflow-auto">{{this.before}}</pre>
                  </div>
                  <div>
                    <span className="text-sm text-gray-500">After:</span>
                    <pre className="mt-1 p-2 bg-green-50 rounded text-xs overflow-auto">{{this.after}}</pre>
                  </div>
                </div>
              </div>
              {{/each}}
            </div>
          </div>
          {{/if}}
        </main>
      </div>
    </>
  );
}