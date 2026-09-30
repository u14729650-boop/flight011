/**
 * All Indian States and Union Territories.
 *
 * `ref` is the logistics reference point used for state-to-state distance
 * estimates (the main commercial hub / capital), in [latitude, longitude].
 */

export type Region = 'North' | 'South' | 'East' | 'West' | 'Central' | 'North East' | 'Islands';

export interface IndiaState {
  name: string;
  type: 'State' | 'Union Territory';
  code: string;
  region: Region;
  ref: [number, number];
  refCity: string;
}

export const INDIAN_STATES: IndiaState[] = [
  { name: 'Andhra Pradesh', type: 'State', code: 'AP', region: 'South', ref: [16.51, 80.64], refCity: 'Vijayawada' },
  { name: 'Arunachal Pradesh', type: 'State', code: 'AR', region: 'North East', ref: [27.08, 93.61], refCity: 'Itanagar' },
  { name: 'Assam', type: 'State', code: 'AS', region: 'North East', ref: [26.14, 91.74], refCity: 'Guwahati' },
  { name: 'Bihar', type: 'State', code: 'BR', region: 'East', ref: [25.59, 85.14], refCity: 'Patna' },
  { name: 'Chhattisgarh', type: 'State', code: 'CG', region: 'Central', ref: [21.25, 81.63], refCity: 'Raipur' },
  { name: 'Goa', type: 'State', code: 'GA', region: 'West', ref: [15.49, 73.83], refCity: 'Panaji' },
  { name: 'Gujarat', type: 'State', code: 'GJ', region: 'West', ref: [23.02, 72.57], refCity: 'Ahmedabad' },
  { name: 'Haryana', type: 'State', code: 'HR', region: 'North', ref: [28.46, 77.03], refCity: 'Gurugram' },
  { name: 'Himachal Pradesh', type: 'State', code: 'HP', region: 'North', ref: [31.1, 77.17], refCity: 'Shimla' },
  { name: 'Jharkhand', type: 'State', code: 'JH', region: 'East', ref: [23.34, 85.31], refCity: 'Ranchi' },
  { name: 'Karnataka', type: 'State', code: 'KA', region: 'South', ref: [12.97, 77.59], refCity: 'Bengaluru' },
  { name: 'Kerala', type: 'State', code: 'KL', region: 'South', ref: [9.93, 76.27], refCity: 'Kochi' },
  { name: 'Madhya Pradesh', type: 'State', code: 'MP', region: 'Central', ref: [23.26, 77.41], refCity: 'Bhopal' },
  { name: 'Maharashtra', type: 'State', code: 'MH', region: 'West', ref: [19.08, 72.88], refCity: 'Mumbai' },
  { name: 'Manipur', type: 'State', code: 'MN', region: 'North East', ref: [24.82, 93.94], refCity: 'Imphal' },
  { name: 'Meghalaya', type: 'State', code: 'ML', region: 'North East', ref: [25.58, 91.89], refCity: 'Shillong' },
  { name: 'Mizoram', type: 'State', code: 'MZ', region: 'North East', ref: [23.73, 92.72], refCity: 'Aizawl' },
  { name: 'Nagaland', type: 'State', code: 'NL', region: 'North East', ref: [25.91, 93.73], refCity: 'Dimapur' },
  { name: 'Odisha', type: 'State', code: 'OD', region: 'East', ref: [20.3, 85.82], refCity: 'Bhubaneswar' },
  { name: 'Punjab', type: 'State', code: 'PB', region: 'North', ref: [30.9, 75.85], refCity: 'Ludhiana' },
  { name: 'Rajasthan', type: 'State', code: 'RJ', region: 'North', ref: [26.91, 75.79], refCity: 'Jaipur' },
  { name: 'Sikkim', type: 'State', code: 'SK', region: 'North East', ref: [27.33, 88.61], refCity: 'Gangtok' },
  { name: 'Tamil Nadu', type: 'State', code: 'TN', region: 'South', ref: [13.08, 80.27], refCity: 'Chennai' },
  { name: 'Telangana', type: 'State', code: 'TS', region: 'South', ref: [17.39, 78.49], refCity: 'Hyderabad' },
  { name: 'Tripura', type: 'State', code: 'TR', region: 'North East', ref: [23.83, 91.28], refCity: 'Agartala' },
  { name: 'Uttar Pradesh', type: 'State', code: 'UP', region: 'North', ref: [26.85, 80.95], refCity: 'Lucknow' },
  { name: 'Uttarakhand', type: 'State', code: 'UK', region: 'North', ref: [30.32, 78.03], refCity: 'Dehradun' },
  { name: 'West Bengal', type: 'State', code: 'WB', region: 'East', ref: [22.57, 88.36], refCity: 'Kolkata' },
  { name: 'Andaman and Nicobar Islands', type: 'Union Territory', code: 'AN', region: 'Islands', ref: [11.62, 92.73], refCity: 'Port Blair' },
  { name: 'Chandigarh', type: 'Union Territory', code: 'CH', region: 'North', ref: [30.73, 76.78], refCity: 'Chandigarh' },
  { name: 'Dadra and Nagar Haveli and Daman and Diu', type: 'Union Territory', code: 'DH', region: 'West', ref: [20.4, 72.83], refCity: 'Daman' },
  { name: 'Delhi', type: 'Union Territory', code: 'DL', region: 'North', ref: [28.61, 77.21], refCity: 'New Delhi' },
  { name: 'Jammu and Kashmir', type: 'Union Territory', code: 'JK', region: 'North', ref: [34.08, 74.8], refCity: 'Srinagar' },
  { name: 'Ladakh', type: 'Union Territory', code: 'LA', region: 'North', ref: [34.15, 77.58], refCity: 'Leh' },
  { name: 'Lakshadweep', type: 'Union Territory', code: 'LD', region: 'Islands', ref: [10.57, 72.64], refCity: 'Kavaratti' },
  { name: 'Puducherry', type: 'Union Territory', code: 'PY', region: 'South', ref: [11.94, 79.81], refCity: 'Puducherry' },
];

