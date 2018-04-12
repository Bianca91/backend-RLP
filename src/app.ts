import 'reflect-metadata'
import {createKoaServer} from 'routing-controllers'
import { Action, BadRequestError } from 'routing-controllers';
import { verify } from './jwt';

import OrderController from './controllers/order'
import DeliveryController from './controllers/delivery'
import LoginController from './controllers/login'
import UserController from './controllers/users'

export default createKoaServer({
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
});
