// Types for auth operations
export type User = {
  id: string;
  username: string;
  name: string;
};

export type LoginRequest = {
  username: string;
  password: string;
};

export type LoginResponse = {
  user: User;
  access_token: string;
};

export type RegisterRequest = {
  username: string;
  password: string;
  name: string;
};

export type RegisterResponse = {
  user: User;
  access_token: string;
};
