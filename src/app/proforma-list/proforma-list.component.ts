import {Component, OnInit} from '@angular/core';
import {ProformaService} from '../proforma.service';
import {PagedResult} from '../PagedResult';
import {CurrencyPipe, DatePipe, NgClass, NgForOf, NgIf} from '@angular/common';
import {Router, RouterLink} from '@angular/router';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-proforma-list',
  imports: [
    DatePipe,
    NgForOf,
    CurrencyPipe,
    RouterLink,
    NgClass,
    NgIf
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



  constructor(private proformaService: ProformaService,
              private router: Router) {}

  ngOnInit(): void {
    this.loadProformas();
  }


  loadProformas(): void {
    this.proformaService.listPage('', 0, 10).subscribe((result: PagedResult<any>) => {
      this.proformas = result.content;
    });
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




  onDelete(id: string) {
    this.idToDelete = id;
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
    localStorage.removeItem('loggedIn');// ✅ limpia sesión
    this.router.navigate(['/login']);
  }





}
