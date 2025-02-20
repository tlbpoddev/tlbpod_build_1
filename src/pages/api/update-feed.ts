import { exec } from "child_process";

export async function GET() {
  return new Promise((resolve) => {
    exec("node scripts/sync-buzzsprout.js", (error, stdout, stderr) => {
      if (error) {
        console.error("Error executing script:", stderr);
        resolve(new Response("Error fetching episodes", { status: 500 }));
      } else {
        console.log("Buzzsprout sync completed:", stdout);
        resolve(new Response("Buzzsprout episodes updated!", { status: 200 }));
      }
    });
  });
}
