// Notification service for managing match summaries and reminders
import React from 'react';
import { useToast } from "@/hooks/use-toast";

export interface MatchSummaryConfig {
  id: string;
  name: string;
  description: string;
  trigger: 'before_match' | 'after_match' | 'live_match';
  triggerTime?: number; // minutes before/after match
  enabled: boolean;
  template: string;
  actions?: string[];
}

export interface NotificationPreferences {
  userId?: string;
  summaryConfigs: MatchSummaryConfig[];
  globalEnabled: boolean;
  sound: boolean;
  email: boolean;
  push: boolean;
}

// Default summary configurations
const DEFAULT_SUMMARY_CONFIGS: MatchSummaryConfig[] = [
  {
    id: 'pre_match_1h',
    name: '+1 Hour Away Summary',
    description: 'Summary sent 1 hour before match starts',
    trigger: 'before_match',
    triggerTime: 60, // 60 minutes before
    enabled: true,
    template: 'Match starting in 1 hour: {homeTeam} vs {awayTeam}. Get ready for kickoff!',
    actions: ['view_lineup', 'set_reminder', 'view_stats']
  },
  {
    id: 'full_time',
    name: 'Full-time (Finished Match) Summary',
    description: 'Summary sent immediately when match finishes',
    trigger: 'after_match',
    triggerTime: 0, // immediately after match ends
    enabled: true,
    template: 'FULL TIME: {homeTeam} {homeScore} - {awayScore} {awayTeam}. {result}',
    actions: ['view_highlights', 'view_stats', 'share_result']
  },
  {
    id: 'half_time',
    name: 'Half-time Summary',
    description: 'Summary sent at half-time',
    trigger: 'live_match',
    triggerTime: 45, // at 45 minutes
    enabled: false,
    template: 'Half-time: {homeTeam} {homeScore} - {awayScore} {awayTeam}',
    actions: ['view_live_stats']
  },
  {
    id: 'post_match_highlights',
    name: 'Post-match Highlights Available',
    description: 'Notification when match highlights are ready',
    trigger: 'after_match',
    triggerTime: 120, // 2 hours after match
    enabled: true,
    template: 'Highlights now available for {homeTeam} vs {awayTeam}!',
    actions: ['watch_highlights', 'view_stats']
  }
];

