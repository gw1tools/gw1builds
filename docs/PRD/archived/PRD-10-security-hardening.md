# PRD-10: Security Hardening

## Overview

Security enhancements identified during PRD-03 (Authentication) security audit. These items require infrastructure changes, additional dependencies, or careful implementation and are deferred from the initial auth release.

### AI Context

This PRD addresses security vulnerabilities that couldn't be fixed immediately:

1. **Rate limiting** - Requires Redis/Upstash or Vercel edge config
2. **CSRF protection** - Needs token generation and validation middleware
3. **Audit trail** - Requires new database table and logging infrastructure
4. **Session security** - Advanced session management features
5. **Account protection** - Suspicious login detection

**Already implemented in PRD-03:**
- Username enumeration protection (using count instead of single)
- XSS sanitization helper (`lib/security.ts`)
- Security headers in `next.config.ts`
- Open redirect protection in auth callback
- Sensitive data removed from logs
- Case-insensitive username error clarification

**Priority:** High - Should be completed before public launch

## Dependencies

- PRD-03 (Authentication) completed
- Infrastructure decisions (Redis provider, monitoring service)

## Outcomes

- [ ] Rate limiting on auth endpoints
- [ ] CSRF token protection
- [ ] Security audit trail
- [ ] Session fixation prevention
- [ ] Account takeover protection
- [ ] Username squatting prevention

---

## Tasks

### Task 10.1: Rate Limiting

**Problem:** Auth endpoints have no rate limiting, enabling brute force attacks on username availability checks.

**Solution:** Implement rate limiting using Upstash Redis or Vercel KV.

**Create `lib/rate-limit.ts`:**

```typescript
/**
 * @fileoverview Rate limiting utility using sliding window algorithm
 * @module lib/rate-limit
 */
import { Ratelimit } from '@upstash/ratelimit'
import { Redis } from '@upstash/redis'

// Create rate limiter instance
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(10, '60 s'), // 10 requests per minute
  analytics: true,
})

export async function checkRateLimit(identifier: string): Promise<{
  success: boolean
  remaining: number
  reset: number
}> {
  const { success, remaining, reset } = await ratelimit.limit(identifier)
  return { success, remaining, reset }
}

// Stricter limit for auth endpoints
export const authRateLimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, '60 s'), // 5 auth attempts per minute
  analytics: true,
})
```

**Apply to auth endpoints:**

```typescript
// In API routes
const ip = request.headers.get('x-forwarded-for') || 'anonymous'
const { success, remaining } = await checkRateLimit(`auth:${ip}`)

if (!success) {
  return NextResponse.json(
    { error: 'Too many requests. Please try again later.' },
    { 
      status: 429,
      headers: {
        'Retry-After': '60',
        'X-RateLimit-Remaining': remaining.toString(),
      }
    }
  )
}
```

**Endpoints to protect:**
- `POST /api/auth/username` - 5/min per IP
- `GET /api/auth/username/check` - 20/min per user (already requires auth)
- `GET /auth/callback` - 10/min per IP

**Acceptance Criteria:**
- [ ] Rate limiting active on auth endpoints
- [ ] Returns 429 with Retry-After header when exceeded
- [ ] Different limits for different endpoint sensitivity
- [ ] Upstash Redis configured in production

---

### Task 10.2: CSRF Protection

**Problem:** State-changing endpoints lack CSRF tokens.

**Solution:** Implement double-submit cookie pattern.

**Create `lib/csrf.ts`:**

```typescript
/**
 * @fileoverview CSRF token generation and validation
 * @module lib/csrf
 */
import { cookies } from 'next/headers'
import { randomBytes, createHash } from 'crypto'

const CSRF_COOKIE = 'csrf_token'
const CSRF_HEADER = 'x-csrf-token'

export function generateCsrfToken(): string {
  const token = randomBytes(32).toString('hex')
  return token
}

export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex')
}

export async function setCsrfCookie(): Promise<string> {
  const cookieStore = await cookies()
  const token = generateCsrfToken()
  
  cookieStore.set(CSRF_COOKIE, hashToken(token), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    path: '/',
    maxAge: 60 * 60, // 1 hour
  })
  
  return token // Return unhashed for client
}

export async function validateCsrfToken(request: Request): Promise<boolean> {
  const cookieStore = await cookies()
  const cookieHash = cookieStore.get(CSRF_COOKIE)?.value
  const headerToken = request.headers.get(CSRF_HEADER)
  
  if (!cookieHash || !headerToken) {
    return false
  }
  
  const headerHash = hashToken(headerToken)
  return cookieHash === headerHash
}
```

**Create CSRF provider for client:**

```typescript
/**
 * @fileoverview CSRF token context for client-side requests
 * @module components/providers/csrf-provider
 */
'use client'

import { createContext, useContext, useEffect, useState } from 'react'

const CsrfContext = createContext<string | null>(null)

export function CsrfProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/csrf')
      .then(res => res.json())
      .then(data => setToken(data.token))
  }, [])

  return (
    <CsrfContext.Provider value={token}>
      {children}
    </CsrfContext.Provider>
  )
}

export function useCsrf() {
  return useContext(CsrfContext)
}
```

**Apply to state-changing endpoints:**
- `POST /api/auth/username`
- `POST /api/builds` (future)
- `PUT /api/builds/:id` (future)
- `DELETE /api/builds/:id` (future)

**Acceptance Criteria:**
- [ ] CSRF token generated on page load
- [ ] Token validated on all POST/PUT/DELETE requests
- [ ] 403 returned for invalid tokens
- [ ] Token refreshed before expiry

---

### Task 10.3: Security Audit Trail

**Problem:** No logging of security-relevant events for forensics.

**Solution:** Create audit log table and structured logging.

**Database migration:**

