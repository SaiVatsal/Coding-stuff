export interface PincodeInfo {
  city: string;
  state: string;
  estimatedDays: number;
  isCodAvailable: boolean;
  courierPartner: string;
}

const PINCODE_MAP: Record<string, PincodeInfo> = {
  // Metro Karnataka / Bangalore
  '560001': { city: 'Bengaluru', state: 'Karnataka', estimatedDays: 2, isCodAvailable: true, courierPartner: 'BlueDart Air' },
  '560034': { city: 'Bengaluru (Koramangala)', state: 'Karnataka', estimatedDays: 2, isCodAvailable: true, courierPartner: 'BlueDart Air' },
  '560100': { city: 'Bengaluru (Electronic City)', state: 'Karnataka', estimatedDays: 2, isCodAvailable: true, courierPartner: 'BlueDart Air' },
  '570001': { city: 'Mysuru', state: 'Karnataka', estimatedDays: 2, isCodAvailable: true, courierPartner: 'Delhivery' },

  // Delhi NCR
  '110001': { city: 'New Delhi', state: 'Delhi', estimatedDays: 3, isCodAvailable: true, courierPartner: 'BlueDart Air' },
  '110020': { city: 'New Delhi (Okhla)', state: 'Delhi', estimatedDays: 3, isCodAvailable: true, courierPartner: 'BlueDart Air' },
  '122001': { city: 'Gurugram', state: 'Haryana', estimatedDays: 3, isCodAvailable: true, courierPartner: 'Delhivery' },
  '201301': { city: 'Noida', state: 'Uttar Pradesh', estimatedDays: 3, isCodAvailable: true, courierPartner: 'Delhivery' },

  // Mumbai & Maharashtra
  '400001': { city: 'Mumbai (Fort)', state: 'Maharashtra', estimatedDays: 3, isCodAvailable: true, courierPartner: 'BlueDart Air' },
  '400050': { city: 'Mumbai (Bandra)', state: 'Maharashtra', estimatedDays: 3, isCodAvailable: true, courierPartner: 'BlueDart Air' },
  '411001': { city: 'Pune', state: 'Maharashtra', estimatedDays: 3, isCodAvailable: true, courierPartner: 'Delhivery' },

  // Hyderabad & Telangana
  '500001': { city: 'Hyderabad', state: 'Telangana', estimatedDays: 2, isCodAvailable: true, courierPartner: 'BlueDart Air' },
  '500081': { city: 'Hyderabad (Hitec City)', state: 'Telangana', estimatedDays: 2, isCodAvailable: true, courierPartner: 'BlueDart Air' },

  // Chennai & Tamil Nadu
  '600001': { city: 'Chennai', state: 'Tamil Nadu', estimatedDays: 3, isCodAvailable: true, courierPartner: 'BlueDart Air' },
  '641001': { city: 'Coimbatore', state: 'Tamil Nadu', estimatedDays: 3, isCodAvailable: true, courierPartner: 'Delhivery' },

  // Kolkata & West Bengal
  '700001': { city: 'Kolkata', state: 'West Bengal', estimatedDays: 4, isCodAvailable: true, courierPartner: 'Delhivery' },

  // Gujarat & Rajasthan
  '380001': { city: 'Ahmedabad', state: 'Gujarat', estimatedDays: 3, isCodAvailable: true, courierPartner: 'Delhivery' },
  '302001': { city: 'Jaipur', state: 'Rajasthan', estimatedDays: 3, isCodAvailable: true, courierPartner: 'Delhivery' },
};

// Indian state zones based on first digit of pincode
const ZONE_FALLBACKS: Record<string, { state: string; city: string }> = {
  '1': { state: 'Delhi', city: 'North Zone' },
  '2': { state: 'Uttar Pradesh', city: 'Central North Zone' },
  '3': { state: 'Rajasthan', city: 'West Zone' },
  '4': { state: 'Maharashtra', city: 'West Zone' },
  '5': { state: 'Telangana / Andhra Pradesh', city: 'South Zone' },
  '6': { state: 'Tamil Nadu / Kerala', city: 'South Zone' },
  '7': { state: 'West Bengal / East', city: 'East Zone' },
  '8': { state: 'Bihar / Jharkhand', city: 'East Zone' },
  '9': { state: 'North East', city: 'Special Zone' },
};

export function lookupIndianPincode(pincode: string): PincodeInfo | null {
  const clean = pincode.trim();
  if (!/^[1-9][0-9]{5}$/.test(clean)) {
    return null;
  }

  if (PINCODE_MAP[clean]) {
    return PINCODE_MAP[clean];
  }

  const firstDigit = clean.charAt(0);
  const fallback = ZONE_FALLBACKS[firstDigit] || { state: 'India', city: 'Regional Hub' };

  return {
    city: fallback.city,
    state: fallback.state,
    estimatedDays: 4,
    isCodAvailable: true,
    courierPartner: 'Delhivery Surface',
  };
}
