import Stats from 'stats.js';

export function makeStats(container: HTMLElement) {
    const stats = new Stats();
    // 0: FPS, 1: ms, 2: mb (if supported), 3+: custom
    stats.showPanel(0);
    Object.assign(stats.dom.style, {
      position: 'absolute',
      left: '0px',
      top: '0px',
      zIndex: '1000',
    });
    container.appendChild(stats.dom);
    return stats;
  }