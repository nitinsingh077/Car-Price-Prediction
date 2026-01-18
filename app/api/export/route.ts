import { NextResponse } from 'next/server';
import { getAllCarData, getOrTrainModel, getPredictionHistory } from '@/lib/data-store';

// GET /api/export - Export data in various formats
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const format = searchParams.get('format') || 'json';
    const type = searchParams.get('type') || 'data';
    
    // Export car data
    if (type === 'data') {
      const data = getAllCarData();
      
      if (format === 'csv') {
        const headers = ['Car_Name', 'Year', 'Selling_Price', 'Present_Price', 'Driven_kms', 'Fuel_Type', 'Selling_type', 'Transmission', 'Owner'];
        const csvRows = [
          headers.join(','),
          ...data.map(car => 
            [
              car.Car_Name,
              car.Year,
              car.Selling_Price,
              car.Present_Price,
              car.Driven_kms,
              car.Fuel_Type,
              car.Selling_type,
              car.Transmission,
              car.Owner,
            ].join(',')
          ),
        ];
        
        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=car_data.csv',
          },
        });
      }
      
      return NextResponse.json({
        success: true,
        data,
        exportedAt: new Date().toISOString(),
        totalRecords: data.length,
      });
    }
    
    // Export model info
    if (type === 'model') {
      const model = getOrTrainModel();
      
      const modelExport = {
        version: model.version,
        trainedAt: model.trainedAt,
        metrics: model.metrics,
        featureImportance: model.featureImportance,
        statistics: model.statistics,
        weights: model.weights,
        scalingParams: model.scalingParams,
      };
      
      if (format === 'csv') {
        // Export feature importance as CSV
        const csvRows = [
          'Feature,Importance',
          ...model.featureImportance.map(fi => `${fi.feature},${fi.importance}`),
        ];
        
        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=model_info.csv',
          },
        });
      }
      
      return NextResponse.json({
        success: true,
        model: modelExport,
        exportedAt: new Date().toISOString(),
      });
    }
    
    // Export prediction history
    if (type === 'history') {
      const history = getPredictionHistory();
      
      if (format === 'csv') {
        const headers = ['ID', 'Timestamp', 'Year', 'Present_Price', 'Driven_kms', 'Fuel_Type', 'Seller_Type', 'Transmission', 'Owner', 'Predicted_Price'];
        const csvRows = [
          headers.join(','),
          ...history.map(h => 
            [
              h.id,
              h.timestamp,
              h.input.year,
              h.input.presentPrice,
              h.input.drivenKms,
              h.input.fuelType,
              h.input.sellerType,
              h.input.transmission,
              h.input.owner,
              h.predictedPrice.toFixed(2),
            ].join(',')
          ),
        ];
        
        return new NextResponse(csvRows.join('\n'), {
          headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': 'attachment; filename=prediction_history.csv',
          },
        });
      }
      
      return NextResponse.json({
        success: true,
        history,
        exportedAt: new Date().toISOString(),
        totalRecords: history.length,
      });
    }
    
    // Export all
    if (type === 'all') {
      const data = getAllCarData();
      const model = getOrTrainModel();
      const history = getPredictionHistory();
      
      return NextResponse.json({
        success: true,
        exportedAt: new Date().toISOString(),
        data: {
          cars: data,
          totalRecords: data.length,
        },
        model: {
          version: model.version,
          trainedAt: model.trainedAt,
          metrics: model.metrics,
          featureImportance: model.featureImportance,
          statistics: model.statistics,
        },
        predictions: {
          history,
          totalRecords: history.length,
        },
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid type. Use "data", "model", "history", or "all"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export data' },
      { status: 500 }
    );
  }
}
