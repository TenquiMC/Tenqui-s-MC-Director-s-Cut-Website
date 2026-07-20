const pages = Array.from(document.querySelectorAll('.page'));
const heroImage = document.querySelector('.hero-image');
const latestDownloadButton = document.querySelector('#latestDownloadButton');
const latestVersionLabel = document.querySelector('#latestVersionLabel');
const latestDateLabel = document.querySelector('#latestDateLabel');
const latestGameVersionLabel = document.querySelector('#latestGameVersionLabel');
const latestLoaderLabel = document.querySelector('#latestLoaderLabel');
const heroImages = [
  'img/2024-01-19_23.10.12.png',
  'img/2024-01-25_15.45.08.png',
  'img/2026-01-26_00.03.30.png',
  'img/Image_1784529963574_791..png',
  'img/\u5c4f\u5e55\u622a\u56fe 2023-04-30 224519.png',
];
const excludedThirdPageImage = 'img/Image_1784529963574_791..png';
const shuffledHeroImages = [...heroImages].sort(() => Math.random() - 0.5);
const assignedPageImages = [...shuffledHeroImages];
const thirdPageImageIndex = 2;

if (assignedPageImages[thirdPageImageIndex] === excludedThirdPageImage) {
  const swapIndex = assignedPageImages.findIndex((heroImagePath, imageIndex) => (
    imageIndex !== thirdPageImageIndex
    && heroImagePath !== excludedThirdPageImage
  ));

  if (swapIndex !== -1) {
    [assignedPageImages[thirdPageImageIndex], assignedPageImages[swapIndex]] = [
      assignedPageImages[swapIndex],
      assignedPageImages[thirdPageImageIndex],
    ];
  }
}

let currentPage = 0;
let locked = false;
let loadingScreen = null;

if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}

function setLineIndexes(page) {
  page.querySelectorAll('.text-line').forEach((line, lineIndex) => {
    line.style.setProperty('--line-index', lineIndex);
  });
}

pages.forEach((page, pageIndex) => {
  setLineIndexes(page);
  page.classList.toggle('is-active', pageIndex === currentPage);
});

if (heroImage && shuffledHeroImages.length > 0) {
  heroImage.src = shuffledHeroImages[0];
}

pages.slice(1, 4).forEach((page, pageIndex) => {
  const background = page.querySelector('.page-bg');
  const image = document.createElement('img');

  image.className = 'page-bg-image';
  image.alt = '';
  image.src = assignedPageImages[pageIndex + 1];
  background?.prepend(image);
});

function createLoadingScreen() {
  const screen = document.createElement('div');
  screen.className = 'loading-screen';
  screen.setAttribute('aria-live', 'polite');
  screen.textContent = '\u52a0\u8f7d\u4e2d';
  document.body.prepend(screen);
  return screen;
}

function hideLoadingScreen() {
  loadingScreen?.classList.add('is-hidden');

  window.setTimeout(() => {
    loadingScreen?.remove();
    loadingScreen = null;
  }, 350);
}

function resetToFirstPage() {
  currentPage = 0;
  pages.forEach((page, pageIndex) => {
    page.classList.remove('is-leaving');
    page.classList.toggle('is-active', pageIndex === currentPage);
  });

  window.scrollTo({
    top: 0,
    left: 0,
    behavior: 'auto',
  });
}

function formatLoaderName(loader) {
  if (!loader) {
    return '';
  }

  return loader.charAt(0).toUpperCase() + loader.slice(1);
}

async function updateLatestDownload() {
  if (!latestDownloadButton) {
    return;
  }

  try {
    const response = await fetch('https://api.modrinth.com/v2/project/tenquis-mc-directors-cut/version');

    if (!response.ok) {
      return;
    }

    const versions = await response.json();
    const latestVersion = versions.find((version) => version.version_type === 'release') ?? versions[0];
    const primaryFile = latestVersion?.files?.find((file) => file.primary) ?? latestVersion?.files?.[0];

    if (!latestVersion || !primaryFile?.url) {
      return;
    }

    latestDownloadButton.href = primaryFile.url;

    if (latestVersionLabel) {
      latestVersionLabel.textContent = latestVersion.version_number;
    }

    if (latestDateLabel) {
      latestDateLabel.textContent = new Date(latestVersion.date_published).toLocaleDateString('zh-CN').replaceAll('-', '/');
    }

    if (latestGameVersionLabel && latestVersion.game_versions?.length > 0) {
      latestGameVersionLabel.textContent = latestVersion.game_versions.join(' / ');
    }

    if (latestLoaderLabel && latestVersion.loaders?.length > 0) {
      latestLoaderLabel.textContent = latestVersion.loaders.map(formatLoaderName).join(' / ');
    }
  } catch {
    // Static fallback link remains usable when Modrinth API is unavailable.
  }
}

function goToPage(pageIndex) {
  const clampedIndex = Math.max(0, Math.min(pageIndex, pages.length - 1));

  if (locked || clampedIndex === currentPage) {
    return;
  }

  const previousPage = pages[currentPage];
  const nextPage = pages[clampedIndex];

  locked = true;
  nextPage.classList.add('is-active');
  previousPage.classList.add('is-leaving');
  previousPage.classList.remove('is-active');

  currentPage = clampedIndex;

  window.setTimeout(() => {
    previousPage.classList.remove('is-leaving');
    locked = false;
  }, 760);
}

resetToFirstPage();
updateLatestDownload();

if (!heroImage || !heroImage.complete || heroImage.naturalWidth === 0) {
  loadingScreen = createLoadingScreen();
} else {
  document.body.classList.add('is-loaded');
}

window.addEventListener('DOMContentLoaded', resetToFirstPage);

window.addEventListener('load', () => {
  resetToFirstPage();
  window.setTimeout(resetToFirstPage, 50);
  window.setTimeout(resetToFirstPage, 250);
  hideLoadingScreen();
  document.body.classList.add('is-loaded');
});

window.addEventListener('pageshow', () => {
  resetToFirstPage();
  window.setTimeout(resetToFirstPage, 0);
  window.setTimeout(resetToFirstPage, 50);
});

window.addEventListener(
  'wheel',
  (event) => {
    event.preventDefault();

    if (Math.abs(event.deltaY) < 8) {
      return;
    }

    goToPage(currentPage + (event.deltaY > 0 ? 1 : -1));
  },
  { passive: false }
);

window.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowDown' || event.key === 'PageDown' || event.key === ' ') {
    event.preventDefault();
    goToPage(currentPage + 1);
  }

  if (event.key === 'ArrowUp' || event.key === 'PageUp') {
    event.preventDefault();
    goToPage(currentPage - 1);
  }
});
