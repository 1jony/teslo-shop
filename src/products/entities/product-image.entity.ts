import { Column, Entity, ManyToOne, PrimaryColumn } from "typeorm";
import { Product } from "./product.entity";

@Entity()
export  class ProductImage{
    @PrimaryColumn()
    id: string;

    @Column('text')
    url: string;
    @ManyToOne(
        ()=> Product,
        ( product ) => product.images
    )
    product: Product
}