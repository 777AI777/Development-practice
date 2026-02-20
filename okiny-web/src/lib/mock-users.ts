export interface MockUser {
  id: string;
  name: string;
  email: string;
}

export const MOCK_USERS: MockUser[] = [
  { id: "user-google-001", name: "山田 太郎", email: "yamada@example.com" },
  { id: "user-google-002", name: "佐藤 花子", email: "sato@example.com" },
];

