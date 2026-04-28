'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Copy, Check, FileText, Sparkles, History } from 'lucide-react';
import Editor from '@monaco-editor/react';
import { useToast } from '@/lib/hooks/use-toast';
import { motion, AnimatePresence } from 'framer-motion';
import type { CoverLetterListItem } from '@/types/cover-letter';

interface CoverLetterTabProps {
  resumeId: string;
  jobId?: string;
  initialJobTitle?: string;
  initialCompany?: string;
  initialJobDescription?: string;
}

export function CoverLetterTab({
  resumeId,
  jobId,
  initialJobTitle = '',
  initialCompany = '',
  initialJobDescription = ''
}: CoverLetterTabProps) {
  const { toast } = useToast();
  
  // Form state
  const [jobTitle, setJobTitle] = useState(initialJobTitle);
  const [companyName, setCompanyName] = useState(initialCompany);
  const [jobDescription, setJobDescription] = useState(initialJobDescription);
  const [tone, setTone] = useState<'professional' | 'enthusiastic' | 'formal'>('professional');
  const [format, setFormat] = useState<'markdown' | 'latex'>('markdown');
  
  // Generation state
  const [content, setContent] = useState('');
  const [currentId, setCurrentId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // History state
  const [history, setHistory] = useState<CoverLetterListItem[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);

  // Load history on mount
  useEffect(() => {
    loadHistory();
  }, [resumeId]);

  // Sync with props if they change (e.g. user selects a different job)
  useEffect(() => {
    if (initialJobTitle) setJobTitle(initialJobTitle);
    if (initialCompany) setCompanyName(initialCompany);
    if (initialJobDescription) setJobDescription(initialJobDescription);
  }, [initialJobTitle, initialCompany, initialJobDescription]);

  const loadHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const response = await fetch(`/api/cover-letter/list?resumeId=${resumeId}`);
      const data = await response.json();
      if (data.success) {
        setHistory(data.data);
      }
    } catch (error) {
      console.error('Failed to load history:', error);
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleGenerate = async () => {
    // Validation
    if (!jobTitle.trim()) {
      toast({ title: 'Job title is required', variant: 'destructive' });
      return;
    }
    if (!companyName.trim()) {
      toast({ title: 'Company name is required', variant: 'destructive' });
      return;
    }
    if (!jobDescription.trim() || jobDescription.length < 50) {
      toast({ title: 'Please enter a valid job description (min 50 chars)', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    setContent(''); // Clear previous content
    setCurrentId(null);

    try {
      const response = await fetch('/api/cover-letter/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId,
          jobId,
          jobTitle: jobTitle.trim(),
          companyName: companyName.trim(),
          jobDescription: jobDescription.trim(),
          tone,
          format
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Generation failed');
      }

      if (data.success && data.data) {
        setContent(data.data.content);
        setCurrentId(data.data.id);
        toast({ title: '✨ Cover letter generated!', description: 'You can now edit or download it.' });
        loadHistory(); // Refresh history
      } else {
        throw new Error(data.error || 'Invalid response from server');
      }
    } catch (error) {
      console.error('Generation error:', error);
      toast({ 
        title: 'Generation failed', 
        description: error instanceof Error ? error.message : 'Please try again later.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!content) return;
    
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toast({ title: 'Copied to clipboard' });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({ title: 'Failed to copy', variant: 'destructive' });
    }
  };

  const handleDownload = () => {
    if (!content) return;

    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    
    const filename = `cover-letter-${companyName.toLowerCase().replace(/\s+/g, '-')}-${jobTitle.toLowerCase().replace(/\s+/g, '-')}`;
    a.download = `${filename}.${format === 'latex' ? 'tex' : 'md'}`;
    
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({ title: 'Download started' });
  };

  const handleSave = async () => {
    if (!currentId || !content) return;

    try {
      const response = await fetch(`/api/cover-letter/${currentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content })
      });

      const data = await response.json();

      if (data.success) {
        toast({ title: 'Changes saved' });
      } else {
        throw new Error(data.error);
      }
    } catch (error) {
      toast({ title: 'Failed to save', variant: 'destructive' });
    }
  };

  const loadHistoryItem = async (id: string) => {
    try {
      const response = await fetch(`/api/cover-letter/${id}`);
      const data = await response.json();

      if (data.success && data.data) {
        setContent(data.data.content);
        setCurrentId(data.data.id);
        setJobTitle(data.data.job_title || '');
        setCompanyName(data.data.company_name || '');
        setFormat(data.data.format);
        setTone(data.data.tone);
        toast({ title: 'Loaded from history' });
      }
    } catch (error) {
      toast({ title: 'Failed to load', variant: 'destructive' });
    }
  };

  const toneDescriptions = {
    professional: 'Balanced and confident - suitable for most applications',
    enthusiastic: 'Energetic and passionate - great for startups and creative roles',
    formal: 'Traditional and conservative - ideal for corporate and government positions'
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="generate" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="generate" className="flex items-center gap-2">
            <Sparkles className="h-4 w-4" />
            Generate New
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <History className="h-4 w-4" />
            History ({history.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="generate" className="space-y-6 mt-6">
          {/* Input Form */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Job Details
              </CardTitle>
              <CardDescription>
                Provide information about the position you're applying for
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="jobTitle">
                    Job Title <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="jobTitle"
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g., Senior Software Engineer"
                    disabled={isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="company">
                    Company Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="company"
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    placeholder="e.g., Google"
                    disabled={isGenerating}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="tone">Tone</Label>
                  <Select 
                    value={tone} 
                    onValueChange={(v: any) => setTone(v)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Professional</span>
                          <span className="text-xs text-muted-foreground">
                            Balanced and confident
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="enthusiastic">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Enthusiastic</span>
                          <span className="text-xs text-muted-foreground">
                            Energetic and passionate
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="formal">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Formal</span>
                          <span className="text-xs text-muted-foreground">
                            Traditional and conservative
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    {toneDescriptions[tone]}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="format">Format</Label>
                  <Select 
                    value={format} 
                    onValueChange={(v: any) => setFormat(v)}
                    disabled={isGenerating}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="markdown">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">Markdown</span>
                          <span className="text-xs text-muted-foreground">
                            Easy to edit and convert
                          </span>
                        </div>
                      </SelectItem>
                      <SelectItem value="latex">
                        <div className="flex flex-col items-start">
                          <span className="font-medium">LaTeX</span>
                          <span className="text-xs text-muted-foreground">
                            Professional typesetting
                          </span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="jobDesc">
                  Job Description <span className="text-red-500">*</span>
                </Label>
                <Textarea
                  id="jobDesc"
                  value={jobDescription}
                  onChange={(e) => setJobDescription(e.target.value)}
                  rows={8}
                  placeholder="Paste the complete job description here..."
                  disabled={isGenerating}
                  className="font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  {jobDescription.length} characters
                  {jobDescription.length > 0 && jobDescription.length < 50 && (
                    <span className="text-orange-500 ml-2">
                      (minimum 50 characters required)
                    </span>
                  )}
                </p>
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating with AI...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Cover Letter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Editor */}
          <AnimatePresence>
            {content && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle>Generated Cover Letter</CardTitle>
                        <CardDescription>
                          Edit the content below and save your changes
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        {currentId && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={handleSave}
                          >
                            Save Changes
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleCopy}
                        >
                          {copied ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={handleDownload}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Editor
                        height="600px"
                        language={format === 'latex' ? 'latex' : 'markdown'}
                        value={content}
                        onChange={(value) => setContent(value || '')}
                        theme="vs-dark"
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          wordWrap: 'on',
                          lineNumbers: 'on',
                          scrollBeyondLastLine: false,
                          automaticLayout: true,
                          tabSize: 2,
                          insertSpaces: true,
                          formatOnPaste: true,
                          formatOnType: true
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Previous Cover Letters</CardTitle>
              <CardDescription>
                View and reuse your previously generated cover letters
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No cover letters generated yet</p>
                  <p className="text-sm mt-2">
                    Generate your first cover letter using the form above
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {history.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => loadHistoryItem(item.id)}
                      className="w-full text-left p-4 border rounded-lg hover:bg-accent transition-colors"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium">
                            {item.job_title || 'Untitled'}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {item.company_name || 'No company'}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs px-2 py-1 bg-secondary rounded">
                            {item.format}
                          </span>
                          <p className="text-xs text-muted-foreground mt-1">
                            {new Date(item.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