export const STATE_NAMES = INDIAN_STATES.map((s) => s.name);
export const STATES_ONLY = INDIAN_STATES.filter((s) => s.type === 'State');
export const UNION_TERRITORIES = INDIAN_STATES.filter((s) => s.type === 'Union Territory');

export function getState(name: string): IndiaState | undefined {
  return INDIAN_STATES.find((s) => s.name === name);
}

/**
 * Maps the leading digits of an Indian PIN code to its state / UT.
 * Longer prefixes win (e.g. 403 → Goa inside Maharashtra's 40–44 range).
 */
const PIN_PREFIXES: Record<string, string> = {
  '11': 'Delhi',
  '12': 'Haryana', '13': 'Haryana',
  '14': 'Punjab', '15': 'Punjab', '16': 'Punjab', '160': 'Chandigarh',
  '17': 'Himachal Pradesh',
  '18': 'Jammu and Kashmir', '19': 'Jammu and Kashmir', '194': 'Ladakh',
  '20': 'Uttar Pradesh', '21': 'Uttar Pradesh', '22': 'Uttar Pradesh', '23': 'Uttar Pradesh',
  '24': 'Uttar Pradesh', '25': 'Uttar Pradesh', '26': 'Uttar Pradesh', '27': 'Uttar Pradesh', '28': 'Uttar Pradesh',
  '244': 'Uttarakhand', '246': 'Uttarakhand', '247': 'Uttarakhand', '248': 'Uttarakhand', '249': 'Uttarakhand',
  '262': 'Uttarakhand', '263': 'Uttarakhand',
  '30': 'Rajasthan', '31': 'Rajasthan', '32': 'Rajasthan', '33': 'Rajasthan', '34': 'Rajasthan',
  '36': 'Gujarat', '37': 'Gujarat', '38': 'Gujarat', '39': 'Gujarat',
  '362520': 'Dadra and Nagar Haveli and Daman and Diu', '396': 'Dadra and Nagar Haveli and Daman and Diu',
  '40': 'Maharashtra', '41': 'Maharashtra', '42': 'Maharashtra', '43': 'Maharashtra', '44': 'Maharashtra',
  '403': 'Goa',
  '45': 'Madhya Pradesh', '46': 'Madhya Pradesh', '47': 'Madhya Pradesh', '48': 'Madhya Pradesh',
  '49': 'Chhattisgarh',
  '50': 'Telangana',
  '51': 'Andhra Pradesh', '52': 'Andhra Pradesh', '53': 'Andhra Pradesh',
  '56': 'Karnataka', '57': 'Karnataka', '58': 'Karnataka', '59': 'Karnataka',
  '60': 'Tamil Nadu', '61': 'Tamil Nadu', '62': 'Tamil Nadu', '63': 'Tamil Nadu', '64': 'Tamil Nadu',
  '605': 'Puducherry', '533464': 'Puducherry', '673310': 'Puducherry', '609602': 'Puducherry',
  '67': 'Kerala', '68': 'Kerala', '69': 'Kerala',
  '6825': 'Lakshadweep',
  '70': 'West Bengal', '71': 'West Bengal', '72': 'West Bengal', '73': 'West Bengal', '74': 'West Bengal',
  '737': 'Sikkim', '744': 'Andaman and Nicobar Islands',
  '75': 'Odisha', '76': 'Odisha', '77': 'Odisha',
  '78': 'Assam',
  '790': 'Arunachal Pradesh', '791': 'Arunachal Pradesh', '792': 'Arunachal Pradesh',
  '793': 'Meghalaya', '794': 'Meghalaya', '795': 'Manipur', '796': 'Mizoram',
  '797': 'Nagaland', '798': 'Nagaland', '799': 'Tripura',
  '80': 'Bihar', '81': 'Bihar', '82': 'Bihar', '84': 'Bihar', '85': 'Bihar',
  '814': 'Jharkhand', '815': 'Jharkhand', '816': 'Jharkhand', '822': 'Jharkhand', '825': 'Jharkhand',
  '826': 'Jharkhand', '827': 'Jharkhand', '828': 'Jharkhand', '829': 'Jharkhand', '83': 'Jharkhand',
};

export const PINCODE_PATTERN = /^[1-9][0-9]{5}$/;

export function stateFromPincode(pin: string): string | undefined {
  const p = pin.trim();
  if (!PINCODE_PATTERN.test(p)) return undefined;
  for (let len = 6; len >= 2; len--) {
    const hit = PIN_PREFIXES[p.slice(0, len)];
    if (hit) return hit;
  }
  return undefined;
}
