import type { Comparison } from '../../types';

export const mockComparison: Record<string, Comparison> = {
  'compliance-deadlines': {
    query: 'Statutory comparison across policy criteria',
    documentIds: ['doc-gov-2024-001', 'doc-gov-2024-002'],
    timestamp: '2024-04-15T12:00:00Z',
    synthesizedAnswer: 'Both regulatory instruments introduce binding compliance mandates but address distinct sovereign domains: National Green Hydrogen Mission (SIGHT) centers on domestic renewable technology capacity and capital subsidies, whereas DPDP Rules govern algorithmic tracking restrictions and child privacy. Both enact rigid statutory penalties for non-compliance, but enforce via divergent mechanisms (PBG forfeiture vs. administrative civil fines).',
    similarities: [
      'Both frameworks institute phased transitional deadlines to enable industrial re-tooling.',
      'Both assign enforcement oversight to designated central statutory bodies (SECI and Data Protection Board).',
      'Both mandate verifiable third-party technical and compliance audits.',
    ],
    differences: [
      'SIGHT is an economic incentive and domestic manufacturing mandate, whereas DPDP Rules are prohibitory privacy regulations.',
      'SIGHT penalizes infractions via Performance Bank Guarantee forfeiture (₹15 Lakh/MW), whereas DPDP imposes civil fines up to ₹200 Crore.',
      'Target groups differ fundamentally: industrial electrolyser fabricators and energy producers vs. data fiduciaries and online platforms.',
    ],
    comparisonMatrix: [
      {
        comparisonTopic: 'Objectives',
        criterionId: 'objectives',
        findings: [
          {
            documentId: 'doc-gov-2024-001',
            documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
            findingSummary: 'Establish 5 MMT annual green hydrogen production capacity and build domestic electrolyser manufacturing dominance.',
            citations: [
              {
                id: 'cit-comp-obj-1',
                documentId: 'doc-gov-2024-001',
                documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
                pageNumber: 3,
                sectionHeading: 'Section 1.1: Mission Objectives',
                excerptQuote: 'The overarching objective is to position India as a global hub for the production, usage, and export of Green Hydrogen and its derivatives.',
              },
            ],
          },
          {
            documentId: 'doc-gov-2024-002',
            documentTitle: 'DPDP Rules: Children’s Data & Consent',
            findingSummary: 'Protect minors from targeted behavioral advertising and enforce verifiable parental consent mechanisms.',
            citations: [
              {
                id: 'cit-comp-obj-2',
                documentId: 'doc-gov-2024-002',
                documentTitle: 'DPDP Rules: Children’s Data & Consent',
                pageNumber: 2,
                sectionHeading: 'Rule 3: Statutory Objectives',
                excerptQuote: 'To safeguard personal data of children and ensure demonstrable accountability by digital data fiduciaries.',
              },
            ],
          },
        ],
      },
      {
        comparisonTopic: 'Eligibility',
        criterionId: 'eligibility',
        findings: [
          {
            documentId: 'doc-gov-2024-001',
            documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
            findingSummary: 'Registered Indian companies or joint ventures committing to minimum 100 MW annual electrolyser manufacturing capacity.',
          },
          {
            documentId: 'doc-gov-2024-002',
            documentTitle: 'DPDP Rules: Children’s Data & Consent',
            findingSummary: 'All data fiduciaries processing data of children within India or offering goods/services to Indian citizens.',
          },
        ],
      },
      {
        comparisonTopic: 'Funding',
        criterionId: 'funding',
        findings: [
          {
            documentId: 'doc-gov-2024-001',
            documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
            findingSummary: '₹17,490 Crore total outlay across Component I (₹4,440 Cr electrolysers) and Component II (₹13,050 Cr production).',
            citations: [
              {
                id: 'cit-comp-fund-1',
                documentId: 'doc-gov-2024-001',
                documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
                pageNumber: 8,
                sectionHeading: 'Section 3.1: Financial Outlays',
                excerptQuote: 'Total financial incentive allocation under SIGHT is capped at ₹17,490 Crore.',
              },
            ],
          },
          {
            documentId: 'doc-gov-2024-002',
            documentTitle: 'DPDP Rules: Children’s Data & Consent',
            findingSummary: 'Self-funded compliance; zero government budgetary subsidies allocated to private platforms.',
          },
        ],
      },
      {
        comparisonTopic: 'Implementation',
        criterionId: 'implementation',
        findings: [
          {
            documentId: 'doc-gov-2024-001',
            documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
            findingSummary: 'Implemented via competitive e-bidding tranches administered by SECI with quarterly physical progress verification.',
          },
          {
            documentId: 'doc-gov-2024-002',
            documentTitle: 'DPDP Rules: Children’s Data & Consent',
            findingSummary: 'Technical deployment of certified age-verification tokens and verifiable parental consent gateways.',
          },
        ],
      },
      {
        comparisonTopic: 'Responsible Authority',
        criterionId: 'responsible_authority',
        findings: [
          {
            documentId: 'doc-gov-2024-001',
            documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
            findingSummary: 'Ministry of New & Renewable Energy (MNRE) and Solar Energy Corporation of India (SECI).',
          },
          {
            documentId: 'doc-gov-2024-002',
            documentTitle: 'DPDP Rules: Children’s Data & Consent',
            findingSummary: 'Data Protection Board of India and Ministry of Electronics and Information Technology (MeitY).',
          },
        ],
      },
      {
        comparisonTopic: 'Timelines',
        criterionId: 'timelines',
        findings: [
          {
            documentId: 'doc-gov-2024-001',
            documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
            findingSummary: 'Phase 1 commences June 1, 2024 with 3-year phased local value addition scaling through 2027.',
          },
          {
            documentId: 'doc-gov-2024-002',
            documentTitle: 'DPDP Rules: Children’s Data & Consent',
            findingSummary: 'Notified August 15, 2024 with a 180-day grace transition for educational platforms expiring November 30, 2024.',
          },
        ],
      },
      {
        comparisonTopic: 'Scope',
        criterionId: 'scope',
        findings: [
          {
            documentId: 'doc-gov-2024-001',
            documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
            findingSummary: 'National territorial scope applicable to commercial electrolyser manufacturing facilities and hydrogen plants.',
          },
          {
            documentId: 'doc-gov-2024-002',
            documentTitle: 'DPDP Rules: Children’s Data & Consent',
            findingSummary: 'Applies extraterritorially to any entity processing personal data of Indian minors online.',
          },
        ],
      },
      {
        comparisonTopic: 'Target Groups',
        criterionId: 'target_groups',
        findings: [
          {
            documentId: 'doc-gov-2024-001',
            documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
            findingSummary: 'Electrolyser manufacturers, clean tech engineering conglomerates, and green hydrogen off-takers.',
          },
          {
            documentId: 'doc-gov-2024-002',
            documentTitle: 'DPDP Rules: Children’s Data & Consent',
            findingSummary: 'Children under 18 years of age, legal guardians, social media fiduciaries, and EdTech platforms.',
          },
        ],
      },
    ],
    allCitations: [
      {
        id: 'cit-comp-obj-1',
        documentId: 'doc-gov-2024-001',
        documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
        pageNumber: 3,
        sectionHeading: 'Section 1.1: Mission Objectives',
        excerptQuote: 'The overarching objective is to position India as a global hub for the production, usage, and export of Green Hydrogen and its derivatives.',
      },
      {
        id: 'cit-comp-fund-1',
        documentId: 'doc-gov-2024-001',
        documentTitle: 'National Green Hydrogen Mission: SIGHT Guidelines',
        pageNumber: 8,
        sectionHeading: 'Section 3.1: Financial Outlays',
        excerptQuote: 'Total financial incentive allocation under SIGHT is capped at ₹17,490 Crore.',
      },
      {
        id: 'cit-comp-obj-2',
        documentId: 'doc-gov-2024-002',
        documentTitle: 'DPDP Rules: Children’s Data & Consent',
        pageNumber: 2,
        sectionHeading: 'Rule 3: Statutory Objectives',
        excerptQuote: 'To safeguard personal data of children and ensure demonstrable accountability by digital data fiduciaries.',
      },
    ],
  },
};

