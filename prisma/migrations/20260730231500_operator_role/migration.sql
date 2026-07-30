-- Add OPERATOR to the Role enum (data-entry operator, centers-only scope).
ALTER TYPE "Role" ADD VALUE IF NOT EXISTS 'OPERATOR';
