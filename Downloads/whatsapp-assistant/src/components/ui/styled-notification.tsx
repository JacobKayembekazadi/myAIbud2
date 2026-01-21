"use client";

import React from "react";
import { cn } from "@/lib/utils";
import {
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Bell,
  X,
  MessageSquare,
  User,
  Sparkles,
  Clock,
  TrendingUp,
  Phone,
} from "lucide-react";
import { Button } from "./button";

// ============================================
// TOAST NOTIFICATIONS
// ============================================

export type ToastType = "success" | "error" | "warning" | "info" | "message";

interface StyledToastProps {
  type: ToastType;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  onClose?: () => void;
  className?: string;
}

const toastStyles: Record<ToastType, { bg: string; icon: React.ElementType; iconColor: string }> = {
  success: {
    bg: "bg-gradient-to-r from-emerald-500 to-green-600",
    icon: CheckCircle,
    iconColor: "text-white",
  },
  error: {
    bg: "bg-gradient-to-r from-red-500 to-rose-600",
    icon: XCircle,
    iconColor: "text-white",
  },
  warning: {
    bg: "bg-gradient-to-r from-amber-500 to-orange-500",
    icon: AlertTriangle,
    iconColor: "text-white",
  },
  info: {
    bg: "bg-gradient-to-r from-blue-500 to-indigo-600",
    icon: Info,
    iconColor: "text-white",
  },
  message: {
    bg: "bg-gradient-to-r from-violet-500 to-purple-600",
    icon: MessageSquare,
    iconColor: "text-white",
  },
};

