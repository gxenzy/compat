import { snakeToCamel, camelToSnake, normalizeDataFormat } from '../dataFormatters';

describe('Data Formatters Utilities', () => {
  describe('snakeToCamel', () => {
    test('should convert snake_case keys to camelCase', () => {
      const input = {
        first_name: 'John',
        last_name: 'Doe',
        user_id: 123,
        nested_object: {
          created_at: '2023-01-01',
          updated_at: '2023-01-02'
        },
        items_list: [
          { item_id: 1, item_name: 'First' },
          { item_id: 2, item_name: 'Second' }
        ]
      };

      const expected = {
        firstName: 'John',
        lastName: 'Doe',
        userId: 123,
        nestedObject: {
          createdAt: '2023-01-01',
          updatedAt: '2023-01-02'
        },
        itemsList: [
          { itemId: 1, itemName: 'First' },
          { itemId: 2, itemName: 'Second' }
        ]
      };

      expect(snakeToCamel(input)).toEqual(expected);
    });

    test('should handle arrays at the top level', () => {
      const input = [
        { first_name: 'John', last_name: 'Doe' },
        { first_name: 'Jane', last_name: 'Smith' }
      ];

      const expected = [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' }
      ];

      expect(snakeToCamel(input)).toEqual(expected);
    });

    test('should handle null and undefined values', () => {
      expect(snakeToCamel(null)).toBeNull();
      expect(snakeToCamel(undefined)).toBeUndefined();
    });
  });

  describe('camelToSnake', () => {
    test('should convert camelCase keys to snake_case', () => {
      const input = {
        firstName: 'John',
        lastName: 'Doe',
        userId: 123,
        nestedObject: {
          createdAt: '2023-01-01',
          updatedAt: '2023-01-02'
        },
        itemsList: [
          { itemId: 1, itemName: 'First' },
          { itemId: 2, itemName: 'Second' }
        ]
      };

      const expected = {
        first_name: 'John',
        last_name: 'Doe',
        user_id: 123,
        nested_object: {
          created_at: '2023-01-01',
          updated_at: '2023-01-02'
        },
        items_list: [
          { item_id: 1, item_name: 'First' },
          { item_id: 2, item_name: 'Second' }
        ]
      };

      expect(camelToSnake(input)).toEqual(expected);
    });

    test('should handle arrays at the top level', () => {
      const input = [
        { firstName: 'John', lastName: 'Doe' },
        { firstName: 'Jane', lastName: 'Smith' }
      ];

      const expected = [
        { first_name: 'John', last_name: 'Doe' },
        { first_name: 'Jane', last_name: 'Smith' }
      ];

      expect(camelToSnake(input)).toEqual(expected);
    });

    test('should handle null and undefined values', () => {
      expect(camelToSnake(null)).toBeNull();
      expect(camelToSnake(undefined)).toBeUndefined();
    });
  });

  describe('normalizeDataFormat', () => {
    test('should normalize building standard data with snake_case keys', () => {
      const input = {
        id: 1,
        building_type: 'Commercial',
        standard_type: 'Electrical',
        standard_code: 'E-101',
        minimum_value: 100,
        maximum_value: 200,
        unit: 'Watts',
        description: 'Test description'
      };

      const expected = {
        id: 1,
        buildingType: 'Commercial',
        standardType: 'Electrical',
        standardCode: 'E-101',
        minimumValue: 100,
        maximumValue: 200,
        unit: 'Watts',
        description: 'Test description'
      };

      expect(normalizeDataFormat(input)).toEqual(expected);
    });

    test('should normalize building standard data with camelCase keys', () => {
      const input = {
        id: 1,
        buildingType: 'Commercial',
        standardType: 'Electrical',
        standardCode: 'E-101',
        minimumValue: 100,
        maximumValue: 200,
        unit: 'Watts',
        description: 'Test description'
      };

      expect(normalizeDataFormat(input)).toEqual(input);
    });

    test('should normalize project standard data with snake_case keys', () => {
      const input = {
        id: 1,
        project_type: 'Residential',
        standard_type: 'Electrical',
        standard_code: 'E-101',
        minimum_value: 100,
        maximum_value: 200,
        unit: 'Watts',
        description: 'Test description'
      };

      const expected = {
        id: 1,
        projectType: 'Residential',
        standardType: 'Electrical',
        standardCode: 'E-101',
        minimumValue: 100,
        maximumValue: 200,
        unit: 'Watts',
        description: 'Test description'
      };

      expect(normalizeDataFormat(input)).toEqual(expected);
    });

    test('should normalize recommendation data with snake_case keys', () => {
      const input = {
        id: 1,
        rule_id: 123,
        non_compliance_type: 'Voltage',
        recommendation_text: 'Reduce voltage',
        priority: 'high',
        calculator_type: 'Electrical'
      };

      const expected = {
        id: 1,
        ruleId: 123,
        nonComplianceType: 'Voltage',
        recommendationText: 'Reduce voltage',
        priority: 'high',
        calculatorType: 'Electrical'
      };

      expect(normalizeDataFormat(input)).toEqual(expected);
    });

    test('should handle arrays of mixed format data', () => {
      const input = [
        { id: 1, building_type: 'Commercial', standard_type: 'Electrical' },
        { id: 2, buildingType: 'Residential', standardType: 'Plumbing' }
      ];

      const expected = [
        { id: 1, buildingType: 'Commercial', standardType: 'Electrical' },
        { id: 2, buildingType: 'Residential', standardType: 'Plumbing' }
      ];

      expect(normalizeDataFormat(input)).toEqual(expected);
    });
  });
}); 