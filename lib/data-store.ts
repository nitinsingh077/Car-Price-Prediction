// Centralized data store for car data and model state
// Uses Supabase for persistence with in-memory fallback
import type { CarData, ScalingParams, ModelMetrics } from "./ml-model";
import {
  parseCSV,
  preprocessData,
  standardizeFeatures,
  trainLinearRegression,
  predictBatch,
  calculateMetrics,
  trainTestSplit,
  getFeatureImportance,
  getDataStatistics,
} from "./ml-model";
import { createAdminClient } from "./supabase/admin";

// Car data CSV (embedded for fallback/seeding)
export const carDataCSV = `Car_Name,Year,Selling_Price,Present_Price,Driven_kms,Fuel_Type,Selling_type,Transmission,Owner
ritz,2014,3.35,5.59,27000,Petrol,Dealer,Manual,0
sx4,2013,4.75,9.54,43000,Diesel,Dealer,Manual,0
ciaz,2017,7.25,9.85,6900,Petrol,Dealer,Manual,0
wagon r,2011,2.85,4.15,5200,Petrol,Dealer,Manual,0
swift,2014,4.6,6.87,42450,Diesel,Dealer,Manual,0
vitara brezza,2018,9.25,9.83,2071,Diesel,Dealer,Manual,0
ciaz,2015,6.75,8.12,18796,Petrol,Dealer,Manual,0
s cross,2015,6.5,8.61,33429,Diesel,Dealer,Manual,0
ciaz,2016,8.75,8.89,20273,Diesel,Dealer,Manual,0
ciaz,2015,7.45,8.92,42367,Diesel,Dealer,Manual,0
alto 800,2017,2.85,3.6,2135,Petrol,Dealer,Manual,0
ciaz,2015,6.85,10.38,51000,Diesel,Dealer,Manual,0
ciaz,2015,7.5,9.94,15000,Petrol,Dealer,Automatic,0
ertiga,2015,6.1,7.71,26000,Petrol,Dealer,Manual,0
dzire,2009,2.25,7.21,77427,Petrol,Dealer,Manual,0
ertiga,2016,7.75,10.79,43000,Diesel,Dealer,Manual,0
ertiga,2015,7.25,10.79,41678,Diesel,Dealer,Manual,0
ertiga,2016,7.75,10.79,43000,Diesel,Dealer,Manual,0
wagon r,2015,3.25,5.09,35500,CNG,Dealer,Manual,0
sx4,2010,2.65,7.98,41442,Petrol,Dealer,Manual,0
alto k10,2016,2.85,3.95,25000,Petrol,Dealer,Manual,0
ignis,2017,4.9,5.71,2400,Petrol,Dealer,Manual,0
sx4,2011,4.4,8.01,50000,Petrol,Dealer,Automatic,0
alto k10,2014,2.5,3.46,45280,Petrol,Dealer,Manual,0
wagon r,2013,2.9,4.41,56879,Petrol,Dealer,Manual,0
swift,2011,3,4.99,20000,Petrol,Dealer,Manual,0
swift,2013,4.15,5.87,55138,Petrol,Dealer,Manual,0
swift,2017,6,6.49,16200,Petrol,Individual,Manual,0
alto k10,2010,1.95,3.95,44542,Petrol,Dealer,Manual,0
ciaz,2015,7.45,10.38,45000,Diesel,Dealer,Manual,0
ritz,2012,3.1,5.98,51439,Diesel,Dealer,Manual,0
ritz,2011,2.35,4.89,54200,Petrol,Dealer,Manual,0
swift,2014,4.95,7.49,39000,Diesel,Dealer,Manual,0
ertiga,2014,6,9.95,45000,Diesel,Dealer,Manual,0
dzire,2014,5.5,8.06,45000,Diesel,Dealer,Manual,0
sx4,2011,2.95,7.74,49998,CNG,Dealer,Manual,0
dzire,2015,4.65,7.2,48767,Petrol,Dealer,Manual,0
800,2003,0.35,2.28,127000,Petrol,Individual,Manual,0
alto k10,2016,3,3.76,10079,Petrol,Dealer,Manual,0
sx4,2003,2.25,7.98,62000,Petrol,Dealer,Manual,0
baleno,2016,5.85,7.87,24524,Petrol,Dealer,Automatic,0
alto k10,2014,2.55,3.98,46706,Petrol,Dealer,Manual,0
sx4,2008,1.95,7.15,58000,Petrol,Dealer,Manual,0
dzire,2014,5.5,8.06,45780,Diesel,Dealer,Manual,0
omni,2012,1.25,2.69,50000,Petrol,Dealer,Manual,0
ciaz,2014,7.5,12.04,15000,Petrol,Dealer,Automatic,0
ritz,2013,2.65,4.89,64532,Petrol,Dealer,Manual,0
wagon r,2006,1.05,4.15,65000,Petrol,Dealer,Manual,0
ertiga,2015,5.8,7.71,25870,Petrol,Dealer,Manual,0
ciaz,2017,7.75,9.29,37000,Petrol,Dealer,Automatic,0
fortuner,2012,14.9,30.61,104707,Diesel,Dealer,Automatic,0
fortuner,2015,23,30.61,40000,Diesel,Dealer,Automatic,0
innova,2017,18,19.77,15000,Diesel,Dealer,Automatic,0
fortuner,2013,16,30.61,135000,Diesel,Individual,Automatic,0
innova,2005,2.75,10.21,90000,Petrol,Individual,Manual,0
corolla altis,2009,3.6,15.04,70000,Petrol,Dealer,Automatic,0
etios cross,2015,4.5,7.27,40534,Petrol,Dealer,Manual,0
corolla altis,2010,4.75,18.54,50000,Petrol,Dealer,Manual,0
etios g,2014,4.1,6.8,39485,Petrol,Dealer,Manual,1
fortuner,2014,19.99,35.96,41000,Diesel,Dealer,Automatic,0
corolla altis,2013,6.95,18.61,40001,Petrol,Dealer,Manual,0
etios cross,2015,4.5,7.7,40588,Petrol,Dealer,Manual,0
fortuner,2014,18.75,35.96,78000,Diesel,Dealer,Automatic,0
fortuner,2015,23.5,35.96,47000,Diesel,Dealer,Automatic,0
fortuner,2017,33,36.23,6000,Diesel,Dealer,Automatic,0
etios liva,2014,4.75,6.95,45000,Diesel,Dealer,Manual,0
innova,2017,19.75,23.15,11000,Petrol,Dealer,Automatic,0
fortuner,2010,9.25,20.45,59000,Diesel,Dealer,Manual,0
corolla altis,2011,4.35,13.74,88000,Petrol,Dealer,Manual,0
corolla altis,2016,14.25,20.91,12000,Petrol,Dealer,Manual,0
etios liva,2014,3.95,6.76,71000,Diesel,Dealer,Manual,0
corolla altis,2011,4.5,12.48,45000,Diesel,Dealer,Manual,0
corolla altis,2013,7.45,18.61,56001,Petrol,Dealer,Manual,0
etios liva,2011,2.65,5.71,43000,Petrol,Dealer,Manual,0
etios cross,2014,4.9,8.93,83000,Diesel,Dealer,Manual,0
etios g,2015,3.95,6.8,36000,Petrol,Dealer,Manual,0
corolla altis,2013,5.5,14.68,72000,Petrol,Dealer,Manual,0
corolla,2004,1.5,12.35,135154,Petrol,Dealer,Automatic,0
corolla altis,2010,5.25,22.83,80000,Petrol,Dealer,Automatic,0
fortuner,2012,14.5,30.61,89000,Diesel,Dealer,Automatic,0
corolla altis,2016,14.73,14.89,23000,Diesel,Dealer,Manual,0
etios gd,2015,4.75,7.85,40000,Diesel,Dealer,Manual,0
innova,2017,23,25.39,15000,Diesel,Dealer,Automatic,0
innova,2015,12.5,13.46,38000,Diesel,Dealer,Manual,0
innova,2005,3.49,13.46,197176,Diesel,Dealer,Manual,0
camry,2006,2.5,23.73,142000,Petrol,Individual,Automatic,3
land cruiser,2010,35,92.6,78000,Diesel,Dealer,Manual,0
corolla altis,2012,5.9,13.74,56000,Petrol,Dealer,Manual,0
etios liva,2013,3.45,6.05,47000,Petrol,Dealer,Manual,0
etios g,2014,4.75,6.76,40000,Petrol,Dealer,Manual,0
corolla altis,2009,3.8,18.61,62000,Petrol,Dealer,Manual,0
innova,2014,11.25,16.09,58242,Diesel,Dealer,Manual,0
innova,2005,3.51,13.7,75000,Petrol,Dealer,Manual,0
fortuner,2015,23,30.61,40000,Diesel,Dealer,Automatic,0
corolla altis,2008,4,22.78,89000,Petrol,Dealer,Automatic,0
corolla altis,2012,5.85,18.61,72000,Petrol,Dealer,Manual,0
innova,2016,20.75,25.39,29000,Diesel,Dealer,Automatic,0
corolla altis,2017,17,18.64,8700,Petrol,Dealer,Manual,0
corolla altis,2013,7.05,18.61,45000,Petrol,Dealer,Manual,0
fortuner,2010,9.65,20.45,50024,Diesel,Dealer,Manual,0
Royal Enfield Thunder 500,2016,1.75,1.9,3000,Petrol,Individual,Manual,0
UM Renegade Mojave,2017,1.7,1.82,1400,Petrol,Individual,Manual,0
KTM RC200,2017,1.65,1.78,4000,Petrol,Individual,Manual,0
Bajaj Dominar 400,2017,1.45,1.6,1200,Petrol,Individual,Manual,0
Royal Enfield Classic 350,2017,1.35,1.47,4100,Petrol,Individual,Manual,0
KTM RC390,2015,1.35,2.37,21700,Petrol,Individual,Manual,0
Hyosung GT250R,2014,1.35,3.45,16500,Petrol,Individual,Manual,1
Royal Enfield Thunder 350,2013,1.25,1.5,15000,Petrol,Individual,Manual,0
Royal Enfield Thunder 350,2016,1.2,1.5,18000,Petrol,Individual,Manual,0
Royal Enfield Classic 350,2017,1.2,1.47,11000,Petrol,Individual,Manual,0
KTM RC200,2016,1.2,1.78,6000,Petrol,Individual,Manual,0
Royal Enfield Thunder 350,2016,1.15,1.5,8700,Petrol,Individual,Manual,0
KTM 390 Duke ,2014,1.15,2.4,7000,Petrol,Individual,Manual,0
Mahindra Mojo XT300,2016,1.15,1.4,35000,Petrol,Individual,Manual,0
Royal Enfield Classic 350,2015,1.15,1.47,17000,Petrol,Individual,Manual,0
Royal Enfield Classic 350,2015,1.11,1.47,17500,Petrol,Individual,Manual,0
Royal Enfield Classic 350,2013,1.1,1.47,33000,Petrol,Individual,Manual,0
Royal Enfield Thunder 500,2015,1.1,1.9,14000,Petrol,Individual,Manual,0
Royal Enfield Classic 350,2015,1.1,1.47,26000,Petrol,Individual,Manual,0
Royal Enfield Thunder 500,2013,1.05,1.9,5400,Petrol,Individual,Manual,0
Bajaj Pulsar RS200,2016,1.05,1.26,5700,Petrol,Individual,Manual,0
Royal Enfield Thunder 350,2011,1.05,1.5,6900,Petrol,Individual,Manual,0
Royal Enfield Bullet 350,2016,1.05,1.17,6000,Petrol,Individual,Manual,0
Royal Enfield Classic 350,2013,1,1.47,46500,Petrol,Individual,Manual,0
Royal Enfield Classic 500,2012,0.95,1.75,11500,Petrol,Individual,Manual,0
Royal Enfield Classic 500,2009,0.9,1.75,40000,Petrol,Individual,Manual,0
Bajaj Avenger 220,2017,0.9,0.95,1300,Petrol,Individual,Manual,0
Bajaj Avenger 150,2016,0.75,0.8,7000,Petrol,Individual,Manual,0
Honda CB Hornet 160R,2017,0.8,0.87,3000,Petrol,Individual,Manual,0
Yamaha FZ S V 2.0,2017,0.78,0.84,5000,Petrol,Individual,Manual,0
Honda CB Hornet 160R,2017,0.75,0.87,11000,Petrol,Individual,Manual,0
Yamaha FZ 16,2015,0.75,0.82,18000,Petrol,Individual,Manual,0
Bajaj Avenger 220,2017,0.75,0.95,3500,Petrol,Individual,Manual,0
Bajaj Avenger 220,2016,0.72,0.95,500,Petrol,Individual,Manual,0
TVS Apache RTR 160,2017,0.65,0.81,11800,Petrol,Individual,Manual,0
Bajaj Pulsar 150,2015,0.65,0.74,5000,Petrol,Individual,Manual,0
Honda CBR 150,2014,0.65,1.2,23500,Petrol,Individual,Manual,0
Hero Extreme,2013,0.65,0.787,16000,Petrol,Individual,Manual,0
Honda CB Hornet 160R,2016,0.6,0.87,15000,Petrol,Individual,Manual,0
Bajaj Avenger 220 dtsi,2015,0.6,0.95,16600,Petrol,Individual,Manual,0
Honda CBR 150,2013,0.6,1.2,32000,Petrol,Individual,Manual,0
Bajaj Avenger 150 street,2016,0.6,0.8,20000,Petrol,Individual,Manual,0
Yamaha FZ  v 2.0,2015,0.6,0.84,29000,Petrol,Individual,Manual,0
Yamaha FZ  v 2.0,2016,0.6,0.84,25000,Petrol,Individual,Manual,0
Bajaj Pulsar  NS 200,2014,0.6,0.99,25000,Petrol,Individual,Manual,0
TVS Apache RTR 160,2012,0.6,0.81,19000,Petrol,Individual,Manual,0
Hero Extreme,2014,0.55,0.787,15000,Petrol,Individual,Manual,0
Yamaha FZ S V 2.0,2015,0.55,0.84,58000,Petrol,Individual,Manual,0
Bajaj Pulsar 220 F,2010,0.52,0.94,45000,Petrol,Individual,Manual,0
Bajaj Pulsar 220 F,2016,0.51,0.94,24000,Petrol,Individual,Manual,0
TVS Apache RTR 180,2011,0.5,0.826,6000,Petrol,Individual,Manual,0
Hero Passion X pro,2016,0.5,0.55,31000,Petrol,Individual,Manual,0
Bajaj Pulsar NS 200,2012,0.5,0.99,13000,Petrol,Individual,Manual,0
Bajaj Pulsar NS 200,2013,0.5,0.99,45000,Petrol,Individual,Manual,0
Yamaha Fazer ,2014,0.5,0.88,8000,Petrol,Individual,Manual,0
Honda Activa 4G,2017,0.48,0.51,4300,Petrol,Individual,Automatic,0
TVS Sport ,2017,0.48,0.52,15000,Petrol,Individual,Manual,0
Yamaha FZ S V 2.0,2015,0.48,0.84,23000,Petrol,Individual,Manual,0
Honda Dream Yuga ,2017,0.48,0.54,8600,Petrol,Individual,Manual,0
Honda Activa 4G,2017,0.45,0.51,4000,Petrol,Individual,Automatic,0
Bajaj Avenger Street 220,2011,0.45,0.95,24000,Petrol,Individual,Manual,0
TVS Apache RTR 180,2014,0.45,0.826,23000,Petrol,Individual,Manual,0
Bajaj Pulsar NS 200,2012,0.45,0.99,14500,Petrol,Individual,Manual,0
Bajaj Avenger 220 dtsi,2010,0.45,0.95,27000,Petrol,Individual,Manual,0
Hero Splender iSmart,2016,0.45,0.54,14000,Petrol,Individual,Manual,0
Activa 3g,2016,0.45,0.54,500,Petrol,Individual,Automatic,0
Hero Passion Pro,2016,0.45,0.55,1000,Petrol,Individual,Manual,0
TVS Apache RTR 160,2014,0.42,0.81,42000,Petrol,Individual,Manual,0
Honda CB Trigger,2013,0.42,0.73,12000,Petrol,Individual,Manual,0
Hero Splender iSmart,2015,0.4,0.54,14000,Petrol,Individual,Manual,0
Yamaha FZ S ,2012,0.4,0.83,5500,Petrol,Individual,Manual,0
Hero Passion Pro,2015,0.4,0.55,6700,Petrol,Individual,Manual,0
Bajaj Pulsar 135 LS,2014,0.4,0.64,13700,Petrol,Individual,Manual,0
Activa 4g,2017,0.4,0.51,1300,Petrol,Individual,Automatic,0
Honda CB Unicorn,2015,0.38,0.72,38600,Petrol,Individual,Manual,0
Hero Honda CBZ extreme,2011,0.38,0.787,75000,Petrol,Individual,Manual,0
Honda Karizma,2011,0.35,1.05,30000,Petrol,Individual,Manual,0
Honda Activa 125,2016,0.35,0.57,24000,Petrol,Individual,Automatic,0
TVS Jupyter,2014,0.35,0.52,19000,Petrol,Individual,Automatic,0
Honda Karizma,2010,0.31,1.05,213000,Petrol,Individual,Manual,0
Hero Honda Passion Pro,2012,0.3,0.51,60000,Petrol,Individual,Manual,0
Hero Splender Plus,2016,0.3,0.48,50000,Petrol,Individual,Manual,0
Honda CB Shine,2013,0.3,0.58,30000,Petrol,Individual,Manual,0
Bajaj Discover 100,2013,0.27,0.47,21000,Petrol,Individual,Manual,0
Bajaj Pulsar 150,2008,0.25,0.75,26000,Petrol,Individual,Manual,1
Suzuki Access 125,2008,0.25,0.58,1900,Petrol,Individual,Automatic,0
TVS Wego,2010,0.25,0.52,22000,Petrol,Individual,Automatic,0
Honda CB twister,2013,0.25,0.51,32000,Petrol,Individual,Manual,0
Hero Glamour,2013,0.25,0.57,18000,Petrol,Individual,Manual,0
Hero Super Splendor,2005,0.2,0.57,55000,Petrol,Individual,Manual,0
Bajaj Pulsar 150,2008,0.2,0.75,60000,Petrol,Individual,Manual,0
Bajaj Discover 125,2012,0.2,0.57,25000,Petrol,Individual,Manual,1
Hero Hunk,2007,0.2,0.75,49000,Petrol,Individual,Manual,1
Hero  Ignitor Disc,2013,0.2,0.65,24000,Petrol,Individual,Manual,1
Hero  CBZ Xtreme,2008,0.2,0.787,50000,Petrol,Individual,Manual,0
Bajaj  ct 100,2015,0.18,0.32,35000,Petrol,Individual,Manual,0
Activa 3g,2008,0.17,0.52,500000,Petrol,Individual,Automatic,0
Honda CB twister,2010,0.16,0.51,33000,Petrol,Individual,Manual,0
Bajaj Discover 125,2011,0.15,0.57,35000,Petrol,Individual,Manual,1
Honda CB Shine,2007,0.12,0.58,53000,Petrol,Individual,Manual,0
Bajaj Pulsar 150,2006,0.1,0.75,92233,Petrol,Individual,Manual,0
i20,2010,3.25,6.79,58000,Diesel,Dealer,Manual,1
grand i10,2015,4.4,5.7,28200,Petrol,Dealer,Manual,0
i10,2011,2.95,4.6,53460,Petrol,Dealer,Manual,0
eon,2015,2.75,4.43,28282,Petrol,Dealer,Manual,0
grand i10,2016,5.25,5.7,3493,Petrol,Dealer,Manual,1
xcent,2017,5.75,7.13,12479,Petrol,Dealer,Manual,0
grand i10,2015,5.15,5.7,34797,Petrol,Dealer,Automatic,0
i20,2017,7.9,8.1,3435,Petrol,Dealer,Manual,0
grand i10,2015,4.85,5.7,21125,Diesel,Dealer,Manual,0
i10,2012,3.1,4.6,35775,Petrol,Dealer,Manual,0
elantra,2015,11.75,14.79,43535,Diesel,Dealer,Manual,0
creta,2016,11.25,13.6,22671,Petrol,Dealer,Manual,0
i20,2011,2.9,6.79,31604,Petrol,Dealer,Manual,0
grand i10,2017,5.25,5.7,20114,Petrol,Dealer,Manual,0
verna,2012,4.5,9.4,36100,Petrol,Dealer,Manual,0
eon,2016,2.9,4.43,12500,Petrol,Dealer,Manual,0
eon,2016,3.15,4.43,15000,Petrol,Dealer,Manual,0
verna,2014,6.45,8.4,45078,Petrol,Dealer,Manual,0
verna,2012,4.5,9.4,36000,Petrol,Dealer,Manual,0
eon,2017,3.5,5.43,38488,Petrol,Dealer,Manual,0
i20,2013,4.5,6.79,32000,Petrol,Dealer,Automatic,0
i20,2014,6,7.6,77632,Diesel,Dealer,Manual,0
verna,2015,8.25,9.4,61381,Diesel,Dealer,Manual,0
verna,2013,5.11,9.4,36198,Petrol,Dealer,Automatic,0
i10,2011,2.7,4.6,22517,Petrol,Dealer,Manual,0
grand i10,2015,5.25,5.7,24678,Petrol,Dealer,Manual,0
i10,2011,2.55,4.43,57000,Petrol,Dealer,Manual,0
verna,2012,4.95,9.4,60000,Diesel,Dealer,Manual,0
i20,2012,3.1,6.79,52132,Diesel,Dealer,Manual,0
verna,2013,6.15,9.4,45000,Diesel,Dealer,Manual,0
verna,2017,9.25,9.4,15001,Petrol,Dealer,Manual,0
elantra,2015,11.45,14.79,12900,Petrol,Dealer,Automatic,0
grand i10,2013,3.9,5.7,53000,Diesel,Dealer,Manual,0
grand i10,2015,5.5,5.7,4492,Petrol,Dealer,Manual,0
verna,2017,9.1,9.4,15141,Petrol,Dealer,Manual,0
eon,2016,3.1,4.43,11849,Petrol,Dealer,Manual,0
creta,2015,11.25,13.6,68000,Diesel,Dealer,Manual,0
verna,2013,4.8,9.4,60241,Petrol,Dealer,Manual,0
eon,2012,2,4.43,23709,Petrol,Dealer,Manual,0
verna,2012,5.35,9.4,32322,Diesel,Dealer,Manual,0
xcent,2015,4.75,7.13,35866,Petrol,Dealer,Manual,1
xcent,2014,4.4,7.13,34000,Petrol,Dealer,Manual,0
i20,2016,6.25,7.6,7000,Petrol,Dealer,Manual,0
verna,2013,5.95,9.4,49000,Diesel,Dealer,Manual,0
verna,2012,5.2,9.4,71000,Diesel,Dealer,Manual,0
i20,2012,3.75,6.79,35000,Petrol,Dealer,Manual,0
verna,2015,5.95,9.4,36000,Petrol,Dealer,Manual,0
i10,2013,4,4.6,30000,Petrol,Dealer,Manual,0
i20,2016,5.25,7.6,17000,Petrol,Dealer,Manual,0
creta,2016,12.9,13.6,35934,Diesel,Dealer,Manual,0
city,2013,5,9.9,56701,Petrol,Dealer,Manual,0
brio,2015,5.4,6.82,31427,Petrol,Dealer,Automatic,0
city,2014,7.2,9.9,48000,Diesel,Dealer,Manual,0
city,2013,5.25,9.9,54242,Petrol,Dealer,Manual,0
brio,2012,3,5.35,53675,Petrol,Dealer,Manual,0
city,2016,10.25,13.6,49562,Petrol,Dealer,Manual,0
city,2015,8.5,13.6,40324,Petrol,Dealer,Manual,0
city,2015,8.4,13.6,25000,Petrol,Dealer,Manual,0
amaze,2014,3.9,7,36054,Petrol,Dealer,Manual,0
city,2016,9.15,13.6,29223,Petrol,Dealer,Manual,0
brio,2016,5.5,5.97,5600,Petrol,Dealer,Manual,0
amaze,2015,4,5.8,40023,Petrol,Dealer,Manual,0
jazz,2016,6.6,7.7,16002,Petrol,Dealer,Manual,0
amaze,2015,4,7,40026,Petrol,Dealer,Manual,0
jazz,2017,6.5,8.7,21200,Petrol,Dealer,Manual,0
amaze,2014,3.65,7,35000,Petrol,Dealer,Manual,0
city,2016,8.35,9.4,19434,Diesel,Dealer,Manual,0
brio,2017,4.8,5.8,19000,Petrol,Dealer,Manual,0
city,2015,6.7,10,18828,Petrol,Dealer,Manual,0
city,2011,4.1,10,69341,Petrol,Dealer,Manual,0
city,2009,3,10,69562,Petrol,Dealer,Manual,0
city,2015,7.5,10,27600,Petrol,Dealer,Manual,0
jazz,2010,2.25,7.5,61203,Petrol,Dealer,Manual,0
brio,2014,5.3,6.8,16500,Petrol,Dealer,Manual,0
city,2016,10.9,13.6,30753,Petrol,Dealer,Automatic,0
city,2015,8.65,13.6,24800,Petrol,Dealer,Manual,0
city,2015,9.7,13.6,21780,Petrol,Dealer,Manual,0
jazz,2016,6,8.4,4000,Petrol,Dealer,Manual,0
city,2014,6.25,13.6,40126,Petrol,Dealer,Manual,0
brio,2015,5.25,5.9,14465,Petrol,Dealer,Manual,0
city,2006,2.1,7.6,50456,Petrol,Dealer,Manual,0
city,2014,8.25,14,63000,Diesel,Dealer,Manual,0
city,2016,8.99,11.8,9010,Petrol,Dealer,Manual,0
brio,2013,3.5,5.9,9800,Petrol,Dealer,Manual,0
jazz,2016,7.4,8.5,15059,Petrol,Dealer,Automatic,0
jazz,2016,5.65,7.9,28569,Petrol,Dealer,Manual,0
amaze,2015,5.75,7.5,44000,Petrol,Dealer,Automatic,0
city,2015,8.4,13.6,34000,Petrol,Dealer,Manual,0
city,2016,10.11,13.6,10980,Petrol,Dealer,Manual,0
amaze,2014,4.5,6.4,19000,Petrol,Dealer,Manual,0
brio,2015,5.4,6.1,31427,Petrol,Dealer,Manual,0
jazz,2016,6.4,8.4,12000,Petrol,Dealer,Manual,0
city,2010,3.25,9.9,38000,Petrol,Dealer,Manual,0
amaze,2014,3.75,6.8,33019,Petrol,Dealer,Manual,0
city,2015,8.55,13.09,60076,Diesel,Dealer,Manual,0
city,2016,9.5,11.6,33988,Diesel,Dealer,Manual,0
brio,2015,4,5.9,60000,Petrol,Dealer,Manual,0
city,2009,3.35,11,87934,Petrol,Dealer,Manual,0
city,2017,11.5,12.5,9000,Diesel,Dealer,Manual,0
brio,2016,5.3,5.9,5464,Petrol,Dealer,Manual,0`;

