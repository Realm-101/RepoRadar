import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Header } from "@/components/layout/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  User, Settings, Bookmark, Tag, FolderOpen, Brain, 
  Plus, Trash2, Edit, Star, GitBranch, Calendar, 
  TrendingUp, Code, Package, Sparkles, Lock, Crown, Upload, Camera, Key
} from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";
import { restartTour } from "@/components/onboarding-tour";

export default function Profile() {
  const { user, isLoading: authLoading, refetchUser } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#FF6B35");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newCollectionDescription, setNewCollectionDescription] = useState("");
  
  // Basic profile editing states
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [firstName, setFirstName] = useState(user?.firstName || "");
  const [lastName, setLastName] = useState(user?.lastName || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [profileImageUrl, setProfileImageUrl] = useState(user?.profileImageUrl || "");
  const [githubToken, setGithubToken] = useState((user as any)?.githubToken || "");
  
  // Password change states
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Check if user has Pro or Enterprise subscription
  const isPremium = user?.subscriptionTier === 'pro' || user?.subscriptionTier === 'enterprise';
  
  // Update local state when user data changes
  useEffect(() => {
    if (user) {
      setFirstName(user.firstName || "");
      setLastName(user.lastName || "");
      setBio((user as any).bio || "");
      setProfileImageUrl(user.profileImageUrl || "");
      setGithubToken((user as any).githubToken || "");
    }
  }, [user]);

  // Fetch user preferences
  const { data: preferences, isLoading: preferencesLoading } = useQuery<any>({
    queryKey: ['/api/user/preferences'],
    enabled: isPremium,
    retry: false,
  });

  // Fetch bookmarks
  const { data: bookmarks = [] } = useQuery<any[]>({
    queryKey: ['/api/user/bookmarks'],
    enabled: isPremium,
    retry: false,
  });

  // Fetch tags
  const { data: tags = [] } = useQuery<any[]>({
    queryKey: ['/api/user/tags'],
    enabled: isPremium,
    retry: false,
  });

  // Fetch collections
  const { data: collections = [] } = useQuery<any[]>({
    queryKey: ['/api/user/collections'],
    enabled: isPremium,
    retry: false,
  });

  // Fetch AI recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery<any>({
    queryKey: ['/api/user/recommendations'],
    enabled: isPremium && preferences?.aiRecommendations !== false,
    retry: false,
  });

  // Update preferences mutation
  const updatePreferencesMutation = useMutation({
    mutationFn: async (prefs: any) => {
      return await apiRequest('PUT', '/api/user/preferences', prefs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/preferences'] });
      toast({
        title: "Preferences Updated",
        description: "Your preferences have been saved successfully.",
      });
    },
  });

  // Create tag mutation
  const createTagMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/user/tags', {
        name: newTagName,
        color: newTagColor,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/tags'] });
      setNewTagName("");
      toast({
        title: "Tag Created",
        description: "Your new tag has been created successfully.",
      });
    },
  });

  // Create collection mutation
  const createCollectionMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/user/collections', {
        name: newCollectionName,
        description: newCollectionDescription,
        icon: "folder",
        color: "#FF6B35",
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/collections'] });
      setNewCollectionName("");
      setNewCollectionDescription("");
      toast({
        title: "Collection Created",
        description: "Your new collection has been created successfully.",
      });
    },
  });
  
  // Update profile mutation
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { firstName: string; lastName: string; bio: string; profileImageUrl: string; githubToken?: string }) => {
      const response = await apiRequest('PUT', '/api/user/profile', data);
      return await response.json();
    },
    onSuccess: async (updatedUser) => {
      // Refetch user data from the auth context
      await refetchUser();
      
      // Invalidate any other queries that might cache user data
      queryClient.invalidateQueries({ queryKey: ['/api/auth/user'] });
      
      setIsEditingProfile(false);
      toast({
        title: "Profile Updated",
        description: "Your profile has been updated successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Update Failed",
        description: error.message || "Failed to update profile",
        variant: "destructive",
      });
    },
  });
  
  // Change password mutation
  const changePasswordMutation = useMutation({
    mutationFn: async (data: { currentPassword: string; newPassword: string }) => {
      return await apiRequest('POST', '/api/user/change-password', data);
    },
    onSuccess: () => {
      setIsChangingPassword(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toast({
        title: "Password Changed",
        description: "Your password has been changed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Password Change Failed",
        description: error.message || "Failed to change password",
        variant: "destructive",
      });
    },
  });
  
  const handleProfileUpdate = () => {
    updateProfileMutation.mutate({
      firstName,
      lastName,
      bio,
      profileImageUrl,
      githubToken: githubToken || undefined,
    });
  };
  
  const handlePasswordChange = () => {
    if (newPassword !== confirmPassword) {
      toast({
        title: "Password Mismatch",
        description: "New password and confirmation do not match",
        variant: "destructive",
      });
      return;
    }
    
    if (newPassword.length < 8) {
      toast({
        title: "Password Too Short",
        description: "Password must be at least 8 characters long",
        variant: "destructive",
      });
      return;
    }
    
    changePasswordMutation.mutate({
      currentPassword,
      newPassword,
    });
  };

  // Remove bookmark mutation
  const removeBookmarkMutation = useMutation({
    mutationFn: async (repositoryId: string) => {
      return await apiRequest('DELETE', `/api/user/bookmarks/${repositoryId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/user/bookmarks'] });
      toast({
        title: "Bookmark Removed",
        description: "Repository has been removed from your bookmarks.",
      });
    },
  });

  if (authLoading || preferencesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
      </div>
    );
  }

  // Redirect to sign-in if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to view your profile.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/handler/sign-in";
      }, 500);
    }
  }, [user, authLoading, toast]);

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <div className="container mx-auto px-4 py-8 pt-32">
        <div className="max-w-7xl mx-auto">
        {/* User Header */}
        <Card className="mb-8 bg-gradient-to-r from-primary/10 to-primary/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                {profileImageUrl ? (
                  <img 
                    src={profileImageUrl} 
                    alt={firstName || "Profile"} 
                    className="w-20 h-20 rounded-full object-cover border-4 border-primary/20"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center">
                    <User className="w-10 h-10 text-primary" />
                  </div>
                )}
                {isEditingProfile && (
                  <Button
                    size="sm"
                    variant="secondary"
                    className="absolute -bottom-2 -right-2 rounded-full w-8 h-8 p-0"
                    onClick={() => {
                      const url = prompt("Enter profile image URL:");
                      if (url) setProfileImageUrl(url);
                    }}
                  >
                    <Camera className="w-4 h-4" />
                  </Button>
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h1 className="text-3xl font-bold">
                    {firstName} {lastName}
                  </h1>
                  {user?.subscriptionTier && user.subscriptionTier !== 'free' && (
                    <Badge variant="default">
                      {user.subscriptionTier === 'enterprise' ? 'Enterprise' : user.subscriptionTier === 'pro' ? 'Pro' : 'Free'}
                    </Badge>
                  )}
                </div>
                <p className="text-muted-foreground">{user?.email}</p>
                {((user as any)?.bio || bio) && !isEditingProfile && (
                  <p className="text-sm mt-2 text-muted-foreground">{(user as any)?.bio || bio}</p>
                )}
                <div className="flex gap-4 mt-2 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-4 h-4" />
                    Member since {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                  {isPremium && (
                    <>
                      <span className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {bookmarks.length} Bookmarks
                      </span>
                      <span className="flex items-center gap-1">
                        <FolderOpen className="w-4 h-4" />
                        {collections.length} Collections
                      </span>
                    </>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant={isEditingProfile ? "default" : "outline"}
                  size="sm"
                  onClick={() => {
                    if (isEditingProfile) {
                      handleProfileUpdate();
                    } else {
                      setIsEditingProfile(true);
                    }
                  }}
                  disabled={updateProfileMutation.isPending}
                  className="gap-2"
                >
                  <Edit className="w-4 h-4" />
                  {isEditingProfile ? "Save Profile" : "Edit Profile"}
                </Button>
                {isEditingProfile && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingProfile(false);
                      setFirstName(user?.firstName || "");
                      setLastName(user?.lastName || "");
                      setBio((user as any)?.bio || "");
                      setProfileImageUrl(user?.profileImageUrl || "");
                    }}
                  >
                    Cancel
                  </Button>
                )}
              </div>
            </div>
            
            {isEditingProfile && (
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">First Name</Label>
                  <Input
                    id="firstName"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    placeholder="First name"
                  />
                </div>
                <div>
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input
                    id="lastName"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    placeholder="Last name"
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="bio">Bio</Label>
                  <Textarea
                    id="bio"
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    placeholder="Tell us about yourself..."
                    rows={3}
                  />
                </div>
                <div className="col-span-2">
                  <Label htmlFor="githubToken" className="flex items-center gap-2">
                    <Key className="h-4 w-4" />
                    GitHub Personal Access Token
                  </Label>
                  <Input
                    id="githubToken"
                    type="password"
                    value={githubToken}
                    onChange={(e) => setGithubToken(e.target.value)}
                    placeholder="ghp_xxxxxxxxxxxx"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Used for Code Review features. Get one from{" "}
                    <a 
                      href="https://github.com/settings/tokens" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:underline"
                    >
                      GitHub Settings
                    </a>
                    {" "}(requires 'repo' scope)
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Subscription Status Card */}
        <Card className="mb-6 border-2 border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Crown className="h-5 w-5" />
                Subscription Details
              </span>
              <Link href="/pricing">
                <Button variant="outline" size="sm">
                  Manage Subscription
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted-foreground">Current Plan</p>
                <p className="text-lg font-semibold capitalize">
                  {user?.subscriptionTier || 'Free'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className="text-lg font-semibold">
                  {user?.subscriptionStatus === 'active' ? (
                    <span className="text-green-500">Active</span>
                  ) : user?.subscriptionStatus === 'past_due' ? (
                    <span className="text-orange-500">Past Due</span>
                  ) : user?.subscriptionStatus === 'cancelled' ? (
                    <span className="text-red-500">Cancelled</span>
                  ) : (
                    <span className="text-gray-500">Active</span>
                  )}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Daily Analyses</p>
                <p className="text-lg font-semibold">
                  {user?.subscriptionTier === 'enterprise' ? 'Unlimited' : user?.subscriptionTier === 'pro' ? '50 per day' : 'Unlimited'}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">API Access</p>
                <p className="text-lg font-semibold">
                  {user?.subscriptionTier === 'enterprise' ? '10K/hour' : '1K/hour'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Tabs */}
        <Tabs defaultValue="settings" className="space-y-6">
          <TabsList className={`grid w-full ${isPremium ? 'grid-cols-6' : 'grid-cols-2'}`}>
            <TabsTrigger value="settings" className="gap-2">
              <User className="w-4 h-4" />
              My Profile
            </TabsTrigger>
            {isPremium ? (
              <>
                <TabsTrigger value="recommendations" className="gap-2">
                  <Brain className="w-4 h-4" />
                  AI Recommendations
                </TabsTrigger>
                <TabsTrigger value="bookmarks" className="gap-2">
                  <Bookmark className="w-4 h-4" />
                  Bookmarks
                </TabsTrigger>
                <TabsTrigger value="collections" className="gap-2">
                  <FolderOpen className="w-4 h-4" />
                  Collections
                </TabsTrigger>
                <TabsTrigger value="tags" className="gap-2">
                  <Tag className="w-4 h-4" />
                  Tags
                </TabsTrigger>
                <TabsTrigger value="preferences" className="gap-2">
                  <Sparkles className="w-4 h-4" />
                  AI Preferences
                </TabsTrigger>
              </>
            ) : (
              <TabsTrigger value="intelligent" className="gap-2">
                <Brain className="w-4 h-4" />
                Intelligent Profile
                <Lock className="w-3 h-3 ml-1" />
              </TabsTrigger>
            )}
          </TabsList>
          
          {/* Settings Tab (Basic Profile) */}
          <TabsContent value="settings">
            <div className="grid gap-6">
              {/* Account Information */}
              <Card>
                <CardHeader>
                  <CardTitle>Account Information</CardTitle>
                  <CardDescription>
                    Manage your account details and email address
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Email Address</Label>
                    <Input value={user?.email || ""} disabled className="bg-muted" />
                    <p className="text-xs text-muted-foreground mt-1">
                      Contact support to change your email address
                    </p>
                  </div>
                  <div>
                    <Label>Account ID</Label>
                    <Input value={user?.id || ""} disabled className="bg-muted font-mono text-xs" />
                  </div>
                </CardContent>
              </Card>
              
              {/* Password Management */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="w-5 h-5" />
                    Password & Security
                  </CardTitle>
                  <CardDescription>
                    Change your password to keep your account secure
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Dialog open={isChangingPassword} onOpenChange={setIsChangingPassword}>
                    <DialogTrigger asChild>
                      <Button variant="outline" className="gap-2">
                        <Key className="w-4 h-4" />
                        Change Password
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Change Password</DialogTitle>
                        <DialogDescription>
                          Enter your current password and choose a new one
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="currentPassword">Current Password</Label>
                          <Input
                            id="currentPassword"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            placeholder="Enter current password"
                          />
                        </div>
                        <div>
                          <Label htmlFor="newPassword">New Password</Label>
                          <Input
                            id="newPassword"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            placeholder="Enter new password (min 8 characters)"
                          />
                        </div>
                        <div>
                          <Label htmlFor="confirmPassword">Confirm New Password</Label>
                          <Input
                            id="confirmPassword"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Confirm new password"
                          />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button
                          variant="outline"
                          onClick={() => {
                            setIsChangingPassword(false);
                            setCurrentPassword("");
                            setNewPassword("");
                            setConfirmPassword("");
                          }}
                        >
                          Cancel
                        </Button>
                        <Button
                          onClick={handlePasswordChange}
                          disabled={changePasswordMutation.isPending || !currentPassword || !newPassword || !confirmPassword}
                        >
                          {changePasswordMutation.isPending ? "Changing..." : "Change Password"}
                        </Button>
                      </DialogFooter>
                    </DialogContent>
                  </Dialog>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Intelligent Profile Tab (Premium Upsell for Free Users) */}
          {!isPremium && (
            <TabsContent value="intelligent">
              <Card className="border-2 border-primary/20">
                <CardHeader className="text-center">
                  <div className="mb-4">
                    <Lock className="w-16 h-16 mx-auto text-muted-foreground" />
                  </div>
                  <CardTitle className="text-2xl">Premium Feature</CardTitle>
                  <CardDescription className="text-lg mt-2">
                    Intelligent user profiles are available for Pro and Enterprise users
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <p className="mb-6 text-muted-foreground">
                    Unlock AI-powered recommendations, smart bookmarks, tags, and collections to organize and discover repositories tailored to your interests.
                  </p>
                  <div className="grid grid-cols-2 gap-4 mb-6 text-left">
                    <div className="p-4 border rounded-lg">
                      <Brain className="w-8 h-8 text-primary mb-2" />
                      <h3 className="font-semibold mb-1">AI Recommendations</h3>
                      <p className="text-sm text-muted-foreground">
                        Get personalized repository suggestions based on your interests
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Bookmark className="w-8 h-8 text-primary mb-2" />
                      <h3 className="font-semibold mb-1">Smart Bookmarks</h3>
                      <p className="text-sm text-muted-foreground">
                        Save and organize repositories with notes and tags
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <FolderOpen className="w-8 h-8 text-primary mb-2" />
                      <h3 className="font-semibold mb-1">Collections</h3>
                      <p className="text-sm text-muted-foreground">
                        Create themed collections to organize related projects
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <Tag className="w-8 h-8 text-primary mb-2" />
                      <h3 className="font-semibold mb-1">Custom Tags</h3>
                      <p className="text-sm text-muted-foreground">
                        Categorize repositories with custom colored tags
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-4 justify-center">
                    <Link href="/pricing">
                      <Button size="lg" className="gap-2">
                        <Crown className="w-5 h-5" />
                        Upgrade to Pro
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}

          {/* AI Recommendations Tab */}
          <TabsContent value="recommendations">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Personalized Recommendations
                </CardTitle>
                <CardDescription>
                  AI-curated repositories based on your activity and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                {recommendationsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : recommendations?.recommendations?.length > 0 ? (
                  <div className="space-y-4">
                    {recommendations.recommendations.map((repo: any, index: number) => (
                      <motion.div
                        key={repo.name}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h3 className="font-semibold text-lg flex items-center gap-2">
                              <GitBranch className="w-4 h-4" />
                              {repo.name}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {repo.description}
                            </p>
                            <div className="flex items-center gap-4 mt-2">
                              <Badge variant="secondary">{repo.primaryLanguage}</Badge>
                              <span className="flex items-center gap-1 text-sm">
                                <Star className="w-4 h-4" />
                                {repo.stars}
                              </span>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(repo.matchScore * 100)}% Match
                              </Badge>
                            </div>
                            <p className="text-sm text-primary mt-2">
                              {repo.reason}
                            </p>
                          </div>
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/repository/${encodeURIComponent(repo.name)}`}>
                              View
                            </Link>
                          </Button>
                        </div>
                      </motion.div>
                    ))}
                    
                    {recommendations?.insights && (
                      <Card className="mt-6 bg-primary/5">
                        <CardHeader>
                          <CardTitle className="text-lg">Insights</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <div>
                            <span className="font-semibold">Top Interests:</span>{" "}
                            {recommendations.insights.topInterests?.join(", ")}
                          </div>
                          <div>
                            <span className="font-semibold">Suggested Topics:</span>{" "}
                            {recommendations.insights.suggestedTopics?.join(", ")}
                          </div>
                          <div className="text-sm text-muted-foreground mt-2">
                            {recommendations.insights.recommendationRationale}
                          </div>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No recommendations available yet. Start exploring repositories to get personalized suggestions!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Bookmarks Tab */}
          <TabsContent value="bookmarks">
            <Card>
              <CardHeader>
                <CardTitle>Bookmarked Repositories</CardTitle>
                <CardDescription>
                  Your saved repositories for quick access
                </CardDescription>
              </CardHeader>
              <CardContent>
                {bookmarks.length > 0 ? (
                  <div className="space-y-3">
                    {bookmarks.map((bookmark: any) => (
                      <div key={bookmark.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{bookmark.repositoryId}</h4>
                          {bookmark.notes && (
                            <p className="text-sm text-muted-foreground">{bookmark.notes}</p>
                          )}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" variant="outline" asChild>
                            <Link href={`/repository/${bookmark.repositoryId}`}>View</Link>
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost"
                            onClick={() => removeBookmarkMutation.mutate(bookmark.repositoryId)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No bookmarks yet. Save repositories to access them quickly!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections">
            <Card>
              <CardHeader>
                <CardTitle>Repository Collections</CardTitle>
                <CardDescription>
                  Organize repositories into themed collections
                </CardDescription>
                <div className="mt-4">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="w-4 h-4" />
                        New Collection
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create New Collection</DialogTitle>
                        <DialogDescription>
                          Create a collection to organize related repositories
                        </DialogDescription>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <Label htmlFor="collection-name">Name</Label>
                          <Input
                            id="collection-name"
                            value={newCollectionName}
                            onChange={(e) => setNewCollectionName(e.target.value)}
                            placeholder="e.g., Machine Learning Projects"
                          />
                        </div>
                        <div>
                          <Label htmlFor="collection-description">Description</Label>
                          <Textarea
                            id="collection-description"
                            value={newCollectionDescription}
                            onChange={(e) => setNewCollectionDescription(e.target.value)}
                            placeholder="Description of this collection..."
                          />
                        </div>
                        <Button 
                          onClick={() => createCollectionMutation.mutate()}
                          disabled={!newCollectionName}
                          className="w-full"
                        >
                          Create Collection
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                {collections.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {collections.map((collection: any) => (
                      <Card key={collection.id} className="hover:shadow-lg transition-shadow">
                        <CardHeader>
                          <CardTitle className="text-lg flex items-center gap-2">
                            <FolderOpen className="w-5 h-5" style={{ color: collection.color }} />
                            {collection.name}
                          </CardTitle>
                          {collection.description && (
                            <CardDescription>{collection.description}</CardDescription>
                          )}
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-muted-foreground">
                              {collection.isPublic ? "Public" : "Private"}
                            </span>
                            <Button size="sm" variant="outline">
                              View Collection
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No collections yet. Create collections to organize your repositories!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Tags Tab */}
          <TabsContent value="tags">
            <Card>
              <CardHeader>
                <CardTitle>Repository Tags</CardTitle>
                <CardDescription>
                  Create tags to categorize and filter repositories
                </CardDescription>
                <div className="mt-4 flex gap-2">
                  <Input
                    placeholder="Tag name..."
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    className="max-w-xs"
                  />
                  <Input
                    type="color"
                    value={newTagColor}
                    onChange={(e) => setNewTagColor(e.target.value)}
                    className="w-20"
                  />
                  <Button 
                    onClick={() => createTagMutation.mutate()}
                    disabled={!newTagName}
                    className="gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add Tag
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {tags.length > 0 ? (
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag: any) => (
                      <Badge 
                        key={tag.id} 
                        variant="outline" 
                        className="px-3 py-1"
                        style={{ borderColor: tag.color, color: tag.color }}
                      >
                        {tag.name}
                      </Badge>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    No tags yet. Create tags to categorize your repositories!
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Preferences Tab */}
          <TabsContent value="preferences">
            <Card>
              <CardHeader>
                <CardTitle>Profile Preferences</CardTitle>
                <CardDescription>
                  Customize your experience and AI recommendations
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Preferred Languages</Label>
                  <Input
                    placeholder="e.g., JavaScript, Python, Go"
                    defaultValue={preferences?.preferredLanguages?.join(", ")}
                    onBlur={(e) => {
                      const languages = e.target.value.split(",").map(l => l.trim()).filter(l => l);
                      updatePreferencesMutation.mutate({ preferredLanguages: languages });
                    }}
                  />
                </div>
                
                <div>
                  <Label>Preferred Topics</Label>
                  <Input
                    placeholder="e.g., machine-learning, web-development, devops"
                    defaultValue={preferences?.preferredTopics?.join(", ")}
                    onBlur={(e) => {
                      const topics = e.target.value.split(",").map(t => t.trim()).filter(t => t);
                      updatePreferencesMutation.mutate({ preferredTopics: topics });
                    }}
                  />
                </div>
                
                <div>
                  <Label>Excluded Topics</Label>
                  <Input
                    placeholder="Topics to exclude from recommendations"
                    defaultValue={preferences?.excludedTopics?.join(", ")}
                    onBlur={(e) => {
                      const topics = e.target.value.split(",").map(t => t.trim()).filter(t => t);
                      updatePreferencesMutation.mutate({ excludedTopics: topics });
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>AI Recommendations</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable personalized AI repository recommendations
                    </p>
                  </div>
                  <Switch
                    checked={preferences?.aiRecommendations ?? true}
                    onCheckedChange={(checked) => {
                      updatePreferencesMutation.mutate({ aiRecommendations: checked });
                    }}
                  />
                </div>
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Receive weekly repository recommendations via email
                    </p>
                  </div>
                  <Switch
                    checked={preferences?.emailNotifications ?? false}
                    onCheckedChange={(checked) => {
                      updatePreferencesMutation.mutate({ emailNotifications: checked });
                    }}
                  />
                </div>
                
                <Separator className="my-4" />
                
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Product Tour</Label>
                    <p className="text-sm text-muted-foreground">
                      Take a guided tour to learn about all features
                    </p>
                  </div>
                  <Button
                    onClick={restartTour}
                    variant="outline"
                    className="gap-2"
                  >
                    <Sparkles className="w-4 h-4" />
                    Restart Tour
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        </div>
      </div>
    </div>
  );
}