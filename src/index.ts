import 'reflect-metadata'
import { Action, BadRequestError, useKoaServer } from 'routing-controllers'
import setupDb from './db'

import { verify } from './jwt'

import * as Koa from 'koa'
import {Server} from 'http'
import * as IO from 'socket.io'
import * as socketIoJwtAuth from 'socketio-jwt-auth'
import {secret} from './jwt'

import OrderController from './controllers/order'
import DeliveryController from './controllers/delivery'
import LoginController from './controllers/login'
import UserController from './controllers/users'
import {User} from './entities/user'

const app = new Koa()
const server = new Server(app.callback())
export const io = IO(server)
const port = process.env.PORT || 4001

useKoaServer(app, {
  cors: true,
  controllers: [
    OrderController,
    DeliveryController,
    LoginController,
    UserController
  ],
  authorizationChecker: (action: Action) => {
  const header: string = action.request.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const [, token] = header.split(' ');

    try {
      return !!(token && verify(token));
    } catch (e) {
      throw new BadRequestError(e);
    }
  }
  return false;
},

currentUserChecker: async (action: Action) => {
  const header: string = action.request.headers.authorization;
  if (header && header.startsWith('Bearer ')) {
    const [, token] = header.split(' ');

    if (token) {
      const { id, role } = verify(token);
      return { id, role }
    }
  }
  return {};
}
})

io.use(socketIoJwtAuth.authenticate({ secret }, async (payload, done) => {
  const user = await User.findOneById(payload.id)
  if (user) done(null, user)
  else done(null, false, `Invalid JWT user ID`)
}))

io.on('connect', socket => {
  const name = socket.request.user.firstName
  console.log(`User ${name} just connected`)

  socket.on('room', room => {
    socket.join(room)
    console.log('join room===>', room)
  })

  socket.on('leave', room => {
    socket.leave(room)
    console.log('Leave room===>', room)
  })
  socket.on('disconnect', () => {
    console.log(`User ${name} just disconnected`)
    socket.on('room', room => {
      socket.leave(room)
    })
  })
})

const room = 'MyRoom'
io.in(room).emit('message', 'What is going on')

setupDb()
  .then(_ => {
    server.listen(port)
    console.log(`Listening on port ${port}`)
  })
  .catch(err => console.error(err))
