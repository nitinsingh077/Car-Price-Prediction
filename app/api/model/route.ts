import { NextResponse } from 'next/server';
import { getOrTrainModel, retrainModel, isModelTrained, getCachedModel } from '@/lib/data-store';

// GET /api/model - Get model information and metrics
export async function GET() {
  try {
    const model = getOrTrainModel();
    
    return NextResponse.json({
      success: true,
      modelInfo: {
        metrics: model.metrics,
        featureImportance: model.featureImportance,
        statistics: model.statistics,
        version: model.version,
        trainedAt: model.trainedAt,
        isTrained: true,
      },
    });
  } catch (error) {
    console.error('Model info error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get model info' },
      { status: 500 }
    );
  }
}

// POST /api/model - Retrain the model
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { action } = body;
    
    if (action === 'retrain') {
      const model = retrainModel();
      
      return NextResponse.json({
        success: true,
        message: 'Model retrained successfully',
        modelInfo: {
          metrics: model.metrics,
          featureImportance: model.featureImportance,
          statistics: model.statistics,
          version: model.version,
          trainedAt: model.trainedAt,
        },
      });
    }
    
    if (action === 'status') {
      const trained = isModelTrained();
      const cachedModel = getCachedModel();
      
      return NextResponse.json({
        success: true,
        status: {
          isTrained: trained,
          version: cachedModel?.version || null,
          trainedAt: cachedModel?.trainedAt || null,
        },
      });
    }
    
    return NextResponse.json(
      { success: false, error: 'Invalid action. Use "retrain" or "status"' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Model action error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to perform model action' },
      { status: 500 }
    );
  }
}
