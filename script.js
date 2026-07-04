const sitemapInput = document.querySelector("#sitemap-input");
const fileInput = document.querySelector("#file-input");
const parseButton = document.querySelector("#parse-button");
const sampleButton = document.querySelector("#sample-button");
const clearButton = document.querySelector("#clear-button");
const statusMessage = document.querySelector("#status-message");
const treePanel = document.querySelector("#tree-panel");
const urlList = document.querySelector("#url-list");
const searchInput = document.querySelector("#search-input");
const copyButton = document.querySelector("#copy-button");
const downloadTextButton = document.querySelector("#download-text-button");
const downloadJsonButton = document.querySelector("#download-json-button");
const statTotal = document.querySelector("#stat-total");
const statDomains = document.querySelector("#stat-domains");
const statSections = document.querySelector("#stat-sections");
const statDepth = document.querySelector("#stat-depth");
const statSize = document.querySelector("#stat-size");

let currentXmlText = "";
let sitemapUrls = [];
let siteTree = {};
let filteredUrls = [];

/**
 * Parses sitemap XML text and extracts URL locations.
 */
function parseSitemapXML(text) {
    const parser = new DOMParser();
    const documentXml = parser.parseFromString(text, "application/xml");
    const parserError = documentXml.querySelector("parsererror");

    if (parserError) {
        return {
            valid: false,
            error: "Invalid XML. Check the sitemap markup and try again."
        };
    }

    const urlLocs = Array.from(documentXml.querySelectorAll("url > loc"));
    const sitemapLocs = Array.from(documentXml.querySelectorAll("sitemap > loc"));
    const locNodes = urlLocs.length > 0 ? urlLocs : sitemapLocs;
    const urls = locNodes
        .map((node) => normalizeUrl(node.textContent))
        .filter(Boolean);

    if (urls.length === 0) {
        return {
            valid: false,
            error: "No sitemap URLs were found. Expected <url><loc> or <sitemap><loc> entries."
        };
    }

    return {
        valid: true,
        urls
    };
}

/**
 * Cleans a URL string and removes trailing slashes except for root URLs.
 */
function normalizeUrl(url) {
    const cleaned = url.trim();

    if (!cleaned) {
        return "";
    }

    try {
        const parsedUrl = new URL(cleaned);

        if (parsedUrl.pathname.length > 1 && parsedUrl.pathname.endsWith("/")) {
            parsedUrl.pathname = parsedUrl.pathname.slice(0, -1);
        }

        return parsedUrl.toString();
    } catch (error) {
        return cleaned.endsWith("/") && cleaned.length > 1 ? cleaned.slice(0, -1) : cleaned;
    }
}

/**
 * Splits a URL into protocol, domain, path, segments, and query data.
 */
function getUrlParts(url) {
    try {
        const parsedUrl = new URL(url);
        const segments = parsedUrl.pathname
            .split("/")
            .map((segment) => segment.trim())
            .filter(Boolean);

        return {
            valid: true,
            protocol: parsedUrl.protocol.replace(":", ""),
            hostname: parsedUrl.hostname,
            pathname: parsedUrl.pathname,
            segments,
            query: parsedUrl.search
        };
    } catch (error) {
        return {
            valid: false,
            protocol: "",
            hostname: "Invalid URL",
            pathname: "",
            segments: [],
            query: ""
        };
    }
}

/**
 * Groups URLs by domain and nested path segments.
 */
function buildSiteTree(urls) {
    const tree = {};

    urls.forEach((url) => {
        const parts = getUrlParts(url);

        if (!parts.valid) {
            return;
        }

        if (!tree[parts.hostname]) {
            tree[parts.hostname] = {
                name: parts.hostname,
                type: "domain",
                count: 0,
                url: "",
                children: {}
            };
        }

        let currentNode = tree[parts.hostname];
        currentNode.count += 1;

        if (parts.segments.length === 0) {
            currentNode.url = url;
            return;
        }

        parts.segments.forEach((segment, index) => {
            if (!currentNode.children[segment]) {
                currentNode.children[segment] = {
                    name: segment,
                    type: index === parts.segments.length - 1 ? "page" : "folder",
                    count: 0,
                    url: "",
                    children: {}
                };
            }

            currentNode = currentNode.children[segment];
            currentNode.count += 1;

            if (index === parts.segments.length - 1) {
                currentNode.url = url;
            }
        });
    });

    return tree;
}

/**
 * Renders the complete collapsible sitemap tree.
 */
function renderTree(tree) {
    treePanel.textContent = "";

    const domainNames = Object.keys(tree).sort();

    if (domainNames.length === 0) {
        renderEmptyState(treePanel, "No tree data to display.");
        return;
    }

    const treeWrapper = document.createElement("div");
    treeWrapper.className = "tree";

    domainNames.forEach((domainName) => {
        treeWrapper.appendChild(createTreeNode(domainName, tree[domainName], 0));
    });

    treePanel.appendChild(treeWrapper);
}

/**
 * Creates one collapsible tree node with recursive children.
 */
