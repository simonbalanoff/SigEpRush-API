import { config } from "./config/env";
import { connectDB } from "./db";
import app from "./app";

async function main() {
    await connectDB(config.MONGODB_URI);
    app.listen(config.PORT, () => {});
}
main();
