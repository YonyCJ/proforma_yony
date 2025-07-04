import {Component, OnInit} from '@angular/core';
import {DecimalPipe, NgForOf, NgIf} from '@angular/common';
import {FormsModule} from '@angular/forms';
import html2pdf from 'html2pdf.js';
import {ActivatedRoute, Router, RouterLink} from '@angular/router';
import {HttpClient} from '@angular/common/http';
import {ProformaService} from '../proforma.service';


interface Product {
  id: number;
  name: string;
  quantity: number;
  purchasePrice: number;
  imageUrl?: string | null;
  calculatedPrices: number[];
  selectedPercentageIndex?: number;
  totalPrices: number[];
}

interface Client {
  name: string;
  document: string;
  address: string;
  // phone: string;
  email: string;
}

interface Seller {
  name: string;
  document: string;
  address: string;
  // phone: string;
  email: string;
}



@Component({
  selector: 'app-proforma-new',
  imports: [
    DecimalPipe,
    FormsModule,
    NgForOf,
    NgIf,
    RouterLink
  ],
  templateUrl: './proforma-new.component.html',
  styleUrl: './proforma-new.component.css'
})
export class ProformaNewComponent implements OnInit{

  products: Product[] = [];
  newProduct = {
    name: '',
    quantity: 0,
    purchasePrice: 0
  };

  client: Client = {
    name: 'HORTIFRUT - ECUADOR S.A.',
    document: 'PICHINCHA, QUITO - CUMBAYA',
    address: '1793054722001',
    // phone: '',
    email: 'blema@hortifrut.com'
  };

  seller: Seller = {
    name: '',
    document: '',
    address: '1793054722001',
    // phone: '',
    email: ''
  };

  selectedPercentageIndex = 0;
  percentages = [1,1.05, 1.1, 1.15, 1.2, 1.25, 1.3, 1.35, 1.5];
  IVA_RATE = 0.15;
  IVA_FACTOR = 1.15;

  totalProfit = 0;
  totalInvestment = 0;
  totalSale = 0;
  transportCost: number = 0;
  transportText: string = '';
  selectedImagePreview: string | null = null;
  private selectedImageFile: File | null = null;
  isSubmitting = false;
  selectedImageName: string | null = null;

  showPreview = false;
  currentDate = new Date().toLocaleDateString('es-ES');

  validityText = '';

  // Datos de la proforma
  proformaData = {
    number: '',
    date: new Date().toLocaleDateString('en-CA'), // Fecha actual por defecto
    validityDays: 0,
    transport: 0
  };

  proformaId: string | null = null;


