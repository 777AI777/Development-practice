export interface MockUser {
  id: string;
  name: string;
  email: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: "user-google-001", name: "Taro Yamada", email: "yamada@example.com" },
  { id: "user-google-002", name: "Hanako Sato", email: "sato@example.com" },
];

