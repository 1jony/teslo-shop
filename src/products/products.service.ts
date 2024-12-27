import { BadRequestException, Injectable, InternalServerErrorException, Logger, NotFoundException, ParseUUIDPipe } from '@nestjs/common';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Product,ProductImage } from './entities';
import { DataSource, Repository } from 'typeorm';
import { PaginationDTO } from 'src/common/dtos/pagination.dto';
import {validate  as isUUID} from'uuid'


@Injectable()
export class ProductsService {
  private readonly  logger = new Logger('Product Service');
  constructor(
    @InjectRepository(Product)
    private readonly  ProductRepository:Repository<Product>,
    @InjectRepository(ProductImage)
    private readonly ProductImageRepository: Repository<ProductImage>,
    private readonly dataSource : DataSource
  ){}
  async create(createProductDto: CreateProductDto) {
    try {
        const {images=[],... productDetail} = createProductDto;
       const product =  this.ProductRepository.create({...productDetail,
        images:images.map(image => this.ProductImageRepository.create({url:image}))
       });
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
  async findOnePlain( term: string ) {
    const { images = [], ...rest } = await this.findOne( term );
    return {
      ...rest,
      images: images.map( image => image.url )
    }
  }
  async findOne( term: string ) {

    let product: Product;

    if ( isUUID(term) ) {
      product = await this.ProductRepository.findOneBy({ id: term });
    } else {
      const queryBuilder = this.ProductRepository.createQueryBuilder('prod'); 
      product = await queryBuilder
        .where('UPPER(title) =:title or slug =:slug', {
          title: term.toUpperCase(),
          slug: term.toLowerCase(),
        })
        .leftJoinAndSelect('prod.images','prodImages')
        .getOne();
    }


    if ( !product ) 
      throw new NotFoundException(`Product with ${ term } not found`);

    return product;
  }
  async  update(id: string, updateProductDto: UpdateProductDto) {
    const {images,...toUpdate}= updateProductDto
    const product = await this.ProductRepository.preload({id,...toUpdate})

  if(!product) throw new NotFoundException('Product whitch id: '+id+' not found.')
  // Create query runner
    const QueryRunner =this.dataSource.createQueryRunner()
    await QueryRunner.connect;
    await QueryRunner.startTransaction()
    try{ 
      if(images){
        await QueryRunner.manager.delete(ProductImage,{product:{id}});
        product.images = images.map(
          image => this.ProductImageRepository.create({url:image})
        );
      }
      // await this.ProductRepository.save(product)
      await QueryRunner.manager.save(product)
      await QueryRunner.commitTransaction();
      await QueryRunner.release();
      return this.findOne(id);
    }
    catch(error){
      await QueryRunner.rollbackTransaction();
      await QueryRunner.release();
      this.handleDbExeptions(error)
    }
  
    
    return `This action updates a #${product} product`;
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await  this.ProductRepository.remove(product);
     return `This action removes a #${id} product`;
  }

  async handleRemoveAllProduct (){
    const query = await this.ProductRepository.createQueryBuilder('product');
    try{
        return await query.delete()
        .where({})
        .execute();
    }catch(error){
      this.handleDbExeptions(error)
    }
  }
  handleDbExeptions (error:any){
    if(error.code === '23505'){
      throw new BadRequestException(error.detail)
    }
    this.logger.error(error);
    throw new InternalServerErrorException('check server logs')
  }
}
