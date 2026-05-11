// Lehena — Conventional Commits enforcement.
//
// Format: <type>(<scope>): <subject>
//   types: feat, fix, chore, docs, refactor, test, perf, build, ci, revert
//   scope optional (e.g. `feat(checkout): ...`)
//
// Phase commits use `chore(phase-N): ...` per the refonte plan.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "subject-case": [0],
    "body-max-line-length": [0],
    "header-max-length": [2, "always", 100],
  },
}
