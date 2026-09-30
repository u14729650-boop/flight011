/**
 * Major cities used for pickup/drop selection, the network map and route
 * estimates. Coordinates are [latitude, longitude].
 *
 * `hub`: 'air'  — airport cargo hub
 *        'road' — road / warehousing hub
 *        'both' — both
 */

export interface City {
  name: string;
  state: string;
  coords: [number, number];
  hub?: 'air' | 'road' | 'both';
  /** Shown on the large network map. */
  featured?: boolean;
}

export const CITIES: City[] = [
  // North
  { name: 'New Delhi', state: 'Delhi', coords: [28.61, 77.21], hub: 'both', featured: true },
  { name: 'Gurugram', state: 'Haryana', coords: [28.46, 77.03], hub: 'road' },
  { name: 'Faridabad', state: 'Haryana', coords: [28.41, 77.32] },
  { name: 'Panipat', state: 'Haryana', coords: [29.39, 76.97] },
  { name: 'Ambala', state: 'Haryana', coords: [30.38, 76.78] },
  { name: 'Chandigarh', state: 'Chandigarh', coords: [30.73, 76.78], hub: 'both', featured: true },
  { name: 'Ludhiana', state: 'Punjab', coords: [30.9, 75.85], hub: 'road', featured: true },
  { name: 'Amritsar', state: 'Punjab', coords: [31.63, 74.87], hub: 'air' },
  { name: 'Jalandhar', state: 'Punjab', coords: [31.33, 75.58] },
  { name: 'Shimla', state: 'Himachal Pradesh', coords: [31.1, 77.17] },
  { name: 'Dharamshala', state: 'Himachal Pradesh', coords: [32.22, 76.32] },
  { name: 'Srinagar', state: 'Jammu and Kashmir', coords: [34.08, 74.8], hub: 'air', featured: true },
  { name: 'Jammu', state: 'Jammu and Kashmir', coords: [32.73, 74.86], hub: 'road' },
  { name: 'Leh', state: 'Ladakh', coords: [34.15, 77.58], hub: 'air' },
  { name: 'Dehradun', state: 'Uttarakhand', coords: [30.32, 78.03] },
  { name: 'Haridwar', state: 'Uttarakhand', coords: [29.95, 78.16] },
  { name: 'Lucknow', state: 'Uttar Pradesh', coords: [26.85, 80.95], hub: 'both', featured: true },
  { name: 'Noida', state: 'Uttar Pradesh', coords: [28.54, 77.39], hub: 'road' },
  { name: 'Kanpur', state: 'Uttar Pradesh', coords: [26.45, 80.33], hub: 'road' },
  { name: 'Agra', state: 'Uttar Pradesh', coords: [27.18, 78.01] },
  { name: 'Varanasi', state: 'Uttar Pradesh', coords: [25.32, 82.97], hub: 'air', featured: true },
  { name: 'Prayagraj', state: 'Uttar Pradesh', coords: [25.44, 81.85] },
  { name: 'Ghaziabad', state: 'Uttar Pradesh', coords: [28.67, 77.45] },
  { name: 'Meerut', state: 'Uttar Pradesh', coords: [28.98, 77.71] },
  { name: 'Jaipur', state: 'Rajasthan', coords: [26.91, 75.79], hub: 'both', featured: true },
  { name: 'Jodhpur', state: 'Rajasthan', coords: [26.24, 73.02], featured: true },
  { name: 'Udaipur', state: 'Rajasthan', coords: [24.58, 73.71] },
  { name: 'Kota', state: 'Rajasthan', coords: [25.18, 75.83] },
  { name: 'Ajmer', state: 'Rajasthan', coords: [26.45, 74.64] },
  { name: 'Bikaner', state: 'Rajasthan', coords: [28.02, 73.31] },

  // West
  { name: 'Ahmedabad', state: 'Gujarat', coords: [23.02, 72.57], hub: 'both', featured: true },
  { name: 'Surat', state: 'Gujarat', coords: [21.17, 72.83], hub: 'road', featured: true },
  { name: 'Vadodara', state: 'Gujarat', coords: [22.31, 73.18], hub: 'road' },
  { name: 'Rajkot', state: 'Gujarat', coords: [22.3, 70.8], hub: 'road', featured: true },
  { name: 'Gandhinagar', state: 'Gujarat', coords: [23.22, 72.65] },
  { name: 'Bhavnagar', state: 'Gujarat', coords: [21.76, 72.15] },
  { name: 'Jamnagar', state: 'Gujarat', coords: [22.47, 70.06] },
  { name: 'Kandla', state: 'Gujarat', coords: [23.03, 70.22] },
  { name: 'Daman', state: 'Dadra and Nagar Haveli and Daman and Diu', coords: [20.4, 72.83] },
  { name: 'Silvassa', state: 'Dadra and Nagar Haveli and Daman and Diu', coords: [20.27, 73.01] },
  { name: 'Diu', state: 'Dadra and Nagar Haveli and Daman and Diu', coords: [20.71, 70.98] },
  { name: 'Mumbai', state: 'Maharashtra', coords: [19.08, 72.88], hub: 'both', featured: true },
  { name: 'Navi Mumbai', state: 'Maharashtra', coords: [19.03, 73.03], hub: 'road' },
  { name: 'Thane', state: 'Maharashtra', coords: [19.22, 72.98] },
  { name: 'Bhiwandi', state: 'Maharashtra', coords: [19.3, 73.06], hub: 'road' },
  { name: 'Pune', state: 'Maharashtra', coords: [18.52, 73.86], hub: 'both', featured: true },
  { name: 'Nagpur', state: 'Maharashtra', coords: [21.15, 79.09], hub: 'both', featured: true },
  { name: 'Nashik', state: 'Maharashtra', coords: [19.99, 73.79] },
  { name: 'Aurangabad', state: 'Maharashtra', coords: [19.88, 75.34] },
  { name: 'Kolhapur', state: 'Maharashtra', coords: [16.7, 74.24] },
  { name: 'Panaji', state: 'Goa', coords: [15.49, 73.83], hub: 'air', featured: true },
  { name: 'Margao', state: 'Goa', coords: [15.28, 73.96] },
  { name: 'Vasco da Gama', state: 'Goa', coords: [15.4, 73.81] },

  // Central
  { name: 'Bhopal', state: 'Madhya Pradesh', coords: [23.26, 77.41], hub: 'road', featured: true },
  { name: 'Indore', state: 'Madhya Pradesh', coords: [22.72, 75.86], hub: 'both', featured: true },
  { name: 'Jabalpur', state: 'Madhya Pradesh', coords: [23.18, 79.99] },
  { name: 'Gwalior', state: 'Madhya Pradesh', coords: [26.22, 78.18] },
  { name: 'Raipur', state: 'Chhattisgarh', coords: [21.25, 81.63], hub: 'road', featured: true },
  { name: 'Bilaspur', state: 'Chhattisgarh', coords: [22.08, 82.15] },
  { name: 'Bhilai', state: 'Chhattisgarh', coords: [21.21, 81.38] },

  // South
  { name: 'Bengaluru', state: 'Karnataka', coords: [12.97, 77.59], hub: 'both', featured: true },
  { name: 'Mysuru', state: 'Karnataka', coords: [12.3, 76.64] },
  { name: 'Mangaluru', state: 'Karnataka', coords: [12.91, 74.86], hub: 'road' },
  { name: 'Hubballi', state: 'Karnataka', coords: [15.36, 75.12], featured: true },
  { name: 'Belagavi', state: 'Karnataka', coords: [15.85, 74.5] },
  { name: 'Hyderabad', state: 'Telangana', coords: [17.39, 78.49], hub: 'both', featured: true },
  { name: 'Warangal', state: 'Telangana', coords: [17.97, 79.59] },
  { name: 'Karimnagar', state: 'Telangana', coords: [18.44, 79.13] },
  { name: 'Visakhapatnam', state: 'Andhra Pradesh', coords: [17.69, 83.22], hub: 'both', featured: true },
  { name: 'Vijayawada', state: 'Andhra Pradesh', coords: [16.51, 80.64], hub: 'road' },
  { name: 'Guntur', state: 'Andhra Pradesh', coords: [16.31, 80.44] },
  { name: 'Tirupati', state: 'Andhra Pradesh', coords: [13.63, 79.42] },
  { name: 'Nellore', state: 'Andhra Pradesh', coords: [14.44, 79.99] },
  { name: 'Chennai', state: 'Tamil Nadu', coords: [13.08, 80.27], hub: 'both', featured: true },
  { name: 'Coimbatore', state: 'Tamil Nadu', coords: [11.02, 76.96], hub: 'both', featured: true },
  { name: 'Madurai', state: 'Tamil Nadu', coords: [9.93, 78.12], hub: 'road', featured: true },
  { name: 'Tiruchirappalli', state: 'Tamil Nadu', coords: [10.79, 78.7] },
  { name: 'Salem', state: 'Tamil Nadu', coords: [11.66, 78.15] },
  { name: 'Tiruppur', state: 'Tamil Nadu', coords: [11.11, 77.34] },
  { name: 'Hosur', state: 'Tamil Nadu', coords: [12.74, 77.83], hub: 'road' },
  { name: 'Kochi', state: 'Kerala', coords: [9.93, 76.27], hub: 'both', featured: true },
  { name: 'Thiruvananthapuram', state: 'Kerala', coords: [8.52, 76.94], hub: 'air', featured: true },
  { name: 'Kozhikode', state: 'Kerala', coords: [11.26, 75.78] },
  { name: 'Thrissur', state: 'Kerala', coords: [10.53, 76.21] },
  { name: 'Puducherry', state: 'Puducherry', coords: [11.94, 79.81] },
  { name: 'Karaikal', state: 'Puducherry', coords: [10.93, 79.84] },
  { name: 'Kavaratti', state: 'Lakshadweep', coords: [10.57, 72.64] },
  { name: 'Agatti', state: 'Lakshadweep', coords: [10.86, 72.19], hub: 'air' },

  // East
  { name: 'Kolkata', state: 'West Bengal', coords: [22.57, 88.36], hub: 'both', featured: true },
  { name: 'Howrah', state: 'West Bengal', coords: [22.59, 88.31] },
  { name: 'Siliguri', state: 'West Bengal', coords: [26.73, 88.4], hub: 'road', featured: true },
  { name: 'Durgapur', state: 'West Bengal', coords: [23.52, 87.31] },
  { name: 'Asansol', state: 'West Bengal', coords: [23.68, 86.98] },
  { name: 'Patna', state: 'Bihar', coords: [25.59, 85.14], hub: 'both', featured: true },
  { name: 'Gaya', state: 'Bihar', coords: [24.79, 85.0] },
  { name: 'Muzaffarpur', state: 'Bihar', coords: [26.12, 85.39] },
  { name: 'Bhagalpur', state: 'Bihar', coords: [25.24, 86.97] },
  { name: 'Ranchi', state: 'Jharkhand', coords: [23.34, 85.31], hub: 'road', featured: true },
  { name: 'Jamshedpur', state: 'Jharkhand', coords: [22.8, 86.2], hub: 'road' },
  { name: 'Dhanbad', state: 'Jharkhand', coords: [23.8, 86.43] },
  { name: 'Bhubaneswar', state: 'Odisha', coords: [20.3, 85.82], hub: 'both', featured: true },
  { name: 'Cuttack', state: 'Odisha', coords: [20.46, 85.88] },
  { name: 'Rourkela', state: 'Odisha', coords: [22.26, 84.85] },
  { name: 'Port Blair', state: 'Andaman and Nicobar Islands', coords: [11.62, 92.73], hub: 'air', featured: true },

  // North East
  { name: 'Guwahati', state: 'Assam', coords: [26.14, 91.74], hub: 'both', featured: true },
  { name: 'Dibrugarh', state: 'Assam', coords: [27.47, 94.91], featured: true },
  { name: 'Silchar', state: 'Assam', coords: [24.83, 92.78] },
  { name: 'Jorhat', state: 'Assam', coords: [26.75, 94.2] },
  { name: 'Shillong', state: 'Meghalaya', coords: [25.58, 91.89] },
  { name: 'Itanagar', state: 'Arunachal Pradesh', coords: [27.08, 93.61] },
  { name: 'Imphal', state: 'Manipur', coords: [24.82, 93.94], hub: 'air', featured: true },
  { name: 'Aizawl', state: 'Mizoram', coords: [23.73, 92.72] },
  { name: 'Kohima', state: 'Nagaland', coords: [25.67, 94.11] },
  { name: 'Dimapur', state: 'Nagaland', coords: [25.91, 93.73], hub: 'road' },
  { name: 'Agartala', state: 'Tripura', coords: [23.83, 91.28], hub: 'air' },
  { name: 'Gangtok', state: 'Sikkim', coords: [27.33, 88.61] },
];

