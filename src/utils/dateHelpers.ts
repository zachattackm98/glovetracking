import { format, parseISO } from 'date-fns';

/**
 * Utility function to format date strings consistently across the application
 * @param dateString - The date string to format (ISO format expected)
 * @returns Formatted date string in 'MMM d, yyyy' format or original string if parsing fails
 */
export const formatDate = (dateString: string): string => {
  try {
    return format(parseISO(dateString), 'MMM d, yyyy');
  } catch {
    return dateString;
  }
};