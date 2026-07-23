# TradeFlow Ops design system

## Experience direction

TradeFlow Ops uses a “daylight operations desk” visual language: crisp working surfaces, charcoal-green text, and a controlled mineral-green accent that remains legible in bright offices and warehouse environments.

The interface is operational rather than promotional. Color identifies actions, selection, risk, and business state instead of decorating the workspace.

## Design principles

1. Put the operational decision before secondary information.
2. Make stock consequences visible before confirmation.
3. Preserve audit context: who changed what, when, why, and from which record.
4. Keep controls consistent across CRM, inventory, and challans.
5. Reveal complexity progressively while keeping primary workflows fast.
6. Never rely on color alone to communicate status.

## Visual tokens

### Color palette

- Canvas: `oklch(1 0 0)`
- Quiet canvas: `oklch(0.975 0.006 160)`
- Raised surface: `oklch(0.992 0.003 160)`
- Ink: `oklch(0.22 0.025 160)`
- Secondary text: `oklch(0.45 0.025 160)`
- Border: `oklch(0.89 0.012 160)`
- Primary: `oklch(0.52 0.13 160)`
- Primary strong: `oklch(0.42 0.12 160)`
- Information: `oklch(0.55 0.15 250)`
- Warning: `oklch(0.68 0.14 75)`
- Error: `oklch(0.55 0.18 25)`
- Success: `oklch(0.48 0.12 155)`

Saturated mid-luminance fills use white text. Status color is always paired with a label and, when helpful, an icon.

### Typography

Inter with a `system-ui` fallback is used for every interface role:

| Role | Size |
|---|---:|
| Caption and metadata | 12px |
| Secondary interface text | 14px |
| Body and controls | 16px |
| Section title | 18px |
| Page heading | 24px |
| Login title | 32px |

Prices, quantities, dates, and document numbers use tabular figures.

### Shape and depth

- Controls: 8px radius.
- Panels and dialogs: 12px radius.
- Status chips: pill shape because they are compact labels.
- Prefer borders and surface changes over shadows.
- Reserve one restrained shadow for overlays and the mobile drawer.
- Avoid nested decorative cards.

## Layout

- Desktop uses a persistent 248px navigation rail.
- Content width is capped at 1440px.
- Tablet and mobile navigation becomes a drawer.
- Gutters are 16px on mobile, 24px on tablet, and 32px on desktop.
- Long forms use two columns on desktop and one below 900px.
- Tables scroll horizontally inside a labelled region when necessary.
- Essential columns remain first and row actions remain reachable.
- The document owns page scrolling; avoid nested full-page scroll areas.

## Component behavior

### Navigation

- Use a single outlined MUI icon family with visible text labels.
- Show the active destination with shape, contrast, and text—not color alone.
- Keep sign-out and current-user context clearly separated from navigation.

### Page headers

- Show a concise title and supporting context.
- Present at most one primary action.
- Keep filters and secondary actions close to the content they affect.

### Tables and lists

- Include search, meaningful filters, explicit pagination, and result counts.
- Provide loading skeletons, errors with recovery actions, and useful empty states.
- Use readable status labels and right-align numerical values.
- Give icon-only actions accessible names.

### Forms

- Use persistent labels, on-blur validation, and inline recovery guidance.
- Preserve user input after recoverable errors.
- Disable duplicate submissions and show progress on the submitting action.
- Use concrete domain language instead of technical field names.

### Stock-changing actions

- Display product, requested quantity, and stock consequences.
- Require a focused confirmation for irreversible or compensating operations.
- Return actionable errors that show requested and available stock.
- Announce successful state changes and refresh dependent data.

## Responsive behavior

- Target a minimum supported width of 375px.
- Keep primary actions near the page heading.
- Convert dense tables to horizontal regions rather than shrinking text below readable sizes.
- Maintain at least 44px touch targets for primary interactive controls.
- Ensure dialogs fit the viewport and their actions remain visible.
- Support browser zoom to 200% without loss of content or functionality.

## Accessibility

The target is WCAG 2.1 AA:

- Semantic headings and landmarks.
- Programmatically associated labels and validation messages.
- Visible keyboard focus.
- Complete keyboard access to navigation, tables, forms, dialogs, and menus.
- Screen-reader announcements for asynchronous feedback.
- Sufficient contrast for text and controls.
- Text or icons in addition to color for statuses.
- Reduced-motion support.
- Meaningful empty, loading, unauthorized, not-found, and error states.

## Motion

- Use 150–220ms transitions for drawers, dialogs, hover, focus, and selection.
- Animate opacity and transforms rather than layout dimensions.
- Motion communicates state change only; do not orchestrate page-load animation.
- Disable nonessential transitions under `prefers-reduced-motion`.

## UX writing

Use direct operational language:

- “Confirm challan and deduct stock”
- “Add stock movement”
- “Next follow-up”
- “Cancel challan and restore stock”

Errors state the cause and recovery. For example: “Cannot confirm this challan: 8 units were requested, but only 5 are available.”

Avoid vague labels such as “Submit,” “Process,” or “Something went wrong” when a more precise action or recovery is known.

## Anti-patterns

- Interchangeable metric-card grids without an operational narrative.
- Decorative glassmorphism, neon gradients, excessive radii, or animated chrome.
- Consumer-shopping language that makes inventory work resemble e-commerce.
- Dense legacy ERP layouts with tiny controls and unexplained abbreviations.
- Hidden state transitions or silent stock changes.
- Confirmation dialogs that do not explain consequences.
- Status communication based only on red, amber, or green.
