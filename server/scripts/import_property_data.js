/**
 * Script to import Miami-Dade County property data from CSV file
 * 
 * Usage: node import_property_data.js
 * 
 * This script reads the MunRoll - 00 RE - All Properties.csv file and imports the data
 * into the property_data table in the database. It uses the fast-csv package
 * for CSV parsing and node-postgres for database operations.
 */

require('dotenv').config({ path: '../.env' });
const fs = require('fs');
const path = require('path');
const csv = require('fast-csv');
const { Transform } = require('stream');

// Import the database connection from the project
const db = require('../src/utils/db');

// File path
const CSV_FILE_PATH = path.resolve('../../Files/MunRoll - 00 RE - All Properties.csv');

// Prepare SQL query for insertion
const insertQuery = `
  INSERT INTO property_data (
    folio_number, property_address, property_city, property_zip, year,
    land_value, building_value, total_value, assessed_value, wvdb_value,
    hex_value, gpar_value, county_2nd_homestead, county_senior, county_long_term_senior,
    county_other_exempt, county_taxable, city_2nd_homestead, city_senior, city_long_term_senior,
    city_other_exempt, city_taxable, mill_code, land_use, zoning,
    owner1, owner2, mailing_address, mailing_city, mailing_state,
    mailing_zip, mailing_country, legal1, legal2, legal3,
    legal4, legal5, legal6, adjusted_sqft, lot_size,
    bedrooms, bathrooms, stories, units, year_built,
    effective_year_built, sale_type_1, sale_qual_1, sale_date_1, sale_amount_1,
    sale_type_2, sale_qual_2, sale_date_2, sale_amount_2, sale_type_3,
    sale_qual_3, sale_date_3, sale_amount_3, xf1, xf2,
    xf3, living_sqft, actual_sqft, cra, updated_at
  )
  VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, 
          $21, $22, $23, $24, $25, $26, $27, $28, $29, $30, $31, $32, $33, $34, $35, $36, $37, $38, $39, $40,
          $41, $42, $43, $44, $45, $46, $47, $48, $49, $50, $51, $52, $53, $54, $55, $56, $57, $58, $59, $60,
          $61, $62, $63, $64, $65)
  ON CONFLICT (folio_number) 
  DO UPDATE SET
    property_address = $2,
    property_city = $3,
    property_zip = $4,
    year = $5,
    land_value = $6,
    building_value = $7,
    total_value = $8,
    assessed_value = $9,
    wvdb_value = $10,
    hex_value = $11,
    gpar_value = $12,
    county_2nd_homestead = $13,
    county_senior = $14,
    county_long_term_senior = $15,
    county_other_exempt = $16,
    county_taxable = $17,
    city_2nd_homestead = $18,
    city_senior = $19,
    city_long_term_senior = $20,
    city_other_exempt = $21,
    city_taxable = $22,
    mill_code = $23,
    land_use = $24,
    zoning = $25,
    owner1 = $26,
    owner2 = $27,
    mailing_address = $28,
    mailing_city = $29,
    mailing_state = $30,
    mailing_zip = $31,
    mailing_country = $32,
    legal1 = $33,
    legal2 = $34,
    legal3 = $35,
    legal4 = $36,
    legal5 = $37,
    legal6 = $38,
    adjusted_sqft = $39,
    lot_size = $40,
    bedrooms = $41,
    bathrooms = $42,
    stories = $43,
    units = $44,
    year_built = $45,
    effective_year_built = $46,
    sale_type_1 = $47,
    sale_qual_1 = $48,
    sale_date_1 = $49,
    sale_amount_1 = $50,
    sale_type_2 = $51,
    sale_qual_2 = $52,
    sale_date_2 = $53,
    sale_amount_2 = $54,
    sale_type_3 = $55,
    sale_qual_3 = $56,
    sale_date_3 = $57,
    sale_amount_3 = $58,
    xf1 = $59,
    xf2 = $60,
    xf3 = $61,
    living_sqft = $62,
    actual_sqft = $63,
    cra = $64,
    updated_at = $65;
`;

