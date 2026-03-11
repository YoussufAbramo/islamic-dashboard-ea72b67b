

## Plan: Expand Advanced SEO Settings

### Current State
The SEO settings page has 3 cards covering: basic SEO (canonical URL, OG image, robots, verification codes), structured data (org name/URL), and social media (Twitter, Facebook, auto sitemap).

### New Features to Add

**1. Meta Defaults Card** — Global default meta title, description, title separator (e.g. `|`, `-`, `·`), and title template (e.g. `%page% | %site%`)

**2. Expanded Structured Data Card** — Add org logo (ImagePickerField), org description, org type dropdown (Organization, EducationalOrganization, LocalBusiness, etc.), contact email, contact phone, and a custom JSON-LD textarea for advanced users

**3. Open Graph Defaults Card** — OG type selector (website, article, etc.), default OG title, OG description, OG locale (e.g. `en_US`, `ar_SA`), Twitter card type (summary, summary_large_image)

**4. Expanded Social Profiles Card** — Add Instagram, YouTube, LinkedIn, TikTok fields alongside existing Twitter/Facebook

**5. Redirects & Custom Head Card** — Custom `<head>` injection textarea for arbitrary meta tags/scripts, and a `robots.txt` custom rules textarea

**6. Expanded Verification Card** — Add Yandex verification, Pinterest verification alongside existing Google/Bing

### Technical Approach
- Extend `SeoConfig` interface with ~20 new fields, all with sensible defaults
- Add new fields to `defaultSeo` (empty strings/booleans so existing saved data merges cleanly)
- Add Select dropdowns for title separator, OG type, Twitter card type, org type
- Use ImagePickerField for org logo
- Use Textarea for custom head injection, custom robots rules, custom JSON-LD
- All persisted to the same `seo_global_config` section key in `landing_content`
- Full bilingual labels (AR/EN)

### File Changes
- `src/components/settings/SeoSettings.tsx` — sole file edited

