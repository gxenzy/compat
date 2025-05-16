const { query } = require('../../config/database');

/**
 * Seed the standards database with the Philippine Electrical Code (PEC) structure
 */
async function seedStandards() {
  try {
    console.log('Starting standards seeder...');
    
    // Insert PEC 2017 standard
    const standardResult = await query(
      `INSERT INTO standards (code_name, full_name, version, issuing_body, effective_date, description)
      VALUES (?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), description = VALUES(description)`,
      [
        'PEC-2017',
        'Philippine Electrical Code',
        '2017',
        'Department of Energy',
        '2017-01-01',
        'The Philippine Electrical Code (PEC) sets the practical safeguarding of persons and property from hazards arising from the use of electricity. It is comprehensive and covers all aspects of electrical systems in buildings and structures.'
      ]
    );

    const standardId = standardResult.insertId || (await query(
      `SELECT id FROM standards WHERE code_name = ?`,
      ['PEC-2017']
    ))[0].id;

    console.log(`Added/Updated PEC-2017 standard with ID: ${standardId}`);

    // Add main sections structure
    const mainSections = [
      { number: '1000', title: 'General Requirements' },
      { number: '1050', title: 'Installation Requirements' },
      { number: '1075', title: 'Illumination Requirements' },
      { number: '2000', title: 'Wiring and Protection' },
      { number: '3000', title: 'Wiring Methods and Materials' },
      { number: '4000', title: 'Equipment for General Use' },
      { number: '5000', title: 'Special Occupancies' },
      { number: '6000', title: 'Special Equipment' },
      { number: '7000', title: 'Special Conditions' },
      { number: '8000', title: 'Communications Systems' }
    ];

    for (const section of mainSections) {
      await query(
        `INSERT INTO standard_sections (standard_id, section_number, title, content, has_tables, has_figures)
        VALUES (?, ?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content)`,
        [
          standardId,
          section.number,
          section.title,
          `This is the main section for ${section.title}. Refer to sub-sections for detailed requirements.`,
          false,
          false
        ]
      );
      
      console.log(`Added/Updated section ${section.number}: ${section.title}`);
    }

    // Add illumination requirements (Section 1075) with detailed content
    const illuminationSection = await query(
      `SELECT id FROM standard_sections WHERE standard_id = ? AND section_number = ?`,
      [standardId, '1075']
    );

    if (illuminationSection.length > 0) {
      const illuminationId = illuminationSection[0].id;

      // Add illumination table
      await query(
        `INSERT INTO standard_tables (section_id, table_number, title, content, notes)
        VALUES (?, ?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE title = VALUES(title), content = VALUES(content), notes = VALUES(notes)`,
        [
          illuminationId,
          '1075-1',
          'Illumination Requirements for Various Spaces',
          JSON.stringify({
            headers: ['Space Type', 'Required Illumination (lux)', 'Notes'],
            rows: [
              ['Classrooms, Lecture Halls', '500', 'Ensure even illumination across all desk areas'],
              ['Offices, Administrative Areas', '500', 'Prevent glare on computer screens'],
              ['Laboratories', '750', 'Task lighting may be required for detailed work'],
              ['Corridors, Hallways', '100', 'Motion sensors recommended for energy savings'],
              ['Lobbies, Entrances', '300', 'Consider daylight integration where possible'],
              ['Libraries, Study Areas', '500', 'Additional task lighting recommended'],
              ['Gymnasiums, Recreational Areas', '300', 'Ensure even distribution and glare control'],
              ['Auditoriums, Theaters', '200', 'Dimmable lighting recommended'],
              ['Cafeterias, Dining Areas', '300', 'Consider both artificial and natural lighting'],
              ['Restrooms', '200', 'Use efficient, long-lasting fixtures']
            ]
          }),
          'Based on Philippine Electrical Code (PEC) 2017 requirements and international standards for educational facilities.'
        ]
      );

      // Update section to indicate it has tables
      await query(
        `UPDATE standard_sections SET has_tables = true WHERE id = ?`,
        [illuminationId]
      );

      console.log('Added illumination requirements table');

      // Add compliance requirements - check if exists first
      const complianceDescription = 'All educational spaces must meet minimum illumination levels as specified in Table 1075-1.';
      const existingCompliance = await query(
        `SELECT id FROM compliance_requirements 
         WHERE section_id = ? AND SUBSTRING(description, 1, 100) = SUBSTRING(?, 1, 100)`,
        [illuminationId, complianceDescription]
      );

      if (existingCompliance.length === 0) {
        await query(
          `INSERT INTO compliance_requirements (section_id, requirement_type, description, verification_method, severity)
          VALUES (?, ?, ?, ?, ?)`,
          [
            illuminationId,
            'mandatory',
            complianceDescription,
            'Light meter measurement at working plane height (typically 0.8m above floor).',
            'major'
          ]
        );
        console.log('Added compliance requirements for illumination section');
      } else {
        console.log('Compliance requirement already exists, skipping insertion');
      }

      // Add educational resource - check if exists first
      const resourceTitle = 'Understanding Illumination Requirements in Educational Facilities';
      const resourceUrl = 'https://example.com/illumination-guide';
      const existingResource = await query(
        `SELECT id FROM educational_resources 
         WHERE section_id = ? AND url = ?`,
        [illuminationId, resourceUrl]
      );

      if (existingResource.length === 0) {
        await query(
          `INSERT INTO educational_resources (section_id, resource_type, title, description, url, difficulty, duration, tags)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            illuminationId,
            'guide',
            resourceTitle,
            'A comprehensive guide to implementing proper lighting design in educational settings according to PEC 2017 standards.',
            resourceUrl,
            'intermediate',
            '20 minutes',
            'lighting,education,standards,energy efficiency'
          ]
        );
        console.log('Added educational resource for illumination section');
      } else {
        console.log('Educational resource already exists, skipping insertion');
      }
    }

    console.log('Standards seed completed successfully');
  } catch (error) {
    console.error('Error seeding standards:', error);
    throw error;
  }
}

// Run seed function
seedStandards();

module.exports = {
  seedStandards
}; 