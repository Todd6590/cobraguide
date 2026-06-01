import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { base44 } from '@/api/base44Client';
import { useTeam } from '@/lib/TeamContext';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Users, Plus, Trash2, Shield, User } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/components/ui/use-toast';

export default function TeamManagement() {
  const { ownerEmail, canManageTeam, currentUserEmail, isTeamMember } = useTeam();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [newEmail, setNewEmail] = useState('');
  const [newRole, setNewRole] = useState('user');
  const [removeConfirm, setRemoveConfirm] = useState(null);

  const { data: members = [], isLoading } = useQuery({
    queryKey: ['team-members', ownerEmail],
    queryFn: () => base44.entities.TeamMember.filter({ owner_email: ownerEmail }),
    enabled: !!ownerEmail,
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      const email = newEmail.trim().toLowerCase();
      if (!email) return;
      // Invite the user — the invite email links to the /join onboarding page
      await base44.users.inviteUser(email, 'user');
      // Create team member record
      await base44.entities.TeamMember.create({
        owner_email: ownerEmail,
        member_email: email,
        role: newRole,
        invited_by: currentUserEmail,
        status: 'active',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      setNewEmail('');
      setNewRole('user');
      toast({ title: 'Team member added and invite sent!' });
    },
    onError: (err) => {
      toast({ title: 'Error adding team member', description: err.message, variant: 'destructive' });
    }
  });

  const updateRoleMutation = useMutation({
    mutationFn: ({ id, role }) => base44.entities.TeamMember.update(id, { role }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['team-members'] }),
  });

  const removeMutation = useMutation({
    mutationFn: (id) => base44.entities.TeamMember.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-members'] });
      toast({ title: 'Team member removed.' });
    },
  });

  if (!canManageTeam) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Team Members</CardTitle>
          <CardDescription>Only team admins and account owners can manage team members.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Team Members</CardTitle>
        <CardDescription>
          Invite users to collaborate on your clients and participants. Admins can manage team members; Users have full access to client data only.
          {isTeamMember && <span className="block mt-1 text-xs text-amber-600">You are managing this on behalf of <strong>{ownerEmail}</strong>'s account.</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Add new member */}
        <div className="flex flex-col sm:flex-row gap-3 p-4 bg-muted/40 rounded-lg border border-border">
          <div className="flex-1">
            <Label className="mb-1 block text-xs">Email Address</Label>
            <Input
              placeholder="colleague@example.com"
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addMutation.mutate()}
            />
          </div>
          <div className="w-36">
            <Label className="mb-1 block text-xs">Role</Label>
            <Select value={newRole} onValueChange={setNewRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="user">User</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-end">
            <Button onClick={() => addMutation.mutate()} disabled={!newEmail.trim() || addMutation.isPending}>
              <Plus className="w-4 h-4 mr-2" />
              {addMutation.isPending ? 'Inviting...' : 'Invite'}
            </Button>
          </div>
        </div>

        {/* Role legend */}
        <div className="flex gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Shield className="w-3 h-3 text-violet-500" /> <strong>Admin</strong> — full access + team management</span>
          <span className="flex items-center gap-1"><User className="w-3 h-3 text-blue-500" /> <strong>User</strong> — full client/participant access, no team management</span>
        </div>

        {/* Member list */}
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading team members...</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-muted-foreground">No team members yet. Invite someone above.</p>
        ) : (
          <div className="space-y-2">
            {members.map(member => (
              <div key={member.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {member.member_email[0].toUpperCase()}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{member.member_email}</p>
                    {member.member_email === currentUserEmail && (
                      <p className="text-xs text-muted-foreground">You</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Select
                    value={member.role}
                    onValueChange={(role) => updateRoleMutation.mutate({ id: member.id, role })}
                  >
                    <SelectTrigger className="h-7 w-24 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={() => setRemoveConfirm(member)}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <AlertDialog open={!!removeConfirm} onOpenChange={(open) => { if (!open) setRemoveConfirm(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove team member?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{removeConfirm?.member_email}</strong> will lose access to your clients and participants.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => { removeMutation.mutate(removeConfirm.id); setRemoveConfirm(null); }}
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}