import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, ParseUUIDPipe } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { Repository } from 'typeorm';
import { PaginationDTO } from 'src/common/dtos/pagination.dto';
import {validate  as isUUID} from'uuid'


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

  async findOne(term: string) {
    let product: Product;

    if ( isUUID(term) ) {
      product = await this.ProductRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.ProductRepository.createQueryBuilder(); 
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        }).getOne();
    }


    if ( !product ) 
      throw new NotFoundException(`Product with ${ term } not found`);

    return product;
  }

  async  update(id: string, updateProductDto: UpdateProductDto) {
    const product = await this.ProductRepository.preload({
      id:id,
      ...updateProductDto
    })

  if(product){ 
    try{
      await this.ProductRepository.save(product)
    }
    catch(error){
      this.handleDbExeptions(error)
    }
  }else{
    throw new NotFoundException('Product whitch id: '+id+' not found.')
  }
    
    return `This action updates a #${product} product`;
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
