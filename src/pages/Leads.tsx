import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Seo } from "@/components/Seo";
import { SiteHeader, SiteFooter } from "@/components/SiteChrome";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { format } from "date-fns";
import { Loader2, Users } from "lucide-react";
import { toast } from "sonner";

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  company: string;
  created_at: string;
}

const Leads = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeads();
  }, []);

  const fetchLeads = async () => {
    try {
      const { data, error } = await supabase
        .from('leads')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setLeads(data || []);
    } catch (err: any) {
      console.error("Error fetching leads:", err);
      if (err.code === '42P01') {
        toast.error("The 'leads' table does not exist in your Supabase database yet.");
      } else {
        toast.error("Failed to fetch leads. Ensure RLS policies allow SELECT operations.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col relative text-foreground transition-colors duration-300">
      <Seo title="Leads Dashboard - Storefries Listing" description="View captured leads from your landing page." />
      <SiteHeader />

      <main className="flex-1 container py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-lg bg-brand-blue/10 dark:bg-brand-blue/20 flex items-center justify-center">
            <Users className="h-5 w-5 text-brand-blue" />
          </div>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Captured Leads</h1>
            <p className="text-muted-foreground">View and manage all leads captured from your generation page.</p>
          </div>
        </div>

        <div className="rounded-xl border border-border/50 bg-card shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-4 text-brand-blue" />
              <p>Loading your leads...</p>
            </div>
          ) : leads.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-16 text-center">
              <div className="h-16 w-16 rounded-full bg-secondary flex items-center justify-center mb-4">
                <Users className="h-8 w-8 text-muted-foreground opacity-50" />
              </div>
              <h3 className="text-xl font-bold mb-2">No leads found</h3>
              <p className="text-muted-foreground max-w-sm">
                When users fill out the generation form, their details will appear here. Make sure your database table and RLS policies are set up correctly.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-secondary/50 hover:bg-secondary/50">
                    <TableHead className="w-[200px]">Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Company</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead className="text-right">Date Captured</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {leads.map((lead) => (
                    <TableRow key={lead.id} className="hover:bg-secondary/20">
                      <TableCell className="font-medium">{lead.name}</TableCell>
                      <TableCell>{lead.email}</TableCell>
                      <TableCell>{lead.company}</TableCell>
                      <TableCell>{lead.phone || <span className="text-muted-foreground italic">Not provided</span>}</TableCell>
                      <TableCell className="text-right text-muted-foreground">
                        {lead.created_at ? format(new Date(lead.created_at), 'MMM d, yyyy h:mm a') : 'Unknown'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </main>

      <SiteFooter />
    </div>
  );
};

export default Leads;
