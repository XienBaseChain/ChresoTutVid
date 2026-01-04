/**
 * CSV Export Utility
 * 
 * Shared utility for exporting data as CSV files.
 * Handles escaping, formatting, and browser download trigger.
 */

export interface CSVExportOptions {
    /** Headers/column names to include in the CSV */
    headers: string[];
    /** Filename for the downloaded file (without .csv extension) */
    filename: string;
}

/**
 * Escapes a CSV value to handle commas, quotes, and newlines
 */
function escapeCSVValue(value: unknown): string {
    if (value === null || value === undefined) {
        return '';
    }

    const stringValue = String(value);

    // If value contains comma, quote, or newline, wrap in quotes and escape internal quotes
    if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
    }

    return stringValue;
}

/**
 * Converts an array of objects to CSV format and triggers a download
 * 
 * @param data - Array of objects to export
 * @param options - Export options including headers and filename
 */
export function downloadAsCSV<T extends object>(
    data: T[],
    options: CSVExportOptions
): void {
    if (data.length === 0) return;

    const { headers, filename } = options;

    // Build CSV content
    const headerRow = headers.join(',');
    const dataRows = data
        .map((item) =>
            headers
                .map((header) => escapeCSVValue((item as Record<string, unknown>)[header]))
                .join(',')
        )
        .join('\n');

    const csvContent = `data:text/csv;charset=utf-8,${headerRow}\n${dataRows}`;

    // Trigger download
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${filename}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
}
