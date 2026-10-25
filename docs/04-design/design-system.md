# Digital Library — Design System

**Document Version:** 1.0  
**Project:** Digital Library  
**Release Scope:** V1 and subsequent approved versions  
**Status:** Design Specification  
**Frontend Stack:** HTML, CSS, Vanilla JavaScript

---

## 1. Purpose

This document defines the shared visual language, reusable interface patterns, layout rules, accessibility expectations, and interaction principles for the Digital Library website.

The goal is to provide a consistent experience across authentication pages, book discovery, book details, reading interfaces, user-library pages, and administrative screens.

This document describes the intended design system. It does not claim that every component or visual rule has already been implemented.

---

## 2. Design Principles

The interface should follow these principles:

1. **Readability first:** Book content must remain comfortable to read.
2. **Consistency:** Shared components should behave and appear consistently.
3. **Accessibility:** Controls should support keyboard navigation and assistive technologies.
4. **Responsive layout:** Pages should adapt to different screen sizes.
5. **Clear hierarchy:** Titles, descriptions, actions, and metadata must be easy to distinguish.
6. **Low distraction:** Reading screens should prioritize content over decoration.
7. **Predictability:** Similar actions should produce similar results.
8. **User preference:** Theme and reading settings should be easy to discover.
9. **Safe interaction:** User-generated content must be rendered securely.
10. **Maintainability:** Shared styles should be reusable rather than duplicated across pages.

---

## 3. Visual Identity

### 3.1 Brand Direction

Digital Library should communicate knowledge, organization, focus, and ease of access.

The visual direction should be clean and modern, with readable typography, restrained decoration, consistent spacing, and clear interactive elements.

### 3.2 Color Tokens

The following values are proposed design tokens. They should be reviewed against the existing CSS before adoption.

| Token | Proposed Value | Intended Use |
|---|---|---|
| `--color-primary` | `#3157A4` | Main actions and primary links |
| `--color-primary-hover` | `#244482` | Hover state for primary actions |
| `--color-secondary` | `#64748B` | Secondary controls |
| `--color-background` | `#F8FAFC` | Default page background |
| `--color-surface` | `#FFFFFF` | Cards, panels, and dialogs |
| `--color-text` | `#172033` | Main text |
| `--color-text-muted` | `#64748B` | Supporting text |
| `--color-border` | `#DCE3EC` | Borders and separators |
| `--color-success` | `#15803D` | Successful operations |
| `--color-warning` | `#B45309` | Warnings |
| `--color-danger` | `#B91C1C` | Destructive actions and errors |
| `--color-focus` | `#2563EB` | Keyboard focus indicator |

These colors are design proposals, not verified current implementation values.

### 3.3 Color Usage

- Primary colors should emphasize important actions.
- Surface colors should distinguish content regions without excessive decoration.
- Muted text must remain readable.
- Status colors should be paired with text or icons rather than used as the only indicator.
- Destructive actions must be visually distinguishable from normal actions.
- Color contrast must be checked before release.

---

## 4. Theme System

### 4.1 Light Theme

The light theme should use a light page background, readable dark text, clear surfaces, and visible borders.

### 4.2 Dark Theme

The intended dark theme should:

- Use dark page and surface backgrounds.
- Preserve sufficient contrast.
- Avoid excessively bright large text regions.
- Keep buttons, inputs, menus, and dialogs readable.
- Maintain visible focus indicators.
- Apply consistently across supported pages.

### 4.3 Theme Tokens

A shared token structure is recommended:

```css
:root {
  color-scheme: light;

  --color-primary: #3157A4;
  --color-background: #F8FAFC;
  --color-surface: #FFFFFF;
  --color-text: #172033;
  --color-text-muted: #64748B;
  --color-border: #DCE3EC;

  --radius-small: 4px;
  --radius-medium: 8px;
  --radius-large: 12px;

  --space-1: 4px;
  --space-2: 8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-6: 24px;
  --space-8: 32px;
}

[data-theme="dark"] {
  color-scheme: dark;

  --color-background: #111827;
  --color-surface: #1F2937;
  --color-text: #F3F4F6;
  --color-text-muted: #CBD5E1;
  --color-border: #374151;
}
```

This is a proposed starting point. Merge tokens carefully with existing styles rather than replacing working CSS blindly.

### 4.4 Preference Persistence

If theme preferences are persisted, the implementation must define:

- The storage mechanism.
- The default theme.
- The behavior for first-time visitors.
- The behavior when saved preferences are unavailable.
- Whether preferences are shared across authenticated sessions or devices.

Do not assume server-side synchronization unless implemented.

---

## 5. Typography

### 5.1 General Interface Typography

Use a readable system-font stack unless the project adopts a specific licensed font.

```css
body {
  font-family: system-ui, -apple-system, BlinkMacSystemFont,
    "Segoe UI", sans-serif;
  line-height: 1.5;
}
```

### 5.2 Type Hierarchy

