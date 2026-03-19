// Map of English room labels (from DB) to translation keys
const ROOM_LABEL_MAP: Record<string, string> = {
  'Living Room': 'room.livingRoom',
  'Dining Room': 'room.diningRoom',
  'Bedroom': 'room.bedroom',
  'Study / Office': 'room.studyOffice',
  'Study/Office': 'room.studyOffice',
  'Kitchen': 'room.kitchen',
  'Bathroom': 'room.bathroom',
  'Nursery': 'room.nursery',
  'Guest Room': 'room.guestRoom',
  'Entryway': 'room.entryway',
  'Outdoor / Patio': 'room.outdoorPatio',
  'Outdoor/Patio': 'room.outdoorPatio',
  'Master Bedroom': 'room.masterBedroom',
  'Garage': 'room.garage',
  'Laundry': 'room.laundry',
  'Hallway': 'room.hallway',
  'Basement': 'room.basement',
};

// Translate a room label from English (DB) to the current locale
// Falls back to the original English label if no translation found
export function translateRoomLabel(label: string, t: (key: string) => string): string {
  const key = ROOM_LABEL_MAP[label];
  if (key) {
    const translated = t(key);
    // If t() returns the key itself (missing translation), fall back to original
    if (translated !== key) return translated;
  }
  return label;
}
