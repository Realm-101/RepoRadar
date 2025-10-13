import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import { 
  Code, FileCode, GitBranch, AlertTriangle, CheckCircle, 
  XCircle, Info, Lightbulb, Shield, Zap, Clock, 
  TrendingUp, Bug, Lock, Sparkles, FileText, Search, ExternalLink, Loader2
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface CodeIssue {
  type: 'error' | 'warning' | 'suggestion' | 'security';
  severity: 'critical' | 'high' | 'medium' | 'low';
  line: number;
  column: number;
  message: string;
  suggestion?: string;
  file: string;
  category: string;
}

interface ReviewResult {
  overallScore: number;
  codeQuality: number;
  security: number;
  performance: number;
  maintainability: number;
  testCoverage: number;
  issues: CodeIssue[];
  suggestions: string[];
  positives: string[];
  metrics: {
    linesOfCode: number;
    complexity: number;
    duplications: number;
    technicalDebt: string;
  };
}

export default function CodeReview() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [repoUrl, setRepoUrl] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [reviewResult, setReviewResult] = useState<ReviewResult | null>(null);
  const [activeTab, setActiveTab] = useState("repository");
  const [viewCodeDialog, setViewCodeDialog] = useState<{
    open: boolean;
    content?: string;
    filePath?: string;
    line?: number;
    fileUrl?: string;
  }>({ open: false });
  
  // Get GitHub token from user profile
  const githubToken = (user as any)?.githubToken || "";

  const reviewMutation = useMutation({
    mutationFn: async (data: { type: string; content: string; githubToken?: string }) => {
      const response = await fetch('/api/code-review/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to analyze code');
      }
      
      return await response.json();
    },
    onSuccess: (data) => {
      setReviewResult(data);
      toast({ 
        title: "Code review completed", 
        description: `Found ${data.issues.length} issues to address` 
      });
    },
    onError: (error: Error) => {
      console.error('[Code Review] Error:', error);
      toast({ 
        title: "Review failed", 
        description: error.message || "Unable to complete code review",
        variant: "destructive" 
      });
    },
  });

  const viewCodeMutation = useMutation({
    mutationFn: async (data: { repoUrl: string; filePath: string; line?: number; githubToken?: string }) => {
      const response = await fetch('/api/code-review/view-code', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to fetch code');
      }
      
      return await response.json();
    },
    onSuccess: (data: any) => {
      setViewCodeDialog({
        open: true,
        content: data.content,
        filePath: data.filePath,
        line: data.line,
        fileUrl: data.fileUrl
      });
    },
    onError: () => {
      toast({
        title: "Failed to load code",
        description: "Unable to fetch file content from GitHub",
        variant: "destructive"
      });
    }
  });

  const createFixMutation = useMutation({
    mutationFn: async (data: {
      repoUrl: string;
      filePath: string;
      line?: number;
      issue: string;
      suggestion?: string;
      githubToken: string;
    }) => {
      const response = await fetch('/api/code-review/create-fix', {
        method: 'POST',
        body: JSON.stringify(data),
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw error;
      }
      
      return await response.json();
    },
    onSuccess: (data: any) => {
      toast({
        title: "Pull request created!",
        description: (
          <div className="flex flex-col gap-2">
            <p>AI-generated fix has been submitted as PR #{data.pullRequest.number}</p>
            <a 
              href={data.pullRequest.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline flex items-center gap-1"
            >
              View on GitHub <ExternalLink className="h-3 w-3" />
            </a>
          </div>
        )
      });
    },
    onError: (error: any) => {
      const message = error?.requiresAuth 
        ? "Please provide a GitHub token to create pull requests"
        : "Failed to create pull request";
      
      toast({
        title: "Error",
        description: message,
        variant: "destructive"
      });
    }
  });

  const startReview = () => {
    if (activeTab === "repository" && repoUrl) {
      reviewMutation.mutate({ 
        type: "repository", 
        content: repoUrl,
        githubToken: githubToken || undefined
      });
    } else if (activeTab === "snippet" && codeSnippet) {
      reviewMutation.mutate({ 
        type: "snippet", 
        content: codeSnippet 
      });
    }
  };

  const handleViewCode = (issue: CodeIssue) => {
    if (!repoUrl) {
      toast({
        title: "Repository URL required",
        description: "Please analyze a repository first",
        variant: "destructive"
      });
      return;
    }
    
    viewCodeMutation.mutate({
      repoUrl,
      filePath: issue.file,
      line: issue.line,
      githubToken: githubToken || undefined
    });
  };

  const handleCreateFix = (issue: CodeIssue) => {
    if (!repoUrl) {
      toast({
        title: "Repository URL required",
        description: "Please analyze a repository first",
        variant: "destructive"
      });
      return;
    }

    if (!githubToken) {
      toast({
        title: "GitHub token required",
        description: "Please provide a GitHub personal access token to create pull requests",
        variant: "destructive"
      });
      return;
    }
    
    createFixMutation.mutate({
      repoUrl,
      filePath: issue.file,
      line: issue.line,
      issue: issue.message,
      suggestion: issue.suggestion,
      githubToken
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-100';
      case 'high': return 'text-orange-600 bg-orange-100';
      case 'medium': return 'text-yellow-600 bg-yellow-100';
      case 'low': return 'text-blue-600 bg-blue-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'error': return <XCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'suggestion': return <Lightbulb className="h-4 w-4" />;
      case 'security': return <Shield className="h-4 w-4" />;
      default: return <Info className="h-4 w-4" />;
    }
  };

  return (
    <div className="container mx-auto p-6 pt-32 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          AI-Powered Code Review
        </h1>
        <p className="text-muted-foreground">
          Get comprehensive code analysis with AI-driven insights and recommendations
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Start Review</CardTitle>
              <CardDescription>
                Analyze a repository or code snippet
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="repository">Repository</TabsTrigger>
                  <TabsTrigger value="snippet">Code Snippet</TabsTrigger>
                </TabsList>
                
                <TabsContent value="repository" className="space-y-4">
                  <div>
                    <Label htmlFor="repo-url">Repository URL</Label>
                    <Input
                      id="repo-url"
                      type="url"
                      placeholder="https://github.com/user/repo"
                      value={repoUrl}
                      onChange={(e) => setRepoUrl(e.target.value)}
                    />
                  </div>
                  {githubToken ? (
                    <Alert>
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <AlertDescription>
                        GitHub token configured. You can view code and create pull requests.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        Add a GitHub token in your{" "}
                        <Link href="/profile">
                          <span className="text-blue-500 hover:underline cursor-pointer">
                            profile settings
                          </span>
                        </Link>
                        {" "}to enable "View Code" and "Create Fix" features.
                      </AlertDescription>
                    </Alert>
                  )}
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Enter a public GitHub repository URL for comprehensive analysis
                    </AlertDescription>
                  </Alert>
                </TabsContent>
                
                <TabsContent value="snippet" className="space-y-4">
                  <div>
                    <Label htmlFor="code">Code Snippet</Label>
                    <Textarea
                      id="code"
                      placeholder="Paste your code here..."
                      value={codeSnippet}
                      onChange={(e) => setCodeSnippet(e.target.value)}
                      className="h-64 font-mono text-sm"
                    />
                  </div>
                  <Alert>
                    <Info className="h-4 w-4" />
                    <AlertDescription>
                      Paste code for quick analysis and suggestions
                    </AlertDescription>
                  </Alert>
                </TabsContent>
              </Tabs>
              
              <Button 
                className="w-full mt-4"
                onClick={startReview}
                disabled={reviewMutation.isPending || (!repoUrl && !codeSnippet)}
              >
                {reviewMutation.isPending ? (
                  <>
                    <Clock className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 mr-2" />
                    Start AI Review
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {reviewResult && (
            <Card className="mt-6">
              <CardHeader>
                <CardTitle>Review Metrics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Overall Score</span>
                    <span className="font-bold">{reviewResult.overallScore}/100</span>
                  </div>
                  <Progress value={reviewResult.overallScore} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Code Quality</span>
                    <span className="font-bold">{reviewResult.codeQuality}/100</span>
                  </div>
                  <Progress value={reviewResult.codeQuality} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Security</span>
                    <span className="font-bold">{reviewResult.security}/100</span>
                  </div>
                  <Progress value={reviewResult.security} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Performance</span>
                    <span className="font-bold">{reviewResult.performance}/100</span>
                  </div>
                  <Progress value={reviewResult.performance} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Maintainability</span>
                    <span className="font-bold">{reviewResult.maintainability}/100</span>
                  </div>
                  <Progress value={reviewResult.maintainability} />
                </div>
                <div>
                  <div className="flex justify-between mb-1">
                    <span className="text-sm">Test Coverage</span>
                    <span className="font-bold">{reviewResult.testCoverage}%</span>
                  </div>
                  <Progress value={reviewResult.testCoverage} />
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="lg:col-span-2">
          {reviewResult ? (
            <Tabs defaultValue="issues" className="space-y-4">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="issues">
                  Issues ({reviewResult.issues.length})
                </TabsTrigger>
                <TabsTrigger value="suggestions">Suggestions</TabsTrigger>
                <TabsTrigger value="positives">Positives</TabsTrigger>
                <TabsTrigger value="metrics">Metrics</TabsTrigger>
              </TabsList>

              <TabsContent value="issues">
                <Card>
                  <CardHeader>
                    <CardTitle>Code Issues</CardTitle>
                    <CardDescription>
                      Problems and improvements found in your code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[600px]">
                      <Accordion type="single" collapsible className="space-y-2">
                        {reviewResult.issues.map((issue, index) => (
                          <AccordionItem key={index} value={`issue-${index}`}>
                            <AccordionTrigger>
                              <div className="flex items-center gap-3 text-left">
                                {getTypeIcon(issue.type)}
                                <div className="flex-1">
                                  <div className="font-medium">{issue.message}</div>
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge className={getSeverityColor(issue.severity)}>
                                      {issue.severity}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                      {issue.file}:{issue.line}:{issue.column}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="space-y-3 pt-3">
                                <div>
                                  <p className="text-sm font-medium mb-1">Category</p>
                                  <Badge variant="outline">{issue.category}</Badge>
                                </div>
                                {issue.suggestion && (
                                  <div>
                                    <p className="text-sm font-medium mb-1">Suggestion</p>
                                    <p className="text-sm text-muted-foreground">
                                      {issue.suggestion}
                                    </p>
                                  </div>
                                )}
                                <div className="flex gap-2">
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleViewCode(issue)}
                                    disabled={viewCodeMutation.isPending}
                                  >
                                    {viewCodeMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <FileCode className="h-4 w-4 mr-2" />
                                    )}
                                    View Code
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="outline"
                                    onClick={() => handleCreateFix(issue)}
                                    disabled={createFixMutation.isPending || !githubToken}
                                  >
                                    {createFixMutation.isPending ? (
                                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    ) : (
                                      <GitBranch className="h-4 w-4 mr-2" />
                                    )}
                                    Create Fix
                                  </Button>
                                </div>
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="suggestions">
                <Card>
                  <CardHeader>
                    <CardTitle>AI Recommendations</CardTitle>
                    <CardDescription>
                      Suggestions to improve your codebase
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reviewResult.suggestions.map((suggestion, index) => (
                        <Alert key={index}>
                          <Lightbulb className="h-4 w-4" />
                          <AlertDescription>{suggestion}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="positives">
                <Card>
                  <CardHeader>
                    <CardTitle>What's Working Well</CardTitle>
                    <CardDescription>
                      Positive aspects of your code
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {reviewResult.positives.map((positive, index) => (
                        <Alert key={index}>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <AlertDescription>{positive}</AlertDescription>
                        </Alert>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="metrics">
                <Card>
                  <CardHeader>
                    <CardTitle>Code Metrics</CardTitle>
                    <CardDescription>
                      Detailed metrics about your codebase
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Lines of Code</span>
                        </div>
                        <p className="text-2xl font-bold">
                          {reviewResult.metrics.linesOfCode.toLocaleString()}
                        </p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Zap className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Complexity</span>
                        </div>
                        <p className="text-2xl font-bold">{reviewResult.metrics.complexity}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Bug className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Code Duplications</span>
                        </div>
                        <p className="text-2xl font-bold">{reviewResult.metrics.duplications}</p>
                      </div>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-muted-foreground" />
                          <span className="text-sm font-medium">Technical Debt</span>
                        </div>
                        <p className="text-2xl font-bold">{reviewResult.metrics.technicalDebt}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          ) : (
            <Card className="h-full flex items-center justify-center">
              <CardContent className="text-center py-16">
                <Code className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Review Yet</h3>
                <p className="text-muted-foreground">
                  Enter a repository URL or code snippet to start the AI-powered review
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Code Viewer Dialog */}
      <Dialog open={viewCodeDialog.open} onOpenChange={(open) => setViewCodeDialog({ open })}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center justify-between">
              <span>{viewCodeDialog.filePath}</span>
              {viewCodeDialog.fileUrl && (
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                >
                  <a
                    href={viewCodeDialog.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2"
                  >
                    <ExternalLink className="h-4 w-4" />
                    View on GitHub
                  </a>
                </Button>
              )}
            </DialogTitle>
            {viewCodeDialog.line && (
              <DialogDescription>
                Line {viewCodeDialog.line}
              </DialogDescription>
            )}
          </DialogHeader>
          <ScrollArea className="h-[60vh] w-full rounded-md border">
            <pre className="p-4 text-sm">
              <code className="language-javascript">
                {viewCodeDialog.content?.split('\n').map((line, idx) => (
                  <div
                    key={idx}
                    className={`${
                      viewCodeDialog.line && idx + 1 === viewCodeDialog.line
                        ? 'bg-yellow-100 dark:bg-yellow-900/20'
                        : ''
                    }`}
                  >
                    <span className="inline-block w-12 text-right pr-4 text-muted-foreground select-none">
                      {idx + 1}
                    </span>
                    {line}
                  </div>
                ))}
              </code>
            </pre>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  );
}