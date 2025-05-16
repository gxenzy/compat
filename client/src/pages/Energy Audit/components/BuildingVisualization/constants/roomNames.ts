/**
 * Room name mappings per floor for accurate naming
 */
export const ROOM_NAMES: Record<string, Record<string, string>> = {
  'ground': {
    'registrar': 'Registrar Office',
    'guidance': 'Guidance Office',
    'edp': 'EDP Section',
    'accounting': 'Accounting Office'
  },
  'mezzanine': {
    'gsr1': 'GSR 1',
    'gsr2': 'GSR 2',
    'researchhub': 'Research Hub',
    'researchoffice': 'Research/Cares Office',
    'cisco2': 'Cisco Lab 2',
    'cisco3': 'Cisco Lab 3',
    'm1': 'M1',
    'm2': 'M2',
    'm3': 'M3',
    'm4': 'M4',
    'building': 'Building Maintenance'
  },
  'second': {
    '207': 'Room 207',
    '208': 'Room 208',
    '211': 'Room 211',
    '212': 'Room 212',
    'repair': 'Repair Room',
    'hr': 'Human Resource Dept',
    'cisco1': 'Cisco Lab 1'
  },
  'third': {
    '305': 'Room 305',
    '306': 'Room 306',
    '307': 'Room 307',
    '308': 'Room 308',
    '309': 'Room 309',
    '312': 'Room 312',
    'cisco4': 'Cisco Lab 4',
    'nursing_faculty': 'Nursing Faculty Room',
    'nursing_elderly': 'Nursing Elderly',
    'nursing_skills2': 'Nursing Skills Lab 2'
  },
  'fourth': {
    'kitchen1': 'Kitchen 1 Lab',
    'cold_kitchen': 'Cold Kitchen',
    'hm_resto': 'HM Mini Resto',
    'nursing_skills1': 'Nursing Skills Lab 1',
    'amphitheater': 'Amphitheater',
    'anatomy': 'Anatomy Laboratory',
    'cad_office': 'CAD Office',
    'opd': 'OPD ER'
  },
  'fifth': {
    'ee_lab': 'EE Laboratory',
    'biology_lab': 'Biology Laboratory',
    'chemistry511': '511 Chemistry Lab',
    'chemistry509': '509 Chemistry Lab',
    'chemistry_storage': 'Chemistry Storage Room',
    'physics': '507 Physics Lab',
    'stockroom': '507 Stockroom Physics',
    'tool_room': 'Old Tool Room',
    'engineering_faculty': 'Old Engineering Faculty',
    'ece_lab': 'Old ECE Laboratory',
    'coe_lab': 'Old COE Laboratory'
  }
}; 