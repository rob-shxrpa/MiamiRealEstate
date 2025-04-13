/**
 * Controller for Miami-Dade County property data
 */
const propertyDataModel = require('../models/property-data.model');

/**
 * Get property data with pagination and filtering
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPropertyData(req, res) {
  try {
    const {
      limit = 100,
      offset = 0,
      ownerName,
      propertyAddress,
      folioNumber,
      minValue,
      maxValue,
      minYearBuilt,
      maxYearBuilt,
      zoning,
      landUse,
      minBedrooms,
      minBathrooms,
      minLivingArea,
      minLotSize,
      saleDate,
      minSaleAmount,
      maxSaleAmount
    } = req.query;

    // Parse numeric parameters
    const options = {
      limit: parseInt(limit, 10),
      offset: parseInt(offset, 10),
      ownerName,
      propertyAddress,
      folioNumber,
      minValue: minValue ? parseFloat(minValue) : undefined,
      maxValue: maxValue ? parseFloat(maxValue) : undefined,
      minYearBuilt: minYearBuilt ? parseInt(minYearBuilt, 10) : undefined,
      maxYearBuilt: maxYearBuilt ? parseInt(maxYearBuilt, 10) : undefined,
      zoning,
      landUse,
      minBedrooms: minBedrooms ? parseInt(minBedrooms, 10) : undefined,
      minBathrooms: minBathrooms ? parseFloat(minBathrooms) : undefined,
      minLivingArea: minLivingArea ? parseInt(minLivingArea, 10) : undefined,
      minLotSize: minLotSize ? parseInt(minLotSize, 10) : undefined,
      saleDate,
      minSaleAmount: minSaleAmount ? parseFloat(minSaleAmount) : undefined,
      maxSaleAmount: maxSaleAmount ? parseFloat(maxSaleAmount) : undefined
    };

    // Get data and total count in parallel
    const [data, count] = await Promise.all([
      propertyDataModel.getPropertyData(options),
      propertyDataModel.getPropertyDataCount(options)
    ]);

    // Format and transform data for client use
    const formattedData = data.map(property => ({
      id: property.folio_number,
      folioNumber: property.folio_number,
      address: property.property_address,
      city: property.property_city,
      zip: property.property_zip,
      value: {
        land: property.land_value,
        building: property.building_value,
        total: property.total_value
      },
      owner: {
        name: property.owner1 || '',
        name2: property.owner2 || '',
        mailingAddress: property.mailing_address || '',
        mailingCity: property.mailing_city || '',
        mailingState: property.mailing_state || '',
        mailingZip: property.mailing_zip || ''
      },
      zoning: property.zoning,
      landUse: property.land_use,
      features: {
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        stories: property.stories,
        units: property.units,
        yearBuilt: property.year_built,
        livingArea: property.living_sqft,
        lotSize: property.lot_size
      },
      sales: {
        lastSaleDate: property.sale_date_1,
        lastSaleAmount: property.sale_amount_1,
        lastSaleType: property.sale_type_1,
        lastSaleQualification: property.sale_qual_1
      },
      coordinates: {
        latitude: property.latitude,
        longitude: property.longitude
      }
    }));

    res.json({
      data: formattedData,
      meta: {
        total: count,
        limit: options.limit,
        offset: options.offset
      }
    });
  } catch (error) {
    console.error('Error getting property data:', error);
    res.status(500).json({ error: 'Failed to retrieve property data' });
  }
}

/**
 * Get property data by folio number
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getPropertyDataByFolio(req, res) {
  try {
    const { folioNumber } = req.params;
    
    if (!folioNumber) {
      return res.status(400).json({ error: 'Folio number is required' });
    }

    const property = await propertyDataModel.getPropertyDataByFolio(folioNumber);
    
    if (!property) {
      return res.status(404).json({ error: 'Property not found' });
    }

    // Format property data for client
    const formattedProperty = {
      id: property.folio_number,
      folioNumber: property.folio_number,
      address: property.property_address,
      city: property.property_city,
      zip: property.property_zip,
      value: {
        land: property.land_value,
        building: property.building_value,
        total: property.total_value,
        assessed: property.assessed_value
      },
      owner: {
        name: property.owner1 || '',
        name2: property.owner2 || '',
        mailingAddress: property.mailing_address || '',
        mailingCity: property.mailing_city || '',
        mailingState: property.mailing_state || '',
        mailingZip: property.mailing_zip || '',
        mailingCountry: property.mailing_country || ''
      },
      zoning: property.zoning,
      landUse: property.land_use,
      features: {
        bedrooms: property.bedrooms,
        bathrooms: property.bathrooms,
        stories: property.stories,
        units: property.units,
        yearBuilt: property.year_built,
        effectiveYearBuilt: property.effective_year_built,
        livingArea: property.living_sqft,
        actualSqft: property.actual_sqft,
        adjustedSqft: property.adjusted_sqft,
        lotSize: property.lot_size
      },
      sales: {
        sale1: {
          date: property.sale_date_1,
          amount: property.sale_amount_1,
          type: property.sale_type_1,
          qualification: property.sale_qual_1
        },
        sale2: {
          date: property.sale_date_2,
          amount: property.sale_amount_2,
          type: property.sale_type_2,
          qualification: property.sale_qual_2
        },
        sale3: {
          date: property.sale_date_3,
          amount: property.sale_amount_3,
          type: property.sale_type_3,
          qualification: property.sale_qual_3
        }
      },
      legal: {
        description: [
          property.legal1,
          property.legal2,
          property.legal3,
          property.legal4,
          property.legal5,
          property.legal6
        ].filter(Boolean).join(' '),
      },
      location: {
        latitude: property.latitude,
        longitude: property.longitude
      },
      meta: {
        imported: property.imported_at,
        updated: property.updated_at
      }
    };

    res.json(formattedProperty);
  } catch (error) {
    console.error('Error getting property data by folio:', error);
    res.status(500).json({ error: 'Failed to retrieve property data' });
  }
}

/**
 * Get zoning codes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getZoningCodes(req, res) {
  try {
    const codes = await propertyDataModel.getZoningCodes();
    res.json(codes);
  } catch (error) {
    console.error('Error getting zoning codes:', error);
    res.status(500).json({ error: 'Failed to retrieve zoning codes' });
  }
}

/**
 * Get land use codes
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
async function getLandUseCodes(req, res) {
  try {
    const codes = await propertyDataModel.getLandUseCodes();
    res.json(codes);
  } catch (error) {
    console.error('Error getting land use codes:', error);
    res.status(500).json({ error: 'Failed to retrieve land use codes' });
  }
}

module.exports = {
  getPropertyData,
  getPropertyDataByFolio,
  getZoningCodes,
  getLandUseCodes
}; 