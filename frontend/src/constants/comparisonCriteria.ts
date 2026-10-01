export interface ComparisonCriterion {
  id: string;
  label: string;
  description: string;
}

export const COMPARISON_CRITERIA: ComparisonCriterion[] = [
  { id: 'objectives', label: 'Objectives', description: 'Core statutory aims, goals, and intended policy outcomes' },
  { id: 'eligibility', label: 'Eligibility', description: 'Beneficiary qualifications, prerequisites, and exclusionary rules' },
  { id: 'funding', label: 'Funding', description: 'Budgetary allocation, fiscal outlays, subsidy caps, and financial provisions' },
  { id: 'implementation', label: 'Implementation', description: 'Execution frameworks, operating procedures, and phase guidelines' },
  { id: 'responsible_authority', label: 'Responsible Authority', description: 'Enforcing ministries, nodal regulators, and administrative bodies' },
  { id: 'timelines', label: 'Timelines', description: 'Effective enforcement dates, sunset clauses, and transitional grace periods' },
  { id: 'scope', label: 'Scope', description: 'Jurisdictional boundaries, territorial applicability, and sector domains' },
  { id: 'target_groups', label: 'Target Groups', description: 'Designated beneficiary cohorts, industry classes, and impacted populations' },
];