export function citiesInState(state: string): City[] {
  return CITIES.filter((c) => c.state === state);
}

export function findCity(name: string, state?: string): City | undefined {
  const n = name.trim().toLowerCase();
  if (!n) return undefined;
  return CITIES.find((c) => c.name.toLowerCase() === n && (!state || c.state === state));
}

export function cityByName(name: string): City {
  const c = CITIES.find((x) => x.name === name);
  if (!c) throw new Error(`Unknown city ${name}`);
  return c;
}

/** Featured network routes for the home page and PAN India map. */
export const NETWORK_ROUTES: { from: string; to: string; mode: 'air' | 'road' }[] = [
  { from: 'Ahmedabad', to: 'Mumbai', mode: 'road' },
  { from: 'New Delhi', to: 'Ahmedabad', mode: 'road' },
  { from: 'Mumbai', to: 'Bengaluru', mode: 'air' },
  { from: 'New Delhi', to: 'Kolkata', mode: 'air' },
  { from: 'Ahmedabad', to: 'New Delhi', mode: 'air' },
  { from: 'Mumbai', to: 'Chennai', mode: 'air' },
  { from: 'Pune', to: 'Hyderabad', mode: 'road' },
  { from: 'Jaipur', to: 'Lucknow', mode: 'road' },
  { from: 'Surat', to: 'Pune', mode: 'road' },
  { from: 'Bengaluru', to: 'Kochi', mode: 'road' },
  { from: 'Kolkata', to: 'Guwahati', mode: 'air' },
  { from: 'Chennai', to: 'Kolkata', mode: 'air' },
];
