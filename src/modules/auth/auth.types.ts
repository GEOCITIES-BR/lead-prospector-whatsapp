export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthPayload {
  sub: string;
  role: string;
}

export interface ApiKeyData {
  id: string;
  name: string;
  prefix: string;
  active: boolean;
  lastUsed: string | null;
  createdAt: string;
}

export interface CreateApiKeyInput {
  name: string;
}

export interface CreateApiKeyResult {
  id: string;
  name: string;
  prefix: string;
  key: string;
  createdAt: string;
}

export interface LoginResult {
  token: string;
  expiresIn: number;
}