  constructor(private http: HttpClient,
              private route: ActivatedRoute,
              private router: Router,
              private proformaService: ProformaService) {

  }

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.proformaId = id;
        this.loadProforma(id); // ✅ Aquí sí se deben cargar los datos
      }
    });
  }


  loadProforma(id: string): void {
    this.proformaService.findById(id).subscribe({
      next: (data) => {
        // Asignar datos principales de la proforma
        this.proformaId = data.id;
        this.proformaData = {
          number: data.code,
          date: data.proformaDate,
          validityDays: data.validity,
          transport: data.costTransport
        };
        this.totalInvestment = data.inversion;
        this.totalProfit = data.total;

        // Datos del cliente (customer)
        this.client = {
          name: data.customer?.name || '',
          document: data.customer?.ruc || '',
          address: data.customer?.address || '',
          email: data.customer?.email || ''
        };

        // Datos del vendedor (seller)
        this.seller = {
          name: data.seller?.name || '',
          document: data.seller?.ruc || '',
          address: data.seller?.address || '',
          email: data.seller?.email || ''
        };

        // Productos
        this.products = (data.product || []).map((p: any) => {
          const purchasePrice = Number(p.price);
          const calculatedPrices = this.percentages.map(multiplier =>
            parseFloat((purchasePrice * (multiplier - 1)).toFixed(2))
          );

          return {
            name: p.name,
            quantity: Number(p.quantity),
            purchasePrice: purchasePrice,
            selectedPercentageIndex: Number(p.percentageIndex),
            imageUrl: p.image,
            calculatedPrices: calculatedPrices
          };
        });


      },
      error: (err) => {
        console.error('Error al cargar la proforma:', err);
      }
    });
  }



  // Al crear o cargar productos, asegúrate de que no tengan selección inicial
  initializeProducts() {
    this.products = this.products.map(product => ({
      ...product,
      selectedPercentageIndex: undefined
    }));
  }

  initializeDefaultData() {
    // Inicializar con fecha actual
    this.proformaData.date = new Date().toISOString().split('T')[0];
  }

  formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  private nextId = 1;

  addProduct() {
    if (!this.newProduct.name || this.newProduct.quantity <= 0 ||
      this.newProduct.purchasePrice <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    const product: Product = {
      id: this.nextId++,
      name: this.newProduct.name,
      quantity: this.newProduct.quantity,
      purchasePrice: this.newProduct.purchasePrice,
      imageUrl: this.selectedImagePreview,
      calculatedPrices: [],
      totalPrices: []
    };
    this.clearSelectedImage();
    // Calcular precios con diferentes porcentajes (ya incluyen IVA)
    this.percentages.forEach(percentage => {
      const priceWithPercentage = (this.newProduct.purchasePrice * percentage) * this.newProduct.quantity;
      const priceFinal = priceWithPercentage - (this.newProduct.purchasePrice * this.newProduct.quantity);
      const roundedPrice = +(priceFinal.toFixed(2));
      // console.log('Precio redondeado:', roundedPrice);

      // Calculamos el subtotal para este porcentaje
      const subtotal = roundedPrice * this.newProduct.quantity;

      product.calculatedPrices.push(roundedPrice);  // Precio unitario
      product.totalPrices.push(subtotal);          // Subtotal (precio × cantidad)
    });


    this.products.push(product);
    this.resetNewProduct();
    this.calculateProfit();
  }

  removeProduct(index: number) {
    this.products.splice(index, 1);
    this.calculateProfit();
  }

  selectPercentage(productIndex: number, percentageIndex: number) {
    // Actualizar solo el producto específico
    this.products[productIndex].selectedPercentageIndex = percentageIndex;

    // Si necesitas calcular ganancias por producto específico
    this.calculateProfitForProduct(productIndex);
    // Recalcular ganancias totales automáticamente
    this.calculateProfit();
  }

  calculateProfitForProduct(productIndex: number) {
    const product = this.products[productIndex];
    if (product.selectedPercentageIndex !== undefined) {
      // Tu lógica de cálculo de ganancia para este producto específico
      const selectedPrice = product.calculatedPrices[product.selectedPercentageIndex];
      // ... resto de tu lógica
    }
  }

  calculateProfit() {
    this.totalInvestment = 0;
    this.totalSale = 0;
    this.totalProfit = 0;

    this.products.forEach((product, index) => {
      const investment = product.purchasePrice * product.quantity;

      // Si no hay selección, usar 1% (índice 0)
      const selectedIndex = product.selectedPercentageIndex !== undefined
        ? product.selectedPercentageIndex
        : 0; // Índice 0 corresponde al 1%

      // Calcular precio de venta usando el porcentaje seleccionado
      const selectedPercentage = this.percentages[selectedIndex];
      const salePrice = product.purchasePrice * (1 + selectedPercentage);
      const sale = salePrice * product.quantity;

      this.totalInvestment += investment;
      this.totalSale += sale;
    });

    // Calcular ganancia total
    this.totalProfit = this.totalSale - this.totalInvestment;
  }


  profitWithoutIVA(): number {
    return this.totalProfit / 1.15;
  }

  getSubtotal(): number {
    return this.products.reduce((sum, product) => {
      return sum + (product.calculatedPrices[this.selectedPercentageIndex] * product.quantity);
    }, 0);
  }

  // Si necesitas el subtotal SIN IVA (opcional)
  /*getSubtotalWithoutIVA(): number {
    return this.getSubtotal() / this.IVA_FACTOR;
  }

  getIVA(): number {
    return this.getSubtotalWithoutIVA() * this.IVA_RATE;
  }

  getTotal(): number {
    return this.getSubtotalWithoutIVA() + this.getIVA();
  }*/

  previewPDF() {
    if (this.products.length === 0) {
      alert('No hay productos para mostrar en la vista previa');
      return;
    }
    this.showPreview = !this.showPreview;
  }

  private resetNewProduct() {
    this.newProduct = {
      name: '',
      quantity: 0,
      purchasePrice: 0
    };
  }


  /*generatePDF(): void {
    const element = document.querySelector('.pdf-export-only');

    if (!element) {
      console.error('Elemento para exportar no encontrado.');
      return;
    }

    const opt = {
      margin: 0.3,
      filename: `proforma_${new Date().getTime()}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
    };

    const elementRef = element as HTMLElement;
    elementRef.style.display = 'block';

    html2pdf()
      .set(opt)
      .from(elementRef)
      .toPdf()
      .get('pdf')
      .then(async (pdf: any) => {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        // Carga imagen como base64
        const imageBase64 = await this.loadImageAsBase64('assets/img/circu.png');

        const imgWidth = 4; // pulgadas (ajusta según necesites)
        const imgHeight = 4;

        const x = (pageWidth - imgWidth) / 2;
        const y = (pageHeight - imgHeight) / 2;

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);

          // Opcional: reducir opacidad
          pdf.setGState?.(new pdf.GState({ opacity: 0.1 }));

          pdf.addImage(imageBase64, 'PNG', x, y, imgWidth, imgHeight);
        }
      })
      .outputPdf('bloburl')
      .then((url: string) => {
        window.open(url, '_blank');
        elementRef.style.display = 'none';
      });
  }*/

  generatePDF(): void {
    const element = document.querySelector('.pdf-export-only') as HTMLElement;

    if (!element) {
      console.error('Elemento para exportar no encontrado.');
      return;
    }

    // Mostrar el contenido temporalmente
    element.style.display = 'block';

    // 🔄 Esperar que las imágenes del HTML estén completamente cargadas
    const images = element.querySelectorAll('img');
    const promises = Array.from(images).map((img: HTMLImageElement) => {
      return new Promise<void>((resolve) => {
        if (img.complete && img.naturalHeight !== 0) {
          resolve(); // ya cargada
        } else {
          img.onload = () => resolve();
          img.onerror = () => resolve(); // continuar aunque falle una imagen
        }
      });
    });

    Promise.all(promises).then(async () => {
      // Configuración PDF
      const number = this.proformaData?.number || '000';
      const date = this.proformaData?.date || new Date().toISOString().split('T')[0];
      const fileName = `PROFORMA N° ${number} - ${date}.pdf`;

      const opt = {
        margin: 0.3,
        filename: fileName,
        image: { type: 'jpeg', quality: 1.0 },
        html2canvas: { scale: 4, useCORS: true, scrollY: 0 }, // 👈 importante para imágenes externas
        jsPDF: { unit: 'in', format: 'a4', orientation: 'portrait' }
      };

      html2pdf()
        .set(opt)
        .from(element)
        .toPdf()
        .get('pdf')
        .then(async (pdf: any) => {
          const totalPages = pdf.internal.getNumberOfPages();
          const pageWidth = pdf.internal.pageSize.getWidth();
          const pageHeight = pdf.internal.pageSize.getHeight();

          // Marca de agua
          const imageBase64 = await this.loadImageAsBase64('assets/img/circu.png');
          const imgWidth = 4;
          const imgHeight = 4;
          const x = (pageWidth - imgWidth) / 2;
          const y = (pageHeight - imgHeight) / 2;

          for (let i = 1; i <= totalPages; i++) {
            pdf.setPage(i);
            pdf.setGState?.(new pdf.GState({ opacity: 0.1 }));
            pdf.addImage(imageBase64, 'PNG', x, y, imgWidth, imgHeight);
          }
        })
        .save()
        .then(() => {
          element.style.display = 'none';
        });
    });
  }



  loadImageAsBase64(url: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      fetch(url)
        .then(res => res.blob())
        .then(blob => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(blob);
        });
    });
  }


  updateValidityText() {
    if (!this.proformaData.validityDays || this.proformaData.validityDays <= 0) {
      this.validityText = 'Sin días de validez definidos';
      return;
    }

    // Formatear la fecha de vencimiento
    if (this.proformaData.date) {
      const validityDate = new Date(this.proformaData.date);
      validityDate.setDate(validityDate.getDate() + this.proformaData.validityDays);

      const formattedDate = validityDate.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });

      // this.validityText = `Válido por ${this.proformaData.validityDays} día(s) hasta el ${formattedDate}`;
      this.validityText = `Válido por ${this.proformaData.validityDays} días`;
    } else {
      // this.validityText = `Válido por ${this.proformaData.validityDays} día(s) a partir de la fecha de emisión`;
      this.validityText = `Válido por ${this.proformaData.validityDays} días`;
    }
  }

  // Calcular transporte
  getTransport(): number {
    return this.proformaData?.transport || 0;
  }

  updateTransportText() {
    if (!this.transportCost || this.transportCost <= 0) {
      this.transportText = 'Sin costo de transporte definido';
    } else {
      this.transportText = `Costo de transporte: $${this.transportCost.toFixed(2)}`;
    }
  }


  toUpperCaseOnly(value: string): string {
    return value.toUpperCase().replace(/[^A-Z\s]/g, ''); // Solo letras mayúsculas y espacios
  }



  updateProduct(index: number) {
    const product = this.products[index];

    // Validaciones básicas
    if (!product.name || product.name.trim() === '') {
      alert('El nombre del producto no puede estar vacío');
      return;
    }

    if (product.quantity <= 0) {
      alert('La cantidad debe ser mayor a 0');
      product.quantity = 1; // Valor por defecto
      return;
    }

    if (product.purchasePrice <= 0) {
      alert('El precio de compra debe ser mayor a 0');
      product.purchasePrice = 0.01; // Valor por defecto
      return;
    }

    // Limpiar el nombre (quitar espacios extra)
    product.name = product.name.trim();

    // Recalcular precios y ganancias para este producto
    this.recalculateProductPrices(index);

    // Recalcular totales
    this.calculateProfit();
  }

  recalculateProductPrices(index: number) {
    const product = this.products[index];

    // Limpiar arrays existentes
    product.calculatedPrices = [];
    product.totalPrices = [];

    // Recalcular ganancias con todos los porcentajes
    this.percentages.forEach(percentage => {
      // Precio de venta = precio compra * (1 + porcentaje)
      const salePrice = (product.purchasePrice * percentage) * product.quantity;
      // Ganancia unitaria = precio venta - precio compra
      const priceQuantity = product.purchasePrice * product.quantity
      const unitProfit = salePrice  - priceQuantity;
      const roundedProfit = +(unitProfit.toFixed(2));
      // console.log('Precio de venta:', salePrice);

      // Ganancia total = ganancia unitaria * cantidad
      const totalProfit = roundedProfit * product.quantity;


      product.calculatedPrices.push(roundedProfit);  // Ganancia unitaria
      product.totalPrices.push(totalProfit);         // Ganancia total
    });
  }

  // Método para detectar cambios en tiempo real (opcional)
  onProductNameChange(index: number) {
    // Solo validar longitud, no recalcular precios hasta que termine de escribir
    const product = this.products[index];
    if (product.name && product.name.length > 2000) {
      product.name = product.name.substring(0, 2000);
    }
  }

  onProductQuantityChange(index: number) {
    const product = this.products[index];

    // Validar que sea un número positivo
    if (product.quantity < 1) {
      product.quantity = 1;
    }

    // Recalcular solo si el valor es válido
    if (product.quantity > 0 && product.purchasePrice > 0) {
      this.recalculateProductPrices(index);
      this.calculateProfit();
    }
  }

  onProductPriceChange(index: number) {
    const product = this.products[index];

    // Validar que sea un precio válido
    if (product.purchasePrice < 0) {
      product.purchasePrice = 0;
    }

    // Recalcular solo si el valor es válido
    if (product.quantity > 0 && product.purchasePrice > 0) {
      this.recalculateProductPrices(index);
      this.calculateProfit();
    }
  }

