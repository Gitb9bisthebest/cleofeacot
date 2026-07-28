// Section 03 ("What I do") — single source of truth for the service beats.
// Rendered in src/main.js into #servicesPanels as the scroll-driven cinema
// cards. Order matches the media images in index.html (data-service-image):
// beat 1 → services-lead.jpg, 2 → services-email.jpg, 3 → services-appointments.jpg,
// 4 → services-crm.jpg. `side` alternates the card's screen position.
export const services = [
  {
    num: '01',
    side: 'left',
    tag: 'B2B Prospecting',
    title: 'Lead Generation',
    text: 'Laser-targeted prospect lists built with Apollo, Clay and LinkedIn Sales Navigator, then verified, enriched, and matched to your exact ICP across the US, UK, Australia and Canada.',
  },
  {
    num: '02',
    side: 'right',
    tag: 'Outbound that lands',
    title: 'Cold Email Campaigns',
    text: 'Personalized sequences in Instantly and Smartlead, with inbox warm-up, list hygiene via Verimail, and reply-focused copy tuned for consistent 95%+ deliverability.',
  },
  {
    num: '03',
    side: 'left',
    tag: 'Calendar, filled',
    title: 'Appointment Setting',
    text: 'From first touch to confirmed booking: qualification, follow-ups, reminders, and rescheduling handled so 20-40 qualified sales appointments land every month.',
  },
  {
    num: '04',
    side: 'right',
    tag: 'HubSpot / GoHighLevel / Salesforce',
    title: 'CRM Management',
    text: '15,000+ contacts kept clean, segmented, and pipeline-ready in HubSpot, GoHighLevel, Salesforce and Zoho, so every deal has a next step and nothing slips through.',
  },
];
