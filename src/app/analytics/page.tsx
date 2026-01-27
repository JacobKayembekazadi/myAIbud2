"use client";

import { useAuth } from "@clerk/nextjs";
import { useQuery } from "convex/react";
import { api } from "@/../convex/_generated/api";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  BarChart3,
  TrendingUp,
  Users,
  MessageSquare,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

type TimeRange = 7 | 14 | 30 | 90;

export default function AnalyticsPage() {
  const { userId } = useAuth();
  const tenant = useQuery(api.tenants.getTenant, userId ? { clerkId: userId } : "skip");
  const [timeRange, setTimeRange] = useState<TimeRange>(30);

  if (!tenant) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading...</div>
      </div>
    );
  }

  return <AnalyticsContent tenantId={tenant._id} timeRange={timeRange} setTimeRange={setTimeRange} />;
}

function AnalyticsContent({
  tenantId,
  timeRange,
  setTimeRange,
}: {
  tenantId: string;
  timeRange: TimeRange;
  setTimeRange: (range: TimeRange) => void;
}) {
  const summary = useQuery(api.analytics.getDashboardSummary, { tenantId: tenantId as any });
  const messageAnalytics = useQuery(api.analytics.getMessageAnalytics, {
    tenantId: tenantId as any,
    days: timeRange,
  });
  const contactFunnel = useQuery(api.analytics.getContactFunnel, { tenantId: tenantId as any });
  const contactGrowth = useQuery(api.analytics.getContactGrowth, {
    tenantId: tenantId as any,
    days: timeRange,
  });
  const responseTime = useQuery(api.analytics.getResponseTimeAnalytics, {
    tenantId: tenantId as any,
    days: timeRange,
  });
  const topContacts = useQuery(api.analytics.getTopContacts, {
    tenantId: tenantId as any,
    limit: 5,
  });

  const isLoading = !summary || !messageAnalytics || !contactFunnel;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-7xl mx-auto p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Analytics</h1>
            <p className="text-gray-400">Track your performance and engagement metrics</p>
          </div>
          <div className="flex gap-2">
            {([7, 14, 30, 90] as TimeRange[]).map((days) => (
              <Button
                key={days}
                variant={timeRange === days ? "default" : "outline"}
                size="sm"
                onClick={() => setTimeRange(days)}
                className={
                  timeRange === days
                    ? "bg-emerald-600 hover:bg-emerald-700"
                    : "border-gray-700 text-gray-300 hover:bg-gray-800"
                }
              >
                {days}D
              </Button>
            ))}
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          <SummaryCard
            title="Total Contacts"
            value={summary.totalContacts}
            subtitle={`+${summary.newThisWeek} this week`}
            icon={Users}
            trend={summary.newThisWeek > 0 ? "up" : "neutral"}
          />
          <SummaryCard
            title="Messages Today"
            value={summary.today.total}
            subtitle={`${summary.today.inbound} in / ${summary.today.outbound} out`}
            icon={MessageSquare}
            trend="neutral"
          />
          <SummaryCard
            title="Response Time"
            value={responseTime?.avgResponseTimeFormatted || "N/A"}
            subtitle={`${responseTime?.totalResponses || 0} responses`}
            icon={Clock}
            trend="neutral"
          />
          <SummaryCard
            title="Conversion Rate"
            value={`${contactFunnel.rates.conversion}%`}
            subtitle={`${contactFunnel.funnel.converted} converted`}
            icon={TrendingUp}
            trend={parseFloat(contactFunnel.rates.conversion) > 10 ? "up" : "down"}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-2 gap-6 mb-8">
          {/* Message Volume Chart */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-blue-600/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Message Volume</h2>
                <p className="text-sm text-gray-400">
                  {messageAnalytics.totals.total} total messages
                </p>
              </div>
            </div>

            {/* Simple Bar Chart */}
            <div className="h-48 flex items-end gap-1">
              {messageAnalytics.dailyData.slice(-14).map((day, i) => {
                const maxValue = Math.max(
                  ...messageAnalytics.dailyData.map((d) => d.inbound + d.outbound)
                );
                const height = maxValue > 0 ? ((day.inbound + day.outbound) / maxValue) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-emerald-500/80 rounded-t"
                      style={{ height: `${height}%`, minHeight: height > 0 ? "4px" : "0" }}
                      title={`${day.date}: ${day.inbound + day.outbound} messages`}
                    />
                    {i % 2 === 0 && (
                      <span className="text-[10px] text-gray-500">
                        {new Date(day.date).getDate()}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-6 mt-4 pt-4 border-t border-gray-800">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-emerald-500" />
                <span className="text-sm text-gray-400">
                  Inbound: {messageAnalytics.totals.inbound}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded bg-blue-500" />
                <span className="text-sm text-gray-400">
                  Outbound: {messageAnalytics.totals.outbound}
                </span>
              </div>
            </div>
          </div>

          {/* Contact Funnel */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-purple-600/20 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Contact Funnel</h2>
                <p className="text-sm text-gray-400">
                  {contactFunnel.rates.engagement}% engagement rate
                </p>
              </div>
            </div>

            {/* Funnel Visualization */}
            <div className="space-y-3">
              <FunnelBar
                label="New"
                count={contactFunnel.funnel.new}
                total={contactFunnel.funnel.total}
                color="bg-gray-500"
              />
              <FunnelBar
                label="Active"
                count={contactFunnel.funnel.active}
                total={contactFunnel.funnel.total}
                color="bg-blue-500"
              />
              <FunnelBar
                label="Paused"
                count={contactFunnel.funnel.paused}
                total={contactFunnel.funnel.total}
                color="bg-amber-500"
              />
              <FunnelBar
                label="Converted"
                count={contactFunnel.funnel.converted}
                total={contactFunnel.funnel.total}
                color="bg-emerald-500"
              />
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-2 gap-6">
          {/* Contact Growth */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-emerald-600/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Contact Growth</h2>
                <p className="text-sm text-gray-400">
                  +{contactGrowth?.summary.newThisPeriod || 0} new contacts
                </p>
              </div>
            </div>

            {/* Growth Line Chart (simplified) */}
            <div className="h-32 flex items-end gap-1">
              {contactGrowth?.growthData.slice(-14).map((day, i) => {
                const maxValue = Math.max(...(contactGrowth?.growthData.map((d) => d.total) || [1]));
                const height = maxValue > 0 ? (day.total / maxValue) * 100 : 0;
                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1">
                    <div
                      className="w-full bg-emerald-500/60 rounded-t"
                      style={{ height: `${height}%`, minHeight: "4px" }}
                      title={`${day.date}: ${day.total} total`}
                    />
                  </div>
                );
              })}
            </div>

            <div className="mt-4 pt-4 border-t border-gray-800">
              <div className="text-sm text-gray-400">
                Avg {contactGrowth?.summary.avgNewPerDay || 0} new contacts/day
              </div>
            </div>
          </div>

          {/* Top Contacts */}
          <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-lg bg-amber-600/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Most Active Contacts</h2>
                <p className="text-sm text-gray-400">By interaction count</p>
              </div>
            </div>

            <div className="space-y-3">
              {topContacts?.slice(0, 5).map((contact, i) => (
                <div
                  key={contact._id}
                  className="flex items-center justify-between p-3 bg-gray-800/50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center text-sm font-medium text-white">
                      {i + 1}
                    </div>
                    <div>
                      <div className="text-sm font-medium text-white">
                        {contact.name || contact.phone}
                      </div>
                      <div className="text-xs text-gray-500">{contact.phone}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-emerald-400">
                      {contact.interactionCount} messages
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(contact.lastInteraction).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
              {(!topContacts || topContacts.length === 0) && (
                <div className="text-center text-gray-500 py-8">No contacts yet</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function SummaryCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
}: {
  title: string;
  value: string | number;
  subtitle: string;
  icon: React.ElementType;
  trend: "up" | "down" | "neutral";
}) {
  return (
    <div className="bg-gray-900 rounded-lg border border-gray-800 p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="w-10 h-10 rounded-lg bg-gray-800 flex items-center justify-center">
          <Icon className="w-5 h-5 text-gray-400" />
        </div>
        {trend !== "neutral" && (
          <div
            className={`flex items-center gap-1 text-sm ${
              trend === "up" ? "text-emerald-400" : "text-red-400"
            }`}
          >
            {trend === "up" ? (
              <ArrowUpRight className="w-4 h-4" />
            ) : (
              <ArrowDownRight className="w-4 h-4" />
            )}
          </div>
        )}
      </div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400">{title}</div>
      <div className="text-xs text-gray-500 mt-1">{subtitle}</div>
    </div>
  );
}

function FunnelBar({
  label,
  count,
  total,
  color,
}: {
  label: string;
  count: number;
  total: number;
  color: string;
}) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-4">
      <div className="w-20 text-sm text-gray-400">{label}</div>
      <div className="flex-1 h-8 bg-gray-800 rounded-lg overflow-hidden">
        <div
          className={`h-full ${color} flex items-center justify-end pr-3 transition-all`}
          style={{ width: `${Math.max(percentage, 2)}%` }}
        >
          {percentage > 15 && <span className="text-xs font-medium text-white">{count}</span>}
        </div>
      </div>
      {percentage <= 15 && <div className="text-sm text-gray-400 w-12">{count}</div>}
    </div>
  );
}
