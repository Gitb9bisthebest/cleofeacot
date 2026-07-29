// Section 03 ("What I do") — single source of truth for the service beats.
// Rendered in src/main.js into #servicesPanels as the scroll-driven cinema
// cards. Order matches the media images in index.html (data-service-image):
// beat 1 → email-marketing.jpg, 2 → leadgen.jpg, 3 → services-appointments.jpg,
// 4 → services-crm.jpg. `side` alternates the card's screen position.
export const services = [
  {
    num: '01',
    side: 'left',
    tag: 'Nurture that converts',
    title: 'Email Marketing',
    text: 'Your emails actually land and your list stays warm — segmented campaigns and automated flows in Instantly, Smartlead and your ESP, with inbox warm-up and Verimail list hygiene tuned for 95%+ deliverability, so the leads you already have never go cold.',
  },
  {
    num: '02',
    side: 'right',
    tag: 'B2B Prospecting',
    title: 'Lead Generation',
    text: 'You get a steady list of the exact decision-makers who need what you sell — built with Apollo, Clay and LinkedIn Sales Navigator, then verified, enriched, and matched to your ICP across the US, UK, Australia and Canada.',
  },
  {
    num: '03',
    side: 'left',
    tag: 'Calendar, filled',
    title: 'Appointment Setting',
    text: 'You show up to a calendar that\'s already full — 20-40 qualified sales appointments a month, with qualification, follow-ups, reminders, and rescheduling all handled for you.',
  },
  {
    num: '04',
    side: 'right',
    tag: 'HubSpot / GoHighLevel / Salesforce',
    title: 'CRM Management',
    text: 'Every deal has a next step and nothing slips — 15,000+ contacts kept clean, segmented, and pipeline-ready in HubSpot, GoHighLevel, Salesforce and Zoho, so your team always knows who to call next.',
  },
];
