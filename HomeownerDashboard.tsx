import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { 
  Search, 
  Wrench, 
  Paintbrush, 
  Home, 
  Zap, 
  Droplets, 
  CheckCircle, 
  Star, 
  Quote,
  Plus,
  Briefcase,
  MapPin,
  Calendar,
  DollarSign,
  Trash2,
  Edit,
  Eye
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { JobOffers } from "@/components/JobOffers";
import { RatingDialog } from "@/components/RatingDialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

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
  assigned_provider_id?: string | null;
}

interface ProviderReview {
  id: string;
  rating: number;
  review: string | null;
  created_at: string;
  homeowner_id: string;
}

const HomeownerDashboard = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("overview");
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleteJobId, setDeleteJobId] = useState<string | null>(null);
  const [editingJob, setEditingJob] = useState<Job | null>(null);
  const [viewingOffersJobId, setViewingOffersJobId] = useState<string | null>(null);
  const [viewingOffersJobTitle, setViewingOffersJobTitle] = useState<string>("");
  const [selectedService, setSelectedService] = useState<string | null>(null);
  const [providers, setProviders] = useState<any[]>([]);
  const [showProvidersDialog, setShowProvidersDialog] = useState(false);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);
  const [providerRatings, setProviderRatings] = useState<{ [key: string]: { avg: number; count: number } }>({});
  const [providerReviews, setProviderReviews] = useState<{ [key: string]: ProviderReview[] }>({});
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [selectedJobForRating, setSelectedJobForRating] = useState<{ jobId: string; providerId: string; providerName: string } | null>(null);
  
  // Form state
  const [formData, setFormData] = useState({
    title: "",
    category: "",
    description: "",
    budget: "",
    city: "",
    dateTime: "",
  });

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
      } else {
        fetchJobs();
      }
    };
    checkAuth();
  }, [navigate]);

  const fetchJobs = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("jobs" as any)
      .select("*")
      .eq("posted_by", session.user.id)
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: "smooth" });
    }
  };

  const handleSubmitJob = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.category || !formData.description || !formData.city) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    // Comprehensive input validation
    if (formData.title.trim().length < 5 || formData.title.length > 100) {
      toast({
        title: "Validation Error",
        description: "Job title must be between 5 and 100 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.description.trim().length < 20 || formData.description.length > 2000) {
      toast({
        title: "Validation Error",
        description: "Description must be between 20 and 2000 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.city.trim().length < 2 || formData.city.length > 100) {
      toast({
        title: "Validation Error",
        description: "City name must be between 2 and 100 characters",
        variant: "destructive",
      });
      return;
    }

    if (formData.budget && formData.budget.length > 50) {
      toast({
        title: "Validation Error",
        description: "Budget must be under 50 characters",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    // Rate limiting check - max 10 jobs per 24 hours
    const { count } = await supabase
      .from('jobs')
      .select('*', { count: 'exact', head: true })
      .eq('posted_by', session.user.id)
      .eq('status', 'open')
      .gte('created_at', new Date(Date.now() - 24*60*60*1000).toISOString());

    if (count && count >= 10) {
      toast({
        title: "Rate Limit Exceeded",
        description: "Maximum 10 open jobs per 24 hours. Please try again later.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }


    const jobData = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      budget: formData.budget || null,
      city: formData.city,
      date_time: formData.dateTime || null,
      posted_by: session.user.id,
    };

    if (editingJob) {
      const { error } = await supabase
        .from("jobs" as any)
        .update(jobData as any)
        .eq("id", editingJob.id);

      if (error) {
        toast({
          title: "Update Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Job Updated!",
          description: "Your job has been updated successfully",
        });
        setFormData({
          title: "",
          category: "",
          description: "",
          budget: "",
          city: "",
          dateTime: "",
        });
        setEditingJob(null);
        fetchJobs();
        setActiveTab("my-jobs");
      }
    } else {
      const { error } = await supabase.from("jobs" as any).insert([jobData as any]);

      if (error) {
        toast({
          title: "Posting Failed",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Job Posted!",
          description: "Your job has been posted successfully",
        });
        setFormData({
          title: "",
          category: "",
          description: "",
          budget: "",
          city: "",
          dateTime: "",
        });
        fetchJobs();
        setActiveTab("my-jobs");
      }
    }

    setLoading(false);
  };

  const handleDeleteJob = async () => {
    if (!deleteJobId) return;

    const { error } = await supabase
      .from("jobs" as any)
      .delete()
      .eq("id", deleteJobId);

    if (error) {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Job Deleted",
        description: "The job has been removed",
      });
      fetchJobs();
    }

    setDeleteJobId(null);
  };

  const handleEditJob = (job: Job) => {
    setEditingJob(job);
    setFormData({
      title: job.title,
      category: job.category,
      description: job.description,
      budget: job.budget || "",
      city: job.city,
      dateTime: job.date_time || "",
    });
    setActiveTab("post-job");
  };

  const handleUpdateStatus = async (jobId: string, newStatus: string) => {
    const { error } = await supabase
      .from("jobs" as any)
      .update({ status: newStatus } as any)
      .eq("id", jobId);

    if (error) {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Status Updated",
        description: "Job status has been updated",
      });
      fetchJobs();
    }
  };

  const fetchRatingsForProviders = async (providerIds: string[]) => {
    try {
      const { data, error } = await supabase
        .from('provider_ratings')
        .select('provider_id, rating');

      if (error) throw error;

      const ratingsMap: { [key: string]: { avg: number; count: number } } = {};
      
      providerIds.forEach(id => {
        const providerRatingData = (data || []).filter(r => r.provider_id === id);
        if (providerRatingData.length > 0) {
          const avg = providerRatingData.reduce((sum, r) => sum + r.rating, 0) / providerRatingData.length;
          ratingsMap[id] = { avg: Math.round(avg * 10) / 10, count: providerRatingData.length };
        } else {
          ratingsMap[id] = { avg: 0, count: 0 };
        }
      });

      setProviderRatings(ratingsMap);
    } catch (error: any) {
      console.error('Error fetching ratings:', error);
    }
  };

  const handleServiceClick = async (serviceTitle: string) => {
    // Map display names to database skill categories
    const categoryMap: { [key: string]: string } = {
      'Plumbing': 'plumber',
      'Electrical': 'electrician',
      'Cleaning': 'cleaner',
      'Painting': 'painter',
      'Handyman': 'handyman',
      'Carpentry': 'carpenter'
    };

    const dbCategory = categoryMap[serviceTitle] || serviceTitle.toLowerCase();

    try {
      setIsLoadingProviders(true);
      setSelectedService(serviceTitle);
      
      const { data, error } = await supabase
        .from("provider_profiles" as any)
        .select("*")
        .ilike("skill_category", `%${dbCategory}%`);

      if (error) throw error;

      const providersData = (data || []) as any[];
      setProviders(providersData);
      
      // Fetch ratings for each provider
      if (providersData.length > 0) {
        await fetchRatingsForProviders(providersData.map((p: any) => p.user_id));
      }
      
      setShowProvidersDialog(true);
    } catch (error) {
      console.error('Error fetching providers:', error);
      toast({
        title: "Error",
        description: "Failed to fetch service providers",
        variant: "destructive",
      });
      setProviders([]);
    } finally {
      setIsLoadingProviders(false);
    }
  };

  // Animation variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 60 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.8 } }
  };

  const fadeInScale = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.6 } }
  };

  const float3D = {
    hidden: { opacity: 0, y: 40, rotateX: -15, z: -50 },
    visible: { 
      opacity: 1, 
      y: 0, 
      rotateX: 0, 
      z: 0,
      transition: { duration: 0.8 }
    }
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.1
      }
    }
  };

  const services = [
    { icon: Wrench, title: "Plumbing", description: "Expert plumbers for all your needs" },
    { icon: Paintbrush, title: "Painting", description: "Professional painting services" },
    { icon: Home, title: "Carpentry", description: "Skilled carpenters for repairs" },
    { icon: Zap, title: "Electrical", description: "Licensed electricians" },
    { icon: Droplets, title: "Cleaning", description: "Thorough cleaning services" },
  ];

  // Filter services based on search query
  const filteredServices = services.filter(service => 
    searchQuery === "" || 
    service.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    service.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const testimonials = [
    {
      name: "Sarah Johnson",
      role: "Homeowner",
      content: "Found an amazing plumber within minutes! The service was excellent and reasonably priced.",
      rating: 5,
    },
    {
      name: "Michael Chen",
      role: "Property Manager",
      content: "Home Genie has become my go-to platform for finding reliable service professionals.",
      rating: 5,
    },
  ];

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="fixed inset-0 bg-cover bg-center bg-no-repeat opacity-5"
        style={{ backgroundImage: `url(${dashboardBg})` }}
      />
      <div className="fixed inset-0 bg-gradient-to-b from-background/98 via-background/97 to-background/98" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Navigation */}
        <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 cursor-pointer" onClick={() => scrollToSection("hero")}>
                <img src={genieLamp} alt="Genie Lamp" className="w-10 h-10 object-contain" />
                <span className="text-2xl font-semibold text-primary">Home Genie</span>
              </div>
              
              <div className="hidden md:flex items-center gap-8">
                <button onClick={() => scrollToSection("services")} className="text-muted-foreground hover:text-primary transition-colors">
                  Services
                </button>
                <button onClick={() => scrollToSection("my-dashboard")} className="text-muted-foreground hover:text-primary transition-colors">
                  My Dashboard
                </button>
                <button onClick={() => scrollToSection("testimonials")} className="text-muted-foreground hover:text-primary transition-colors">
                  Testimonials
                </button>
                <Button onClick={() => navigate("/homeowner-settings")} variant="outline">
                  Settings
                </Button>
                <Button onClick={handleLogout} variant="outline">
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </nav>

        {/* Hero Section */}
        <section id="hero" className="pt-32 pb-20 px-4">
          <div className="container mx-auto text-center">
            <motion.h1 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
              className="text-5xl md:text-6xl font-bold mb-6"
            >
              Find Local Home Service
              <span className="text-primary block mt-2">Professionals</span>
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
              className="text-xl text-muted-foreground mb-12 max-w-2xl mx-auto"
            >
              Connect with trusted professionals for all your home repair and maintenance needs
            </motion.p>
            
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: 0.4, ease: "easeOut" }}
              className="max-w-2xl mx-auto"
            >
              <div className="glass-card p-4 rounded-2xl shadow-lg">
                <div className="flex gap-3">
                  <div className="flex-1 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-5 h-5" />
                    <Input
                      placeholder="What service do you need? (e.g., plumber, electrician)"
                      className="pl-12 input-elegant"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                  </div>
                  <Button size="lg" className="btn-glow">
                    Search
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Popular Services */}
        <section id="services" className="py-20 px-4">
          <div className="container mx-auto">
            <motion.h2 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-4xl font-bold text-center mb-4"
            >
              Popular Services
            </motion.h2>
            <motion.p 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center text-muted-foreground mb-12"
            >
              Browse our most requested home services
            </motion.p>
            
            {filteredServices.length === 0 ? (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <p className="text-muted-foreground">No services found matching "{searchQuery}"</p>
              </motion.div>
            ) : (
              <motion.div 
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, margin: "-100px" }}
                variants={staggerContainer}
                className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6"
                style={{ perspective: "1000px" }}
              >
                {filteredServices.map((service, index) => (
                <motion.div
                  key={index}
                  variants={float3D}
                  whileHover={{ 
                    scale: 1.05, 
                    rotateY: 5,
                    rotateX: -5,
                    z: 20,
                    transition: { duration: 0.3 }
                  }}
                  onClick={() => handleServiceClick(service.title)}
                  className="glass-card p-6 rounded-xl cursor-pointer group"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <motion.div 
                    className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors"
                    whileHover={{ rotateZ: 360 }}
                    transition={{ duration: 0.6 }}
                  >
                    <service.icon className="w-7 h-7 text-primary" />
                  </motion.div>
                  <h3 className="text-lg font-semibold mb-2">{service.title}</h3>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </motion.div>
              ))}
            </motion.div>
            )}
          </div>
        </section>

        {/* My Dashboard Section */}
        <section id="my-dashboard" className="py-20 px-4 bg-muted/30">
          <div className="container mx-auto">
            <motion.h2 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-4xl font-bold text-center mb-12"
            >
              My Dashboard
            </motion.h2>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="max-w-5xl mx-auto">
              <TabsList className="glass-card grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="post-job">Post a Job</TabsTrigger>
                <TabsTrigger value="my-jobs">My Jobs ({jobs.length})</TabsTrigger>
              </TabsList>

              {/* Overview Tab */}
              <TabsContent value="overview" className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Total Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold">{jobs.length}</div>
                        <Briefcase className="w-8 h-8 text-primary/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Open Jobs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold">{jobs.filter(j => j.status === 'open').length}</div>
                        <CheckCircle className="w-8 h-8 text-green-500/50" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="glass-card">
                    <CardHeader>
                      <CardTitle className="text-sm font-medium text-muted-foreground">Completed</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="text-3xl font-bold">{jobs.filter(j => j.status === 'completed').length}</div>
                        <Star className="w-8 h-8 text-primary/50" />
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>Recent Jobs</CardTitle>
                    <CardDescription>Your most recently posted jobs</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {jobs.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        No jobs posted yet. Click "Post a Job" to get started!
                      </p>
                    ) : (
                      <div className="space-y-4">
                        {jobs.slice(0, 5).map((job) => (
                          <div key={job.id} className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                            <div className="flex items-start justify-between">
                              <div>
                                <h3 className="font-semibold">{job.title}</h3>
                                <p className="text-sm text-muted-foreground">{job.category} • {job.city}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                                job.status === 'open' ? 'bg-green-500/20 text-green-500' :
                                job.status === 'assigned' ? 'bg-primary/20 text-primary' :
                                job.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Post Job Tab */}
              <TabsContent value="post-job">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>{editingJob ? "Edit Job" : "Post a New Job"}</CardTitle>
                    <CardDescription>
                      {editingJob ? "Update your job details" : "Fill in the details to post your job"}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <form onSubmit={handleSubmitJob} className="space-y-6">
                      <div className="space-y-2">
                        <Label htmlFor="title">Job Title *</Label>
                        <Input
                          id="title"
                          placeholder="e.g., Fix leaking kitchen sink"
                          value={formData.title}
                          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                          className="input-elegant"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="category">Service Category *</Label>
                        <Select value={formData.category} onValueChange={(value) => setFormData({ ...formData, category: value })}>
                          <SelectTrigger className="input-elegant">
                            <SelectValue placeholder="Select a category" />
                          </SelectTrigger>
                          <SelectContent>
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
                        <Label htmlFor="description">Description *</Label>
                        <Textarea
                          id="description"
                          placeholder="Describe the job in detail..."
                          rows={5}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                          className="input-elegant"
                          required
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label htmlFor="budget">Budget (Optional)</Label>
                          <Input
                            id="budget"
                            placeholder="e.g., $100 - $200"
                            value={formData.budget}
                            onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                            className="input-elegant"
                          />
                        </div>

                        <div className="space-y-2">
                          <Label htmlFor="city">City / Location *</Label>
                          <Input
                            id="city"
                            placeholder="e.g., New York"
                            value={formData.city}
                            onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                            className="input-elegant"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="dateTime">Preferred Date / Time (Optional)</Label>
                        <Input
                          id="dateTime"
                          type="datetime-local"
                          value={formData.dateTime}
                          onChange={(e) => setFormData({ ...formData, dateTime: e.target.value })}
                          className="input-elegant"
                        />
                      </div>

                      <div className="flex gap-4">
                        <Button type="submit" className="flex-1 btn-glow" disabled={loading}>
                          <Plus className="w-4 h-4 mr-2" />
                          {loading ? "Processing..." : editingJob ? "Update Job" : "Post Job"}
                        </Button>
                        {editingJob && (
                          <Button 
                            type="button" 
                            variant="outline" 
                            onClick={() => {
                              setEditingJob(null);
                              setFormData({
                                title: "",
                                category: "",
                                description: "",
                                budget: "",
                                city: "",
                                dateTime: "",
                              });
                            }}
                          >
                            Cancel
                          </Button>
                        )}
                      </div>
                    </form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* My Jobs Tab */}
              <TabsContent value="my-jobs">
                <Card className="glass-card">
                  <CardHeader>
                    <CardTitle>My Posted Jobs</CardTitle>
                    <CardDescription>Manage all your job postings</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {jobs.length === 0 ? (
                      <div className="text-center py-12">
                        <Briefcase className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <p className="text-muted-foreground mb-4">You haven't posted any jobs yet</p>
                        <Button onClick={() => setActiveTab("post-job")}>
                          <Plus className="w-4 h-4 mr-2" />
                          Post Your First Job
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {jobs.map((job) => (
                          <div key={job.id} className="p-4 rounded-lg border border-border bg-card hover:bg-accent/50 transition-colors">
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <h3 className="font-semibold text-lg mb-2">{job.title}</h3>
                                <div className="flex items-center gap-4 text-sm text-muted-foreground">
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
                                </div>
                                <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{job.description}</p>
                              </div>
                              <span className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ml-4 ${
                                job.status === 'open' ? 'bg-green-500/20 text-green-500' :
                                job.status === 'assigned' ? 'bg-primary/20 text-primary' :
                                job.status === 'completed' ? 'bg-blue-500/20 text-blue-500' :
                                'bg-muted text-muted-foreground'
                              }`}>
                                {job.status}
                              </span>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                              {job.status === 'open' && (
                                <Button 
                                  size="sm" 
                                  variant="default" 
                                  className="btn-glow"
                                  onClick={() => {
                                    setViewingOffersJobId(job.id);
                                    setViewingOffersJobTitle(job.title);
                                  }}
                                >
                                  <Eye className="w-4 h-4 mr-2" />
                                  View Offers
                                </Button>
                              )}
                              {job.status !== 'assigned' && (
                                <Select value={job.status} onValueChange={(value) => handleUpdateStatus(job.id, value)}>
                                  <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="completed">Completed</SelectItem>
                                    <SelectItem value="cancelled">Cancelled</SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                              {job.status !== 'assigned' && (
                                <Button size="sm" variant="outline" onClick={() => handleEditJob(job)}>
                                  <Edit className="w-4 h-4 mr-2" />
                                  Edit
                                </Button>
                              )}
                              {job.status !== 'assigned' && (
                                <Button size="sm" variant="outline" onClick={() => setDeleteJobId(job.id)}>
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete
                                </Button>
                              )}
                              {job.status === 'completed' && job.assigned_provider_id && (
                                <Button 
                                  size="sm" 
                                  variant="default"
                                  className="btn-glow"
                                  onClick={async () => {
                                    // Check if already rated
                                    const { data: existingRating } = await supabase
                                      .from("provider_ratings")
                                      .select("id")
                                      .eq("job_id", job.id)
                                      .maybeSingle();
                                    
                                    if (existingRating) {
                                      toast({
                                        title: "Already Rated",
                                        description: "You have already rated this provider",
                                      });
                                      return;
                                    }

                                    // Fetch provider name
                                    const { data: provider } = await supabase
                                      .from("provider_profiles")
                                      .select("full_name")
                                      .eq("user_id", job.assigned_provider_id)
                                      .single();

                                    setSelectedJobForRating({
                                      jobId: job.id,
                                      providerId: job.assigned_provider_id!,
                                      providerName: provider?.full_name || "Provider"
                                    });
                                    setRatingDialogOpen(true);
                                  }}
                                >
                                  <Star className="w-4 h-4 mr-2" />
                                  Rate Provider
                                </Button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Testimonials */}
        <section id="testimonials" className="py-20 px-4">
          <div className="container mx-auto">
            <motion.h2 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-4xl font-bold text-center mb-4"
            >
              What Our Customers Say
            </motion.h2>
            <motion.p 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={fadeInUp}
              className="text-center text-muted-foreground mb-12"
            >
              Real experiences from real people
            </motion.p>
            
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={staggerContainer}
              className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto"
            >
              {testimonials.map((testimonial, index) => (
                <motion.div 
                  key={index} 
                  variants={fadeInScale}
                  whileHover={{ 
                    scale: 1.03,
                    rotateY: 2,
                    z: 10,
                    transition: { duration: 0.3 }
                  }}
                  className="glass-card p-8 rounded-xl"
                  style={{ transformStyle: "preserve-3d" }}
                >
                  <Quote className="w-10 h-10 text-primary/20 mb-4" />
                  <p className="text-lg mb-6">{testimonial.content}</p>
                  <div className="flex items-center gap-2 mb-2">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, scale: 0 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ delay: i * 0.1, duration: 0.3 }}
                      >
                        <Star className="w-5 h-5 fill-primary text-primary" />
                      </motion.div>
                    ))}
                  </div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-12 px-4 border-t border-border">
          <div className="container mx-auto">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div>
                <div className="flex items-center gap-2 mb-4">
                  <img src={genieLamp} alt="Genie Lamp" className="w-8 h-8 object-contain" />
                  <span className="text-xl font-semibold text-primary">Home Genie</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Connecting homeowners with trusted service professionals
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Company</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Careers</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Press</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">For Professionals</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">Join as Pro</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">How it Works</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Success Stories</a></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Support</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Safety</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Contact Us</a></li>
                </ul>
              </div>
            </div>
            
            <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
              <p>&copy; 2025 Home Genie. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deleteJobId} onOpenChange={() => setDeleteJobId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your job posting.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteJob}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Job Offers Dialog */}
      <JobOffers
        jobId={viewingOffersJobId || ""}
        jobTitle={viewingOffersJobTitle}
        open={!!viewingOffersJobId}
        onClose={() => setViewingOffersJobId(null)}
        onOfferAccepted={() => {
          fetchJobs();
          setViewingOffersJobId(null);
        }}
      />

      {/* Rating Dialog */}
      {selectedJobForRating && (
        <RatingDialog
          open={ratingDialogOpen}
          onClose={() => {
            setRatingDialogOpen(false);
            setSelectedJobForRating(null);
          }}
          jobId={selectedJobForRating.jobId}
          providerId={selectedJobForRating.providerId}
          providerName={selectedJobForRating.providerName}
          onRatingSubmitted={() => {
            fetchJobs();
          }}
        />
      )}

      {/* Service Providers Dialog */}
      <Dialog open={!!selectedService} onOpenChange={() => setSelectedService(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">{selectedService} Service Providers</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-muted-foreground mb-6">
              Browse available service providers for {selectedService?.toLowerCase()} services
            </p>
          
          {isLoadingProviders ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading providers...</p>
            </div>
          ) : providers.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No providers found for this service.</p>
            </div>
          ) : (
            <div className="grid gap-6 mt-4">
              {providers.map((provider) => {
                const rating = providerRatings[provider.user_id] || { avg: 0, count: 0 };
                const reviews = providerReviews[provider.user_id] || [];
                return (
                  <Card key={provider.id} className="glass-card">
                    <CardHeader>
                      <div className="flex items-start gap-4">
                        <Avatar className="w-16 h-16">
                          <AvatarImage src={provider.profile_image_url} alt={provider.full_name} />
                          <AvatarFallback>{provider.full_name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <div className="flex-1">
                          <CardTitle className="text-xl">{provider.full_name}</CardTitle>
                          <p className="text-sm text-muted-foreground">{provider.skill_category}</p>
                          <div className="flex items-center gap-2 mt-2">
                            <div className="flex items-center gap-1">
                              <Star className="w-4 h-4 fill-primary text-primary" />
                              <span className="text-sm font-medium">
                                {rating.avg > 0 ? rating.avg.toFixed(1) : "No ratings yet"}
                              </span>
                            </div>
                            {rating.count > 0 && (
                              <span className="text-xs text-muted-foreground">
                                ({rating.count} {rating.count === 1 ? "review" : "reviews"})
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {provider.bio && (
                        <p className="text-sm text-muted-foreground mb-4">{provider.bio}</p>
                      )}
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <MapPin className="w-4 h-4" />
                          <span>{provider.city}</span>
                        </div>
                      </div>
                      
                      {/* Reviews Section */}
                      {reviews.length > 0 && (
                        <div className="border-t pt-4 mt-4">
                          <h4 className="font-semibold mb-3">Recent Reviews</h4>
                          <div className="space-y-3">
                            {reviews.slice(0, 3).map((review) => (
                              <div key={review.id} className="bg-muted/30 p-3 rounded-lg">
                                <div className="flex items-center gap-1 mb-1">
                                  {[...Array(5)].map((_, i) => (
                                    <Star
                                      key={i}
                                      className={`w-3 h-3 ${
                                        i < review.rating
                                          ? "fill-primary text-primary"
                                          : "text-muted-foreground"
                                      }`}
                                    />
                                  ))}
                                  <span className="text-xs text-muted-foreground ml-2">
                                    {new Date(review.created_at).toLocaleDateString()}
                                  </span>
                                </div>
                                {review.review && (
                                  <p className="text-sm text-foreground">{review.review}</p>
                                )}
                              </div>
                            ))}
                            {reviews.length > 3 && (
                              <p className="text-xs text-muted-foreground text-center">
                                +{reviews.length - 3} more {reviews.length - 3 === 1 ? "review" : "reviews"}
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HomeownerDashboard;
