export const jwtConstants = {
  secret: process.env.JWT_SECRET || 'fallback_secret_if_env_not_found',
};
