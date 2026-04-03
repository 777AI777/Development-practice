export interface AuthUser {
  id: string;
  name: string;
  email: string;
  avatarUrl?: string;
  displayUserId: string | null;
  introduction: string | null;
  links: Array<{ url: string }> | null;
}
