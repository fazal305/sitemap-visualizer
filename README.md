# Sitemap Visualizer

A browser-based SEO and developer tool for importing, parsing,
grouping, visualizing, and exporting sitemap.xml URL structures.

## Live Links

- GitHub Repository: [fazal305/sitemap-visualizer](https://github.com/fazal305/sitemap-visualizer)
- Live Demo: [https://fazal305.github.io/sitemap-visualizer/](https://fazal305.github.io/sitemap-visualizer/)

## Overview

Sitemap Visualizer helps developers, SEO learners, and website owners understand website structure from a sitemap.xml file. It parses sitemap URLs in the browser, groups them by domain and path, and displays them as a collapsible visual tree.

The project runs entirely in the browser with no backend, no dependencies, and no build step. Users can paste XML, import a local XML file, search parsed URLs, review sitemap statistics, and export the results.

## Features

- Paste sitemap.xml content directly into the browser
- Import local `.xml` sitemap files
- Parse standard sitemap URL sets with `<url><loc>` entries
- Parse sitemap index files with `<sitemap><loc>` entries
- Normalize and deduplicate parsed URLs
- Group URLs by domain and path structure
- Render a collapsible recursive visual tree
- Display a searchable flat URL list
- Show sitemap statistics for URL count, domains, sections, depth, and XML size
- Copy parsed URLs to the clipboard
- Download parsed URLs as a `.txt` file
- Download grouped tree data as a `.json` file
- Handle invalid XML with clear status messages
- Work locally by opening `index.html`

## Technologies Used

- HTML5
- CSS3
- Vanilla JavaScript
- DOMParser
- Blob API
- Clipboard API
- FileReader API
- URL API

## Learning Outcomes

- Parse XML safely in the browser with `DOMParser`
- Extract sitemap locations from both URL sets and sitemap indexes
- Normalize URLs with the browser `URL` API
- Convert flat URL arrays into nested tree data
- Render recursive UI structures with vanilla JavaScript
- Build collapsible interface patterns with accessible button states
- Use browser-only file import, clipboard, and download APIs
- Design a responsive developer tool without frameworks

## Folder Structure

```text
sitemap-visualizer/
  index.html
  styles.css
  script.js
  README.md
  LICENSE
  .gitignore
```

How To Run Locally
git clone https://github.com/fazal305/sitemap-visualizer.git
cd sitemap-visualizer
start index.html
You can also open index.html directly in any modern browser.
How To Use
Open index.html in your browser.
Paste sitemap XML into the textarea or import a local .xml file.
Click Parse Sitemap.
Review the generated stats, visual tree, and flat URL list.
Use the search field to filter URLs by domain, path, or full URL.
Expand and collapse the visual tree to inspect site structure.
Copy the URL list or download .txt and .json exports.
Sample Sitemap
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
<url>
<loc>https://example.com/</loc>
</url>
<url>
<loc>https://example.com/blog/xml-sitemap-guide</loc>
</url>
<url>
<loc>https://example.com/products/api-tools</loc>
</url>
</urlset>
