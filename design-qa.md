# Daymark Design QA

- Source visual truth: `docs/assets/daymark-dashboard-source.jpg`
- Browser-rendered implementation: `docs/assets/daymark-dashboard-implementation.jpg`
- Full-view comparison: `docs/assets/daymark-dashboard-comparison.jpg`
- Focused header/command comparison: `docs/assets/daymark-dashboard-focused-comparison.jpg`
- Source pixels: 1487 × 1058
- Implementation pixels: 1363 × 936
- Browser CSS viewport: 1363 × 936
- Device scale factor: 1
- Comparison normalization: source resized to 1363 × 970; implementation
  padded at the bottom to 1363 × 970 to preserve the browser capture without
  distorting it.
- State: default Today dashboard before interaction tests.

## Findings

No actionable P0, P1, or P2 differences remain.

- Fonts and typography: Newsreader and DM Sans reproduce the source's editorial
  display/body contrast. Heading scale, weights, wrapping, and small-label
  hierarchy are faithful at the available viewport.
- Spacing and layout rhythm: sidebar, primary workspace, and 340px context rail
  retain the source proportions. The implementation's bottom Project Pulse row
  falls below the 936px browser viewport; the source target is 1058px tall, so
  this is a viewport difference rather than hidden application content.
- Colors and tokens: deep ink surfaces, warm ivory text, amber approvals, teal
  healthy/live states, and blue active states match the source direction.
- Image and asset fidelity: the screen contains no photographic or illustrative
  assets. Phosphor supplies all UI icons; no handwritten SVG, emoji, CSS art, or
  placeholder imagery replaces source assets.
- Copy and content: primary headings, suggestion, sandbox/PR boundary, schedule,
  priority rows, project data, queue states, and working-memory content match the
  selected source closely.
- Accessibility and responsiveness: landmarks and headings are present; form
  controls have labels; interactive focus styles are visible; reduced-motion
  preference is honored; layouts collapse at 1240px, 980px, and 720px.

## Browser verification

Primary interactions tested in the cloud browser:

- Bee live-context switch toggles and updates `aria-checked`.
- Model route changes from Claude Sonnet 4 to Codex.
- Command input accepts and submits a planning request.
- Command feedback preserves both the selected model route and Bee-context
  choice.
- Priority completion updates the accessible action label.
- Approving a coding suggestion adds a third work-queue item in the Plan phase
  without claiming that a sandbox already exists.
- Repeating the same approval keeps one active task and reports that the task is
  already queued.
- Project selection remains interactive inside the Projects workspace.
- Queue filters cycle through all, coding-agent, and assistant work.
- Existing coding lifecycle controls remain visible through PR, and the PR
  phase is terminal and disabled.
- Collapsed sidebar navigation retains accessible button names.
- MCP, calendar, and working-memory controls provide visible feedback instead
  of acting as inert affordances.

Console review found no application-origin errors or warnings. The browser
reported extension metadata errors from a `chrome-extension://` URL; these are
outside the Daymark application.

## Full-view comparison evidence

The combined full view shows matching information hierarchy, major-region
proportions, primary colors, density, and content order. The implementation
preserves the selected design's personal-first dashboard while retaining the
project and agent operations from the merged concept.

## Focused comparison evidence

The focused header comparison confirms matching display type, command-bar
anatomy, Bee control, recommendation hierarchy, approval actions, and schedule
alignment. Dense UI details are readable in the focused artifact.

## Comparison history

### Pass 1

- Earlier P0/P1/P2 findings: none.
- Fixes made from visual comparison: none required.
- Post-fix evidence: not applicable; the first browser-rendered comparison met
  the blocking fidelity bar.

### Review hardening pass

- Resolved all ten initial review findings covering clean-check ordering,
  navigation names, workspace selection, toast ownership, duplicate approvals,
  domain transitions, inert controls, command context, terminal phases, and the
  dynamic Today date.
- Clean verification passed with the prior `dist` directory absent: seven
  domain tests, production build, and four Sites worker tests.
- Focused browser regression passed for command context, MCP navigation,
  project selection, duplicate approvals, queue filters, and terminal task
  protection.

## Follow-up polish

- P3: capture an additional 1440 × 1024 browser viewport when that viewport can
  be selected directly, eliminating the small height-normalization note.
- P3: revisit exact row density after real project and queue data is connected.

final result: passed
