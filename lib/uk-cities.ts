/**
 * Shared constant for UK cities dropdown selector
 * Used by Dashboard and Job Finder pages
 */
export const UK_CITIES = [
  'UK (Anywhere)',
  'Remote (UK)',
  'London',
  'Birmingham',
  'Manchester',
  'Glasgow',
  'Liverpool',
  'Leeds',
  'Edinburgh',
  'Bristol',
  'Cardiff',
  'Sheffield',
  'Newcastle upon Tyne',
  'Nottingham',
  'Leicester',
  'Coventry',
  'Belfast',
  'Southampton',
  'Portsmouth',
  'Brighton',
  'Reading',
  'Northampton',
  'Aberdeen',
  'Norwich',
  'Luton',
  'Swindon',
  'Milton Keynes',
  'Bolton',
  'Bournemouth',
  'Peterborough',
  'Cambridge',
  'Oxford',
  'York',
  'Ipswich',
  'Exeter',
  'Plymouth',
  'Derby',
  'Stoke-on-Trent',
  'Wolverhampton',
  'Swansea',
] as const

/**
 * Get the API location value from the selected city
 * @param city Selected city from dropdown
 * @returns Location value to pass to API
 */
export function getLocationValue(city: string): string {
  if (city === 'UK (Anywhere)') {
    return 'UK'
  }
  return city
}