| Element | Recommended Treatment |
|---|---|
| Page title | Largest heading on the page |
| Section heading | Clear separation between major sections |
| Card title | Medium emphasis |
| Body text | Comfortable reading size |
| Metadata | Smaller but still readable |
| Form label | Clear and consistently placed |
| Error message | Direct and easy to understand |

Use semantic HTML headings in logical order.

### 5.3 Reading Typography

The reader should prioritize long-form readability.

Recommended behavior:

- Use a comfortable line height.
- Avoid excessively long lines.
- Allow suitable text-size adjustments.
- Maintain sufficient contrast.
- Keep reading controls separate from the main text.
- Preserve paragraph and chapter structure.

The exact reading font, width, size, and spacing should be configurable only where those preferences are supported.

---

## 6. Spacing and Layout

### 6.1 Spacing Scale

Use a consistent spacing scale based on multiples of four pixels.

| Token | Value |
|---|---:|
| `--space-1` | 4px |
| `--space-2` | 8px |
| `--space-3` | 12px |
| `--space-4` | 16px |
| `--space-6` | 24px |
| `--space-8` | 32px |
| `--space-12` | 48px |

These values are recommendations. Existing layout requirements may justify exceptions.

### 6.2 Page Containers

- Keep primary content within a readable maximum width.
- Use consistent horizontal page padding.
- Prevent forms and dialogs from becoming excessively wide.
- Give the reader a content width suitable for long-form text.
- Avoid horizontal scrolling at common viewport sizes.

### 6.3 Responsive Behavior

The layout should adapt to desktop, tablet, and mobile screens.

On smaller screens:

- Navigation should remain usable.
- Book cards should fit the available width.
- Forms should avoid clipped fields.
- Reader controls should remain accessible.
- Dialogs should fit within the viewport.
- Touch targets should be appropriately sized.

Breakpoint values should be centralized in CSS and selected according to actual layout needs.

---

## 7. Core Interface Components

### 7.1 Buttons

Supported visual variants should include:

- Primary.
- Secondary.
- Text or link-style.
- Destructive.
- Disabled.

Button requirements:

- Use a clear action label.
- Show hover and keyboard-focus states.
- Prevent accidental repeated submissions where appropriate.
- Indicate disabled states clearly.
- Use semantic `<button>` elements for actions.

### 7.2 Form Inputs

Form controls should provide:

- Persistent labels.
- Clear required-field indicators.
- Helpful validation feedback.
- Visible focus states.
- Appropriate input types.
- Accessible error associations.
- Consistent spacing.

Placeholder text must not replace the field label.

### 7.3 Cards

Book and content cards should use a consistent structure where applicable:

- Cover or thumbnail.
- Title.
- Author or relevant metadata.
- Optional category or status.
- Appropriate action.

Cards must handle missing covers, long titles, and incomplete metadata gracefully.

### 7.4 Dialogs and Confirmations

Dialogs should be reserved for important interactions.

They must:

- Have a clear title.
- Explain the action when necessary.
- Provide a visible cancellation option.
- Support keyboard operation.
- Keep focus behavior accessible.
- Avoid hiding essential information.

Destructive actions should request confirmation when the consequences are significant.

### 7.5 Notifications

Success, warning, and error notifications should be concise.

Notifications must not be the only way to communicate a critical error. Important form errors should also be associated with the relevant fields or page content.

### 7.6 Loading and Empty States

Pages that load data should provide appropriate feedback.

Empty states should explain that no results are available and, where useful, suggest a next action.

Error states should distinguish unavailable data from a genuinely empty collection.

---

## 8. Navigation Patterns

The interface should make the current location and available actions understandable.

Potential navigation areas include:

- Main site navigation.
- Book discovery.
- Categories.
- Book details.
- Reading interface.
- User library.
- Account settings.
- Administrative pages.

Actual navigation items must reflect implemented routes and permissions.

Navigation should not expose administrative actions to users who lack the required permissions.

---

## 9. Book Discovery and Catalog

### 9.1 Search

Search interfaces should provide:

- A clearly labeled search field.
- A visible submit or search action where appropriate.
- Loading feedback.
- Empty-result feedback.
- A recoverable error state.

Search behavior must match the backend API contract.

### 9.2 Categories and Filters

Category navigation and filters should use consistent styling.

The interface should distinguish an active filter from an inactive one and provide a practical way to clear filters where supported.

### 9.3 Book Metadata

Metadata should be displayed consistently across cards and book-detail pages.

Do not display information that the API does not provide.

### 9.4 Publication and Visibility

Published, unpublished, archived, and private states must be displayed only according to the application's actual business rules.

The frontend may hide unavailable actions, but the backend remains responsible for enforcing permissions.

---

## 10. Reading Interface

The reader should minimize distraction and keep the content central.

### 10.1 Reading Layout

The reader should provide:

- Clear chapter or document content.
- Readable typography.
- Suitable content width.
- Consistent paragraph spacing.
- Navigation controls where supported.
- Useful feedback when content cannot be loaded.

