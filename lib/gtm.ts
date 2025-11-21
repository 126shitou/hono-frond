/**
 * Send custom event to Google Tag Manager
 * @param event - Event object containing event name and optional parameters
 */
export function sendGTMEvent(event: Record<string, any>) {
    if (typeof window !== 'undefined' && window.dataLayer) {
        window.dataLayer.push(event);
    }
}