// Create a transform stream to process CSV data
const transformData = new Transform({
  objectMode: true,
  transform(chunk, encoding, callback) {
    // Skip header rows
    if (chunk.Folio === 'Folio' || !chunk.Folio || chunk.Folio.startsWith('H Miami-Dade County')) {
      return callback(null);
    }

    // Clean folio number (remove quotes if any)
    const folioNumber = chunk.Folio.replace(/"/g, '');
    
    // Parse numeric values
    const parseNumeric = (value) => {
      if (!value || value === '') return null;
      // Remove non-numeric characters except for decimal point
      const cleanValue = value.replace(/[^0-9.]/g, '');
      return cleanValue === '' ? null : parseFloat(cleanValue);
    };

    // Parse date values in format MM/DD/YYYY
    const parseDate = (dateStr) => {
      if (!dateStr || dateStr === '') return null;
      
      // Check if dateStr is already a valid Date object
      if (dateStr instanceof Date && !isNaN(dateStr)) {
        return dateStr.toISOString().slice(0, 10);
      }
      
      // Try to parse date string
      const dateParts = dateStr.split('/');
      if (dateParts.length !== 3) return null;
      
      const month = parseInt(dateParts[0]);
      const day = parseInt(dateParts[1]);
      const year = parseInt(dateParts[2]);
      
      if (isNaN(month) || isNaN(day) || isNaN(year)) return null;
      
      // Create date in YYYY-MM-DD format
      const date = new Date(year, month - 1, day);
      return date.toISOString().slice(0, 10);
    };

    // Map CSV columns to database fields
    const values = [
      folioNumber,                    // folio_number
      chunk['Property Address'] || null,  // property_address
      chunk['Property City'] || null,     // property_city
      chunk[' Property Zip'] || null,     // property_zip
      parseNumeric(chunk['Year']),        // year
      parseNumeric(chunk['Land']),        // land_value
      parseNumeric(chunk['Bldg']),        // building_value
      parseNumeric(chunk['Total']),       // total_value
      parseNumeric(chunk['Assessed']),    // assessed_value
      parseNumeric(chunk['WVDB']),        // wvdb_value
      parseNumeric(chunk['HEX']),         // hex_value
      parseNumeric(chunk['GPAR']),        // gpar_value
      parseNumeric(chunk['County 2nd HEX']), // county_2nd_homestead
      parseNumeric(chunk['County Senior']),  // county_senior
      parseNumeric(chunk['County LongTermSenior']), // county_long_term_senior
      parseNumeric(chunk['County Other Exempt']),   // county_other_exempt
      parseNumeric(chunk['County Taxable']),        // county_taxable
      parseNumeric(chunk['City 2nd HEX']),          // city_2nd_homestead
      parseNumeric(chunk['City Senior']),           // city_senior
      parseNumeric(chunk['City LongTermSenior']),   // city_long_term_senior
      parseNumeric(chunk['City Other Exempt']),     // city_other_exempt
      parseNumeric(chunk['City Taxable']),          // city_taxable
      chunk['MillCode'] || null,                    // mill_code
      chunk['Land Use'] || null,                    // land_use
      chunk['Zoning'] || null,                      // zoning
      chunk['Owner1'] || null,                      // owner1
      chunk['Owner2'] || null,                      // owner2
      chunk['Mailing Address'] || null,             // mailing_address
      chunk['Mailing City'] || null,                // mailing_city
      chunk['Mailing State'] || null,               // mailing_state
      chunk['Mailing Zip'] || null,                 // mailing_zip
      chunk['Mailing Country'] || null,             // mailing_country
      chunk['Legal1'] || null,                      // legal1
      chunk['Legal2'] || null,                      // legal2
      chunk['Legal3'] || null,                      // legal3
      chunk['Legal4'] || null,                      // legal4
      chunk['Legal5'] || null,                      // legal5
      chunk['Legal6'] || null,                      // legal6
      parseNumeric(chunk['AdjustedSqFt']),          // adjusted_sqft
      parseNumeric(chunk['LotSize']),               // lot_size
      parseNumeric(chunk['Bed']),                   // bedrooms
      parseNumeric(chunk['Bath']),                  // bathrooms
      parseNumeric(chunk['Stories']),               // stories
      parseNumeric(chunk['Units']),                 // units
      parseNumeric(chunk['YearBuilt']),             // year_built
      parseNumeric(chunk['EffectiveYearBuilt']),    // effective_year_built
      chunk['Sale Type 1'] || null,                 // sale_type_1
      chunk['Sale Qual 1'] || null,                 // sale_qual_1
      parseDate(chunk['Sale Date 1']),              // sale_date_1
      parseNumeric(chunk['Sale Amt 1']),            // sale_amount_1
      chunk['Sale Type 2'] || null,                 // sale_type_2
      chunk['Sale Qual 2'] || null,                 // sale_qual_2
      parseDate(chunk['Sale Date 2']),              // sale_date_2
      parseNumeric(chunk['Sale Amt 2']),            // sale_amount_2
      chunk['Sale Type 3'] || null,                 // sale_type_3
      chunk['Sale Qual 3'] || null,                 // sale_qual_3
      parseDate(chunk['Sale Date 3']),              // sale_date_3
      parseNumeric(chunk['Sale Amt 3']),            // sale_amount_3
      chunk['XF1'] || null,                         // xf1
      chunk['XF2'] || null,                         // xf2
      chunk['XF3'] || null,                         // xf3
      parseNumeric(chunk['LivingSqFt']),            // living_sqft
      parseNumeric(chunk['ActualSqFt']),            // actual_sqft
      chunk['CRA'] || null,                         // cra
      new Date().toISOString()                      // updated_at
    ];

    callback(null, values);
  }
});

async function runImport() {
  console.log('Starting import of property data...');
  console.log(`Reading file: ${CSV_FILE_PATH}`);
  
  // Get a client from the pool
  const client = await db.getClient();
  
  try {
    // Begin transaction
    await client.query('BEGIN');
    
    let rowsProcessed = 0;
    let batchSize = 0;
    const batchLimit = 500; // Insert 500 rows at a time
    let batchValues = [];
    
    // Create read stream for CSV file
    fs.createReadStream(CSV_FILE_PATH)
      .pipe(csv.parse({ 
        headers: true, 
        trim: true,
        skipLines: 3, // Skip the disclaimer lines
        ignoreEmpty: true
      }))
      .pipe(transformData)
      .on('data', async (data) => {
        batchValues.push(data);
        batchSize++;
        
        // When batch limit is reached, insert into database
        if (batchSize >= batchLimit) {
          // Pause the stream
          transformData.pause();
          
          try {
            // Insert batch
            await Promise.all(batchValues.map(values => client.query(insertQuery, values)));
            
            rowsProcessed += batchSize;
            console.log(`Processed ${rowsProcessed} rows`);
            
            // Reset batch
            batchValues = [];
            batchSize = 0;
            
            // Resume the stream
            transformData.resume();
          } catch (err) {
            console.error('Error inserting batch:', err);
            process.exit(1);
          }
        }
      })
      .on('end', async () => {
        // Insert any remaining rows
        if (batchSize > 0) {
          try {
            await Promise.all(batchValues.map(values => client.query(insertQuery, values)));
            rowsProcessed += batchSize;
          } catch (err) {
            await client.query('ROLLBACK');
            console.error('Error inserting final batch:', err);
            process.exit(1);
          }
        }
        
        // Commit transaction
        await client.query('COMMIT');
        
        console.log(`Import completed. Total rows processed: ${rowsProcessed}`);
        
        // Calculate property coordinates using PostGIS (for records without coordinates)
        try {
          console.log('Calculating coordinates for properties...');
          await client.query(`
            UPDATE property_data
            SET 
              longitude = ST_X(ST_Centroid(geom)),
              latitude = ST_Y(ST_Centroid(geom))
            WHERE 
              geom IS NOT NULL AND 
              (longitude IS NULL OR latitude IS NULL)
          `);
          console.log('Coordinate calculation complete.');
        } catch (err) {
          console.error('Error calculating coordinates:', err);
        }
        
        console.log('Import process completed successfully.');
        process.exit(0);
      })
      .on('error', async (err) => {
        await client.query('ROLLBACK');
        console.error('Error processing CSV:', err);
        process.exit(1);
      });
      
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error during import:', err);
    process.exit(1);
  } finally {
    client.release();
  }
}

// Run the import
runImport().catch(err => {
  console.error('Unhandled error:', err);
  process.exit(1);
}); 