import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../infrastructure/auth/auth.service';
import { User } from '../../../domain/model/user.entity';
import { DetailsOwner } from '../../../domain/model/details-owner.entity';
import { DetailsOwnerService } from '../../../infrastructure/users/details-owner.service';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmDialogComponent } from '../../../../shared/presentation/components/confirm-dialog/confirm-dialog.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [FormsModule, MatIconModule, TranslateModule],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.css']
})
export class SettingsComponent implements OnInit {
  user: User | null = null;
  ownerDetails: DetailsOwner | null = null;

  mensaje = '';
  cargando = false;

  editState: Record<string, boolean> = {
    name: false,
    email: false,
    phone: false
  };

  constructor(
    private authService: AuthService,
    private detailsOwnerService: DetailsOwnerService,
    private dialog: MatDialog,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    this.user = this.authService.getCurrentUser();
    if (this.user?.id) {
      this.loadRoleSpecificDetails();
    }
  }

  private loadRoleSpecificDetails(): void {
    if (!this.user || this.user.role !== 'OWNER') return;

    this.cargando = true;
    this.detailsOwnerService.getByUserId(this.user.id).subscribe({
      next: (details) => {
        this.ownerDetails = details || this.createEmptyOwnerDetails();
        this.cargando = false;
      },
      error: () => {
        this.ownerDetails = this.createEmptyOwnerDetails();
        this.cargando = false;
      }
    });
  }

  private createEmptyOwnerDetails(): DetailsOwner {
    return {
      id: this.user!.id,
      userId: this.user!.id,
      businessName: '',
      taxId: ''
    } as DetailsOwner;
  }

  get isConsumer(): boolean {
    return this.user?.role === 'CONSUMER';
  }

  get isOwner(): boolean {
    return this.user?.role === 'OWNER';
  }

  get avatar(): string {
    return this.user?.name ? this.user.name.charAt(0).toUpperCase() : '';
  }

  toggleEdit(key: string): void {
    this.editState[key] = !this.editState[key];
  }

  openContactModal(): void {
    this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: this.translate.instant('settings.contact.title'),
        message: this.translate.instant('settings.contact.message'),
        confirmText: this.translate.instant('settings.contact.button')
      }
    });
  }

  guardar(): void {
    if (!this.user) return;
    this.cargando = true;
    this.mensaje = '';

    this.authService.updateUser(this.user).subscribe({
      next: (updatedUser) => {
        this.cargando = false;
        this.user = updatedUser;
        this.mensaje = 'Perfil actualizado correctamente';
        setTimeout(() => (this.mensaje = ''), 3000);
      },
      error: () => {
        this.cargando = false;
        this.mensaje = 'Error al actualizar el perfil';
        setTimeout(() => (this.mensaje = ''), 3000);
      }
    });
  }

  cancelar(): void {
    this.user = this.authService.getCurrentUser();
    this.mensaje = '';
    Object.keys(this.editState).forEach(k => (this.editState[k] = false));
    if (this.user?.id) {
      this.loadRoleSpecificDetails();
    }
  }
}
