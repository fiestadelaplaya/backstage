import { supabase } from "@/utils/supabase";
import { DbError, DbErrorReason } from "./errors";
import { Controller, Gate } from "./controllers";

class GateDb {
  async changeGate(controller: Controller, gate: Gate): Promise<void> {
    console.log("controller id: ", controller.id)
    console.log("gate: ", gate)
    const { data, error } = await supabase.from("controllers").update({ gate: gate }).eq("id", controller.id).select().single();
    console.log("changeGate: ", data)
    if (error) {
      throw new DbError(DbErrorReason.UNKNOWN, "An error has occurred", error);
    }
  }
}

const gateDb = new GateDb();

export { gateDb, Gate };