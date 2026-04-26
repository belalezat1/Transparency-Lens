/**
 * Event Enrichment – adds metadata, AI insights, and risk scoring to raw tracking events
 * 
 * Purpose:
 *   - Takes raw event from Raspberry Pi (hostname, ip, timestamp)
 *   - Enriches with geolocation, company info, category, risk score, and narrative
 *   - Returns enriched event ready for broadcasting
 * 
 * TODO: Replace stub enrichment with real data:
 *   - Call GeoIP database or API to get location from IP
 *   - Call domain reputation API for company/category info
 *   - Call Gemini/Claude for narrative generation
 *   - Implement risk scoring algorithm
 */

/**
 * Enrich a raw event from the Raspberry Pi
 * @param {Object} rawEvent – { hostname, ip, timestamp }
 * @returns {Object} enriched event with company, category, geo, narrative, risk
 */
export async function enrichEvent(rawEvent) {
  const { hostname, ip, timestamp } = rawEvent

  // Placeholder enrichment – stub with dummy data for now
  // In production: call GeoIP, domain reputation APIs, and AI models
  const enriched = {
    hostname,
    ip,
    timestamp,
    company: 'Example Corp', // TODO: fetch from domain whois/reputation API
    category: 'Advertising', // TODO: classify using domain database or ML model
    geo: {
      city: 'Dublin',
      country: 'Ireland',
      lat: 53.3498,
      lng: -6.2603,
    },
    // TODO: generate narrative using Gemini/Claude
    narrative: `The domain ${hostname} is categorized as Advertising and is tracking your visit from ${ip}.`,
    risk: 7, // TODO: compute risk score (0-10) based on trackers, IP reputation, etc.
    enrichedAt: new Date().toISOString(),
  }

  console.log('[enrich] Event enriched:', enriched)
  return enriched
}
