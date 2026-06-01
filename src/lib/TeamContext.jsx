import { createContext, useContext, useState, useEffect } from 'react';
import { base44 } from '@/api/base44Client';

const TeamContext = createContext(null);

export function TeamProvider({ children }) {
  const [ownerEmail, setOwnerEmail] = useState(null);
  const [teamRole, setTeamRole] = useState(null); // null = subscriber, 'admin' or 'user' = team member
  const [isTeamMember, setIsTeamMember] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentUserEmail, setCurrentUserEmail] = useState(null);

  useEffect(() => {
    const resolve = async () => {
      try {
        const me = await base44.auth.me();
        setCurrentUserEmail(me.email);

        // Check if this user is a team member of someone else's account
        const memberships = await base44.entities.TeamMember.filter({ member_email: me.email, status: 'active' });

        if (memberships.length > 0) {
          // This user is a team member — use the owner's email for data scoping
          const membership = memberships[0];
          setOwnerEmail(membership.owner_email);
          setTeamRole(membership.role);
          setIsTeamMember(true);
        } else {
          // This user is a subscriber — they ARE the owner
          setOwnerEmail(me.email);
          setTeamRole(null);
          setIsTeamMember(false);
        }
      } catch (e) {
        // not authenticated
      } finally {
        setLoading(false);
      }
    };
    resolve();
  }, []);

  // Can this user manage team members?
  // Subscriber (not a team member) can always manage.
  // Team member with role 'admin' can manage.
  // Team member with role 'user' cannot.
  const canManageTeam = !isTeamMember || teamRole === 'admin';

  return (
    <TeamContext.Provider value={{
      ownerEmail,
      teamRole,
      isTeamMember,
      canManageTeam,
      currentUserEmail,
      loading,
    }}>
      {children}
    </TeamContext.Provider>
  );
}

export function useTeam() {
  return useContext(TeamContext);
}