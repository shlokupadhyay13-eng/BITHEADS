import type { ResearchBrief } from '../../types';

export const mockResearchBrief: Record<string, ResearchBrief> = {
  'brief-001': {
    id: 'brief-001',
    documentId: 'doc-gov-2024-001',
    title: 'Executive Legislative Memorandum: SIGHT Guidelines Evaluation',
    subject: 'Operational Guidelines for Strategic Interventions for Green Hydrogen Transition',
    topic: 'Green Hydrogen Domestic Value Addition & Fiscal Incentives',
    ministry: 'Ministry of New and Renewable Energy',
    gazetteDate: '2024-03-15',
    authorDivision: 'Policy Intelligence & Legislative Assessment Division',
    generatedAt: '2024-04-15T12:00:00Z',
    executiveSummary: 'This memorandum provides an executive regulatory evaluation of the ₹17,490 Crore financial outlay under the National Green Hydrogen Mission. Key statutory considerations include phased local value addition (LVA) mandates scaling to 60%, strict quarterly milestone audits conducted by SECI, and unharmonized state-level open access wheeling fee exemptions.',
    background: 'Notified pursuant to Cabinet Decision No. 44/2023, the Strategic Interventions for Green Hydrogen Transition (SIGHT) programme establishes India’s foundational legal and incentive framework for commercial-scale electrolyser manufacturing and clean hydrogen production.',
    keyFindings: [
      {
        id: 'kf-1',
        title: 'Tiered Local Value Addition (LVA)',
        summary: 'Domestic electrolyser manufacturers must verify 40% LVA in Year 1, increasing to 60% by Year 3, under risk of incentive pro-rata withholding.',
        mandateLevel: 'mandatory',
        effectiveDate: '2024-06-01',
        enforcingAgency: 'Solar Energy Corporation of India (SECI)',
      },
      {
        id: 'kf-2',
        title: 'Production Subsidy Scale-Down',
        summary: 'Green hydrogen producers receive tapering disbursals capped at ₹50/kg Year 1 down to ₹30/kg Year 3.',
        mandateLevel: 'mandatory',
        effectiveDate: '2024-07-01',
      },
    ],
    policyAnalysis: 'Statutory coherence is strong between Central capital allocation and SECI implementing rules. However, regulatory asymmetry persists across state utility frameworks regarding open access transmission charges.',
    evidence: [
      {
        id: 'ev-brief-1',
        documentId: 'doc-gov-2024-001',
        documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
        pageNumber: 14,
        sectionHeading: 'Section 4.2: Local Value Addition Schedules',
        excerptQuote: 'The bidder must commit to minimum local value addition (LVA) of 40% in Year 1, scaling annually to 60% in Year 3.',
        confidenceScore: 0.98,
      },
      {
        id: 'ev-brief-2',
        documentId: 'doc-gov-2024-001',
        documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
        pageNumber: 16,
        sectionHeading: 'Section 4.5: Bank Guarantees & Default Penalties',
        excerptQuote: 'Successful bidders must furnish an irrevocable Performance Bank Guarantee (PBG) equivalent to ₹15 Lakhs per MW.',
        confidenceScore: 0.95,
      },
    ],
    implications: [
      'Domestic electrolyser stack fabricators must re-engineer supply chains within 60 days to meet Year 1 audits.',
      'State distribution companies face revenue uncertainty unless Central tariff compensation directives are issued.',
      'Project financing interest rate spreads may widen if state wheeling exemptions remain ambiguous.',
    ],
    limitations: [
      'This analysis is based on Draft SIGHT Scheme Guidelines notified prior to formal state regulatory harmonization.',
      'Interstate open-access surcharges vary by jurisdiction and are subject to active litigation before the CERC.',
    ],
    sources: [
      {
        id: 'src-brief-1',
        documentId: 'doc-gov-2024-001',
        title: 'National Green Hydrogen Mission: SIGHT Guidelines',
        ministry: 'Ministry of New and Renewable Energy',
        pageNumber: 14,
        section: 'Section 4.2',
        publicationDate: '2024-03-15',
      },
      {
        id: 'src-brief-2',
        documentId: 'doc-gov-2024-001',
        title: 'National Green Hydrogen Mission: SIGHT Guidelines',
        ministry: 'Ministry of New and Renewable Energy',
        pageNumber: 16,
        section: 'Section 4.5',
        publicationDate: '2024-03-15',
      },
    ],
    regulatoryRisks: [
      {
        id: 'rr-1',
        category: 'enforcement_gap',
        severity: 'high',
        description: 'State Electricity Regulatory Commissions (SERCs) have not consistently implemented interstate transmission waivers for green power feeding electrolysers.',
        suggestedRemediation: 'Issue formal statutory guidance under Section 107 of the Electricity Act 2003.',
      },
    ],
  },
  'brief-partial': {
    id: 'brief-partial',
    documentId: 'doc-gov-2024-002',
    title: 'Preliminary Research Brief: Digital Personal Data Protection Rules',
    subject: 'Implementation Timelines for Consent Architecture',
    topic: 'Data Fiduciary Compliance Milestones',
    ministry: 'Ministry of Electronics and Information Technology',
    gazetteDate: '2024-04-01',
    authorDivision: 'Data Governance Research Desk',
    generatedAt: '2024-04-18T09:30:00Z',
    executiveSummary: 'Preliminary overview of compliance transition windows for significant data fiduciaries.',
    keyFindings: [
      {
        id: 'kf-p-1',
        title: 'Consent Manager Registration',
        summary: 'Consent managers must achieve technical interoperability certification within 90 days.',
      },
    ],
    // Note: background, policyAnalysis, evidence, implications, limitations, sources deliberately omitted to test graceful rendering
  },
};

