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

  const total = slider.children.length;
  let current = 0;
  const dots = document.querySelectorAll(`.${prefix}-dot`);

  function goTo(index: number) {
    if (index < 0) index = 0;
    if (index >= total) index = total - 1;
    current = index;
    slider!.style.transform = `translateX(-${current * 100}%)`;
    dots.forEach((d, i) => d.classList.toggle('active', i === current));
  }

  goTo(0);

  // Tap zones
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
