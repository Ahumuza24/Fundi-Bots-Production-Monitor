'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NotificationPreferencesComponent } from '@/components/notifications/notification-preferences';
import { Bell, User, Shield, Palette, Wrench, X } from 'lucide-react';

export default function SettingsPage() {
  const [processes, setProcesses] = useState<string[]>([]);
  const [newProcess, setNewProcess] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const ref = doc(db, 'settings', 'processes');
    const unsub = onSnapshot(ref, (snap) => {
      const data = snap.data() as { defaultProcesses?: string[] } | undefined;
      setProcesses(Array.isArray(data?.defaultProcesses) ? data!.defaultProcesses : []);
    });
    return () => unsub();
  }, []);

  const persist = useCallback(async (next: string[]) => {
    setSaving(true);
    try {
      await setDoc(doc(db, 'settings', 'processes'), { defaultProcesses: next }, { merge: true });
    } finally {
      setSaving(false);
    }
  }, []);

  const addProcess = useCallback(async () => {
    const value = newProcess.trim();
    if (!value) return;
    const exists = processes.some(p => p.toLowerCase() === value.toLowerCase());
    if (exists) {
      setNewProcess('');
      return;
    }
    const next = [...processes, value].sort((a, b) => a.localeCompare(b));
    setProcesses(next);
    setNewProcess('');
    await persist(next);
  }, [newProcess, processes, persist]);

  const removeProcess = useCallback(async (value: string) => {
    const next = processes.filter(p => p !== value);
    setProcesses(next);
    await persist(next);
  }, [processes, persist]);

  return (
    <div className="container mx-auto py-6">
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <Tabs defaultValue="notifications" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="profile" className="flex items-center gap-2">
              <User className="h-4 w-4" />
              Profile
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center gap-2">
              <Palette className="h-4 w-4" />
              Appearance
            </TabsTrigger>
            <TabsTrigger value="processes" className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              Processes
            </TabsTrigger>
          </TabsList>

          <TabsContent value="notifications" className="mt-6">
            <NotificationPreferencesComponent />
          </TabsContent>

          <TabsContent value="profile" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile Settings</CardTitle>
                <CardDescription>
                  Manage your profile information and preferences
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Profile settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Settings</CardTitle>
                <CardDescription>
                  Manage your account security and privacy
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Security settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="appearance" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance Settings</CardTitle>
                <CardDescription>
                  Customize the look and feel of your dashboard
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Appearance settings coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="processes" className="mt-6">
            <Card>
              <CardHeader>
                <CardTitle>Default Processes</CardTitle>
                <CardDescription>
                  Manage the list shown to assemblers during work sessions. Custom entries used by assemblers are also persisted per component.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Add a process (e.g., Assembly, Soldering)"
                      value={newProcess}
                      onChange={(e) => setNewProcess(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') addProcess(); }}
                    />
                    <Button onClick={addProcess} disabled={!newProcess.trim() || saving}>Add</Button>
                  </div>
                  {processes.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No default processes yet.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {processes.map((p) => (
                        <Badge key={p} variant="secondary" className="flex items-center gap-1">
                          <span>{p}</span>
                          <button
                            aria-label={`Remove ${p}`}
                            className="ml-1 text-muted-foreground hover:text-foreground"
                            onClick={() => removeProcess(p)}
                            disabled={saving}
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}