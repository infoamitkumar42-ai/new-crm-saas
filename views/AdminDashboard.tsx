import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { User } from "../types";
import { Card } from "../components/UI";
import { ENV } from "../config/env";

interface AdminDashboardProps {
  user?: User; // Optional in case accessed directly, but guarded by role
}

interface PaymentRow {
  id: string;
  user_id: string;
  amount: number;
  plan_type: string | null;
  status: string | null;
  created_at: string;
}

interface LeadSummary {
  total_leads: number;
  distributed_leads: number;
  fresh_leads: number;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ user }) => {
  const [users, setUsers] = useState<User[]>([]);
  const [payments, setPayments] = useState<PaymentRow[]>([]);
  const [leadSummary, setLeadSummary] = useState<LeadSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadError, setLeadError] = useState<string | null>(null);

  useEffect(() => {
    if (user?.role !== "admin") {
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const { data: userRows, error: userErr } = await supabase
          .from("users")
          .select("*")
          .order("created_at", { ascending: false });

        if (userErr) throw userErr;

        const mappedUsers: User[] = (userRows || []).map((u: any) => ({
          id: u.id,
          email: u.email,
          name: u.name || "",
          sheet_url: u.sheet_url || "",
          payment_status: u.payment_status || "inactive",
          valid_until: u.valid_until || null,
          filters: u.filters || {},
          daily_limit: u.daily_limit || 10,
          role: u.role || "user",
        }));

        setUsers(mappedUsers);

        const { data: paymentRows, error: payErr } = await supabase
          .from("payments")
          .select("*")
          .order("created_at", { ascending: false });

        if (payErr) throw payErr;

        setPayments((paymentRows || []) as any);

        // Lead summary from Apps Script
        if (ENV.APPS_SCRIPT_URL && !ENV.APPS_SCRIPT_URL.includes('PLACEHOLDER')) {
          try {
            const res = await fetch(
              `${ENV.APPS_SCRIPT_URL}?action=summary`,
              {
                method: "GET",
              }
            );
            if (res.ok) {
              const json = await res.json();
              setLeadSummary({
                total_leads: json.total_leads ?? 0,
                distributed_leads: json.distributed_leads ?? 0,
                fresh_leads: json.fresh_leads ?? 0,
              });
            } else {
              setLeadError("Apps Script summary returned an error status");
            }
          } catch (err) {
            console.error("Error fetching lead summary", err);
            setLeadError("Could not load lead summary");
          }
        }
      } catch (err: any) {
        console.error(err);
        setError(err.message || "Failed to load admin data");
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [user?.role]);

  if (user?.role !== "admin") {
    return (
      <div className="p-6 text-sm text-red-600">
        Access denied. Admins only.
      </div>
    );
  }

  if (loading) {
    return (
      <div className="p-6 text-sm text-slate-500">Loading admin data...</div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-sm text-red-600">
        Error loading admin dashboard: {error}
      </div>
    );
  }

  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.payment_status === "active").length;
  const inactiveUsers = totalUsers - activeUsers;

  // Payments stored in database are in paise
  const totalRevenuePaise = payments.reduce(
    (sum, p) => sum + (p.amount || 0),
    0
  );
  const totalRevenueINR = totalRevenuePaise / 100;

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">
          Admin Dashboard
        </h2>
        <p className="text-sm text-slate-500">
          Monitor users, payments, and lead distribution.
        </p>
      </div>

      {/* Top stats: users + revenue */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase mb-1">
            Total Users
          </div>
          <div className="text-2xl font-semibold text-slate-900">
            {totalUsers}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase mb-1">
            Active Users
          </div>
          <div className="text-2xl font-semibold text-emerald-600">
            {activeUsers}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase mb-1">
            Inactive / Expired
          </div>
          <div className="text-2xl font-semibold text-amber-600">
            {inactiveUsers}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase mb-1">
            Total Revenue (₹)
          </div>
          <div className="text-2xl font-semibold text-slate-900">
            ₹{totalRevenueINR.toFixed(0)}
          </div>
        </Card>
      </div>

      {/* Lead summary from Apps Script */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase mb-1">
            Total Leads in Master Sheet
          </div>
          <div className="text-2xl font-semibold text-slate-900">
            {leadSummary ? leadSummary.total_leads : "-"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase mb-1">
            Distributed Leads
          </div>
          <div className="text-2xl font-semibold text-emerald-600">
            {leadSummary ? leadSummary.distributed_leads : "-"}
          </div>
        </Card>
        <Card className="p-4">
          <div className="text-xs text-slate-500 uppercase mb-1">
            Fresh / Undistributed
          </div>
          <div className="text-2xl font-semibold text-amber-600">
            {leadSummary ? leadSummary.fresh_leads : "-"}
          </div>
        </Card>
      </div>

      {leadError && (
        <p className="text-xs text-amber-600">
          Lead summary warning: {leadError}
        </p>
      )}

      {/* Latest users */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-slate-900 text-sm">
              Latest Users
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b">
                  <th className="text-left py-1 pr-2">Email</th>
                  <th className="text-left py-1 pr-2">Role</th>
                  <th className="text-left py-1 pr-2">Status</th>
                  <th className="text-left py-1 pr-2">Valid Until</th>
                </tr>
              </thead>
              <tbody>
                {users.slice(0, 10).map((u) => (
                  <tr key={u.id} className="border-b last:border-0">
                    <td className="py-1 pr-2">{u.email}</td>
                    <td className="py-1 pr-2">{u.role}</td>
                    <td className="py-1 pr-2">{u.payment_status}</td>
                    <td className="py-1 pr-2">
                      {u.valid_until ? new Date(u.valid_until).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Latest payments */}
        <Card className="p-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="font-semibold text-slate-900 text-sm">
              Latest Payments
            </h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="text-slate-500 border-b">
                  <th className="text-left py-1 pr-2">Amount (₹)</th>
                  <th className="text-left py-1 pr-2">Plan</th>
                  <th className="text-left py-1 pr-2">Status</th>
                  <th className="text-left py-1 pr-2">Created At</th>
                </tr>
              </thead>
              <tbody>
                {payments.slice(0, 10).map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-1 pr-2">
                      ₹{(p.amount || 0) / 100}
                    </td>
                    <td className="py-1 pr-2">{p.plan_type ?? "-"}</td>
                    <td className="py-1 pr-2">{p.status ?? "captured"}</td>
                    <td className="py-1 pr-2">
                      {new Date(p.created_at).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
