import { NextResponse } from 'next/server';
import {
  preparePredictionInput,
  applyScaling,
  predict,
  type PredictionInput,
} from '@/lib/ml-model';
import { getOrTrainModel, addPredictionToHistory } from '@/lib/data-store';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const input = body as PredictionInput;
    
    // Validate input
    if (!input.year || !input.presentPrice || input.drivenKms === undefined) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: year, presentPrice, drivenKms' },
        { status: 400 }
      );
    }
    
    // Validate ranges
    if (input.year < 1990 || input.year > new Date().getFullYear() + 1) {
      return NextResponse.json(
        { success: false, error: 'Invalid year. Must be between 1990 and current year + 1' },
        { status: 400 }
      );
    }
    
    if (input.presentPrice < 0) {
      return NextResponse.json(
        { success: false, error: 'Present price must be positive' },
        { status: 400 }
      );
    }
    
    if (input.drivenKms < 0) {
      return NextResponse.json(
        { success: false, error: 'Kilometers driven must be positive' },
        { status: 400 }
      );
    }
    
    // Get or train model
    const model = getOrTrainModel();
    
    // Prepare and scale input features
    const rawFeatures = preparePredictionInput(input);
    const scaledFeatures = applyScaling(rawFeatures, model.scalingParams);
    let predictedPrice = predict(scaledFeatures, model.weights);
    
    // Apply business logic constraints for realistic predictions
    // 1. Predicted price should never exceed present price (used cars depreciate)
    // 2. Apply depreciation factor based on car age and kilometers
    const currentYear = new Date().getFullYear();
    const carAge = currentYear - input.year;
    const kmFactor = Math.max(0.5, 1 - (input.drivenKms / 500000)); // Higher km = lower price
    const ageFactor = Math.max(0.2, 1 - (carAge * 0.08)); // ~8% depreciation per year
    
    // Calculate a depreciation-based price ceiling
    const depreciationCeiling = input.presentPrice * ageFactor * kmFactor;
    
    // If model predicts higher than present price or depreciation ceiling, use the ceiling
    if (predictedPrice > input.presentPrice) {
      predictedPrice = Math.min(depreciationCeiling, input.presentPrice * 0.95);
    }
    
    // If prediction is negative or too low compared to realistic minimum
    const minimumPrice = input.presentPrice * 0.05; // At least 5% of present price
    if (predictedPrice < minimumPrice) {
      predictedPrice = minimumPrice;
    }
    
    // Ensure realistic bounds: between minimum and present price
    const finalPrice = Math.max(minimumPrice, Math.min(predictedPrice, input.presentPrice * 0.98));
    
    // Add to prediction history
    const historyRecord = addPredictionToHistory({
      input: {
        year: input.year,
        presentPrice: input.presentPrice,
        drivenKms: input.drivenKms,
        fuelType: input.fuelType,
        sellerType: input.sellerType,
        transmission: input.transmission,
        owner: input.owner,
      },
      predictedPrice: finalPrice,
    });
    
    return NextResponse.json({
      success: true,
      prediction: {
        price: finalPrice,
        priceFormatted: `₹${finalPrice.toFixed(2)} Lakh`,
        predictionId: historyRecord.id,
      },
      modelInfo: {
        version: model.version,
        trainedAt: model.trainedAt,
      },
    });
  } catch (error) {
    console.error('Prediction error:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to make prediction' },
      { status: 500 }
    );
  }
}
