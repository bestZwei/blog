const ATTR_DISPLAY = 'sidebar-display';
const $sidebar = document.getElementById('sidebar');
const $trigger = document.getElementById('sidebar-trigger');
const $mask = document.getElementById('mask');

const DRAG_SLOP = 10; // px of horizontal movement before the gesture is taken over
const CLOSE_RATIO = 0.35; // dismiss when dragged past this fraction of the drawer width
const FLING_VELOCITY = -0.5; // px/ms; negative means a leftward flick

class SidebarUtil {
  static #isExpanded = false;

  static get isExpanded() {
    return this.#isExpanded;
  }

  static toggle() {
    this.#isExpanded ? this.close() : this.open();
  }

  static open() {
    if (this.#isExpanded) return;
    this.#isExpanded = true;
    this.#apply();
    // Android back button / browser back closes the drawer before leaving the page
    history.pushState({ [ATTR_DISPLAY]: true }, '');
    $sidebar.querySelector('a, button')?.focus({ preventScroll: true });
  }

  static close({ viaHistory = false } = {}) {
    if (!this.#isExpanded) return;
    this.#isExpanded = false;
    this.#apply();
    $trigger.setAttribute('aria-expanded', 'false');
    $trigger.focus({ preventScroll: true });
    if (!viaHistory && history.state && history.state[ATTR_DISPLAY]) {
      history.back(); // pop the entry pushed on open; the popstate handler no-ops
    }
  }

  static #apply() {
    document.body.toggleAttribute(ATTR_DISPLAY, this.#isExpanded);
    $sidebar.classList.toggle('z-2', this.#isExpanded);
    $mask.classList.toggle('d-none', !this.#isExpanded);
    $trigger.setAttribute('aria-expanded', String(this.#isExpanded));
  }
}

function setupSwipeToClose() {
  let gesture = null;
  let suppressClick = false;

  $sidebar.addEventListener('pointerdown', (e) => {
    if (!e.isPrimary || !SidebarUtil.isExpanded) return;
    gesture = { x: e.clientX, y: e.clientY, t0: e.timeStamp, dx: 0, lastX: e.clientX, lastT: e.timeStamp, minV: 0, dragging: false };
  });

  $sidebar.addEventListener('pointermove', (e) => {
    if (!gesture) return;
    const dx = e.clientX - gesture.x;
    const dy = e.clientY - gesture.y;

    if (!gesture.dragging) {
      if (Math.abs(dx) < DRAG_SLOP || Math.abs(dx) <= Math.abs(dy)) return;
      gesture.dragging = true;
      $sidebar.style.transition = 'none'; // follow the finger 1:1
      try {
        $sidebar.setPointerCapture(e.pointerId);
      } catch {
        // pointer already released
      }
    }

    const dt = e.timeStamp - gesture.lastT;
    if (dt > 0) {
      gesture.minV = Math.min(gesture.minV, (e.clientX - gesture.lastX) / dt);
    }
    gesture.dx = Math.min(0, dx); // the drawer can only be dragged leftwards
    gesture.lastX = e.clientX;
    gesture.lastT = e.timeStamp;
    $sidebar.style.transform = `translateX(${gesture.dx}px)`;
  });

  const settle = (e) => {
    if (!gesture) return;
    const g = gesture;
    gesture = null;
    // raw displacement from the start point: a fast flick may deliver no
    // intermediate pointermove at all, so never rely on tracked moves here
    const dx = Math.min(0, e.clientX - g.x);
    if (!g.dragging && dx > -DRAG_SLOP) return;

    suppressClick = true;
    setTimeout(() => {
      suppressClick = false;
    }, 0);

    if (g.dragging) {
      $sidebar.style.transition = '';
      $sidebar.style.transform = ''; // the CSS transition takes over from the dragged offset
    }
    const overallV = dx / Math.max(1, e.timeStamp - g.t0);
    const velocity = Math.min(overallV, g.minV); // fastest segment wins, so a late flick still dismisses
    if (dx <= -$sidebar.offsetWidth * CLOSE_RATIO || velocity <= FLING_VELOCITY) {
      SidebarUtil.close();
    }
  };

  $sidebar.addEventListener('pointerup', settle);
  $sidebar.addEventListener('pointercancel', settle);

  // links and images inside the drawer are natively draggable and would
  // cancel the pointer sequence with a drag-and-drop before the gesture starts
  $sidebar.addEventListener('dragstart', (e) => e.preventDefault());

  // a drag that starts on a link must not trigger navigation on release
  $sidebar.addEventListener(
    'click',
    (e) => {
      if (suppressClick) {
        e.preventDefault();
        e.stopPropagation();
      }
    },
    true
  );
}

export function initSidebar() {
  $trigger.onclick = $mask.onclick = () => SidebarUtil.toggle();

  if (history.state && history.state[ATTR_DISPLAY]) {
    history.replaceState(null, ''); // stale marker from leaving a page with the drawer open
  }

  window.addEventListener('popstate', () => {
    if (SidebarUtil.isExpanded) SidebarUtil.close({ viaHistory: true });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && SidebarUtil.isExpanded) SidebarUtil.close();
  });

  setupSwipeToClose();
}
