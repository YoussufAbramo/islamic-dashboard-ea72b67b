## Invoice Page UI Enhancement Plan

Based on your selections, here's the plan for a clean, minimal redesign covering all four areas plus the payment method and "Pay Now" additions.

- Add the app Logo.
- fix the invoice status style.
- add at the end of the invoice the signature and stamp or the brand (they are images).

---

### 1. Summary Stats Cards (top of page)

Four compact KPI cards in a responsive grid:

```text
┌──────────────┐ ┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│  Total       │ │  Paid        │ │  Pending     │ │  Overdue     │
│  12          │ │  $1,240.00   │ │  $560.00     │ │  3           │
│  FileText    │ │  CheckCircle │ │  Clock       │ │  AlertTriangle│
└──────────────┘ └──────────────┘ └──────────────┘ └──────────────┘
```

Computed from the fetched invoices array -- no extra queries needed. Each card uses a subtle icon and muted accent color.

---

### 2. Better Table Design

- **Status filter tabs** above the table: All | Pending | Paid | Overdue | Cancelled -- each shows a count badge
- **Student avatar initials** circle (first letter of name) in the student column
- **Colored amount text** -- green for paid, yellow for pending, red for overdue
- **Subtle row hover** with `hover:bg-muted/50` transition
- **Responsive**: on mobile, switch to a card-based list layout instead of the table

---

### 3. Richer Preview Dialog

Redesign the preview as a professional invoice document:

- **Header**: Invoice number + status badge on the right, creation date below
- **Divider line** beneath header
- **Two-column info cards**: Student info (name, email, phone) and Course details (title, billing cycle)
- **Amount block**: Larger, centered amount with a subtle warm background, due date beneath
- **Payment methods section**: Show all configured gateways from app settings with their icons. Add a prominent **"Pay Now"** button (primary color, full-width or centered) that links to the selected payment gateway
- **Notes section**: Only if notes exist
- **Action bar**: Copy URL, Open/Print invoice, Download PDF buttons
- **Timeline/activity**: Show created date, and paid_at date if applicable, as a simple two-step vertical timeline

---

### 4. Empty State & Loading

- **Skeleton loading**: Show 4 skeleton cards + 5 skeleton table rows while data loads (use existing Skeleton component)
- **Empty state**: When no invoices exist, show a centered illustration area with a FileText icon, a friendly message, and a CTA button to create the first invoice

---

### 5. Payment Method & "Pay Now" Button

In the invoice preview dialog:

- Display all available payment gateways from app settings (currently only one can be active)
- Show gateway icon, name, and "Active" badge
- Add a large **"Pay Now"** button below the payment methods section
- The button opens the payment gateway URL in a new tab (placeholder behavior since actual gateway integration depends on backend)
- For students viewing their own invoices, the "Pay Now" button is prominent; for admins previewing, it shows as secondary

---

### Technical Details

- All changes are in `src/pages/Invoices.tsx` only
- Uses existing components: `Card`, `Badge`, `Skeleton`, `Tabs`/`TabsList`/`TabsTrigger` from shadcn
- Loading state tracked via a new `loading` boolean state, set during `fetchInvoices`
- Status filter uses local state, no extra DB queries
- Avatar initials are derived from the student's full_name (first character)
- Bilingual (AR/EN) labels maintained for all new UI elements