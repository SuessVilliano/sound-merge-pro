import { TourDate } from '../types';

export const googleCalendarService = {
  async connectAccount(): Promise<{ email: string, connected: boolean }> {
    throw new Error('Google Calendar OAuth is not connected inside Sound Merge yet.');
  },

  async getTourDates(_calendarId: string): Promise<TourDate[]> {
    return [];
  }
};
