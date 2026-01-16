import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useImpersonation } from '@/hooks/useImpersonation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Users, Activity, TrendingUp, Clock } from 'lucide-react';
import ImpersonationBanner from '@/components/ImpersonationBanner';
import { Shell, ShellHeader, ShellTitle, ShellDescription, ShellContent } from '@/components/layout/Shell';
import CronJobsOverview from '@/components/admin/CronJobsOverview';

interface Customer {
  id: string;
  email: string;
  created_at: string;
  display_name?: string;
  role?: string;
  last_sign_in?: string;
  watchlists_count?: number;
  analyses_count?: number;
}

const AdminDashboard: React.FC = () => {
  const { user, hasRole } = useAuth();
  const { startImpersonation } = useImpersonation();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRole, setSelectedRole] = useState<string>('all');
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWatchlists: 0,
    totalAnalyses: 0,
    activeToday: 0
  });

  const loadCustomers = async () => {
    try {
      setLoading(true);

      // Get users from auth.users via admin API
      const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
      
      if (authError) throw authError;

      // Get profiles data
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name');

      // Get user roles
      const { data: roles } = await supabase
        .from('user_roles')
        .select('user_id, role');

      // Get user statistics
      const { data: watchlistStats } = await supabase
        .from('watchlists')
        .select('user_id');

      const { data: analysisStats } = await supabase
        .from('user_stocks')
        .select('user_id');

      // Combine all data
      const combinedCustomers = authUsers.users.map(user => {
        const profile = profiles?.find(p => p.user_id === user.id);
        const userRole = roles?.find(r => r.user_id === user.id);
        const watchlistsCount = watchlistStats?.filter(w => w.user_id === user.id).length || 0;
        const analysesCount = analysisStats?.filter(a => a.user_id === user.id).length || 0;

        return {
          id: user.id,
          email: user.email || '',
          created_at: user.created_at,
          display_name: profile?.display_name,
          role: userRole?.role || 'customer',
          last_sign_in: user.last_sign_in_at,
          watchlists_count: watchlistsCount,
          analyses_count: analysesCount
        };
      });

      setCustomers(combinedCustomers);

      // Calculate stats
      setStats({
        totalUsers: combinedCustomers.length,
        totalWatchlists: watchlistStats?.length || 0,
        totalAnalyses: analysisStats?.length || 0,
        activeToday: combinedCustomers.filter(u => 
          u.last_sign_in && new Date(u.last_sign_in).toDateString() === new Date().toDateString()
        ).length
      });

    } catch (error) {
      console.error('Error loading customers:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Kunden konnten nicht geladen werden"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleImpersonate = async (customer: Customer) => {
    await startImpersonation(customer.id, customer.email);
  };

  const handleRoleChange = async (userId: string, newRole: 'customer' | 'admin' | 'super_admin') => {
    try {
      const { error } = await supabase
        .from('user_roles')
        .upsert({
          user_id: userId,
          role: newRole
        } as any);

      if (error) throw error;

      // Log audit trail
      await supabase.from('audit_logs').insert({
        user_id: userId,
        action: 'role_changed',
        table_name: 'user_roles',
        record_id: userId,
        new_values: { role: newRole }
      });

      toast({
        title: "Rolle geändert",
        description: `Benutzerrolle wurde auf ${newRole} gesetzt`
      });

      loadCustomers();
    } catch (error) {
      console.error('Error changing role:', error);
      toast({
        variant: "destructive",
        title: "Fehler",
        description: "Rolle konnte nicht geändert werden"
      });
    }
  };

  useEffect(() => {
    if (hasRole('admin')) {
      loadCustomers();
    }
  }, [hasRole]);

  const filteredCustomers = customers.filter(customer => {
    const matchesSearch = customer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         customer.display_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = selectedRole === 'all' || customer.role === selectedRole;
    return matchesSearch && matchesRole;
  });

  return (
    <main className="flex-1 overflow-auto bg-background">
      <Shell>
        <ImpersonationBanner />
        
        <ShellHeader>
          <ShellTitle>Admin Dashboard</ShellTitle>
          <ShellDescription>
            Verwalte Benutzer, Rollen und überwache Systemstatistiken
          </ShellDescription>
        </ShellHeader>

        <ShellContent>
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList>
              <TabsTrigger value="users" className="gap-2">
                <Users className="h-4 w-4" />
                Benutzer
              </TabsTrigger>
              <TabsTrigger value="cron" className="gap-2">
                <Clock className="h-4 w-4" />
                Cron Jobs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Gesamt Benutzer</CardTitle>
                    <div className="p-2 rounded-2xl bg-primary/10">
                      <Users className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalUsers}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Watchlists</CardTitle>
                    <div className="p-2 rounded-2xl bg-success/10">
                      <TrendingUp className="h-4 w-4 text-success" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalWatchlists}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Analysen</CardTitle>
                    <div className="p-2 rounded-2xl bg-info/10">
                      <Activity className="h-4 w-4 text-info" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.totalAnalyses}</div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium">Heute aktiv</CardTitle>
                    <div className="p-2 rounded-2xl bg-warning/10">
                      <Activity className="h-4 w-4 text-warning" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stats.activeToday}</div>
                  </CardContent>
                </Card>
              </div>

              {/* User Management */}
              <Card>
                <CardHeader>
                  <CardTitle>Benutzer verwalten</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-4 mb-6">
                    <Input
                      placeholder="Suche nach E-Mail oder Name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="max-w-sm"
                    />
                    <Select value={selectedRole} onValueChange={setSelectedRole}>
                      <SelectTrigger className="w-48">
                        <SelectValue placeholder="Rolle filtern" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">Alle Rollen</SelectItem>
                        <SelectItem value="customer">Kunde</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="super_admin">Super Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>E-Mail</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Rolle</TableHead>
                        <TableHead>Registriert</TableHead>
                        <TableHead>Watchlists</TableHead>
                        <TableHead>Analysen</TableHead>
                        <TableHead>Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loading ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">Lädt...</TableCell>
                        </TableRow>
                      ) : filteredCustomers.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={7} className="text-center">Keine Benutzer gefunden</TableCell>
                        </TableRow>
                      ) : (
                        filteredCustomers.map((customer) => (
                          <TableRow key={customer.id}>
                            <TableCell>{customer.email}</TableCell>
                            <TableCell>{customer.display_name || '-'}</TableCell>
                            <TableCell>
                              <Select
                                value={customer.role}
                                onValueChange={(value: 'customer' | 'admin' | 'super_admin') => handleRoleChange(customer.id, value)}
                                disabled={customer.id === user?.id}
                              >
                                <SelectTrigger className="w-32">
                                  <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="customer">Kunde</SelectItem>
                                  <SelectItem value="admin">Admin</SelectItem>
                                  {hasRole('super_admin') && (
                                    <SelectItem value="super_admin">Super Admin</SelectItem>
                                  )}
                                </SelectContent>
                              </Select>
                            </TableCell>
                            <TableCell>
                              {new Date(customer.created_at).toLocaleDateString('de-DE')}
                            </TableCell>
                            <TableCell>{customer.watchlists_count}</TableCell>
                            <TableCell>{customer.analyses_count}</TableCell>
                            <TableCell>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleImpersonate(customer)}
                                disabled={customer.id === user?.id}
                              >
                                Anmelden als
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="cron">
              <CronJobsOverview />
            </TabsContent>
          </Tabs>
        </ShellContent>
      </Shell>
    </main>
  );
};

export default AdminDashboard;