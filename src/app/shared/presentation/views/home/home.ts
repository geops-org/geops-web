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
import { DecimalPipe, NgForOf, NgIf } from '@angular/common';
import { AuthService } from '../../../../identity/infrastructure/auth/auth.service';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import * as L from 'leaflet';


interface CategoryMapping {
  key: string;
  label: string;
  categories: string[];
  titleKeywords: string[];
  excludeKeywords?: string[];
}

const LIMA_CENTER: [number, number] = [-12.0432, -77.0282];

@Component({
  selector: 'app-home',
  imports: [TranslatePipe, DecimalPipe, NgForOf, RouterLink, NgIf, FormsModule],
  templateUrl: './home.html',
  styleUrl: './home.css',
})
export class Home implements OnInit, AfterViewInit, OnDestroy {
  private readonly offersApi = inject(OffersApiEndpoint);
  private readonly authService = inject(AuthService);

  private currentUserId: number | null = null;
  private userId: number = 1;
  private impressionsTracked = false;
  private map: L.Map | null = null;
  private markers: L.Marker[] = [];

  mapEl = viewChild.required<ElementRef<HTMLDivElement>>('mapEl');

  private readonly DISTRICTS: Record<string, [number, number]> = {
    'san borja': [-12.0976, -76.9952],
    lince: [-12.0858, -77.0357],
    'barrio chino': [-12.0509, -77.0257],
  };

  categories: CategoryMapping[] = [
    { key: 'all', label: 'home.map.all', categories: [], titleKeywords: [] },
    {
      key: 'cinemas',
      label: 'home.map.cinemas',
      categories: ['Entretenimiento'],
      titleKeywords: ['cine', 'cinemark', 'cineplanet', 'película', 'pelicula', 'entradas'],
      excludeKeywords: ['buffet', 'park', 'jungle', 'inflable', 'kids', 'niños', 'juego'],
    },
    {
      key: 'buffets',
      label: 'home.map.buffets',
      categories: ['Gastronomía'],
      titleKeywords: ['buffet', 'almuerzo', 'cena', 'bailable'],
      excludeKeywords: ['maki', 'makis', 'sushi', 'nikkei', 'ramen'],
    },
    {
      key: 'parks',
      label: 'home.map.parks',
      categories: ['Entretenimiento'],
      titleKeywords: ['park', 'parque', 'inflable', 'jungle', 'aquatica', 'infinity'],
      excludeKeywords: ['cine', 'buffet', 'maki'],
    },
    {
      key: 'children',
      label: 'home.map.for-children',
      categories: ['Entretenimiento'],
      titleKeywords: ['kids', 'niños', 'niñ', 'playland', 'mundo kids', 'infantil', 'coney'],
      excludeKeywords: ['buffet', 'maki'],
    },
    {
      key: 'makis',
      label: 'home.map.makis',
      categories: ['Gastronomía'],
      titleKeywords: ['maki', 'makis', 'sushi', 'nikkei', 'ramen', 'shimaya', 'sakura', 'barra libre'],
      excludeKeywords: ['buffet', 'cine'],
    },
    {
      key: 'beauty',
      label: 'home.map.beauty',
      categories: ['Belleza', 'Gift Card'],
      titleKeywords: ['belleza', 'facial', 'beauty', 'kabuki', 'minna', 'dbs', 'aruma', 'skin', 'cuidado'],
      excludeKeywords: [],
    },
  ];

  selectedCategories = signal<string[]>(['all']);
  allOffers = signal<Offer[]>([]);
  highlightedOfferId = signal<number | null>(null);

  filteredDisplayOffers = computed(() => {
    const selected = this.selectedCategories();
    const offers = this.allOffers();
    if (selected.includes('all')) return offers;
    return offers.filter((offer) => selected.some((catKey) => this.offerMatchesCategory(offer, catKey)));
  });

  cinemaOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();
    if (!selected.includes('all') && !selected.includes('cinemas')) return [];
    return filtered.filter((o) => this.offerMatchesCategory(o, 'cinemas'));
  });

  buffetOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();
    if (!selected.includes('all') && !selected.includes('buffets')) return [];
    return filtered.filter((o) => this.offerMatchesCategory(o, 'buffets'));
  });

  parkOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();
    if (!selected.includes('all') && !selected.includes('parks')) return [];
    return filtered.filter((o) => this.offerMatchesCategory(o, 'parks'));
  });

  mechGamesOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();
    if (!selected.includes('all') && !selected.includes('children')) return [];
    return filtered.filter((o) => this.offerMatchesCategory(o, 'children'));
  });

  makisOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();
    if (!selected.includes('all') && !selected.includes('makis')) return [];
    return filtered.filter((o) => this.offerMatchesCategory(o, 'makis'));
  });

  beautyOffers = computed(() => {
    const filtered = this.filteredDisplayOffers();
    const selected = this.selectedCategories();
    if (!selected.includes('all') && !selected.includes('beauty')) return [];
    return filtered.filter((o) => this.offerMatchesCategory(o, 'beauty'));
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
    const user = this.authService.getCurrentUser();
    if (user) {
      this.userId = user.id;
    }
    this.currentUserId = this.authService.getCurrentUserId();
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

  isDistrict(location: string): boolean {
    const districts = [
      'Surco', 'San Miguel', 'San Borja', 'Chorrillos', 'Santa Marina', 'Trujillo',
      'Arequipa', 'Ica', 'Ate', 'Breña', 'Comas', 'Barranco', 'Los Olivos', 'Magdalena',
      'Miraflores', 'Pueblo Libre', 'San Isidro', 'Tiendas seleccionadas',
    ];
    const locationParts = location.split(',').map((part) => part.trim());
    return locationParts.some((part) => districts.includes(part));
  }

  selectCategory(catKey: string) {
    if (catKey === 'all') {
      this.selectedCategories.set(['all']);
    } else {
      const current = this.selectedCategories();
      let updated = current.filter((c) => c !== 'all');
      if (updated.includes(catKey)) {
        updated = updated.filter((c) => c !== catKey);
      } else {
        updated.push(catKey);
      }
      if (updated.length === 0) updated = ['all'];
      this.selectedCategories.set(updated);
    }
  }

  isCategoryActive(catKey: string): boolean {
    return this.selectedCategories().includes(catKey);
  }

  private offerMatchesCategory(offer: Offer, categoryKey: string): boolean {
    const category = this.categories.find((cat) => cat.key === categoryKey);
    if (!category) return false;

    const titleLower = offer.title.toLowerCase();
    const categoryLower = offer.category.toLowerCase();

    const categoryMatch = category.categories.some((cat) => categoryLower.includes(cat.toLowerCase()));
    const titleMatch = category.titleKeywords.some((keyword) => titleLower.includes(keyword.toLowerCase()));
    const hasExcludedKeyword =
      category.excludeKeywords?.some((keyword) => titleLower.includes(keyword.toLowerCase())) || false;

    return (categoryMatch || titleMatch) && !hasExcludedKeyword;
  }

  imgFor(o: Offer | null): string {
    return !o ? '' : (o.imageUrl ?? `assets/offers/${o.id}.jpg`);
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
