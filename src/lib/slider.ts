/** Shared circular navigation for book, promotional and character galleries. */
export interface SliderOptions {
  prefix: string;
  root: HTMLElement;
}
export function initSlider({ prefix, root }: SliderOptions) {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const desktop = document.getElementById(`${prefix}-track`);
  if (desktop && !desktop.dataset.loopReady) {
    desktop.dataset.loopReady = 'true';
    const originals = Array.from(desktop.children) as HTMLElement[];
    if (originals.length > 1) {
      const copy = (slide: HTMLElement) => {
        const clone = slide.cloneNode(true) as HTMLElement;
        clone.setAttribute('aria-hidden', 'true');
        // Forward copies to the originals so lightbox groups contain no duplicates.
        const triggers = [slide, ...slide.querySelectorAll<HTMLElement>('[data-lightbox-group]')];
        const copies = [clone, ...clone.querySelectorAll<HTMLElement>('[data-lightbox-group]')];
        copies.forEach((element, i) => {
          if (!element.hasAttribute('data-lightbox-group')) return;
          element.removeAttribute('data-lightbox-group');
          element.addEventListener('click', event => {
            event.preventDefault();
            triggers[i].click();
          });
        });
        clone.tabIndex = -1;
        clone.removeAttribute('autofocus');
        clone.removeAttribute('id');
        clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
        clone.querySelectorAll<HTMLElement>('a, button, [tabindex]').forEach(el => { el.tabIndex = -1; });
        return clone;
      };
      const before = originals.map(copy);
      const after = originals.map(copy);
      desktop.prepend(...before);
      desktop.append(...after);
      let cycle = 0;
      let origin = 0;
      let slideOffsets: number[] = [];
      let copiesPerSide = 1;
      let resetting = false;
      let requestedTarget: number | null = null;
      let nativeScrolling = false;
      let pendingMeasurement = false;
      let lastWheelAt = 0;
      let timer: ReturnType<typeof setTimeout>;
      function jump(left: number) {
        resetting = true;
        const previous = desktop!.style.scrollSnapType;
        desktop!.style.scrollSnapType = 'none';
        desktop!.scrollTo({ left, behavior: 'instant' });
        requestAnimationFrame(() => {
          desktop!.style.scrollSnapType = previous;
          resetting = false;
        });
      }
      function cardPositions() {
        const children = Array.from(desktop!.children) as HTMLElement[];
        const firstOffset = children[0].offsetLeft;
        return children.map(slide => slide.offsetLeft - firstOffset);
      }
      function normalize() {
        if (!cycle || resetting) return;
        // Only arrow navigation aligns to a card. Native scrolling retains its
        // exact fractional offset, including after momentum has stopped.
        const left = requestedTarget ?? desktop!.scrollLeft;
        requestedTarget = null;
        const next = origin + ((left - origin) % cycle + cycle) % cycle;
        if (Math.abs(next - desktop!.scrollLeft) > 0.5) jump(next);
      }
      function measure(preserveOffset = false) {
        if (requestedTarget !== null || nativeScrolling) {
          pendingMeasurement = true;
          return;
        }
        // Snap to the padded content edge, rather than clipping the card by its inset.
        desktop!.style.scrollPaddingLeft = getComputedStyle(desktop!).paddingLeft;
        desktop!.style.scrollPaddingRight = getComputedStyle(desktop!).paddingRight;
        const oldCycle = cycle;
        const position = oldCycle ? ((desktop!.scrollLeft - origin) % oldCycle + oldCycle) % oldCycle : 0;
        const activeIndex = slideOffsets.reduce((nearest, offset, index) => {
          const distance = Math.min(Math.abs(offset - position), oldCycle - Math.abs(offset - position));
          const best = Math.min(Math.abs(slideOffsets[nearest] - position), oldCycle - Math.abs(slideOffsets[nearest] - position));
          return distance < best ? index : nearest;
        }, 0);
        const oldOffset = slideOffsets[activeIndex] ?? 0;
        const nextCycle = after[0].offsetLeft - originals[0].offsetLeft;
        const nextOffsets = originals.map(slide => slide.offsetLeft - originals[0].offsetLeft);
        const firstChild = desktop!.children[0] as HTMLElement;
        const nextOrigin = originals[0].offsetLeft - firstChild.offsetLeft;
        // Copies preceding the originals also change width as lazy images load.
        // The originals can keep identical dimensions while their origin moves.
        const geometryChanged = nextCycle !== cycle || nextOrigin !== origin
          || nextOffsets.some((offset, i) => offset !== slideOffsets[i]);
        // Image load notifications also arrive for identical loop copies.
        if (!geometryChanged && desktop!.clientWidth && copiesPerSide >= Math.ceil(desktop!.clientWidth / cycle) + 1) return;
        cycle = nextCycle;
        if (cycle && desktop!.clientWidth) {
          const required = Math.ceil(desktop!.clientWidth / cycle) + 1;
          while (copiesPerSide < required) {
            desktop!.prepend(...originals.map(copy));
            desktop!.append(...originals.map(copy));
            copiesPerSide++;
          }
        }
        origin = originals[0].offsetLeft - (desktop!.children[0] as HTMLElement).offsetLeft;
        slideOffsets = originals.map(slide => slide.offsetLeft - originals[0].offsetLeft);
        if (cycle && desktop!.clientWidth) {
          // Width changes after lazy loading must preserve a card, not a scroll ratio.
          jump(origin + (slideOffsets[activeIndex] ?? 0) + (preserveOffset ? position - oldOffset : 0));
        } else if (!desktop!.clientWidth) {
          cycle = 0;
          slideOffsets = [];
        }
      }
      function finishScroll() {
        clearTimeout(timer);
        if (nativeScrolling && Date.now() - lastWheelAt < 200) {
          timer = setTimeout(finishScroll, 250);
          return;
        }
        const preserveOffset = nativeScrolling;
        nativeScrolling = false;
        normalize();
        if (pendingMeasurement) {
          pendingMeasurement = false;
          measure(preserveOffset);
        }
      }
      desktop.addEventListener('wheel', () => {
        lastWheelAt = Date.now();
        nativeScrolling = true;
        if (requestedTarget !== null) {
          requestedTarget = null;
          // A user gesture takes over from an unfinished arrow animation.
          desktop!.scrollTo({ left: desktop!.scrollLeft, behavior: 'instant' });
        }
        clearTimeout(timer);
        timer = setTimeout(finishScroll, 300);
      }, { passive: true });
      desktop.addEventListener('scroll', () => {
        clearTimeout(timer);
        if (!resetting) timer = setTimeout(finishScroll, 300);
      }, { passive: true });
      desktop.addEventListener('scrollend', finishScroll);
      desktop.addEventListener('load', () => measure(), true);
      function move(direction: number) {
        if (!cycle) return;
        clearTimeout(timer);
        nativeScrolling = false;
        const left = requestedTarget ?? desktop!.scrollLeft;
        const positions = cardPositions();
        const target = direction > 0
          ? positions.find(position => position > left + 1)
          : positions.reverse().find(position => position < left - 1);
        if (target === undefined) return;
        requestedTarget = target;
        desktop!.scrollTo({ left: target, behavior: reducedMotion ? 'instant' : 'smooth' });
      }
      document.getElementById(`${prefix}-prev`)?.addEventListener('click', () => move(-1));
      document.getElementById(`${prefix}-next`)?.addEventListener('click', () => move(1));
      new ResizeObserver(() => measure()).observe(desktop);
      measure();
    }
  }

  const slider = document.getElementById(`${prefix}-slider`);
  if (!slider || slider.dataset.loopReady) return;
  slider.dataset.loopReady = 'true';
  const slides = Array.from(slider.children) as HTMLElement[];
  const total = slides.length;
  if (!total) return;
  const inertState = slides.map(slide => slide.inert);
  const dots = Array.from(root.querySelectorAll<HTMLElement>('.gallery-dot'));
  const loop = total > 1;
  if (loop) {
    for (const [slide, prepend] of [[slides[total - 1], true], [slides[0], false]] as const) {
      const clone = slide.cloneNode(true) as HTMLElement;
      clone.inert = true;
      clone.removeAttribute('data-lightbox-group');
      clone.querySelectorAll('[data-lightbox-group]').forEach(el => el.removeAttribute('data-lightbox-group'));
      clone.setAttribute('aria-hidden', 'true');
      clone.removeAttribute('id');
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      if (prepend) slider.prepend(clone); else slider.append(clone);
    }
  }
  let current = 0;
  let moving = false;
  let fallback: ReturnType<typeof setTimeout>;
  function position(index: number, animate: boolean) {
    slider!.style.transition = animate && !reducedMotion ? 'transform 300ms ease' : 'none';
    slider!.style.transform = `translateX(-${index * 100}%)`;
  }
  function update() {
    slides.forEach((slide, i) => { slide.inert = inertState[i] || i !== current; });
    dots.forEach((dot, i) => {
      dot.classList.toggle('active', i === current);
      if (i === current) dot.setAttribute('aria-current', 'true');
      else dot.removeAttribute('aria-current');
    });
    const image = slides[current].querySelector('img');
    const container = slider!.parentElement;
    if (image && container) {
      const bounds = image.getBoundingClientRect();
      if (bounds.height) container.style.setProperty('--gallery-arrow-top', `${bounds.top + bounds.height / 2 - container.getBoundingClientRect().top}px`);
    }
  }
  function settle() {
    if (!moving) return;
    clearTimeout(fallback);
    position(current + (loop ? 1 : 0), false);
    moving = false;
    update();
  }
  function goTo(index: number) {
    if (moving || !loop) return;
    const physical = index + 1;
    current = (index % total + total) % total;
    moving = true;
    position(physical, true);
    update();
    if (reducedMotion) settle();
    else fallback = setTimeout(settle, 380);
  }
  slider.addEventListener('transitionend', event => { if (event.target === slider && event.propertyName === 'transform') settle(); });
  slider.addEventListener('load', update, true);
  new ResizeObserver(() => { settle(); update(); }).observe(slider);
  document.getElementById(`${prefix}-mobile-prev`)?.addEventListener('click', () => goTo(current - 1));
  document.getElementById(`${prefix}-mobile-next`)?.addEventListener('click', () => goTo(current + 1));
  dots.forEach((dot, i) => dot.addEventListener('click', () => goTo(i)));
  let start: { x: number; y: number } | null = null;
  slider.addEventListener('touchstart', event => {
    start = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
  }, { passive: true });
  slider.addEventListener('touchcancel', () => { start = null; });
  slider.addEventListener('touchend', event => {
    if (!start || !event.changedTouches.length) return;
    const dx = event.changedTouches[0].clientX - start.x;
    const dy = event.changedTouches[0].clientY - start.y;
    start = null;
    if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) goTo(current + (dx < 0 ? 1 : -1));
  }, { passive: true });
  position(current + (loop ? 1 : 0), false);
  update();
}
