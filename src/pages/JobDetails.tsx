import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, MapPin, Calendar, DollarSign, Briefcase } from "lucide-react";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import genieLamp from "@/assets/genie-lamp.png";
import { z } from "zod";

const jobOfferSchema = z.object({
  message: z.string()
    .min(10, "Message must be at least 10 characters")
    .max(1000, "Message must be less than 1000 characters")
    .trim(),
  proposedRate: z.number()
    .min(0.01, "Proposed rate must be greater than 0")
    .max(100000, "Proposed rate seems unreasonably high"),
});

interface Job {
  id: string;
  title: string;
  category: string;
  description: string;
  budget: string | null;
  city: string;
  date_time: string | null;
  posted_by: string;
  status: string;
  created_at: string;
}

const JobDetails = () => {
  const navigate = useNavigate();
  const { jobId } = useParams();
  const [job, setJob] = useState<Job | null>(null);
  const [message, setMessage] = useState("");
  const [proposedRate, setProposedRate] = useState("");
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);

  useEffect(() => {
    const fetchJobDetails = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/login");
        return;
      }

      // Fetch job details
      const { data: jobData, error: jobError } = await supabase
        .from("jobs" as any)
        .select("*")
        .eq("id", jobId)
        .single();

      if (jobError || !jobData) {
        toast({
          title: "Error",
          description: "Job not found",
          variant: "destructive",
        });
        navigate("/provider-dashboard");
        return;
      }

      setJob(jobData as any);

      // Check if already applied
      const { data: requestData } = await supabase
        .from("job_requests" as any)
        .select("id")
        .eq("job_id", jobId)
        .eq("provider_id", session.user.id)
        .single();

      if (requestData) {
        setHasApplied(true);
      }

      setLoading(false);
    };

    fetchJobDetails();
  }, [jobId, navigate]);

  const handleApply = async () => {
    // Validate inputs with zod schema
    const validation = jobOfferSchema.safeParse({
      message: message.trim(),
      proposedRate: parseFloat(proposedRate),
    });

    if (!validation.success) {
      toast({
        title: "Validation Error",
        description: validation.error.issues[0].message,
        variant: "destructive",
      });
      return;
    }

    setApplying(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/login");
      return;
    }

    // Sanitize message (trim and limit whitespace)
    const sanitizedMessage = message
      .trim()
      .replace(/\s+/g, ' ')
      .slice(0, 1000);

    const { error } = await supabase.from("job_requests" as any).insert({
      job_id: jobId,
      provider_id: session.user.id,
      message: sanitizedMessage,
      proposed_rate: parseFloat(proposedRate),
    } as any);

    if (error) {
      toast({
        title: "Application Failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Offer Submitted!",
        description: "Your offer has been sent to the homeowner",
      });
      setHasApplied(true);
      setMessage("");
      setProposedRate("");
    }

    setApplying(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!job) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <div className="fixed inset-0 bg-gradient-to-b from-background/98 via-background/97 to-background/98" />
      
      <div className="relative z-10">
        {/* Header */}
        <header className="sticky top-0 z-50 glass-card border-b border-border/40">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <img src={genieLamp} alt="Genie Lamp" className="w-10 h-10 object-contain" />
                <span className="text-2xl font-semibold text-primary">Home Genie</span>
              </div>
              <Button variant="outline" onClick={() => navigate("/provider-dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Dashboard
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <Card className="glass-card">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-3xl mb-2">{job.title}</CardTitle>
                    <div className="flex items-center gap-4 text-muted-foreground">
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
                  </div>
                  <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                    job.status === 'open' ? 'bg-green-500/20 text-green-500' :
                    job.status === 'assigned' ? 'bg-primary/20 text-primary' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Job Description</h3>
                  <p className="text-muted-foreground whitespace-pre-line">{job.description}</p>
                </div>

                {job.status === 'open' && !hasApplied && (
                  <div className="space-y-4 pt-6 border-t border-border">
                    <h3 className="text-lg font-semibold">Make Your Offer</h3>
                    <div className="space-y-2">
                      <Label htmlFor="message">Your Message</Label>
                      <Textarea
                        id="message"
                        placeholder="Introduce yourself and explain why you're a good fit for this job..."
                        rows={4}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="input-elegant"
                        maxLength={1000}
                      />
                      <p className="text-xs text-muted-foreground text-right">
                        {message.length}/1000
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="proposedRate">Your Proposed Rate ($)</Label>
                      <Input
                        id="proposedRate"
                        type="number"
                        step="0.01"
                        min="0"
                        placeholder="Enter your rate (e.g., 50.00)"
                        value={proposedRate}
                        onChange={(e) => setProposedRate(e.target.value)}
                        className="input-elegant"
                      />
                    </div>
                    <Button 
                      onClick={handleApply} 
                      disabled={applying}
                      className="w-full btn-glow"
                    >
                      {applying ? "Submitting..." : "Submit Offer"}
                    </Button>
                  </div>
                )}

                {hasApplied && (
                  <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
                    You have already applied for this job. The homeowner will review your application.
                  </div>
                )}

                {job.status !== 'open' && (
                  <div className="p-4 rounded-lg bg-muted/50 border border-border text-muted-foreground">
                    This job is no longer accepting applications.
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default JobDetails;
