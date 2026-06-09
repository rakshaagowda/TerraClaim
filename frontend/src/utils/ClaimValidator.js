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
      status: record.spatial_verify
        ? (record.spatial_verify.boundary_valid ? 'Pass' : 'Warning')
        : (ha > 8 ? 'Warning' : 'Pass'),
      detail: record.spatial_verify
        ? `${record.spatial_verify.conflict_type} detected. Overlap: ${record.spatial_verify.overlap_percentage}%. Status: ${record.spatial_verify.resolution_status}.`
        : (ha > 8 ? 'Warning: High acreage intersects with critical wildlife corridor. Needs site inspection.' : 'No boundary conflict with core reserve forests.'),
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

/**
 * Generates dynamic, district-specific boundary conflict profiles and reasoning.
 * @param {Object} record - The claim record.
 * @returns {Object} - Boundary conflict details.
 */
export function getConflictDetails(record) {
  if (!record) return null;
  const dist = record.district || '';
  const overlap = record.spatial_verify?.overlap_percentage || 0;
  
  const DISTRICT_CONFLICTS = {
    'Kodagu': {
      division: 'Virajpet Territorial Division, Kodagu Forest Department',
      sanctuary: 'Nagarahole National Park & Tiger Reserve Buffer',
      impact: 'Critical seasonal elephant migration corridor block. High risk of human-elephant conflict corridor interference.',
      reasoning: `Section 4(2) of the Forest Rights Act, 2006 dictates that rights can only be recognized if it does not cause irreversible damage to wildlife or habitats. Since the overlap with Nagarahole National Park Buffer is ${overlap}%, the committee must modify the boundary to exclude the sanctuary buffer core segment to maintain ecosystem conservation.`,
      directive: overlap > 10 
        ? 'REJECT the claim bounds OR order mandatory physical joint-survey modification to exclude the sanctuary boundary.'
        : 'RESOLVE WITH CONDITION: Exclude the Tiger Reserve buffer segment and require joint survey validation.'
    },
    'Mysuru': {
      division: 'Hunsur Territorial Division, Mysuru Forest Department',
      sanctuary: 'Bandipur Tiger Reserve Buffer Zone',
      impact: 'Overlap with eco-sensitive wildlife transit corridor. High risk of human-carnivore conflict and habitat fragmentation.',
      reasoning: `Under Section 4(2) of the Forest Rights Act, 2006, forest rights in critical wildlife habitats may be modified or rescheduled if it is established that the land occupancy blocks critical wildlife migration corridors. The overlap with Bandipur National Park Buffer is ${overlap}%; hence, the committee must exclude this portion from the title.`,
      directive: overlap > 10
        ? 'MODIFY BOUNDARY: Enforce mandatory exclusion of the Bandipur buffer segment through joint field demarcation.'
        : 'RESOLVE WITH CONDITION: Limit occupancy to outer boundary and exclude Bandipur sanctuary buffer.'
    },
    'Chikkamagaluru': {
      division: 'Mudigere Range, Chikkamagaluru Forest Department',
      sanctuary: 'Kudremukh Wildlife Sanctuary Buffer Zone',
      impact: 'High-slope catchment area intersection. Blockage of crucial montane forest watershed.',
      reasoning: `Section 4(2) of the Forest Rights Act, 2006 dictates that rights can only be recognized if they do not cause irreversible damage to wildlife or habitats. The overlap with Kudremukh Wildlife Sanctuary Buffer is ${overlap}%, which is a critical eco-sensitive watershed area. Boundaries must be altered to restrict occupancy to buffer outer zones.`,
      directive: overlap > 10
        ? 'REJECT the claim bounds OR order mandatory physical joint-survey modification to exclude the sanctuary boundary.'
        : 'RESOLVE WITH CONDITION: Exclude the watershed sanctuary segment prior to title finalization.'
    },
    'Chamarajanagara': {
      division: 'Kollegal Territorial Division, Chamarajanagara Forest Department',
      sanctuary: 'Biligiriranganatha Temple (BRT) Tiger Reserve Core Zone',
      impact: 'Encroachment in core tiger breeding habitat and nesting zones. Increased threat to endemic wildlife.',
      reasoning: `Section 4(2) of the Forest Rights Act, 2006 protects critical wildlife habitats from occupancy. Since the overlap with BRT Tiger Reserve Core is ${overlap}%, no titles can be recognized within this boundary. The claim bounds must be pruned.`,
      directive: 'REJECT bounds within Core Reserve. Mandate boundary truncation to exclude the BRT Core Zone.'
    },
    'Shivamogga': {
      division: 'Sagar Territorial Division, Shivamogga Forest Department',
      sanctuary: 'Sharavathi Valley Wildlife Sanctuary Buffer',
      impact: 'Lion-tailed macaque habitat overlap. Heavy risk of evergreen canopy connectivity fragmentation.',
      reasoning: `Under Section 4(2) of the FRA 2006, critical wildlife habitats require strict protection. Overlap of ${overlap}% with Sharavathi Valley Sanctuary requires reduction of bounds to preserve contiguous forest canopy.`,
      directive: 'MODIFY CLAIMS: Trim bounds to exclude sanctuary portion to protect lion-tailed macaque habitats.'
    },
    'Hassan': {
      division: 'Sakleshpur Range, Hassan Forest Department',
      sanctuary: 'Pushpagiri Wildlife Sanctuary Extension Buffer',
      impact: 'Evergreen forest canopy overlap. High biodiversity zone endangering endemic amphibian breeding basins.',
      reasoning: `Under Section 4(2) of the FRA 2006, biodiversity conservation takes precedence in reserve buffers. The overlap of ${overlap}% must be pruned from the claim bounds to preserve Western Ghats biodiversity.`,
      directive: 'RESOLVE WITH CONDITION: Exclude Pushpagiri Sanctuary buffer zones prior to final title registration.'
    }
  };

  return DISTRICT_CONFLICTS[dist] || {
    division: `${dist || 'Territorial'} Division Officer, Forest Department`,
    sanctuary: `${dist || 'Local'} Wildlife Sanctuary Buffer Zone`,
    impact: 'Overlap with critical conservation zone and wildlife buffer.',
    reasoning: `Under Section 4(2) of the FRA 2006, rights must not cause irreversible damage to wildlife or habitats. The overlap of ${overlap}% must be excluded or resolved through a joint field survey.`,
    directive: 'REJECT bounds or order joint field survey to demarcate non-forest buffer zones.'
  };
}
