import { IsString } from 'class-validator'
import { JsonController, Post, Body, BadRequestError } from 'routing-controllers'
import { sign } from '../jwt'
import {User} from '../entities/user'

//const usersUrl = process.env.USERS_URL || 'http://localhost:'

class AuthenticatePayload {
  @IsString()
  email: string

  @IsString()
  password: string

}

@JsonController()
export default class LoginController {

  @Post('/logins')
  async authenticate(
    @Body() { email, password }: AuthenticatePayload
  ) {
    if(password === "") throw new BadRequestError('ERROR')
    const user = await User.findOne({ where: { email } })
    if (!user) throw new BadRequestError('Een gebruiker met deze e-mail bestaat niet')

    if (!await user.checkPassword(password)) throw new BadRequestError('Het wachtwoord is niet geldig')

    const jwt = sign({ id: user.id!, role: user.role! })
    return { jwt, id: user.id }
  }
}
