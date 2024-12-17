import { BadRequestException, Injectable, InternalServerErrorException, Logger } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDTO } from 'src/common/dtos/pagination.dto';
import {validate  as IsUUID} from'uuid'
import { title } from 'process';


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

  findOne(term: string) {
    let producto ;
    if(IsUUID(term)){
     producto = this.ProductRepository.findOneBy({id:term})
    }else{
      const queryBuilder =  this.ProductRepository.createQueryBuilder()
      producto = queryBuilder.where('title:=title or slug :=slug', {
        title:term.toLowerCase(),
        slug:term.toLowerCase()
      }).getOne();
    }
    return producto;
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
