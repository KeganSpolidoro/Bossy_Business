import { createClient } from "https://esm.sh/@supabase/supabase-js@2.42.7";

const supabaseUrl = Deno.env.get("SUPABASE_URL");
const supabaseAnonKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase URL or Anon Key not provided");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

Deno.serve(async (req) => {
  console.log("Received request:", req.method);
  try {
    if (req.method === "OPTIONS") {
      return new Response(null, { headers: corsHeaders });
    }
    let response;
    if (req.method === "POST") {
      console.log("Request headers:", Object.fromEntries(req.headers));
      const requestBody = await req.json();
      console.log("Parsed request body:", requestBody);

      if (!("type" in requestBody)) {
        return new Response(
          JSON.stringify({ error: "Invalid request: Missing type property" }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      console.log("We are here ... ", requestBody);
      const { type } = requestBody;
      const data = "data" in requestBody ? requestBody.data : undefined;

      switch (type) {
        case "createEmployee":
          if (!data) {
            response = { error: "Missing data for create operation" };
            break;
          }
          const { data: insertedEmployee, error: insertError } = await supabase
            .from("Employees")
            .insert([data])
            .select();
          response = insertError
            ? { error: insertError.message }
            : { data: insertedEmployee };
          break;

        case "getEmployees":
          const { data: employee, error: readError } = await supabase
            .from("Employees")
            .select("*");
          response = readError
            ? { error: readError.message }
            : { data: employee };
          break;

        case "updateEmployee":
          if (!data || !data.id) {
            response = { error: "Invalid data for update operation" };
            break;
          }
          const { id: updateId, ...updateData } = data;
          const { data: updatedEmployee, error: updateError } = await supabase
            .from("Employees")
            .update(updateData)
            .eq("id", updateId)
            .select();
          response = updateError
            ? { error: updateError.message }
            : { data: updatedEmployee };
          break;

        case "deleteEmployee":
          if (!data || !data.id) {
            response = { error: "Invalid data for delete operation" };
            break;
          }
          const { id: deleteId } = data;
          const { data: deletedEmployee, error: deleteError } = await supabase
            .from("Employees")
            .delete()
            .eq("id", deleteId)
            .select();
          response = deleteError
            ? { error: deleteError.message }
            : { data: deletedEmployee };
          break;

        default:
          response = { error: "Invalid operation type" };
      }

      return new Response(JSON.stringify(response), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Error processing request:", error.message);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        details: error.message,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      }
    );
  }
});
export const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Expose-Headers": "Content-Length, X-JSON",
  "Access-Control-Allow-Headers":
    "apikey,X-Client-Info, Content-Type, Authorization, Accept, Accept-Language, X-Authorization",
};
