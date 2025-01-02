import { Injectable } from '@nestjs/common';
import { ProductsService } from 'src/products/products.service';
import { initialData } from './data/seed-data';

@Injectable()
export class SeedService {
    constructor(private readonly productsService: ProductsService) {}

  async runSeed() {
    this.insertNewProducts()
    return `This action returns all seed`;
  }
  private async  insertNewProducts (){
    this.productsService.handleRemoveAllProduct();
    const  products = initialData.products;
    const inserPromises = [];
    products.forEach(prod => 
      inserPromises.push(this.productsService.create(prod))
    )
    await  Promise.all(inserPromises);
    return true
  }
}

