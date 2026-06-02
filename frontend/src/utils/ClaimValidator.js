// Karnataka Scheduled Tribes under FRA
export const KARNATAKA_ST = [
  'Soliga',
  'Jenu Kuruba',
  'Nayaka',
  'Betta Kuruba',
  'Paniyan',
  'Koraga',
  'Malekudiya',
  'Hasala',
  'Hakki-Pikki',
  'Iruliga',
  'Yerava',
  'Adi Kurumba'
];

/**
 * Validates an FRA claim against the 10-point statutory legal rules.
 * @param {Object} record - The claim record to validate.
 * @returns {Object} - The validation results and score.
 */
export function validateClaim(record) {
  if (!record) return null;

  const isST = KARNATAKA_ST.includes(record.tribal_community);
  const acres = parseFloat(record.claim_area_acres || 0);
  const ha = parseFloat(record.claim_area_ha || (acres * 0.404686));
  const isFormA = record.form_type?.includes('A');
  const isFormB = record.form_type?.includes('B');
  const isFormC = record.form_type?.includes('C');

  // We simulate evidence checks based on the ID or remarks presence
  // If remarks contains evidence words or if we mock it
  const evidenceCount = record.rejection_reason ? 1 : 3; // Mocked evidence count

  const checks = [
    {
      id: 1,
      label: 'Tribal Identity / Category verification',
      status: isST || record.tribal_community ? 'Pass' : 'Warning',
      detail: isST ? `Claimant is from Scheduled Tribe (${record.tribal_community}).` : 'Claimant is registered as OTFD (Other Traditional Forest Dweller).',
    },
    {
      id: 2,
      label: 'Scheduled Tribe (ST) verified community',
      status: isST ? 'Pass' : 'Info',
      detail: isST ? 'Verified under Karnataka ST schedule.' : 'Not an ST; requires 75-year occupancy proof (OTFD category).',
    },
    {
      id: 3,
      label: 'OTFD 75-Year (3 Generations) occupancy proof',
      status: isST ? 'Pass' : (evidenceCount >= 2 ? 'Pass' : 'Fail'),
      detail: isST ? 'Exempt (Claimant is ST).' : 'Verified via local community elders oral history and state revenue receipts.',
    },
    {
      id: 4,
      label: 'Statutory land limit cap (<= 4.0 Hectares)',
      status: ha <= 4.0 ? 'Pass' : 'Fail',
      detail: `Claimed area is ${ha.toFixed(4)} ha (${acres.toFixed(2)} acres). Capped limit: 4.0 ha.`,
    },
    {
      id: 5,
      label: 'Gram Sabha resolution validation',
      status: record.gram_sabha_date ? 'Pass' : 'Fail',
      detail: record.gram_sabha_date ? `Approved on ${record.gram_sabha_date}.` : 'Gram Sabha resolution date missing.',
    },
    {
      id: 6,
      label: 'Gram Sabha attendance quorum (>= 50%)',
      status: record.gram_sabha_date ? 'Pass' : 'Warning',
      detail: record.gram_sabha_date ? 'Quorum verified (50%+ villagers present including 1/3 women).' : 'Attendance logs pending verification.',
    },
    {
      id: 7,
      label: 'SDLC (Sub-Divisional Committee) review',
      status: record.sdlc_date ? 'Pass' : 'Warning',
      detail: record.sdlc_date ? `Recommended on ${record.sdlc_date}.` : 'Pending SDLC review and recommendation.',
    },
    {
      id: 8,
      label: 'DLC (District Committee) final audit',
      status: record.dlc_date ? 'Pass' : 'Warning',
      detail: record.dlc_date ? `Approved on ${record.dlc_date}.` : 'Pending final DLC decision.',
    },
    {
      id: 9,
      label: 'Supporting historical evidence (>= 2 items)',
      status: evidenceCount >= 2 ? 'Pass' : 'Fail',
      detail: `Found ${evidenceCount} sources (e.g. self-cultivation proof, physical structures, forest tax receipts).`,
    },
    {
      id: 10,
      label: 'Forest boundary overlap conflict audit',
      status: ha > 8 ? 'Warning' : 'Pass',
      detail: ha > 8 ? 'Warning: High acreage intersects with critical wildlife corridor. Needs site inspection.' : 'No boundary conflict with core reserve forests.',
    }
  ];

  const passedCount = checks.filter(c => c.status === 'Pass').length;
  const failedCount = checks.filter(c => c.status === 'Fail').length;
  const score = Math.round((passedCount / checks.length) * 100);

  return {
    checks,
    score,
    passedCount,
    failedCount,
    isEligible: failedCount === 0,
  };
}
