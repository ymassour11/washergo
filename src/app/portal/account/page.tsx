"use client";

import { useState, useEffect } from "react";

interface Profile {
  name: string;
  email: string;
  phone: string;
}

export default function PortalAccountPage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Edit profile
  const [editName, setEditName] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  useEffect(() => {
    fetch("/api/portal/account")
      .then((r) => r.json())
      .then((data) => {
        setProfile(data.profile);
        setEditName(data.profile?.name || "");
        setEditPhone(data.profile?.phone || "");
      })
      .finally(() => setLoading(false));
  }, []);

  const handleProfileSave = async () => {
    setSaving(true);
    setSaveMsg("");
    try {
      const res = await fetch("/api/portal/account", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editName, phone: editPhone }),
      });
      const data = await res.json();
      if (res.ok) {
        setProfile(data.profile);
        setEditing(false);
        setSaveMsg("Profile updated");
        setTimeout(() => setSaveMsg(""), 3000);
      } else {
        setSaveMsg(data.error || "Update failed");
      }
    } catch {
      setSaveMsg("Network error");
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPwError("");
    setPwMsg("");

    if (newPassword.length < 8) {
      setPwError("New password must be at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPwError("Passwords do not match");
      return;
    }

    setPwLoading(true);
    try {
      const res = await fetch("/api/portal/account/password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      const data = await res.json();
      if (res.ok) {
        setPwMsg("Password changed successfully");
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        setTimeout(() => setPwMsg(""), 3000);
      } else {
        setPwError(data.error || "Failed to change password");
      }
    } catch {
      setPwError("Network error");
    } finally {
      setPwLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6 lg:p-8">
        <div className="max-w-2xl space-y-6">
          <div className="rounded-xl border-2 border-black/5 bg-white p-6">
            <div className="h-4 w-32 rounded bg-black/5 animate-pulse mb-4" />
            <div className="h-4 w-full rounded bg-black/5 animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-black tracking-tight">Account</h1>
        <p className="text-sm text-black/40 mt-1 font-medium">Manage your profile and security</p>
      </div>

      <div className="max-w-2xl space-y-6">
        {/* Profile */}
        <section className="rounded-xl border-2 border-black/5 bg-white p-6">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest">Profile</h2>
            {!editing && (
              <button
                onClick={() => setEditing(true)}
                className="text-xs font-bold text-[#0055FF] hover:underline uppercase tracking-wider"
              >
                Edit
              </button>
            )}
          </div>

          {saveMsg && (
            <div className="rounded-lg bg-green-50 border-2 border-green-200 px-4 py-2 text-sm font-medium text-green-700 mb-4">
              {saveMsg}
            </div>
          )}

          {editing ? (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">Name</label>
                <input
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3 text-sm text-black focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] transition-colors"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">Email</label>
                <input
                  value={profile?.email || ""}
                  disabled
                  className="w-full rounded-lg border-2 border-black/5 bg-[#f5f5f0] px-4 py-3 text-sm text-black/40 cursor-not-allowed"
                />
                <p className="text-xs text-black/30 mt-1 font-medium">Contact support to change your email</p>
              </div>
              <div>
                <label className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">Phone</label>
                <input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                  className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3 text-sm text-black focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] transition-colors"
                />
              </div>
              <div className="flex gap-3">
                <button
                  onClick={handleProfileSave}
                  disabled={saving}
                  className="inline-flex items-center rounded-lg bg-[#0055FF] px-5 py-3 text-sm font-bold text-white uppercase tracking-wider hover:bg-[#0044CC] disabled:opacity-50 transition-colors shadow-lg shadow-[#0055FF]/20"
                >
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={() => { setEditing(false); setEditName(profile?.name || ""); setEditPhone(profile?.phone || ""); }}
                  className="inline-flex items-center rounded-lg border-2 border-black/10 bg-white px-5 py-3 text-sm font-bold text-black/50 hover:bg-black/5 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div>
                <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1.5">Name</div>
                <div className="font-bold text-black">{profile?.name}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1.5">Email</div>
                <div className="font-bold text-black">{profile?.email}</div>
              </div>
              <div>
                <div className="text-[10px] font-bold text-black/30 uppercase tracking-widest mb-1.5">Phone</div>
                <div className="font-bold text-black">{profile?.phone}</div>
              </div>
            </div>
          )}
        </section>

        {/* Change Password */}
        <section className="rounded-xl border-2 border-black/5 bg-white p-6">
          <h2 className="text-xs font-bold text-black/40 uppercase tracking-widest mb-5">Change Password</h2>

          {pwMsg && (
            <div className="rounded-lg bg-green-50 border-2 border-green-200 px-4 py-2 text-sm font-medium text-green-700 mb-4">
              {pwMsg}
            </div>
          )}
          {pwError && (
            <div className="rounded-lg bg-red-50 border-2 border-red-200 px-4 py-2 text-sm font-medium text-red-700 mb-4">
              {pwError}
            </div>
          )}

          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3 text-sm text-black focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3 text-sm text-black placeholder:text-black/30 focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] transition-colors"
                placeholder="Min 8 characters"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-black/70 mb-2 uppercase tracking-wider">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full rounded-lg border-2 border-black/10 bg-white px-4 py-3 text-sm text-black focus:outline-none focus:border-[#0055FF] focus:ring-1 focus:ring-[#0055FF] transition-colors"
              />
            </div>
            <button
              type="submit"
              disabled={pwLoading}
              className="inline-flex items-center rounded-lg bg-black px-5 py-3 text-sm font-bold text-white uppercase tracking-wider hover:bg-black/80 disabled:opacity-50 transition-colors"
            >
              {pwLoading ? "Changing..." : "Change Password"}
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
