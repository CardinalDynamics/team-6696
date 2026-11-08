# Cardinal Dynamics Website

Website for Team 6696 at https://team6696.org/. The homepage introduces the team; dedicated
pages cover the team, robots, news and events, support, and contact information.

## Preview locally

Node.js 20 or newer is the only build requirement. There are no packages to install.

```sh
npm run build
npm start
```

Open http://127.0.0.1:8000. If that port is occupied, use `PORT=8001 npm start`.
Rebuild and refresh after editing content. The built pages are ordinary static HTML.

## Where to make updates

| Update | File or folder |
| --- | --- |
| Team details, contacts, current season, photo rotations | `content/site.json` |
| Robot photos, descriptions, competition links | `content/robots.json` |
| Sponsor names, links, and optional logos | `content/sponsors.json` |
| Season history | `content/seasons.json` |
| Event awards, playoff alliances, picks, and finishes | `content/event-results.json` |
| News stories | One file per story in `content/news/` |
| Photos | Section folders inside `images/` |
| Shared design | `assets/site.css` |
| Mobile menu, slideshow, filters | `assets/site.js` |
| HTML generation | `scripts/build.mjs` |

Start with [CONTRIBUTING.md](CONTRIBUTING.md) for the student update workflow.

## Publishing

The generated HTML pages work with the existing GitHub Pages hosting. For now,
content edits must be rebuilt and the resulting HTML included in the pull request.

Before students regularly update the site through GitHub's web editor, enable a
GitHub Actions workflow that runs this build and publishes its output after a
reviewed pull request is merged. That automation is a future improvement; it will
remove the need for students to run Node locally.

The news system supports individual stories, dates, categories, drafts, and
homepage features. A form-based editor could later write these same content files.

## Content notes

- The initial stories summarize facts from the previous site and use season labels
  instead of invented publication dates or student bylines.
- The BIOCORE kickoff date links to the official FIRST season page.
- Team meeting times and event selections are provided by the coaches.
- Sponsor names are used until authentic logos are supplied.
- Sponsors without websites appear without a link.
- Existing single-page hash links redirect to the corresponding new page.
- Event results were checked against The Blue Alliance on November 6, 2026.
  Each season and event links to its source. A dash indicates no listed award or
  playoff result; it is not an assertion that an unrecorded result never occurred.
