/**
 * Local Knowledge Retrieval (RAG) Engine
 * Provides fast, lightweight, dependency-free in-memory retrieval
 * for curriculum topics, documentation, and technical concepts.
 */

// Curated high-yield knowledge corpus
const KNOWLEDGE_BASE = [
  {
    id: 'chem-atomic-structure',
    title: 'Atomic Structure & Quantum Mechanics',
    keywords: [
      'atomic',
      'structure',
      'bohr',
      'atom',
      'electron',
      'proton',
      'neutron',
      'quantum',
      'heisenberg',
      'uncertainty',
      'de broglie',
      'photoelectric',
      'planck',
      'rydberg',
      'orbital',
      'spectrum',
      'hydrogen',
    ],
    content: `
# Atomic Structure Knowledge Base

## Fundamental Formulas & Relationships
1. Electromagnetic Radiation & Planck's Equation:
   - Energy of a photon: $E = h\\nu = \\frac{hc}{\\lambda}$
   - Wave number: $\\bar{\\nu} = \\frac{1}{\\lambda} = \\frac{\\nu}{c}$
   - Planck's constant: $h \\approx 6.626 \\times 10^{-34} \\text{ J}\\cdot\\text{s}$
   - Speed of light: $c \\approx 3.0 \\times 10^8 \\text{ m/s}$

2. Photoelectric Effect (Einstein's Equation):
   - $h\\nu = h\\nu_0 + K.E_{\\text{max}}$
   - $K.E_{\\text{max}} = \\frac{1}{2}m_e v_{\\text{max}}^2 = eV_0$ (where $V_0$ is stopping potential, $h\\nu_0$ is work function $\\Phi$).

3. Bohr's Model for Hydrogen-like Species ($Z$ = atomic number, $n$ = principal quantum number):
   - Quantized angular momentum: $mvr = \\frac{nh}{2\\pi}$
   - Radius of $n$-th orbit: $r_n = 0.529 \\times \\frac{n^2}{Z} \\text{ \\AA} = 52.9 \\times \\frac{n^2}{Z} \\text{ pm}$
   - Velocity in $n$-th orbit: $v_n = 2.18 \\times 10^6 \\times \\frac{Z}{n} \\text{ m/s}$
   - Energy of electron in $n$-th orbit: $E_n = -13.6 \\times \\frac{Z^2}{n^2} \\text{ eV/atom} = -2.18 \\times 10^{-18} \\times \\frac{Z^2}{n^2} \\text{ J/atom}$
   - Kinetic Energy: $K = -E_n$; Potential Energy: $U = 2E_n$

4. Hydrogen Emission Spectrum (Rydberg Formula):
   - $\\frac{1}{\\lambda} = R_H Z^2 \\left( \\frac{1}{n_1^2} - \\frac{1}{n_2^2} \\right)$
   - Rydberg constant: $R_H \\approx 1.09677 \\times 10^7 \\text{ m}^{-1}$
   - Spectral series:
     - Lyman ($n_1=1, n_2=2,3...$) - Ultraviolet region
     - Balmer ($n_1=2, n_2=3,4...$) - Visible region
     - Paschen ($n_1=3, n_2=4,5...$) - Infrared region
     - Brackett ($n_1=4, n_2=5,6...$) - Infrared region
     - Pfund ($n_1=5, n_2=6,7...$) - Far Infrared region

5. Wave-Particle Duality (de Broglie):
   - de Broglie wavelength: $\\lambda = \\frac{h}{p} = \\frac{h}{mv} = \\frac{h}{\\sqrt{2m(K.E)}} = \\frac{h}{\\sqrt{2mqV}}$

6. Heisenberg's Uncertainty Principle:
   - Position and momentum: $\\Delta x \\cdot \\Delta p \\ge \\frac{h}{4\\pi} = \\frac{\\hbar}{2}$
   - Energy and time: $\\Delta E \\cdot \\Delta t \\ge \\frac{h}{4\\pi}$

7. Quantum Numbers:
   - Principal ($n$): Size and main energy level ($n = 1, 2, 3...$)
   - Azimuthal / Orbital Angular ($l$): Shape of orbital ($l = 0 \\text{ to } n-1$). Orbital angular momentum: $L = \\sqrt{l(l+1)}\\frac{h}{2\\pi}$
   - Magnetic ($m_l$): Spatial orientation ($-l \\le m_l \\le +l$, total $2l+1$ orientations)
   - Spin ($m_s$): Electron spin angular momentum ($m_s = +\\frac{1}{2}, -\\frac{1}{2}$). Spin angular momentum: $S = \\sqrt{s(s+1)}\\frac{h}{2\\pi}$
`,
  },
  {
    id: 'bio-photosynthesis',
    title: 'Photosynthesis & Cellular Energetics',
    keywords: [
      'photosynthesis',
      'chloroplast',
      'chlorophyll',
      'light reaction',
      'dark reaction',
      'calvin cycle',
      'rubisco',
      'atp',
      'nadph',
      'thylakoid',
      'stroma',
      'photophosphorylation',
    ],
    content: `
# Photosynthesis Knowledge Base

## Overview & Chemical Equation
- Overall reaction: $6\\text{CO}_2 + 6\\text{H}_2\\text{O} \\xrightarrow{\\text{Light, Chlorophyll}} \\text{C}_6\\text{H}_{12}\\text{O}_6 + 6\\text{O}_2$
- Takes place in chloroplasts of plant leaves and photosynthetic autotrophs.

## Stages of Photosynthesis
1. Light-Dependent Reactions (Thylakoid Membrane):
   - Pigments in Photosystems II (P680) and I (P700) absorb photons.
   - Photolysis of water: $2\\text{H}_2\\text{O} \\to 4\\text{H}^+ + 4e^- + \\text{O}_2$ occurs at PS II complex.
   - Electron transport chain pumps protons into the thylakoid lumen, generating a proton-motive force.
   - ATP synthase synthesizes ATP via chemiosmosis; NADP+ reductase generates NADPH.

2. Light-Independent Reactions / Calvin Cycle (Stroma):
   - Carbon Fixation: RuBP (Ribulose-1,5-bisphosphate, 5C) + CO2 $\\xrightarrow{\\text{RuBisCO}}$ 2 molecules of 3-PGA (3-Phosphoglycerate, 3C).
   - Reduction: 3-PGA phosphorylated by ATP and reduced by NADPH to form G3P (Glyceraldehyde-3-phosphate).
   - Regeneration of RuBP: Multi-step enzymatic process consuming ATP.
   - For 1 molecule of glucose ($\text{C}_6\text{H}_{12}\text{O}_6$): 6 $\text{CO}_2$, 18 ATP, and 12 NADPH are consumed.
`,
  },
  {
    id: 'phys-thermodynamics',
    title: 'Thermodynamics & Heat Transfer',
    keywords: [
      'thermodynamics',
      'enthalpy',
      'entropy',
      'gibbs',
      'first law',
      'second law',
      'carnot',
      'heat',
      'work',
      'isothermal',
      'adiabatic',
      'isobaric',
      'isochoric',
    ],
    content: `
# Thermodynamics Knowledge Base

## Laws of Thermodynamics
1. Zeroth Law: Thermal equilibrium is transitive ($A = B \\land B = C \\implies A = C$).
2. First Law (Conservation of Energy):
   - $\\Delta U = Q - W$ (or $\\Delta U = q + w$ in chemistry IUPAC where $w = -P_{\\text{ext}}\\Delta V$)
   - For ideal gas: $\\Delta U = n C_v \\Delta T$, $\\Delta H = n C_p \\Delta T$, $C_p - C_v = R$.
3. Second Law (Entropy):
   - $\\Delta S = \\int \\frac{dQ_{\\text{rev}}}{T}$. For isolated universe: $\\Delta S_{\\text{total}} \\ge 0$.
4. Third Law: As $T \\to 0\\text{ K}$, entropy of a perfect pure crystal approaches zero.

## Key Formulas
- Work done in reversible isothermal process: $W = -nRT \\ln\\left(\\frac{V_2}{V_1}\\right) = -2.303 nRT \\log\\left(\\frac{P_1}{P_2}\\right)$
- Reversible adiabatic process: $PV^\\gamma = \\text{constant}$, $TV^{\\gamma-1} = \\text{constant}$
- Gibbs Free Energy: $\\Delta G = \\Delta H - T\\Delta S$
  - $\\Delta G < 0$: Spontaneous process
  - $\\Delta G = 0$: Dynamic equilibrium, $\\Delta G^\\circ = -RT \\ln K_{\\text{eq}}$
- Carnot Engine Efficiency: $\\eta = 1 - \\frac{T_C}{T_H} = \\frac{W}{Q_H}$
`,
  },
  {
    id: 'cs-dbms-normalization',
    title: 'Database Management Systems & Normalization',
    keywords: [
      'dbms',
      'normalization',
      'normal form',
      '1nf',
      '2nf',
      '3nf',
      'bcnf',
      'functional dependency',
      'foreign key',
      'primary key',
      'anomaly',
    ],
    content: `
# DBMS Normalization Knowledge Base

## Core Purpose of Normalization
Eliminate data redundancy, prevent insertion/deletion/update anomalies, and enforce relational data integrity.

## Normal Forms Hierarchy
1. 1NF (First Normal Form):
   - Each column contains atomic (indivisible) values.
   - No repeating groups or arrays as column values.
   - Unique column names and primary key defined.

2. 2NF (Second Normal Form):
   - Must be in 1NF.
   - No partial dependency: Every non-prime attribute must be fully functionally dependent on the entire primary key (relevant when candidate key is composite).

3. 3NF (Third Normal Form):
   - Must be in 2NF.
   - No transitive dependency: For every non-trivial functional dependency $X \\to Y$, either $X$ is a super key or $Y$ is a prime attribute.

4. BCNF (Boyce-Codd Normal Form):
   - Stricter version of 3NF.
   - For every non-trivial functional dependency $X \\to Y$, $X$ must be a super key.
`,
  },
];

