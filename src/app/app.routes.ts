import { Routes } from '@angular/router';
import { authGuard } from './identity/infrastructure/guards/auth.guard';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: '/login' }, // redirige raíz a login
  {
    path: 'login',
    loadComponent: () =>
      import('./identity/presentation/views/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    loadComponent: () =>
      import('./identity/presentation/views/register/register.component').then(
        (m) => m.RegisterComponent
      ),
  },
  {
    path: 'register-bussines',
    loadComponent: () =>
      import('./identity/presentation/views/register-bussines/register-bussines.component').then(
        (m) => m.RegisterBussinesComponent
      ),
  },

  {
    path: '',
    loadComponent: () =>
      import('./shared/presentation/components/layout/layout').then((m) => m.Layout),
    canActivate: [authGuard],
    canActivateChild: [authGuard],
    children: [
      {
        path: 'help/help-center',
        loadComponent: () =>
          import('./help/presentation/views/help-center/help-center.component').then(
            (m) => m.HelpCenterComponent
          ),
        title: 'GeoPs - Help Center',
      },
      {
        path: 'help/help-center-provider',
        loadComponent: () =>
          import(
            './help/presentation/views/help-center-provider/help-center-provider.component'
          ).then((m) => m.HelpCenterProviderComponent),
        title: 'GeoPs - Help Center Provider',
      },
      {
        path: 'home',
        loadComponent: () => import('./shared/presentation/views/home/home').then((m) => m.Home),
        title: 'GeoPs - Home',
      },
      {
        path: 'ofertas',
        loadComponent: () =>
          import('./loyalty/presentation/views/ofertas/ofertas.component').then(
            (m) => m.OfertasComponent
          ),
        title: 'GeoPs - Ofertas',
      },
      {
        path: 'ofertas/:id',
        loadComponent: () =>
          import('./loyalty/presentation/views/ver-oferta/ver-oferta.component').then(
            (m) => m.VerOfertaComponent
          ),
      },
      {
        path: 'categorias',
        loadComponent: () =>
          import('./loyalty/presentation/views/categorias/categorias.component').then(
            (m) => m.CategoriasComponent
          ),
        title: 'GeoPs - Categorías',
      },
      {
        path: 'favoritos',
        loadComponent: () =>
          import('./loyalty/presentation/views/favoritos/favoritos.component').then(
            (m) => m.FavoritosComponent
          ),
        title: 'GeoPs - Favoritos',
      },
      {
        path: 'profile',
        loadComponent: () =>
          import('./identity/presentation/views/profile/profiles.component').then(
            (m) => m.ProfilesComponent
          ),
        title: 'GeoPs - Profile',
      },
      {
        path: 'settings',
        loadComponent: () =>
          import('./identity/presentation/views/settings/settings.component').then(
            (m) => m.SettingsComponent
          ),
        title: 'GeoPs - Settings',
      },
      {
        path: 'resumen',
        loadComponent: () =>
          import('./campaign/presentation/views/resumen/resumen.component').then(
            (m) => m.ResumenComponent
          ),
        title: 'GeoPs - Resumen',
      },
      {
        path: 'campañas',
        loadComponent: () =>
          import('./campaign/presentation/views/campaigns/campaigns.component').then(
            (m) => m.CampaignsComponent
          ),
        title: 'GeoPs - Campañas',
      },
      {
        path: 'crear-campañas',
        loadComponent: () =>
          import('./campaign/presentation/views/crear-campaign/crear-campaign.component').then(
            (m) => m.CrearCampaignComponent
          ),
        title: 'GeoPs - Crear Campaña',
      },
      {
        path: 'editar-campaña/:id',
        loadComponent: () =>
          import('./campaign/presentation/views/edit-campaign/edit-campaign.component').then(
            (m) => m.EditCampaignComponent
          ),
        title: 'GeoPs - Editar Campaña',
      },
      {
        path: 'ver-campaña/:id',
        loadComponent: () =>
          import('./campaign/presentation/views/view-campaign/view-campaign.component').then(
            (m) => m.ViewCampaignComponent
          ),
        title: 'GeoPs - Ver Campaña',
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./campaign/presentation/views/reportes/reportes.component').then(
            (m) => m.ReportesComponent
          ),
        title: 'GeoPs - Reportes',
      },
      {
        path: 'comentarios',
        loadComponent: () =>
          import('./reviews/presentation/views/reviews-list/reviews-list.component').then(
            (m) => m.ReviewsListComponent
          ),
        title: 'GeoPs - Comentarios',
      },
    ],
  },

  { path: '**', redirectTo: '/login' }, // cualquier otra ruta, manda a login
];
