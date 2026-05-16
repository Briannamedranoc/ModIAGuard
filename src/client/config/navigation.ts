import type { LucideIcon } from 'lucide-react';
import {
  Bot,
  ClipboardList,
  FlaskConical,
  History,
  MessageSquareWarning,
  ScrollText,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

export type NavItem = {
  label: string;
  path: string;
  description: string;
  icon: LucideIcon;
};

export const PANEL_TITLE = 'AI Auto-Analyzer Panel';
export const BRAND_NAME = 'ModAiGuard';

export const NAV_ITEMS: NavItem[] = [
  {
    label: 'Toxicity Analyzer',
    path: '/toxicity-analyzer',
    description: 'Score tone, aggression, and harmful language.',
    icon: ShieldAlert,
  },
  {
    label: 'Spam Detector',
    path: '/spam-detector',
    description: 'Flag repetitive or promotional patterns.',
    icon: Sparkles,
  },
  {
    label: 'Report Review',
    path: '/report-review',
    description: 'Triage community reports in one place.',
    icon: ClipboardList,
  },
  {
    label: 'Moderations Panel',
    path: '/moderations-panel',
    description: 'Full history of human and AI moderation actions.',
    icon: ShieldCheck,
  },
  {
    label: 'Auto-Moderation',
    path: '/auto-moderation',
    description: 'Automatically moderate the mod queue with AI.',
    icon: Zap,
  },
  {
    label: 'Demo Mode',
    path: '/demo-mode',
    description: 'Generate fake posts to demo the AI pipeline for judges.',
    icon: FlaskConical,
  },
  {
    label: 'Auto-Responder',
    path: '/auto-responder',
    description: 'Draft moderator replies with guardrails.',
    icon: Bot,
  },
  {
    label: 'Moderator Recommendations',
    path: '/moderator-recommendations',
    description: 'Suggested actions ranked by confidence.',
    icon: MessageSquareWarning,
  },
  {
    label: 'Logs',
    path: '/logs',
    description: 'Stream of automated checks and events.',
    icon: ScrollText,
  },
  {
    label: 'History',
    path: '/history',
    description: 'Past decisions and audit trail.',
    icon: History,
  },
];

export function getNavItemByPath(pathname: string): NavItem | undefined {
  return NAV_ITEMS.find((item) => item.path === pathname);
}
