
export interface AutomationTaskCreateParams {
    customer_id: string;
    pipeline_id: string;
    stage_id: string;
    redfin_url: string;
    limit: number;
    campaign_payload: CampaignPayload;
}

interface CampaignPayload {
    name: string;
    days: string[],
    time_window: TimeWindow;
    timezone: string;
    channels: Channels;
}

interface TimeWindow {
    start: string; // Format: "HH:MM" (24-hour)
    end: string;   // Format: "HH:MM" (24-hour)
}

interface Channels {
    sms: SmsChannel;
}

interface SmsChannel {
    enabled: boolean;
    message: string;
    time_interval: number; // In minutes
    from_number: string;
}