import { Gate } from "./db/controllers"
import { Role, User } from "./db/users"

export function access(user: User, gate: Gate): boolean {
  switch (user.role) {
    case Role.A:
    case Role.X:
    case Role.XTEC:
      return true
    case Role.B:
      return gate === Gate.S1 || gate === Gate.S3;
    case Role.C:
    case Role.D:
    case Role.E:
      return gate === Gate.S1;
    case Role.P:
      return gate === Gate.S1 || gate === Gate.S2;
    default:
      return false;
  }
}