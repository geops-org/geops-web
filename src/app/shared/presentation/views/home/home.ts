import {
  AfterViewInit,
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  computed,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Offer } from '../../../../loyalty/domain/model/offer.entity';
import { OffersApiEndpoint } from '../../../../loyalty/infrastructure/offers/offers-api-endpoint';
import { DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import * as L from 'leaflet';


const LIMA_CENTER: [number, number] = [-12.0432, -77.0282];

@Component({
  selector: 'app-home',
  imports: [TranslatePipe, DecimalPipe, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  private readonly offersApi = inject(OffersApiEndpoint);

  private impressionsTracked = false;
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');

  private readonly DISTRICTS: Record<string, [number, number]> = {
    'san borja': [-12.0976, -76.9952],
    lince: [-12.0858, -77.0357],
    'barrio chino': [-12.0509, -77.0257],
  };

  selectedDistricts = signal<string[]>(['all']);
  allOffers = signal<Offer[]>([]);
  highlightedOfferId = signal<number | null>(null);

  filteredDisplayOffers = computed(() => {
    const selected = this.selectedDistricts();
    const offers = this.allOffers();
    if (selected.includes('all')) return offers;
    return offers.filter((o) => {
      const coords = this.resolveCoords(o.location);
      return selected.some((districtKey) => {
        const dc = this.DISTRICTS[districtKey];
        return dc !== undefined && coords[0] === dc[0] && coords[1] === dc[1];
      });
    });
  });

  constructor() {
    effect(() => {
      const offers = this.filteredDisplayOffers();
      if (this.map) {
        this.updateMarkers(offers);
      }
    });
  }

  ngOnInit(): void {
    this.loadAllOffers();
  }

  ngAfterViewInit(): void {
    L.Icon.Default.imagePath = '';
    L.Icon.Default.mergeOptions({
      iconUrl:       'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
      iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
      shadowUrl:     'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    });
    this.map = L.map(this.mapEl().nativeElement).setView(LIMA_CENTER, 13);
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.map);
    this.updateMarkers(this.filteredDisplayOffers());
  }

  ngOnDestroy(): void {
    this.map?.remove();
    this.map = null;
  }

  private normalize(s: string): string {
    return s.normalize('NFD').replace(/\p{Mn}/gu, '').toLowerCase();
  }

  private resolveCoords(location: string): [number, number] {
    const norm = this.normalize(location);
    for (const [key, coords] of Object.entries(this.DISTRICTS)) {
      if (norm.includes(key)) return coords;
    }
    return LIMA_CENTER;
  }

  private updateMarkers(offers: Offer[]): void {
    this.markers.forEach((m) => m.remove());
    this.markers = [];

    offers.forEach((offer) => {
      const coords = this.resolveCoords(offer.location);
      const marker = L.marker(coords)
        .addTo(this.map!)
        .bindPopup(
          `<strong>${offer.title}</strong><br>` +
            `<span style="color:#A751D4">${offer.partner}</span><br>` +
            `📍 ${offer.location}<br>` +
            `<strong>S/ ${offer.price.toFixed(2)}</strong>`,
        );

      marker.on('click', () => {
        this.highlightedOfferId.set(offer.id);
        const el = document.getElementById(`offer-card-${offer.id}`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });

      this.markers.push(marker);
    });
  }

  selectDistrict(districtKey: string): void {
    if (districtKey === 'all') {
      this.selectedDistricts.set(['all']);
      return;
    }
    const current = this.selectedDistricts().filter((k) => k !== 'all');
    const idx = current.indexOf(districtKey);
    const next = idx >= 0 ? current.filter((k) => k !== districtKey) : [...current, districtKey];
    this.selectedDistricts.set(next.length === 0 ? ['all'] : next);
  }

  isDistrictActive(districtKey: string): boolean {
    return this.selectedDistricts().includes(districtKey);
  }

  onViewOffer(offer: Offer) {
    this.offersApi.recordCampaignClick(offer.campaignId);
  }

  private loadAllOffers() {
    this.offersApi.getAll().subscribe({
      next: (offers) => {
        this.allOffers.set(offers);
        this.trackFirstImpressions(offers);
        if (this.map) {
          this.updateMarkers(this.filteredDisplayOffers());
        }
      },
      error: (err) => {
        console.error('[Home] Error loading offers:', err);
      },
    });
  }

  private trackFirstImpressions(offers: Offer[]): void {
    if (this.impressionsTracked || !offers.length) return;
    const campaignIds = this.extractCampaignIds(offers);
    if (campaignIds.length) {
      this.offersApi.recordCampaignImpressions(campaignIds);
      this.impressionsTracked = true;
    }
  }

  private extractCampaignIds(offers: Offer[]): number[] {
    const unique = new Set<number>();
    offers.forEach((offer) => {
      if (typeof offer.campaignId === 'number' && offer.campaignId > 0) {
        unique.add(offer.campaignId);
      }
    });
    return Array.from(unique);
  }
}
