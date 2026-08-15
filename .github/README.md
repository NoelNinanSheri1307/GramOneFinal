# Development workflow

GramOne development is tracked through the **existing GitHub Issues** in this
repository. We do not create a separate backlog.

## How it works

1. **One issue at a time.** A milestone begins with issues already filed;
   work is pulled one issue at a time and completed before moving on.
2. **Issues are the plan.** Feature, architecture and fix work is described in
   issues; PRs link to the relevant issue number.
3. **Do not duplicate issues.** Before filing anything new, check that an issue
   for it does not already exist. The existing issues are authoritative.
4. **Do not modify existing issues without coordination.** Existing issues stay
   as the canonical list; the initial foundation work is upstream of them.

## Branching convention

Small branches per issue, e.g.:

```
<parent> -> feature/<issue-number>-<short-name>
```

and a PR that references `Closes #<issue-number>` where applicable.

## Status transitions

An issue is **done** only when its code is merged and its verification (backend
tests + checks, or the equivalent for the affected stack) passes.