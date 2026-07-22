# TradeFlow Ops Design

## Visual Theme

Daylight operations desk: crisp white working surfaces, charcoal-green ink, and a controlled mineral green anchor that reads clearly in bright offices and warehouse environments. The strategy is restrained; color marks actions, selection, and business state rather than decorating the workspace.

## Color Palette

- Canvas: `oklch(1 0 0)`
- Quiet canvas: `oklch(0.975 0.006 160)`
- Raised surface: `oklch(0.992 0.003 160)`
- Ink: `oklch(0.22 0.025 160)`
- Secondary text: `oklch(0.45 0.025 160)`
- Border: `oklch(0.89 0.012 160)`
- Primary: `oklch(0.52 0.13 160)`
- Primary strong: `oklch(0.42 0.12 160)`
- Information accent: `oklch(0.55 0.15 250)`
- Warning: `oklch(0.68 0.14 75)`
- Error: `oklch(0.55 0.18 25)`
- Success: `oklch(0.48 0.12 155)`

Saturated mid-luminance fills always use white text. Status color is paired with a text label and, where helpful, an icon.

## Typography

Use Inter with a system-ui fallback for every interface role. The product uses a compact fixed type scale: 12px captions, 14px secondary UI, 16px body and controls, 18px section titles, 24px page headings, and 32px only for the login title. Use tabular figures for prices, quantities, dates, and document numbers.

## Shape and Depth

- Controls: 8px radius.
- Panels and dialogs: 12px radius.
- Status chips: full pill only because they are compact labels.
- Prefer boundaries and surface changes over shadows.
- Use one restrained 8px-blur shadow only for overlays and the mobile drawer.
- Never nest decorative cards.

## Layout

- Desktop: persistent 248px navigation rail and a content area capped at 1440px.
- Tablet/mobile: navigation becomes a drawer; page actions remain close to the heading.
- Page gutters: 16px mobile, 24px tablet, 32px desktop.
- Tables become horizontally scrollable within a labelled region; essential columns remain first.
- Long forms use two columns on desktop and one column below 900px.
- The main document owns scrolling; avoid nested page scroll containers.

## Components

- Page headers contain one primary action at most.
- Tables provide search, meaningful empty states, loading skeletons, and explicit pagination.
- Forms use persistent labels, on-blur validation, inline recovery guidance, and loading buttons.
- Destructive or stock-changing actions require a focused confirmation dialog.
- Navigation uses one consistent outlined MUI icon family with text labels.
- Dashboard information is arranged as an operational brief, not a uniform metric-card grid.

## Motion

Use 150-220ms state transitions for drawers, dialogs, hover, and selection. Motion communicates state changes only. Do not orchestrate page-load animations. Respect `prefers-reduced-motion` by disabling nonessential transitions.

## UX Copy

Use concrete operational language: “Confirm challan and deduct stock,” “Add stock movement,” and “Next follow-up.” Errors state the cause and recovery, including available and requested stock when a confirmation fails.

