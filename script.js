const PLATFORM_PATTERNS = [
  { name: "YouTube", test: /(?:youtube\.com|youtu\.be)/i },
  { name: "Instagram", test: /instagram\.com/i },
  { name: "TikTok", test: /tiktok\.com/i },
  { name: "Facebook", test: /facebook\.com|fb\.watch/i },
  { name: "Twitter/X", test: /(?:twitter\.com|x\.com)/i },
];

const SAMPLE_FORMATS = {
  video: [
    { label: "MP4 HD (1080p)", meta: "Best quality • Video + Audio" },
    { label: "MP4 SD (720p)", meta: "Balanced quality • Smaller size" },
    { label: "MP4 Mobile (480p)", meta: "Fast download • Low data" },
  ],
  audio: [{ label: "MP3 (320kbps)", meta: "Audio only • High quality" }],
};

const form = document.getElementById("downloadForm");
const input = document.getElementById("urlInput");
const statusText = document.getElementById("status");
const results = document.getElementById("results");
const platformBadge = document.getElementById("platformBadge");
const detectedHost = document.getElementById("detectedHost");
const options = document.getElementById("downloadOptions");
const template = document.getElementById("optionTemplate");
const previewPlaceholder = document.getElementById("previewPlaceholder");
const previewImage = document.getElementById("previewImage");
const downloadBtn = document.getElementById("downloadBtn");
const themeToggle = document.getElementById("themeToggle");

initTheme();
autoDetectClipboard();

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const raw = input.value.trim();

  if (!raw) {
    setStatus("Please paste a valid link to continue.", true);
    return;
  }

  let parsed;
  try {
    parsed = new URL(raw);
  } catch {
    setStatus("Invalid URL format. Please check your link and try again.", true);
    return;
  }

  setLoading(true);
  setStatus("Processing your link...");

  await new Promise((resolve) => setTimeout(resolve, 900));

  const platform = detectPlatform(parsed.hostname);
  platformBadge.textContent = platform;
  detectedHost.textContent = parsed.hostname.replace("www.", "");

  renderOptions();
  showPreview(platform, parsed);

  results.classList.remove("hidden");
  setStatus(`Ready! Download options are available for ${platform}.`);
  setLoading(false);
});

function detectPlatform(hostname) {
  const rule = PLATFORM_PATTERNS.find((item) => item.test.test(hostname));
  return rule?.name ?? "Generic Site";
}

function renderOptions() {
  options.innerHTML = "";

  [...SAMPLE_FORMATS.video, ...SAMPLE_FORMATS.audio].forEach((format) => {
    const node = template.content.cloneNode(true);
    node.querySelector(".option-label").textContent = format.label;
    node.querySelector(".option-meta").textContent = format.meta;

    node.querySelector(".option-download").addEventListener("click", () => {
      setStatus(`Starting ${format.label} download...`);
    });

    options.appendChild(node);
  });
}

function showPreview(platform, parsedUrl) {
  const isYouTube = platform === "YouTube";

  if (isYouTube) {
    const videoId = extractYouTubeId(parsedUrl);
    if (videoId) {
      previewImage.src = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      previewImage.classList.remove("hidden");
      previewPlaceholder.classList.add("hidden");
      return;
    }
  }

  previewImage.classList.add("hidden");
  previewPlaceholder.classList.remove("hidden");
}

function extractYouTubeId(parsedUrl) {
  if (parsedUrl.hostname.includes("youtu.be")) {
    return parsedUrl.pathname.split("/").filter(Boolean)[0] ?? "";
  }

  return parsedUrl.searchParams.get("v") ?? "";
}

function setStatus(message, isError = false) {
  statusText.textContent = message;
  statusText.style.color = isError ? "#cc2f2f" : "";
}

function setLoading(isLoading) {
  downloadBtn.disabled = isLoading;
  downloadBtn.classList.toggle("loading", isLoading);
  downloadBtn.textContent = isLoading ? "Processing" : "Download";
}

function initTheme() {
  const saved = localStorage.getItem("uvd-theme");
  if (saved === "dark") {
    document.body.classList.add("dark");
    themeToggle.textContent = "☀️";
  }

  themeToggle.addEventListener("click", () => {
    const isDark = document.body.classList.toggle("dark");
    localStorage.setItem("uvd-theme", isDark ? "dark" : "light");
    themeToggle.textContent = isDark ? "☀️" : "🌙";
  });
}

async function autoDetectClipboard() {
  if (!navigator.clipboard?.readText) {
    return;
  }

  try {
    const clipboardText = (await navigator.clipboard.readText()).trim();
    if (clipboardText.startsWith("http://") || clipboardText.startsWith("https://")) {
      input.value = clipboardText;
      setStatus("Link auto-detected from clipboard. Tap Download to continue.");
    }
  } catch {
    // Clipboard read can be blocked by browser permissions.
  }
}
