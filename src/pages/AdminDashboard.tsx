import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import AdminLayout from "@/components/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, CheckCircle, Clock, FileText, MessageSquare } from "lucide-react";

const AdminDashboard = () => {
  const [stats, setStats] = useState({
    totalHomeowners: 0,
    totalProviders: 0,
    totalJobs: 0,
    activeJobs: 0,
    completedJobs: 0,
    totalOffers: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    // Count homeowners
    const { count: homeownersCount } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "homeowner");

    // Count service providers
    const { count: providersCount } = await supabase
      .from("user_roles")
      .select("*", { count: "exact", head: true })
      .eq("role", "service_provider");

    // Count total jobs
    const { count: totalJobsCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true });

    // Count active (open) jobs
    const { count: activeJobsCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "open");

    // Count completed jobs
    const { count: completedJobsCount } = await supabase
      .from("jobs")
      .select("*", { count: "exact", head: true })
      .eq("status", "completed");

    // Count total job offers
    const { count: offersCount } = await supabase
      .from("job_requests")
      .select("*", { count: "exact", head: true });

    setStats({
      totalHomeowners: homeownersCount || 0,
      totalProviders: providersCount || 0,
      totalJobs: totalJobsCount || 0,
      activeJobs: activeJobsCount || 0,
      completedJobs: completedJobsCount || 0,
      totalOffers: offersCount || 0,
    });
  };

  const statCards = [
    {
      title: "Total Homeowners",
      value: stats.totalHomeowners,
      icon: Users,
      color: "text-blue-600",
    },
    {
      title: "Total Service Providers",
      value: stats.totalProviders,
      icon: Users,
      color: "text-green-600",
    },
    {
      title: "Total Jobs Posted",
      value: stats.totalJobs,
      icon: Briefcase,
      color: "text-purple-600",
    },
    {
      title: "Active (Open) Jobs",
      value: stats.activeJobs,
      icon: Clock,
      color: "text-orange-600",
    },
    {
      title: "Completed Jobs",
      value: stats.completedJobs,
      icon: CheckCircle,
      color: "text-green-700",
    },
    {
      title: "Total Job Offers",
      value: stats.totalOffers,
      icon: MessageSquare,
      color: "text-indigo-600",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
          <p className="text-muted-foreground">Monitor key platform metrics and activity</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="glass-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <Icon className={`w-5 h-5 ${stat.color}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-foreground">{stat.value}</div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminDashboard;
