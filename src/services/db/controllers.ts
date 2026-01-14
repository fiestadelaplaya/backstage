import { supabase } from "@/utils/supabase";
import { DbError, DbErrorReason } from "./errors";

enum Gate {
  S1 = "S1",
  S2 = "S2",
  S3 = "S3",
  S4 = "S4",
}

interface Controller {
  id: number;
  name: string;
  lastname: string;
  email: string;
  dni: number;
  gate: Gate;
}

class ControllerDb {
  async getController(email: string): Promise<Controller | null> {
    const { data, error } = await supabase
      .from("controllers")
      .select("id, email, users(name, lastname, dni, role), gate")
      .eq("email", email)
      .single();
    if (data) {
      console.log("data: ", data)
      return {
        id: data.id,
        name: data.users.name,
        lastname: data.users.lastname,
        email: data.email,
        dni: data.users.dni,
        gate: data.gate,
      };
    } else if (error) {
      console.error(error)
      throw new DbError(DbErrorReason.UNKNOWN, "An error has occurred", error);
    } else {
      throw new DbError(DbErrorReason.UNKNOWN, "An error has occurred");
    }
  }
}

const controllersDb = new ControllerDb();

export { controllersDb, Controller, Gate };
