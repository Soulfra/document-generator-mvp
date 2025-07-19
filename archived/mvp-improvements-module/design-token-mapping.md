# Design Token Mapping: Figma → Code

Use this template to map Figma design tokens (colors, fonts, spacing) to your codebase (Tailwind, CSS variables, etc.).

---

## 1. Colors
| Figma Token | Hex | Tailwind Class | CSS Variable |
|-------------|-----|----------------|-------------|
| Primary     | #7C3AED | bg-purple-600 | --color-primary |
| Accent      | #38BDF8 | text-sky-400  | --color-accent  |
| Background  | #18181B | bg-gray-900   | --color-bg      |

## 2. Typography
| Figma Token | Font Family | Tailwind Class | CSS Variable |
|-------------|-------------|---------------|--------------|
| Heading     | Inter Bold  | font-bold text-2xl | --font-heading |
| Body        | Inter       | font-normal text-base | --font-body |

## 3. Spacing
| Figma Token | Value | Tailwind Class | CSS Variable |
|-------------|-------|---------------|--------------|
| Spacing S   | 8px   | p-2, m-2      | --space-s    |
| Spacing M   | 16px  | p-4, m-4      | --space-m    |
| Spacing L   | 32px  | p-8, m-8      | --space-l    |

---

## How to Use
- Update this file as your design system evolves.
- Sync with designers to ensure tokens match Figma.
- Use these mappings in your Tailwind config, CSS, or component styles.

---

*Keep this mapping up to date for a seamless design-to-code workflow.* 