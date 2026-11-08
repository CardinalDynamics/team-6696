import { readFile, readdir, mkdir, writeFile, access, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { dirname, resolve, extname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const readJSON = async path => JSON.parse(await readFile(resolve(root, path), 'utf8'));
const site = await readJSON('content/site.json');
const robots = await readJSON('content/robots.json');
const sponsors = await readJSON('content/sponsors.json');
const seasons = await readJSON('content/seasons.json');
const eventResults = await readJSON('content/event-results.json');
const newsFiles = (await readdir(resolve(root, 'content/news'))).filter(name => name.endsWith('.json'));
const news = (await Promise.all(newsFiles.map(name => readJSON('content/news/' + name))))
  .filter(post => post.published)
  .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (a.order ?? 100) - (b.order ?? 100));
const seen = new Set();
for (const post of news) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(post.slug) || seen.has(post.slug)) throw new Error('Invalid or duplicate news slug: ' + post.slug);
  seen.add(post.slug);
  if (!post.title || !post.summary || !Array.isArray(post.paragraphs)) throw new Error('Missing news fields: ' + post.slug);
}
const imagePaths = [...site.heroPhotos, ...site.carouselPhotos, ...robots, ...news, ...sponsors].map(item => item.image).filter(Boolean);
for (const path of imagePaths) {
  if (!path.startsWith('images/') || path.includes('..')) throw new Error('Invalid image path: ' + path);
  await access(resolve(root, path)).catch(() => { throw new Error('Missing image: ' + path); });
}
const escape = value => String(value ?? '').replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;').replaceAll("'", '&#39;');
const webImage = path => {
  const optimized = path.slice(0, -extname(path).length) + '.webp';
  return existsSync(resolve(root, optimized)) ? optimized : path;
};
const nav = [
  ['index.html', 'Home', 'home'], ['team.html', 'Our Team', 'team'],
  ['robots.html', 'Robots', 'robots'], ['news.html', 'News & Events', 'news'],
  ['support.html', 'Support Us', 'support'], ['contact.html', 'Contact', 'contact']
];
const icon = (name = 'arrow-right', prefix = '') => `<svg class="icon" width="20" height="20" aria-hidden="true"><use href="${prefix}assets/icons.svg#${name}"></use></svg>`;
const link = (href, label, className = 'text-link', prefix = '') => {
  if (!(href.startsWith('https://') || href.startsWith('mailto:') || /^[a-z0-9./#-]+$/i.test(href))) throw new Error('Invalid link: ' + href);
  return `<a class="${className}" href="${escape(href)}">${escape(label)}${icon('arrow-right', prefix)}</a>`;
};
const image = (path, alt, className = '', prefix = '', eager = false) => `<img src="${prefix}${webImage(path)}" alt="${escape(alt)}" class="${className}" width="1200" height="800" loading="${eager ? 'eager' : 'lazy'}" decoding="async">`;
const paragraphs = values => values.map(value => `<p>${escape(value)}</p>`).join('');

function layout({ title, description, current, content, prefix = '' }) {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escape(title)} | Cardinal Dynamics 6696</title>
  <meta name="description" content="${escape(description)}">
  <meta name="theme-color" content="#bb1736">
  <link rel="icon" href="${prefix}${webImage('images/brand/robotics2022.png')}">
  <link rel="stylesheet" href="${prefix}assets/site.css">
  <script src="${prefix}assets/site.js" defer></script>
</head>
<body>
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="site-header">
    <div class="container header-inner">
      <a class="brand" href="${prefix}index.html" aria-label="Cardinal Dynamics home">
        <img src="${prefix}${webImage('images/brand/robotics2022.png')}" width="60" height="60" alt="">
        <span><strong>Cardinal Dynamics</strong><span>FRC Team 6696</span></span>
      </a>
      <button class="menu-toggle icon-button" type="button" aria-controls="navigation" aria-expanded="false" aria-label="Open navigation" title="Open navigation" hidden>${icon('menu', prefix)}${icon('x', prefix)}</button>
      <nav id="navigation" class="main-nav" aria-label="Main navigation">
        ${nav.map(([path, label, key]) => `<a href="${prefix}${path}"${key === current ? ' aria-current="page"' : ''}${key === 'support' ? ' class="support-nav"' : ''}>${label}</a>`).join('')}
      </nav>
    </div>
  </header>
  <main id="main">${content}</main>
  <footer class="site-footer">
    <div class="container footer-inner">
      <div><a class="brand footer-brand" href="${prefix}index.html"><img src="${prefix}${webImage('images/brand/robotics2022.png')}" width="48" height="48" alt=""><span><strong>Cardinal Dynamics</strong><span>FRC Team 6696</span></span></a><p>${escape(site.school)} · ${escape(site.location)}</p></div>
      <div class="footer-contact"><a href="mailto:${escape(site.email)}">${icon('mail', prefix)}${escape(site.email)}</a><a href="${site.githubUrl}">Team GitHub${icon('external-link', prefix)}</a></div>
      <nav aria-label="Footer navigation">${nav.slice(1).map(([path, label]) => `<a href="${prefix}${path}">${label}</a>`).join('')}</nav>
    </div>
    <div class="container footer-bottom"><span>© ${new Date().getFullYear()} Cardinal Dynamics</span><span>Learning, building, and competing since 2017.</span></div>
  </footer>
</body>
</html>`.replace(/[ \t]+$/gm, '');
}
const pageHead = (title, introduction) => `<section class="page-heading"><div class="container"><h1>${escape(title)}</h1><p class="lead">${escape(introduction)}</p></div></section>`;
const sectionHead = (title, href, label) => `<div class="section-heading"><h2>${escape(title)}</h2>${href ? link(href, label) : ''}</div>`;
function sponsorGrid(prefix = '') {
  return `<div class="sponsors-grid">${sponsors.map(sponsor => {
    const content = sponsor.image ? image(sponsor.image, sponsor.name, 'sponsor-logo', prefix) : `<span>${escape(sponsor.name)}</span>`;
    return sponsor.url ? `<a class="sponsor-tile" href="${escape(sponsor.url)}">${content}</a>` : `<div class="sponsor-tile">${content}</div>`;
  }).join('')}</div>`;
}
function postPreview(post, prefix = '') {
  return `<article class="news-item" data-category="${escape(post.category)}">
    <a class="news-image" href="${prefix}news/${post.slug}.html" tabindex="-1">${image(post.image, post.alt, '', prefix)}</a>
    <div class="post-meta"><span>${escape(post.category)}</span><span>${escape(post.dateLabel)}</span></div>
    <h3><a href="${prefix}news/${post.slug}.html">${escape(post.title)}</a></h3>
    <p>${escape(post.summary)}</p>
    ${link(prefix + 'news/' + post.slug + '.html', 'Read the story', 'text-link', prefix)}
  </article>`;
}
function slideshow(photos, name, hero = false) {
  return `<div class="${hero ? 'hero-media' : 'team-carousel'}" data-slideshow data-interval="9000" role="region" aria-label="${name}">
    <div class="slides">${photos.map((photo, i) => `<div class="slide${i === 0 ? ' is-active' : ''}"${i ? ' aria-hidden="true"' : ''}>${image(photo.image, photo.alt, '', '', hero && i === 0).replace('class=""', `class="" style="object-position:${escape(photo.position || 'center')}"`)}</div>`).join('')}</div>
    ${hero ? '' : '<p class="slide-caption">' + escape(photos[0].alt) + '</p>'}
    <div class="slideshow-controls" hidden>
      <button type="button" data-prev class="icon-button" aria-label="Previous photo" title="Previous photo">${icon('chevron-left')}</button>
      <span class="slide-count" aria-live="off">1 / ${photos.length}</span>
      <button type="button" data-next class="icon-button" aria-label="Next photo" title="Next photo">${icon('chevron-right')}</button>
      <button type="button" data-pause class="icon-button" aria-label="Pause slideshow" title="Pause slideshow" aria-pressed="false">${icon('pause')}${icon('play')}</button>
    </div>
  </div>`;
}
const featured = news.filter(post => post.featured)
  .sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.order ?? 0) - (a.order ?? 0)).slice(0, 2);
const home = `
  <section class="home-hero">
    ${slideshow(site.heroPhotos, 'Team photos', true)}
    <div class="container hero-copy"><h1>${escape(site.heroTitle)}</h1><p>${escape(site.heroSubtitle)}</p><div class="hero-actions">${link('team.html', 'Meet the team', 'button')}${link('robots.html', 'Explore our robots', 'button button-light')}</div></div>
  </section>
  <section class="season-strip" aria-label="Current season"><div class="container"><p><strong>${escape(site.currentSeason.label)}:</strong> ${escape(site.currentSeason.name)}</p>${link('news.html#season', 'Season updates')}</div></section>
  <section class="section"><div class="container">${sectionHead('Around the team', 'news.html', 'All news & events')}<div class="news-grid home-news">${featured.map(post => postPreview(post)).join('')}</div></div></section>
  <section class="section surface"><div class="container robot-feature">${image(robots[0].image, robots[0].alt, 'feature-image')}<div><h2>Meet S.A.M.</h2><p class="lead">Designed, built, and programmed by our students for the 2026 REBUILT season.</p><p>From the first design to the competition field, every robot is a chance to learn something new together.</p>${link('robots.html', 'Our robots & season history')}</div></div></section>
  <section class="section supporters-home"><div class="container">${sectionHead('Our supporters', 'support.html', 'Become a supporter')}${sponsorGrid()}</div></section>`;
const team = `
  ${pageHead('Our team', site.teamIntro)}
  <section class="section compact"><div class="container team-intro"><div class="prose"><h2>${escape(site.teamHeading)}</h2>${paragraphs(site.teamParagraphs)}${link('https://www.firstinspires.org/programs/frc/', 'Learn about FIRST Robotics Competition')}</div>${slideshow(site.carouselPhotos, 'Life on the team')}</div></section>
  <section class="section surface"><div class="container"><h2>Find your place on the team.</h2><div class="roles-grid">${site.teamRoles.map(role => `<div><h3>${escape(role.title)}</h3><p>${escape(role.description)}</p></div>`).join('')}</div></div></section>
  <section class="section"><div class="container faq-layout"><div><h2>Thinking about joining?</h2><p>Start with a conversation. Our coaches can answer questions about the class and the current schedule.</p>${link('contact.html', 'Talk with our coaches', 'button')}</div><div class="faq-list">${site.faqs.map(faq => `<details><summary>${escape(faq.question)}</summary><p>${escape(faq.answer)}</p></details>`).join('')}</div></div></section>`;
const resultsFor = year => eventResults.find(season => season.year === year);
const extraAwards = event => event.awards.filter(award => !/Event Winner|Event Finalist/.test(award));
const finishLabel = event => (event.finish || '—').replace('Double Elimination Bracket (Round ', 'Double elimination, round ').replace(')', '');
function seasonRecord(season) {
  const results = resultsFor(season.year);
  const events = results?.events || [];
  const wins = events.filter(event => event.finish === 'Winner').length;
  const awards = events.reduce((total,event) => total + extraAwards(event).length, 0);
  const highlights = [wins ? wins + (wins === 1 ? ' event win' : ' event wins') : '', awards ? awards + (awards === 1 ? ' additional award' : ' additional awards') : ''].filter(Boolean).join(' · ') || (events.length ? events.length + ' events' : season.status);
  return `<details class="season-record" id="season-${season.year}"${season.year === 2026 ? ' open' : ''}><summary><strong>${season.year}</strong><span>${escape(season.game)}</span><span class="season-summary">${escape(highlights)}</span></summary><div class="season-detail"><p class="small-copy">${escape(season.year === 2020 ? 'Season interrupted by COVID-19 after the Clackamas Academy event.' : season.status)}${results ? ' · Results from The Blue Alliance. Includes off-season events where listed.' : ''}</p>${events.length ? `<div class="table-scroll" role="region" aria-label="${season.year} event results" tabindex="0"><table><caption class="sr-only">${season.year} awards and playoff results</caption><thead><tr><th scope="col">Event</th><th scope="col">Playoff alliance</th><th scope="col">Finish</th><th scope="col">Awards</th></tr></thead><tbody>${events.map(event => `<tr><th scope="row"><a href="${escape(event.url)}">${escape(event.name)}</a></th><td>${event.alliance ? escape(event.alliance) + '<br>' + escape(event.selection) : '—'}</td><td>${escape(finishLabel(event))}</td><td>${event.awards.length ? event.awards.map(award=>escape(award)).join('<br>') : '—'}</td></tr>`).join('')}</tbody></table></div><p class="small-copy result-note">A dash means no award or playoff result is listed on The Blue Alliance.</p>` : `<p>${escape(site.currentSeason.eventNote)}</p>`}${results ? link(results.source, 'View ' + season.year + ' on The Blue Alliance') : ''}</div></details>`;
}
const robotPage = `
  ${pageHead('Our robots', 'A new challenge every year. Each robot is designed, built, and programmed by Cardinal Dynamics students.')}
  <div class="container results-intro">${link('https://www.thebluealliance.com/team/6696', 'Team 6696 on The Blue Alliance')}</div>
  <section class="section compact"><div class="container robot-list">${robots.map(robot => `<article class="robot-row" id="robot-${robot.year}">${image(robot.image, robot.alt, 'robot-image')}<div><p class="post-meta">${robot.year} · ${escape(robot.game)}</p><h2>${escape(robot.name)}</h2><p>${escape(robot.description)}</p><h3 class="small-heading">Season events & highlights</h3><ul class="event-list">${(resultsFor(robot.year)?.events || []).map(event => `<li><a href="${escape(event.url)}">${escape(event.name)}</a>${event.finish === 'Winner' || extraAwards(event).length ? `<span class="event-highlight">${escape([event.finish === 'Winner' ? 'Event winner' : '', ...extraAwards(event)].filter(Boolean).join(' · '))}</span>` : ''}</li>`).join('')}</ul><div class="robot-links">${link('#season-' + robot.year, 'Awards & playoff alliances')}${link(robot.resultsUrl, 'Competition results')}</div></div></article>`).join('')}</div></section>
  <section class="section surface" id="history"><div class="container"><h2>Season history</h2><p>Awards, alliance selections, and playoff results through the years.</p><div class="season-history">${seasons.map(seasonRecord).join('')}</div></div></section>`;
const newsPage = `
  ${pageHead('News & events', 'Competition recaps, moments from the shop, and what comes next for Team 6696.')}
  <section class="section compact" id="season"><div class="container season-overview"><div><h2>${escape(site.currentSeason.name)}</h2><p class="lead">${escape(site.currentSeason.label)}</p><p>${escape(site.currentSeason.eventNote)}</p></div><div class="event-notice"><span>FIRST Robotics Competition kickoff</span><strong>${escape(site.currentSeason.kickoffLabel)}</strong>${link(site.currentSeason.kickoffSource, 'Official season information')}</div></div></section>
  <section class="section surface"><div class="container" data-news-list><div class="section-heading"><h2>Team updates</h2><div class="news-filters" role="group" aria-label="Filter news" hidden>${['All updates','Season updates','Team news'].map((category,i) => `<button type="button" data-filter="${escape(category)}" aria-pressed="${i === 0}">${escape(category)}</button>`).join('')}</div></div><div class="news-grid">${news.map(post => postPreview(post)).join('')}</div><p class="sr-only" data-filter-status role="status"></p></div></section>`;
const support = `
  ${pageHead('Support the team', 'Help students turn curiosity into experience. Your support makes it possible to build, learn, and compete.')}
  <section class="section compact"><div class="container support-layout"><div class="prose"><h2>Every contribution makes a difference.</h2><p>Competing in FRC costs around $30,000 per season, covering parts, registration fees, travel, and tools.</p><h3>Become a supporter</h3><p>Partner with the team for a season. Contact us for the sponsorship packet and the benefits available at each level.</p><dl class="tier-list">${site.sponsorTiers.map(tier => `<div><dt>${escape(tier.name)}</dt><dd>${escape(tier.amount)}</dd></div>`).join('')}</dl>${link('mailto:' + site.email, 'Ask about sponsorship', 'button')}<h3>Share materials or your experience</h3><p>Metal stock, fasteners, electronics, tools, and mentoring can all help. We welcome interest from technical and non-technical mentors.</p>${link('contact.html', 'Talk with the team')}</div><aside class="donation-box"><h2>Make a donation</h2><p>Donate to Cardinal Dynamics through the Corbett School District's MySchoolBucks payment portal.</p><img src="images/support/qr-code.png" alt="QR code for the Cardinal Dynamics donation page" width="200" height="200" loading="lazy">${link(site.donationUrl, 'Donate via MySchoolBucks', 'button')}<p class="small-copy">Or email us to discuss sponsorship or an in-kind donation.</p></aside></div></section>
  <section class="section surface" id="sponsors"><div class="container">${sectionHead('Thank you to our supporters')}${sponsorGrid()}</div></section>`;
const contact = `
  ${pageHead('Contact us', 'Interested in robotics? We would love to hear from students, families, potential mentors, and community supporters.')}
  <section class="section compact"><div class="container contact-layout"><div><h2>Start a conversation.</h2><p>For questions about joining, mentoring, sponsorship, or the team, email:</p><a class="contact-email" href="mailto:${site.email}">${escape(site.email)}</a><div class="coach-list">${site.coaches.map(coach => `<div><h3>${escape(coach.name)}</h3><a href="mailto:${escape(coach.email)}">${escape(coach.email)}</a></div>`).join('')}</div><h3>${escape(site.school)}</h3><p>${escape(site.location)}</p><p>Contact the coaches for current class times, meeting details, and visiting arrangements.</p></div>${image('images/hero/hero-04.jpg', 'Cardinal Dynamics students at the driver station', 'contact-photo')}</div></section>
  <section class="section surface"><div class="container contact-paths"><div><h3>Join the team</h3><p>Ask about the robotics class and how to get started.</p>${link('team.html', 'Meet the team')}</div><div><h3>Mentor or volunteer</h3><p>Share technical skills, practical experience, or a helping hand.</p>${link('mailto:' + site.email, 'Email our coaches')}</div><div><h3>Support our students</h3><p>Learn about donations, sponsorship, and in-kind support.</p>${link('support.html', 'Ways to help')}</div></div></section>`;

const pages = [
  ['index.html', 'home', 'Home', site.teamIntro, home],
  ['team.html', 'team', 'Our Team', site.teamIntro, team],
  ['robots.html', 'robots', 'Our Robots', 'Meet the student-built robots of Cardinal Dynamics and explore our competition history.', robotPage],
  ['news.html', 'news', 'News & Events', 'Team news, competition recaps, and upcoming events for Cardinal Dynamics.', newsPage],
  ['support.html', 'support', 'Support Us', 'Support Cardinal Dynamics students through sponsorship, donations, or mentoring.', support],
  ['contact.html', 'contact', 'Contact', 'Contact the Cardinal Dynamics coaches about joining, mentoring, and sponsorship.', contact]
];
for (const [path, current, title, description, content] of pages) await writeFile(resolve(root, path), layout({title, description, current, content}));
await mkdir(resolve(root, 'news'), {recursive:true});
// Remove previously generated articles when their content becomes a draft or is removed.
for (const name of await readdir(resolve(root, 'news'))) {
  if (name.endsWith('.html') && !news.some(post => name === post.slug + '.html')) await rm(resolve(root, 'news', name));
}
for (const post of news) {
  const content = `<article class="story"><div class="container"><a class="back-link" href="../news.html">All news & events</a><div class="story-heading"><p class="post-meta">${escape(post.category)} · ${escape(post.dateLabel)}</p><h1>${escape(post.title)}</h1><p class="lead">${escape(post.summary)}</p></div>${image(post.image, post.alt, 'story-image', '../', true)}<div class="prose story-body">${paragraphs(post.paragraphs)}${post.relatedUrl ? link(post.relatedUrl, post.relatedLabel, 'text-link', '../') : ''}</div></div></article><section class="section surface"><div class="container"><h2>More from the team</h2><div class="news-grid">${news.filter(other => other.slug !== post.slug).slice(0,2).map(other => postPreview(other,'../')).join('')}</div></div></section>`;
  // Related images and story links need the same prefix on nested article pages.
  await writeFile(resolve(root, 'news', post.slug + '.html'), layout({title:post.title,description:post.summary,current:'news',content,prefix:'../'}));
}
console.log(`Built ${pages.length} pages and ${news.length} stories. Content and images validated.`);
