import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../Services/supabase.service';

@Component({
  selector: 'app-productos',
  standalone: true,    
  imports: [CommonModule], 
  templateUrl: './productos.html',
  styleUrls: ['./productos.css']
})
export class ProductosComponent implements OnInit {
  productos: any[] = [];

  constructor(private supabase: SupabaseService) {}

  async ngOnInit() {
    const { data, error } = await this.supabase.getProductos();
    if (error) {
      console.error(error);
    } else {
      this.productos = data ?? [];
    }
  }
}