// Método para formatear el precio mientras el usuario escribe
  formatPrice(index: number) {
    const product = this.products[index];
    product.purchasePrice = +product.purchasePrice.toFixed(2);
  }


  // Obtener el precio unitario de venta (sin IVA) para un producto específico
  getProductUnitPrice(product: any): number {
    // Si no hay selección, usar 1% (índice 0)
    const selectedIndex = product.selectedPercentageIndex !== undefined
      ? product.selectedPercentageIndex
      : 0;

    // Calcular precio de venta con el porcentaje seleccionado
    const selectedPercentage = this.percentages[selectedIndex];
    const salePrice = product.purchasePrice * (selectedPercentage);

    // Retornar precio sin IVA
    return salePrice / this.IVA_FACTOR;
  }


  // Obtener el total para un producto específico (sin IVA)
  getProductTotal(product: any): number {
    const unitPrice = this.getProductUnitPrice(product);
    return unitPrice * product.quantity;
  }

  // Calcular subtotal sin IVA de todos los productos
  getSubtotalWithoutIVA(): number {
    return this.products.reduce((subtotal, product) => {
      return subtotal + this.getProductTotal(product);
    }, 0);
  }

// Calcular el IVA (15%)
  getIVA(): number {
    return this.getSubtotalWithoutIVA() * 0.15;
  }

