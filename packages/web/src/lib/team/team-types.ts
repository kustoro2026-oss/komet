export interface TeamMember {
  id: string;
  userId: string;
  email: string;
  name: string;
  role: "admin" | "editor" | "viewer";
  joinedAt: string;
  avatarUrl?: string;
}

export interface TeamInvitation {
  id: string;
  email: string;
  role: "admin" | "editor" | "viewer";
  status: "pending" | "accepted" | "expired";
  createdAt: string;
}
