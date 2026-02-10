import {
  TrendingUp,
  TrendingDown,
  BarChart2,
  LineChart,
  PieChart,
  DollarSign,
  Users,
  Activity,
  Target,
  Calendar,
  Percent,
  Package,
  FileText,
  CheckCircle,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Heart,
  Zap,
  Clock,
  Award,
  Star,
  Shield,
  AlertCircle,
  LayoutDashboard,
  MessageSquare,
  Mail,
  Lightbulb,
  Settings,
  Bell,
  Briefcase,
  Pill,
  Smartphone,
  HeartPulse,
  Stethoscope,
  Sparkles,
  Send,
  type LucideIcon
} from 'lucide-react';

export interface IconOption {
  name: string;
  component: LucideIcon;
  color: string;
}

export const METRIC_ICON_OPTIONS: IconOption[] = [
  { name: 'LayoutDashboard', component: LayoutDashboard, color: '#6b7280' },
  { name: 'Users', component: Users, color: '#3b82f6' },
  { name: 'MessageSquare', component: MessageSquare, color: '#8b5cf6' },
  { name: 'Mail', component: Mail, color: '#3b82f6' },
  { name: 'FileText', component: FileText, color: '#64748b' },
  { name: 'Heart', component: Heart, color: '#ec4899' },
  { name: 'DollarSign', component: DollarSign, color: '#10b981' },
  { name: 'Activity', component: Activity, color: '#f59e0b' },
  { name: 'Target', component: Target, color: '#8b5cf6' },
  { name: 'TrendingUp', component: TrendingUp, color: '#10b981' },
  { name: 'TrendingDown', component: TrendingDown, color: '#ef4444' },
  { name: 'Calendar', component: Calendar, color: '#6366f1' },
  { name: 'Clock', component: Clock, color: '#64748b' },
  { name: 'CheckCircle', component: CheckCircle, color: '#10b981' },
  { name: 'Star', component: Star, color: '#fbbf24' },
  { name: 'Lightbulb', component: Lightbulb, color: '#eab308' },
  { name: 'Settings', component: Settings, color: '#64748b' },
  { name: 'BarChart2', component: BarChart2, color: '#6b7280' },
  { name: 'LineChart', component: LineChart, color: '#3b82f6' },
  { name: 'PieChart', component: PieChart, color: '#8b5cf6' },
  { name: 'Bell', component: Bell, color: '#f59e0b' },
  { name: 'Shield', component: Shield, color: '#6366f1' },
  { name: 'Award', component: Award, color: '#f59e0b' },
  { name: 'Briefcase', component: Briefcase, color: '#64748b' },
  { name: 'Pill', component: Pill, color: '#ec4899' },
  { name: 'Smartphone', component: Smartphone, color: '#3b82f6' },
  { name: 'HeartPulse', component: HeartPulse, color: '#ef4444' },
  { name: 'Stethoscope', component: Stethoscope, color: '#6366f1' },
  { name: 'Sparkles', component: Sparkles, color: '#fbbf24' },
  { name: 'Zap', component: Zap, color: '#eab308' },
  { name: 'Layers', component: Layers, color: '#6366f1' },
  { name: 'AlertCircle', component: AlertCircle, color: '#f59e0b' },
  { name: 'Send', component: Send, color: '#3b82f6' },
  { name: 'Percent', component: Percent, color: '#14b8a6' },
  { name: 'Package', component: Package, color: '#f97316' },
  { name: 'ArrowUpRight', component: ArrowUpRight, color: '#10b981' },
  { name: 'ArrowDownRight', component: ArrowDownRight, color: '#ef4444' },
];

export const categoryDefaultIcons: Record<string, string> = {
  enrollment: 'Users',
  financial: 'DollarSign',
  engagement: 'Activity',
  outcomes: 'Target',
  custom: 'BarChart2'
};

export function getIconComponent(iconName: string | null | undefined, category?: string): IconOption {
  if (iconName) {
    const icon = METRIC_ICON_OPTIONS.find(opt => opt.name === iconName);
    if (icon) return icon;
  }

  if (category && categoryDefaultIcons[category]) {
    const defaultIconName = categoryDefaultIcons[category];
    const icon = METRIC_ICON_OPTIONS.find(opt => opt.name === defaultIconName);
    if (icon) return icon;
  }

  return METRIC_ICON_OPTIONS.find(opt => opt.name === 'BarChart2') || METRIC_ICON_OPTIONS[0];
}
