# Updating the Cardinal Dynamics Website

Content files control the words and photos; the shared design lives separately.
Routine updates do not require editing HTML or CSS.

## Normal workflow

1. Create a branch for the update.
2. Edit the appropriate file under `content/` and add photos to `images/`.
3. Run `npm run build`, or ask the student webmaster to do this part.
4. Preview the affected pages at http://127.0.0.1:8000.
5. Open a pull request containing the content, images, and rebuilt HTML.
6. Have a student webmaster or coach review it before merging.

A future automatic GitHub build can handle step 3 for browser-only editors.

## Add a news story

Copy an existing file in `content/news/`, give it a new filename, and edit its
values. Use lowercase words separated by hyphens.

```json
{
  "slug": "your-new-story",
  "title": "Your story title",
  "category": "Team news",
  "date": "2026-10-13",
  "dateLabel": "October 13, 2026",
  "published": false,
  "featured": false,
  "order": 100,
  "image": "images/news/your-photo.jpg",
  "alt": "A short description of what the photo shows",
  "summary": "One or two sentences introducing the story.",
  "paragraphs": ["Your first paragraph.", "Your second paragraph."],
  "relatedUrl": null,
  "relatedLabel": null
}
```

- `slug` should match the filename without `.json` and must be unique.
- `category` is `Team news` or `Season updates`.
- `date` sorts dated stories newest first. Use `null` if no publication date is known.
- `published: false` keeps a draft out of the generated site.
- `featured: true` makes a story eligible for the two homepage features.
- `order` controls the order of undated stories.
- `relatedUrl` and `relatedLabel` add an optional supporting link.

Use the real publication date when a story is approved. Check names, quotes,
competition results, and any student byline with the author and a coach.

## Add a sponsor

Add an entry to `content/sponsors.json`:

```json
{ "name": "Sponsor Name", "url": null, "image": null }
```

Use a real HTTPS website address when available; otherwise keep `url` as `null`.
Add supplied logos under `images/sponsors/` and set `image` to the file's path.
Confirm the sponsor's name and sponsorship details with a coach.

## Add photos

- `images/hero/`: homepage background rotation.
- `images/carousel/`: Our Team carousel.
- `images/robots/`: robot photos.
- `images/news/`: future story photos.
- `images/sponsors/`: sponsor logos.
- `images/brand/`: team logo.
- `images/support/`: donation QR code.

Create a folder when its first photo is added. Use names such as
`2027-wilsonville-drive-team.jpg`. Keep full-size originals outside the repository.
Use web-sized copies, check the crop on a phone, follow the school's student photo
permissions, and remove location metadata.

Add slideshow photos to the matching lists in `content/site.json`. Their list
order controls the rotation; the interval is nine seconds. Add a short, accurate
description in each photo's `alt` field.

The build uses a matching `.webp` copy when available. JPG and PNG also work.
Do not delete photos still used by another story or page.

## JSON editing tips

Team headings and role descriptions are in `content/site.json`. Event awards,
playoff alliance numbers, selections, and finishes are in
`content/event-results.json`; check their linked TBA sources before changing them.
Use `null` for a result that is not listed instead of guessing.

Keep property names in double quotes. Use commas between entries, but no comma
after the last entry. Lists use square brackets; objects use curly braces.
The build reports invalid JSON, missing images, and duplicate story names.

## Before merging

- Confirm names, dates, links, and event results.
- Check photo permissions, captions, and alt text.
- Review the affected desktop and phone layouts.
- Include rebuilt HTML and web-sized images.
- Get a coach or student webmaster's review.
