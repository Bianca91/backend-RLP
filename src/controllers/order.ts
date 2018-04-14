import {
  JsonController, Authorized, CurrentUser, Post, Param, HttpCode, NotFoundError, BadRequestError, Get,
  Body
} from 'routing-controllers'
import {Order} from '../entities/order'
import {Address} from '../entities/address'
import {Delivery} from '../entities/delivery'
import {User} from '../entities/user'

@JsonController()
export default class OrderController {

  @Authorized()
  @Post('/orders')
  @HttpCode(201)
  async createOrders(
    @Body() {order, addresses},
    @CurrentUser() {id,role}
  ) {
    if (role!=='External') throw new BadRequestError('Only client can create order')

    const user = await User.findOneById(id)
    if (!user) throw new NotFoundError('User not found')

    const date = order.orderDate || new Date()

    const delivery = await Delivery.findOneById(order.deliveryId)
    const entity =  await Order.create({...order, orderDate:date, delivery, user}).save()


    for(let i=0;i<addresses.length;i++){
       await Address.create({...addresses[i],order:entity}).save()
    }

    const orderToSend = await Order.findOneById(entity.id)
    if (!orderToSend) throw new NotFoundError('An error occured')
    return orderToSend
  }

  @Authorized()
  @Get('/orders')
  async getOrders(
    @CurrentUser() {id,role}
  ){
    if (role==='Internal') return await Order.find()
    return await Order.find({where:{userId:id}})
  }

  @Authorized()
  @Get('/orders/:id')
  async getOrder(
    @Param('id') id: number,
    @CurrentUser() currentUser
  ){
    if (currentUser.id!==id) throw new BadRequestError('You are not allowed to view that')
    const order = await Order.findOneById(id)
    if (!order) throw new NotFoundError('No such order')
    return order
  }
}
