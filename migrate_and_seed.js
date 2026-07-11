const { Client } = require('pg');

const dbUrl = 'postgresql://postgres:Akashthakur009%40%23@db.mbbjgmhcmvxwqtehjvlb.supabase.co:5432/postgres';

async function run() {
  const client = new Client({ connectionString: dbUrl });
  try {
    await client.connect();
    console.log('Connected to DB');

    // 1. Add session_id to sq_quotes
    try {
      await client.query('ALTER TABLE sq_quotes ADD COLUMN session_id TEXT;');
      console.log('Added session_id to sq_quotes');
    } catch (e) {
      if (e.code === '42701') console.log('session_id already exists');
      else throw e;
    }

    // 2. Clear old catalogue & suppliers
    await client.query('DELETE FROM sq_catalogue_articles;');
    await client.query('DELETE FROM sq_suppliers;');

    // 3. Insert Suppliers
    const suppliers = await client.query(`
      INSERT INTO sq_suppliers (code, name, active) VALUES
      ('NSB', 'Nussbaum', true),
      ('ST', 'Sanitas Troesch', true),
      ('GM', 'Getaz Miauton', true)
      RETURNING id, code;
    `);
    const sMap = {};
    suppliers.rows.forEach(r => sMap[r.code] = r.id);

    // 4. Insert Catalogue items
    const articles = [
      // Nussbaum (format: 81082.54)
      { supplier_id: sMap['NSB'], reference: '81082.54', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 54', unit: 'm', base_price: 24.50 },
      { supplier_id: sMap['NSB'], reference: '81082.28', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 28', unit: 'm', base_price: 12.30 },
      { supplier_id: sMap['NSB'], reference: '81082.35', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 35', unit: 'm', base_price: 16.80 },
      { supplier_id: sMap['NSB'], reference: '80022.28', name: 'Manchon coulissant à sertir inox Optipress RN 80022 Ø mm 28', unit: 'p', base_price: 14.10 },
      { supplier_id: sMap['NSB'], reference: '80000.54', name: 'Coude à sertir 90° inox femelle Optipress RN 80000 Ø mm 54', unit: 'p', base_price: 42.00 },
      { supplier_id: sMap['NSB'], reference: '80035.54', name: 'Pièce de transition à sertir inox fileté mâle 1/2" à 2" Optipress RN 80035 Ø mm 54', unit: 'p', base_price: 55.20 },
      { supplier_id: sMap['NSB'], reference: '57040.28', name: 'Pièce de transition à sertir sur tuyaux acier paroi épaisse 1/2"-2" Optipress RN 57040 Ø mm 28-1"', unit: 'p', base_price: 32.50 },
      
      // Sanitas Troesch (format: ST-426.264)
      { supplier_id: sMap['ST'], reference: 'ST-426.264.127', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 54', unit: 'm', base_price: 26.00 },
      { supplier_id: sMap['ST'], reference: 'ST-426.264.124', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 28', unit: 'm', base_price: 13.00 },
      { supplier_id: sMap['ST'], reference: 'ST-426.264.125', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 35', unit: 'm', base_price: 17.50 },
      { supplier_id: sMap['ST'], reference: 'ST-426.264.414', name: 'Manchon coulissant à sertir inox Optipress RN 80022 Ø mm 28', unit: 'p', base_price: 15.00 },
      { supplier_id: sMap['ST'], reference: 'ST-426.264.207', name: 'Coude à sertir 90° inox femelle Optipress RN 80000 Ø mm 54', unit: 'p', base_price: 45.00 },
      { supplier_id: sMap['ST'], reference: 'ST-498.332.116', name: 'Isolation PIR + PVC èpaisseur 30 mm DN mm 40', unit: 'm', base_price: 9.80 },
      { supplier_id: sMap['ST'], reference: 'ST-498.332.115', name: 'Isolation PIR + PVC èpaisseur 30 mm DN mm 32', unit: 'm', base_price: 8.50 },

      // Getaz Miauton (format: GM/498332)
      { supplier_id: sMap['GM'], reference: 'GM/426264-54', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 54', unit: 'm', base_price: 23.50 },
      { supplier_id: sMap['GM'], reference: 'GM/426264-28', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 28', unit: 'm', base_price: 11.90 },
      { supplier_id: sMap['GM'], reference: 'GM/426264-35', name: 'Tuyau acier inox 1:4521 Optipress RN 81082 Ø mm 35', unit: 'm', base_price: 15.90 },
      { supplier_id: sMap['GM'], reference: 'GM/426264-C54', name: 'Coude à sertir 90° inox femelle Optipress RN 80000 Ø mm 54', unit: 'p', base_price: 41.00 },
      { supplier_id: sMap['GM'], reference: 'GM/498332-40', name: 'Isolation PIR + PVC èpaisseur 30 mm DN mm 40', unit: 'm', base_price: 9.50 },
      { supplier_id: sMap['GM'], reference: 'GM/498332-32', name: 'Isolation PIR + PVC èpaisseur 30 mm DN mm 32', unit: 'm', base_price: 8.20 }
    ];

    for (const a of articles) {
      await client.query(
        'INSERT INTO sq_catalogue_articles (supplier_id, reference, name, unit, base_price, active) VALUES ($1, $2, $3, $4, $5, true)',
        [a.supplier_id, a.reference, a.name, a.unit, a.base_price]
      );
    }
    console.log('Seeded catalogue successfully');

  } catch (e) {
    console.error(e);
  } finally {
    await client.end();
  }
}

run();
