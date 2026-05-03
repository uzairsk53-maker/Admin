import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-icon',
  template: `
    <svg
      [attr.viewBox]="'0 0 24 24'"
      [style.width.px]="size"
      [style.height.px]="size"
      fill="none"
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="1.8"
      aria-hidden="true"
    >
      <path [attr.d]="iconPath"></path>
    </svg>
  `
})
export class IconComponent {
  @Input() name = '';
  @Input() size = 20;

  private readonly icons: Record<string, string> = {
    add:           'M12 5v14M5 12h14',
    analytics:     'M4 19h16M7 16V8M12 16V5M17 16v-6',
    arrowLeft:     'm11 17-5-5 5-5M6 12h12',
    arrowRight:    'm13 7 5 5-5 5M19 12H7',
    arrowUp:       'm7 11 5-5 5 5M12 6v12',
    arrowDown:     'm17 13-5 5-5-5M12 18V6',
    bag:           'M6 8h12l-1 11H7L6 8Zm3 0V7a3 3 0 1 1 6 0v1',
    block:         'M6.7 6.7a8 8 0 1 0 10.6 10.6M6.7 17.3 17.3 6.7',
    box:           'm12 3 8 4.5-8 4.5-8-4.5L12 3Zm8 4.5V16.5L12 21l-8-4.5V7.5M12 12v9',
    calendar:      'M8 2v3M16 2v3M3 8h18M3 6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6Z',
    check:         'M5 13l4 4L19 7',
    checkCircle:   'M9 12l2 2 4-4m6 2a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
    chevronDown:   'm6 9 6 6 6-6',
    chevronLeft:   'm15 18-6-6 6-6',
    chevronRight:  'm9 18 6-6-6-6',
    chevronUp:     'm18 15-6-6-6 6',
    close:         'M6 6l12 12M18 6 6 18',
    copy:          'M8 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-4-4H8ZM16 4v4h4M11 11v6M14 14H8',
    creditCard:    'M2 8h20M2 7a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V7Zm4 7h2',
    dashboard:     'M4 13h7V4H4v9Zm9 7h7V11h-7v9ZM4 20h7v-5H4v5Zm9-11h7V4h-7v5Z',
    delete:        'M4 7h16M9 7V4h6v3m-7 4v6m4-6v6m4-6v6M6 7l1 13h10l1-13',
    delivery:      'M3 7h11v8H3V7Zm11 3h3l3 3v2h-2a2 2 0 1 1-4 0h-2m-5 0a2 2 0 1 1-4 0',
    download:      'm4 16 4 4 4-4m0 0V4m6 8h2a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2h-2',
    edit:          'm4 20 4.5-1 9-9a2.1 2.1 0 1 0-3-3l-9 9L4 20Z',
    exclamation:   'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z',
    eye:           'M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Zm9.5 3a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z',
    eyeOff:        'M3 3l18 18M10.5 6.6A8 8 0 0 1 12 6.5C17 6.5 21 12 21 12a18 18 0 0 1-2.5 3M6.5 6.5A18 18 0 0 0 3 12s4 5.5 9 5.5a8 8 0 0 0 4.5-1.5M9 10a3 3 0 0 0 5 4.5',
    filter:        'M3 6h18M7 12h10M11 18h2',
    globe:         'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 0c2.8 0 5 4.5 5 10s-2.2 10-5 10S7 17.5 7 12 9.2 2 12 2ZM2 12h20',
    history:       'M3 3v5h5M3.1 9A9 9 0 1 0 5 5.3L3 3',
    image:         'M4 16l4-4 3 3 4-5 5 6H4Zm16-8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Zm-6-2a2 2 0 1 1 0 4 2 2 0 0 1 0-4Z',
    info:          'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2Zm0 5v1m0 4v5',
    lock:          'M7 10V8a5 5 0 1 1 10 0v2m-9 0h8a2 2 0 0 1 2 2v6H6v-6a2 2 0 0 1 2-2Z',
    logout:        'M10 17l-5-5 5-5M5 12h10M14 5h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2h-3',
    menu:          'M4 7h16M4 12h16M4 17h16',
    minus:         'M5 12h14',
    notification:  'M6 9a6 6 0 1 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9m3 11a3 3 0 0 0 6 0',
    paperclip:     'M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48',
    phone:         'M5 4h4l1 5-2.5 1.5a16 16 0 0 0 7 7L16 15l5 1v4a2 2 0 0 1-2 2A17 17 0 0 1 2 5a2 2 0 0 1 2-1Z',
    plus:          'M12 5v14M5 12h14',
    refresh:       'M4 4v5h.58M19.94 13A8 8 0 1 1 19 8.94M4 4l-.01 5h5',
    rupee:         'M7 6h10M7 10h10M9 6c0 2.5 1.5 4 4 4H7l8 8',
    save:          'M8 4v6h8V4M6 20h12a2 2 0 0 0 2-2V8l-4-4H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2Z',
    search:        'm21 21-4.3-4.3M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z',
    settings:      'M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Zm8.58-1.88 1 1.73a1 1 0 0 1-.36 1.37l-1.38.8a7 7 0 0 1-.34 1.45l.65 1.32a1 1 0 0 1-.45 1.34l-1.73 1a1 1 0 0 1-1.37-.37l-.79-1.4a7 7 0 0 1-1.5.18 7 7 0 0 1-1.5-.18l-.8 1.4a1 1 0 0 1-1.36.37l-1.73-1a1 1 0 0 1-.46-1.34l.65-1.32a7 7 0 0 1-.34-1.45l-1.38-.8a1 1 0 0 1-.36-1.37l1-1.73a1 1 0 0 1 1.37-.36l1.38.8A7 7 0 0 1 10.5 13a7 7 0 0 1 3-.18l1.38-.8a1 1 0 0 1 1.37.37Z',
    shop:          'M4 10V7l2-3h12l2 3v3a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2Zm1 2h14v8H5v-8Z',
    sort:          'M3 6h18M7 12h10M11 18h2',
    sparkle:       'M12 3l1.6 4.4L18 9l-4.4 1.6L12 15l-1.6-4.4L6 9l4.4-1.6L12 3Zm7 10 1 2.8L23 17l-3 1.2L19 21l-1-2.8L15 17l3-1.2L19 13ZM5 15l.8 2.2L8 18l-2.2.8L5 21l-.8-2.2L2 18l2.2-.8L5 15Z',
    star:          'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2Z',
    tag:           'M3 7v4a1 1 0 0 0 .29.71l8 8a1 1 0 0 0 1.42 0l4.58-4.58a1 1 0 0 0 0-1.42l-8-8A1 1 0 0 0 8 6H4a1 1 0 0 0-1 1Zm2 1a1 1 0 1 1 2 0 1 1 0 0 1-2 0Z',
    truck:         'M3 6h11l2 4 3 1v3h-3a2 2 0 1 1-4 0H9a2 2 0 1 1-4 0H3V6Z',
    upload:        'M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2M7 10l5-5 5 5M12 15V5',
    user:          'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 9a7 7 0 0 1 14 0',
    users:         'M16 19a5 5 0 0 0-8 0m12 0a4 4 0 0 0-6-3.5M4 19a4 4 0 0 1 6-3.5M15 7a3 3 0 1 1 0 6m-6-1a4 4 0 1 1 0-8 4 4 0 0 1 0 8Z',
    warning:       'M12 4 3 20h18L12 4Zm0 5v4m0 4h.01',
    xCircle:       'M12 2a10 10 0 1 0 0 20A10 10 0 0 0 12 2ZM9 9l6 6M15 9l-6 6',
    zap:           'M13 2 3 14h9l-1 8 10-12h-9l1-8Z',
  };

  get iconPath(): string {
    return this.icons[this.name] || this.icons['sparkle'];
  }
}
