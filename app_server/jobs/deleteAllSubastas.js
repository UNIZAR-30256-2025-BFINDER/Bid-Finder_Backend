const dotenv = require('dotenv');
dotenv.config();
const mongoose = require('mongoose');
const Subasta = require('../models/subasta');

async function main() {
  try {
    const uri = process.env.MONGODB_URI || process.env.MONGO_URI || process.env.MONGODB_URL;
    if (!uri) {
      console.error('No MONGODB_URI found in env. Aborting.');
      process.exit(1);
    }
    await mongoose.connect(uri);
    console.log('✅ MongoDB conectado correctamente');

    const totalBefore = await Subasta.countDocuments();
    console.log(`[DeleteAllSubastas] Documentos antes: ${totalBefore}`);

    const res = await Subasta.deleteMany({});
    console.log(`[DeleteAllSubastas] Eliminados: ${res.deletedCount} documentos de la colección subastas.`);

    const totalAfter = await Subasta.countDocuments();
    console.log(`[DeleteAllSubastas] Documentos después: ${totalAfter}`);

    try {
      if (totalAfter === 0) {
        await mongoose.connection.db.dropCollection('subastas');
        console.log('[DeleteAllSubastas] Colección `subastas` eliminada.');
      }
    } catch (e) {
      // ignore drop errors
    }

    await mongoose.disconnect();
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

main();
