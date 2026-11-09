"use strict";

const copyButton = document.querySelector("[data-copy-qq]");
const qqNumber = copyButton.dataset.copyQq;
const copyLabel = document.querySelector(".copy-label");
const toast = document.querySelector("#copy-toast");
const copyDialog = document.querySelector("#copy-dialog");
const dialogInput = copyDialog.querySelector("input");
let toastTimeout;
let resetTimeout;

// The button's data attribute is the source of truth for copy operations.
dialogInput.value = qqNumber;
document.querySelector("#year").textContent = String(new Date().getFullYear());

function showToast(message) {
  clearTimeout(toastTimeout);
  toast.textContent = message;
  toast.classList.add("is-visible");
  toastTimeout = setTimeout(() => toast.classList.remove("is-visible"), 3200);
}

function copyWithSelection(text) {
  const input = document.createElement("textarea");
  const previousFocus = document.activeElement;
  input.value = text;
  input.setAttribute("readonly", "");
  input.setAttribute("aria-label", "待复制的 QQ 号码");
  input.style.cssText = "position:fixed;left:-9999px;top:0;font-size:16px";
  document.body.append(input);
  input.select();
  input.setSelectionRange(0, text.length);

  try {
    return document.execCommand("copy");
  } catch {
    return false;
  } finally {
    input.remove();
    previousFocus?.focus({ preventScroll: true });
  }
}

copyButton.addEventListener("click", async () => {
  // Prevent overlapping clipboard requests on repeated taps.
  if (copyButton.getAttribute("aria-busy") === "true") return;
  copyButton.setAttribute("aria-busy", "true");
  let copied = false;

  try {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(qqNumber);
        copied = true;
      } catch {
        // Browsers that deny clipboard access may still allow a selection copy.
      }
    }
    if (!copied) copied = copyWithSelection(qqNumber);
  } finally {
    copyButton.removeAttribute("aria-busy");
  }

  if (copied) {
    clearTimeout(resetTimeout);
    copyButton.classList.add("is-copied");
    copyLabel.textContent = "已复制 ✓";
    showToast("QQ 号码已复制，期待你的招呼！");
    resetTimeout = setTimeout(() => {
      copyButton.classList.remove("is-copied");
      copyLabel.replaceChildren(
        document.createTextNode("复制号码 "),
        makeCopyIcon(),
      );
    }, 3200);
    return;
  }

  copyDialog.showModal();
  dialogInput.focus();
  dialogInput.select();
});

function makeCopyIcon() {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  const use = document.createElementNS("http://www.w3.org/2000/svg", "use");
  svg.setAttribute("aria-hidden", "true");
  use.setAttribute("href", "#icon-copy");
  svg.append(use);
  return svg;
}

copyDialog.addEventListener("click", (event) => {
  if (event.target !== copyDialog) return;
  const bounds = copyDialog.getBoundingClientRect();
  if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
    copyDialog.close();
  }
});

const header = document.querySelector(".site-header");
const navLinks = Array.from(document.querySelectorAll(".nav-link"));
const sections = navLinks.map((link) => document.querySelector(link.hash));
let activeSectionId;
let navigationFrame = 0;

function updateNavigation() {
  navigationFrame = 0;
  const readingLine = header.getBoundingClientRect().bottom + 100;
  let current = sections[0];

  for (const section of sections) {
    if (section.getBoundingClientRect().top <= readingLine) current = section;
  }

  // Short final sections cannot always reach the reading line.
  const page = document.documentElement;
  if (page.scrollHeight > window.innerHeight && Math.ceil(window.scrollY + window.innerHeight) >= page.scrollHeight - 2) {
    current = sections[sections.length - 1];
  }

  if (current.id === activeSectionId) return;
  activeSectionId = current.id;
  for (const link of navLinks) {
    const active = link.hash === `#${activeSectionId}`;
    link.classList.toggle("is-active", active);
    if (active) link.setAttribute("aria-current", "location");
    else link.removeAttribute("aria-current");
  }
}

function scheduleNavigationUpdate() {
  if (!navigationFrame) navigationFrame = requestAnimationFrame(updateNavigation);
}

window.addEventListener("scroll", scheduleNavigationUpdate, { passive: true });
window.addEventListener("resize", scheduleNavigationUpdate);
window.addEventListener("pageshow", scheduleNavigationUpdate);
window.addEventListener("hashchange", scheduleNavigationUpdate);
updateNavigation();
