import { Component, EventEmitter, Input, Output, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit } from '@angular/core';

declare var L: any;

@Component({
  selector: 'app-map-picker',
  template: `
    <div class="relative w-full rounded-xl overflow-hidden border border-slate-200 z-0" [ngStyle]="{'height': height}">
      <div #mapContainer class="w-full h-full"></div>
      <div class="absolute bottom-2 left-2 right-2 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-[10px] text-slate-600 font-medium z-[400] shadow-sm text-center">
        Tap anywhere on the map to place the location pin
      </div>
    </div>
  `,
  styles: [`
    .z-0 { z-index: 0; }
    .z-[400] { z-index: 400; }
  `]
})
export class MapPickerComponent implements AfterViewInit, OnDestroy {
  @Input() height = '250px';
  @Input() lat: number | null | undefined;
  @Input() lng: number | null | undefined;
  
  @Output() locationChange = new EventEmitter<{lat: number, lng: number}>();
  
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  private map: any;
  private marker: any;
  private defaultLat = 21.0107;
  private defaultLng = 75.5679;

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100); // Give time for view to render
  }

  initMap() {
    if (typeof L === 'undefined' || !this.mapContainer) return;
    
    const initLat = this.lat || this.defaultLat;
    const initLng = this.lng || this.defaultLng;

    this.map = L.map(this.mapContainer.nativeElement).setView([initLat, initLng], 15);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
    }).addTo(this.map);
    
    const icon = L.icon({
      iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
      iconSize: [25, 41],
      iconAnchor: [12, 41]
    });
    
    this.marker = L.marker([initLat, initLng], { icon, draggable: true }).addTo(this.map);
    
    this.marker.on('dragend', (e: any) => {
      const pos = e.target.getLatLng();
      this.locationChange.emit({ lat: pos.lat, lng: pos.lng });
    });

    this.map.on('click', (e: any) => {
      const { lat, lng } = e.latlng;
      this.marker.setLatLng([lat, lng]);
      this.locationChange.emit({ lat, lng });
    });

    // Fix map layout issue
    setTimeout(() => {
      this.map.invalidateSize();
    }, 500);
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