function createTreeNode(name, node, depth) {
    const wrapper = document.createElement("div");
    const childNames = Object.keys(node.children || {}).sort();
    const hasChildren = childNames.length > 0;

    wrapper.className = "tree-node";
    wrapper.style.marginLeft = depth === 0 ? "0" : "2px";

    const button = document.createElement("button");
    button.className = "tree-node__button";
    button.type = "button";
    button.setAttribute("aria-expanded", "true");

    const label = document.createElement("span");
    label.className = "tree-node__label";

    const icon = document.createElement("span");
    icon.textContent = hasChildren ? "▾" : "•";

    const typeIcon = document.createElement("span");
    typeIcon.textContent = node.type === "domain" ? "🌐" : hasChildren ? "📁" : "📄";

    const nodeName = document.createElement("span");
    nodeName.className = "tree-node__name";
    nodeName.textContent = name;

    const badge = document.createElement("span");
    badge.className = "tree-node__badge";
    badge.textContent = `${node.count} URL${node.count === 1 ? "" : "s"}`;

    label.appendChild(icon);
    label.appendChild(typeIcon);
    label.appendChild(nodeName);
    button.appendChild(label);
    button.appendChild(badge);
    wrapper.appendChild(button);

    if (hasChildren) {
        const children = document.createElement("div");
        children.className = "tree-node__children";

        childNames.forEach((childName) => {
            children.appendChild(createTreeNode(childName, node.children[childName], depth + 1));
        });

        wrapper.appendChild(children);

        button.addEventListener("click", () => {
            const isCollapsed = wrapper.classList.toggle("is-collapsed");
            icon.textContent = isCollapsed ? "▸" : "▾";
            button.setAttribute("aria-expanded", String(!isCollapsed));
        });
    } else {
        button.addEventListener("click", () => {
            if (node.url) {
                showStatus(node.url, "info");
            }
        });
    }

    return wrapper;
}

/**
 * Renders a flat list of parsed URLs.
 */
function renderUrlList(urls) {
    urlList.textContent = "";

    if (urls.length === 0) {
        renderEmptyState(urlList, "No URLs match the current view.");
        return;
    }

    const listWrapper = document.createElement("div");
    listWrapper.className = "url-list";

    urls.forEach((url) => {
        const parts = getUrlParts(url);
        const row = document.createElement("div");
        row.className = "url-row";

        const main = document.createElement("div");
        main.className = "url-row__main";

        const urlText = document.createElement("span");
        urlText.className = "url-row__url";
        urlText.textContent = url;

        const meta = document.createElement("div");
        meta.className = "url-row__meta";

        const domain = document.createElement("span");
        domain.textContent = parts.hostname;

        const path = document.createElement("span");
        path.textContent = parts.pathname || "/";

        const depth = document.createElement("span");
        depth.className = "url-row__depth";
        depth.textContent = `Depth ${parts.segments.length}`;

        meta.appendChild(domain);
        meta.appendChild(path);
        main.appendChild(urlText);
        main.appendChild(meta);
        row.appendChild(main);
        row.appendChild(depth);
        listWrapper.appendChild(row);
    });

    urlList.appendChild(listWrapper);
}

/**
 * Renders sitemap statistics.
 */
function renderStats(urls, xmlText) {
    const domains = new Set();
    const sections = new Set();
    let maxDepth = 0;

    urls.forEach((url) => {
        const parts = getUrlParts(url);

        if (!parts.valid) {
            return;
        }

        domains.add(parts.hostname);

        if (parts.segments[0]) {
            sections.add(`${parts.hostname}/${parts.segments[0]}`);
        }

        maxDepth = Math.max(maxDepth, parts.segments.length);
    });

    statTotal.textContent = String(urls.length);
    statDomains.textContent = String(domains.size);
    statSections.textContent = String(sections.size);
    statDepth.textContent = String(maxDepth);
    statSize.textContent = formatBytes(new Blob([xmlText]).size);
}

/**
 * Filters URLs by full URL, domain, or path segment text.
 */
function filterUrls(term) {
    const searchTerm = term.trim().toLowerCase();

    if (!searchTerm) {
        filteredUrls = [...sitemapUrls];
    } else {
        filteredUrls = sitemapUrls.filter((url) => {
            const parts = getUrlParts(url);
            const segmentText = parts.segments.join(" ").toLowerCase();

            return (
                url.toLowerCase().includes(searchTerm) ||
                parts.hostname.toLowerCase().includes(searchTerm) ||
                segmentText.includes(searchTerm)
            );
        });
    }

    renderUrlList(filteredUrls);
    renderTree(buildSiteTree(filteredUrls));
    showStatus(`Showing ${filteredUrls.length} of ${sitemapUrls.length} URLs.`, "info");
}

/**
 * Reads textarea XML, parses it, and renders all outputs.
 */
