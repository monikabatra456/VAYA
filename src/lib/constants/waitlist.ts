export const VALID_PROBLEMS = [
  'Overcrowding',
  'Unreasonable prices',
  'Finding local guides',
  'Changing plans',
  'Safety concerns',
  'Too much planning',
  'Other',
] as const;

export type TravelProblem = typeof VALID_PROBLEMS[number];

export const ROLES = ['traveller', 'local_guide'] as const;
export type UserRole = typeof ROLES[number];

