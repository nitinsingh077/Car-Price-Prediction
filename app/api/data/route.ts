import { NextResponse } from 'next/server';
import { parseCSV, type CarData } from '@/lib/ml-model';
import {
  getAllCarData,
  addCarData,
  addCarDataBatch,
  getAdditionalDataCount,
  clearAdditionalData,
  carDataCSV,
} from '@/lib/data-store';

// GET /api/data - Get all car data with filtering and pagination
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const fuelType = searchParams.get('fuelType');
    const transmission = searchParams.get('transmission');
    const sellerType = searchParams.get('sellerType');
    const minYear = searchParams.get('minYear');
    const maxYear = searchParams.get('maxYear');
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    const search = searchParams.get('search');
    
    let data = getAllCarData();
    
    // Apply filters
    if (fuelType) {
      data = data.filter(car => car.Fuel_Type.toLowerCase() === fuelType.toLowerCase());
    }
    if (transmission) {
      data = data.filter(car => car.Transmission.toLowerCase() === transmission.toLowerCase());
    }
    if (sellerType) {
      data = data.filter(car => car.Selling_type.toLowerCase() === sellerType.toLowerCase());
    }
    if (minYear) {
      data = data.filter(car => car.Year >= parseInt(minYear));
    }
    if (maxYear) {
      data = data.filter(car => car.Year <= parseInt(maxYear));
    }
    if (minPrice) {
      data = data.filter(car => car.Selling_Price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      data = data.filter(car => car.Selling_Price <= parseFloat(maxPrice));
    }
    if (search) {
      const searchLower = search.toLowerCase();
      data = data.filter(car => 
        car.Car_Name.toLowerCase().includes(searchLower)
      );
    }
    
    // Pagination
    const totalRecords = data.length;
    const totalPages = Math.ceil(totalRecords / limit);
    const startIndex = (page - 1) * limit;
    const paginatedData = data.slice(startIndex, startIndex + limit);
    
    return NextResponse.json({
      success: true,
      data: paginatedData,
      pagination: {
        page,
        limit,
        totalRecords,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
      },
      meta: {
        originalRecords: parseCSV(carDataCSV).length,
        additionalRecords: getAdditionalDataCount(),
      },
    });
  } catch (error) {
    console.error('Data fetch error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch data' },
      { status: 500 }
    );
  }
}

// POST /api/data - Add new car data
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action, car, cars } = body;
    
    if (action === 'add' && car) {
      // Validate car data
      const validationError = validateCarData(car);
      if (validationError) {
        return NextResponse.json(
          { success: false, error: validationError },
          { status: 400 }
        );
      }
      
      addCarData(car as CarData);
      
      return NextResponse.json({
        success: true,
        message: 'Car data added successfully',
        addedCount: 1,
        totalAdditional: getAdditionalDataCount(),
      });
    }
    
    if (action === 'addBatch' && cars && Array.isArray(cars)) {
      // Validate all cars
      for (const c of cars) {
        const validationError = validateCarData(c);
        if (validationError) {
          return NextResponse.json(
            { success: false, error: `Validation error: ${validationError}` },
            { status: 400 }
          );
        }
      }
      
      addCarDataBatch(cars as CarData[]);
      
      return NextResponse.json({
        success: true,
        message: `${cars.length} car records added successfully`,
        addedCount: cars.length,
        totalAdditional: getAdditionalDataCount(),
      });
    }
    
    if (action === 'clear') {
      clearAdditionalData();
      
      return NextResponse.json({
        success: true,
        message: 'Additional data cleared successfully',
        totalAdditional: 0,
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "add", "addBatch", or "clear"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Data add error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to add data' },
      { status: 500 }
    );
  }
}

// Validate car data
function validateCarData(car: Partial<CarData>): string | null {
  if (!car.Car_Name || typeof car.Car_Name !== 'string') {
    return 'Car_Name is required and must be a string';
  }
  if (!car.Year || typeof car.Year !== 'number' || car.Year < 1990) {
    return 'Year is required and must be a number >= 1990';
  }
  if (car.Selling_Price === undefined || typeof car.Selling_Price !== 'number' || car.Selling_Price < 0) {
    return 'Selling_Price is required and must be a non-negative number';
  }
  if (car.Present_Price === undefined || typeof car.Present_Price !== 'number' || car.Present_Price < 0) {
    return 'Present_Price is required and must be a non-negative number';
  }
  if (car.Driven_kms === undefined || typeof car.Driven_kms !== 'number' || car.Driven_kms < 0) {
    return 'Driven_kms is required and must be a non-negative number';
  }
  if (!car.Fuel_Type || !['Petrol', 'Diesel', 'CNG'].includes(car.Fuel_Type)) {
    return 'Fuel_Type is required and must be Petrol, Diesel, or CNG';
  }
  if (!car.Selling_type || !['Dealer', 'Individual'].includes(car.Selling_type)) {
    return 'Selling_type is required and must be Dealer or Individual';
  }
  if (!car.Transmission || !['Manual', 'Automatic'].includes(car.Transmission)) {
    return 'Transmission is required and must be Manual or Automatic';
  }
  if (car.Owner === undefined || typeof car.Owner !== 'number' || car.Owner < 0) {
    return 'Owner is required and must be a non-negative number';
  }
  return null;
}