// ============================================================
// Supabase Database Integration Layer
// ============================================================

// Check if Supabase is available
function isSupabaseConfigured(): boolean {
  return !!(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );
}

// Get Supabase admin client (safe - returns null if not configured)
function getSupabaseAdmin() {
  try {
    if (!isSupabaseConfigured()) return null;
    return createAdminClient();
  } catch {
    return null;
  }
}

// Initialize Supabase tables and seed data
export async function initializeDatabase(): Promise<{
  success: boolean;
  message: string;
  seeded?: number;
}> {
  const supabase = getSupabaseAdmin();
  if (!supabase) {
    return { success: false, message: "Supabase not configured" };
  }

  try {
    // Create car_data table via RPC (raw SQL)
    const { error: createError } = await supabase.rpc("exec_sql", {
      sql_query: `
        CREATE TABLE IF NOT EXISTS public.car_data (
          id BIGSERIAL PRIMARY KEY,
          car_name TEXT NOT NULL,
          year INTEGER NOT NULL,
          selling_price NUMERIC(10,2) NOT NULL,
          present_price NUMERIC(10,2) NOT NULL,
          driven_kms INTEGER NOT NULL,
          fuel_type TEXT NOT NULL,
          selling_type TEXT NOT NULL,
          transmission TEXT NOT NULL,
          owner INTEGER NOT NULL DEFAULT 0,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        CREATE TABLE IF NOT EXISTS public.prediction_history (
          id TEXT PRIMARY KEY,
          input_year INTEGER NOT NULL,
          input_present_price NUMERIC(10,2) NOT NULL,
          input_driven_kms INTEGER NOT NULL,
          input_fuel_type TEXT NOT NULL,
          input_seller_type TEXT NOT NULL,
          input_transmission TEXT NOT NULL,
          input_owner INTEGER NOT NULL DEFAULT 0,
          predicted_price NUMERIC(10,2) NOT NULL,
          created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
        
        CREATE TABLE IF NOT EXISTS public.model_state (
          id INTEGER PRIMARY KEY DEFAULT 1,
          weights JSONB NOT NULL,
          scaling_params JSONB NOT NULL,
          train_metrics JSONB NOT NULL,
          test_metrics JSONB NOT NULL,
          feature_importance JSONB NOT NULL,
          statistics JSONB NOT NULL,
          version TEXT NOT NULL,
          trained_at TIMESTAMPTZ NOT NULL DEFAULT now()
        );
      `,
    });

    // If RPC doesn't exist, tables may already exist - try inserting data directly
    if (createError) {
      console.log(
        "RPC not available, attempting direct table operations:",
        createError.message,
      );
    }

    // Check if car_data has data
    const { count } = await supabase
      .from("car_data")
      .select("*", { count: "exact", head: true });

    if (count === 0 || count === null) {
      // Seed the data
      const csvData = parseCSV(carDataCSV);
      const rows = csvData.map((car) => ({
        car_name: car.Car_Name,
        year: car.Year,
        selling_price: car.Selling_Price,
        present_price: car.Present_Price,
        driven_kms: car.Driven_kms,
        fuel_type: car.Fuel_Type,
        selling_type: car.Selling_type,
        transmission: car.Transmission,
        owner: car.Owner,
      }));

      // Insert in batches of 50
      let seeded = 0;
      for (let i = 0; i < rows.length; i += 50) {
        const batch = rows.slice(i, i + 50);
        const { error: insertError } = await supabase
          .from("car_data")
          .insert(batch);
        if (insertError) {
          console.error("Seed batch error:", insertError.message);
        } else {
          seeded += batch.length;
        }
      }

      return {
        success: true,
        message: `Database initialized and seeded with ${seeded} records`,
        seeded,
      };
    }

    return {
      success: true,
      message: `Database already has ${count} records`,
      seeded: 0,
    };
  } catch (error) {
    console.error("DB init error:", error);
    return {
      success: false,
      message: `Database initialization failed: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

// Fetch car data from Supabase
export async function fetchCarDataFromSupabase(): Promise<CarData[] | null> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("car_data")
      .select("*")
      .order("id", { ascending: true });

    if (error || !data || data.length === 0) return null;

    return data.map((row: Record<string, unknown>) => ({
      Car_Name: row.car_name as string,
      Year: row.year as number,
      Selling_Price: Number(row.selling_price),
      Present_Price: Number(row.present_price),
      Driven_kms: row.driven_kms as number,
      Fuel_Type: row.fuel_type as string,
      Selling_type: row.selling_type as string,
      Transmission: row.transmission as string,
      Owner: row.owner as number,
    }));
  } catch {
    return null;
  }
}

// Save prediction to Supabase
export async function savePredictionToSupabase(record: {
  id: string;
  input: {
    year: number;
    presentPrice: number;
    drivenKms: number;
    fuelType: string;
    sellerType: string;
    transmission: string;
    owner: number;
  };
  predictedPrice: number;
}): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("prediction_history").insert({
      id: record.id,
      input_year: record.input.year,
      input_present_price: record.input.presentPrice,
      input_driven_kms: record.input.drivenKms,
      input_fuel_type: record.input.fuelType,
      input_seller_type: record.input.sellerType,
      input_transmission: record.input.transmission,
      input_owner: record.input.owner,
      predicted_price: record.predictedPrice,
    });

    return !error;
  } catch {
    return false;
  }
}

// Fetch prediction history from Supabase
export async function fetchHistoryFromSupabase(): Promise<
  PredictionRecord[] | null
> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return null;

  try {
    const { data, error } = await supabase
      .from("prediction_history")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (error || !data) return null;

    return data.map((row: Record<string, unknown>) => ({
      id: row.id as string,
      input: {
        year: row.input_year as number,
        presentPrice: Number(row.input_present_price),
        drivenKms: row.input_driven_kms as number,
        fuelType: row.input_fuel_type as string,
        sellerType: row.input_seller_type as string,
        transmission: row.input_transmission as string,
        owner: row.input_owner as number,
      },
      predictedPrice: Number(row.predicted_price),
      timestamp: (row.created_at as string) || new Date().toISOString(),
    }));
  } catch {
    return null;
  }
}

// Save model state to Supabase
export async function saveModelToSupabase(model: ModelState): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("model_state").upsert({
      id: 1,
      weights: model.weights,
      scaling_params: model.scalingParams,
      train_metrics: model.metrics.train,
      test_metrics: model.metrics.test,
      feature_importance: model.featureImportance,
      statistics: model.statistics,
      version: model.version,
      trained_at: model.trainedAt,
    });

    return !error;
  } catch {
    return false;
  }
}

// Add car data to Supabase
export async function addCarDataToSupabase(car: CarData): Promise<boolean> {
  const supabase = getSupabaseAdmin();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from("car_data").insert({
      car_name: car.Car_Name,
      year: car.Year,
      selling_price: car.Selling_Price,
      present_price: car.Present_Price,
      driven_kms: car.Driven_kms,
      fuel_type: car.Fuel_Type,
      selling_type: car.Selling_type,
      transmission: car.Transmission,
      owner: car.Owner,
    });

    return !error;
  } catch {
    return false;
  }
}

// ============================================================
// In-Memory Store (Fallback + Primary Cache)
// ============================================================

// Model state interface
export interface ModelState {
  weights: number[];
  scalingParams: ScalingParams;
  metrics: {
    train: ModelMetrics;
    test: ModelMetrics;
  };
  featureImportance: ReturnType<typeof getFeatureImportance>;
  statistics: ReturnType<typeof getDataStatistics>;
  trainedAt: string;
  version: string;
}

// Cached model state (singleton pattern)
let cachedModel: ModelState | null = null;

// Additional car data storage (for user-added data)
let additionalCarData: CarData[] = [];

// Track if Supabase data was loaded
let supabaseDataLoaded = false;

// Get all car data (try Supabase first, then fallback to CSV)
export function getAllCarData(): CarData[] {
  const originalData = parseCSV(carDataCSV);
  return [...originalData, ...additionalCarData];
}

// Async version that tries Supabase
export async function getAllCarDataAsync(): Promise<CarData[]> {
  if (!supabaseDataLoaded) {
    const supabaseData = await fetchCarDataFromSupabase();
    if (supabaseData && supabaseData.length > 0) {
      supabaseDataLoaded = true;
      return supabaseData;
    }
  }
  return getAllCarData();
}

// Add new car data
export async function addCarData(car: CarData): Promise<void> {
  additionalCarData.push(car);
  cachedModel = null;
  // Also persist to Supabase
  await addCarDataToSupabase(car);
}

// Add multiple car records
export async function addCarDataBatch(cars: CarData[]): Promise<void> {
  additionalCarData.push(...cars);
  cachedModel = null;
  for (const car of cars) {
    await addCarDataToSupabase(car);
  }
}

// Get additional car data count
export function getAdditionalDataCount(): number {
  return additionalCarData.length;
}

// Clear additional data
export function clearAdditionalData(): void {
  additionalCarData = [];
  cachedModel = null;
}

// Train model and cache results
export function getOrTrainModel(forceRetrain = false): ModelState {
  if (cachedModel && !forceRetrain) return cachedModel;

  const data = getAllCarData();
  const { features, targets } = preprocessData(data);
  const { scaledFeatures, scalingParams } = standardizeFeatures(features);

  // Split data (80% train, 20% test)
  const { trainFeatures, testFeatures, trainTargets, testTargets } =
    trainTestSplit(scaledFeatures, targets, 0.2);

  // Train model using Multiple Linear Regression with Ridge regularization
  const weights = trainLinearRegression(trainFeatures, trainTargets);

  // Calculate metrics on both train and test sets
  const trainPredictions = predictBatch(trainFeatures, weights);
  const testPredictions = predictBatch(testFeatures, weights);

  const trainMetrics = calculateMetrics(trainTargets, trainPredictions);
  const testMetrics = calculateMetrics(testTargets, testPredictions);

  // Get feature importance (absolute coefficient values)
  const featureImportance = getFeatureImportance(weights);

  // Get data statistics
  const statistics = getDataStatistics(data);

  cachedModel = {
    weights,
    scalingParams,
    metrics: { train: trainMetrics, test: testMetrics },
    featureImportance,
    statistics,
    trainedAt: new Date().toISOString(),
    version: `v${Date.now()}`,
  };

  // Persist model to Supabase (fire and forget)
  saveModelToSupabase(cachedModel).catch(() => {});

  return cachedModel;
}

// Force model retraining
export function retrainModel(): ModelState {
  return getOrTrainModel(true);
}

// Get model without training (returns null if not trained)
export function getCachedModel(): ModelState | null {
  return cachedModel;
}

// Check if model is trained
export function isModelTrained(): boolean {
  return cachedModel !== null;
}

// Get prediction history
interface PredictionRecord {
  id: string;
  input: {
    year: number;
    presentPrice: number;
    drivenKms: number;
    fuelType: string;
    sellerType: string;
    transmission: string;
    owner: number;
  };
  predictedPrice: number;
  timestamp: string;
}

let predictionHistory: PredictionRecord[] = [];

export function addPredictionToHistory(
  record: Omit<PredictionRecord, "id" | "timestamp">,
): PredictionRecord {
  const newRecord: PredictionRecord = {
    ...record,
    id: `pred_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
  };
  predictionHistory.unshift(newRecord);
  // Keep only last 100 predictions
  if (predictionHistory.length > 100) {
    predictionHistory = predictionHistory.slice(0, 100);
  }

  // Also persist to Supabase (fire and forget)
  savePredictionToSupabase(newRecord).catch(() => {});

  return newRecord;
}

export async function getPredictionHistory(): Promise<PredictionRecord[]> {
  // Try Supabase first
  const supabaseHistory = await fetchHistoryFromSupabase();
  if (supabaseHistory && supabaseHistory.length > 0) {
    return supabaseHistory;
  }
  return predictionHistory;
}

export function getPredictionHistorySync(): PredictionRecord[] {
  return predictionHistory;
}

export function clearPredictionHistory(): void {
  predictionHistory = [];
}

// Get database status
export async function getDatabaseStatus(): Promise<{
  supabaseConnected: boolean;
  supabaseRecords: number | null;
  inMemoryRecords: number;
  modelTrained: boolean;
}> {
  let supabaseConnected = false;
  let supabaseRecords: number | null = null;

  const supabase = getSupabaseAdmin();
  if (supabase) {
    try {
      const { count, error } = await supabase
        .from("car_data")
        .select("*", { count: "exact", head: true });
      if (!error) {
        supabaseConnected = true;
        supabaseRecords = count;
      }
    } catch {
      // Supabase not available
    }
  }

  return {
    supabaseConnected,
    supabaseRecords,
    inMemoryRecords: getAllCarData().length,
    modelTrained: isModelTrained(),
  };
}
