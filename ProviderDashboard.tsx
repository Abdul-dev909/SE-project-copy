import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Briefcase, 
  Calendar, 
  DollarSign, 
  MapPin,
  CheckCircle,
  Settings,
  Search,
  Filter
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import genieLamp from "@/assets/genie-lamp.png";
import dashboardBg from "@/assets/dashboard-bg.jpg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: string | null;
  city: string;
  date_time: string | null;
  status: string;
  created_at: string;
}

interface JobRequest {
  id: string;
  job_id: string;
  message: string;
  proposed_rate: number | null;
  status: string;
  created_at: string;
  jobs?: Job & { assigned_provider_id?: string };
}

const ProviderDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("browse");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [myApplications, setMyApplications] = useState<JobRequest[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [cityFilter, setCityFilter] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else {
        fetchJobs();
        fetchMyApplications();
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchJobs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // First, get the provider's skill category
    const { data: profileData, error: profileError } = await supabase
      .from("provider_profiles" as any)
      .select("skill_category, city")
      .eq("user_id", session.user.id)
      .single();

    if (profileError) {
      toast({
        title: "Error",
        description: "Failed to fetch your profile",
        variant: "destructive",
      });
      return;
    }

    // Map provider skill categories to job categories
    const categoryMap: { [key: string]: string } = {
      'plumber': 'Plumbing',
      'electrician': 'Electrical',
      'cleaner': 'Cleaning',
      'painter': 'Painting',
      'handyman': 'Handyman',
      'mover': 'Moving',
      'gardener': 'Yard Work',
      'carpenter': 'Assembly'
    };

    const providerSkill = (profileData as any)?.skill_category?.toLowerCase() || '';
    const jobCategory = categoryMap[providerSkill] || providerSkill;

    // Fetch jobs matching the provider's category
    const { data, error } = await supabase
      .from("jobs" as any)
      .select("*")
      .eq("status", "open")
      .neq("posted_by", session.user.id)
      .eq("category", jobCategory)
      .order("created_at", { ascending: false });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch jobs",
        variant: "destructive",
      });
    } else {
      setJobs((data as any) || []);
    }
  };

  const fetchMyApplications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("job_requests" as any)
      .select(`
        *,
        jobs (*)
      `)
      .eq("provider_id", session.user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching applications:", error);
    } else {
      setMyApplications((data as any) || []);
    }
  };

  const handleUpdateJobStatus = async (jobId: string, newStatus: string) => {
    const { error } = await supabase
      .from("jobs" as any)
      .update({ status: newStatus } as any)
      .eq("id", jobId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update job status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Job status updated to ${newStatus}`,
      });
      fetchMyApplications();
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const filteredJobs = jobs.filter(job => {
    const matchesSearch = searchQuery === "" || 
                         job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = categoryFilter === "all" || job.category === categoryFilter;
    const matchesCity = cityFilter === "" || job.city.toLowerCase().includes(cityFilter.toLowerCase());
    
    return matchesSearch && matchesCategory && matchesCity;
  });

  const stats = {
    activeApplications: myApplications.filter(a => a.status === "pending").length,
    acceptedJobs: myApplications.filter(a => a.status === "accepted").length,
    availableJobs: jobs.length,
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-5"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/98 via-background/97 to-background/98" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-card border-b border-border/40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={genieLamp} alt="Genie Lamp" className="w-10 h-10 object-contain" />
                <div>
                  <h1 className="text-2xl font-semibold text-primary">Home Genie</h1>
                  <p className="text-xs text-muted-foreground">Service Provider Dashboard</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => navigate("/provider-settings")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </Button>
                <Button onClick={handleLogout} variant="outline" size="sm">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8">
          <div className="mb-8 animate-fade-in">
            <h2 className="text-3xl font-bold mb-2">Welcome back, Provider!</h2>
            <p className="text-muted-foreground">Find jobs and manage your applications</p>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 animate-fade-in">
            <Card className="glass-card hover-scale">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Available Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stats.availableJobs}</div>
                  <Briefcase className="w-8 h-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-scale">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Applications</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stats.activeApplications}</div>
                  <Calendar className="w-8 h-8 text-primary/50" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass-card hover-scale">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">Accepted Jobs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="text-3xl font-bold">{stats.acceptedJobs}</div>
                  <CheckCircle className="w-8 h-8 text-green-500/50" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="glass-card">
              <TabsTrigger value="browse">Browse Jobs ({filteredJobs.length})</TabsTrigger>
              <TabsTrigger value="applications">My Offers ({myApplications.length})</TabsTrigger>
              <TabsTrigger value="active">Active Jobs ({myApplications.filter(a => a.status === 'accepted').length})</TabsTrigger>
            </TabsList>

            {/* Browse Jobs Tab */}
            <TabsContent value="browse" className="space-y-6 animate-fade-in">
              {/* Filters */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Search & Filter</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="search">Search</Label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="search"
                          placeholder="Search jobs..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-10 input-elegant"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category</Label>
                      <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                        <SelectTrigger className="input-elegant">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Categories</SelectItem>
                          <SelectItem value="Plumbing">Plumbing</SelectItem>
                          <SelectItem value="Electrical">Electrical</SelectItem>
                          <SelectItem value="Painting">Painting</SelectItem>
                          <SelectItem value="Cleaning">Cleaning</SelectItem>
                          <SelectItem value="Carpentry">Carpentry</SelectItem>
                          <SelectItem value="Other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="city">City</Label>
                      <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="city"
                          placeholder="Filter by city..."
                          value={cityFilter}
                          onChange={(e) => setCityFilter(e.target.value)}
                          className="pl-10 input-elegant"
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Jobs List */}
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Available Jobs</CardTitle>
                  <CardDescription>Click on a job to view details and apply</CardDescription>
                </CardHeader>
                <CardContent>
                  {filteredJobs.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground">No jobs available matching your filters</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredJobs.map((job) => (
                        <div 
                          key={job.id} 
                          className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors cursor-pointer"
                          onClick={() => navigate(`/job/${job.id}`)}
                        >
                          <div className="flex items-start justify-between mb-3">
                            <div className="flex-1">
                              <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                <span className="flex items-center gap-1">
                                  <Briefcase className="w-4 h-4" />
                                  {job.category}
                                </span>
                                <span className="flex items-center gap-1">
                                  <MapPin className="w-4 h-4" />
                                  {job.city}
                                </span>
                                {job.budget && (
                                  <span className="flex items-center gap-1">
                                    <DollarSign className="w-4 h-4" />
                                    {job.budget}
                                  </span>
                                )}
                                {job.date_time && (
                                  <span className="flex items-center gap-1">
                                    <Calendar className="w-4 h-4" />
                                    {new Date(job.date_time).toLocaleDateString()}
                                  </span>
                                )}
                                <span className="text-xs">
                                  Posted {new Date(job.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                            </div>
                          </div>
                          <Button size="sm" className="btn-glow" onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/job/${job.id}`);
                          }}>
                            View Details & Apply
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* My Offers Tab */}
            <TabsContent value="applications" className="animate-fade-in">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>My Offers</CardTitle>
                  <CardDescription>Track the status of your job offers</CardDescription>
                </CardHeader>
                <CardContent>
                  {myApplications.length === 0 ? (
                    <div className="text-center py-12">
                      <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">You haven't submitted any offers yet</p>
                      <Button onClick={() => setActiveTab("browse")}>
                        Browse Available Jobs
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myApplications.map((application) => {
                        const job = application.jobs as unknown as Job;
                        if (!job) return null;
                        
                        return (
                          <div key={application.id} className="p-4 rounded-lg border border-border bg-card hover-scale transition-all">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center gap-1">
                                    <Briefcase className="w-4 h-4" />
                                    {job.category}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-4 h-4" />
                                    {job.city}
                                  </span>
                                  {application.proposed_rate && (
                                    <span className="flex items-center gap-1 text-primary font-semibold">
                                      <DollarSign className="w-4 h-4" />
                                      ${application.proposed_rate.toFixed(2)} (Your Offer)
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mt-2">
                                  Submitted {new Date(application.created_at).toLocaleDateString()}
                                </p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${
                                application.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                                application.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                                'bg-yellow-500/20 text-yellow-500'
                              }`}>
                                {application.status.charAt(0).toUpperCase() + application.status.slice(1)}
                              </span>
                            </div>
                            <div className="p-3 rounded-lg bg-muted/30 text-sm">
                              <p className="font-medium mb-1">Your Message:</p>
                              <p className="text-muted-foreground">{application.message}</p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Active Jobs Tab */}
            <TabsContent value="active" className="animate-fade-in">
              <Card className="glass-card">
                <CardHeader>
                  <CardTitle>Active Jobs</CardTitle>
                  <CardDescription>Manage your accepted jobs</CardDescription>
                </CardHeader>
                <CardContent>
                  {myApplications.filter(a => a.status === 'accepted').length === 0 ? (
                    <div className="text-center py-12">
                      <CheckCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                      <p className="text-muted-foreground mb-4">No active jobs yet</p>
                      <Button onClick={() => setActiveTab("browse")}>
                        Browse & Apply for Jobs
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {myApplications
                        .filter(a => a.status === 'accepted')
                        .map((application) => {
                          const job = application.jobs as unknown as Job & { assigned_provider_id?: string };
                          if (!job) return null;
                          
                          return (
                            <div key={application.id} className="p-6 rounded-lg border-2 border-green-500/30 bg-gradient-to-br from-green-500/5 to-transparent hover-scale transition-all">
                              <div className="flex items-start justify-between mb-4">
                                <div className="flex-1">
                                  <h3 className="font-semibold text-xl mb-2">{job.title}</h3>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground flex-wrap">
                                    <span className="flex items-center gap-1">
                                      <Briefcase className="w-4 h-4" />
                                      {job.category}
                                    </span>
                                    <span className="flex items-center gap-1">
                                      <MapPin className="w-4 h-4" />
                                      {job.city}
                                    </span>
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-400 font-bold">
                                      <DollarSign className="w-4 h-4" />
                                      ${application.proposed_rate?.toFixed(2) || 'N/A'}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex flex-col items-end gap-2">
                                  <span className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap ${
                                    job.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                                    job.status === 'in_progress' ? 'bg-yellow-500/20 text-yellow-500' :
                                    'bg-green-500/20 text-green-500'
                                  }`}>
                                    {job.status === 'in_progress' ? 'In Progress' :
                                     job.status === 'completed' ? 'Completed' :
                                     job.status === 'assigned' ? 'Assigned' : job.status}
                                  </span>
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div className="p-3 rounded-lg bg-muted/30 text-sm">
                                  <p className="font-medium mb-1">Job Description:</p>
                                  <p className="text-muted-foreground">{job.description}</p>
                                </div>
                                {job.date_time && (
                                  <div className="flex items-center gap-2 text-sm">
                                    <Calendar className="w-4 h-4 text-muted-foreground" />
                                    <span className="text-muted-foreground">
                                      Scheduled: {new Date(job.date_time).toLocaleString()}
                                    </span>
                                  </div>
                                )}
                                
                                {/* Status Update Controls */}
                                <div className="pt-4 border-t border-border/50">
                                  <Label className="text-sm font-medium mb-2 block">Update Job Status</Label>
                                  <div className="flex gap-2">
                                    <Select
                                      value={job.status}
                                      onValueChange={(value) => handleUpdateJobStatus(job.id, value)}
                                    >
                                      <SelectTrigger className="input-elegant">
                                        <SelectValue />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="assigned">Assigned</SelectItem>
                                        <SelectItem value="in_progress">In Progress</SelectItem>
                                        <SelectItem value="completed">Completed</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </main>
      </div>
    </div>
  );
};

export default ProviderDashboard;
