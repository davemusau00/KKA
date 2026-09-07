import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { OrganizationProfile, FirmIdentityWrite, LegalEntityWrite, BranchContactWrite } from '@contracts/organization';
import { apiClient } from '../api/client';
import { useApp } from '../../context/AppContext';

function useProfileKey() {
  const { currentUser } = useApp();
  return ['organization-profile', currentUser?.id] as const;
}
export function useOrganizationProfile(enabled: boolean) {
  return useQuery({ queryKey: useProfileKey(), enabled,
    queryFn: () => apiClient.get<OrganizationProfile>('/organization/profile'),
  });
}
type ProfileWrite =
  | { kind: 'firm'; data: FirmIdentityWrite }
  | { kind: 'legalEntity'; id: string; data: LegalEntityWrite }
  | { kind: 'branch'; id: string; data: BranchContactWrite };
export function useSaveOrganizationProfile() {
  const queryClient = useQueryClient();
  const queryKey = useProfileKey();
  return useMutation({
    mutationFn: (input: ProfileWrite) => {
      if (!navigator.onLine) throw new Error('Connect to the internet before saving. Your changes have not been saved.');
      const path = input.kind === 'firm' ? '/organization/profile' : input.kind === 'legalEntity'
        ? `/organization/legal-entities/${encodeURIComponent(input.id)}` : `/organization/branches/${encodeURIComponent(input.id)}/contact`;
      return apiClient.patch(path, input.data);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
}
