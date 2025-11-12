import { config } from "./config/env.js";
import { connectDB } from "./db.js";
import { seedAdmin } from "./routes/auth.js";
import app from "./app.js";

async function main() {
    await connectDB(config.MONGODB_URI);
    await seedAdmin();
    app.listen(config.PORT, () => {});
}
main();