```sql
-- Create audit log table
CREATE TABLE public.audit_logs (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
  action text NOT NULL,
  resource_type text,
  resource_id text,
  ip_address inet,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz DEFAULT now()
);

-- Index for querying by user and time
CREATE INDEX audit_logs_user_id_idx ON public.audit_logs(user_id);
CREATE INDEX audit_logs_created_at_idx ON public.audit_logs(created_at);
CREATE INDEX audit_logs_action_idx ON public.audit_logs(action);

-- RLS: Users can only read their own audit logs
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own audit logs"
  ON public.audit_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Only service role can insert
CREATE POLICY "Service role can insert audit logs"
  ON public.audit_logs FOR INSERT
  WITH CHECK (true); -- Controlled by service role key
```

**Create `lib/audit.ts`:**

```typescript
/**
 * @fileoverview Security audit logging utility
 * @module lib/audit
 */
import { createClient } from '@/lib/supabase/server'

type AuditAction =
  | 'auth.login'
  | 'auth.logout'
  | 'auth.username_set'
  | 'auth.username_check'
  | 'auth.failed_login'
  | 'build.create'
  | 'build.update'
  | 'build.delete'
  | 'star.add'
  | 'star.remove'

interface AuditLogParams {
  userId?: string
  action: AuditAction
  resourceType?: string
  resourceId?: string
  ip?: string
  userAgent?: string
  metadata?: Record<string, unknown>
}

export async function logAuditEvent(params: AuditLogParams): Promise<void> {
  try {
    const supabase = await createClient()
    
    await supabase.from('audit_logs').insert({
      user_id: params.userId,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId,
      ip_address: params.ip,
      user_agent: params.userAgent,
      metadata: params.metadata || {},
    })
  } catch (error) {
    // Don't fail the request if audit logging fails
    console.error('Audit log error:', error)
  }
}
```

**Events to log:**
- Login success/failure
- Username set
- Build create/update/delete
- Star add/remove
- Rate limit exceeded

**Acceptance Criteria:**
- [ ] Audit table created with proper RLS
- [ ] All auth events logged
- [ ] IP and user agent captured
- [ ] Logs queryable by user and time

---

### Task 10.4: Session Fixation Prevention

**Problem:** Session tokens not regenerated after authentication state changes.

**Solution:** Regenerate session on login/logout.

**Update auth callback:**

```typescript
// After successful authentication
// Force new session token generation
await supabase.auth.refreshSession()
```

**Update signOut:**

```typescript
// Clear all session data
await supabase.auth.signOut({ scope: 'global' })

// Clear any local storage tokens
if (typeof window !== 'undefined') {
  localStorage.removeItem('supabase.auth.token')
}
```

**Acceptance Criteria:**
- [ ] Session ID changes after login
- [ ] Session ID changes after logout
- [ ] Old sessions invalidated

---

### Task 10.5: Account Takeover Protection

**Problem:** No detection of suspicious login patterns.

**Solution:** Track login locations and notify on anomalies.

**Extend audit logs query:**

```typescript
/**
 * Check if login is from a new location
 */
async function isNewLoginLocation(
  userId: string, 
  currentIp: string
): Promise<boolean> {
  const supabase = await createClient()
  
  // Get last 10 login IPs for this user
  const { data: recentLogins } = await supabase
    .from('audit_logs')
    .select('ip_address')
    .eq('user_id', userId)
    .eq('action', 'auth.login')
    .order('created_at', { ascending: false })
    .limit(10)
  
  const knownIps = new Set(recentLogins?.map(l => l.ip_address) || [])
  return !knownIps.has(currentIp)
}
```

**Future enhancement:** Send email notification for new location logins (requires email service integration).

**Acceptance Criteria:**
- [ ] New location logins detected
- [ ] Logged with location flag in metadata
- [ ] (Future) Email notification sent

---

### Task 10.6: Username Squatting Prevention

**Problem:** Users could claim usernames matching other users' Google display names before those users register.

**Solution:** Reserve usernames for first 24 hours based on Google display name.

**Note:** This is a complex feature that may not be worth the implementation cost. Consider:
1. Most users will set their username immediately after registering
2. Display names are not guaranteed to be unique
3. Could cause confusion ("Why can't I use my name?")

**Alternative approach:** Allow username changes within first 7 days of registration.

**Simpler implementation:**

```sql
-- Add username_set_at timestamp
ALTER TABLE public.users ADD COLUMN username_set_at timestamptz;

-- Update username API to set this
UPDATE users SET username_set_at = now() WHERE ...
```

```typescript
// Allow username change within 7 days
const canChangeUsername = 
  !profile.username_set_at ||
  new Date() - new Date(profile.username_set_at) < 7 * 24 * 60 * 60 * 1000
```

**Acceptance Criteria:**
- [ ] Users can change username within 7 days
- [ ] After 7 days, username is locked
- [ ] Admin can unlock username changes

---

## Infrastructure Requirements

### Upstash Redis (for rate limiting)
- Create Upstash account
- Set up Redis database
- Add environment variables:
  - `UPSTASH_REDIS_REST_URL`
  - `UPSTASH_REDIS_REST_TOKEN`

### Email Service (for account protection alerts)
- Choose provider (Resend, SendGrid, etc.)
- Configure transactional email templates
- Add environment variables

### Monitoring (recommended)
- Set up Sentry or similar for error tracking
- Configure alerts for:
  - High rate of 429 responses
  - Authentication failures spike
  - Unusual audit log patterns

---

## Completion Checklist

- [ ] Rate limiting implemented and tested
- [ ] CSRF protection active
- [ ] Audit logging in place
- [ ] Session fixation prevented
- [ ] Account protection alerts working
- [ ] Username change policy implemented
- [ ] Infrastructure provisioned
- [ ] Security testing completed
