<!-- BEGIN:project-scope -->
# Project scope — improve the EXISTING site, never rebuild it

rentgen.az **already exists** and is the only site. It is a full Next.js + Prisma app:
OTP auth, RBAC (PATIENT / CENTER / ADMIN), patient cabinet `/kabinet`, center portal
`/merkez` (+ `/merkez/qeydiyyat`), `/admin` with center approval, blog, services
(`/xidmetler`), and a centers directory (`/rentgen-merkezleri`), with Prisma migrations
and a seed.

**Every engineering task means: change, harden, and improve THIS codebase.** Do NOT
initialize a new repository, scaffold a fresh skeleton, or build a "new site" from
scratch — there is no greenfield here. If a task reads like a from-zero build, treat it
as work on the existing app instead and flag the wording to the CEO. (Directive: REN-11.)
<!-- END:project-scope -->

<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->
