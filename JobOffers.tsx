import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, User, MessageSquare, CheckCircle, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Offer {
  id: string;
  provider_id: string;
  message: string;
  proposed_rate: number | null;
  status: string;
  created_at: string;
  provider_profiles?: {
    full_name: string;
    skill_category: string;
    phone: string;
  };
}

interface JobOffersProps {
  jobId: string;
  jobTitle: string;
  open: boolean;
  onClose: () => void;
  onOfferAccepted: () => void;
}

export const JobOffers = ({ jobId, jobTitle, open, onClose, onOfferAccepted }: JobOffersProps) => {
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(false);
  const [accepting, setAccepting] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      fetchOffers();
    }
  }, [open, jobId]);

  const fetchOffers = async () => {
    setLoading(true);
    
    // Fetch job requests with provider details using a manual join
    const { data: requestsData, error: requestsError } = await supabase
      .from("job_requests" as any)
      .select("*")
      .eq("job_id", jobId)
      .order("created_at", { ascending: false });

    if (requestsError) {
      toast({
        title: "Error",
        description: "Failed to fetch offers",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    // Fetch provider profiles for all providers
    const providerIds = [...new Set(requestsData.map((r: any) => r.provider_id))];
    const { data: profilesData } = await supabase
      .from("provider_profiles" as any)
      .select("user_id, full_name, skill_category, phone")
      .in("user_id", providerIds);

    // Merge the data
    const offersWithProfiles = requestsData.map((request: any) => ({
      ...request,
      provider_profiles: profilesData?.find((p: any) => p.user_id === request.provider_id)
    }));

    setOffers(offersWithProfiles || []);
    setLoading(false);
  };

  const handleAcceptOffer = async (offerId: string) => {
    setAccepting(offerId);

    const { error } = await supabase
      .from("job_requests" as any)
      .update({ status: "accepted" } as any)
      .eq("id", offerId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to accept offer",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Offer Accepted!",
        description: "The provider has been notified and the job is now assigned",
      });
      fetchOffers();
      onOfferAccepted();
    }

    setAccepting(null);
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Offers for: {jobTitle}</DialogTitle>
          <DialogDescription>
            Review and accept offers from service providers
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {loading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading offers...</p>
            </div>
          ) : offers.length === 0 ? (
            <div className="text-center py-8">
              <MessageSquare className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">No offers received yet</p>
            </div>
          ) : (
            <div className="space-y-4">
              {offers.map((offer, index) => (
                <motion.div
                  key={offer.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card 
                    className={`hover-scale transition-all ${
                      offer.status === 'accepted' ? 'border-green-500/50 bg-green-500/5' :
                      offer.status === 'rejected' ? 'border-red-500/30 bg-red-500/5 opacity-60' :
                      'border-border'
                    }`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <User className="w-5 h-5 text-primary" />
                            <CardTitle className="text-lg">
                              {offer.provider_profiles?.full_name || "Provider"}
                            </CardTitle>
                          </div>
                          <CardDescription>
                            {offer.provider_profiles?.skill_category || "Service Provider"}
                          </CardDescription>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                          {offer.proposed_rate && (
                            <div className="flex items-center gap-1 text-xl font-bold text-primary">
                              <DollarSign className="w-5 h-5" />
                              {offer.proposed_rate.toFixed(2)}
                            </div>
                          )}
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            offer.status === 'accepted' ? 'bg-green-500/20 text-green-500' :
                            offer.status === 'rejected' ? 'bg-red-500/20 text-red-500' :
                            'bg-yellow-500/20 text-yellow-500'
                          }`}>
                            {offer.status.charAt(0).toUpperCase() + offer.status.slice(1)}
                          </span>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-3 rounded-lg bg-muted/30">
                        <p className="text-sm font-medium mb-1">Message:</p>
                        <p className="text-sm text-muted-foreground">{offer.message}</p>
                      </div>

                      {offer.provider_profiles?.phone && (
                        <div className="text-sm text-muted-foreground">
                          Contact: {offer.provider_profiles.phone}
                        </div>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Submitted {new Date(offer.created_at).toLocaleString()}
                      </div>

                      {offer.status === 'pending' && (
                        <div className="flex gap-2 pt-2">
                          <Button
                            onClick={() => handleAcceptOffer(offer.id)}
                            disabled={accepting !== null}
                            className="flex-1 btn-glow"
                          >
                            {accepting === offer.id ? (
                              "Accepting..."
                            ) : (
                              <>
                                <CheckCircle className="w-4 h-4 mr-2" />
                                Accept Offer
                              </>
                            )}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