/**
 * Tokenizes text into lowercase normalized words
 */
function tokenize(text) {
  return (text || '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length > 1);
}

/**
 * Retrieves relevant knowledge chunks for a given query.
 * @param {string} query - The user query or topic
 * @param {number} [threshold=0.15] - Minimum relevance score
 * @returns {{ results: Array, isSufficient: boolean, contextText: string }}
 */
export function retrieveKnowledge(query, threshold = 0.15) {
  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return { results: [], isSufficient: false, contextText: '' };
  }

  const scoredEntries = [];

  for (const entry of KNOWLEDGE_BASE) {
    let score = 0;
    let matchedKeywords = 0;
    const entryKeywords = entry.keywords.map((k) => k.toLowerCase());
    const titleTokens = tokenize(entry.title);
    const contentTokens = tokenize(entry.content);

    for (const token of queryTokens) {
      let tokenMatched = false;
      // Keyword match (high weight)
      if (entryKeywords.some((k) => k.includes(token) || token.includes(k))) {
        score += 3.0;
        tokenMatched = true;
      }
      // Title match (medium weight)
      if (titleTokens.includes(token)) {
        score += 2.0;
        tokenMatched = true;
      }
      // Content frequency match (low weight)
      const countInContent = contentTokens.filter((ct) => ct === token).length;
      if (countInContent > 0) {
        score += Math.min(countInContent * 0.1, 1.5);
      }
      if (tokenMatched) {
        matchedKeywords++;
      }
    }

    const normalizedScore = score / (queryTokens.length * 3);

    if (normalizedScore >= threshold) {
      scoredEntries.push({
        id: entry.id,
        title: entry.title,
        content: entry.content.trim(),
        score: normalizedScore,
        matchedKeywords,
      });
    }
  }

  // Sort by highest score first
  scoredEntries.sort((a, b) => b.score - a.score);

  const topResults = scoredEntries.slice(0, 2);
  const isSufficient =
    topResults.length > 0 &&
    (topResults[0].score >= 0.45 ||
      (topResults[0].score >= 0.25 && topResults[0].matchedKeywords >= 2));

  let contextText = '';
  if (topResults.length > 0) {
    contextText = topResults
      .map(
        (r, idx) =>
          `[Knowledge Base Document ${idx + 1}: ${r.title} (Relevance: ${(r.score * 100).toFixed(0)}%)]\n${r.content}`
      )
      .join('\n\n');
  }

  return {
    results: topResults,
    isSufficient,
    contextText,
  };
}
