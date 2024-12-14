import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDTO } from 'src/common/dtos/pagination.dto';
import { skip } from 'node:test';


@Injectable()
export class ProductsService {
  private readonly  logger = new Logger('Product Service');
  constructor(
    @InjectRepository(Product)
    private readonly  ProductRepository:Repository<Product>
  ){}
  async create(createProductDto: CreateProductDto) {
    try {
       const product =  this.ProductRepository.create(createProductDto);
       await  this.ProductRepository.save(product)
       return product;
    } catch (error) {
     this.handleDbExeptions(error);
    }
  }

  async findAll(paginationDTO:PaginationDTO) {
    const {limit = 10,offset = 0} = paginationDTO;
    try {
      const product =  await this.ProductRepository.find({
        take:limit,
        skip:offset
      });
      return product
    }
    catch(error){
      this.handleDbExeptions(error)
    }
    return ""
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  update(id: number, updateProductDto: UpdateProductDto) {
    return `This action updates a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
  handleDbExeptions (error:any){
    if(error.code === '23505'){
      throw new BadRequestException(error.detail)
    }
    this.logger.error(error);
    throw new InternalServerErrorException('check server logs')
  }
}