async function handleParse() {
    setLoading(true);

    try {
        const xmlText = sitemapInput.value.trim();

        if (!xmlText) {
            showStatus("Paste sitemap XML or import a file first.", "error");
            return;
        }

        const result = parseSitemapXML(xmlText);

        if (!result.valid) {
            showStatus(result.error, "error");
            return;
        }

        currentXmlText = xmlText;
        sitemapUrls = Array.from(new Set(result.urls.map(normalizeUrl)));
        siteTree = buildSiteTree(sitemapUrls);
        filteredUrls = [...sitemapUrls];

        searchInput.value = "";
        renderTree(siteTree);
        renderUrlList(filteredUrls);
        renderStats(sitemapUrls, currentXmlText);
        showStatus(`Parsed ${sitemapUrls.length} URLs successfully.`, "success");
    } finally {
        setLoading(false);
    }
}

/**
 * Imports a selected XML file and parses it.
 */
async function handleFileImport(event) {
    const file = event.target.files[0];

    if (!file) {
        return;
    }

    try {
        const text = await file.text();
        sitemapInput.value = text;
        await handleParse();
    } catch (error) {
        showStatus("Could not read that XML file.", "error");
    }
}

/**
 * Loads a realistic sample sitemap into the textarea.
 */
function loadSampleSitemap() {
    const sample = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://example.com/</loc>
  </url>
  <url>
    <loc>https://example.com/about</loc>
  </url>
  <url>
    <loc>https://example.com/blog/xml-sitemap-guide</loc>
  </url>
  <url>
    <loc>https://example.com/blog/seo-basics</loc>
  </url>
  <url>
    <loc>https://example.com/blog/technical-seo-checklist</loc>
  </url>
  <url>
    <loc>https://example.com/products/api-tools</loc>
  </url>
  <url>
    <loc>https://example.com/products/dataforge</loc>
  </url>
  <url>
    <loc>https://example.com/products/sitemap-visualizer</loc>
  </url>
  <url>
    <loc>https://example.com/categories/developer-tools</loc>
  </url>
  <url>
    <loc>https://example.com/categories/seo-learning</loc>
  </url>
  <url>
    <loc>https://example.com/contact</loc>
  </url>
  <url>
    <loc>https://example.com/privacy-policy</loc>
  </url>
</urlset>`;

    sitemapInput.value = sample;
    handleParse();
}

/**
 * Clears app state and resets the interface.
 */
function handleClear() {
    currentXmlText = "";
    sitemapUrls = [];
    siteTree = {};
    filteredUrls = [];

    sitemapInput.value = "";
    fileInput.value = "";
    searchInput.value = "";

    renderTree(siteTree);
    renderUrlList(filteredUrls);
    renderStats([], "");
    showStatus("Cleared. Paste a sitemap or load the sample to begin.", "info");
}

/**
 * Copies parsed URLs to the clipboard.
 */
async function copyUrlList() {
    if (sitemapUrls.length === 0) {
        showStatus("Parse a sitemap before copying URLs.", "error");
        return;
    }

    try {
        await navigator.clipboard.writeText(sitemapUrls.join("\n"));
        showStatus("URL list copied to clipboard.", "success");
    } catch (error) {
        showStatus("Clipboard access failed in this browser.", "error");
    }
}

/**
 * Downloads parsed URLs as a plain text file.
 */
function downloadUrlList() {
    if (sitemapUrls.length === 0) {
        showStatus("Parse a sitemap before downloading URLs.", "error");
        return;
    }

    downloadFile("sitemap-urls.txt", sitemapUrls.join("\n"), "text/plain");
    showStatus("URL list download created.", "success");
}

/**
 * Downloads the grouped sitemap tree as JSON.
 */
function downloadJsonStructure() {
    if (sitemapUrls.length === 0) {
        showStatus("Parse a sitemap before downloading JSON.", "error");
        return;
    }

    downloadFile("sitemap-structure.json", JSON.stringify(siteTree, null, 2), "application/json");
    showStatus("JSON structure download created.", "success");
}

/**
 * Creates and triggers a browser download.
 */
function downloadFile(filename, content, type) {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
}

/**
 * Converts bytes into a readable file size.
 */
function formatBytes(bytes) {
    if (bytes === 0) {
        return "0 B";
    }

    const units = ["B", "KB", "MB", "GB"];
    const index = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, index);

    return `${size.toFixed(index === 0 ? 0 : 1)} ${units[index]}`;
}

/**
 * Escapes text for safe HTML display when needed.
 */
function escapeHtml(str) {
    return str
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

/**
 * Shows a status message with a visual state.
 */
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.dataset.type = type;
}

/**
 * Toggles the loading state for parsing.
 */
function setLoading(isLoading) {
    parseButton.disabled = isLoading;
    parseButton.textContent = isLoading ? "Parsing..." : "Parse Sitemap";
}

/**
 * Renders a plain empty state inside a container.
 */
function renderEmptyState(container, message) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = message;
    container.appendChild(empty);
}

parseButton.addEventListener("click", handleParse);
fileInput.addEventListener("change", handleFileImport);
sampleButton.addEventListener("click", loadSampleSitemap);
clearButton.addEventListener("click", handleClear);
copyButton.addEventListener("click", copyUrlList);
downloadTextButton.addEventListener("click", downloadUrlList);
downloadJsonButton.addEventListener("click", downloadJsonStructure);
searchInput.addEventListener("input", (event) => filterUrls(event.target.value));

renderStats([], "");