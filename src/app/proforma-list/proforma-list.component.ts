import {Component, OnInit} from '@angular/core';
import {ProformaService} from '../proforma.service';
import {PagedResult} from '../PagedResult';
import {CurrencyPipe, DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import {AuthService} from '../auth.service';
import {FormsModule} from '@angular/forms';

@Component({
  selector: 'app-proforma-list',
  imports: [
    DatePipe,
    NgForOf,
    CurrencyPipe,
    RouterLink,
    NgClass,
    NgIf,
    FormsModule
  ],
  templateUrl: './proforma-list.component.html',
  styleUrl: './proforma-list.component.css'
})
export class ProformaListComponent implements OnInit{

  proformas: any[] = [];
  selectedProducts: any[] = [];
  selectedProforma: any | null = null;
  zoomImageUrl: string | null = null;
  showDeleteModal = false;
  idToDelete: string | null = null;
  isDeleting = false;
  showModal = false;
  proformaSeleccionada: any = null;
  isLoading = false;

  currentPage: number = 0;
  pageSize: number = 10;
  totalItems: number = 0;
  totalPages: number = 0;
  searchTerm: string = '';

  codeSelected: string = '';



  constructor(private proformaService: ProformaService,
              private authService: AuthService,
              private router: Router) {}

  ngOnInit(): void {
    this.loadProformas();
  }


  loadProformas(): void {
    this.proformaService.listPage(this.searchTerm, this.currentPage, this.pageSize)
      .subscribe((result: any) => {
        this.proformas = result.content;
        this.totalItems = result.totalItems;
        this.totalPages = Math.ceil(this.totalItems / this.pageSize);
      });
  }

  onSearch(): void {
    this.currentPage = 0;
    this.loadProformas();
  }

  onPageSizeChange(): void {
    this.currentPage = 0;
    this.loadProformas();
  }

  goToPage(page: number): void {
    if (page >= 0 && page < this.totalPages) {
      this.currentPage = page;
      this.loadProformas();
    }
  }


  openProductsModal(products: any[], proforma: any) {
    this.selectedProducts = products;
    this.selectedProforma = proforma;
    const modal = document.getElementById('productsModal');
    if (modal) modal.classList.remove('hidden');
  }

  closeProductsModal() {
    const modal = document.getElementById('productsModal');
    if (modal) modal.classList.add('hidden');
  }

  onHoverImage(url: string) {
    this.zoomImageUrl = url;
  }

  onLeaveImage() {
    this.zoomImageUrl = null;
  }




  onDelete(id: string, code: string): void {
    this.idToDelete = id;
    this.codeSelected = code;
    this.showDeleteModal = true;
  }

  cancelDelete(): void {
    this.showDeleteModal = false;
    this.idToDelete = null;
  }

  confirmDelete(): void {
    if (!this.idToDelete) return;

    this.isDeleting = true;

    this.proformaService.delete(this.idToDelete).subscribe({
      next: () => {
        console.log('Proforma eliminada:', this.idToDelete);
        this.loadProformas(); // refresca la lista si aplica
        this.resetDeleteState();
      },
      error: (err) => {
        console.error('Error al eliminar:', err);
        this.resetDeleteState();
      }
    });
  }

  resetDeleteState(): void {
    this.isDeleting = false;
    this.showDeleteModal = false;
    this.idToDelete = null;
  }


  logout(): void {
    this.authService.logout();
  }


  openConfirmModal(proforma: any): void {
    this.proformaSeleccionada = proforma;
    this.showModal = true;
  }

  cancelModal(): void {
    this.showModal = false;
    this.proformaSeleccionada = null;
  }

  confirmChangeState(): void {
    this.isLoading = true;

    const nuevoEstado = this.proformaSeleccionada.estado === 'APROBADO'
      ? 'PENDIENTE'
      : 'APROBADO';

    this.proformaService.changeState(this.proformaSeleccionada.id, { estado: nuevoEstado }).subscribe({
      next: () => {
        this.proformaSeleccionada.estado = nuevoEstado;
        this.cancelModal();
        this.isLoading = false;
        this.loadProformas();
      },
      error: (err) => {
        console.error('Error al cambiar el estado', err);
        this.isLoading = false;
      }
    });
  }






}
