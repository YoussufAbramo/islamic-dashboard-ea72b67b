

## Plan: Restructure Course Hierarchy to Course → Lessons → Sections → Content

### Current vs New Structure

```text
CURRENT:                          NEW:
Course                            Course
 └─ Sections (course_sections)     └─ Lessons (course_sections renamed conceptually)
     └─ Lessons (lessons table)         └─ Sections (NEW table: lesson_sections)
                                             └─ Content (lessons table, re-parented)
```

### Mapping Strategy

Rather than destructive schema changes, we introduce one new table and re-wire the UI labels:

- **`course_sections`** table stays as-is but is now called **"Lessons"** in the UI (top-level grouping under a course)
- **New `lesson_sections`** table is created as the middle tier ("Sections" inside each Lesson)
- **`lessons`** table is re-parented: its `section_id` FK now points to `lesson_sections` instead of `course_sections`, and is called **"Content"** in the UI

### Database Changes

**1. Create `lesson_sections` table:**
```sql
CREATE TABLE public.lesson_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_section_id uuid NOT NULL REFERENCES public.course_sections(id) ON DELETE CASCADE,
  title text NOT NULL,
  title_ar text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.lesson_sections ENABLE ROW LEVEL SECURITY;
```

**2. RLS policies** for `lesson_sections` mirroring `course_sections` (admin/teacher manage, enrolled view).

**3. Migrate `lessons.section_id`** to point to `lesson_sections`:
- Drop FK `lessons_section_id_fkey`
- Add new FK referencing `lesson_sections(id)` with ON DELETE CASCADE
- Create a default `lesson_section` for each existing `course_section` and migrate existing lessons into it

### UI Changes (CourseDetail.tsx - full rewrite)

**Three-level nested accordion:**

```text
Course Header Card
├─ "Lessons" heading + [Add Lesson] button
│  └─ Accordion Level 1: Lesson items (from course_sections)
│     ├─ "Sections" sub-heading + [Add Section] button
│     │  └─ Accordion Level 2: Section items (from lesson_sections)
│     │     ├─ Content items list (from lessons table)
│     │     │  └─ Each shows title + content type badge + delete button
│     │     └─ [Add Content] button
│     └─ Delete Lesson button
```

- Rename all UI labels: "Section" → "Lesson", add "Section" for mid-tier, "Lesson" → "Content"
- Content types keep the existing `lesson_type` enum (read_listen, exercises, homework, etc.)
- Each level supports add/delete operations
- Data fetching: Course → fetch `course_sections` (Lessons) → for each, fetch `lesson_sections` (Sections) → for each, fetch `lessons` (Content)

### Translation Updates (LanguageContext.tsx)

Add/update keys:
- `courses.lessons` → "Lessons" / "الدروس" (already exists, reuse for top-level)
- `courses.addLesson` → "Add Lesson" / "إضافة درس" (reuse for top-level)
- `courses.sections` → "Sections" / "الأقسام" (reuse for mid-tier)
- `courses.addSection` → "Add Section" / "إضافة قسم" (reuse for mid-tier)
- New: `courses.content` → "Content" / "المحتوى"
- New: `courses.addContent` → "Add Content" / "إضافة محتوى"
- New: `courses.contentType` → "Content Type" / "نوع المحتوى"

### Version Bump

Update `src/lib/version.ts` to `4.1.0` and add changelog entry.

### Files Modified
1. **Database migration** - Create `lesson_sections` table, migrate FK, RLS policies
2. **`src/pages/CourseDetail.tsx`** - Full rewrite with 3-level hierarchy UI
3. **`src/contexts/LanguageContext.tsx`** - Add new translation keys
4. **`src/lib/version.ts`** - Version bump
5. **`CHANGELOG.md`** - Document changes

