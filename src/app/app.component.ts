import {Component} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {CommonModule} from '@angular/common';
import 'jspdf-autotable';
import html2pdf from 'html2pdf.js';


interface Product {
  id: number;
  name: string;
  quantity: number;
  purchasePrice: number;
  salePrice: number;
  calculatedPrices: number[];
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
  selector: 'app-root',
  imports: [CommonModule, FormsModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})

export class AppComponent {

  products: Product[] = [];
  newProduct = {
    name: '',
    quantity: 0,
    purchasePrice: 0,
    salePrice: 0
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
  totalProfitWithIVA = 0;

  showPreview = false;
  currentDate = new Date().toLocaleDateString('es-ES');

  validityText = '';

  // Datos de la proforma
  proformaData = {
    number: '',
    date: new Date().toISOString().split('T')[0], // Fecha actual por defecto
    validityDays: 0
  };

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
      this.newProduct.purchasePrice <= 0 || this.newProduct.salePrice <= 0) {
      alert('Por favor completa todos los campos correctamente');
      return;
    }

    const product: Product = {
      id: this.nextId++,
      name: this.newProduct.name,
      quantity: this.newProduct.quantity,
      purchasePrice: this.newProduct.purchasePrice,
      salePrice: this.newProduct.salePrice,
      calculatedPrices: [],
      totalPrices: []
    };

    // Calcular precios con diferentes porcentajes (ya incluyen IVA)
    this.percentages.forEach(percentage => {
      const priceWithPercentage = this.newProduct.salePrice * percentage;
      const roundedPrice = +(priceWithPercentage.toFixed(2));

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

  selectPercentage(index: number) {
    this.selectedPercentageIndex = index;
    this.calculateProfit();
  }

  calculateProfit() {
    if (this.products.length === 0) {
      this.totalProfit = 0;
      this.totalInvestment = 0;
      this.totalSale = 0;
      return;
    }

    this.totalInvestment = this.products.reduce((sum, product) =>
      sum + (product.purchasePrice * product.quantity), 0);

    this.totalSale = this.products.reduce((sum, product) =>
      sum + product.totalPrices[this.selectedPercentageIndex], 0);

    this.totalProfit = this.totalSale - this.totalInvestment;
  }


  /*profitWithoutIVA() {
    totalProfitWithIVA = ((this.calculateProfit()-this.getIVA())- (this.totalProfit/this.IVA_FACTOR));
  }*/

  // Versión modificada de profitWithoutIVA() que funciona con tu calculateProfit() actual
  profitWithoutIVA(): number {
    this.calculateProfit();
    const ivaAmount = this.totalSale - this.getIVA();
    const profitWithoutIVA = ivaAmount - (this.totalInvestment / this.IVA_FACTOR);
    return Number(profitWithoutIVA.toFixed(2)); // Retorna como número con 2 decimales
  }

  getSubtotal(): number {
    return this.products.reduce((sum, product) => {
      return sum + (product.calculatedPrices[this.selectedPercentageIndex] * product.quantity);
    }, 0);
  }

  // Si necesitas el subtotal SIN IVA (opcional)
  getSubtotalWithoutIVA(): number {
    return this.getSubtotal() / this.IVA_FACTOR;
  }

  getIVA(): number {
    return this.getSubtotalWithoutIVA() * this.IVA_RATE;
  }

  getTotal(): number {
    return this.getSubtotalWithoutIVA() + this.getIVA();
  }

  previewPDF() {
    if (this.products.length === 0) {
      alert('No hay productos para mostrar en la vista previa');
      return;
    }
    this.showPreview = !this.showPreview;
  }

  /*generatePDF() {
    if (this.products.length === 0) {
      alert('No hay productos para generar el PDF');
      return;
    }

    const doc = new jsPDF();

    // Título
    doc.setFontSize(20);
    doc.setFont('helvetica', 'bold');
    doc.text('PROFORMA', 105, 20, { align: 'center' });

    // Fecha
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Fecha: ${this.currentDate}`, 20, 35);

    // Información del cliente
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('CLIENTE:', 20, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(this.client.name || 'N/A', 20, 60);
    doc.text(this.client.document || 'N/A', 20, 70);
    doc.text(this.client.address || 'N/A', 20, 80);
    // doc.text(this.client.phone || 'N/A', 20, 90);
    doc.text(this.client.email || 'N/A', 20, 100);

    // Información del vendedor
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('VENDEDOR:', 120, 50);
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(this.seller.name || 'N/A', 120, 60);
    doc.text(this.seller.document || 'N/A', 120, 70);
    doc.text(this.seller.address || 'N/A', 120, 80);
    // doc.text(this.seller.phone || 'N/A', 120, 90);
    doc.text(this.seller.email || 'N/A', 120, 100);

    // Tabla de productos
    const tableData = this.products.map(product => [
      product.name,
      product.quantity.toString(),
      `$${product.calculatedPrices[this.selectedPercentageIndex].toFixed(2)}`,
      `$${product.totalPrices[this.selectedPercentageIndex].toFixed(2)}`
    ]);

    (doc as any).autoTable({
      head: [['Producto', 'Cantidad', 'Precio Unit.', 'Subtotal']],
      body: tableData,
      startY: 120,
      styles: {
        fontSize: 10,
        cellPadding: 5
      },
      headStyles: {
        fillColor: [52, 58, 64],
        textColor: 255,
        fontStyle: 'bold'
      }
    });

    // Totales
    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const subtotal = this.getSubtotal();
    const iva = this.getIVA();
    const total = this.getTotal();

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text(`Subtotal: $${subtotal.toFixed(2)}`, 140, finalY);
    doc.text(`IVA (15%): $${iva.toFixed(2)}`, 140, finalY + 10);
    doc.text(`Total: $${total.toFixed(2)}`, 140, finalY + 20);

    // Guardar el PDF
    doc.save(`Proforma_${this.currentDate.replace(/\//g, '-')}.pdf`);
  }*/



  private resetNewProduct() {
    this.newProduct = {
      name: '',
      quantity: 0,
      purchasePrice: 0,
      salePrice: 0
    };
  }


  generatePDF(): void {
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


  toUpperCaseOnly(value: string): string {
    return value.toUpperCase().replace(/[^A-Z\s]/g, ''); // Solo letras mayúsculas y espacios
  }





}
