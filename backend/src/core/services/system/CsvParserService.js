/**
 * CsvParserService - Utility to parse CSV content.
 */
class CsvParserService {
    constructor() { }

    /**
     * Parses a CSV buffer/string into an array of objects.
     * @param {Buffer|string} buffer - The file content
     * @returns {Promise<Array<object>>}
     */
    async parse(buffer) {
        const content = buffer.toString('utf8');
        const lines = content.split(/\r?\n/).filter(line => line.trim() !== '');

        if (lines.length < 1) return [];

        // Detect delimiter (Comma or Semicolon)
        const headerLine = lines[0];
        const delimiter = headerLine.includes(';') ? ';' : ',';

        const headers = headerLine.split(delimiter).map(h => h.trim().replace(/^"|"$/g, '').toLowerCase());

        const results = [];

        for (let i = 1; i < lines.length; i++) {
            const currentLine = lines[i];
            const values = currentLine.split(delimiter).map(val => val.trim().replace(/^"|"$/g, ''));

            if (values.length < headers.length) continue;

            const obj = {};
            // Basic mapping
            // Should support 'phone', 'name'
            // Others go to 'custom_fields' if needed, or mapped directly if they match schema.
            // For now, simple mapping:
            let customFields = {};

            headers.forEach((header, index) => {
                const value = values[index];
                if (header === 'phone' || header === 'telefone' || header === 'celular') {
                    obj.phone = value;
                } else if (header === 'name' || header === 'nome') {
                    obj.name = value;
                } else {
                    customFields[header] = value;
                }
            });

            if (obj.phone) {
                obj.custom_fields = customFields;
                results.push(obj);
            }
        }

        return results;
    }
}

module.exports = CsvParserService;
