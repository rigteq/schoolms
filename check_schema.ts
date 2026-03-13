import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";
import { resolve } from "path";

dotenv.config({ path: ".env.local" });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

async function run() {
    console.log("Checking students_data schema...");
    const { data, error } = await supabase.from('students_data').select('*').limit(1);
    console.log("Select result:", { data, error });
}
run();