### 10.2 Reading Preferences

The intended design may include:

- Light and dark themes.
- Reader background selection.
- Text-size adjustment.
- Speech playback controls.
- Playback-speed selection.
- Pitch adjustment where supported by browser speech synthesis.

Only controls backed by implemented functionality should be presented as operational.

### 10.3 Speech Playback

If browser speech synthesis is used:

- Provide play and stop controls.
- Indicate playback state.
- Handle unsupported browsers.
- Handle errors or unavailable voices.
- Avoid implying that every voice supports every rate or pitch value.
- Validate supported settings against browser behavior.

A requested maximum speed of 4x must be treated as a product requirement until verified across supported browsers and voices.

---

## 11. Accessibility Requirements

The design system should target WCAG 2.2 Level AA where practical and applicable.

Requirements include:

- Semantic HTML.
- Keyboard-accessible controls.
- Visible focus indicators.
- Sufficient text and interface contrast.
- Descriptive form labels.
- Accessible validation feedback.
- Meaningful alternative text for informative images.
- Appropriate heading hierarchy.
- Accessible names for icon-only controls.
- Responsive layouts at increased text sizes.
- No reliance on color alone to convey meaning.

Accessibility compliance must be evaluated through testing rather than assumed from the design.

---

## 12. Motion and Interaction

Animations should be purposeful and restrained.

- Provide immediate feedback for interactive actions.
- Avoid unnecessary motion in the reading interface.
- Respect the user's reduced-motion preference where applicable.
- Do not use animation as the only indication of status.
- Keep transitions short and non-disruptive.

The interface must remain functional when motion is reduced or unavailable.

---

## 13. Content and Error Presentation

Interface text should be clear, concise, and consistent.

Errors should explain what happened and, where possible, how to recover.

Avoid displaying:

- Stack traces.
- Raw SQL errors.
- Secret configuration values.
- Internal filesystem paths.
- Authentication tokens.
- Unnecessary implementation details.

User-provided content must be treated as untrusted input.

---

## 14. CSS Organization

Shared design tokens and reusable component styles should be centralized where practical.

Recommended practices:

- Prefer reusable classes over repeated inline styles.
- Use consistent naming conventions.
- Avoid unnecessary selector specificity.
- Keep theme-specific rules centralized.
- Avoid conflicting duplicate rules.
- Remove obsolete styles only after checking their usage.
- Test styles across the pages that use shared components.

The exact stylesheet structure must follow the existing frontend architecture.

---

## 15. JavaScript Interaction Requirements

Frontend JavaScript should:

- Separate UI behavior from API communication where practical.
- Handle failed requests.
- Avoid unsafe HTML insertion.
- Prevent repeated actions when a request is pending.
- Keep theme and reader controls synchronized with their displayed state.
- Handle missing DOM elements safely when relevant.
- Avoid exposing private server configuration.

Use safe DOM APIs and treat all external or user-controlled values as untrusted.

---

## 16. Design System Validation

Before releasing a design change, review:

- [ ] Visual consistency across affected pages.
- [ ] Light-theme readability.
- [ ] Dark-theme readability where supported.
- [ ] Responsive layout.
- [ ] Keyboard navigation.
- [ ] Focus visibility.
- [ ] Form validation and error messages.
- [ ] Loading and empty states.
- [ ] Book cards with missing or long metadata.
- [ ] Reader usability.
- [ ] Safe rendering of user-controlled content.
- [ ] Correct behavior for role-restricted actions.
- [ ] Browser compatibility for supported features.

Record actual test results separately.

---

## 17. Implementation Status

The design tokens, colors, component patterns, and typography values in this document are proposed specifications unless confirmed in the current source code.

Before marking any item as implemented:

1. Inspect the relevant HTML, CSS, and JavaScript.
2. Confirm that the behavior exists.
3. Test it in the supported browser environment.
4. Update the relevant documentation with evidence.
5. Record incomplete or browser-dependent behavior as a limitation.

---

## 18. Related Documents

- `docs/01-product/PRD.md`
- `docs/01-product/feature-list.md`
- `docs/02-requirements/functional-requirements.md`
- `docs/02-requirements/non-functional-requirements.md`
- `docs/03-technical/architecture.md`
- `docs/03-technical/TRD.md`
- `docs/03-technical/api-specification.md`
- `docs/04-design/navigation-flow.md`
- `docs/04-design/page-specification.md`
- `docs/04-design/UI-UX-specification.md`
- `docs/05-security/security-design.md`
- `docs/07-testing/testing-strategy.md`

---

## 19. Maintenance

Review this document when:

- New pages or shared components are introduced.
- Theme behavior changes.
- Reader controls change.
- Accessibility requirements change.
- Navigation structure changes.
- The frontend architecture changes.
- User testing identifies usability issues.

The design system should evolve consistently with the approved product requirements and actual implementation.
