import { supabase } from "@/utils/supabase";
import { DbError, DbErrorReason } from "./errors";

enum Role {
  A = "A",
  B = "B",
  C = "C",
  D = "D",
  E = "E",
  P = "P",
  X = "X",
  XTEC = "X - TEC",
  CCOM = "C - COM"
}

interface Restriction {
  id: number;
  group_id: number;
  date: string;
}

interface User {
  id: number;
  name: string;
  lastname: string;
  dni: number;
  role: Role;
  group: string | null;
  restrictions: Restriction[];
  enabled: boolean;
}

interface UserId {
  id: number,
  name: string,
  lastname: string,
  dni: number,
  role: Role
}

class UserDb {
  async getUser(id: number): Promise<User | null> {
    const { data, error } = await supabase
      .from("users")
      .select("*, groups(name, restrictions(*))")
      .eq("id", id)
      .single();
    console.log("getUser: ", data)
    if (error) {
      console.error("getUser: ", error)
      throw new DbError(DbErrorReason.UNKNOWN, "An error has occurred", error);
    }
    if (!data) {
      return null
    }
    
    return {
      id: data.id,
      name: data.name,
      lastname: data.lastname,
      dni: data.dni,
      role: data.role,
      group: data.groups?.name ?? null,
      restrictions: data.groups?.restrictions ?? [],
      enabled: data.enabled,
    };
  }
}

const userDb = new UserDb();

export { userDb, User, UserId, Role, Restriction };
