# Permissions

## Roles

- `super_admin` has full access to every admin module and can promote users.
- `admin` has full content and operations access, except super-admin-only setup.
- `staff` can access only modules listed in `staff_permissions`.
- `member` can use account features, RSVP, comment, and view their own submissions.

## Admin modules

The app checks module access with `requireModule(moduleKey)` in admin pages and
server actions. Staff grants are stored in `staff_permissions.module`; admins
and super admins pass all module checks.

Current module keys include:

- `pages`
- `posts`
- `events`
- `ministries`
- `media`
- `comments`
- `pledges`
- `connection_forms`
- `merch`

## Enforcement layers

Middleware blocks unauthenticated `/admin` access. Server components and server
actions perform role checks before reading or mutating data. Supabase RLS
policies provide the final database-level boundary.

