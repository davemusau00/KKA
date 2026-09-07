interface Membership {
  role: { firmId: string; key: string; active: boolean; permissions: Array<{ permission: { key: string } }> };
}
export function roleContext(firmId: string, memberships: Membership[]) {
  const roles = memberships.filter(({ role }) => role.active && role.firmId === firmId);
  return {
    roleKeys: roles.map(({ role }) => role.key),
    permissions: [...new Set(roles.flatMap(({ role }) => role.permissions.map(({ permission }) => permission.key)))],
  };
}
