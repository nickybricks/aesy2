import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Clock, CheckCircle2, XCircle, AlertCircle, ChevronDown, Play, Timer, TrendingUp, Database, Square, Trash2, AlertTriangle, Ban } from 'lucide-react';
import { useLanguage } from '@/context/LanguageContext';
import { formatDistanceToNow, format } from 'date-fns';
import { de, enUS } from 'date-fns/locale';

interface CronJob {
  jobid: number;
  jobname: string;
  schedule: string;
  active: boolean;
  database: string;
}

interface JobLog {
  id: string;
  job_name: string;
  trigger_source: string;
  started_at: string;
  completed_at: string | null;
  status: string;
  markets_processed: any;
  stocks_full_analyzed: number;
  stocks_price_updated: number;
  stocks_skipped: number;
  stocks_failed: number;
  total_api_calls: number;
  error_message: string | null;
  created_at: string;
}

const CronJobsOverview: React.FC = () => {
  const { language } = useLanguage();
  const { toast } = useToast();
  const [cronJobs, setCronJobs] = useState<CronJob[]>([]);
  const [jobLogs, setJobLogs] = useState<JobLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedLogs, setExpandedLogs] = useState<Set<string>>(new Set());
  const [triggeringJob, setTriggeringJob] = useState<string | null>(null);
  const [stoppingJob, setStoppingJob] = useState<string | null>(null);
  const [cleaningUp, setCleaningUp] = useState(false);

  const dateLocale = language === 'de' ? de : enUS;

  const loadData = async () => {
    setLoading(true);
    try {
      // Load job logs from our table
      const { data: logs, error: logsError } = await supabase
        .from('scheduled_job_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50);

      if (logsError) throw logsError;
      setJobLogs(logs || []);

      // Define known cron jobs manually since we can't query cron.job directly
      const knownJobs: CronJob[] = [
        { jobid: 6, jobname: 'quant-update-morning', schedule: '0 8 * * *', active: true, database: 'postgres' },
        { jobid: 7, jobname: 'quant-update-noon', schedule: '0 12 * * *', active: true, database: 'postgres' },
        { jobid: 8, jobname: 'quant-update-evening', schedule: '0 19 * * *', active: true, database: 'postgres' },
        { jobid: 1, jobname: 'daily-stock-price-update', schedule: '0 22 * * *', active: true, database: 'postgres' },
        { jobid: 4, jobname: 'daily-exchange-rates-update', schedule: '0 2 * * *', active: true, database: 'postgres' },
        { jobid: 5, jobname: 'calculate-precomputed-metrics-daily', schedule: '30 0 * * *', active: true, database: 'postgres' },
        { jobid: 2, jobname: 'weekly-full-analysis-update', schedule: '0 2 * * 0', active: true, database: 'postgres' },
        { jobid: 3, jobname: 'weekly-nasdaq-analysis-update', schedule: '30 2 * * 0', active: true, database: 'postgres' },
      ];
      setCronJobs(knownJobs);

    } catch (error) {
      console.error('Error loading cron jobs data:', error);
      toast({
        variant: "destructive",
        title: language === 'de' ? "Fehler" : "Error",
        description: language === 'de' ? "Daten konnten nicht geladen werden" : "Failed to load data"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, []);

  const triggerJob = async (jobName: string) => {
    setTriggeringJob(jobName);
    try {
      const { data, error } = await supabase.functions.invoke('scheduled-quant-update', {
        body: { trigger: 'manual-admin' }
      });

      if (error) throw error;

      toast({
        title: language === 'de' ? "Job gestartet" : "Job started",
        description: language === 'de' ? `${jobName} wurde manuell gestartet` : `${jobName} was triggered manually`
      });

      // Reload data after short delay
      setTimeout(loadData, 2000);
    } catch (error) {
      console.error('Error triggering job:', error);
      toast({
        variant: "destructive",
        title: language === 'de' ? "Fehler" : "Error",
        description: language === 'de' ? "Job konnte nicht gestartet werden" : "Failed to trigger job"
      });
    } finally {
      setTriggeringJob(null);
    }
  };

  const toggleLogExpanded = (logId: string) => {
    const newExpanded = new Set(expandedLogs);
    if (newExpanded.has(logId)) {
      newExpanded.delete(logId);
    } else {
      newExpanded.add(logId);
    }
    setExpandedLogs(newExpanded);
  };

  const stopJob = async (jobId: string, jobName: string) => {
    setStoppingJob(jobId);
    try {
      const { data, error } = await supabase.functions.invoke('stop-job', {
        body: { jobId }
      });

      if (error) throw error;

      toast({
        title: language === 'de' ? "Job gestoppt" : "Job stopped",
        description: language === 'de' ? `${jobName} wurde abgebrochen` : `${jobName} was cancelled`
      });

      setTimeout(loadData, 1000);
    } catch (error) {
      console.error('Error stopping job:', error);
      toast({
        variant: "destructive",
        title: language === 'de' ? "Fehler" : "Error",
        description: language === 'de' ? "Job konnte nicht gestoppt werden" : "Failed to stop job"
      });
    } finally {
      setStoppingJob(null);
    }
  };

  const cleanupStaleJobs = async () => {
    setCleaningUp(true);
    try {
      const { data, error } = await supabase.functions.invoke('cleanup-stale-jobs');

      if (error) throw error;

      toast({
        title: language === 'de' ? "Bereinigung abgeschlossen" : "Cleanup complete",
        description: language === 'de' 
          ? `${data.cleaned} verwaiste Jobs wurden bereinigt` 
          : `${data.cleaned} stale jobs were cleaned up`
      });

      setTimeout(loadData, 1000);
    } catch (error) {
      console.error('Error cleaning up jobs:', error);
      toast({
        variant: "destructive",
        title: language === 'de' ? "Fehler" : "Error",
        description: language === 'de' ? "Bereinigung fehlgeschlagen" : "Cleanup failed"
      });
    } finally {
      setCleaningUp(false);
    }
  };

  const formatSchedule = (schedule: string): string => {
    const parts = schedule.split(' ');
    if (parts.length !== 5) return schedule;
    
    const [min, hour, dayMonth, month, dayWeek] = parts;
    
    let time = `${hour.padStart(2, '0')}:${min.padStart(2, '0')} UTC`;
    
    if (dayWeek === '0') {
      return language === 'de' ? `Sonntags ${time}` : `Sundays ${time}`;
    }
    if (dayMonth === '*' && month === '*' && dayWeek === '*') {
      return language === 'de' ? `Täglich ${time}` : `Daily ${time}`;
    }
    
    return `${schedule} (${time})`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <Badge className="bg-success/20 text-success border-success/30 gap-1">
            <CheckCircle2 className="h-3 w-3" />
            {language === 'de' ? 'Abgeschlossen' : 'Completed'}
          </Badge>
        );
      case 'running':
        return (
          <Badge className="bg-info/20 text-info border-info/30 gap-1 animate-pulse">
            <RefreshCw className="h-3 w-3 animate-spin" />
            {language === 'de' ? 'Läuft' : 'Running'}
          </Badge>
        );
      case 'failed':
        return (
          <Badge className="bg-destructive/20 text-destructive border-destructive/30 gap-1">
            <XCircle className="h-3 w-3" />
            {language === 'de' ? 'Fehlgeschlagen' : 'Failed'}
          </Badge>
        );
      case 'stale':
        return (
          <Badge className="bg-warning/20 text-warning border-warning/30 gap-1">
            <AlertTriangle className="h-3 w-3" />
            {language === 'de' ? 'Verwaist' : 'Stale'}
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-muted text-muted-foreground border-muted-foreground/30 gap-1">
            <Ban className="h-3 w-3" />
            {language === 'de' ? 'Abgebrochen' : 'Cancelled'}
          </Badge>
        );
      default:
        return (
          <Badge variant="outline" className="gap-1">
            <AlertCircle className="h-3 w-3" />
            {status}
          </Badge>
        );
    }
  };

  const getTriggerLabel = (trigger: string): string => {
    const labels: Record<string, { de: string; en: string }> = {
      'morning': { de: 'Morgen-Job', en: 'Morning job' },
      'noon': { de: 'Mittag-Job', en: 'Noon job' },
      'evening': { de: 'Abend-Job', en: 'Evening job' },
      'manual': { de: 'Manuell', en: 'Manual' },
      'manual-admin': { de: 'Admin manuell', en: 'Admin manual' },
      'test': { de: 'Test', en: 'Test' },
      'manual-test': { de: 'Manueller Test', en: 'Manual test' }
    };
    return labels[trigger]?.[language] || trigger;
  };

  const getDuration = (started: string, completed: string | null): string => {
    const start = new Date(started);
    const end = completed ? new Date(completed) : new Date();
    const diffMs = end.getTime() - start.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffSecs = Math.floor((diffMs % 60000) / 1000);
    
    if (diffMins > 0) {
      return `${diffMins}m ${diffSecs}s`;
    }
    return `${diffSecs}s`;
  };

  const runningJobs = jobLogs.filter(j => j.status === 'running');
  const staleJobs = jobLogs.filter(j => j.status === 'stale');
  const completedToday = jobLogs.filter(j => 
    j.status === 'completed' && 
    new Date(j.created_at).toDateString() === new Date().toDateString()
  ).length;
  const failedToday = jobLogs.filter(j => 
    j.status === 'failed' && 
    new Date(j.created_at).toDateString() === new Date().toDateString()
  ).length;
  
  // Check for orphaned running jobs (running for more than 3 hours)
  const threeHoursAgo = Date.now() - 3 * 60 * 60 * 1000;
  const orphanedRunningJobs = runningJobs.filter(j => 
    new Date(j.started_at).getTime() < threeHoursAgo
  );

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'de' ? 'Aktive Cron Jobs' : 'Active Cron Jobs'}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{cronJobs.filter(j => j.active).length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'de' ? 'Gerade laufend' : 'Currently running'}
            </CardTitle>
            <RefreshCw className={`h-4 w-4 ${runningJobs.length > 0 ? 'text-info animate-spin' : 'text-muted-foreground'}`} />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{runningJobs.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'de' ? 'Heute erfolgreich' : 'Completed today'}
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{completedToday}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              {language === 'de' ? 'Heute fehlgeschlagen' : 'Failed today'}
            </CardTitle>
            <XCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{failedToday}</div>
          </CardContent>
        </Card>
      </div>

      {/* Warning for orphaned jobs */}
      {orphanedRunningJobs.length > 0 && (
        <Card className="border-warning bg-warning/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-warning" />
              <CardTitle className="text-warning">
                {language === 'de' 
                  ? `${orphanedRunningJobs.length} verwaiste Jobs gefunden` 
                  : `${orphanedRunningJobs.length} orphaned jobs found`}
              </CardTitle>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={cleanupStaleJobs}
              disabled={cleaningUp}
              className="border-warning text-warning hover:bg-warning/20"
            >
              {cleaningUp ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4 mr-2" />
              )}
              {language === 'de' ? 'Bereinigen' : 'Cleanup'}
            </Button>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              {language === 'de' 
                ? 'Diese Jobs laufen seit mehr als 3 Stunden und sind wahrscheinlich hängengeblieben. Klicken Sie auf "Bereinigen", um sie als "verwaist" zu markieren.'
                : 'These jobs have been running for more than 3 hours and are likely stuck. Click "Cleanup" to mark them as stale.'}
            </p>
            <div className="mt-2 flex flex-wrap gap-2">
              {orphanedRunningJobs.map(job => (
                <Badge key={job.id} variant="outline" className="text-warning border-warning">
                  {job.job_name} ({getDuration(job.started_at, null)})
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Scheduled Cron Jobs */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>{language === 'de' ? 'Geplante Cron Jobs' : 'Scheduled Cron Jobs'}</CardTitle>
            <CardDescription>
              {language === 'de' ? 'Alle konfigurierten automatischen Jobs' : 'All configured automatic jobs'}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={loadData} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            {language === 'de' ? 'Aktualisieren' : 'Refresh'}
          </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{language === 'de' ? 'Job Name' : 'Job Name'}</TableHead>
                <TableHead>{language === 'de' ? 'Zeitplan' : 'Schedule'}</TableHead>
                <TableHead>{language === 'de' ? 'Status' : 'Status'}</TableHead>
                <TableHead>{language === 'de' ? 'Letzte Ausführung' : 'Last Run'}</TableHead>
                <TableHead>{language === 'de' ? 'Aktion' : 'Action'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cronJobs.map((job) => {
                const lastRun = jobLogs.find(l => l.job_name.includes(job.jobname.replace('quant-update-', '')));
                const isQuant = job.jobname.startsWith('quant-update-');
                
                return (
                  <TableRow key={job.jobid}>
                    <TableCell className="font-medium">{job.jobname}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {formatSchedule(job.schedule)}
                      </code>
                    </TableCell>
                    <TableCell>
                      {job.active ? (
                        <Badge className="bg-success/20 text-success border-success/30">
                          {language === 'de' ? 'Aktiv' : 'Active'}
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          {language === 'de' ? 'Inaktiv' : 'Inactive'}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {lastRun ? (
                        <span className="text-sm text-muted-foreground">
                          {formatDistanceToNow(new Date(lastRun.created_at), { addSuffix: true, locale: dateLocale })}
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isQuant && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => triggerJob(job.jobname)}
                          disabled={triggeringJob === job.jobname || runningJobs.length > 0}
                        >
                          {triggeringJob === job.jobname ? (
                            <RefreshCw className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Job Execution Logs */}
      <Card>
        <CardHeader>
          <CardTitle>{language === 'de' ? 'Ausführungs-Logs' : 'Execution Logs'}</CardTitle>
          <CardDescription>
            {language === 'de' ? 'Verlauf der Job-Ausführungen mit Details' : 'Job execution history with details'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {jobLogs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {language === 'de' ? 'Keine Logs vorhanden' : 'No logs available'}
            </div>
          ) : (
            jobLogs.map((log) => (
              <Collapsible
                key={log.id}
                open={expandedLogs.has(log.id)}
                onOpenChange={() => toggleLogExpanded(log.id)}
              >
                <div className="border rounded-lg overflow-hidden">
                  <CollapsibleTrigger asChild>
                    <div className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors">
                      <div className="flex items-center gap-4">
                        {getStatusBadge(log.status)}
                        <div>
                          <div className="font-medium">{log.job_name}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-2">
                            <span>{getTriggerLabel(log.trigger_source)}</span>
                            <span>•</span>
                            <span>{format(new Date(log.created_at), 'dd.MM.yyyy HH:mm', { locale: dateLocale })}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right text-sm">
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <Timer className="h-3 w-3" />
                            {getDuration(log.started_at, log.completed_at)}
                          </div>
                          <div className="flex items-center gap-1 text-muted-foreground">
                            <TrendingUp className="h-3 w-3" />
                            {log.stocks_full_analyzed + log.stocks_price_updated} {language === 'de' ? 'Aktien' : 'stocks'}
                          </div>
                        </div>
                        {log.status === 'running' && (
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation();
                              stopJob(log.id, log.job_name);
                            }}
                            disabled={stoppingJob === log.id}
                          >
                            {stoppingJob === log.id ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : (
                              <Square className="h-4 w-4" />
                            )}
                          </Button>
                        )}
                        <ChevronDown className={`h-4 w-4 transition-transform ${expandedLogs.has(log.id) ? 'rotate-180' : ''}`} />
                      </div>
                    </div>
                  </CollapsibleTrigger>
                  
                  <CollapsibleContent>
                    <div className="border-t p-4 bg-muted/30 space-y-4">
                      {/* Stats Grid */}
                      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-xs text-muted-foreground mb-1">
                            {language === 'de' ? 'Vollanalyse' : 'Full Analysis'}
                          </div>
                          <div className="text-lg font-semibold text-success">
                            {log.stocks_full_analyzed.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-xs text-muted-foreground mb-1">
                            {language === 'de' ? 'Preis-Update' : 'Price Update'}
                          </div>
                          <div className="text-lg font-semibold text-info">
                            {log.stocks_price_updated.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-xs text-muted-foreground mb-1">
                            {language === 'de' ? 'Übersprungen' : 'Skipped'}
                          </div>
                          <div className="text-lg font-semibold text-muted-foreground">
                            {log.stocks_skipped.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-xs text-muted-foreground mb-1">
                            {language === 'de' ? 'Fehlgeschlagen' : 'Failed'}
                          </div>
                          <div className={`text-lg font-semibold ${log.stocks_failed > 0 ? 'text-destructive' : 'text-muted-foreground'}`}>
                            {log.stocks_failed.toLocaleString()}
                          </div>
                        </div>
                        <div className="bg-background rounded-lg p-3 border">
                          <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                            <Database className="h-3 w-3" />
                            {language === 'de' ? 'API Aufrufe' : 'API Calls'}
                          </div>
                          <div className="text-lg font-semibold">
                            {log.total_api_calls.toLocaleString()}
                          </div>
                        </div>
                      </div>

                      {/* Markets Processed */}
                      {log.markets_processed && log.markets_processed.length > 0 && (
                        <div>
                          <div className="text-sm font-medium mb-2">
                            {language === 'de' ? 'Verarbeitete Märkte' : 'Markets Processed'}
                          </div>
                          <div className="flex gap-2 flex-wrap">
                            {log.markets_processed.map((market: any, idx: number) => (
                              <Badge key={idx} variant="outline" className="gap-1">
                                {market.market}: {market.fullAnalysis || 0} {language === 'de' ? 'analysiert' : 'analyzed'}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {log.error_message && !log.error_message.startsWith('{') && (
                        <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-3">
                          <div className="text-sm font-medium text-destructive mb-1">
                            {language === 'de' ? 'Fehlermeldung' : 'Error Message'}
                          </div>
                          <code className="text-xs text-destructive/80 break-all">
                            {log.error_message}
                          </code>
                        </div>
                      )}

                      {/* Timestamps */}
                      <div className="flex gap-6 text-xs text-muted-foreground">
                        <div>
                          <span className="font-medium">{language === 'de' ? 'Gestartet: ' : 'Started: '}</span>
                          {format(new Date(log.started_at), 'dd.MM.yyyy HH:mm:ss', { locale: dateLocale })}
                        </div>
                        {log.completed_at && (
                          <div>
                            <span className="font-medium">{language === 'de' ? 'Beendet: ' : 'Completed: '}</span>
                            {format(new Date(log.completed_at), 'dd.MM.yyyy HH:mm:ss', { locale: dateLocale })}
                          </div>
                        )}
                      </div>
                    </div>
                  </CollapsibleContent>
                </div>
              </Collapsible>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default CronJobsOverview;
