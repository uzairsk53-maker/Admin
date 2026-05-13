import { Component, Input, OnInit, OnDestroy, ElementRef, ViewChild, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';

declare var L: any;

@Component({
  selector: 'app-map-tracker',
  template: `
    <div class="relative w-full rounded-xl overflow-hidden border border-slate-200 z-0" [ngStyle]="{'height': height}">
      <div #mapContainer class="w-full h-full bg-slate-100 flex items-center justify-center">
        <span *ngIf="!mapLoaded" class="text-sm font-medium text-slate-400">Loading map...</span>
      </div>
      
      <!-- Distance/ETA overlay -->
      <div *ngIf="distanceKm !== null" class="absolute top-2 right-2 bg-white/90 backdrop-blur px-3 py-2 rounded-lg text-xs text-slate-800 font-bold z-[400] shadow-sm flex items-center gap-2">
        <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
        {{ distanceKm | number:'1.1-2' }} km
      </div>
    </div>
  `,
  styles: [`
    .z-0 { z-index: 0; }
    .z-[400] { z-index: 400; }
    .custom-div-icon { background: transparent; border: none; }
  `]
})
export class MapTrackerComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input() height = '300px';
  @Input() startLat: number | null | undefined;
  @Input() startLng: number | null | undefined;
  @Input() endLat: number | null | undefined;
  @Input() endLng: number | null | undefined;
  
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;
  
  private map: any;
  private startMarker: any;
  private endMarker: any;
  private routeLine: any;
  mapLoaded = false;
  distanceKm: number | null = null;

  ngAfterViewInit() {
    setTimeout(() => this.initMap(), 100);
  }

  ngOnChanges(changes: SimpleChanges) {
    if (this.map && (changes['startLat'] || changes['startLng'] || changes['endLat'] || changes['endLng'])) {
      this.updateMarkers();
    }
  }

  initMap() {
    if (typeof L === 'undefined' || !this.mapContainer) return;
    this.mapLoaded = true;

    // Use default center if no coords
    const centerLat = this.startLat || this.endLat || 21.0107;
    const centerLng = this.startLng || this.endLng || 75.5679;

    this.map = L.map(this.mapContainer.nativeElement).setView([centerLat, centerLng], 13);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(this.map);
    
    this.updateMarkers();

    setTimeout(() => {
      this.map.invalidateSize();
      this.fitBounds();
    }, 500);
  }

  updateMarkers() {
    if (!this.map) return;

    // Custom Icon for Vehicle (Start)
    const startIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="flex items-center justify-center w-10 h-10 bg-indigo-600 rounded-full shadow-lg border-2 border-white text-white">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 18H3c-.6 0-1-.4-1-1V7c0-.6.4-1 1-1h10c.6 0 1 .4 1 1v11"/><path d="M14 9h4l4 4v5c0 .6-.4 1-1 1h-2"/><circle cx="7" cy="18" r="2"/><circle cx="17" cy="18" r="2"/></svg>
             </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 20]
    });

    // Custom Icon for Shop (End)
    const endIcon = L.divIcon({
      className: 'custom-div-icon',
      html: `<div class="flex items-center justify-center w-10 h-10 bg-emerald-500 rounded-full shadow-lg border-2 border-white text-white">
               <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/><path d="M22 7v3a2 2 0 0 1-2 2v0a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 16 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 12 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 8 12a2.7 2.7 0 0 1-1.59-.63.7.7 0 0 0-.82 0A2.7 2.7 0 0 1 4 12v0a2 2 0 0 1-2-2V7"/></svg>
             </div>`,
      iconSize: [40, 40],
      iconAnchor: [20, 40]
    });

    // Clean up old elements
    if (this.startMarker) this.map.removeLayer(this.startMarker);
    if (this.endMarker) this.map.removeLayer(this.endMarker);
    if (this.routeLine) this.map.removeLayer(this.routeLine);

    const hasStart = this.startLat && this.startLng;
    const hasEnd = this.endLat && this.endLng;

    if (hasStart) {
      this.startMarker = L.marker([this.startLat, this.startLng], { icon: startIcon }).addTo(this.map);
    }
    
    if (hasEnd) {
      this.endMarker = L.marker([this.endLat, this.endLng], { icon: endIcon }).addTo(this.map);
    }

    if (hasStart && hasEnd) {
      // Draw dashed line
      this.routeLine = L.polyline(
        [[this.startLat, this.startLng], [this.endLat, this.endLng]],
        { color: '#4f46e5', weight: 4, dashArray: '8, 10', opacity: 0.8 }
      ).addTo(this.map);

      // Calculate distance (Haversine formula in km)
      this.distanceKm = this.getDistanceFromLatLonInKm(
        this.startLat as number, this.startLng as number,
        this.endLat as number, this.endLng as number
      );
    } else {
      this.distanceKm = null;
    }

    this.fitBounds();
  }

  fitBounds() {
    if (!this.map) return;
    const bounds = [];
    if (this.startLat && this.startLng) bounds.push([this.startLat, this.startLng]);
    if (this.endLat && this.endLng) bounds.push([this.endLat, this.endLng]);
    
    if (bounds.length > 1) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    } else if (bounds.length === 1) {
      this.map.setView(bounds[0], 15);
    }
  }

  private getDistanceFromLatLonInKm(lat1: number, lon1: number, lat2: number, lon2: number) {
    const R = 6371; // Radius of the earth in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1); 
    const a = 
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
      Math.sin(dLon/2) * Math.sin(dLon/2)
      ; 
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
    return R * c; // Distance in km
  }

  private deg2rad(deg: number) {
    return deg * (Math.PI/180)
  }

  ngOnDestroy() {
    if (this.map) {
      this.map.remove();
    }
  }
}