class NotificationService {
  private preferences: NotificationPreferences;
  private activeReminders: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.preferences = this.loadPreferences();
  }

  // Load preferences from localStorage or use defaults
  private loadPreferences(): NotificationPreferences {
    try {
      const saved = localStorage.getItem('notification_preferences');
      if (saved) {
        const parsed = JSON.parse(saved);
        return {
          ...parsed,
          summaryConfigs: [...DEFAULT_SUMMARY_CONFIGS, ...(parsed.summaryConfigs || [])]
        };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }

    return {
      summaryConfigs: DEFAULT_SUMMARY_CONFIGS,
      globalEnabled: true,
      sound: true,
      email: false,
      push: true
    };
  }

  // Save preferences to localStorage
  private savePreferences(): void {
    try {
      localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.error('Error saving notification preferences:', error);
    }
  }

  // Get all summary configurations
  getSummaryConfigs(): MatchSummaryConfig[] {
    return this.preferences.summaryConfigs;
  }

  // Get specific summary configuration
  getSummaryConfig(id: string): MatchSummaryConfig | undefined {
    return this.preferences.summaryConfigs.find(config => config.id === id);
  }

  // Update summary configuration
  updateSummaryConfig(id: string, updates: Partial<MatchSummaryConfig>): void {
    const index = this.preferences.summaryConfigs.findIndex(config => config.id === id);
    if (index !== -1) {
      this.preferences.summaryConfigs[index] = {
        ...this.preferences.summaryConfigs[index],
        ...updates
      };
      this.savePreferences();
    }
  }

  // Toggle summary configuration enabled/disabled
  toggleSummaryConfig(id: string): void {
    const config = this.getSummaryConfig(id);
    if (config) {
      this.updateSummaryConfig(id, { enabled: !config.enabled });
    }
  }

  // Set up notifications for a specific match
  setupMatchNotifications(match: any): void {
    if (!this.preferences.globalEnabled) return;

    const enabledConfigs = this.preferences.summaryConfigs.filter(config => config.enabled);

    enabledConfigs.forEach(config => {
      this.scheduleNotification(match, config);
    });
  }

  // Schedule a notification based on configuration
  private scheduleNotification(match: any, config: MatchSummaryConfig): void {
    const matchDate = new Date(match.date);
    const now = new Date();
    let notificationTime: Date;

    switch (config.trigger) {
      case 'before_match':
        notificationTime = new Date(matchDate.getTime() - (config.triggerTime || 0) * 60 * 1000);
        break;
      case 'after_match':
        notificationTime = new Date(matchDate.getTime() + (config.triggerTime || 0) * 60 * 1000);
        break;
      case 'live_match':
        notificationTime = new Date(matchDate.getTime() + (config.triggerTime || 0) * 60 * 1000);
        break;
      default:
        return;
    }

    // Only schedule if notification time is in the future
    if (notificationTime > now) {
      const timeUntilNotification = notificationTime.getTime() - now.getTime();
      const timeoutId = setTimeout(() => {
        this.sendNotification(match, config);
      }, timeUntilNotification);

      const reminderKey = `${match.id}-${config.id}`;
      this.activeReminders.set(reminderKey, timeoutId);
    }
  }

  // Send notification
  private sendNotification(match: any, config: MatchSummaryConfig): void {
    const message = this.formatNotificationMessage(match, config);
    
    // Show toast notification
    if (typeof window !== 'undefined') {
      const event = new CustomEvent('show-match-notification', {
        detail: {
          title: config.name,
          message,
          actions: config.actions,
          match
        }
      });
      window.dispatchEvent(event);
    }

    console.log(`[NotificationService] ${config.name}: ${message}`);
  }

  // Format notification message with match data
  private formatNotificationMessage(match: any, config: MatchSummaryConfig): string {
    let message = config.template;
    
    // Replace template variables
    message = message.replace('{homeTeam}', match.homeTeam?.name || 'Home Team');
    message = message.replace('{awayTeam}', match.awayTeam?.name || 'Away Team');
    message = message.replace('{homeScore}', match.score?.home?.toString() || '0');
    message = message.replace('{awayScore}', match.score?.away?.toString() || '0');
    
    // Generate result text for full-time notifications
    if (config.id === 'full_time' && match.score) {
      const homeScore = match.score.home || 0;
      const awayScore = match.score.away || 0;
      let result = '';
      
      if (homeScore > awayScore) {
        result = `${match.homeTeam?.name || 'Home Team'} wins!`;
      } else if (awayScore > homeScore) {
        result = `${match.awayTeam?.name || 'Away Team'} wins!`;
      } else {
        result = 'Match ends in a draw!';
      }
      
      message = message.replace('{result}', result);
    }
    
    return message;
  }

  // Check if a match should trigger full-time notification
  checkFullTimeNotification(match: any): void {
    const fullTimeConfig = this.getSummaryConfig('full_time');
    if (!fullTimeConfig || !fullTimeConfig.enabled) return;

    // Check if match is finished and has a score
    const isFinished = match.status === 'finished' || match.status === 'ft';
    const hasScore = match.score && (match.score.home !== undefined && match.score.away !== undefined);
    
    if (isFinished && hasScore) {
      this.sendNotification(match, fullTimeConfig);
    }
  }

  // Clear all active reminders for a match
  clearMatchReminders(matchId: string): void {
    const keysToDelete: string[] = [];
    
    this.activeReminders.forEach((timeoutId, key) => {
      if (key.startsWith(`${matchId}-`)) {
        clearTimeout(timeoutId);
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.activeReminders.delete(key));
  }

  // Get notification preferences
  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Update notification preferences
  updatePreferences(updates: Partial<NotificationPreferences>): void {
    this.preferences = { ...this.preferences, ...updates };
    this.savePreferences();
  }

  // Clear all active reminders
  clearAllReminders(): void {
    this.activeReminders.forEach(timeoutId => clearTimeout(timeoutId));
    this.activeReminders.clear();
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Hook for using notification service in React components
export const useNotificationService = () => {
  const { toast } = useToast();

  // Listen for notification events
  React.useEffect(() => {
    const handleNotification = (event: CustomEvent) => {
      const { title, message, actions, match } = event.detail;
      
      toast({
        title,
        description: message,
        duration: 8000, // Show for 8 seconds
      });
      
      // Handle action buttons separately if needed
      if (actions?.includes('view_highlights')) {
        console.log(`Action available: View highlights for match ${match.id}`);
      }
    };

    window.addEventListener('show-match-notification', handleNotification as EventListener);
    
    return () => {
      window.removeEventListener('show-match-notification', handleNotification as EventListener);
    };
  }, [toast]);

  return notificationService;
};

export default notificationService; 