// Calcular el total con IVA
  getTotal(): number {
    return this.getSubtotalWithoutIVA() + this.getIVA() + this.getTransport();
  }

// Método alternativo si quieres mostrar el precio con IVA incluido
  getProductUnitPriceWithIVA(product: any): number {
    const selectedIndex = product.selectedPercentageIndex !== undefined
      ? product.selectedPercentageIndex
      : 0;

    const selectedPercentage = this.percentages[selectedIndex];
    return product.purchasePrice * (1 + selectedPercentage);
  }

// Método alternativo para el total con IVA incluido
  getProductTotalWithIVA(product: any): number {
    const unitPriceWithIVA = this.getProductUnitPriceWithIVA(product);
    return unitPriceWithIVA * product.quantity;
  }



  // Método para manejar la selección de imagen en el formulario de agregar producto
  onImageSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedImageFile = file;
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.selectedImagePreview = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

// Método para limpiar la imagen seleccionada
  clearSelectedImage(): void {
    this.selectedImagePreview = null;
    this.selectedImageFile = null;
  }

// Método para manejar el cambio de imagen en productos existentes
  onProductImageChange(event: any, productIndex: number): void {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.products[productIndex].imageUrl = e.target.result;
      };
      reader.readAsDataURL(file);
    }
  }