export function StyledToast({
  type,
  title,
  description,
  action,
  onClose,
  className,
}: StyledToastProps) {
  const { bg, icon: Icon, iconColor } = toastStyles[type];

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl shadow-lg text-white min-w-[320px] max-w-[420px]",
        bg,
        className
      )}
    >
      <div className={cn("flex-shrink-0 mt-0.5", iconColor)}>
        <Icon className="h-5 w-5" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{title}</p>
        {description && (
          <p className="text-sm text-white/80 mt-1">{description}</p>
        )}
        {action && (
          <button
            onClick={action.onClick}
            className="mt-2 text-sm font-medium underline hover:no-underline"
          >
            {action.label}
          </button>
        )}
      </div>

      {onClose && (
        <button
          onClick={onClose}
          className="flex-shrink-0 text-white/60 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// NOTIFICATION CARDS
// ============================================

interface NotificationCardProps {
  type: "new_lead" | "handoff" | "hot_lead" | "appointment" | "message";
  title: string;
  description: string;
  time: string | number;
  avatar?: string;
  isRead?: boolean;
  onClick?: () => void;
  onDismiss?: () => void;
  className?: string;
}

const notificationIcons: Record<NotificationCardProps["type"], React.ElementType> = {
  new_lead: User,
  handoff: Phone,
  hot_lead: TrendingUp,
  appointment: Clock,
  message: MessageSquare,
};

const notificationColors: Record<NotificationCardProps["type"], string> = {
  new_lead: "from-blue-500 to-cyan-500",
  handoff: "from-orange-500 to-red-500",
  hot_lead: "from-green-500 to-emerald-500",
  appointment: "from-purple-500 to-violet-500",
  message: "from-indigo-500 to-blue-500",
};

export function NotificationCard({
  type,
  title,
  description,
  time,
  avatar,
  isRead = false,
  onClick,
  onDismiss,
  className,
}: NotificationCardProps) {
  const Icon = notificationIcons[type];
  const gradientColor = notificationColors[type];

  const formatTime = (t: string | number) => {
    if (typeof t === "string") return t;
    const diff = Date.now() - t;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div
      onClick={onClick}
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-xl border transition-all cursor-pointer",
        isRead
          ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800"
          : "bg-slate-50 dark:bg-slate-800/50 border-slate-300 dark:border-slate-700 shadow-sm",
        onClick && "hover:shadow-md hover:border-slate-400 dark:hover:border-slate-600",
        className
      )}
    >
      {/* Unread indicator */}
      {!isRead && (
        <div className="absolute top-4 left-0 w-1 h-8 rounded-r-full bg-gradient-to-b from-blue-500 to-indigo-500" />
      )}

      {/* Icon/Avatar */}
      {avatar ? (
        <img
          src={avatar}
          alt=""
          className="w-10 h-10 rounded-full object-cover flex-shrink-0"
        />
      ) : (
        <div
          className={cn(
            "w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 bg-gradient-to-br text-white",
            gradientColor
          )}
        >
          <Icon className="h-5 w-5" />
        </div>
      )}

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <p className={cn("font-medium text-sm truncate", !isRead && "font-semibold")}>
            {title}
          </p>
          <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
            {formatTime(time)}
          </span>
        </div>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-0.5 line-clamp-2">
          {description}
        </p>
      </div>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// AI INSIGHT CARD
// ============================================

interface AIInsightCardProps {
  title: string;
  insight: string;
  confidence?: number;
  source?: string;
  type?: "suggestion" | "warning" | "insight";
  actions?: { label: string; onClick: () => void }[];
  className?: string;
}

export function AIInsightCard({
  title,
  insight,
  confidence,
  source,
  type = "insight",
  actions,
  className,
}: AIInsightCardProps) {
  const bgColors = {
    suggestion: "from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30",
    warning: "from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30",
    insight: "from-violet-50 to-purple-50 dark:from-violet-950/30 dark:to-purple-950/30",
  };

  const borderColors = {
    suggestion: "border-blue-200 dark:border-blue-800",
    warning: "border-amber-200 dark:border-amber-800",
    insight: "border-violet-200 dark:border-violet-800",
  };

  const iconColors = {
    suggestion: "text-blue-600 dark:text-blue-400",
    warning: "text-amber-600 dark:text-amber-400",
    insight: "text-violet-600 dark:text-violet-400",
  };

  return (
    <div
      className={cn(
        "rounded-xl border p-4 bg-gradient-to-br",
        bgColors[type],
        borderColors[type],
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className={cn("h-4 w-4", iconColors[type])} />
        <span className={cn("text-sm font-semibold", iconColors[type])}>{title}</span>
        {confidence !== undefined && (
          <span className="ml-auto text-xs text-slate-500 dark:text-slate-400">
            {Math.round(confidence * 100)}% confidence
          </span>
        )}
      </div>

      {/* Insight text */}
      <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
        {insight}
      </p>

      {/* Source */}
      {source && (
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 italic">
          Source: {source}
        </p>
      )}

      {/* Actions */}
      {actions && actions.length > 0 && (
        <div className="flex gap-2 mt-3">
          {actions.map((action, i) => (
            <Button
              key={i}
              size="sm"
              variant={i === 0 ? "default" : "outline"}
              onClick={action.onClick}
              className="text-xs"
            >
              {action.label}
            </Button>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// POPUP MODAL
// ============================================

interface StyledPopupProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  type?: "default" | "success" | "warning" | "error";
  children?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export function StyledPopup({
  isOpen,
  onClose,
  title,
  description,
  icon,
  type = "default",
  children,
  actions,
  className,
}: StyledPopupProps) {
  if (!isOpen) return null;

  const headerColors = {
    default: "from-slate-600 to-slate-700",
    success: "from-emerald-500 to-green-600",
    warning: "from-amber-500 to-orange-500",
    error: "from-red-500 to-rose-600",
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={cn(
          "relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden",
          className
        )}
      >
        {/* Header */}
        <div
          className={cn(
            "bg-gradient-to-r text-white p-6",
            headerColors[type]
          )}
        >
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>

          {icon && <div className="mb-3">{icon}</div>}
          <h3 className="text-xl font-bold">{title}</h3>
          {description && (
            <p className="text-sm text-white/80 mt-1">{description}</p>
          )}
        </div>

        {/* Content */}
        {children && (
          <div className="p-6">
            {children}
          </div>
        )}

        {/* Actions */}
        {actions && (
          <div className="px-6 pb-6 flex gap-3 justify-end">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================
// STAT CARD (for dashboard)
// ============================================

interface StatCardProps {
  title: string;
  value: string | number;
  change?: { value: number; label: string };
  icon?: React.ReactNode;
  trend?: "up" | "down" | "neutral";
  className?: string;
}

export function StatCard({
  title,
  value,
  change,
  icon,
  trend,
  className,
}: StatCardProps) {
  const trendColors = {
    up: "text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30",
    down: "text-red-600 dark:text-red-400 bg-red-100 dark:bg-red-900/30",
    neutral: "text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-slate-800",
  };

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
          <p className="text-2xl font-bold mt-1 text-slate-900 dark:text-slate-100">
            {value}
          </p>
        </div>
        {icon && (
          <div className="p-2 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400">
            {icon}
          </div>
        )}
      </div>

      {change && trend && (
        <div className="mt-3 flex items-center gap-2">
          <span
            className={cn(
              "text-xs font-medium px-2 py-0.5 rounded-full",
              trendColors[trend]
            )}
          >
            {trend === "up" ? "+" : trend === "down" ? "-" : ""}
            {Math.abs(change.value)}%
          </span>
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {change.label}
          </span>
        </div>
      )}
    </div>
  );
}
