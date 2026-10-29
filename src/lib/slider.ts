/**
 * Shared slider/scroll logic for gallery components.
 * Call initSlider() with the element prefix to wire up
 * both desktop scroll arrows and mobile swipe/tap/dots.
 */
export interface SliderOptions {
  /** Element ID prefix, e.g. "covers", "cards", "chars" */
  prefix: string;
  /** Desktop scroll step in px */
  step: number;
}

export function initSlider({ prefix, step }: SliderOptions) {
  // Desktop scroll
  const track = document.getElementById(`${prefix}-track`) as HTMLElement | null;
  const prev = document.getElementById(`${prefix}-prev`) as HTMLButtonElement | null;
  const next = document.getElementById(`${prefix}-next`) as HTMLButtonElement | null;

  if (track) {
    prev?.addEventListener('click', () => track.scrollBy({ left: -step, behavior: 'smooth' }));
    next?.addEventListener('click', () => track.scrollBy({ left: step, behavior: 'smooth' }));
  }

  // Mobile slider
  const slider = document.getElementById(`${prefix}-slider`) as HTMLElement | null;
  if (!slider) return;

  const slides = Array.from(slider.children) as HTMLElement[];
  const originalInert = slides.map(slide => slide.inert);
  const total = slides.length;
  let current = 0;
  const dots = document.querySelectorAll(`.${prefix}-dot`);

  function updateArrowPosition() {
    const image = slides[current]?.querySelector('img');
    const container = slider!.parentElement;
    if (!image || !container) return;
    const bounds = image.getBoundingClientRect();
    if (!bounds.height) return;
    container.style.setProperty('--gallery-arrow-top', `${bounds.top + bounds.height / 2 - container.getBoundingClientRect().top}px`);
  }

  function goTo(index: number) {
    if (index < 0) index = 0;
    if (index >= total) index = total - 1;
    current = index;
    slider!.style.transform = `translateX(-${current * 100}%)`;
    // Translated slides remain in the DOM; only the visible slide is interactive.
    // Inert does not affect their dimensions or the existing swipe handlers.
    slides.forEach((slide, i) => { slide.inert = originalInert[i] || i !== current; });
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    updateArrowPosition();
  }

  goTo(0);
  slider.addEventListener('load', updateArrowPosition, true);
  const resizeObserver = new ResizeObserver(updateArrowPosition);
  resizeObserver.observe(slider);

  // Compact arrow buttons
  document.getElementById(`${prefix}-mobile-prev`)?.addEventListener('click', () => goTo(current - 1));
  document.getElementById(`${prefix}-mobile-next`)?.addEventListener('click', () => goTo(current + 1));

  // Swipe support
  let startX = 0;
  let startY = 0;
  let isDragging = false;

  slider.addEventListener('touchstart', (e) => {
    startX = (e as TouchEvent).touches[0].clientX;
    startY = (e as TouchEvent).touches[0].clientY;
    isDragging = true;
  });

  slider.addEventListener('touchend', (e) => {
    if (!isDragging) return;
    isDragging = false;
    const diffX = (e as TouchEvent).changedTouches[0].clientX - startX;
    const diffY = (e as TouchEvent).changedTouches[0].clientY - startY;
    if (Math.abs(diffX) > Math.abs(diffY) && Math.abs(diffX) > 50) {
      if (diffX < 0) goTo(current + 1);
      else goTo(current - 1);
    }
  });

  dots.forEach((dot, i) => {
    dot.addEventListener('click', () => goTo(i));
  });
}