// Método para remover imagen de un producto
  removeProductImage(productIndex: number): void {
    this.products[productIndex].imageUrl = null;
  }


  // Método para abrir selector de imagen
  openImageSelector(productIndex: number): void {
    const fileInput = document.getElementById(`fileInput-${productIndex}`) as HTMLInputElement;
    if (fileInput) {
      fileInput.click();
    }
  }


  saveProforma(): void {
    this.isSubmitting = true;
    const getDiezmo = this.profitWithoutIVA() * 0.1;

    const proformaToSave = {
      code: this.proformaData.number,
      proformaDate: this.proformaData.date,
      validity: this.proformaData.validityDays,
      costTransport: Number(this.proformaData.transport.toFixed(2)),
      inversion: Number(this.totalInvestment.toFixed(2)),
      subTotal: Number(this.getSubtotalWithoutIVA().toFixed(2)),
      diezmo: Number(getDiezmo.toFixed(2)),
      iva: Number(this.getIVA().toFixed(2)),
      total: Number(this.totalProfit.toFixed(2)),
      customer: {
        name: this.client.name,
        address: this.client.address,
        ruc: this.client.document,
        email: this.client.email
      },
      seller: {
        name: this.seller.name,
        address: this.seller.address,
        ruc: this.seller.document,
        email: this.seller.email
      },
      product: this.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        price: Number(p.purchasePrice.toFixed(2)),
        percentageIndex: p.selectedPercentageIndex ?? 0,
        image: p.imageUrl
      }))
    };
    console.log("Proforma a guardar:", proformaToSave);

    this.proformaService.save(proformaToSave).subscribe({
      next: (response) => {
        console.log('Proforma guardada correctamente:', response);
        this.router.navigate(['/proformas']);
      },
      error: (err) => {
        console.error('Error al guardar la proforma:', err);
      },
      complete: () => {
        this.isSubmitting = false; // ✅ Finaliza loading sin importar si hubo éxito o error
      }
    });
  }

  updateProforma(): void {
    this.isSubmitting = true;
    const getDiezmo = this.profitWithoutIVA() * 0.1;

    const proformaToUpdate = {
      id: this.proformaId, // importante para PUT
      code: this.proformaData.number,
      proformaDate: this.proformaData.date,
      validity: this.proformaData.validityDays,
      costTransport: Number(this.proformaData.transport.toFixed(2)),
      inversion: Number(this.totalInvestment.toFixed(2)),
      subTotal: Number(this.getSubtotalWithoutIVA().toFixed(2)),
      diezmo: Number(getDiezmo.toFixed(2)),
      iva: Number(this.getIVA().toFixed(2)),
      total: Number(this.totalProfit.toFixed(2)),
      customer: {
        name: this.client.name,
        address: this.client.address,
        ruc: this.client.document,
        email: this.client.email
      },
      seller: {
        name: this.seller.name,
        address: this.seller.address,
        ruc: this.seller.document,
        email: this.seller.email
      },
      product: this.products.map(p => ({
        name: p.name,
        quantity: p.quantity,
        price: Number(p.purchasePrice.toFixed(2)),
        percentageIndex: p.selectedPercentageIndex ?? 0,
        image: p.imageUrl
      }))
    };

    this.proformaService.update(this.proformaId!, proformaToUpdate).subscribe({
      next: (response) => {
        console.log('Proforma actualizada correctamente:', response);
        this.router.navigate(['/proformas']);
      },
      error: (err) => {
        console.error('Error al actualizar la proforma:', err);
      },
      complete: () => {
        this.isSubmitting = false; // ✅ Finaliza loading sin importar si hubo éxito o error
      }
    });
  }


  submitProforma(): void {
    if (this.proformaId) {
      this.updateProforma();
    } else {
      this.saveProforma();
    }
  }






}
