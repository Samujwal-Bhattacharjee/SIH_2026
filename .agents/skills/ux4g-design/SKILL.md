---
name: ux4g-design
description: >-
  User Experience for Government (UX4G / Digital India) design system specifications,
  standards, and component guidelines for Government of India administrative and procurement portals.
---

# UX4G (User Experience for Government) Design Guidelines

## 1. Overview & Core Philosophy
UX4G is the official Government of India design framework developed by the National Informatics Centre (NIC) and Digital India Corporation. It establishes consistent, accessible, high-trust, and citizen-/officer-centric digital interfaces for governance systems.

### Core Principles:
- **Trust & Authority**: Official national emblems, bilingual support (Hindi/English), clear ministerial hierarchy, and explicit statutory references (e.g. GFR 2017).
- **Accessibility & Inclusion (GIGW 3.0 Compliance)**: High-contrast text, clear focus rings, keyboard navigability, semantic HTML, and legible typography.
- **Evidence-First Decision Support**: Objective, non-punitive language for compliance engines, unambiguous audit trails, and transparent derivation of risk scores.
- **Clean Government Aesthetics**: Restrained color palette (Deep Navy `#0B2A4A`, Ashoka Saffron `#FF9933`/`#E67E22`, Tricolour Green `#16A34A`, Slate Gray `#F8FAFC`/`#E2E8F0`), thin borders (1px), subtle corner radius (`rounded-[2px]` to `rounded-[4px]`), and compact high-density data tables.

---

## 2. Color Palette & Semantic Tokens

### Primary Government Colors:
| Role | HEX Code | Tailwind Equivalent / Usage |
| :--- | :--- | :--- |
| **National Navy (Primary)** | `#0B2A4A` / `#0B3558` | Top headers, primary buttons, major headings |
| **Navy Hover / Active** | `#123F6D` / `#123B63` | Navigation hover, active tabs |
| **Ashoka Saffron (Accent)** | `#FF9933` / `#E67E22` | Active tab indicator, statutory alerts, badge accents |
| **India Green (Success)** | `#16A34A` / `#059669` | Qualified bidders, compliant records, verified status |
| **Gov Red (Critical / Error)**| `#C81E1E` / `#9B1C1C` | Critical risk tier, disqualified status, validation errors |
| **Gov Amber (Warning)** | `#D97706` / `#B45309` | Under review, clarification requested, medium risk |
| **Neutral Surface** | `#F8FAFC` / `#F1F5F9` | Page background, table headers, container backgrounds |
| **Card / Surface White** | `#FFFFFF` | Primary card background, active inputs |
| **Border Gray** | `#D9DDE3` / `#CBD5E1` | Thin structural container borders |
| **Body Text** | `#1E293B` / `#334155` | Primary content, high readability text |
| **Muted Metadata** | `#64748B` / `#475569` | Secondary captions, timestamps, table subheaders |

---

## 3. Typography & Hierarchy
- **Primary Interface Font**: `Inter`, `Noto Sans`, or system sans-serif (`font-sans`).
- **Official Headings & Department Titles**: Serif accents (`font-serif`, `Merriweather`, or `Georgia`) for institutional gravitas.
- **Monospace Identifiers**: `font-mono` for statutory IDs (GSTIN, PAN, Udyam, Tender Number, Case ID, SHA hashes, and timestamps).
- **Scale**:
  - Page Title: `text-2xl font-bold font-serif text-[#0B2A4A]`
  - Section Title: `text-sm font-bold text-[#0B2A4A] uppercase tracking-wide`
  - Body Text: `text-xs text-[#334155]`
  - Microcopy / Tags: `text-[10px]` or `text-[11px]` font-semibold

---

## 4. Standard UI Components

### 4.1. Status Badges (`GovBadge`)
```tsx
// Success / Compliant / Low Risk
<span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#DEF7EC] text-[#03543F] border border-[#BCF0DA]">
  [✓] COMPLIANT
</span>

// Warning / Needs Review / Medium Risk
<span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#FEF08A] text-[#713F12] border border-[#FDE047]">
  [!] UNDER REVIEW
</span>

// Error / Disqualified / High Risk
<span className="px-2 py-0.5 text-[10px] font-bold rounded-[2px] bg-[#FDE8E8] text-[#9B1C1C] border border-[#F8B4B4]">
  [!] EXCEPTION FOUND
</span>
```

### 4.2. Action Buttons (`GovButton`)
- **Primary**: `bg-[#0B2A4A] hover:bg-[#123B63] text-white text-xs font-semibold px-3 py-1.5 rounded-[2px] border border-[#0B2A4A]`
- **Secondary / Outline**: `bg-white hover:bg-[#F0F5FA] text-[#0B2A4A] text-xs font-semibold px-3 py-1.5 rounded-[2px] border border-[#0B2A4A]`
- **Danger / Dismiss**: `bg-[#DC2626] hover:bg-[#B91C1C] text-white text-xs font-semibold px-3 py-1.5 rounded-[2px]`

### 4.3. High-Density Tables (`GovTable`)
- Headers: `bg-[#F1F5F9] text-[#475569] font-bold text-[10px] uppercase tracking-wider py-2.5 px-3 border-b border-[#D9DDE3]`
- Rows: `hover:bg-[#F8FAFC] text-xs text-[#334155] border-b border-[#E2E8F0] transition-colors`
- Selected Row: `bg-[#F0F5FA] border-l-4 border-[#0B2A4A]`

---

## 5. Bilingual & GIGW Standards
- Support Hindi (`hi`) and English (`en`) label mappings across all navigation and key operational verbs.
- Include official statutory advisories and non-punitive decision support disclaimers on algorithmic assessment pages.
